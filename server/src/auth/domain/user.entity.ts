/**
 * ARCH-EXCEPTION: User remains in server/ (not extracted to packages/domain/).
 * Reason: Auth entities (User, Permission) are server-only infrastructure concerns,
 * not financial domain. They will never be shared with the client package.
 */
import { DomainError } from '@budget/domain';
import { UserRole } from './user-role.enum';
import { DEFAULT_PREFERENCES, UserPreferences } from './user-preferences.vo';

export class User {
  constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly passwordHash: string,
    public readonly role: UserRole,
    public readonly workspaceId: string,
    public readonly createdAt: Date,
    public readonly displayName?: string,
    public readonly preferences: UserPreferences = DEFAULT_PREFERENCES,
  ) {
    if (!id) throw new DomainError('User ID cannot be empty');
    if (!email) throw new DomainError('User email cannot be empty');
    if (!this.isValidEmail(email))
      throw new DomainError('User email is invalid');
    if (!passwordHash)
      throw new DomainError('User passwordHash cannot be empty');
    if (!workspaceId) throw new DomainError('User workspaceId cannot be empty');
  }

  static create(props: {
    email: string;
    passwordHash: string;
    role: UserRole;
    workspaceId: string;
  }): User {
    return new User(
      crypto.randomUUID(),
      props.email,
      props.passwordHash,
      props.role,
      props.workspaceId,
      new Date(),
    );
  }

  isSuperuser(): boolean {
    return this.role === UserRole.Superuser;
  }

  updateDisplayName(name: string): User {
    const trimmed = name.trim();
    if (trimmed.length > 50)
      throw new DomainError('Display name cannot exceed 50 characters');
    return new User(
      this.id,
      this.email,
      this.passwordHash,
      this.role,
      this.workspaceId,
      this.createdAt,
      trimmed || undefined,
      this.preferences,
    );
  }

  changePassword(newPasswordHash: string): User {
    if (!newPasswordHash)
      throw new DomainError('Password hash cannot be empty');
    return new User(
      this.id,
      this.email,
      newPasswordHash,
      this.role,
      this.workspaceId,
      this.createdAt,
      this.displayName,
      this.preferences,
    );
  }

  updatePreferences(partial: Partial<UserPreferences>): User {
    const merged: UserPreferences = { ...this.preferences, ...partial };
    return new User(
      this.id,
      this.email,
      this.passwordHash,
      this.role,
      this.workspaceId,
      this.createdAt,
      this.displayName,
      merged,
    );
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
  }
}
