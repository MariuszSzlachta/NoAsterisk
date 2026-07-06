import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { ImportsModule } from '@imports/imports.module';
import { DomainExceptionFilter } from '@shared/presentation/domain-exception.filter';

describe('ImportsController', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ImportsModule],
    }).compile();

    app = module.createNestApplication();
    app.use((req: { user: unknown }, _res: unknown, next: () => void) => {
      req.user = {
        userId: 'test-user',
        workspaceId: 'ws-test',
        role: 'Member',
      };
      next();
    });
    app.useGlobalFilters(new DomainExceptionFilter());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  const validRow = {
    amount: 100,
    currency: 'PLN',
    type: 'expense',
    description: 'BIEDRONKA zakupy',
    date: '2026-06-15',
    categoryIds: [],
    contentHash: 'a'.repeat(64),
  };

  const validPayload = {
    batchId: '550e8400-e29b-41d4-a716-446655440000',
    accountId: '550e8400-e29b-41d4-a716-446655440001',
    batchHash: 'b'.repeat(64),
    rows: [validRow],
  };

  describe('POST /imports', () => {
    it('returns 201 accepted for valid clean data', async () => {
      const response = await request(app.getHttpServer())
        .post('/imports')
        .send(validPayload);

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('accepted');
      expect(response.body.saved).toBe(1);
    });

    it('returns 400 when Zod validation fails (missing batchId)', async () => {
      const response = await request(app.getHttpServer())
        .post('/imports')
        .send({ rows: [validRow] });

      expect(response.status).toBe(400);
    });

    it('returns 400 when contentHash is not valid SHA-256', async () => {
      const response = await request(app.getHttpServer())
        .post('/imports')
        .send({
          ...validPayload,
          rows: [{ ...validRow, contentHash: 'not-a-hash' }],
        });

      expect(response.status).toBe(400);
    });

    it('returns 400 when rows exceed max (200)', async () => {
      const response = await request(app.getHttpServer())
        .post('/imports')
        .send({
          ...validPayload,
          rows: Array.from({ length: 201 }, (_, i) => ({
            ...validRow,
            contentHash: i.toString(16).padStart(64, '0'),
          })),
        });

      expect(response.status).toBe(400);
    });

    it('returns 207 partial when PII detected in description', async () => {
      const response = await request(app.getHttpServer())
        .post('/imports')
        .send({
          ...validPayload,
          batchHash: 'c'.repeat(64),
          rows: [
            {
              ...validRow,
              contentHash: 'd'.repeat(64),
              description: 'Przelew na PL61109010140000071219812874',
            },
          ],
        });

      expect(response.status).toBe(207);
      expect(response.body.status).toBe('partial');
      expect(response.body.rejected).toHaveLength(1);
      expect(response.body.rejected[0].reason).toBe('potential_iban');
    });

    it('returns 409 conflict for duplicate batch hash', async () => {
      const hash1 = 'e'.repeat(64);
      await request(app.getHttpServer())
        .post('/imports')
        .send({
          ...validPayload,
          batchId: '550e8400-e29b-41d4-a716-446655440001',
          batchHash: hash1,
          rows: [{ ...validRow, contentHash: 'f'.repeat(64) }],
        });

      const response = await request(app.getHttpServer())
        .post('/imports')
        .send({
          ...validPayload,
          batchId: '550e8400-e29b-41d4-a716-446655440002',
          batchHash: hash1,
          rows: [{ ...validRow, contentHash: '1'.repeat(64) }],
        });

      expect(response.status).toBe(409);
      expect(response.body.status).toBe('rejected');
    });
  });

  describe('GET /imports', () => {
    it('returns paginated batches', async () => {
      const response = await request(app.getHttpServer()).get('/imports');

      expect(response.status).toBe(200);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.meta).toHaveProperty('page');
      expect(response.body.meta).toHaveProperty('total');
    });

    it('respects page and limit query params', async () => {
      const response = await request(app.getHttpServer()).get(
        '/imports?page=1&limit=1',
      );

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeLessThanOrEqual(1);
      expect(response.body.meta.limit).toBe(1);
    });

    it('returns 400 for invalid page param', async () => {
      const response = await request(app.getHttpServer()).get(
        '/imports?page=0',
      );

      expect(response.status).toBe(400);
    });
  });

  describe('GET /imports/:id', () => {
    it('returns batch by id', async () => {
      const response = await request(app.getHttpServer()).get(
        `/imports/${validPayload.batchId}`,
      );

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(validPayload.batchId);
      expect(response.body.status).toBeDefined();
    });

    it('returns 400 for non-uuid id', async () => {
      const response = await request(app.getHttpServer()).get(
        '/imports/not-a-uuid',
      );

      expect(response.status).toBe(400);
    });

    it('returns 404 for non-existent batch', async () => {
      const response = await request(app.getHttpServer()).get(
        '/imports/a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      );

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /imports/:id', () => {
    it('deletes batch and returns 204', async () => {
      // Create a batch to delete
      const batchId = '550e8400-e29b-41d4-a716-446655440099';
      await request(app.getHttpServer())
        .post('/imports')
        .send({
          ...validPayload,
          batchId,
          batchHash: '9'.repeat(64),
          rows: [{ ...validRow, contentHash: '8'.repeat(64) }],
        });

      const response = await request(app.getHttpServer()).delete(
        `/imports/${batchId}`,
      );

      expect(response.status).toBe(204);

      // Verify it's gone
      const getResponse = await request(app.getHttpServer()).get(
        `/imports/${batchId}`,
      );
      expect(getResponse.status).toBe(404);
    });

    it('returns 404 for non-existent batch', async () => {
      const response = await request(app.getHttpServer()).delete(
        '/imports/a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      );

      expect(response.status).toBe(404);
    });

    it('returns 400 for non-uuid id', async () => {
      const response = await request(app.getHttpServer()).delete(
        '/imports/not-a-uuid',
      );

      expect(response.status).toBe(400);
    });
  });
});
