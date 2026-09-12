import { DomainError } from '@budget/domain';
import { EnrollmentTranscript } from '@vault-protocol/domain/value-objects/enrollment-transcript';
import type { EnrollmentTranscriptSnapshot } from '@vault-protocol/domain/value-objects/enrollment-transcript';
import { buildEnrollmentTranscript } from '@vault-protocol/testing/build-enrollment-transcript';

describe('enrollment authorization transcript', () => {
  it('should separate initial authorization from recovery authorization', () => {
    const snapshot = buildEnrollmentTranscript();
    expect(
      new EnrollmentTranscript({
        ...snapshot,
        purpose: 'initial',
      }).toFinalizeSigningBytes(),
    ).not.toEqual(new EnrollmentTranscript(snapshot).toFinalizeSigningBytes());
  });
  it('should freeze the exact recovery-finalize byte vector without JWK or envelope normalization', () => {
    const transcript = new EnrollmentTranscript(buildEnrollmentTranscript());
    expect(new TextDecoder().decode(transcript.toFinalizeSigningBytes())).toBe(
      '["budgetflow/enrollment-finalize/v2",2,"HKDF-SHA256/AES-256-GCM","recovery","account","workspace","vault","key","device","AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA","1970-01-01T00:01:01.000Z","{\\"public\\":\\"signing\\"}",null,null,"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","{\\"ciphertext\\":\\"device\\"}",null]',
    );
    expect(() => transcript.toDelegationSigningBytes()).toThrow(DomainError);
  });

  it.each([
    { accountId: 'other' },
    { workspaceId: 'other' },
    { vaultId: 'other' },
    { keyId: 'other' },
    { deviceId: 'other' },
    { challenge: 'B'.repeat(43) },
    { signingPublicKey: '{"public":"other"}' },
    { recoveryPublicKey: 'b'.repeat(64) },
    { deviceEnvelope: '{"ciphertext":"other"}' },
    { passkeyEnvelope: '{"ciphertext":"passkey"}' },
    { createdAt: 2_000, expiresAt: 62_000 },
  ])('should bind every authorization field: %j', (changed) => {
    const snapshot = buildEnrollmentTranscript();
    const original = new EnrollmentTranscript(snapshot);
    const replacement = new EnrollmentTranscript({ ...snapshot, ...changed });
    expect(replacement.toFinalizeSigningBytes()).not.toEqual(
      original.toFinalizeSigningBytes(),
    );
  });

  it('should delegate exact new keys but leave final envelopes for the new device signature', () => {
    const context: EnrollmentTranscriptSnapshot = {
      ...buildEnrollmentTranscript(),
      purpose: 'trusted',
      oldDeviceId: 'approver',
      newEphemeralPublicKey: '{"public":"ephemeral"}',
      delegationDigest: 'b'.repeat(64),
    };
    const original = new EnrollmentTranscript(context);
    const replacement = new EnrollmentTranscript({
      ...context,
      deviceEnvelope: '{"ciphertext":"changed"}',
    });
    expect(replacement.toDelegationSigningBytes()).toEqual(
      original.toDelegationSigningBytes(),
    );
    expect(replacement.toFinalizeSigningBytes()).not.toEqual(
      original.toFinalizeSigningBytes(),
    );
    expect(new TextDecoder().decode(original.toDelegationSigningBytes())).toBe(
      '["budgetflow/enrollment-delegation/v2",2,"HKDF-SHA256/AES-256-GCM","account","workspace","vault","key","device","AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA","1970-01-01T00:01:01.000Z","approver","{\\"public\\":\\"signing\\"}","{\\"public\\":\\"ephemeral\\"}"]',
    );
  });

  it('should reject wrong ownership and enforce expiry inclusively at its boundary', () => {
    const snapshot = buildEnrollmentTranscript();
    const transcript = new EnrollmentTranscript(snapshot);
    expect(() => {
      transcript.assertScope(snapshot);
    }).not.toThrow();
    expect(() => {
      transcript.assertScope({ ...snapshot, workspaceId: 'other' });
    }).toThrow(DomainError);
    expect(() => {
      transcript.assertLive(1_000);
    }).not.toThrow();
    expect(() => {
      transcript.assertLive(60_999);
    }).not.toThrow();
    expect(() => {
      transcript.assertLive(999);
    }).toThrow(DomainError);
    expect(() => {
      transcript.assertLive(61_000);
    }).toThrow(DomainError);
    expect(() => {
      transcript.assertLive(Number.NaN);
    }).toThrow(DomainError);
  });

  it('should reject signed-byte expansion beyond the crypto boundary even when string lengths fit', () => {
    expect(
      () =>
        new EnrollmentTranscript({
          ...buildEnrollmentTranscript(),
          deviceEnvelope: '\\'.repeat(20_000),
          passkeyEnvelope: '\\'.repeat(20_000),
        }),
    ).toThrow(DomainError);
  });
});
