import type { TokenPayload } from './token.port';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const isTokenPayload = (value: unknown): value is TokenPayload => {
  if (
    !isRecord(value) ||
    typeof value.sub !== 'string' ||
    typeof value.workspaceId !== 'string' ||
    typeof value.role !== 'string' ||
    typeof value.tokenVersion !== 'number' ||
    !Number.isSafeInteger(value.tokenVersion)
  )
    return false;
  return (
    (value.authTime === undefined ||
      (typeof value.authTime === 'number' &&
        Number.isSafeInteger(value.authTime))) &&
    (value.amr === undefined ||
      value.amr === 'password' ||
      value.amr === 'webauthn') &&
    (value.vaultUnlockGrant === undefined ||
      typeof value.vaultUnlockGrant === 'string')
  );
};
