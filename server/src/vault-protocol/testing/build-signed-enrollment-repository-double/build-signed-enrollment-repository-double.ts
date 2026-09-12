import { SignedEnrollment } from '@vault-protocol/domain/entities/signed-enrollment';
import type { SignedEnrollmentRepositoryPort } from '@vault-protocol/domain/ports/signed-enrollment';
import { buildEnrollmentTranscript } from '@vault-protocol/testing/build-enrollment-transcript';

export const buildSignedEnrollmentRepositoryDouble =
  (): SignedEnrollmentRepositoryPort => ({
    prepare: jest.fn(
      async (input) =>
        new SignedEnrollment(
          {
            intent:
              input.purpose === 'trusted'
                ? {
                    ...input,
                    challenge: 'A'.repeat(43),
                    createdAt: 1_000,
                    expiresAt: 61_000,
                    deviceEnvelope: '{}',
                    delegationDigest: '0'.repeat(64),
                  }
                : { ...buildEnrollmentTranscript(), ...input },
            state: { kind: 'pending' },
          },
          new Uint8Array(32),
        ),
    ),
    finalize: jest.fn(async () => undefined),
    confirm: jest.fn(async () => undefined),
  });
