// ═══════════════════════════════════════════════════════════════════
// Transactions Feature — Transformers
// StoredTransaction → TransactionViewModel
// ═══════════════════════════════════════════════════════════════════

import type { CategoryInfo } from '#model/category';
import type { StoredTransaction, TransactionViewModel } from './types';

// ─── Constants ───────────────────────────────────────────────────

const TITLE_SEPARATORS = /[–—|]\s*|\s+[-/\\]\s*|[-/\\]\s+|\s{2,}/;

// ─── Helpers ─────────────────────────────────────────────────────

const splitDescription = (
  raw: string,
): { merchant: string; description: string } => {
  const match = TITLE_SEPARATORS.exec(raw);

  if (!match) {
    return { merchant: raw.trim(), description: '' };
  }

  const merchant = raw.slice(0, match.index).trim();
  const description = raw.slice(match.index + match[0].length).trim();

  return {
    merchant: merchant || raw.trim(),
    description,
  };
};

const formatDate = (isoDate: string): string => {
  const [year, month, day] = isoDate.split('-');
  if (!year || !month || !day) {
    return isoDate;
  }
  return `${day}.${month}.${year}`;
};

// ─── Transformer ─────────────────────────────────────────────────

export const mapStoredToViewModel = (
  stored: StoredTransaction,
  categories?: ReadonlyMap<string, CategoryInfo>,
): TransactionViewModel => {
  const { merchant, description } = splitDescription(stored.description);
  const category = stored.categoryId
    ? categories?.get(stored.categoryId)
    : undefined;

  return {
    id: stored.id,
    date: stored.date,
    dateFormatted: formatDate(stored.date),
    merchant,
    description,
    amount: stored.amount,
    currency: stored.currency,
    type: stored.amount >= 0 ? 'income' : 'expense',
    categoryId: stored.categoryId,
    categoryLabel: category?.label,
    categoryColor: category?.color,
    accountName: stored.accountName,
  };
};
