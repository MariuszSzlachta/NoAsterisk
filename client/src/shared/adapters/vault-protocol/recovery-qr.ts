import QRCode from 'qrcode';

const RECOVERY_CODE_PATTERN = /^[0-9a-f]{72}$/i;

/**
 * Creates a transient SVG representation of a validated recovery code.
 *
 * The recovery code is intentionally accepted only in its canonical format.
 * This keeps the QR payload deterministic and prevents arbitrary text from
 * entering the recovery UI. The caller owns the returned SVG and must not
 * persist, log or transmit it.
 */
const render = async (code: string): Promise<string> => {
  if (!RECOVERY_CODE_PATTERN.test(code))
    throw new Error('Invalid recovery code');

  return QRCode.toString(code, {
    type: 'svg',
    errorCorrectionLevel: 'H',
    margin: 1,
  });
};

export const recoveryQr = Object.freeze({ render });
