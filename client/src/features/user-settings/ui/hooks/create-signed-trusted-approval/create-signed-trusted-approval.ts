import { encryptedPersistence } from '#shared/adapters/persistence';
import { assertVaultSessionCurrent } from '#shared/adapters/persistence/session/assert-vault-session-current';
import { deviceSigningKey } from '#shared/adapters/vault-protocol/device-signing-key';
import { encodeEnrollmentDelegation } from '#shared/adapters/vault-protocol/enrollment-transcript';
import { signEnrollmentDeviceMessage } from '#shared/adapters/vault-protocol/enrollment-transcript/sign-device-message';
import { parseSignedTrustedRequest } from '#shared/adapters/vault-protocol/signed-trusted-enrollment/parse-request';
import type {
  SignedTrustedRequest,
  SignedTrustedResponse,
} from '#shared/adapters/vault-protocol/signed-trusted-enrollment/types';
import { trustedDeviceEnrollment } from '#shared/adapters/vault-protocol/trusted-device-enrollment';

export const createSignedTrustedApproval = async (
  input: SignedTrustedRequest,
): Promise<SignedTrustedResponse> => {
  const request = parseSignedTrustedRequest(input);
  const generation = encryptedPersistence.getGeneration();
  const context = encryptedPersistence.requireVaultSyncMaterial().context;
  const intent = request.intent;
  if (
    intent.accountId !== context.accountId ||
    intent.workspaceId !== context.workspaceId ||
    intent.vaultId !== context.vaultId ||
    intent.keyId !== context.keyId ||
    intent.oldDeviceId !== context.deviceId ||
    Date.now() >= intent.expiresAt
  )
    throw new Error('Trusted-device approval context mismatch');
  const material = encryptedPersistence.getVaultTransferMaterial(context);
  try {
    const publicJwk = await deviceSigningKey.exportPublicJwk(
      material.signingPublicKey,
    );
    assertVaultSessionCurrent(encryptedPersistence, generation, context);
    const delegationSignature = await signEnrollmentDeviceMessage(
      material.signingKey,
      encodeEnrollmentDelegation(intent),
    );
    assertVaultSessionCurrent(encryptedPersistence, generation, context);
    const transferResponse = await trustedDeviceEnrollment.createResponse(
      request.transferRequest,
      material.vmk,
      { privateKey: material.signingKey, publicKey: material.signingPublicKey },
      publicJwk,
    );
    assertVaultSessionCurrent(encryptedPersistence, generation, context);
    if (Date.now() >= intent.expiresAt)
      throw new Error('Trusted-device approval expired');
    return {
      kind: request.kind,
      formatVersion: request.formatVersion,
      intent,
      transferResponse,
      delegationSignature,
    };
  } finally {
    material.vmk.fill(0);
  }
};
