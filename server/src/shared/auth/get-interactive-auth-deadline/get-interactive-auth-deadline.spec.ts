import type { CurrentUserPayload } from '@shared/auth/current-user';
import { getInteractiveAuthDeadline } from '@shared/auth/get-interactive-auth-deadline';
describe('server-owned interactive authorization deadline', () => {
  it('should derive a deadline from fresh authenticated claims', () => {
    const user: CurrentUserPayload = {
      userId: 'user',
      workspaceId: 'workspace',
      role: 'Member',
      authTime: Date.now(),
      amr: 'password',
    };
    expect(getInteractiveAuthDeadline(user)).toBe(
      (user.authTime ?? 0) + 300_000,
    );
    expect(() =>
      getInteractiveAuthDeadline({ ...user, authTime: Date.now() - 301_000 }),
    ).toThrow('step-up-required');
    expect(() =>
      getInteractiveAuthDeadline({ ...user, authTime: undefined }),
    ).toThrow('step-up-required');
  });
});
