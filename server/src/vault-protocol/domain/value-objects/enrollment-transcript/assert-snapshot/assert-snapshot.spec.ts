import { DomainError } from '@budget/domain';
import { assertEnrollmentTranscriptSnapshot } from '@vault-protocol/domain/value-objects/enrollment-transcript/assert-snapshot';
import { buildEnrollmentTranscript } from '@vault-protocol/testing/build-enrollment-transcript';

describe('enrollment transcript invariants', () => {
  it.each([
    { accountId: '' },
    { workspaceId: 'a'.repeat(129) },
    { signingPublicKey: '{}'.repeat(5_001) },
    { deviceEnvelope: '' },
    { passkeyEnvelope: '' },
    { challenge: `${'A'.repeat(43)}\n` },
    { recoveryPublicKey: 'A'.repeat(64) },
    { recoveryPublicKey: `${'a'.repeat(64)}\n` },
    { createdAt: -1, expiresAt: 59_999 },
    { expiresAt: 61_001 },
    { createdAt: Number.NaN },
    { createdAt: 8_640_000_000_000_000, expiresAt: 8_640_000_000_060_000 },
  ])('should reject invalid rehydrated data: %j', (changed) => {
    expect(() => {
      assertEnrollmentTranscriptSnapshot({
        ...buildEnrollmentTranscript(),
        ...changed,
      });
    }).toThrow(DomainError);
  });

  it('should reject self-approval and malformed delegation binding', () => {
    const snapshot = buildEnrollmentTranscript();
    expect(() => {
      assertEnrollmentTranscriptSnapshot({
        ...snapshot,
        purpose: 'trusted',
        oldDeviceId: snapshot.deviceId,
        newEphemeralPublicKey: '{}',
        delegationDigest: 'b'.repeat(64),
      });
    }).toThrow(DomainError);
    expect(() => {
      assertEnrollmentTranscriptSnapshot({
        ...snapshot,
        purpose: 'trusted',
        oldDeviceId: 'approver',
        newEphemeralPublicKey: '{}',
        delegationDigest: 'not-a-digest',
      });
    }).toThrow(DomainError);
  });
});
