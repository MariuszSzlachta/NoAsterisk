import { UnauthorizedException } from '@nestjs/common';
import { assertFreshVaultUnlockGrant } from '@shared/auth/assert-fresh-vault-unlock-grant';
import { interactiveAuthMaxAgeMs } from '@shared/auth/interactive-auth-window';
import { buildCurrentUser } from '@shared/auth/testing/build-current-user';

describe('assertFreshVaultUnlockGrant', () => {
  it('should require both a grant and fresh authentication', () => {
    const user = buildCurrentUser({ vaultUnlockGrant: 'test-grant' });
    expect(() => {
      assertFreshVaultUnlockGrant(user, 1001);
    }).not.toThrow();
    expect(() => {
      assertFreshVaultUnlockGrant(user, 1001 + interactiveAuthMaxAgeMs);
    }).toThrow(UnauthorizedException);
  });
  it.each([undefined, ''])(
    'should reject a missing grant=%s',
    (vaultUnlockGrant) => {
      expect(() => {
        assertFreshVaultUnlockGrant(
          buildCurrentUser({ vaultUnlockGrant }),
          1001,
        );
      }).toThrow(UnauthorizedException);
    },
  );
});
