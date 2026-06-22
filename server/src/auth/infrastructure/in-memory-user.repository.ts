import { Injectable } from '@nestjs/common';
import { User } from '@auth/domain/user.entity';
import { UserRepository } from '@auth/domain/ports/user.repository';

@Injectable()
export class InMemoryUserRepository implements UserRepository {
  private readonly store = new Map<string, User>();

  async save(user: User): Promise<User> {
    this.store.set(user.id, user);
    return user;
  }

  async findById(id: string): Promise<User | undefined> {
    return this.store.get(id);
  }

  async findByEmail(email: string): Promise<User | undefined> {
    return [...this.store.values()].find((u) => u.email === email);
  }

  async existsByEmail(email: string): Promise<boolean> {
    return [...this.store.values()].some((u) => u.email === email);
  }
}
