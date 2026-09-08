/**
 * DEV ONLY — Seed mock data for BudgetsPage testing.
 *
 * Usage (browser console):
 *   1. Import: copy-paste this file's content into console, OR
 *   2. Call: seedBudgets() — then refresh the page
 *
 * OR run from console directly:
 *   seedBudgets()
 */

import type { BudgetRecord } from '#features/budgets/model/types/budget-record';
import type { BudgetPeriodRecord } from '#features/budgets/model/types/budget-period-record';
import { isBudgetRecord } from '#features/budgets/model/is-budget-record';
import type { StoredTransaction } from '#features/transactions/model/types';
import { isStoredTransaction } from '#features/transactions/model/is-stored-transaction';
import { TRANSACTIONS_COLLECTION } from '#shared/adapters/persistence/ports';
import { encryptedPersistence } from '#shared/adapters/persistence/session';

const BUDGET_IDS = {
  groceries: 'b-001-groceries',
  transport: 'b-002-transport',
  subscriptions: 'b-003-subscriptions',
  entertainment: 'b-004-entertainment',
  health: 'b-005-health',
};

const now = new Date();
const year = now.getFullYear();
const month = String(now.getMonth() + 1).padStart(2, '0');

const dateInMonth = (day: number): string =>
  `${year}-${month}-${String(day).padStart(2, '0')}`;

interface SeedBudget {
  readonly id: string;
  readonly workspaceId: string;
  readonly name: string;
  readonly color: string;
  readonly limitAmount: number;
  readonly limitCurrency: string;
  readonly period: BudgetPeriodRecord;
  readonly categoryIds: readonly string[];
  readonly createdAt: string;
  readonly isArchived: boolean;
}

// ─── Budget Records ──────────────────────────────────────────────

const budgets: ReadonlyArray<SeedBudget> = [
  {
    id: BUDGET_IDS.groceries,
    workspaceId: 'default',
    name: 'Jedzenie i spożywcze',
    color: '#22c55e',
    limitAmount: 2500,
    limitCurrency: 'PLN',
    period: { type: 'monthly' },
    categoryIds: ['cat-groceries'],
    createdAt: '2025-01-01T00:00:00.000Z',
    isArchived: false,
  },
  {
    id: BUDGET_IDS.transport,
    workspaceId: 'default',
    name: 'Transport',
    color: '#3b82f6',
    limitAmount: 800,
    limitCurrency: 'PLN',
    period: { type: 'monthly' },
    categoryIds: ['cat-transport'],
    createdAt: '2025-01-01T00:00:00.000Z',
    isArchived: false,
  },
  {
    id: BUDGET_IDS.subscriptions,
    workspaceId: 'default',
    name: 'Subskrypcje',
    color: '#a855f7',
    limitAmount: 350,
    limitCurrency: 'PLN',
    period: { type: 'monthly' },
    categoryIds: ['cat-subscriptions'],
    createdAt: '2025-02-01T00:00:00.000Z',
    isArchived: false,
  },
  {
    id: BUDGET_IDS.entertainment,
    workspaceId: 'default',
    name: 'Rozrywka',
    color: '#f59e0b',
    limitAmount: 600,
    limitCurrency: 'PLN',
    period: { type: 'monthly' },
    categoryIds: ['cat-entertainment'],
    createdAt: '2025-03-01T00:00:00.000Z',
    isArchived: false,
  },
  {
    id: BUDGET_IDS.health,
    workspaceId: 'default',
    name: 'Zdrowie i leki',
    color: '#ef4444',
    limitAmount: 400,
    limitCurrency: 'PLN',
    period: { type: 'monthly' },
    categoryIds: ['cat-health'],
    createdAt: '2025-03-15T00:00:00.000Z',
    isArchived: false,
  },
];

const toSeededBudget = (budget: SeedBudget): BudgetRecord => ({
  ...budget,
  budgetType: 'standard',
});

const seededBudgets: ReadonlyArray<BudgetRecord> = budgets.map(toSeededBudget);

// ─── Transaction Records (assigned to budgets) ───────────────────

const transactions = [
  // Groceries — ~1800 spent (on track, 72%)
  { id: 'tx-b-001', date: dateInMonth(2), description: 'BIEDRONKA KRAKOW', amount: -187.43, currency: 'PLN', budgetId: BUDGET_IDS.groceries, categoryId: 'cat-groceries', contentHash: 'h001', batchId: 'batch-seed', importedAt: now.toISOString() },
  { id: 'tx-b-002', date: dateInMonth(4), description: 'LIDL WIELICKA', amount: -234.12, currency: 'PLN', budgetId: BUDGET_IDS.groceries, categoryId: 'cat-groceries', contentHash: 'h002', batchId: 'batch-seed', importedAt: now.toISOString() },
  { id: 'tx-b-003', date: dateInMonth(7), description: 'ZABKA KROWODRZA', amount: -45.90, currency: 'PLN', budgetId: BUDGET_IDS.groceries, categoryId: 'cat-groceries', contentHash: 'h003', batchId: 'batch-seed', importedAt: now.toISOString() },
  { id: 'tx-b-004', date: dateInMonth(9), description: 'KAUFLAND GALERIA', amount: -312.67, currency: 'PLN', budgetId: BUDGET_IDS.groceries, categoryId: 'cat-groceries', contentHash: 'h004', batchId: 'batch-seed', importedAt: now.toISOString() },
  { id: 'tx-b-005', date: dateInMonth(11), description: 'BIEDRONKA NOWA HUTA', amount: -156.80, currency: 'PLN', budgetId: BUDGET_IDS.groceries, categoryId: 'cat-groceries', contentHash: 'h005', batchId: 'batch-seed', importedAt: now.toISOString() },
  { id: 'tx-b-006', date: dateInMonth(13), description: 'AUCHAN BRONOWICE', amount: -421.34, currency: 'PLN', budgetId: BUDGET_IDS.groceries, categoryId: 'cat-groceries', contentHash: 'h006', batchId: 'batch-seed', importedAt: now.toISOString() },
  { id: 'tx-b-007', date: dateInMonth(15), description: 'ZABKA KAZIMIERZ', amount: -67.20, currency: 'PLN', budgetId: BUDGET_IDS.groceries, categoryId: 'cat-groceries', contentHash: 'h007', batchId: 'batch-seed', importedAt: now.toISOString() },
  { id: 'tx-b-008', date: dateInMonth(16), description: 'LIDL PODGORZE', amount: -298.45, currency: 'PLN', budgetId: BUDGET_IDS.groceries, categoryId: 'cat-groceries', contentHash: 'h008', batchId: 'batch-seed', importedAt: now.toISOString() },

  // Transport — over budget! ~920 spent (115%)
  { id: 'tx-b-010', date: dateInMonth(1), description: 'BOLT PRZEJAZD', amount: -34.50, currency: 'PLN', budgetId: BUDGET_IDS.transport, categoryId: 'cat-transport', contentHash: 'h010', batchId: 'batch-seed', importedAt: now.toISOString() },
  { id: 'tx-b-011', date: dateInMonth(3), description: 'ORLEN PALIWO', amount: -320.00, currency: 'PLN', budgetId: BUDGET_IDS.transport, categoryId: 'cat-transport', contentHash: 'h011', batchId: 'batch-seed', importedAt: now.toISOString() },
  { id: 'tx-b-012', date: dateInMonth(6), description: 'UBER RIDE', amount: -67.80, currency: 'PLN', budgetId: BUDGET_IDS.transport, categoryId: 'cat-transport', contentHash: 'h012', batchId: 'batch-seed', importedAt: now.toISOString() },
  { id: 'tx-b-013', date: dateInMonth(10), description: 'ORLEN MYJNIA + PALIWO', amount: -385.00, currency: 'PLN', budgetId: BUDGET_IDS.transport, categoryId: 'cat-transport', contentHash: 'h013', batchId: 'batch-seed', importedAt: now.toISOString() },
  { id: 'tx-b-014', date: dateInMonth(14), description: 'MPK BILET MIESIĘCZNY', amount: -115.00, currency: 'PLN', budgetId: BUDGET_IDS.transport, categoryId: 'cat-transport', contentHash: 'h014', batchId: 'batch-seed', importedAt: now.toISOString() },

  // Subscriptions — warning zone ~310 spent (88%)
  { id: 'tx-b-020', date: dateInMonth(1), description: 'NETFLIX', amount: -63.00, currency: 'PLN', budgetId: BUDGET_IDS.subscriptions, categoryId: 'cat-subscriptions', contentHash: 'h020', batchId: 'batch-seed', importedAt: now.toISOString() },
  { id: 'tx-b-021', date: dateInMonth(1), description: 'SPOTIFY FAMILY', amount: -34.99, currency: 'PLN', budgetId: BUDGET_IDS.subscriptions, categoryId: 'cat-subscriptions', contentHash: 'h021', batchId: 'batch-seed', importedAt: now.toISOString() },
  { id: 'tx-b-022', date: dateInMonth(3), description: 'CHATGPT PLUS', amount: -99.00, currency: 'PLN', budgetId: BUDGET_IDS.subscriptions, categoryId: 'cat-subscriptions', contentHash: 'h022', batchId: 'batch-seed', importedAt: now.toISOString() },
  { id: 'tx-b-023', date: dateInMonth(5), description: 'GITHUB PRO', amount: -49.00, currency: 'PLN', budgetId: BUDGET_IDS.subscriptions, categoryId: 'cat-subscriptions', contentHash: 'h023', batchId: 'batch-seed', importedAt: now.toISOString() },
  { id: 'tx-b-024', date: dateInMonth(8), description: 'DISNEY PLUS', amount: -37.99, currency: 'PLN', budgetId: BUDGET_IDS.subscriptions, categoryId: 'cat-subscriptions', contentHash: 'h024', batchId: 'batch-seed', importedAt: now.toISOString() },
  { id: 'tx-b-025', date: dateInMonth(10), description: 'YOUTUBE PREMIUM', amount: -25.99, currency: 'PLN', budgetId: BUDGET_IDS.subscriptions, categoryId: 'cat-subscriptions', contentHash: 'h025', batchId: 'batch-seed', importedAt: now.toISOString() },

  // Entertainment — barely started ~120 spent (20%)
  { id: 'tx-b-030', date: dateInMonth(5), description: 'CINEMA CITY BILET', amount: -56.00, currency: 'PLN', budgetId: BUDGET_IDS.entertainment, categoryId: 'cat-entertainment', contentHash: 'h030', batchId: 'batch-seed', importedAt: now.toISOString() },
  { id: 'tx-b-031', date: dateInMonth(12), description: 'EMPIK KSIĄŻKA', amount: -64.90, currency: 'PLN', budgetId: BUDGET_IDS.entertainment, categoryId: 'cat-entertainment', contentHash: 'h031', batchId: 'batch-seed', importedAt: now.toISOString() },

  // Health — moderate ~220 spent (55%)
  { id: 'tx-b-040', date: dateInMonth(3), description: 'APTEKA GEMINI', amount: -87.30, currency: 'PLN', budgetId: BUDGET_IDS.health, categoryId: 'cat-health', contentHash: 'h040', batchId: 'batch-seed', importedAt: now.toISOString() },
  { id: 'tx-b-041', date: dateInMonth(8), description: 'MEDICOVER WIZYTA', amount: -130.00, currency: 'PLN', budgetId: BUDGET_IDS.health, categoryId: 'cat-health', contentHash: 'h041', batchId: 'batch-seed', importedAt: now.toISOString() },
];

// ─── Seed function ───────────────────────────────────────────────

export const seedBudgets = async (): Promise<void> => {
  const budgetRepository = encryptedPersistence.repository<BudgetRecord>(
    'budgets',
    isBudgetRecord,
    (record) => record.id,
  );
  const transactionRepository = encryptedPersistence.repository<StoredTransaction>(
    TRANSACTIONS_COLLECTION,
    isStoredTransaction,
    (record) => record.id,
  );

  if (!encryptedPersistence.isUnlocked()) {
    throw new Error('Unlock the local vault before seeding development data');
  }

  const existingTransactions = await transactionRepository.getAll();
  const cleaned = existingTransactions.filter((tx) => !tx.id.startsWith('tx-b-'));
  await budgetRepository.replace(seededBudgets);
  await transactionRepository.replace([...cleaned, ...transactions]);

  console.log(
    `✅ Seeded ${seededBudgets.length} budgets + ${transactions.length} transactions.`,
  );
};

// Auto-run when pasted in console
declare global {
  interface Window {
    seedBudgets: () => Promise<void>;
  }
}

if (typeof window !== 'undefined') {
  window.seedBudgets = seedBudgets;
}
