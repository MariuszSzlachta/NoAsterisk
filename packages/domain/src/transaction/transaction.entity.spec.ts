import { describe, it, expect } from 'vitest';
import { Transaction, TransactionType } from '#domain/transaction/transaction.entity';
import { Money } from '#domain/transaction/money.vo';
import { DomainError } from '#domain/shared/domain-error';

describe('Transaction', () => {
  const validProps = {
    id: 'tx-001',
    workspaceId: 'ws-001',
    accountId: 'acc-001',
    money: Money.of(100, 'PLN'),
    type: TransactionType.Expense,
    categoryIds: ['cat-1'],
    description: 'Zakupy BIEDRONKA',
    date: new Date('2026-01-15'),
    createdAt: new Date('2026-01-15T10:00:00Z'),
    contentHash: undefined as string | undefined,
    importBatchId: undefined as string | undefined,
    balance: undefined as number | undefined,
    budgetId: undefined as string | undefined,
  };

  const buildTransaction = (overrides?: Partial<typeof validProps>): Transaction =>
    new Transaction(
      overrides?.id ?? validProps.id,
      overrides?.workspaceId ?? validProps.workspaceId,
      overrides?.accountId ?? validProps.accountId,
      overrides?.money ?? validProps.money,
      overrides?.type ?? validProps.type,
      overrides?.categoryIds ?? validProps.categoryIds,
      overrides?.description ?? validProps.description,
      overrides?.date ?? validProps.date,
      overrides?.createdAt ?? validProps.createdAt,
      'contentHash' in (overrides ?? {}) ? overrides?.contentHash : validProps.contentHash,
      'importBatchId' in (overrides ?? {}) ? overrides?.importBatchId : validProps.importBatchId,
      'balance' in (overrides ?? {}) ? overrides?.balance : validProps.balance,
      'budgetId' in (overrides ?? {}) ? overrides?.budgetId : validProps.budgetId,
    );

  describe('constructor invariants', () => {
    it('throws when id is empty', () => {
      expect(() => buildTransaction({ id: '' })).toThrow(DomainError);
    });

    it('throws when workspaceId is empty', () => {
      expect(() => buildTransaction({ workspaceId: '' })).toThrow(DomainError);
    });

    it('throws when accountId is empty', () => {
      expect(() => buildTransaction({ accountId: '' })).toThrow(DomainError);
    });

    it('throws when type is invalid', () => {
      expect(() => buildTransaction({ type: 'INVALID' as TransactionType })).toThrow(DomainError);
    });

    it('throws when adjustment has categories', () => {
      expect(() => buildTransaction({
        type: TransactionType.Adjustment,
        categoryIds: ['cat-1'],
      })).toThrow(DomainError);
    });

    it('allows adjustment with empty categories', () => {
      const tx = buildTransaction({
        type: TransactionType.Adjustment,
        categoryIds: [],
      });
      expect(tx.type).toBe(TransactionType.Adjustment);
      expect(tx.categoryIds).toEqual([]);
    });

    it('throws when budgetId is empty string', () => {
      expect(() => buildTransaction({ budgetId: '' })).toThrow(DomainError);
    });

    it('accepts undefined budgetId', () => {
      const tx = buildTransaction({ budgetId: undefined });
      expect(tx.budgetId).toBeUndefined();
    });

    it('creates valid instance with all fields', () => {
      const tx = buildTransaction();
      expect(tx.id).toBe('tx-001');
      expect(tx.workspaceId).toBe('ws-001');
      expect(tx.accountId).toBe('acc-001');
      expect(tx.money.amount).toBe(100);
      expect(tx.money.currency).toBe('PLN');
      expect(tx.type).toBe(TransactionType.Expense);
      expect(tx.categoryIds).toEqual(['cat-1']);
      expect(tx.description).toBe('Zakupy BIEDRONKA');
    });

    it('accepts optional contentHash, importBatchId, and balance', () => {
      const tx = new Transaction(
        'tx-1', 'ws-1', 'acc-1', Money.of(50, 'PLN'), TransactionType.Income,
        [], 'desc', new Date(), new Date(), 'hash-123', 'batch-456', 1234.56,
      );
      expect(tx.contentHash).toBe('hash-123');
      expect(tx.importBatchId).toBe('batch-456');
      expect(tx.balance).toBe(1234.56);
    });
  });

  describe('create', () => {
    it('generates UUID and sets createdAt', () => {
      const tx = Transaction.create({
        workspaceId: 'ws-1',
        accountId: 'acc-1',
        amount: 250,
        currency: 'PLN',
        type: TransactionType.Expense,
        categoryIds: [],
        description: 'Test',
        date: new Date('2026-06-01'),
      });

      expect(tx.id).toBeDefined();
      expect(tx.id.length).toBeGreaterThan(0);
      expect(tx.workspaceId).toBe('ws-1');
      expect(tx.accountId).toBe('acc-1');
      expect(tx.money.amount).toBe(250);
      expect(tx.money.currency).toBe('PLN');
      expect(tx.createdAt).toBeInstanceOf(Date);
    });

    it('passes contentHash, importBatchId, and balance', () => {
      const tx = Transaction.create({
        workspaceId: 'ws-1',
        accountId: 'acc-1',
        amount: 100,
        currency: 'EUR',
        type: TransactionType.Income,
        categoryIds: [],
        description: 'Salary',
        date: new Date(),
        contentHash: 'abc',
        importBatchId: 'batch-1',
        balance: 5000,
      });

      expect(tx.contentHash).toBe('abc');
      expect(tx.importBatchId).toBe('batch-1');
      expect(tx.balance).toBe(5000);
    });

    it('creates adjustment transaction', () => {
      const tx = Transaction.create({
        workspaceId: 'ws-1',
        accountId: 'acc-1',
        amount: 54.33,
        currency: 'PLN',
        type: TransactionType.Adjustment,
        categoryIds: [],
        description: 'Korekta salda',
        date: new Date(),
      });

      expect(tx.type).toBe(TransactionType.Adjustment);
      expect(tx.isAdjustment()).toBe(true);
    });
  });

  describe('update', () => {
    const tx = buildTransaction();

    it('updates amount and currency', () => {
      const updated = tx.update({ amount: 200, currency: 'EUR' });
      expect(updated.money.amount).toBe(200);
      expect(updated.money.currency).toBe('EUR');
    });

    it('updates only amount, preserves currency', () => {
      const updated = tx.update({ amount: 300 });
      expect(updated.money.amount).toBe(300);
      expect(updated.money.currency).toBe('PLN');
    });

    it('updates type', () => {
      const updated = tx.update({ type: TransactionType.Income });
      expect(updated.type).toBe(TransactionType.Income);
    });

    it('updates categoryIds', () => {
      const updated = tx.update({ categoryIds: ['cat-2', 'cat-3'] });
      expect(updated.categoryIds).toEqual(['cat-2', 'cat-3']);
    });

    it('updates description', () => {
      const updated = tx.update({ description: 'New desc' });
      expect(updated.description).toBe('New desc');
    });

    it('updates date', () => {
      const newDate = new Date('2026-06-15');
      const updated = tx.update({ date: newDate });
      expect(updated.date).toEqual(newDate);
    });

    it('preserves all other fields when updating partially', () => {
      const updated = tx.update({ description: 'Changed' });
      expect(updated.id).toBe(tx.id);
      expect(updated.workspaceId).toBe(tx.workspaceId);
      expect(updated.accountId).toBe(tx.accountId);
      expect(updated.money).toBe(tx.money);
      expect(updated.type).toBe(tx.type);
      expect(updated.categoryIds).toBe(tx.categoryIds);
      expect(updated.date).toBe(tx.date);
      expect(updated.createdAt).toBe(tx.createdAt);
      expect(updated.contentHash).toBe(tx.contentHash);
      expect(updated.importBatchId).toBe(tx.importBatchId);
      expect(updated.balance).toBe(tx.balance);
    });

    it('returns new instance (immutable)', () => {
      const updated = tx.update({ description: 'Changed' });
      expect(updated).not.toBe(tx);
      expect(tx.description).toBe('Zakupy BIEDRONKA');
    });
  });

  describe('assignCategory', () => {
    it('adds category to categoryIds', () => {
      const tx = buildTransaction({ categoryIds: ['cat-1'] });
      const updated = tx.assignCategory('cat-2');
      expect(updated.categoryIds).toEqual(['cat-1', 'cat-2']);
    });

    it('returns same instance when category already exists (idempotent)', () => {
      const tx = buildTransaction({ categoryIds: ['cat-1'] });
      const updated = tx.assignCategory('cat-1');
      expect(updated).toBe(tx);
    });

    it('returns new instance when category is new', () => {
      const tx = buildTransaction({ categoryIds: [] });
      const updated = tx.assignCategory('cat-1');
      expect(updated).not.toBe(tx);
    });
  });

  describe('removeCategory', () => {
    it('removes category from categoryIds', () => {
      const tx = buildTransaction({ categoryIds: ['cat-1', 'cat-2'] });
      const updated = tx.removeCategory('cat-1');
      expect(updated.categoryIds).toEqual(['cat-2']);
    });

    it('returns same instance when category not present (idempotent)', () => {
      const tx = buildTransaction({ categoryIds: ['cat-1'] });
      const updated = tx.removeCategory('cat-nonexistent');
      expect(updated).toBe(tx);
    });
  });

  describe('hasCategory', () => {
    it('returns true when transaction has the category', () => {
      const tx = buildTransaction({ categoryIds: ['cat-1', 'cat-2'] });
      expect(tx.hasCategory('cat-1')).toBe(true);
    });

    it('returns false when transaction does not have the category', () => {
      const tx = buildTransaction({ categoryIds: ['cat-1'] });
      expect(tx.hasCategory('cat-99')).toBe(false);
    });
  });

  describe('isExpense / isIncome / isAdjustment', () => {
    it('isExpense returns true for Expense type', () => {
      const tx = buildTransaction({ type: TransactionType.Expense });
      expect(tx.isExpense()).toBe(true);
      expect(tx.isIncome()).toBe(false);
      expect(tx.isAdjustment()).toBe(false);
    });

    it('isIncome returns true for Income type', () => {
      const tx = buildTransaction({ type: TransactionType.Income });
      expect(tx.isIncome()).toBe(true);
      expect(tx.isExpense()).toBe(false);
      expect(tx.isAdjustment()).toBe(false);
    });

    it('isAdjustment returns true for Adjustment type', () => {
      const tx = buildTransaction({
        type: TransactionType.Adjustment,
        categoryIds: [],
      });
      expect(tx.isAdjustment()).toBe(true);
      expect(tx.isExpense()).toBe(false);
      expect(tx.isIncome()).toBe(false);
    });
  });

  describe('assignBudget', () => {
    it('assigns budgetId to transaction', () => {
      const tx = buildTransaction();
      const updated = tx.assignBudget('budget-1');

      expect(updated.budgetId).toBe('budget-1');
    });

    it('returns same instance when same budgetId already assigned (idempotent)', () => {
      const tx = buildTransaction({ budgetId: 'budget-1' });
      const updated = tx.assignBudget('budget-1');

      expect(updated).toBe(tx);
    });

    it('replaces existing budgetId with new one', () => {
      const tx = buildTransaction({ budgetId: 'budget-1' });
      const updated = tx.assignBudget('budget-2');

      expect(updated.budgetId).toBe('budget-2');
      expect(updated).not.toBe(tx);
    });

    it('throws when budgetId is empty', () => {
      const tx = buildTransaction();
      expect(() => tx.assignBudget('')).toThrow('Budget ID cannot be empty');
    });

    it('preserves all other fields', () => {
      const tx = buildTransaction({ contentHash: 'hash-1', importBatchId: 'batch-1', balance: 500 });
      const updated = tx.assignBudget('budget-1');

      expect(updated.id).toBe(tx.id);
      expect(updated.workspaceId).toBe(tx.workspaceId);
      expect(updated.accountId).toBe(tx.accountId);
      expect(updated.money).toBe(tx.money);
      expect(updated.type).toBe(tx.type);
      expect(updated.categoryIds).toBe(tx.categoryIds);
      expect(updated.description).toBe(tx.description);
      expect(updated.date).toBe(tx.date);
      expect(updated.createdAt).toBe(tx.createdAt);
      expect(updated.contentHash).toBe('hash-1');
      expect(updated.importBatchId).toBe('batch-1');
      expect(updated.balance).toBe(500);
    });
  });

  describe('removeBudget', () => {
    it('removes budgetId from transaction', () => {
      const tx = buildTransaction({ budgetId: 'budget-1' });
      const updated = tx.removeBudget();

      expect(updated.budgetId).toBeUndefined();
    });

    it('returns same instance when no budgetId assigned (idempotent)', () => {
      const tx = buildTransaction();
      const updated = tx.removeBudget();

      expect(updated).toBe(tx);
    });

    it('preserves all other fields', () => {
      const tx = buildTransaction({ contentHash: 'hash-1', importBatchId: 'batch-1', balance: 500, budgetId: 'budget-1' });
      const updated = tx.removeBudget();

      expect(updated.id).toBe(tx.id);
      expect(updated.workspaceId).toBe(tx.workspaceId);
      expect(updated.accountId).toBe(tx.accountId);
      expect(updated.money).toBe(tx.money);
      expect(updated.contentHash).toBe('hash-1');
      expect(updated.importBatchId).toBe('batch-1');
      expect(updated.balance).toBe(500);
    });
  });

  describe('hasBudget', () => {
    it('returns true when budgetId is set', () => {
      const tx = buildTransaction({ budgetId: 'budget-1' });
      expect(tx.hasBudget()).toBe(true);
    });

    it('returns false when budgetId is undefined', () => {
      const tx = buildTransaction();
      expect(tx.hasBudget()).toBe(false);
    });
  });

  describe('budgetId propagation in existing methods', () => {
    const txWithBudget = buildTransaction({
      contentHash: 'hash-1',
      importBatchId: 'batch-1',
      balance: 500,
      budgetId: 'budget-1',
    });

    it('update() preserves budgetId', () => {
      const updated = txWithBudget.update({ description: 'New desc' });
      expect(updated.budgetId).toBe('budget-1');
    });

    it('assignCategory() preserves budgetId', () => {
      const updated = txWithBudget.assignCategory('cat-2');
      expect(updated.budgetId).toBe('budget-1');
    });

    it('removeCategory() preserves budgetId', () => {
      const updated = txWithBudget.removeCategory('cat-1');
      expect(updated.budgetId).toBe('budget-1');
    });
  });

  describe('create with budgetId', () => {
    it('creates transaction with budgetId', () => {
      const tx = Transaction.create({
        workspaceId: 'ws-1',
        accountId: 'acc-1',
        amount: 100,
        currency: 'PLN',
        type: TransactionType.Expense,
        categoryIds: [],
        description: 'Test',
        date: new Date(),
        budgetId: 'budget-1',
      });

      expect(tx.budgetId).toBe('budget-1');
    });

    it('creates transaction without budgetId (undefined)', () => {
      const tx = Transaction.create({
        workspaceId: 'ws-1',
        accountId: 'acc-1',
        amount: 100,
        currency: 'PLN',
        type: TransactionType.Expense,
        categoryIds: [],
        description: 'Test',
        date: new Date(),
      });

      expect(tx.budgetId).toBeUndefined();
    });
  });
});
