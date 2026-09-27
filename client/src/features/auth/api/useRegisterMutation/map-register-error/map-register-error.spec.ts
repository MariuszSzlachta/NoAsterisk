import { describe, expect, it } from 'vitest';

import { ApiError } from '#shared/api';

import { mapRegisterError } from './map-register-error';

describe('mapRegisterError', () => {
  it.each([
    ['Registration failed', 'auth.register.emailConflict'],
    ['Invite code is required', 'auth.register.invalidInviteCode'],
    ['Invalid invite code', 'auth.register.invalidInviteCode'],
    ['Validation failed', 'auth.register.validationFailed'],
  ])('maps a known bad-request message', (message, expected) => {
    expect(
      mapRegisterError(new ApiError('Bad request', 400, { message })),
    ).toBe(expected);
  });

  it.each([
    new Error('Network error'),
    new ApiError('Server error', 500),
    new ApiError('Bad request', 400, null),
    new ApiError('Bad request', 400, { message: 'Unknown' }),
  ])('uses the generic message for an unsupported error', (error) => {
    expect(mapRegisterError(error)).toBe('auth.register.genericError');
  });
});
