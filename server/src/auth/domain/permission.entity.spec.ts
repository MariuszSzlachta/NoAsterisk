import { Permission } from './permission.entity';

describe('Permission', () => {
  describe('constructor invariants', () => {
    it('creates valid permission', () => {
      const p = new Permission(
        'p-1',
        'user-1',
        'workspace',
        'ws-1',
        ['read', 'write'],
        new Date(),
      );
      expect(p.userId).toBe('user-1');
      expect(p.actions).toEqual(['read', 'write']);
    });

    it.each([
      [
        'empty id',
        {
          id: '',
          userId: 'u1',
          resourceId: 'ws-1',
          actions: ['read'] as const,
        },
      ],
      [
        'empty userId',
        {
          id: 'p1',
          userId: '',
          resourceId: 'ws-1',
          actions: ['read'] as const,
        },
      ],
      [
        'empty resourceId',
        { id: 'p1', userId: 'u1', resourceId: '', actions: ['read'] as const },
      ],
      [
        'empty actions',
        { id: 'p1', userId: 'u1', resourceId: 'ws-1', actions: [] as const },
      ],
    ])('throws for %s', (_, props) => {
      expect(
        () =>
          new Permission(
            props.id,
            props.userId,
            'workspace',
            props.resourceId,
            [...props.actions],
            new Date(),
          ),
      ).toThrow();
    });
  });

  describe('create', () => {
    it('generates unique id', () => {
      const p1 = Permission.create({
        userId: 'u1',
        resourceType: 'workspace',
        resourceId: 'ws-1',
        actions: ['read'],
      });
      const p2 = Permission.create({
        userId: 'u1',
        resourceType: 'workspace',
        resourceId: 'ws-1',
        actions: ['read'],
      });
      expect(p1.id).not.toBe(p2.id);
    });
  });

  describe('hasAction', () => {
    const permission = new Permission(
      'p-1',
      'u-1',
      'workspace',
      'ws-1',
      ['read', 'write'],
      new Date(),
    );

    it('returns true for included action', () => {
      expect(permission.hasAction('read')).toBe(true);
      expect(permission.hasAction('write')).toBe(true);
    });

    it('returns false for excluded action', () => {
      expect(permission.hasAction('delete')).toBe(false);
      expect(permission.hasAction('admin')).toBe(false);
    });
  });
});
