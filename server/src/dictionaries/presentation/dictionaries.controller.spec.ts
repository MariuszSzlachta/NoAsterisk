import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { DictionariesModule } from '@dictionaries/dictionaries.module';
import { DomainExceptionFilter } from '@shared/presentation/domain-exception.filter';
import { DICTIONARY_REPOSITORY } from '@dictionaries/domain/ports/dictionary.repository';
import { InMemoryDictionaryRepository } from '@dictionaries/infrastructure/in-memory-dictionary.repository';
import { DictionariesController } from '@dictionaries/presentation/dictionaries.controller';
import { DictionaryEntry } from '@dictionaries/domain/dictionary-entry.entity';
import { DictionaryType } from '@dictionaries/domain/dictionary-type.enum';

describe('DictionariesController', () => {
  let app: INestApplication<App>;
  let repo: InMemoryDictionaryRepository;
  let controller: DictionariesController;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [DictionariesModule],
    })
      .overrideProvider(DICTIONARY_REPOSITORY)
      .useClass(InMemoryDictionaryRepository)
      .compile();

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

    repo = module.get<InMemoryDictionaryRepository>(DICTIONARY_REPOSITORY);
    controller = module.get<DictionariesController>(DictionariesController);
  });

  beforeEach(() => {
    repo.clear();
    controller['invalidateCache']();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /dictionaries', () => {
    it('returns 200 with grouped dictionaries', async () => {
      await repo.save(
        new DictionaryEntry('e1', DictionaryType.FirstName, 'jan', new Date()),
      );
      await repo.save(
        new DictionaryEntry(
          'e2',
          DictionaryType.Merchant,
          'BIEDRONKA',
          new Date(),
        ),
      );

      const res = await request(app.getHttpServer()).get('/dictionaries');

      expect(res.status).toBe(200);
      expect(res.body.firstNames).toContain('jan');
      expect(res.body.merchants).toContain('BIEDRONKA');
      expect(res.body.surnames).toEqual([]);
    });

    it('returns Cache-Control and ETag headers', async () => {
      const res = await request(app.getHttpServer()).get('/dictionaries');

      expect(res.status).toBe(200);
      expect(res.headers['cache-control']).toBe('public, max-age=86400');
      expect(res.headers['etag']).toMatch(/^"[a-f0-9]{32}"$/);
    });

    it('returns 304 when If-None-Match matches ETag', async () => {
      const first = await request(app.getHttpServer()).get('/dictionaries');
      const etag = first.headers['etag'] as string;

      const second = await request(app.getHttpServer())
        .get('/dictionaries')
        .set('If-None-Match', etag);

      expect(second.status).toBe(304);
      expect(second.body).toEqual({});
    });

    it('returns 200 with new ETag after data changes', async () => {
      const first = await request(app.getHttpServer()).get('/dictionaries');
      const etagBefore = first.headers['etag'] as string;

      await request(app.getHttpServer())
        .post('/dictionaries')
        .send({ type: 'City', value: 'Poznań' });

      const second = await request(app.getHttpServer())
        .get('/dictionaries')
        .set('If-None-Match', etagBefore);

      expect(second.status).toBe(200);
      expect(second.headers['etag']).not.toBe(etagBefore);
    });
  });

  describe('GET /dictionaries/:type', () => {
    it('returns 200 with values for valid type', async () => {
      const res = await request(app.getHttpServer()).get(
        '/dictionaries/FirstName',
      );

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('returns 400 for invalid type', async () => {
      const res = await request(app.getHttpServer()).get(
        '/dictionaries/InvalidType',
      );

      expect(res.status).toBe(400);
    });

    it('returns ETag and Cache-Control headers', async () => {
      const res = await request(app.getHttpServer()).get(
        '/dictionaries/FirstName',
      );

      expect(res.status).toBe(200);
      expect(res.headers['cache-control']).toBe('public, max-age=86400');
      expect(res.headers['etag']).toMatch(/^"[a-f0-9]{32}"$/);
    });

    it('returns 304 when If-None-Match matches ETag', async () => {
      const first = await request(app.getHttpServer()).get(
        '/dictionaries/FirstName',
      );
      const etag = first.headers['etag'] as string;

      const second = await request(app.getHttpServer())
        .get('/dictionaries/FirstName')
        .set('If-None-Match', etag);

      expect(second.status).toBe(304);
    });
  });

  describe('POST /dictionaries', () => {
    it('returns 201 with created entry for valid data', async () => {
      const res = await request(app.getHttpServer())
        .post('/dictionaries')
        .send({ type: 'City', value: 'kraków' });

      expect(res.status).toBe(201);
      expect(res.body.id).toBeDefined();
      expect(res.body.value).toBe('KRAKÓW');
    });

    it('returns 400 when Zod validation fails (missing type)', async () => {
      const res = await request(app.getHttpServer())
        .post('/dictionaries')
        .send({ value: 'test' });

      expect(res.status).toBe(400);
    });

    it('returns 400 when value is empty', async () => {
      const res = await request(app.getHttpServer())
        .post('/dictionaries')
        .send({ type: 'FirstName', value: '' });

      expect(res.status).toBe(400);
    });

    it('returns 400 for invalid type value in Zod schema', async () => {
      const res = await request(app.getHttpServer())
        .post('/dictionaries')
        .send({ type: 'Unknown', value: 'test' });

      expect(res.status).toBe(400);
    });

    it('returns 409 when duplicate entry exists', async () => {
      await request(app.getHttpServer())
        .post('/dictionaries')
        .send({ type: 'FirstName', value: 'duplicate' });

      const res = await request(app.getHttpServer())
        .post('/dictionaries')
        .send({ type: 'FirstName', value: 'duplicate' });

      expect(res.status).toBe(409);
    });
  });

  describe('POST /dictionaries/bulk', () => {
    it('returns 201 with import result for valid data', async () => {
      const res = await request(app.getHttpServer())
        .post('/dictionaries/bulk')
        .send({ type: 'Surname', values: ['Kowalski', 'Nowak'] });

      expect(res.status).toBe(201);
      expect(res.body.imported).toBe(2);
      expect(res.body.skipped).toBe(0);
    });

    it('returns 400 when values array is empty', async () => {
      const res = await request(app.getHttpServer())
        .post('/dictionaries/bulk')
        .send({ type: 'Surname', values: [] });

      expect(res.status).toBe(400);
    });

    it('returns 400 for extra fields (strict)', async () => {
      const res = await request(app.getHttpServer())
        .post('/dictionaries/bulk')
        .send({ type: 'Surname', values: ['Test'], extra: 'field' });

      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /dictionaries/:id', () => {
    it('returns 204 when entry exists', async () => {
      const entry = DictionaryEntry.create({
        type: DictionaryType.Phrase,
        value: 'to-delete',
      });
      await repo.save(entry);

      const res = await request(app.getHttpServer()).delete(
        `/dictionaries/${entry.id}`,
      );

      expect(res.status).toBe(204);
    });

    it('returns 404 when entry does not exist', async () => {
      const res = await request(app.getHttpServer()).delete(
        '/dictionaries/550e8400-e29b-41d4-a716-446655440099',
      );

      expect(res.status).toBe(404);
    });

    it('returns 400 for invalid UUID', async () => {
      const res = await request(app.getHttpServer()).delete(
        '/dictionaries/not-a-uuid',
      );

      expect(res.status).toBe(400);
    });
  });
});
