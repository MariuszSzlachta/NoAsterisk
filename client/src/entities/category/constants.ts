import type { SelectOption } from '#shared/ui/Select';

import type { CategoryInfo } from './types';

// TODO: Replace with real data from categories API/store when categories feature lands
export const STUB_CATEGORIES: ReadonlyArray<CategoryInfo> = [
  { id: 'cat-groceries', label: 'Spożywcze', color: '#4ade80' },
  { id: 'cat-transport', label: 'Transport', color: '#f59e0b' },
  { id: 'cat-subscriptions', label: 'Subskrypcje', color: '#8b5cf6' },
  { id: 'cat-housing', label: 'Mieszkanie', color: '#06b6d4' },
  { id: 'cat-salary', label: 'Wynagrodzenie', color: '#60a5fa' },
  { id: 'cat-entertainment', label: 'Rozrywka', color: '#ec4899' },
  { id: 'cat-health', label: 'Zdrowie', color: '#ef4444' },
  { id: 'cat-other', label: 'Inne', color: '#94a3b8' },
];

export const CATEGORY_SELECT_OPTIONS: readonly SelectOption[] = STUB_CATEGORIES.map((cat) => ({
  value: cat.id,
  label: cat.label,
}));
