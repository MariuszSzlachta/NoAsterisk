import { deviceSigningKey } from '#shared/adapters/vault-protocol/device-signing-key';
import { encodeEnrollmentDelegation } from '#shared/adapters/vault-protocol/enrollment-transcript';
import { signEnrollmentDeviceMessage } from '#shared/adapters/vault-protocol/enrollment-transcript/sign-device-message';
import { parseSignedTrustedRequest } from '#shared/adapters/vault-protocol/signed-trusted-enrollment/parse-request';
import type {
  SignedTrustedRequest,
  SignedTrustedResponse,
} from '#shared/adapters/vault-protocol/signed-trusted-enrollment/types';
import { trustedDeviceEnrollment } from '#shared/adapters/vault-protocol/trusted-device-enrollment';

export const createSignedTrustedFixture = async () => {
  const context = {
    accountId: 'account',
    workspaceId: 'workspace',
    vaultId: 'vault',
    keyId: 'key',
    oldDeviceId: 'approver',
    newDeviceId: 'device',
  };
  const transfer = await trustedDeviceEnrollment.createRequest(context);
  const signing = await deviceSigningKey.generate();
  const approving = await deviceSigningKey.generate();
  const approvingPublicKey = await deviceSigningKey.exportPublicJwk(
    approving.publicKey,
  );
  const createdAt = Date.now();
  const request: SignedTrustedRequest = parseSignedTrustedRequest({
    kind: 'budgetflow/trusted-device-qr-v2',
    formatVersion: 2,
    intent: {
      purpose: 'trusted',
      accountId: context.accountId,
      workspaceId: context.workspaceId,
      vaultId: context.vaultId,
      keyId: context.keyId,
      deviceId: context.newDeviceId,
      oldDeviceId: context.oldDeviceId,
      challenge: 'A'.repeat(43),
      createdAt,
      expiresAt: createdAt + 60_000,
      signingPublicKey: JSON.stringify(
        await deviceSigningKey.exportPublicJwk(signing.publicKey),
      ),
      newEphemeralPublicKey: JSON.stringify(
        transfer.request.newEphemeralPublicKey,
      ),
      delegationDigest: '0'.repeat(64),
      deviceEnvelope: '{}',
    },
    transferRequest: { ...transfer.request, requestId: 'A'.repeat(43) },
  });
  const vmk = new Uint8Array(32).fill(42);
  const response: SignedTrustedResponse = {
    kind: request.kind,
    formatVersion: request.formatVersion,
    intent: request.intent,
    delegationSignature: await signEnrollmentDeviceMessage(
      approving.privateKey,
      encodeEnrollmentDelegation(request.intent),
    ),
    transferResponse: await trustedDeviceEnrollment.createResponse(
      request.transferRequest,
      vmk,
      approving,
      approvingPublicKey,
    ),
  };
  return {
    request,
    response,
    vmk,
    privateKey: transfer.privateKey,
    signing,
    approving,
    approvingPublicKey,
  };
};
