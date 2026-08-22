import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { UserSettingsModule } from '@user-settings/user-settings.module';
import { DomainExceptionFilter } from '@shared/presentation/domain-exception.filter';
import { USER_REPOSITORY } from '@auth/domain/ports/user.repository';
import { InMemoryUserRepository } from '@auth/infrastructure/in-memory-user.repository';
import { User } from '@auth/domain/user.entity';
import { UserRole } from '@auth/domain/user-role.enum';

describe('AdminUsersController', () => {
  let app: INestApplication<App>;
  let userRepo: InMemoryUserRepository;

  const adminUser = new User(
    '78a82ab1-f8d6-4e06-87a6-b1ee1e5e2f06',
    'admin@test.com',
    '$hash$',
    UserRole.Superuser,
    'ws-admin',
    new Date('2025-01-01'),
  );

  const memberUser = new User(
    '28b99fd4-bb76-446d-96ba-85a89f11df83',
    'member@test.com',
    '$hash$',
    UserRole.Member,
    'ws-member',
    new Date('2025-02-01'),
  );

  beforeAll(async () => {
    process.env['JWT_SECRET'] = 'test-secret';
    process.env['REGISTRATION_MODE'] = 'open';

    const module: TestingModule = await Test.createTestingModule({
      imports: [UserSettingsModule],
    })
      .overrideProvider(USER_REPOSITORY)
      .useClass(InMemoryUserRepository)
      .compile();

    app = module.createNestApplication();
    app.use((req: { user: unknown }, _res: unknown, next: () => void) => {
      req.user = {
        userId: '78a82ab1-f8d6-4e06-87a6-b1ee1e5e2f06',
        workspaceId: 'ws-admin',
        role: 'Superuser',
      };
      next();
    });
    app.useGlobalFilters(new DomainExceptionFilter());
    await app.init();

    userRepo = module.get<InMemoryUserRepository>(USER_REPOSITORY);
  });

  beforeEach(async () => {
    userRepo.clear();
    await userRepo.save(adminUser);
    await userRepo.save(memberUser);
  });

  afterAll(async () => {
    await app.close();
    delete process.env['JWT_SECRET'];
    delete process.env['REGISTRATION_MODE'];
  });

  describe('GET /admin/users', () => {
    it('returns 200 with list of users', async () => {
      const res = await request(app.getHttpServer())
        .get('/admin/users')
        .expect(200);

      expect(res.body).toHaveLength(2);
      expect(res.body[0]).toMatchObject({
        id: expect.any(String),
        email: expect.any(String),
        role: expect.any(String),
      });
    });
  });

  describe('PATCH /admin/users/:id/block', () => {
    it('returns 204 and blocks a Member', async () => {
      await request(app.getHttpServer())
        .patch('/admin/users/28b99fd4-bb76-446d-96ba-85a89f11df83/block')
        .expect(204);

      const user = await userRepo.findById(
        '28b99fd4-bb76-446d-96ba-85a89f11df83',
      );
      expect(user?.role).toBe(UserRole.Blocked);
    });

    it('returns 204 and unblocks a Blocked user', async () => {
      const blocked = memberUser.block();
      await userRepo.save(blocked);

      await request(app.getHttpServer())
        .patch('/admin/users/28b99fd4-bb76-446d-96ba-85a89f11df83/block')
        .expect(204);

      const user = await userRepo.findById(
        '28b99fd4-bb76-446d-96ba-85a89f11df83',
      );
      expect(user?.role).toBe(UserRole.Member);
    });

    it('returns 400 when trying to block a Superuser', async () => {
      await request(app.getHttpServer())
        .patch('/admin/users/78a82ab1-f8d6-4e06-87a6-b1ee1e5e2f06/block')
        .expect(400);
    });

    it('returns 400 for invalid UUID', async () => {
      await request(app.getHttpServer())
        .patch('/admin/users/not-a-uuid/block')
        .expect(400);
    });
  });

  describe('DELETE /admin/users/:id', () => {
    it('returns 204 and deletes the user', async () => {
      await request(app.getHttpServer())
        .delete('/admin/users/28b99fd4-bb76-446d-96ba-85a89f11df83')
        .expect(204);

      const user = await userRepo.findById(
        '28b99fd4-bb76-446d-96ba-85a89f11df83',
      );
      expect(user).toBeUndefined();
    });

    it('returns 400 when trying to delete self', async () => {
      await request(app.getHttpServer())
        .delete('/admin/users/78a82ab1-f8d6-4e06-87a6-b1ee1e5e2f06')
        .expect(400);
    });

    it('returns 400 for invalid UUID', async () => {
      await request(app.getHttpServer())
        .delete('/admin/users/not-a-uuid')
        .expect(400);
    });
  });
});
