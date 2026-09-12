import { createPublicKey } from 'node:crypto';
import { publicDeviceKeySchema } from '@vault-protocol/infrastructure/adapters/public-device-key-schema';
import { publicEphemeralKeySchema } from '@vault-protocol/infrastructure/adapters/public-ephemeral-key-schema';
import type { SignedEnrollmentInput } from '@vault-protocol/domain/entities/signed-enrollment';
import { DomainError } from '@budget/domain';

export const validateEnrollmentPublicKeys = (
  input: SignedEnrollmentInput,
): void => {
  try {
    const signing: unknown = JSON.parse(input.signingPublicKey);
    const parsed = publicDeviceKeySchema.safeParse(signing);
    if (!parsed.success) throw new DomainError('Enrollment unavailable');
    createPublicKey({ key: parsed.data, format: 'jwk' });
    if (input.purpose !== 'trusted') return;
    const ephemeral: unknown = JSON.parse(input.newEphemeralPublicKey);
    const publicKey = publicEphemeralKeySchema.safeParse(ephemeral);
    if (!publicKey.success) throw new DomainError('Enrollment unavailable');
    createPublicKey({ key: publicKey.data, format: 'jwk' });
  } catch {
    throw new DomainError('Enrollment unavailable');
  }
};
