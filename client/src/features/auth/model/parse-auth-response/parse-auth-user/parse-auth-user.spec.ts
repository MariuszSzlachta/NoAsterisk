import { describe, expect, it } from 'vitest';

import { parseAuthUser } from './parse-auth-user';

const validUser = {
  id: 'user-1',
  email: 'user@example.com',
  role: 'Member',
  workspaceId: 'workspace-1',
};

describe('parseAuthUser', () => {
  it('returns only validated authentication user fields', () => {
    expect(parseAuthUser({ ...validUser, ignored: true })).toEqual(validUser);
  });

  it('accepts the Superuser role', () => {
    expect(parseAuthUser({ ...validUser, role: 'Superuser' }).role).toBe(
      'Superuser',
    );
  });

  it.each([
    [null, 'missing user'],
    [{ ...validUser, id: '' }, 'missing user.id'],
    [{ ...validUser, email: 1 }, 'missing user.email'],
    [{ ...validUser, role: 'Admin' }, 'invalid user.role'],
    [{ ...validUser, workspaceId: '' }, 'missing user.workspaceId'],
  ])('rejects malformed user data', (value, message) => {
    expect(() => parseAuthUser(value)).toThrow(message);
  });
});
