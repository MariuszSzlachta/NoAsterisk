import type { AuthUser } from '#features/auth/model/types/auth-user';
import { isRecord } from '#features/auth/model/parse-auth-response/is-record';

export const parseAuthUser = (data: unknown): AuthUser => {
  if (!isRecord(data)) {
    throw new Error('Invalid auth response: missing user');
  }

  if (typeof data['id'] !== 'string' || data['id'].length === 0) {
    throw new Error('Invalid auth response: missing user.id');
  }

  if (typeof data['email'] !== 'string' || data['email'].length === 0) {
    throw new Error('Invalid auth response: missing user.email');
  }

  if (data['role'] !== 'Superuser' && data['role'] !== 'Member') {
    throw new Error('Invalid auth response: invalid user.role');
  }

  if (typeof data['workspaceId'] !== 'string' || data['workspaceId'].length === 0) {
    throw new Error('Invalid auth response: missing user.workspaceId');
  }

  return {
    id: data['id'],
    email: data['email'],
    role: data['role'],
    workspaceId: data['workspaceId'],
  };
};
