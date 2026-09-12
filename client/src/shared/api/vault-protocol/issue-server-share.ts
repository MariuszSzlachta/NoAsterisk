import { apiClient } from '#shared/api';

interface ServerShareResponse {
  readonly serverShare: string;
  readonly expiresAt: string;
}

const SERVER_SHARE_BYTES = 32;
const SERVER_SHARE_BASE64_LENGTH = 44;

const isResponse = (value: unknown): value is ServerShareResponse =>
  typeof value === 'object' &&
  value !== null &&
  'serverShare' in value &&
  typeof value.serverShare === 'string' &&
  value.serverShare.length === SERVER_SHARE_BASE64_LENGTH &&
  'expiresAt' in value &&
  typeof value.expiresAt === 'string';

const decodeShare = (encoded: string): Uint8Array<ArrayBuffer> => {
  if (
    !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(
      encoded,
    )
  )
    throw new Error('Invalid ServerShare response');
  const decoded = atob(encoded);
  const bytes = new Uint8Array(new ArrayBuffer(decoded.length));
  decoded.split('').forEach((character, index) => {
    bytes[index] = character.charCodeAt(0);
  });
  if (bytes.length !== SERVER_SHARE_BYTES)
    throw new Error('Invalid ServerShare response');
  return bytes;
};

export const issueServerShare = async (
  deviceId: string,
): Promise<Uint8Array<ArrayBuffer>> => {
  if (deviceId.length === 0) throw new Error('Device ID cannot be empty');
  const response = await apiClient.post<unknown, { readonly deviceId: string }>(
    '/users/me/vault/server-share',
    { deviceId },
  );
  if (!isResponse(response)) throw new Error('Invalid ServerShare response');
  return decodeShare(response.serverShare);
};
