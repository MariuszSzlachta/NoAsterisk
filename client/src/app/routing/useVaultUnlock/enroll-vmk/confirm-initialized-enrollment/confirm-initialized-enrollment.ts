import { hydrateFinancialStores } from '#app/providers/hydrate-financial-stores';
import { completeEnrollmentRestore } from '#app/routing/useVaultUnlock/complete-enrollment-restore';
import { assertEnrollmentInitializationCurrent } from '#app/routing/useVaultUnlock/enroll-vmk/assert-initialization-current';
import {
  encodeEnrollmentConfirmation,
  type EnrollmentTranscriptSnapshot,
} from '#shared/adapters/vault-protocol/enrollment-transcript';
import { signEnrollmentDeviceMessage } from '#shared/adapters/vault-protocol/enrollment-transcript/sign-device-message';
import { vaultEnrollment } from '#shared/api/vault-protocol/vault-enrollment';

export const confirmInitializedEnrollment = async (
  transcript: EnrollmentTranscriptSnapshot,
  digest: string,
  signingKey: CryptoKey,
  assertCurrent: () => void,
  isActive: () => boolean,
  restore?: () => Promise<void>,
): Promise<void> => {
  assertEnrollmentInitializationCurrent(assertCurrent, isActive);
  if (restore === undefined) await hydrateFinancialStores(isActive);
  assertEnrollmentInitializationCurrent(assertCurrent, isActive);
  const signature = await signEnrollmentDeviceMessage(
    signingKey,
    encodeEnrollmentConfirmation(transcript, digest),
  );
  assertEnrollmentInitializationCurrent(assertCurrent, isActive);
  await vaultEnrollment.confirm({
    challenge: transcript.challenge,
    deviceId: transcript.deviceId,
    vaultId: transcript.vaultId,
    keyId: transcript.keyId,
    digest,
    signature,
  });
  assertEnrollmentInitializationCurrent(assertCurrent, isActive);
  if (restore !== undefined) {
    await restore();
    assertEnrollmentInitializationCurrent(assertCurrent, isActive);
    await completeEnrollmentRestore(() =>
      assertEnrollmentInitializationCurrent(assertCurrent, isActive),
    );
  }
};
