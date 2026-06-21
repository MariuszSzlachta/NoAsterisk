import { Injectable, Inject } from '@nestjs/common';
import {
  CATEGORIZATION_RULE_REPOSITORY,
  CategorizationRuleRepository,
} from '@categorization-rules/application/ports/categorization-rule.repository';
import {
  TRANSACTION_REPOSITORY,
  TransactionRepository,
} from '@transactions/application/ports/transaction.repository';

export interface AutoCategorizeCommand {
  workspaceId: string;
  batchId?: string;
}

export interface AutoCategorizeResult {
  categorized: number;
  total: number;
}

@Injectable()
export class AutoCategorizeHandler {
  constructor(
    @Inject(CATEGORIZATION_RULE_REPOSITORY)
    private readonly ruleRepo: CategorizationRuleRepository,
    @Inject(TRANSACTION_REPOSITORY)
    private readonly transactionRepo: TransactionRepository,
  ) {}

  async execute(command: AutoCategorizeCommand): Promise<AutoCategorizeResult> {
    const [rules, allUncategorized] = await Promise.all([
      this.ruleRepo.findByWorkspaceId(command.workspaceId),
      this.transactionRepo.findUncategorized(command.workspaceId),
    ]);

    const transactions = command.batchId
      ? allUncategorized.filter((t) => t.importBatchId === command.batchId)
      : allUncategorized;

    if (rules.length === 0 || transactions.length === 0) {
      return { categorized: 0, total: transactions.length };
    }

    const sortedRules = [...rules].sort((a, b) => b.priority - a.priority);
    let categorized = 0;

    for (const transaction of transactions) {
      const matchingRule = sortedRules.find((r) =>
        r.matches(transaction.description),
      );
      if (matchingRule) {
        const updated = transaction.assignCategory(matchingRule.categoryId);
        await this.transactionRepo.save(updated);
        categorized++;
      }
    }

    return { categorized, total: transactions.length };
  }
}
