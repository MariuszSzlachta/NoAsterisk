import { encryptedPersistence } from '#shared/adapters/persistence';
import { deviceSigningKey } from '#shared/adapters/vault-protocol/device-signing-key';
import {
  trustedDeviceEnrollment,
  type EnrollmentContext,
  type TrustedDeviceRequest,
  type TrustedDeviceResponse,
} from '#shared/adapters/vault-protocol/trusted-device-enrollment';

const createApproval = async (
  request: TrustedDeviceRequest,
  context: EnrollmentContext,
): Promise<TrustedDeviceResponse> => {
  if (
    request.accountId !== context.accountId ||
    request.workspaceId !== context.workspaceId ||
    request.vaultId !== context.vaultId ||
    request.keyId !== context.keyId ||
    request.oldDeviceId !== context.oldDeviceId
  )
    throw new Error('Trusted-device request context mismatch');
  const material = encryptedPersistence.getVaultTransferMaterial({
    accountId: context.accountId,
    workspaceId: context.workspaceId,
    vaultId: context.vaultId,
    keyId: context.keyId,
    deviceId: context.oldDeviceId,
  });
  try {
    const signingPublicKey = await deviceSigningKey.exportPublicJwk(
      material.signingPublicKey,
    );
    return await trustedDeviceEnrollment.createResponse(
      request,
      material.vmk,
      { privateKey: material.signingKey, publicKey: material.signingPublicKey },
      signingPublicKey,
    );
  } finally {
    material.vmk.fill(0);
  }
};

const restoreApproval = async (
  response: TrustedDeviceResponse,
  request: TrustedDeviceRequest,
  privateKey: CryptoKey,
  expectedSigningPublicKey: JsonWebKey,
): Promise<Uint8Array> =>
  trustedDeviceEnrollment.decryptResponse(
    response,
    request,
    privateKey,
    expectedSigningPublicKey,
  );

export const trustedDeviceTransfer = Object.freeze({
  createApproval,
  restoreApproval,
});
