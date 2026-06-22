export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  user: { id: string; email: string; role: 'Superuser' | 'Member'; workspaceId: string };
}
