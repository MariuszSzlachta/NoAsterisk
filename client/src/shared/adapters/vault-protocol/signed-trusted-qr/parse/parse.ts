import {
  parseSignedTrustedRequest,
  parseSignedTrustedResponse,
  type SignedTrustedRequest,
  type SignedTrustedResponse,
} from '#shared/adapters/vault-protocol/signed-trusted-enrollment';
import { signedTrustedQrFormat } from '#shared/adapters/vault-protocol/signed-trusted-enrollment/constants';

export const parseSignedTrustedQr = (
  text: string,
): SignedTrustedRequest | SignedTrustedResponse => {
  if (new TextEncoder().encode(text).length > signedTrustedQrFormat.maxBytes)
    throw new Error('Invalid trusted-device QR');
  const value: unknown = JSON.parse(text);
  if (typeof value !== 'object' || value === null || Array.isArray(value))
    throw new Error('Invalid trusted-device QR');
  if ('transferRequest' in value) return parseSignedTrustedRequest(value);
  return parseSignedTrustedResponse(value);
};
