import { User } from './user.entity';
import { UserRole } from './user-role.enum';

describe('User', () => {
  const validProps = {
    email: 'test@example.com',
    passwordHash: '$2b$10$hashedpassword',
    role: UserRole.Member,
    workspaceId: 'ws-1',
  };

  describe('constructor invariants', () => {
    it('creates valid user', () => {
      const user = new User(
        'user-1',
        validProps.email,
        validProps.passwordHash,
        validProps.role,
        validProps.workspaceId,
        new Date(),
      );
      expect(user.id).toBe('user-1');
      expect(user.email).toBe('test@example.com');
      expect(user.role).toBe(UserRole.Member);
    });

    it.each([
      ['empty id', { id: '', email: 'a@b.co', hash: 'x', ws: 'ws-1' }],
      ['empty email', { id: 'u1', email: '', hash: 'x', ws: 'ws-1' }],
      [
        'invalid email (no TLD)',
        { id: 'u1', email: 'a@b.c', hash: 'x', ws: 'ws-1' },
      ],
      [
        'invalid email (no @)',
        { id: 'u1', email: 'not-email', hash: 'x', ws: 'ws-1' },
      ],
      [
        'empty passwordHash',
        { id: 'u1', email: 'a@b.co', hash: '', ws: 'ws-1' },
      ],
      ['empty workspaceId', { id: 'u1', email: 'a@b.co', hash: 'x', ws: '' }],
    ])('throws for %s', (_, props) => {
      expect(
        () =>
          new User(
            props.id,
            props.email,
            props.hash,
            UserRole.Member,
            props.ws,
            new Date(),
          ),
      ).toThrow();
    });
  });

  describe('create', () => {
    it('generates unique id and current timestamp', () => {
      const before = new Date();
      const user = User.create(validProps);
      expect(user.id).toBeDefined();
      expect(user.id.length).toBeGreaterThan(0);
      expect(user.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    });

    it('generates different ids for each call', () => {
      const user1 = User.create(validProps);
      const user2 = User.create(validProps);
      expect(user1.id).not.toBe(user2.id);
    });
  });

  describe('isSuperuser', () => {
    it('returns true for Superuser role', () => {
      const user = User.create({ ...validProps, role: UserRole.Superuser });
      expect(user.isSuperuser()).toBe(true);
    });

    it('returns false for Member role', () => {
      const user = User.create(validProps);
      expect(user.isSuperuser()).toBe(false);
    });
  });
});
