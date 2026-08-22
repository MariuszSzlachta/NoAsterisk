import { InviteCode } from './invite-code.entity';
import { InviteCodeStatus } from './invite-code-status.enum';

describe('InviteCode', () => {
  describe('constructor invariants', () => {
    it('throws when id is empty', () => {
      expect(
        () =>
          new InviteCode(
            '',
            'ABCD1234',
            'user-1',
            InviteCodeStatus.Available,
            new Date(),
            undefined,
            undefined,
            undefined,
          ),
      ).toThrow('InviteCode ID is required');
    });

    it('throws when code is shorter than 6 characters', () => {
      expect(
        () =>
          new InviteCode(
            'id-1',
            'AB',
            'user-1',
            InviteCodeStatus.Available,
            new Date(),
            undefined,
            undefined,
            undefined,
          ),
      ).toThrow('InviteCode must be at least 6 characters');
    });

    it('throws when createdBy is empty', () => {
      expect(
        () =>
          new InviteCode(
            'id-1',
            'ABCD1234',
            '',
            InviteCodeStatus.Available,
            new Date(),
            undefined,
            undefined,
            undefined,
          ),
      ).toThrow('InviteCode createdBy is required');
    });
  });

  describe('create', () => {
    it('generates an 8-character uppercase code', () => {
      const code = InviteCode.create({ createdBy: 'admin-1' });

      expect(code.code).toHaveLength(8);
      expect(code.code).toMatch(/^[A-F0-9]{8}$/);
    });

    it('sets status to Available', () => {
      const code = InviteCode.create({ createdBy: 'admin-1' });
      expect(code.status).toBe(InviteCodeStatus.Available);
    });

    it('assigns createdBy from props', () => {
      const code = InviteCode.create({ createdBy: 'admin-1' });
      expect(code.createdBy).toBe('admin-1');
    });

    it('generates unique id', () => {
      const code1 = InviteCode.create({ createdBy: 'admin-1' });
      const code2 = InviteCode.create({ createdBy: 'admin-1' });
      expect(code1.id).not.toBe(code2.id);
    });

    it('sets expiresAt when provided', () => {
      const expiry = new Date('2030-01-01');
      const code = InviteCode.create({
        createdBy: 'admin-1',
        expiresAt: expiry,
      });
      expect(code.expiresAt).toBe(expiry);
    });

    it('leaves expiresAt undefined when not provided', () => {
      const code = InviteCode.create({ createdBy: 'admin-1' });
      expect(code.expiresAt).toBeUndefined();
    });

    it('leaves usedBy and usedAt undefined', () => {
      const code = InviteCode.create({ createdBy: 'admin-1' });
      expect(code.usedBy).toBeUndefined();
      expect(code.usedAt).toBeUndefined();
    });
  });

  describe('redeem', () => {
    it('transitions status to Used', () => {
      const code = InviteCode.create({ createdBy: 'admin-1' });
      const redeemed = code.redeem('user-1');

      expect(redeemed.status).toBe(InviteCodeStatus.Used);
      expect(redeemed.usedBy).toBe('user-1');
      expect(redeemed.usedAt).toBeInstanceOf(Date);
    });

    it('preserves original fields', () => {
      const code = InviteCode.create({ createdBy: 'admin-1' });
      const redeemed = code.redeem('user-1');

      expect(redeemed.id).toBe(code.id);
      expect(redeemed.code).toBe(code.code);
      expect(redeemed.createdBy).toBe(code.createdBy);
      expect(redeemed.createdAt).toBe(code.createdAt);
      expect(redeemed.expiresAt).toBe(code.expiresAt);
    });

    it('throws when code is already used', () => {
      const code = InviteCode.create({ createdBy: 'admin-1' });
      const redeemed = code.redeem('user-1');

      expect(() => redeemed.redeem('user-2')).toThrow(
        'Invite code is not available',
      );
    });

    it('throws when code has expired', () => {
      const pastDate = new Date('2020-01-01');
      const code = new InviteCode(
        'id-1',
        'ABCD1234',
        'admin-1',
        InviteCodeStatus.Available,
        new Date('2019-01-01'),
        pastDate,
        undefined,
        undefined,
      );

      expect(() => code.redeem('user-1')).toThrow('Invite code has expired');
    });
  });

  describe('isAvailable', () => {
    it('returns true for Available status with no expiry', () => {
      const code = InviteCode.create({ createdBy: 'admin-1' });
      expect(code.isAvailable()).toBe(true);
    });

    it('returns true for Available status with future expiry', () => {
      const code = InviteCode.create({
        createdBy: 'admin-1',
        expiresAt: new Date('2030-01-01'),
      });
      expect(code.isAvailable()).toBe(true);
    });

    it('returns false for Used status', () => {
      const code = InviteCode.create({ createdBy: 'admin-1' });
      const redeemed = code.redeem('user-1');
      expect(redeemed.isAvailable()).toBe(false);
    });

    it('returns false for expired code', () => {
      const code = new InviteCode(
        'id-1',
        'ABCD1234',
        'admin-1',
        InviteCodeStatus.Available,
        new Date('2019-01-01'),
        new Date('2020-01-01'),
        undefined,
        undefined,
      );
      expect(code.isAvailable()).toBe(false);
    });
  });
});
