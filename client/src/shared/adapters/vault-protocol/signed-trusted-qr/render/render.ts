import QRCode from 'qrcode';

import type {
  SignedTrustedRequest,
  SignedTrustedResponse,
} from '#shared/adapters/vault-protocol/signed-trusted-enrollment';
import { parseSignedTrustedQr } from '#shared/adapters/vault-protocol/signed-trusted-qr/parse';

export const renderSignedTrustedQr = async (
  value: SignedTrustedRequest | SignedTrustedResponse,
): Promise<string> => {
  const text = JSON.stringify(value);
  parseSignedTrustedQr(text);
  return QRCode.toString(text, {
    type: 'svg',
    errorCorrectionLevel: 'M',
    margin: 4,
  });
};
