import { describe, expect, it } from 'vitest';

import { assertEnrollmentInitializationCurrent } from '#app/routing/useVaultUnlock/enroll-vmk/assert-initialization-current';

describe('assertEnrollmentInitializationCurrent', () => {
  it('requires both the initiating flow and native initialized session to remain current', () => {
    expect(() =>
      assertEnrollmentInitializationCurrent(
        () => {},
        () => true,
      ),
    ).not.toThrow();
    expect(() =>
      assertEnrollmentInitializationCurrent(
        () => {
          throw new Error('Cancelled');
        },
        () => true,
      ),
    ).toThrow('Cancelled');
    expect(() =>
      assertEnrollmentInitializationCurrent(
        () => {},
        () => false,
      ),
    ).toThrow('invalidated');
  });
});
