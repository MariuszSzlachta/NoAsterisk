export const TOKEN_PORT = Symbol('TOKEN_PORT');

export interface TokenPayload {
  sub: string;
  workspaceId: string;
  role: string;
  tokenVersion?: number;
}

export interface TokenPort {
  sign(payload: TokenPayload): string;
  signRefresh(payload: TokenPayload): string;
  verify(token: string): TokenPayload | undefined;
  verifyRefresh(token: string): TokenPayload | undefined;
}
