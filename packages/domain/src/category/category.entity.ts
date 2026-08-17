import { DomainError } from '#domain/shared/domain-error';
import { generateId } from '#domain/shared/identifier';

export class Category {
  constructor(
    public readonly id: string,
    public readonly workspaceId: string,
    public readonly name: string,
    public readonly createdAt: Date,
    public readonly color?: string | undefined,
    public readonly icon?: string | undefined,
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
    if (color !== undefined && !color.trim()) {
      throw new DomainError('Category color cannot be empty');
    }
    if (icon !== undefined && !icon.trim()) {
      throw new DomainError('Category icon cannot be empty');
    }
  }

  static create(props: {
    workspaceId: string;
    name: string;
    color?: string;
    icon?: string;
  }): Category {
    return new Category(
      generateId(),
      props.workspaceId,
      props.name,
      new Date(),
      props.color,
      props.icon,
    );
  }

  rename(name: string): Category {
    return new Category(this.id, this.workspaceId, name, this.createdAt, this.color, this.icon);
  }

  changeColor(color: string | undefined): Category {
    return new Category(this.id, this.workspaceId, this.name, this.createdAt, color, this.icon);
  }

  changeIcon(icon: string | undefined): Category {
    return new Category(this.id, this.workspaceId, this.name, this.createdAt, this.color, icon);
  }
}
