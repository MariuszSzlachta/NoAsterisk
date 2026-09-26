# Admin Rules Feature — Developer Guide

## Domain Context

Users define keyword-based categorization rules that automatically assign categories to uncategorized transactions. Rules use substring or exact matching with priority ordering. The feature is fully local-first: rules persist as encrypted AES-256-GCM envelopes in Dexie IndexedDB with zero backend API calls.

---

## Architecture

```
features/admin-rules/
├── index.ts                        # Public API
├── model/
│   ├── types.ts                    # RuleRecord, RuleViewModel, MatcherType, etc.
│   ├── transformers.ts             # RuleRecord → RuleViewModel mapper
│   ├── transformers.spec.ts        # Transformer tests
│   ├── auto-categorize.ts          # Pure matching & assignment logic
│   ├── auto-categorize.spec.ts     # Auto-categorize tests
│   └── index.ts                    # Model barrel
├── store/
│   └── useRulesStore/
│       ├── useRulesStore.ts        # Hydrated Zustand session store
│       └── index.ts
└── ui/
    ├── RulesTable/
    │   ├── RulesTable.tsx          # Table rendering with DataTable
    │   └── index.ts
    ├── RuleFormModal/
    │   ├── RuleFormModal.tsx        # Inline card form for create/edit
    │   └── index.ts
    ├── constants/
    │   ├── category-options/       # Stub categories (temporary)
    │   └── rules-columns/          # DataTable column definitions
    └── hooks/
        ├── useAdminRulesPage/      # Page-level orchestration
        ├── useRulesTable/          # Table data + delete handler
        ├── useRuleForm/            # Form state, validation, submit
        └── useApplyRules/          # Cross-feature auto-categorize
```

Page: `client/src/pages/AdminRulesPage.tsx`

---

## Public API

```typescript
// features/admin-rules/index.ts
export { RulesTable } from './ui/RulesTable';
export { RuleFormModal } from './ui/RuleFormModal';
export { useAdminRulesPage } from './ui/hooks/useAdminRulesPage';
export type { RuleRecord, RuleViewModel, MatcherType } from './model/types';
```

---

## Data Flow

```
useRulesStore (hydrated Zustand session)
  ↓ rules: ReadonlyArray<RuleRecord>
useRulesTable hook
  ↓ mapRuleToViewModel(record, categories) per rule
ReadonlyArray<RuleViewModel>
  ↓ RulesTable renders via DataTable

User clicks "Zastosuj reguły":
  useApplyRules hook
    ↓ reads useRulesStore (rules)
    ↓ reads useTransactionsStore (transactions) ← cross-feature
    ↓ autoCategorize(rules, transactions) — pure function
    ↓ bulkUpdateCategory(ids, categoryId) per group
    ↓ returns ApplyResult { categorized, total }
```

### Cross-feature imports

`useApplyRules` imports `useTransactionsStore` from `#features/transactions`. This is documented with an `ARCH-EXCEPTION` comment in source. The cross-feature dependency is read + write (reads transactions, calls `bulkUpdateCategory`). Planned resolution: extract shared transaction state to `entities/` when warranted by growth.

---

## State Management

### Rules Store

Zustand without `persist`; writes go through the encrypted `ruleRepository`.

| Action | Behavior |
|--------|----------|
| `addRule(rule)` | Generates `id` (crypto.randomUUID) and `createdAt` (ISO), appends to array |
| `updateRule(id, updates)` | Merges partial updates into matching rule |
| `deleteRule(id)` | Filters rule out of array |

State shape: `{ rules: ReadonlyArray<RuleRecord> }` — flat array, no nesting.

---

## Model Layer (Pure Functions)

### Types

| Type | Purpose |
|------|---------|
| `MatcherType` | `'Contains' \| 'Exact'` — matching strategy |
| `RuleRecord` | Persistence shape: id, keyword, matcherType, categoryId, priority, createdAt |
| `RuleViewModel` | UI-ready: adds matcherLabel, categoryLabel, categoryColor |
| `CategoryOption` | `{ id, label, color }` — category metadata |
| `AutoCategorizeResult` | `{ transactionId, categoryId }` — assignment output |
| `UncategorizedTransaction` | `{ id, description, categoryId? }` — matching input |

### Transformers

`mapRuleToViewModel(record, categories)` — resolves category labels and matcher labels. Falls back to `'Nieznana'` / slate-400 color when category is not found.

### Auto-Categorize Algorithm

`autoCategorize(rules, transactions)` — pure function:

1. Sort rules by priority descending (highest priority first).
2. Filter transactions to only those without a `categoryId`.
3. For each uncategorized transaction, find the first matching rule.
4. Return array of `{ transactionId, categoryId }` assignments.

Matching logic:
- **Contains**: case-insensitive substring match (`description.includes(keyword)`)
- **Exact**: case-insensitive full-string equality (`description === keyword`)

---

## Form Validation

`useRuleForm` validates on submit:

| Field | Rule | Error message |
|-------|------|---------------|
| keyword | Non-empty after trim | "Słowo kluczowe jest wymagane" |
| categoryId | Non-empty | "Kategoria jest wymagana" |
| priority | ≥ 1 | "Priorytet musi być większy od 0" |

Reset strategy: parent uses `key={editingRule?.id ?? 'new'}` on `RuleFormModal` to force remount and state reset when switching between create/edit modes.

---

## UI Components

### RulesTable

Renders rules via the shared `DataTable` component. Columns: keyword, matcher label, category (with color dot), priority, actions (edit + delete icon buttons). Shows empty state message when no rules exist.

### RuleFormModal

Inline card (not a modal overlay despite the name) with a 4-column responsive grid: keyword input, matcher select, category select, priority number input. Action buttons: submit ("Dodaj" / "Zapisz") and cancel ("Anuluj").

---

## Design System Reuse

| Component | Source |
|-----------|--------|
| `DataTable` | `#shared/ui/DataTable` |
| `Button` | `#shared/ui/Button` |
| `Card` | `#shared/ui/Card` |
| `Input` | `#shared/ui/Input` |
| `Select` | `#shared/ui/Select` |
| Icons | `lucide-react` (ListChecks, Play, Plus, Pencil, Trash2) |

---

## Empty States

- **No rules:** "Brak reguł. Dodaj pierwszą regułę." (centered text)
- **Apply result:** Shows "Skategoryzowano X z Y niekategoryzowanych transakcji." after applying

---

## Extension Points

### Adding a new matcher type

1. Add the literal to `MatcherType` union in `model/types.ts`.
2. Update `isMatcherType` type guard.
3. Add a `case` branch in `matchesRule` within `auto-categorize.ts`.
4. Add a label entry in `MATCHER_LABELS` in `transformers.ts`.
5. Add option to `MATCHER_OPTIONS` in `RuleFormModal.tsx`.

### Replacing stub categories

`STUB_CATEGORIES` in `ui/constants/category-options/` is a temporary duplication. When a shared categories feature or entity exists:

1. Replace `STUB_CATEGORIES` import with shared category source.
2. Update `CATEGORY_OPTIONS` derivation.
3. Remove the stub constant file.

### Connecting to backend API

When the backend categorization-rules module is connected:

1. Replace `useRulesStore` with TanStack Query hooks in a new `api/` layer.
2. Remove `persist` middleware (backend is source of truth).
3. Update `useApplyRules` to call a backend command instead of local computation.

---

## Limitations

| Feature | Status |
|---------|--------|
| Category list | ⚠️ Hardcoded stub — no shared categories feature yet |
| Backend persistence | ❌ Local-only (encrypted IndexedDB), no sync |
| Rule import/export | ❌ Not implemented |
| Regex matching | ❌ Only Contains and Exact matchers |
| Undo on apply | ❌ Bulk categorization is not reversible via UI |
| Cross-feature dependency | ⚠️ Direct import from `#features/transactions` (ARCH-EXCEPTION) |

---

## Related

- Backend module: [categorization-rules-module](../backend/categorization-rules-module.md)
- Product capability: [categorization](../../product/capabilities/categorization.md)
- Legacy decision: [DEC-010](../../history/decisions/DEC-010-plugin-architecture-for-pii-rules-nestjs-multi-provider.md) — backend plugin architecture for rules

---

*Updated: 2026-08-21 | Source: `client/src/features/admin-rules/`*
