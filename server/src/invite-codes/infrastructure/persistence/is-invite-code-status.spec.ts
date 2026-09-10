import { InviteCodeStatus } from '@invite-codes/domain/invite-code-status.enum';
import { isInviteCodeStatus } from '@invite-codes/infrastructure/persistence/is-invite-code-status';

describe('isInviteCodeStatus', () => {
  it('recognizes every persisted status', () => {
    expect(isInviteCodeStatus(InviteCodeStatus.Available)).toBe(true);
    expect(isInviteCodeStatus(InviteCodeStatus.Used)).toBe(true);
    expect(isInviteCodeStatus(InviteCodeStatus.Expired)).toBe(true);
  });

  it('rejects unknown statuses', () => {
    expect(isInviteCodeStatus('Revoked')).toBe(false);
  });
});
