import { UnauthorizedException } from '@nestjs/common';
import { assertFreshInteractiveAuth } from '@auth/application/auth-freshness';

describe('assertFreshInteractiveAuth', () => {
  it('accepts a recent interactive authentication', () => {
    expect(() => {
      assertFreshInteractiveAuth(
        {
          userId: 'user',
          workspaceId: 'workspace',
          role: 'member',
          authTime: 1000,
          amr: 'password',
        },
        1001,
      );
    }).not.toThrow();
  });

  it('rejects missing, stale and future authentication timestamps', () => {
    const base = { userId: 'user', workspaceId: 'workspace', role: 'member' };
    expect(() => {
      assertFreshInteractiveAuth(base, 1000);
    }).toThrow(UnauthorizedException);
    expect(() => {
      assertFreshInteractiveAuth(
        { ...base, authTime: 0, amr: 'password' },
        5 * 60 * 1000 + 1,
      );
    }).toThrow('step-up-required');
    expect(() => {
      assertFreshInteractiveAuth(
        { ...base, authTime: 2000, amr: 'password' },
        1000,
      );
    }).toThrow('step-up-required');
  });
});
