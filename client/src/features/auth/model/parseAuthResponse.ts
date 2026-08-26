import type { AuthResponse, AuthUser } from './types';

/**
 * Runtime validation of AuthResponse from network.
 * Fail-closed: rejects incomplete or malformed payloads.
 */
export const parseAuthResponse = (data: unknown): AuthResponse => {
  if (typeof data !== 'object' || data === null) {
    throw new Error('Invalid auth response: not an object');
  }

  const obj = data as Record<string, unknown>;

  if (typeof obj['accessToken'] !== 'string' || obj['accessToken'].length === 0) {
    throw new Error('Invalid auth response: missing accessToken');
  }

  if (typeof obj['refreshToken'] !== 'string') {
    throw new Error('Invalid auth response: missing refreshToken');
  }

  const user = parseAuthUser(obj['user']);

  return {
    accessToken: obj['accessToken'],
    refreshToken: obj['refreshToken'],
    user,
  };
};

const parseAuthUser = (data: unknown): AuthUser => {
  if (typeof data !== 'object' || data === null) {
    throw new Error('Invalid auth response: missing user');
  }

  const obj = data as Record<string, unknown>;

  if (typeof obj['id'] !== 'string' || obj['id'].length === 0) {
    throw new Error('Invalid auth response: missing user.id');
  }

  if (typeof obj['email'] !== 'string' || obj['email'].length === 0) {
    throw new Error('Invalid auth response: missing user.email');
  }

  if (obj['role'] !== 'Superuser' && obj['role'] !== 'Member') {
    throw new Error('Invalid auth response: invalid user.role');
  }

  if (typeof obj['workspaceId'] !== 'string' || obj['workspaceId'].length === 0) {
    throw new Error('Invalid auth response: missing user.workspaceId');
  }

  return {
    id: obj['id'],
    email: obj['email'],
    role: obj['role'],
    workspaceId: obj['workspaceId'],
  };
};
