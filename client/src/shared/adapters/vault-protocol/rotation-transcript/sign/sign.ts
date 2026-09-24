import { signEnrollmentDeviceMessage } from '#shared/adapters/vault-protocol/enrollment-transcript/sign-device-message';
import { signRecoveryMessage } from '#shared/adapters/vault-protocol/recovery-authority/sign';
import { encodeRotationTranscript } from '#shared/adapters/vault-protocol/rotation-transcript/encode';
import type { SignedRotationTranscript } from '#shared/adapters/vault-protocol/rotation-transcript/sign/types';
import type { RotationTranscriptSnapshot } from '#shared/adapters/vault-protocol/rotation-transcript/types';
import { bytesToHex } from '#shared/lib/bytes-to-hex';

export const signRotationTranscript = async (
  snapshot: RotationTranscriptSnapshot,
  signingKey: CryptoKey,
  recoverySeed: Uint8Array,
): Promise<SignedRotationTranscript> => {
  const message = encodeRotationTranscript(snapshot);
  const ownedMessage = message.slice();
  try {
    const deviceSignature = await signEnrollmentDeviceMessage(
      signingKey,
      ownedMessage,
    );
    const recoverySignature = bytesToHex(
      signRecoveryMessage(recoverySeed, ownedMessage),
    );
    return { deviceSignature, recoverySignature };
  } finally {
    ownedMessage.fill(0);
  }
};
