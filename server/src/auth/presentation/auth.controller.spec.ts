import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AuthModule } from '@auth/auth.module';
import { REGISTRATION_MODE } from '@auth/application/commands/register.handler';
import { DomainExceptionFilter } from '@shared/presentation/domain-exception.filter';
import { REGISTRATION_CONSENT } from '@auth/application/consent/registration-consent';

describe('AuthController', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AuthModule],
    })
      .overrideProvider(REGISTRATION_MODE)
      .useValue('open')
      .compile();

    app = module.createNestApplication();
    app.useGlobalFilters(new DomainExceptionFilter());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /auth/register', () => {
    it('returns access token and sets refresh token as an httpOnly cookie', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'new@example.com',
          password: 'Secure1!pass',
          ...REGISTRATION_CONSENT,
        });

      expect(res.status).toBe(201);
      expect(res.body.accessToken).toBeDefined();
      expect(res.body).not.toHaveProperty('refreshToken');
      expect(res.headers['set-cookie']).toEqual(
        expect.arrayContaining([
          expect.stringMatching(
            /^budget_refresh_token=.+; Path=\/api\/auth\/refresh; HttpOnly; SameSite=Strict$/,
          ),
        ]),
      );
      expect(res.body.user.email).toBe('new@example.com');
      expect(res.body.user.role).toBe('Member');
      expect(res.body.user.workspaceId).toBeDefined();
    });

    it('returns 400 for duplicate email', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'dup@example.com',
          password: 'Secure1!pass',
          ...REGISTRATION_CONSENT,
        });

      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'dup@example.com',
          password: 'Secure1!pass',
          ...REGISTRATION_CONSENT,
        });

      expect(res.status).toBe(400);
    });

    it('returns 400 for invalid email', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'not-email',
          password: 'securepass',
          ...REGISTRATION_CONSENT,
        });

      expect(res.status).toBe(400);
    });

    it('returns 400 for short password', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'valid@example.com',
          password: 'short',
          ...REGISTRATION_CONSENT,
        });

      expect(res.status).toBe(400);
    });

    it('returns 400 for extra fields (strict)', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'x@example.com',
          password: 'Secure1!pass',
          ...REGISTRATION_CONSENT,
          admin: true,
        });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /auth/login', () => {
    beforeAll(async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'login@example.com',
          password: 'MyPass1!word',
          ...REGISTRATION_CONSENT,
        });
    });

    it('returns 200 with access token for valid credentials', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'login@example.com', password: 'MyPass1!word' });

      expect(res.status).toBe(200);
      expect(res.body.accessToken).toBeDefined();
      expect(res.body.user.email).toBe('login@example.com');
    });

    it('returns 400 for wrong password', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'login@example.com', password: 'wrongpass' });

      expect(res.status).toBe(400);
    });

    it('returns 400 for unknown email', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'unknown@example.com', password: 'whatever1' });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /auth/refresh', () => {
    let refreshCookie: string;

    beforeAll(async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'refresh@example.com',
          password: 'Secure1!pass',
          ...REGISTRATION_CONSENT,
        });
      const cookieHeader = res.headers['set-cookie'];
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

    it('returns access token and rotates the httpOnly refresh cookie', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Cookie', refreshCookie)
        .send({});

      expect(res.status).toBe(200);
      expect(res.body.accessToken).toBeDefined();
      expect(res.body).not.toHaveProperty('refreshToken');
      expect(res.headers['set-cookie']).toEqual(
        expect.arrayContaining([
          expect.stringMatching(
            /^budget_refresh_token=.+; Path=\/api\/auth\/refresh; HttpOnly; SameSite=Strict$/,
          ),
        ]),
      );
    });

    it('returns 401 without the refresh cookie', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({});

      expect(res.status).toBe(401);
    });

    it('rejects refresh tokens supplied in the request body', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: 'invalid-token' });

      expect(res.status).toBe(400);
    });
  });
});
