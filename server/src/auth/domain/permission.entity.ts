import { DomainError } from '@shared/domain/domain.error';

export type ResourceType = 'workspace' | 'sub_budget' | 'account';
export type Action = 'read' | 'write' | 'delete' | 'admin';

export class Permission {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly resourceType: ResourceType,
    public readonly resourceId: string,
    public readonly actions: Action[],
    public readonly createdAt: Date,
  ) {
    if (!id) throw new DomainError('Permission ID cannot be empty');
    if (!userId) throw new DomainError('Permission userId cannot be empty');
    if (!resourceId) throw new DomainError('Permission resourceId cannot be empty');
    if (actions.length === 0) throw new DomainError('Permission must have at least one action');
  }

  static create(props: {
    userId: string;
    resourceType: ResourceType;
    resourceId: string;
    actions: Action[];
  }): Permission {
    return new Permission(
      crypto.randomUUID(),
      props.userId,
      props.resourceType,
      props.resourceId,
      props.actions,
      new Date(),
    );
  }

  hasAction(action: Action): boolean {
    return this.actions.includes(action);
  }
}
