// ═══════════════════════════════════════════════════════════════════
// Admin Rules Feature — Model Types
// ═══════════════════════════════════════════════════════════════════

// ─── Matcher Type ────────────────────────────────────────────────

export type MatcherType = 'Contains' | 'Exact';

export const isMatcherType = (value: string): value is MatcherType =>
  value === 'Contains' || value === 'Exact';

// ─── Rule Record (persistence shape) ─────────────────────────────

export interface RuleRecord {
  readonly id: string;
  readonly keyword: string;
  readonly matcherType: MatcherType;
  readonly categoryId: string;
  readonly priority: number;
  readonly createdAt: string; // ISO
}

// ─── Rule ViewModel (UI-ready) ───────────────────────────────────

export interface RuleViewModel {
  readonly id: string;
  readonly keyword: string;
  readonly matcherType: MatcherType;
  readonly matcherLabel: string;
  readonly categoryId: string;
  readonly categoryLabel: string;
  readonly categoryColor: string;
  readonly priority: number;
  readonly createdAt: string;
}

// ─── Category ────────────────────────────────────────────────────
// CategoryInfo now lives in #entities/category

// ─── Auto-Categorize Result ──────────────────────────────────────

export interface AutoCategorizeResult {
  readonly transactionId: string;
  readonly categoryId: string;
}

// ─── Uncategorized Transaction Input ─────────────────────────────

export interface UncategorizedTransaction {
  readonly id: string;
  readonly description: string;
  readonly categoryId?: string;
}
