# Devplan: Admin Rules Feature (FE, local-first)

## Overview

Feature `admin-rules` — management of transaction auto-categorization rules.  
Zero backend calls. Zustand persist → localStorage. Pure matching logic (Contains/Exact) replicated from domain package (client does not import from `@budget/domain`).

---

## Target structure

```
client/src/features/admin-rules/
  model/
    types.ts                    ← RuleRecord, RuleViewModel, MatcherType, CategoryOption
    transformers.ts             ← record → view model mapping (with category lookup)
    auto-categorize.ts          ← pure fn: rules × uncategorized txs → assignments
    auto-categorize.spec.ts     ← unit tests
  store/
    useRulesStore/
      useRulesStore.ts          ← Zustand persist, CRUD
      index.ts
  ui/
    RulesTable/
      RulesTable.tsx
      index.ts
    RuleFormModal/
      RuleFormModal.tsx          ← inline card/form (not a modal), create + edit
      index.ts
    hooks/
      useRulesTable/
        useRulesTable.ts         ← list of VMs + delete handler
        index.ts
      useRuleForm/
        useRuleForm.ts           ← form state + validation + submit
        index.ts
      useApplyRules/
        useApplyRules.ts         ← trigger auto-categorize → updateCategory per tx
        index.ts
  index.ts                       ← public API

client/src/pages/AdminRulesPage.tsx  ← replace placeholder
```

---

## Bullet 1: model/ layer

### types.ts

```typescript
export type MatcherType = 'Contains' | 'Exact';

export interface RuleRecord {
  readonly id: string;
  readonly keyword: string;
  readonly matcherType: MatcherType;
  readonly categoryId: string;
  readonly priority: number;
  readonly createdAt: string; // ISO
}

export interface RuleViewModel {
  readonly id: string;
  readonly keyword: string;
  readonly matcherType: MatcherType;
  readonly matcherLabel: string;       // "Contains" | "Exactly"
  readonly categoryId: string;
  readonly categoryLabel: string;
  readonly categoryColor: string;
  readonly priority: number;
  readonly createdAt: string;
}

export interface CategoryOption {
  readonly id: string;
  readonly label: string;
  readonly color: string;
}

export interface AutoCategorizeResult {
  readonly transactionId: string;
  readonly categoryId: string;
}
```

### transformers.ts

- `mapRuleToViewModel(record: RuleRecord, categories: ReadonlyArray<CategoryOption>): RuleViewModel`
- Matcher labels: `Contains → 'Contains'`, `Exact → 'Exactly'`
- Lookup category by id → label + color (fallback: `'Unknown'`, `'#94a3b8'`)

### auto-categorize.ts

```typescript
export const autoCategorize = (
  rules: ReadonlyArray<RuleRecord>,
  transactions: ReadonlyArray<{ id: string; description: string; categoryId?: string }>,
): ReadonlyArray<AutoCategorizeResult> => { ... }
```

Logic:
1. Filter transactions where `categoryId` is undefined
2. Sort rules by priority descending
3. For each uncategorized tx, find first rule that matches:
   - `Contains`: `description.toLowerCase().includes(keyword.toLowerCase())`
   - `Exact`: `description.toLowerCase() === keyword.toLowerCase()`
4. Return `{ transactionId, categoryId }` for each match

### auto-categorize.spec.ts

Test cases:
- Happy path: rule matches → returns assignment
- Priority: higher priority rule wins when multiple match
- Exact matcher: only full match works
- Contains matcher: substring works
- Already categorized: skipped
- No match: not included in results
- Empty rules: returns empty array

---

## Bullet 2: store/ layer

### useRulesStore.ts

```typescript
interface RulesState {
  readonly rules: ReadonlyArray<RuleRecord>;
  readonly addRule: (rule: Omit<RuleRecord, 'id' | 'createdAt'>) => void;
  readonly updateRule: (id: string, updates: Partial<Pick<RuleRecord, 'keyword' | 'matcherType' | 'categoryId' | 'priority'>>) => void;
  readonly deleteRule: (id: string) => void;
}
```

- `persist` middleware, storage key: `'budget-rules'`
- `addRule` generates `id` (crypto.randomUUID()) and `createdAt` (new Date().toISOString())
- `updateRule` merges partial updates into matching rule
- `deleteRule` filters out by id

---

## Bullet 3: ui/ hooks

### useRulesTable

- Reads `useRulesStore` → maps to `RuleViewModel[]` via transformers
- Returns: `{ rules: RuleViewModel[], handleDelete: (id: string) => void }`
- Categories: inline stub constant (same as useTransactionsPageWiring)

### useRuleForm

- Manages local form state: keyword, matcherType, categoryId, priority
- Accepts optional `editingRule: RuleRecord` for edit mode
- `handleSubmit`: validates (keyword non-empty, category selected) → calls addRule or updateRule
- Returns: `{ formValues, errors, handleFieldChange, handleSubmit, handleCancel, isEditing }`

### useApplyRules

- Reads rules from `useRulesStore`
- Reads transactions from `useTransactionsStore` (imported from `#features/transactions`)
- Calls `autoCategorize(rules, transactions)`
- Applies results via `useTransactionsStore.updateCategory()`
- Returns: `{ handleApplyRules, lastResult: { categorized: number, total: number } | undefined }`

---

## Bullet 4: ui/ components

### RulesTable

- Props: none (hooks provide everything)
- Uses `useRulesTable` hook
- `DataTable<RuleViewModel>` from `#shared/ui/DataTable`
- Columns: Keyword, Matcher, Category (with color dot), Priority, Actions
- Actions column: edit + delete buttons (via hook handlers)
- Empty state: `<p>` "No rules. Add your first rule."

### RuleFormModal

- Props: `{ editingRule?: RuleRecord; onClose: () => void }`
- Uses `useRuleForm` hook
- Card-style inline form (not a modal dialog)
- Fields: Input (keyword), Select (matcher), Select (category), Input type=number (priority)
- Buttons: Save, Cancel

---

## Bullet 5: AdminRulesPage + index.ts

### AdminRulesPage.tsx

- Header: "Auto Categorization Rules"
- Subtitle: "Automatically assign categories to transactions based on keywords."
- Toolbar: Button "Add Rule" + Button "Apply Rules" (variant=secondary)
- Conditionally render RuleFormModal when adding/editing
- RulesTable
- Status line after apply: "Categorized X of Y uncategorized transactions"
- Local state: `showForm`, `editingRule` — managed via page-level hook `useAdminRulesPage`

### index.ts (feature public API)

```typescript
export { RulesTable } from './ui/RulesTable';
export { RuleFormModal } from './ui/RuleFormModal';
export { useApplyRules } from './ui/hooks/useApplyRules';
export { useRulesStore } from './store/useRulesStore';
export type { RuleRecord, RuleViewModel, MatcherType } from './model/types';
```

---

## Bullet 6: Quality gate

- `cd client && npx tsc --noEmit` ← must pass
- `cd client && npx oxlint` ← must pass
- `cd client && npx vitest run` ← auto-categorize.spec.ts passes
- FSD boundary: admin-rules does not import from other features (except transactions store in useApplyRules — the only exception, cross-feature access to store)

---

## Notes

- Categories: stub constant (duplicated from useTransactionsPageWiring — acceptable until categories feature exists)
- Cross-feature import `useTransactionsStore` in `useApplyRules`: acceptable exception — rules need to read and modify transactions. Alternative (entities/) is overkill at this stage.
- Drag-and-drop reorder: nice-to-have, omitted. Numeric priority is sufficient.
- Matcher preview: nice-to-have, omitted in MVP.
