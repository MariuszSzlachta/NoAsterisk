import { describe, expect, it } from 'vitest';

import { recoveryRegistrationSchema } from '#shared/adapters/vault-protocol/recovery-registration/schema';
import { buildRecoveryRegistrationIntent } from '#shared/adapters/vault-protocol/recovery-registration/testing/build-intent';

describe('recoveryRegistrationSchema', () => {
  it('should accept only the public registration contract', () => {
    expect(
      recoveryRegistrationSchema.safeParse(buildRecoveryRegistrationIntent())
        .success,
    ).toBe(true);
    expect(
      recoveryRegistrationSchema.safeParse({
        ...buildRecoveryRegistrationIntent(),
        recoverySeed: 'secret',
      }).success,
    ).toBe(false);
    expect(
      recoveryRegistrationSchema.safeParse(
        buildRecoveryRegistrationIntent({
          recoveryPublicKey: 'a'.repeat(63) + '\n',
        }),
      ).success,
    ).toBe(false);
  });
});
