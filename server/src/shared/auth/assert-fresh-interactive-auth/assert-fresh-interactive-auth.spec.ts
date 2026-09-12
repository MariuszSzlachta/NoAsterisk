import { UnauthorizedException } from '@nestjs/common';
import { assertFreshInteractiveAuth } from '@shared/auth/assert-fresh-interactive-auth';
import { interactiveAuthMaxAgeMs } from '@shared/auth/interactive-auth-window';
import { buildCurrentUser } from '@shared/auth/testing/build-current-user';

describe('assertFreshInteractiveAuth', () => {
  it.each(['password', 'webauthn'])(
    'should accept a fresh %s authentication',
    (amr) => {
      const user = buildCurrentUser({
        amr: amr === 'password' ? 'password' : 'webauthn',
      });
      expect(() => {
        assertFreshInteractiveAuth(user, 1001);
      }).not.toThrow();
      expect(() => {
        assertFreshInteractiveAuth(user, 1000 + interactiveAuthMaxAgeMs);
      }).not.toThrow();
    },
  );
  it.each([undefined, NaN, Infinity, -1, 1000.5, 2000])(
    'should reject invalid or future authTime=%s',
    (authTime) => {
      expect(() => {
        assertFreshInteractiveAuth(buildCurrentUser({ authTime }), 1000);
      }).toThrow(UnauthorizedException);
    },
  );
  it.each([NaN, Infinity, 1000.5])(
    'should reject an invalid clock=%s',
    (now) => {
      expect(() => {
        assertFreshInteractiveAuth(buildCurrentUser(), now);
      }).toThrow(UnauthorizedException);
    },
  );
  it('should reject missing method and expired authentication', () => {
    expect(() => {
      assertFreshInteractiveAuth(buildCurrentUser({ amr: undefined }), 1001);
    }).toThrow(UnauthorizedException);
    expect(() => {
      assertFreshInteractiveAuth(
        buildCurrentUser(),
        1001 + interactiveAuthMaxAgeMs,
      );
    }).toThrow(UnauthorizedException);
  });
});
