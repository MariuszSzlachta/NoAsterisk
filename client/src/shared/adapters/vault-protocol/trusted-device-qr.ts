import QRCode from 'qrcode';
import type {
  TrustedDeviceRequest,
  TrustedDeviceResponse,
} from '#shared/adapters/vault-protocol/trusted-device-enrollment';

const MAX_QR_TEXT_BYTES = 32_768;

const encode = (value: TrustedDeviceRequest | TrustedDeviceResponse): string => {
  const text = JSON.stringify(value);
  if (new TextEncoder().encode(text).length > MAX_QR_TEXT_BYTES)
    throw new Error('Trusted-device QR payload exceeds protocol limit');
  return text;
};

const render = async (
  value: TrustedDeviceRequest | TrustedDeviceResponse,
): Promise<string> =>
  QRCode.toString(encode(value), {
    type: 'svg',
    errorCorrectionLevel: 'M',
    margin: 1,
  });

const parse = (value: string): unknown => {
  if (
    typeof value !== 'string' ||
    value.length === 0 ||
    new TextEncoder().encode(value).length > MAX_QR_TEXT_BYTES
  )
    throw new Error('Invalid trusted-device QR payload');
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    throw new Error('Invalid trusted-device QR payload');
  }
  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    Array.isArray(parsed) ||
    !('kind' in parsed) ||
    parsed.kind !== 'budgetflow/trusted-device-qr' ||
    !('formatVersion' in parsed) ||
    parsed.formatVersion !== 1
  )
    throw new Error('Invalid trusted-device QR payload');
  return parsed;
};

export const trustedDeviceQr = Object.freeze({ encode, parse, render });
