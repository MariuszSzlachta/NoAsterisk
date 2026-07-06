/**
 * ARCH-EXCEPTION: Workspace remains in server/ (not extracted to packages/domain/).
 * Reason: Workspace is auth/tenant infrastructure, not financial domain.
 * It defines the boundary FOR domain entities but is not a domain entity itself.
 */
import { DomainError } from '@budget/domain';

/**
 * Workspace — top-level tenant boundary.
 * All domain entities (transactions, rules, budgets) belong to a workspace.
 */
export class Workspace {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly createdAt: Date,
  ) {
    if (!id) throw new DomainError('Workspace ID cannot be empty');
    if (!name.trim()) throw new DomainError('Workspace name cannot be empty');
    if (name.length > 100)
      throw new DomainError('Workspace name cannot exceed 100 characters');
  }

  static create(props: { name: string }): Workspace {
    return new Workspace(crypto.randomUUID(), props.name, new Date());
  }
}
