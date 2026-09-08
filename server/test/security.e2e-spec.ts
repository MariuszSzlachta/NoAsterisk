import { beforeAll, afterAll, describe, expect, it } from '@jest/globals';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';
import { THROTTLE_AUTH } from '../src/shared/presentation/throttle.constants';

process.env.NODE_ENV = 'production';
process.env.JWT_SECRET = 'security-test-secret';
process.env.JWT_REFRESH_SECRET = 'security-test-refresh-secret';
process.env.REGISTRATION_MODE = 'open';

describe('Security controls', () => {
  let app: INestApplication<App>;
  let accessToken: string;
  let refreshCookie: string;

  beforeAll(async () => {
    const { createApp } = await import('../src/app-bootstrap');
    app = await createApp();

    const response = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email: 'security@example.com', password: 'Secure1!pass' });

    accessToken = response.body.accessToken;
    const cookieHeader = response.headers['set-cookie'];
    const firstCookie = Array.isArray(cookieHeader)
      ? cookieHeader[0]
      : cookieHeader;
    if (!firstCookie) {
      throw new Error('Expected refresh cookie');
    }
    const cookieValue = firstCookie.split(';')[0];
    if (!cookieValue) {
      throw new Error('Expected refresh cookie value');
    }
    refreshCookie = cookieValue;
  });

  afterAll(async () => {
    await app.close();
  });

  it('emits baseline OWASP security headers', async () => {
    const response = await request(app.getHttpServer()).get(
      '/api/dictionaries',
    );

    expect(response.status).toBe(200);
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-frame-options']).toBe('SAMEORIGIN');
    expect(response.headers['referrer-policy']).toBe('no-referrer');
    expect(response.headers['content-security-policy']).toContain(
      "default-src 'self'",
    );
  });

  it('allows only the configured CORS origin with credentials', async () => {
    const allowed = await request(app.getHttpServer())
      .options('/api/auth/login')
      .set('Origin', 'http://localhost:5173')
      .set('Access-Control-Request-Method', 'POST')
      .set('Access-Control-Request-Headers', 'content-type');

    expect(allowed.status).toBe(204);
    expect(allowed.headers['access-control-allow-origin']).toBe(
      'http://localhost:5173',
    );
    expect(allowed.headers['access-control-allow-credentials']).toBe('true');

    const denied = await request(app.getHttpServer())
      .options('/api/auth/login')
      .set('Origin', 'https://attacker.example')
      .set('Access-Control-Request-Method', 'POST');

    expect(denied.headers['access-control-allow-origin']).not.toBe(
      'https://attacker.example',
    );
  });

  it('rejects unauthenticated API access and enforces roles', async () => {
    await request(app.getHttpServer()).get('/api/transactions').expect(401);

    await request(app.getHttpServer())
      .get('/api/admin/invite-codes')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(403);
  });

  it('rejects content-type confusion and mass-assignment payloads', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/login')
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send('email=security%40example.com&password=Secure1%21pass')
      .expect(415);

    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: 'security@example.com',
        password: 'Secure1!pass',
        role: 'Superuser',
      })
      .expect(400);
  });

  it('keeps refresh tokens out of JSON and protects them with cookie flags', async () => {
    const login = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'security@example.com', password: 'Secure1!pass' });

    expect(login.body).not.toHaveProperty('refreshToken');
    expect(login.headers['set-cookie']).toEqual(
      expect.arrayContaining([
        expect.stringMatching(
          /^budget_refresh_token=.+; Path=\/api\/auth\/refresh; HttpOnly; Secure; SameSite=Strict$/,
        ),
      ]),
    );

    const refresh = await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .set('Cookie', refreshCookie)
      .send({});

    expect(refresh.status).toBe(200);
    expect(refresh.body).not.toHaveProperty('refreshToken');
    expect(refresh.body.accessToken).toEqual(expect.any(String));

    const rotatedCookieHeader = refresh.headers['set-cookie'];
    const rotatedCookie = Array.isArray(rotatedCookieHeader)
      ? rotatedCookieHeader[0]
      : rotatedCookieHeader;
    if (!rotatedCookie) {
      throw new Error('Expected rotated refresh cookie');
    }

    await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .set('Cookie', refreshCookie)
      .send({})
      .expect(401);

    const secondRefresh = await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .set('Cookie', rotatedCookie.split(';')[0])
      .send({})
      .expect(200);

    await request(app.getHttpServer())
      .post('/api/users/me/logout')
      .set('Authorization', `Bearer ${String(secondRefresh.body.accessToken)}`)
      .expect(200);

    await request(app.getHttpServer())
      .get('/api/transactions')
      .set('Authorization', `Bearer ${String(secondRefresh.body.accessToken)}`)
      .expect(401);

    await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .send({ refreshToken: refreshCookie })
      .expect(400);
  });

  it('enforces the authentication rate limit', async () => {
    const responses = await Promise.all(
      Array.from({ length: THROTTLE_AUTH.default.limit + 1 }, (_, index) =>
        request(app.getHttpServer())
          .post('/api/auth/login')
          .send({
            email: `rate-limit-${index.toString()}@example.com`,
            password: 'wrong-password',
          }),
      ),
    );

    expect(responses.some((response) => response.status === 429)).toBe(true);
  });

  it('enforces the JSON body size limit', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: 'security@example.com',
        password: 'x'.repeat(10_500_000),
      })
      .expect(413);
  });
});
