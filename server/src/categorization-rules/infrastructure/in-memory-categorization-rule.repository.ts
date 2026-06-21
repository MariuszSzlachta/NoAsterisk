import { Injectable } from '@nestjs/common';
import { CategorizationRule } from '@categorization-rules/domain/categorization-rule.entity';
import { CategorizationRuleRepository } from '@categorization-rules/application/ports/categorization-rule.repository';

@Injectable()
export class InMemoryCategorizationRuleRepository implements CategorizationRuleRepository {
  private readonly store = new Map<string, CategorizationRule>();

  async save(rule: CategorizationRule): Promise<CategorizationRule> {
    this.store.set(rule.id, rule);
    return rule;
  }

  async findById(id: string): Promise<CategorizationRule | undefined> {
    return this.store.get(id);
  }

  async findByWorkspaceId(workspaceId: string): Promise<CategorizationRule[]> {
    return [...this.store.values()].filter(
      (r) => r.workspaceId === workspaceId,
    );
  }

  async delete(id: string): Promise<void> {
    this.store.delete(id);
  }
}
