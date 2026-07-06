import { Injectable } from '@nestjs/common';
import { CategorizationRule } from '@budget/domain';
import { CategorizationRuleRepository } from '@categorization-rules/application/ports/categorization-rule.repository';
import {
  PagedResult,
  PageOptions,
} from '@shared/application/types/paged-query.types';

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

  async findPaged(
    workspaceId: string,
    page: PageOptions,
  ): Promise<PagedResult<CategorizationRule>> {
    const all = [...this.store.values()]
      .filter((r) => r.workspaceId === workspaceId)
      .sort((a, b) => b.priority - a.priority);

    const total = all.length;
    const offset = (page.page - 1) * page.limit;
    const data = all.slice(offset, offset + page.limit);

    return {
      data,
      meta: {
        page: page.page,
        limit: page.limit,
        total,
        totalPages: Math.ceil(total / page.limit),
      },
    };
  }

  async delete(id: string): Promise<void> {
    this.store.delete(id);
  }
}
