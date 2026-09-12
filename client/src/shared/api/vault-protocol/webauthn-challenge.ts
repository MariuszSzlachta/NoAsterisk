import { apiClient } from '#shared/api';

interface ChallengeResponse {
  readonly challenge: string;
  readonly expiresAt: string;
  readonly type: 'authentication';
  readonly userVerification: 'required';
}

const isChallengeResponse = (value: unknown): value is ChallengeResponse =>
  typeof value === 'object' &&
  value !== null &&
  'challenge' in value &&
  typeof value.challenge === 'string' &&
  'expiresAt' in value &&
  typeof value.expiresAt === 'string' &&
  'type' in value &&
  value.type === 'authentication' &&
  'userVerification' in value &&
  value.userVerification === 'required';

const decodeChallenge = (value: string): Uint8Array<ArrayBuffer> => {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) throw new Error('Invalid WebAuthn challenge');
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  let decoded: string;
  try {
    decoded = atob(padded);
  } catch {
    throw new Error('Invalid WebAuthn challenge');
  }
  const bytes = new Uint8Array(new ArrayBuffer(decoded.length));
  decoded.split('').forEach((character, index) => {
    bytes[index] = character.charCodeAt(0);
  });
  if (bytes.length !== 32) throw new Error('Invalid WebAuthn challenge');
  return bytes;
};

const createAuthenticationChallengeRecord = async (
  vaultId: string,
  deviceId: string,
): Promise<{ readonly encoded: string; readonly bytes: Uint8Array<ArrayBuffer> }> => {
  const response = await apiClient.post<unknown, {
    readonly vaultId: string;
    readonly deviceId: string;
    readonly type: 'authentication';
  }>('/users/me/vault/webauthn/challenge', {
    vaultId,
    deviceId,
    type: 'authentication',
  });
  if (!isChallengeResponse(response)) throw new Error('Invalid WebAuthn challenge');
  return { encoded: response.challenge, bytes: decodeChallenge(response.challenge) };
};

const createAuthenticationChallenge = async (
  vaultId: string,
  deviceId: string,
): Promise<Uint8Array<ArrayBuffer>> =>
  (await createAuthenticationChallengeRecord(vaultId, deviceId)).bytes;

export const webauthnChallenge = Object.freeze({
  createAuthenticationChallenge,
  createAuthenticationChallengeRecord,
});
