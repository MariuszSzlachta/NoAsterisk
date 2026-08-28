import type { AuthUser } from '#features/auth/model/types/auth-user';

export interface AuthResponse {
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly user: AuthUser;
}
