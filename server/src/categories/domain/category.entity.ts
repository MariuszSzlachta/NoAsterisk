import { DomainError } from '@shared/domain/domain.error';

export class Category {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly createdAt: Date,
  ) {
    if (!id) {
      throw new DomainError('Category ID cannot be empty');
    }
    if (!name.trim()) {
      throw new DomainError('Category name cannot be empty');
    }
    if (name.length > 100) {
      throw new DomainError('Category name cannot exceed 100 characters');
    }
  }

  static create(props: { name: string }): Category {
    return new Category(crypto.randomUUID(), props.name, new Date());
  }

  rename(name: string): Category {
    return new Category(this.id, name, this.createdAt);
  }
}
