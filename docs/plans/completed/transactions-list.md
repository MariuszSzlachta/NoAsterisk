# Phase 4.4: Transactions List Page (Local-First)

## Context

"Transactions" Page (TransactionsPage) — currently a placeholder. Mockup in [NoAsterisk.dc.html](../../design/mockups/NoAsterisk.dc.html).

**Architecture: local-first (ADR-003)**
Transaction data lives in IndexedDB (Zustand persist / Dexie). No backend-side queries.
Filtering, sorting, pagination — all client-side on data from local storage.

Mockup shows:
- **Toolbar:** search input + filter by period (month) + filter by category + bulk actions ("Change category")
- **Grid:** checkbox | Date | Description (merchant + description 2 lines) | Category (colored tag) | Account | Amount
- **Footer/status bar:** "245 transactions" | "12 without category" (warning) | "3 personal data" (expense) | "Total expenses: −6 240,18 zł"

## Architecture

### Feature structure
```
features/transactions/
  model/
    types.ts                   ← TransactionViewModel, TransactionFilters, TransactionSort
    transformers.ts            ← Raw stored data → ViewModel mapping
    transformers.spec.ts
    filter-engine.ts           ← Client-side filter/sort/paginate logic (pure functions)
    filter-engine.spec.ts
  store/
    useTransactionsStore.ts    ← Zustand store (IndexedDB persisted data source)
  ui/
    TransactionGrid/           ← AG Grid (via DataGrid adapter)
    TransactionToolbar/        ← Search + filters
    TransactionStatusBar/      ← Footer stats
    hooks/
      useTransactionGrid/      ← Combines store + filters → sliced page of data
      useTransactionFilters/   ← Filter state (synced to URL search params)
      useTransactionSelection/ ← Row selection + bulk actions
      useTransactionStats/     ← Computed stats for status bar
    constants/
      grid-columns.tsx         ← Column definitions
  index.ts
```

### Data Flow
```
IndexedDB (persisted transactions)
  ↓ Zustand store (useTransactionsStore)
  ↓ filter-engine (apply filters + sort + paginate — pure function)
  ↓ useTransactionGrid hook (combines store + URL filters)
  ↓ TransactionGrid + TransactionToolbar + TransactionStatusBar
```

### Key Decisions
- **Client-side everything** — no API calls for listing. Data lives in IndexedDB/Zustand.
- **URL-synced filters** — shareable state (react-router useSearchParams), back button works
- **Pure filter engine** — `filterAndSort(rows, filters, sort)` → testable, no framework dependency
- **Client-side pagination** — slice filtered results by page (DataGrid custom pagination from J.4)
- **Reuse shared components** — PaginationBar, DateRangePicker, FilterTabs, DataGrid adapter

## Implementation Bullet Points

### Bullet 1: Model layer — types + filter engine

**Scope:** `features/transactions/model/`

- `types.ts`:
  ```ts
  interface TransactionViewModel {
    readonly id: string;
    readonly date: string;           // ISO date string for sorting
    readonly dateFormatted: string;  // display: "26.06.2026"
    readonly merchant: string;       // first segment of title (bold)
    readonly description: string;    // rest of title (muted subtitle)
    readonly amount: number;
    readonly currency: string;
    readonly type: 'income' | 'expense';
    readonly categoryId?: string;
    readonly categoryLabel?: string;
    readonly categoryColor?: string;
    readonly accountName?: string;
  }

  interface TransactionFilters {
    readonly type?: 'income' | 'expense';
    readonly categoryId?: string;
    readonly dateFrom?: string;      // ISO date
    readonly dateTo?: string;        // ISO date
    readonly search?: string;        // matches merchant + description
  }

  type TransactionSortField = 'date' | 'amount' | 'merchant';

  interface TransactionSort {
    readonly field: TransactionSortField;
    readonly direction: 'asc' | 'desc';
  }

  interface TransactionPage {
    readonly items: ReadonlyArray<TransactionViewModel>;
    readonly total: number;
    readonly totalFiltered: number;
    readonly page: number;
    readonly pageSize: number;
    readonly totalPages: number;
  }
  ```
- `filter-engine.ts`:
  ```ts
  filterTransactions(rows, filters): TransactionViewModel[]  // apply filters
  sortTransactions(rows, sort): TransactionViewModel[]        // apply sort
  paginateTransactions(rows, page, pageSize): TransactionPage // slice + meta
  computeStats(rows): TransactionStats                        // totals, expense sum, uncategorized count
  ```
- `filter-engine.spec.ts`: unit tests (filter by type, date range, search, sort, paginate edge cases)

### Bullet 2: Transformers — stored data → ViewModel

**Scope:** `features/transactions/model/`

- `transformers.ts`: `mapStoredTransactionToViewModel(stored: StoredTransaction): TransactionViewModel`
  - Split description → merchant (first part before separator) + description (rest)
  - Format date → "DD.MM.YYYY" for display, keep ISO for sorting
  - Category label/color resolution (from category store or inline)
  - Amount sign → type ('income' if > 0, 'expense' if < 0)
- `transformers.spec.ts`
- Note: `StoredTransaction` = whatever shape exists in the import store / persistence layer. If transactions are already persisted from import wizard → reuse that shape.

### Bullet 3: Store — Zustand transactions store (or reuse existing)

**Scope:** `features/transactions/store/` or `entities/transaction/`

- Check if imported transactions are already persisted somewhere (import wizard finalizes to...?)
- If not yet: create `useTransactionsStore` with:
  - `transactions: StoredTransaction[]`
  - `addTransactions(rows)` — called after import confirms
  - `updateTransaction(id, updates)` — edit category, etc.
  - `deleteTransactions(ids)` — bulk delete
- Persist with Zustand `persist` middleware → IndexedDB (or localStorage for MVP)
- This is the "source of truth" — import wizard writes here after step 5 (Import)

### Bullet 4: TransactionToolbar — search + filters

**Scope:** `features/transactions/ui/TransactionToolbar/`

- Hook `useTransactionFilters`:
  - Reads/writes URL searchParams (react-router `useSearchParams`)
  - State: `TransactionFilters` + `page` + `sort`
  - Methods: `setTypeFilter`, `setDateRange`, `setCategoryFilter`, `setSearch`, `setPage`, `setSort`, `resetFilters`
  - Debounced search (300ms via `useDebounce` from shared/hooks)
- Component `TransactionToolbar`:
  - Search input (search icon, placeholder "Filter transactions…")
  - DateRangePicker (from shared/ui — J.6)
  - Category filter dropdown (multi-select, colored dots)
  - Right side: selection info + "Change category" button
  - Layout: flex, gap-2.5, items-center, flex-wrap

### Bullet 5: Grid columns + TransactionGrid

**Scope:** `features/transactions/ui/`

- `constants/grid-columns.tsx`:
  - Columns per mockup: Date (96px, mono) | Description (flex 1.6, cellRenderer: 2-line merchant+desc) | Category (150px, colored tag) | Account (130px) | Amount (150px, right-aligned, mono, tabular-nums, colored)
  - Amount comparator (numeric, NaN-safe)
- `TransactionGrid.tsx`:
  - DataGrid adapter with custom pagination mode
  - Row height: 46px (2-line description)
  - Selection: multiple
  - PaginationBar wired to client-side page state
- Hook `useTransactionGrid`:
  - Gets all transactions from store
  - Applies transformers (→ ViewModels)
  - Applies filter engine (filters + sort + paginate from URL state)
  - Returns: `{ page: TransactionPage, isLoading }`

### Bullet 6: TransactionStatusBar + stats hook

**Scope:** `features/transactions/ui/TransactionStatusBar/`

- Hook `useTransactionStats`:
  - Computes from filtered data: total, uncategorized count, expense sum
  - Derived (no useEffect, compute in hook body)
- Component `TransactionStatusBar`:
  - "245 transactions" (total filtered)
  - "12 without category" (warning dot, amber)
  - "Total expenses: −6 240,18 zł" (expense color, mono)
  - Layout: flex, h-10, px-4, bg-surface-2, border-t border-border, text-xs, text-muted-foreground

### Bullet 7: TransactionsPage composition

**Scope:** `pages/TransactionsPage.tsx` + `features/transactions/index.ts`

- Replace placeholder:
  ```tsx
  <div className="flex flex-col gap-4 max-w-[1280px]">
    <TransactionToolbar />
    <Card className="overflow-hidden p-0">
      <TransactionGrid />
      <TransactionStatusBar />
    </Card>
  </div>
  ```
- `features/transactions/index.ts`: public API exports
- Navigation from sidebar works
- Empty state when 0 transactions ("No transactions. Import CSV to get started.")

### Bullet 8: Bulk category change

**Scope:** `features/transactions/ui/hooks/useTransactionSelection/`

- Hook `useTransactionSelection`:
  - Track selected row IDs (from grid onSelectionChange)
  - `handleBulkCategoryChange(categoryId)` → update in Zustand store
  - Clear selection after action
- Category picker (dropdown/popover when "Change category" clicked):
  - List of available categories with colored dots
  - Search within
  - On select → bulk update store

## Dependencies

```
[1] Model types + filter engine (standalone, pure functions)
[2] Transformers (uses model types)
[3] Store (uses model types, or reuses existing persistence)
    ↓
[4] Toolbar + filters hook (URL sync, uses model types)
[5] Grid + columns (uses model, store, filter engine, DataGrid adapter, PaginationBar)
[6] Status bar + stats hook (uses filter engine output)
    ↓
[7] Page composition (composes 4, 5, 6)
    ↓
[8] Bulk category change (uses store + selection from grid)
```

**Order:** 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8

## Prerequisites (from other phases)

- ⬜ PaginationBar (4.3.J.3) — custom pagination component
- ⬜ DataGrid custom pagination mode (4.3.J.4)
- ✅ DateRangePicker (4.3.J.6)
- ✅ FilterTabs (shared/ui — exists)
- ✅ DataGrid adapter (shared/adapters/grid)

## Acceptance Criteria

- [ ] TransactionsPage renders grid with locally-stored transactions
- [ ] Client-side pagination works (PaginationBar, page size selector)
- [ ] Sort by column header click (date, amount, merchant)
- [ ] Filter by type (income/expense) — FilterTabs
- [ ] Filter by date range — DateRangePicker
- [ ] Search by merchant/description (debounced, 300ms)
- [ ] All filters synced to URL (back button, shareable)
- [ ] Row selection + "Change category" bulk action
- [ ] Status bar: total count, uncategorized warning, expense sum
- [ ] Grid matches mockup (46px rows, 2-line description, colored category tags, mono amounts)
- [ ] Empty state when 0 transactions
- [ ] tsc --noEmit clean, tests pass (filter-engine, transformers)
- [ ] Zero API calls for data — everything from local store

## Master roadmap source summary

> **Source status:** The master roadmap marks Phase 4.4 with an unchecked box. This summary is planning evidence, not implementation evidence.

### Phase 4.4: Transactions List Page (Local-First) — ⬜

Design doc: [active transactions-list plan](./transactions-list.md)

| # | Task | Status |
|---|---|---|
| 4.4.1 | Model layer — types + filter engine (client-side filter/sort/paginate, pure functions) | ⬜ |
| 4.4.2 | Transformers — stored transaction → ViewModel (merchant/desc split, date format, category resolve) | ⬜ |
| 4.4.3 | Store — Zustand transactions store (IndexedDB persist, source of truth for imported data) | ⬜ |
| 4.4.4 | `TransactionToolbar` — search + DateRangePicker + category filter + `useTransactionFilters` (URL-synced) | ⬜ |
| 4.4.5 | Grid columns + `TransactionGrid` — AG Grid, client-side pagination, 2-line rows, colored categories | ⬜ |
| 4.4.6 | `TransactionStatusBar` + stats hook — footer: total, uncategorized warning, expense sum | ⬜ |
| 4.4.7 | `TransactionsPage` composition — wiring toolbar + grid + status bar + empty state | ⬜ |
| 4.4.8 | Bulk category change — row selection + "Change category" + category picker | ⬜ |

**Context:** Local-first (ADR-003). Transaction data in IndexedDB/Zustand. Zero API calls for listing — filtering, sorting, pagination client-side. Mockup in [NoAsterisk.dc.html](../../design/mockups/NoAsterisk.dc.html).

**Prerequisites:** PaginationBar (J.3) + DataGrid custom pagination (J.4).

---

### Summary provenance

- Original source: legacy development plan
- Original source lines: 562–582
- Frozen source commit: `582b3e8b147293c7b33dd0f839839aa81d7c8c20`
