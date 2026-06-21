import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { CategorizationRulesModule } from '@categorization-rules/categorization-rules.module';
import { CATEGORY_REPOSITORY } from '@categories/application/ports/category.repository';
import { Category } from '@categories/domain/category.entity';

describe('CategorizationRulesController', () => {
  let app: INestApplication<App>;
  const testCategoryId = '550e8400-e29b-41d4-a716-446655440000';

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [CategorizationRulesModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    // Seed a category so rules can reference it
    const categoryRepo = app.get(CATEGORY_REPOSITORY);
    await categoryRepo.save(new Category(testCategoryId, 'Groceries', new Date()));
  });

  afterAll(async () => {
    await app.close();
  });

  const validPayload = {
    keyword: 'BIEDRONKA',
    categoryId: '550e8400-e29b-41d4-a716-446655440000',
    matcherType: 'Contains',
  };

  const createRule = async (): Promise<string> => {
    const res = await request(app.getHttpServer())
      .post('/categorization-rules')
      .send(validPayload);
    return res.body.id;
  };

  describe('POST /categorization-rules', () => {
    it('returns 201 with created rule', async () => {
      const response = await request(app.getHttpServer())
        .post('/categorization-rules')
        .send(validPayload);

      expect(response.status).toBe(201);
      expect(response.body.keyword).toBe('BIEDRONKA');
      expect(response.body.matcherType).toBe('Contains');
      expect(response.body.id).toBeDefined();
    });

    it('returns 400 for missing keyword', async () => {
      const response = await request(app.getHttpServer())
        .post('/categorization-rules')
        .send({ categoryId: validPayload.categoryId, matcherType: 'Exact' });

      expect(response.status).toBe(400);
    });

    it('returns 400 for invalid matcherType', async () => {
      const response = await request(app.getHttpServer())
        .post('/categorization-rules')
        .send({ ...validPayload, matcherType: 'Regex' });

      expect(response.status).toBe(400);
    });

    it('returns 400 for non-existent categoryId', async () => {
      const response = await request(app.getHttpServer())
        .post('/categorization-rules')
        .send({ ...validPayload, categoryId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /categorization-rules', () => {
    it('returns paginated rules', async () => {
      const response = await request(app.getHttpServer())
        .get('/categorization-rules');

      expect(response.status).toBe(200);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.meta).toHaveProperty('page');
      expect(response.body.meta).toHaveProperty('total');
    });

    it('respects page and limit params', async () => {
      const response = await request(app.getHttpServer())
        .get('/categorization-rules?page=1&limit=1');

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeLessThanOrEqual(1);
      expect(response.body.meta.limit).toBe(1);
    });
  });

  describe('PUT /categorization-rules/:id', () => {
    it('updates rule', async () => {
      const id = await createRule();
      const response = await request(app.getHttpServer())
        .put(`/categorization-rules/${id}`)
        .send({ keyword: 'LIDL' });

      expect(response.status).toBe(200);
      expect(response.body.keyword).toBe('LIDL');
    });

    it('returns 404 for non-existent rule', async () => {
      const response = await request(app.getHttpServer())
        .put('/categorization-rules/a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11')
        .send({ keyword: 'X' });

      expect(response.status).toBe(404);
    });

    it('returns 400 for empty body', async () => {
      const id = await createRule();
      const response = await request(app.getHttpServer())
        .put(`/categorization-rules/${id}`)
        .send({});

      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /categorization-rules/:id', () => {
    it('deletes rule and returns 204', async () => {
      const id = await createRule();
      const response = await request(app.getHttpServer())
        .delete(`/categorization-rules/${id}`);

      expect(response.status).toBe(204);
    });

    it('returns 404 for non-existent rule', async () => {
      const response = await request(app.getHttpServer())
        .delete('/categorization-rules/a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');

      expect(response.status).toBe(404);
    });
  });
});
