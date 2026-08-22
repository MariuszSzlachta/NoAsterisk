import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { InviteCodesModule } from '@invite-codes/invite-codes.module';
import { DomainExceptionFilter } from '@shared/presentation/domain-exception.filter';
import { INVITE_CODE_REPOSITORY } from '@invite-codes/domain/ports/invite-code.repository';
import { InMemoryInviteCodeRepository } from '@invite-codes/infrastructure/in-memory-invite-code.repository';
import { InviteCode } from '@invite-codes/domain/invite-code.entity';

describe('InviteCodesController', () => {
  let app: INestApplication<App>;
  let repo: InMemoryInviteCodeRepository;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [InviteCodesModule],
    })
      .overrideProvider(INVITE_CODE_REPOSITORY)
      .useClass(InMemoryInviteCodeRepository)
      .compile();

    app = module.createNestApplication();
    app.use((req: { user: unknown }, _res: unknown, next: () => void) => {
      req.user = {
        userId: 'admin-user-1',
        workspaceId: 'ws-admin',
        role: 'Superuser',
      };
      next();
    });
    app.useGlobalFilters(new DomainExceptionFilter());
    await app.init();

    repo = module.get<InMemoryInviteCodeRepository>(INVITE_CODE_REPOSITORY);
  });

  beforeEach(() => {
    repo.clear();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /admin/invite-codes', () => {
    it('returns 200 with empty array', async () => {
      const res = await request(app.getHttpServer())
        .get('/admin/invite-codes')
        .expect(200);

      expect(res.body).toEqual([]);
    });

    it('returns all codes as DTOs', async () => {
      const code = InviteCode.create({ createdBy: 'admin-user-1' });
      await repo.save(code);

      const res = await request(app.getHttpServer())
        .get('/admin/invite-codes')
        .expect(200);

      expect(res.body).toHaveLength(1);
      expect(res.body[0]).toMatchObject({
        id: code.id,
        code: code.code,
        status: 'Available',
      });
    });
  });

  describe('POST /admin/invite-codes', () => {
    it('returns 201 with generated code', async () => {
      const res = await request(app.getHttpServer())
        .post('/admin/invite-codes')
        .send({})
        .expect(201);

      expect(res.body.code).toHaveLength(8);
      expect(res.body.status).toBe('Available');
      expect(res.body.id).toBeDefined();
    });

    it('accepts optional expiresAt', async () => {
      const res = await request(app.getHttpServer())
        .post('/admin/invite-codes')
        .send({ expiresAt: '2030-01-01T00:00:00.000Z' })
        .expect(201);

      expect(res.body.expiresAt).toBe('2030-01-01T00:00:00.000Z');
    });

    it('returns 400 for invalid expiresAt format', async () => {
      await request(app.getHttpServer())
        .post('/admin/invite-codes')
        .send({ expiresAt: 'not-a-date' })
        .expect(400);
    });

    it('returns 400 for unexpected fields', async () => {
      await request(app.getHttpServer())
        .post('/admin/invite-codes')
        .send({ expiresAt: '2030-01-01T00:00:00.000Z', extra: 'field' })
        .expect(400);
    });
  });

  describe('DELETE /admin/invite-codes/:id', () => {
    it('returns 204 for Available code', async () => {
      const code = InviteCode.create({ createdBy: 'admin-user-1' });
      await repo.save(code);

      await request(app.getHttpServer())
        .delete(`/admin/invite-codes/${code.id}`)
        .expect(204);

      const found = await repo.findById(code.id);
      expect(found).toBeUndefined();
    });

    it('returns 400 when code is already used', async () => {
      const code = InviteCode.create({ createdBy: 'admin-user-1' });
      const used = code.redeem('user-1');
      await repo.save(used);

      await request(app.getHttpServer())
        .delete(`/admin/invite-codes/${used.id}`)
        .expect(400);
    });

    it('returns 400 when code not found', async () => {
      await request(app.getHttpServer())
        .delete('/admin/invite-codes/00000000-0000-0000-0000-000000000099')
        .expect(400);
    });

    it('returns 400 for invalid UUID param', async () => {
      await request(app.getHttpServer())
        .delete('/admin/invite-codes/not-a-uuid')
        .expect(400);
    });
  });
});
