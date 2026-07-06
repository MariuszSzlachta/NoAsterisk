import { AutoCategorizeHandler } from '@categorization-rules/application/commands/auto-categorize.handler';
import { CategorizationRuleRepository } from '@categorization-rules/application/ports/categorization-rule.repository';
import { TransactionRepository } from '@transactions/application/ports/transaction.repository';
import {
  CategorizationRule,
  MatcherType,
  Transaction,
  TransactionType,
  Money,
} from '@budget/domain';

const TEST_WORKSPACE_ID = 'ws-1';
const TEST_ACCOUNT_ID = 'acc-001';

const buildRule = (
  keyword: string,
  categoryId: string,
  priority = 0,
): CategorizationRule =>
  new CategorizationRule(
    `r-${keyword}`,
    TEST_WORKSPACE_ID,
    keyword,
    categoryId,
    MatcherType.Contains,
    priority,
    new Date(),
  );

const buildTransaction = (id: string, description: string): Transaction =>
  new Transaction(
    id,
    TEST_WORKSPACE_ID,
    TEST_ACCOUNT_ID,
    Money.of(100, 'PLN'),
    TransactionType.Expense,
    [],
    description,
    new Date(),
    new Date(),
  );

describe('AutoCategorizeHandler', () => {
  let handler: AutoCategorizeHandler;
  let ruleRepo: jest.Mocked<
    Pick<CategorizationRuleRepository, 'findByWorkspaceId'>
  >;
  let transactionRepo: jest.Mocked<
    Pick<TransactionRepository, 'findUncategorized' | 'saveMany'>
  >;

  beforeEach(() => {
    ruleRepo = { findByWorkspaceId: jest.fn() };
    transactionRepo = {
      findUncategorized: jest.fn(),
      saveMany: jest.fn().mockResolvedValue(undefined),
    };
    handler = new AutoCategorizeHandler(
      ruleRepo as unknown as CategorizationRuleRepository,
      transactionRepo as unknown as TransactionRepository,
    );
  });

  afterEach(() => jest.clearAllMocks());

  it('categorizes transactions matching rules', async () => {
    ruleRepo.findByWorkspaceId.mockResolvedValue([
      buildRule('BIEDRONKA', 'cat-groceries', 1),
    ]);
    transactionRepo.findUncategorized.mockResolvedValue([
      buildTransaction('tx-1', 'Zakupy BIEDRONKA'),
    ]);

    const result = await handler.execute({ workspaceId: TEST_WORKSPACE_ID });

    expect(result).toEqual({ categorized: 1, total: 1 });
    expect(transactionRepo.saveMany).toHaveBeenCalledTimes(1);
  });

  it('applies highest priority rule first', async () => {
    ruleRepo.findByWorkspaceId.mockResolvedValue([
      buildRule('BIEDRONKA', 'cat-low', 1),
      buildRule('BIEDRONKA', 'cat-high', 10),
    ]);
    transactionRepo.findUncategorized.mockResolvedValue([
      buildTransaction('tx-1', 'BIEDRONKA zakupy'),
    ]);

    await handler.execute({ workspaceId: TEST_WORKSPACE_ID });

    const saved = transactionRepo.saveMany.mock.calls[0]?.[0] as Transaction[];
    expect(saved[0]?.categoryIds).toContain('cat-high');
  });

  it('skips transactions with no matching rule', async () => {
    ruleRepo.findByWorkspaceId.mockResolvedValue([
      buildRule('LIDL', 'cat-groceries'),
    ]);
    transactionRepo.findUncategorized.mockResolvedValue([
      buildTransaction('tx-1', 'NETFLIX subscription'),
    ]);

    const result = await handler.execute({ workspaceId: TEST_WORKSPACE_ID });

    expect(result).toEqual({ categorized: 0, total: 1 });
    expect(transactionRepo.saveMany).not.toHaveBeenCalled();
  });

  it('returns zero when no rules exist', async () => {
    ruleRepo.findByWorkspaceId.mockResolvedValue([]);
    transactionRepo.findUncategorized.mockResolvedValue([
      buildTransaction('tx-1', 'something'),
    ]);

    const result = await handler.execute({ workspaceId: TEST_WORKSPACE_ID });

    expect(result).toEqual({ categorized: 0, total: 1 });
  });

  it('returns zero when no uncategorized transactions', async () => {
    ruleRepo.findByWorkspaceId.mockResolvedValue([buildRule('X', 'cat-1')]);
    transactionRepo.findUncategorized.mockResolvedValue([]);

    const result = await handler.execute({ workspaceId: TEST_WORKSPACE_ID });

    expect(result).toEqual({ categorized: 0, total: 0 });
  });
});
