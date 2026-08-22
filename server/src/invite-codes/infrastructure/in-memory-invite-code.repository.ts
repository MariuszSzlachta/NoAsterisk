import { Injectable } from '@nestjs/common';
import { InviteCode } from '@invite-codes/domain/invite-code.entity';
import { InviteCodeRepository } from '@invite-codes/domain/ports/invite-code.repository';

@Injectable()
export class InMemoryInviteCodeRepository implements InviteCodeRepository {
  private readonly store = new Map<string, InviteCode>();

  async save(code: InviteCode): Promise<InviteCode> {
    this.store.set(code.id, code);
    return code;
  }

  async findById(id: string): Promise<InviteCode | undefined> {
    return this.store.get(id);
  }

  async findByCode(code: string): Promise<InviteCode | undefined> {
    return [...this.store.values()].find((c) => c.code === code);
  }

  async findAll(): Promise<ReadonlyArray<InviteCode>> {
    return [...this.store.values()];
  }

  async delete(id: string): Promise<void> {
    this.store.delete(id);
  }

  clear(): void {
    this.store.clear();
  }
}
