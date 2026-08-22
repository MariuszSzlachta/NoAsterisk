import { User } from '@auth/domain/user.entity';

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');

/**
 * User repository port.
 * Email is globally unique (not workspace-scoped) — standard SaaS pattern.
 * A user belongs to exactly one workspace (via workspaceId on entity).
 */
export interface UserRepository {
  save(user: User): Promise<User>;
  findById(id: string): Promise<User | undefined>;
  findByEmail(email: string): Promise<User | undefined>;
  /**
   * ARCH-EXCEPTION: global-scope — Superuser-only admin endpoint.
   * Returns all users across workspaces for platform administration.
   */
  findAll(): Promise<ReadonlyArray<User>>;
  existsByEmail(email: string): Promise<boolean>;
  delete(id: string): Promise<void>;
}
