import { DomainError } from '#domain/shared/domain-error';
import { generateId } from '#domain/shared/identifier';

export class Category {
  constructor(
    public readonly id: string,
    public readonly workspaceId: string,
    public readonly name: string,
    public readonly createdAt: Date,
  ) {
    if (!id) {
      throw new DomainError('Category ID cannot be empty');
    }
    if (!workspaceId) {
      throw new DomainError('Category workspaceId cannot be empty');
    }
    if (!name.trim()) {
      throw new DomainError('Category name cannot be empty');
    }
    if (name.length > 100) {
      throw new DomainError('Category name cannot exceed 100 characters');
    }
  }

  static create(props: { workspaceId: string; name: string }): Category {
    return new Category(generateId(), props.workspaceId, props.name, new Date());
  }

  rename(name: string): Category {
    return new Category(this.id, this.workspaceId, name, this.createdAt);
  }
}
