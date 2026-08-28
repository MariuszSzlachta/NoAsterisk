import type { AuthResponse } from '#features/auth/model/types/auth-response';
import { isRecord } from '#features/auth/model/parse-auth-response/is-record';
import { parseAuthUser } from '#features/auth/model/parse-auth-response/parse-auth-user';

export const parseAuthResponse = (data: unknown): AuthResponse => {
  if (!isRecord(data)) {
    throw new Error('Invalid auth response: not an object');
  }

  if (typeof data['accessToken'] !== 'string' || data['accessToken'].length === 0) {
    throw new Error('Invalid auth response: missing accessToken');
  }

  if (typeof data['refreshToken'] !== 'string') {
    throw new Error('Invalid auth response: missing refreshToken');
  }

  const user = parseAuthUser(data['user']);

  return {
    accessToken: data['accessToken'],
    refreshToken: data['refreshToken'],
    user,
  };
};
