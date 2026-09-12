import { describe, expect, it } from 'vitest';

import { allowlistedWebauthnDto } from '#shared/adapters/webauthn/allowlisted-webauthn-dto';

describe('allowlisted WebAuthn DTO', () => {
  it('rejects a missing credential before reading any response fields', () => {
    expect(() => allowlistedWebauthnDto.serializeAssertion(null)).toThrow(
      'Invalid WebAuthn credential',
    );
    expect(() => allowlistedWebauthnDto.serializeRegistration(null)).toThrow(
      'Invalid WebAuthn credential',
    );
  });
});
