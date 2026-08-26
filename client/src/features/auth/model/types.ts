export interface LoginFormValues {
  readonly email: string;
  readonly password: string;
}

export interface RegisterFormValues {
  readonly email: string;
  readonly password: string;
  readonly confirmPassword: string;
  readonly inviteCode: string;
}

export interface LoginRequestBody {
  readonly email: string;
  readonly password: string;
}

export interface RegisterRequestBody {
  readonly email: string;
  readonly password: string;
  readonly inviteCode?: string;
}

export interface AuthUser {
  readonly id: string;
  readonly email: string;
  readonly role: 'Superuser' | 'Member';
  readonly workspaceId: string;
}

export interface AuthResponse {
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly user: AuthUser;
}

export interface FieldErrors {
  readonly email?: string;
  readonly password?: string;
  readonly confirmPassword?: string;
  readonly inviteCode?: string;
}
