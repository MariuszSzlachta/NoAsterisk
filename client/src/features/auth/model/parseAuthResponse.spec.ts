import { describe, expect, it } from 'vitest';

import { parseAuthResponse } from './parseAuthResponse';

// ─── Test Builders ───────────────────────────────────────────────

const buildValidResponse = () => ({
  accessToken: 'jwt-access-token',
  refreshToken: 'jwt-refresh-token',
  user: {
    id: 'user-123',
    email: 'test@example.com',
    role: 'Member' as const,
    workspaceId: 'ws-456',
  },
});

// ─── Tests ───────────────────────────────────────────────────────

describe('parseAuthResponse', () => {
  describe('happy path', () => {
    it('parses valid response with Member role', () => {
      const data = buildValidResponse();

      const result = parseAuthResponse(data);

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
      const data = { ...buildValidResponse(), user: { ...buildValidResponse().user, role: 'Superuser' } };

      const result = parseAuthResponse(data);

      expect(result.user.role).toBe('Superuser');
    });

    it('ignores extra fields in response', () => {
      const data = { ...buildValidResponse(), extraField: 'ignored', anotherField: 42 };

      const result = parseAuthResponse(data);

      expect(result.accessToken).toBe('jwt-access-token');
      expect(result).not.toHaveProperty('extraField');
    });

    it('ignores extra fields in user object', () => {
      const data = buildValidResponse();
      (data.user as Record<string, unknown>)['extraUserField'] = 'ignored';

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
      const data = buildValidResponse();
      delete (data as Record<string, unknown>)['accessToken'];

      expect(() => parseAuthResponse(data)).toThrow('missing accessToken');
    });

    it('throws when accessToken is empty string', () => {
      const data = { ...buildValidResponse(), accessToken: '' };

      expect(() => parseAuthResponse(data)).toThrow('missing accessToken');
    });

    it('throws when accessToken is a number', () => {
      const data = { ...buildValidResponse(), accessToken: 123 };

      expect(() => parseAuthResponse(data)).toThrow('missing accessToken');
    });

    it('throws when accessToken is null', () => {
      const data = { ...buildValidResponse(), accessToken: null };

      expect(() => parseAuthResponse(data)).toThrow('missing accessToken');
    });
  });

  describe('refreshToken validation', () => {
    it('throws when refreshToken is missing', () => {
      const data = buildValidResponse();
      delete (data as Record<string, unknown>)['refreshToken'];

      expect(() => parseAuthResponse(data)).toThrow('missing refreshToken');
    });

    it('throws when refreshToken is a number', () => {
      const data = { ...buildValidResponse(), refreshToken: 123 };

      expect(() => parseAuthResponse(data)).toThrow('missing refreshToken');
    });

    it('throws when refreshToken is null', () => {
      const data = { ...buildValidResponse(), refreshToken: null };

      expect(() => parseAuthResponse(data)).toThrow('missing refreshToken');
    });

    it('accepts empty string refreshToken', () => {
      const data = { ...buildValidResponse(), refreshToken: '' };

      const result = parseAuthResponse(data);

      expect(result.refreshToken).toBe('');
    });
  });

  describe('user validation', () => {
    it('throws when user is missing', () => {
      const data = buildValidResponse();
      delete (data as Record<string, unknown>)['user'];

      expect(() => parseAuthResponse(data)).toThrow('missing user');
    });

    it('throws when user is null', () => {
      const data = { ...buildValidResponse(), user: null };

      expect(() => parseAuthResponse(data)).toThrow('missing user');
    });

    it('throws when user is a string', () => {
      const data = { ...buildValidResponse(), user: 'not-object' };

      expect(() => parseAuthResponse(data)).toThrow('missing user');
    });
  });

  describe('user.id validation', () => {
    it('throws when user.id is missing', () => {
      const data = buildValidResponse();
      delete (data.user as Record<string, unknown>)['id'];

      expect(() => parseAuthResponse(data)).toThrow('missing user.id');
    });

    it('throws when user.id is empty string', () => {
      const data = { ...buildValidResponse(), user: { ...buildValidResponse().user, id: '' } };

      expect(() => parseAuthResponse(data)).toThrow('missing user.id');
    });

    it('throws when user.id is a number', () => {
      const data = { ...buildValidResponse(), user: { ...buildValidResponse().user, id: 123 } };

      expect(() => parseAuthResponse(data)).toThrow('missing user.id');
    });
  });

  describe('user.email validation', () => {
    it('throws when user.email is missing', () => {
      const data = buildValidResponse();
      delete (data.user as Record<string, unknown>)['email'];

      expect(() => parseAuthResponse(data)).toThrow('missing user.email');
    });

    it('throws when user.email is empty string', () => {
      const data = { ...buildValidResponse(), user: { ...buildValidResponse().user, email: '' } };

      expect(() => parseAuthResponse(data)).toThrow('missing user.email');
    });
  });

  describe('user.role validation', () => {
    it('throws when user.role is missing', () => {
      const data = buildValidResponse();
      delete (data.user as Record<string, unknown>)['role'];

      expect(() => parseAuthResponse(data)).toThrow('invalid user.role');
    });

    it('throws when user.role is not a valid enum value', () => {
      const data = { ...buildValidResponse(), user: { ...buildValidResponse().user, role: 'Admin' } };

      expect(() => parseAuthResponse(data)).toThrow('invalid user.role');
    });

    it('throws for lowercase role', () => {
      const data = { ...buildValidResponse(), user: { ...buildValidResponse().user, role: 'member' } };

      expect(() => parseAuthResponse(data)).toThrow('invalid user.role');
    });
  });

  describe('user.workspaceId validation', () => {
    it('throws when user.workspaceId is missing', () => {
      const data = buildValidResponse();
      delete (data.user as Record<string, unknown>)['workspaceId'];

      expect(() => parseAuthResponse(data)).toThrow('missing user.workspaceId');
    });

    it('throws when user.workspaceId is empty string', () => {
      const data = { ...buildValidResponse(), user: { ...buildValidResponse().user, workspaceId: '' } };

      expect(() => parseAuthResponse(data)).toThrow('missing user.workspaceId');
    });
  });
});
