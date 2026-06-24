import { DomainError } from '@shared/domain/domain.error';
import { UserRole } from './user-role.enum';

export class User {
  constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly passwordHash: string,
    public readonly role: UserRole,
    public readonly workspaceId: string,
    public readonly createdAt: Date,
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

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
  }
}
