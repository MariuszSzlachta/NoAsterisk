import { DomainError } from '@budget/domain';
import { InviteCodeStatus } from './invite-code-status.enum';

export class InviteCode {
  constructor(
    readonly id: string,
    readonly code: string,
    readonly createdBy: string,
    readonly status: InviteCodeStatus,
    readonly createdAt: Date,
    readonly expiresAt: Date | undefined,
    readonly usedBy: string | undefined,
    readonly usedAt: Date | undefined,
  ) {
    if (!id) throw new DomainError('InviteCode ID is required');
    if (!code || code.length < 6)
      throw new DomainError('InviteCode must be at least 6 characters');
    if (!createdBy) throw new DomainError('InviteCode createdBy is required');
  }

  static create(props: { createdBy: string; expiresAt?: Date }): InviteCode {
    const code = crypto
      .randomUUID()
      .replace(/-/g, '')
      .substring(0, 8)
      .toUpperCase();
    return new InviteCode(
      crypto.randomUUID(),
      code,
      props.createdBy,
      InviteCodeStatus.Available,
      new Date(),
      props.expiresAt,
      undefined,
      undefined,
    );
  }

  redeem(userId: string): InviteCode {
    if (this.status !== InviteCodeStatus.Available) {
      throw new DomainError('Invite code is not available');
    }
    if (this.expiresAt && this.expiresAt < new Date()) {
      throw new DomainError('Invite code has expired');
    }
    return new InviteCode(
      this.id,
      this.code,
      this.createdBy,
      InviteCodeStatus.Used,
      this.createdAt,
      this.expiresAt,
      userId,
      new Date(),
    );
  }

  isAvailable(): boolean {
    if (this.status !== InviteCodeStatus.Available) return false;
    if (this.expiresAt && this.expiresAt < new Date()) return false;
    return true;
  }

  assignUser(userId: string): InviteCode {
    return new InviteCode(
      this.id,
      this.code,
      this.createdBy,
      this.status,
      this.createdAt,
      this.expiresAt,
      userId,
      this.usedAt,
    );
  }
}
