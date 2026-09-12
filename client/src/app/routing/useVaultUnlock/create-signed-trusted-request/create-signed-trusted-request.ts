import { deviceSigningKey } from '#shared/adapters/vault-protocol/device-signing-key';
import { signedTrustedQrFormat } from '#shared/adapters/vault-protocol/signed-trusted-enrollment/constants';
import { parseSignedTrustedRequest } from '#shared/adapters/vault-protocol/signed-trusted-enrollment/parse-request';
import type { SignedTrustedPending } from '#shared/adapters/vault-protocol/signed-trusted-enrollment/types';
import {
  trustedDeviceEnrollment,
  type EnrollmentContext,
} from '#shared/adapters/vault-protocol/trusted-device-enrollment';
import { vaultEnrollment } from '#shared/api/vault-protocol/vault-enrollment';

export const createSignedTrustedRequest = async (
  context: EnrollmentContext,
  assertCurrent: () => void,
): Promise<SignedTrustedPending> => {
  assertCurrent();
  const signingKeyPair = await deviceSigningKey.generate();
  assertCurrent();
  const transfer = await trustedDeviceEnrollment.createRequest(context);
  assertCurrent();
  const signingPublicKey = JSON.stringify(
    await deviceSigningKey.exportPublicJwk(signingKeyPair.publicKey),
  );
  assertCurrent();
  const prepared = await vaultEnrollment.prepare({
    purpose: 'trusted',
    deviceId: context.newDeviceId,
    vaultId: context.vaultId,
    keyId: context.keyId,
    signingPublicKey,
    oldDeviceId: context.oldDeviceId,
    newEphemeralPublicKey: JSON.stringify(
      transfer.request.newEphemeralPublicKey,
    ),
  });
  assertCurrent();
  if (
    prepared.intent.accountId !== context.accountId ||
    prepared.intent.workspaceId !== context.workspaceId
  )
    throw new Error('Enrollment account context mismatch');
  return {
    request: parseSignedTrustedRequest({
      kind: signedTrustedQrFormat.kind,
      formatVersion: signedTrustedQrFormat.version,
      intent: prepared.intent,
      transferRequest: {
        ...transfer.request,
        requestId: prepared.intent.challenge,
      },
    }),
    privateKey: transfer.privateKey,
    signingKeyPair,
    prepared,
  };
};
