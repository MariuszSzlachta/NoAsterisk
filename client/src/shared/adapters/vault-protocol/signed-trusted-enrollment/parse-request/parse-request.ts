import { signedTrustedRequestSchema } from '#shared/adapters/vault-protocol/signed-trusted-enrollment/parse-request/schema';
import type { SignedTrustedRequest } from '#shared/adapters/vault-protocol/signed-trusted-enrollment/types';
import { trustedDeviceEnrollment } from '#shared/adapters/vault-protocol/trusted-device-enrollment';

export const parseSignedTrustedRequest = (
  value: unknown,
): SignedTrustedRequest => {
  const parsed = signedTrustedRequestSchema.safeParse(value);
  if (!parsed.success || parsed.data.intent.purpose !== 'trusted')
    throw new Error('Invalid trusted-device request');
  const intent = parsed.data.intent;
  const transferRequest = trustedDeviceEnrollment.parseRequest(
    parsed.data.transferRequest,
  );
  if (
    transferRequest.accountId !== intent.accountId ||
    transferRequest.workspaceId !== intent.workspaceId ||
    transferRequest.vaultId !== intent.vaultId ||
    transferRequest.keyId !== intent.keyId ||
    transferRequest.newDeviceId !== intent.deviceId ||
    transferRequest.oldDeviceId !== intent.oldDeviceId ||
    transferRequest.requestId !== intent.challenge ||
    JSON.stringify(transferRequest.newEphemeralPublicKey) !==
      intent.newEphemeralPublicKey
  )
    throw new Error('Trusted-device request context mismatch');
  return {
    kind: parsed.data.kind,
    formatVersion: parsed.data.formatVersion,
    intent,
    transferRequest,
  };
};
