import { deviceSigningKey } from '#shared/adapters/vault-protocol/device-signing-key';
import { encodeEnrollmentDelegation } from '#shared/adapters/vault-protocol/enrollment-transcript';
import { signedTrustedQrFormat } from '#shared/adapters/vault-protocol/signed-trusted-enrollment/constants';
import { parseSignedTrustedResponse } from '#shared/adapters/vault-protocol/signed-trusted-enrollment/parse-response';
import type {
  SignedTrustedRequest,
  SignedTrustedResponse,
} from '#shared/adapters/vault-protocol/signed-trusted-enrollment/types';
import { trustedDeviceEnrollment } from '#shared/adapters/vault-protocol/trusted-device-enrollment';

export const restoreSignedTrustedApproval = async (
  input: SignedTrustedResponse,
  request: SignedTrustedRequest,
  privateKey: CryptoKey,
  expectedSigningPublicKey: JsonWebKey,
): Promise<Uint8Array> => {
  const response = parseSignedTrustedResponse(input);
  if (
    JSON.stringify(response.intent) !== JSON.stringify(request.intent) ||
    Date.now() >= request.intent.expiresAt
  )
    throw new Error('Trusted-device response intent mismatch');
  const signer = await deviceSigningKey.importPublicJwk(
    expectedSigningPublicKey,
  );
  const signature = Uint8Array.from(
    { length: signedTrustedQrFormat.signatureBytes },
    (_, index) => {
      const offset = index * signedTrustedQrFormat.hexByteLength;
      return Number.parseInt(
        response.delegationSignature.slice(
          offset,
          offset + signedTrustedQrFormat.hexByteLength,
        ),
        16,
      );
    },
  );
  if (
    !(await crypto.subtle.verify(
      { name: 'ECDSA', hash: 'SHA-256' },
      signer,
      signature,
      encodeEnrollmentDelegation(request.intent),
    ))
  )
    throw new Error('Trusted-device delegation signature failed');
  const vmk = await trustedDeviceEnrollment.decryptResponse(
    response.transferResponse,
    request.transferRequest,
    privateKey,
    expectedSigningPublicKey,
  );
  if (Date.now() >= request.intent.expiresAt) {
    vmk.fill(0);
    throw new Error('Trusted-device response expired');
  }
  return vmk;
};
