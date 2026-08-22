import { GenerateCodeHandler } from './generate-code.handler';
import { DeleteCodeHandler } from './delete-code.handler';
import { RedeemCodeHandler } from './redeem-code.handler';
import { GetInviteCodesHandler } from '@invite-codes/application/queries/get-invite-codes.handler';
import { InMemoryInviteCodeRepository } from '@invite-codes/infrastructure/in-memory-invite-code.repository';
import { InviteCode } from '@invite-codes/domain/invite-code.entity';
import { InviteCodeStatus } from '@invite-codes/domain/invite-code-status.enum';

describe('InviteCode Handlers', () => {
  let repo: InMemoryInviteCodeRepository;

  beforeEach(() => {
    repo = new InMemoryInviteCodeRepository();
  });

  describe('GenerateCodeHandler', () => {
    let handler: GenerateCodeHandler;

    beforeEach(() => {
      handler = new GenerateCodeHandler(repo);
    });

    it('creates and saves a new invite code', async () => {
      const result = await handler.execute({ createdBy: 'admin-1' });

      expect(result.code).toHaveLength(8);
      expect(result.status).toBe('Available');
      expect(result.usedBy).toBeNull();
    });

    it('sets expiresAt when provided', async () => {
      const result = await handler.execute({
        createdBy: 'admin-1',
        expiresAt: '2030-01-01T00:00:00.000Z',
      });

      expect(result.expiresAt).toBe('2030-01-01T00:00:00.000Z');
    });

    it('persists the code to repository', async () => {
      const result = await handler.execute({ createdBy: 'admin-1' });

      const stored = await repo.findById(result.id);
      expect(stored).toBeDefined();
      expect(stored?.code).toBe(result.code);
    });
  });

  describe('DeleteCodeHandler', () => {
    let handler: DeleteCodeHandler;

    beforeEach(() => {
      handler = new DeleteCodeHandler(repo);
    });

    it('deletes an Available code', async () => {
      const code = InviteCode.create({ createdBy: 'admin-1' });
      await repo.save(code);

      await handler.execute({ id: code.id });

      const found = await repo.findById(code.id);
      expect(found).toBeUndefined();
    });

    it('throws when code not found', async () => {
      await expect(handler.execute({ id: 'non-existent' })).rejects.toThrow(
        'Invite code not found',
      );
    });

    it('throws when code is already used', async () => {
      const code = InviteCode.create({ createdBy: 'admin-1' });
      const used = code.redeem('user-1');
      await repo.save(used);

      await expect(handler.execute({ id: used.id })).rejects.toThrow(
        'Cannot delete a code that has been used',
      );
    });
  });

  describe('RedeemCodeHandler', () => {
    let handler: RedeemCodeHandler;

    beforeEach(() => {
      handler = new RedeemCodeHandler(repo);
    });

    it('redeems a valid code', async () => {
      const code = InviteCode.create({ createdBy: 'admin-1' });
      await repo.save(code);

      await handler.execute({ code: code.code, userId: 'user-1' });

      const stored = await repo.findByCode(code.code);
      expect(stored?.status).toBe(InviteCodeStatus.Used);
      expect(stored?.usedBy).toBe('user-1');
    });

    it('throws when code does not exist', async () => {
      await expect(
        handler.execute({ code: 'NOTFOUND', userId: 'user-1' }),
      ).rejects.toThrow('Invalid invite code');
    });

    it('throws when code is already used', async () => {
      const code = InviteCode.create({ createdBy: 'admin-1' });
      const used = code.redeem('user-1');
      await repo.save(used);

      await expect(
        handler.execute({ code: used.code, userId: 'user-2' }),
      ).rejects.toThrow('Invite code is not available');
    });

    it('throws when code has expired', async () => {
      const expiredCode = new InviteCode(
        'id-1',
        'EXPIRED1',
        'admin-1',
        InviteCodeStatus.Available,
        new Date('2019-01-01'),
        new Date('2020-01-01'),
        undefined,
        undefined,
      );
      await repo.save(expiredCode);

      await expect(
        handler.execute({ code: 'EXPIRED1', userId: 'user-1' }),
      ).rejects.toThrow('Invite code has expired');
    });
  });

  describe('GetInviteCodesHandler', () => {
    let handler: GetInviteCodesHandler;

    beforeEach(() => {
      handler = new GetInviteCodesHandler(repo);
    });

    it('returns empty array when no codes exist', async () => {
      const result = await handler.execute();
      expect(result).toEqual([]);
    });

    it('returns mapped DTOs', async () => {
      const code = InviteCode.create({ createdBy: 'admin-1' });
      await repo.save(code);

      const result = await handler.execute();

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: code.id,
        code: code.code,
        status: 'Available',
        createdAt: code.createdAt.toISOString(),
        expiresAt: null,
        usedBy: null,
        usedAt: null,
      });
    });
  });
});
