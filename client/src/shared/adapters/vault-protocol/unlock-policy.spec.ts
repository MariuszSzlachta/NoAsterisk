import { describe, expect, it } from 'vitest';

import { unlockPolicy } from '#shared/adapters/vault-protocol/unlock-policy';

describe('vault unlock policy', () => {
  it('prefers PRF in standard mode only after credential-specific confirmation', () => {
    expect(unlockPolicy.chooseMethod('standard', true)).toBe('prf');
    expect(unlockPolicy.chooseMethod('standard', false)).toBe('split');
  });

  it('fails closed in high-security mode when PRF is unavailable or cancelled', () => {
    expect(() => unlockPolicy.chooseMethod('high-security', false)).toThrow(
      'requires confirmed passkey PRF',
    );
    expect(unlockPolicy.chooseMethod('high-security', true)).toBe('prf');
  });
});
