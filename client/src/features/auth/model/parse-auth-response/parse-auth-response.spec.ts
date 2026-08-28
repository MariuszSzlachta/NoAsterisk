import { describe, expect, it } from 'vitest';

import { parseAuthResponse } from '#features/auth/model/parse-auth-response';

const buildValidUser = (): Record<string, unknown> => ({
  id: 'user-123',
  email: 'test@example.com',
  role: 'Member',
  workspaceId: 'ws-456',
});

const buildValidResponse = (): Record<string, unknown> => ({
  accessToken: 'jwt-access-token',
  refreshToken: 'jwt-refresh-token',
  user: buildValidUser(),
});

describe('parseAuthResponse', () => {
  describe('happy path', () => {
    it('parses valid response with Member role', () => {
      const result = parseAuthResponse(buildValidResponse());

      expect(result).toEqual({
        accessToken: 'jwt-access-token',
        refreshToken: 'jwt-refresh-token',
        user: {
          id: 'user-123',
          email: 'test@example.com',
          role: 'Member',
          workspaceId: 'ws-456',
        },
      });
    });

    it('parses valid response with Superuser role', () => {
      const result = parseAuthResponse({
        ...buildValidResponse(),
        user: { ...buildValidUser(), role: 'Superuser' },
      });

      expect(result.user.role).toBe('Superuser');
    });

    it('ignores extra fields in response', () => {
      const data = { ...buildValidResponse(), extraField: 'ignored', anotherField: 42 };
      const result = parseAuthResponse(data);

      expect(result.accessToken).toBe('jwt-access-token');
      expect(result).not.toHaveProperty('extraField');
    });

    it('ignores extra fields in user object', () => {
      const data = {
        ...buildValidResponse(),
        user: { ...buildValidUser(), extraUserField: 'ignored' },
      };
      const result = parseAuthResponse(data);

      expect(result.user).not.toHaveProperty('extraUserField');
    });
  });

  describe('top-level validation', () => {
    it('throws for null input', () => {
      expect(() => parseAuthResponse(null)).toThrow('Invalid auth response: not an object');
    });

    it('throws for undefined input', () => {
      expect(() => parseAuthResponse(undefined)).toThrow('Invalid auth response: not an object');
    });

    it('throws for string input', () => {
      expect(() => parseAuthResponse('not-an-object')).toThrow('Invalid auth response: not an object');
    });

    it('throws for number input', () => {
      expect(() => parseAuthResponse(42)).toThrow('Invalid auth response: not an object');
    });

    it('throws for array input', () => {
      expect(() => parseAuthResponse([])).toThrow();
    });
  });

  describe('accessToken validation', () => {
    it('throws when accessToken is missing', () => {
      const { accessToken: _, ...data } = buildValidResponse();
      expect(() => parseAuthResponse(data)).toThrow('missing accessToken');
    });

    it('throws when accessToken is empty string', () => {
      expect(() => parseAuthResponse({ ...buildValidResponse(), accessToken: '' })).toThrow('missing accessToken');
    });

    it('throws when accessToken is a number', () => {
      expect(() => parseAuthResponse({ ...buildValidResponse(), accessToken: 123 })).toThrow('missing accessToken');
    });

    it('throws when accessToken is null', () => {
      expect(() => parseAuthResponse({ ...buildValidResponse(), accessToken: null })).toThrow('missing accessToken');
    });
  });

  describe('refreshToken validation', () => {
    it('throws when refreshToken is missing', () => {
      const { refreshToken: _, ...data } = buildValidResponse();
      expect(() => parseAuthResponse(data)).toThrow('missing refreshToken');
    });

    it('throws when refreshToken is a number', () => {
      expect(() => parseAuthResponse({ ...buildValidResponse(), refreshToken: 123 })).toThrow('missing refreshToken');
    });

    it('throws when refreshToken is null', () => {
      expect(() => parseAuthResponse({ ...buildValidResponse(), refreshToken: null })).toThrow('missing refreshToken');
    });

    it('accepts empty string refreshToken', () => {
      const result = parseAuthResponse({ ...buildValidResponse(), refreshToken: '' });
      expect(result.refreshToken).toBe('');
    });
  });

  describe('user validation', () => {
    it('throws when user is missing', () => {
      const { user: _, ...data } = buildValidResponse();
      expect(() => parseAuthResponse(data)).toThrow('missing user');
    });

    it('throws when user is null', () => {
      expect(() => parseAuthResponse({ ...buildValidResponse(), user: null })).toThrow('missing user');
    });

    it('throws when user is a string', () => {
      expect(() => parseAuthResponse({ ...buildValidResponse(), user: 'not-object' })).toThrow('missing user');
    });
  });

  describe('user.id validation', () => {
    it('throws when user.id is missing', () => {
      const { id: _, ...user } = buildValidUser();
      expect(() => parseAuthResponse({ ...buildValidResponse(), user })).toThrow('missing user.id');
    });

    it('throws when user.id is empty string', () => {
      expect(() => parseAuthResponse({ ...buildValidResponse(), user: { ...buildValidUser(), id: '' } })).toThrow('missing user.id');
    });

    it('throws when user.id is a number', () => {
      expect(() => parseAuthResponse({ ...buildValidResponse(), user: { ...buildValidUser(), id: 123 } })).toThrow('missing user.id');
    });
  });

  describe('user.email validation', () => {
    it('throws when user.email is missing', () => {
      const { email: _, ...user } = buildValidUser();
      expect(() => parseAuthResponse({ ...buildValidResponse(), user })).toThrow('missing user.email');
    });

    it('throws when user.email is empty string', () => {
      expect(() => parseAuthResponse({ ...buildValidResponse(), user: { ...buildValidUser(), email: '' } })).toThrow('missing user.email');
    });
  });

  describe('user.role validation', () => {
    it('throws when user.role is missing', () => {
      const { role: _, ...user } = buildValidUser();
      expect(() => parseAuthResponse({ ...buildValidResponse(), user })).toThrow('invalid user.role');
    });

    it('throws when user.role is not a valid enum value', () => {
      expect(() => parseAuthResponse({ ...buildValidResponse(), user: { ...buildValidUser(), role: 'Admin' } })).toThrow('invalid user.role');
    });

    it('throws for lowercase role', () => {
      expect(() => parseAuthResponse({ ...buildValidResponse(), user: { ...buildValidUser(), role: 'member' } })).toThrow('invalid user.role');
    });
  });

  describe('user.workspaceId validation', () => {
    it('throws when user.workspaceId is missing', () => {
      const { workspaceId: _, ...user } = buildValidUser();
      expect(() => parseAuthResponse({ ...buildValidResponse(), user })).toThrow('missing user.workspaceId');
    });

    it('throws when user.workspaceId is empty string', () => {
      expect(() => parseAuthResponse({ ...buildValidResponse(), user: { ...buildValidUser(), workspaceId: '' } })).toThrow('missing user.workspaceId');
    });
  });
});
