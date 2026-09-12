import QRCode from 'qrcode';

import { decodeRecoveryBackup } from '#shared/adapters/vault-protocol/recovery-backup';
import { legacyRecoveryQrPattern } from '#shared/adapters/vault-protocol/recovery-qr/render/legacy-code.pattern';

export const renderRecoveryQr = async (code: string): Promise<string> => {
  if (code.startsWith('BF2:')) {
    const material = await decodeRecoveryBackup(code);
    material.vmk.fill(0);
    material.recoverySeed.fill(0);
  } else if (code.length !== 72 || !legacyRecoveryQrPattern.test(code)) {
    throw new Error('Invalid recovery code');
  }
  return QRCode.toString(code, {
    type: 'svg',
    errorCorrectionLevel: 'H',
    margin: 4,
  });
};
