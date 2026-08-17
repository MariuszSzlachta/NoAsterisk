import { describe, it, expect } from 'vitest';
import { Budget } from '#domain/budget/budget.entity';
import { BudgetPeriod } from '#domain/budget/budget-period.vo';

const validProps = {
  workspaceId: 'ws-001',
  name: 'Zakupy spożywcze',
  color: '#34d399',
  limitAmount: 2000,
  limitCurrency: 'PLN',
  period: { type: 'monthly' } as BudgetPeriod,
  categoryIds: ['cat-1', 'cat-2'],
};

const defaultConstructorArgs = {
  id: 'id-1',
  workspaceId: 'ws-001',
  name: 'Zakupy',
  color: '#34d399',
  limitAmount: 2000,
  limitCurrency: 'PLN',
  period: { type: 'monthly' } as BudgetPeriod,
  categoryIds: ['cat-1'] as readonly string[],
  createdAt: new Date('2026-01-01'),
  isArchived: false,
};

const buildBudget = (overrides?: Partial<typeof defaultConstructorArgs>): Budget =>
  new Budget(
    overrides?.id ?? defaultConstructorArgs.id,
    overrides?.workspaceId ?? defaultConstructorArgs.workspaceId,
    overrides?.name ?? defaultConstructorArgs.name,
    overrides?.color ?? defaultConstructorArgs.color,
    overrides?.limitAmount ?? defaultConstructorArgs.limitAmount,
    overrides?.limitCurrency ?? defaultConstructorArgs.limitCurrency,
    overrides?.period ?? defaultConstructorArgs.period,
    overrides?.categoryIds ?? defaultConstructorArgs.categoryIds,
    overrides?.createdAt ?? defaultConstructorArgs.createdAt,
    overrides?.isArchived ?? defaultConstructorArgs.isArchived,
  );

describe('Budget', () => {
  describe('create', () => {
    it('creates a valid budget with all fields', () => {
      const budget = Budget.create(validProps);

      expect(budget.id).toBeDefined();
      expect(budget.workspaceId).toBe('ws-001');
      expect(budget.name).toBe('Zakupy spożywcze');
      expect(budget.color).toBe('#34d399');
      expect(budget.limitAmount).toBe(2000);
      expect(budget.limitCurrency).toBe('PLN');
      expect(budget.period).toEqual({ type: 'monthly' });
      expect(budget.categoryIds).toEqual(['cat-1', 'cat-2']);
      expect(budget.createdAt).toBeInstanceOf(Date);
      expect(budget.isArchived).toBe(false);
    });

    it('creates budget with empty categoryIds by default', () => {
      const { categoryIds: _, ...propsWithoutCategories } = validProps;
      const budget = Budget.create(propsWithoutCategories);

      expect(budget.categoryIds).toEqual([]);
    });

    it('trims name on create', () => {
      const budget = Budget.create({ ...validProps, name: '  Zakupy  ' });

      expect(budget.name).toBe('Zakupy');
    });

    it('uppercases currency on create', () => {
      const budget = Budget.create({ ...validProps, limitCurrency: 'pln' });

      expect(budget.limitCurrency).toBe('PLN');
    });

    it('generates unique IDs', () => {
      const budget1 = Budget.create(validProps);
      const budget2 = Budget.create(validProps);

      expect(budget1.id).not.toBe(budget2.id);
    });
  });

  describe('constructor invariants', () => {
    it('throws when id is empty', () => {
      expect(() => buildBudget({ id: '' })).toThrow('Budget ID cannot be empty');
    });

    it('throws when workspaceId is empty', () => {
      expect(() => buildBudget({ workspaceId: '' })).toThrow('Budget workspaceId cannot be empty');
    });

    it('throws when name is empty', () => {
      expect(() => buildBudget({ name: '' })).toThrow('Budget name cannot be empty');
    });

    it('throws when name is whitespace only', () => {
      expect(() => buildBudget({ name: '   ' })).toThrow('Budget name cannot be empty');
    });

    it('throws when name exceeds 100 characters', () => {
      expect(() => buildBudget({ name: 'a'.repeat(101) })).toThrow('Budget name cannot exceed 100 characters');
    });

    it('throws when color is empty', () => {
      expect(() => buildBudget({ color: '' })).toThrow('Budget color cannot be empty');
    });

    it('throws when limit amount is negative', () => {
      expect(() => buildBudget({ limitAmount: -100 })).toThrow('Budget limit amount cannot be negative');
    });

    it('allows zero limit amount', () => {
      const budget = buildBudget({ limitAmount: 0 });
      expect(budget.limitAmount).toBe(0);
    });

    it('throws when currency is not 3 letters', () => {
      expect(() => buildBudget({ limitCurrency: 'PL' })).toThrow('Budget limit currency must be a 3-letter code');
    });

    it('throws when custom period dateFrom >= dateTo', () => {
      const invalidPeriod: BudgetPeriod = {
        type: 'custom',
        dateFrom: new Date('2026-07-01'),
        dateTo: new Date('2026-06-01'),
      };
      expect(() => buildBudget({ period: invalidPeriod })).toThrow('Budget custom period dateFrom must be before dateTo');
    });

    it('accepts valid custom period', () => {
      const customPeriod: BudgetPeriod = {
        type: 'custom',
        dateFrom: new Date('2026-07-01'),
        dateTo: new Date('2026-08-31'),
      };
      const budget = buildBudget({ period: customPeriod });
      expect(budget.period).toEqual(customPeriod);
    });
  });

  describe('rename', () => {
    it('returns new budget with updated name', () => {
      const budget = Budget.create(validProps);
      const renamed = budget.rename('Nowa nazwa');

      expect(renamed.name).toBe('Nowa nazwa');
      expect(renamed.id).toBe(budget.id);
      expect(renamed.workspaceId).toBe(budget.workspaceId);
      expect(renamed.color).toBe(budget.color);
      expect(renamed.limitAmount).toBe(budget.limitAmount);
      expect(renamed.period).toEqual(budget.period);
      expect(renamed.categoryIds).toEqual(budget.categoryIds);
      expect(renamed.createdAt).toBe(budget.createdAt);
      expect(renamed.isArchived).toBe(budget.isArchived);
    });

    it('throws when new name is empty', () => {
      const budget = Budget.create(validProps);
      expect(() => budget.rename('')).toThrow('Budget name cannot be empty');
    });
  });

  describe('updateLimit', () => {
    it('returns new budget with updated limit', () => {
      const budget = Budget.create(validProps);
      const updated = budget.updateLimit(3000, 'EUR');

      expect(updated.limitAmount).toBe(3000);
      expect(updated.limitCurrency).toBe('EUR');
      expect(updated.id).toBe(budget.id);
      expect(updated.name).toBe(budget.name);
    });

    it('throws when new limit is negative', () => {
      const budget = Budget.create(validProps);
      expect(() => budget.updateLimit(-500, 'PLN')).toThrow('Budget limit amount cannot be negative');
    });

    it('throws when new currency is invalid', () => {
      const budget = Budget.create(validProps);
      expect(() => budget.updateLimit(3000, 'AB')).toThrow('Budget limit currency must be a 3-letter code');
    });
  });

  describe('changePeriod', () => {
    it('returns new budget with updated period', () => {
      const budget = Budget.create(validProps);
      const updated = budget.changePeriod({ type: 'yearly' });

      expect(updated.period).toEqual({ type: 'yearly' });
      expect(updated.id).toBe(budget.id);
      expect(updated.name).toBe(budget.name);
    });

    it('throws when custom period is invalid', () => {
      const budget = Budget.create(validProps);
      const invalidPeriod: BudgetPeriod = {
        type: 'custom',
        dateFrom: new Date('2026-12-01'),
        dateTo: new Date('2026-01-01'),
      };
      expect(() => budget.changePeriod(invalidPeriod)).toThrow('Budget custom period dateFrom must be before dateTo');
    });
  });

  describe('changeColor', () => {
    it('returns new budget with updated color', () => {
      const budget = Budget.create(validProps);
      const updated = budget.changeColor('#ff0000');

      expect(updated.color).toBe('#ff0000');
      expect(updated.id).toBe(budget.id);
      expect(updated.name).toBe(budget.name);
    });

    it('throws when color is empty', () => {
      const budget = Budget.create(validProps);
      expect(() => budget.changeColor('')).toThrow('Budget color cannot be empty');
    });
  });

  describe('updateCategoryIds', () => {
    it('returns new budget with updated category IDs', () => {
      const budget = Budget.create(validProps);
      const updated = budget.updateCategoryIds(['cat-3', 'cat-4']);

      expect(updated.categoryIds).toEqual(['cat-3', 'cat-4']);
      expect(updated.id).toBe(budget.id);
    });

    it('allows empty category IDs', () => {
      const budget = Budget.create(validProps);
      const updated = budget.updateCategoryIds([]);

      expect(updated.categoryIds).toEqual([]);
    });
  });

  describe('archive', () => {
    it('returns new budget with isArchived = true', () => {
      const budget = Budget.create(validProps);
      const archived = budget.archive();

      expect(archived.isArchived).toBe(true);
      expect(archived.id).toBe(budget.id);
      expect(archived.name).toBe(budget.name);
    });

    it('returns same instance if already archived', () => {
      const budget = Budget.create(validProps);
      const archived = budget.archive();
      const archivedAgain = archived.archive();

      expect(archivedAgain).toBe(archived);
    });
  });

  describe('unarchive', () => {
    it('returns new budget with isArchived = false', () => {
      const budget = Budget.create(validProps).archive();
      const unarchived = budget.unarchive();

      expect(unarchived.isArchived).toBe(false);
      expect(unarchived.id).toBe(budget.id);
    });

    it('returns same instance if not archived', () => {
      const budget = Budget.create(validProps);
      const unarchived = budget.unarchive();

      expect(unarchived).toBe(budget);
    });
  });
});
