# Preview Grid Improvements — Developer Guide

Phase 4.3.J. Custom pagination, client-side filters, and numeric sort comparator for the import wizard's preview step (Step 4).

---

## Domain Context

The import wizard Step 4 shows parsed/mapped CSV rows in a grid before submission. Users need to review 50–2000 rows with the ability to:
- Sort by amount (numeric, not lexicographic)
- Filter by transaction type (income/expense) and date range
- Navigate pages without AG Grid's unstyled built-in pagination

All operations are client-side — data is already in memory. No API calls.

---

## Architecture

```
shared/adapters/grid/
  ports/grid.port.ts              ← GridColumn.comparator, DataGridProps.paginationMode
  adapters/ag-grid/
    AgGridAdapter.tsx             ← Custom pagination mode (slicing + PaginationBar render)
    useAgGrid.ts                  ← Maps port comparator → AG Grid comparator

shared/ui/PaginationBar/
  PaginationBar.tsx               ← Reusable prev/next + page size selector
  index.ts

features/csv-import/
  ui/
    FilterToolbar/
      FilterToolbar.tsx           ← Type tabs (all/income/expense) + date range inputs
      index.ts
    hooks/usePreviewFilters/
      usePreviewFilters.ts        ← Filter state + useMemo-driven filteredRows
      index.ts
    constants/grid-columns.tsx    ← Column defs with amount comparator
    ImportPreviewGrid/
      ImportPreviewGrid.tsx       ← Composition: filters → badges → grid → nav
```

### Data Flow

```
rows (from wizard store)
  → usePreviewFilters (applies type + date filters)
    → filteredRows
      → badges (stats recomputed on filteredRows)
      → DataGrid (paginationMode='custom')
        → AgGridAdapter slices filteredRows by page
          → PaginationBar renders below grid
```

---

## Public API

### Grid Port — `GridColumn.comparator`

```typescript
// shared/adapters/grid/ports/grid.port.ts
interface GridColumn<TRow> {
  // ... existing fields
  comparator?: (valueA: unknown, valueB: unknown, rowA: TRow, rowB: TRow) => number;
}
```

The comparator follows standard sort semantics: negative = A before B, positive = A after B, 0 = equal. The AG Grid adapter wraps it to handle AG Grid's `node.data` indirection.

### Grid Port — `DataGridProps.paginationMode`

```typescript
interface DataGridProps<TRow> {
  // ... existing fields
  pageSize?: number;
  paginationMode?: 'builtin' | 'custom';  // default: 'builtin'
}
```

- `'builtin'` — AG Grid's native pagination (existing behavior, backward compatible)
- `'custom'` — AG Grid pagination disabled; adapter manages page state internally, renders `PaginationBar`

### PaginationBar Props

```typescript
// shared/ui/PaginationBar/PaginationBar.tsx
interface PaginationBarProps {
  readonly currentPage: number;
  readonly totalPages: number;
  readonly totalRows: number;
  readonly pageSize: number;
  readonly onPageChange: (page: number) => void;
  readonly onPageSizeChange: (size: number) => void;
}
```

### usePreviewFilters Hook

```typescript
// features/csv-import/ui/hooks/usePreviewFilters/usePreviewFilters.ts
type TransactionTypeFilter = 'all' | 'income' | 'expense';

interface PreviewFiltersResult {
  readonly filters: PreviewFilters;
  readonly filteredRows: ReadonlyArray<TransactionRow>;
  readonly activeFilterCount: number;
  readonly setTypeFilter: (type: TransactionTypeFilter) => void;
  readonly setDateFrom: (date: string) => void;
  readonly setDateTo: (date: string) => void;
  readonly resetFilters: () => void;
}

const usePreviewFilters = (rows: ReadonlyArray<TransactionRow>): PreviewFiltersResult;
```

---

## Key Decisions & Trade-offs

| Decision | Rationale | Alternative Rejected |
|----------|-----------|---------------------|
| Custom pagination over AG Grid built-in | AG Grid Community pagination panel cannot be styled to match design system | AG Grid Enterprise theme — license cost |
| Adapter-internal page state (useState) | Self-contained; no store coupling; resets on unmount | Controlled pagination via props — adds complexity for no benefit in client-side use case |
| `useMemo` for filteredRows | O(n) filter on every filter change; up to 2000 rows = <1ms | Zustand derived state — transient UI state doesn't need persistence |
| NaN → `NEGATIVE_INFINITY` in comparator | NaN amounts sort to bottom in descending (most useful); sort behavior is deterministic | Exclude NaN rows — loses data visibility |
| Filter state as local hook (not store) | Transient — resets on navigation. No persistence needed. | Import wizard store — couples filter UI to domain state |

---

## Extension Points

### Adding a New Filter

1. Add state field to `usePreviewFilters`:

```typescript
// usePreviewFilters.ts
interface PreviewFilters {
  readonly type: TransactionTypeFilter;
  readonly dateFrom: string;
  readonly dateTo: string;
  readonly category: string;  // ← new
}

const INITIAL_FILTERS: PreviewFilters = {
  type: 'all',
  dateFrom: '',
  dateTo: '',
  category: '',  // ← new
};
```

2. Add matcher function:

```typescript
const matchesCategoryFilter = (row: TransactionRow, category: string): boolean => {
  if (!category) return true;
  return row.category === category;
};
```

3. Chain in `useMemo`:

```typescript
const filteredRows = useMemo(
  () => rows.filter(
    (row) =>
      matchesTypeFilter(row, filters.type) &&
      matchesDateRange(row, filters.dateFrom, filters.dateTo) &&
      matchesCategoryFilter(row, filters.category),  // ← new
  ),
  [rows, filters],
);
```

4. Add setter + expose in return:

```typescript
const setCategoryFilter = (category: string): void => {
  setFilters((prev) => ({ ...prev, category }));
};
```

5. Add UI control in `FilterToolbar` (new prop + render element).

### Adding a Custom Comparator to Any Column

Add `comparator` to the column definition:

```typescript
// Any grid-columns file
{
  field: 'balance',
  headerName: 'Saldo',
  sortable: true,
  comparator: (valueA: unknown, valueB: unknown) => {
    const a = typeof valueA === 'number' ? valueA : 0;
    const b = typeof valueB === 'number' ? valueB : 0;
    return a - b;
  },
}
```

The adapter maps it automatically. No other changes needed.

### Changing Page Size Options

Edit the constant in `PaginationBar.tsx`:

```typescript
const PAGE_SIZE_OPTIONS = [
  { value: '10', label: '10' },
  { value: '25', label: '25' },
  { value: '50', label: '50' },
  { value: '100', label: '100' },
  { value: '200', label: '200' },
] as const;
```

The `Select` component adapts automatically.

### Server-Side Pagination (post-MVP)

The port has a TODO comment for this. To implement:

1. Add new mode to port:

```typescript
interface DataGridProps<TRow> {
  paginationMode?: 'builtin' | 'custom' | 'server';
  serverPagination?: {
    currentPage: number;
    totalRows: number;
    pageSize: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
  };
}
```

2. In `AgGridAdapter`, when `paginationMode === 'server'`:
   - Pass `rows` directly (already paginated by caller)
   - Render `PaginationBar` with controlled props from `serverPagination`
   - No internal slicing

3. The hook calling the grid manages fetching pages via TanStack Query.

### Reusing PaginationBar Outside Grid

`PaginationBar` is a standalone `shared/ui` component — use it anywhere:

```typescript
import { PaginationBar } from '#shared/ui/PaginationBar';

// In any list/table component
<PaginationBar
  currentPage={page}
  totalPages={Math.ceil(total / size)}
  totalRows={total}
  pageSize={size}
  onPageChange={setPage}
  onPageSizeChange={setSize}
/>
```

---

## Boundaries — What This Module Does NOT Handle

- **Server-side filtering** — all filtering is client-side (rows already in memory)
- **Persisted filter state** — filters reset on component unmount (by design)
- **AG Grid Enterprise features** — no grouped headers, no server-side row model
- **URL sync** — filter state is NOT synced to URL query params (unlike Analytics page which has this in scope for 4.2.7.6)
- **Virtualization** — AG Grid handles row virtualization internally; custom pagination reduces DOM nodes per page

---

## Adapter Internals: How Custom Pagination Works

The `AgGridAdapter` manages page state when `paginationMode === 'custom'`:

```typescript
const [currentPage, setCurrentPage] = useState(1);
const [customPageSize, setCustomPageSize] = useState(pageSize ?? 50);

const isCustomPagination = paginationMode === 'custom' && pageSize !== undefined;
const displayRows = isCustomPagination
  ? rows.slice((currentPage - 1) * customPageSize, currentPage * customPageSize)
  : rows;
```

AG Grid receives only the current page's rows. The full `rows` array stays in parent scope (for filters/badges). When filters change, `rows` prop updates → `displayRows` recomputes → page resets if current page exceeds new total.

Key invariant: `onPageSizeChange` always resets `currentPage` to 1 to avoid out-of-bounds.

---

## Comparator Mapping: Port → AG Grid

In `useAgGrid.ts`, port comparators are wrapped to handle AG Grid's node structure:

```typescript
if (col.comparator) {
  const portComparator = col.comparator;
  colDef.comparator = (
    valueA: unknown,
    valueB: unknown,
    nodeA: { data: TRow | undefined },
    nodeB: { data: TRow | undefined },
  ) => {
    if (!nodeA.data || !nodeB.data) return 0;
    return portComparator(valueA, valueB, nodeA.data, nodeB.data);
  };
}
```

This isolates consumers from AG Grid's `RowNode` type. The port exposes a clean `(valueA, valueB, rowA, rowB) => number` contract.

---

## i18n Keys

```
pagination.range         → "{{start}}–{{end}} z {{total}}"
pagination.rowsPerPage   → "Wierszy na stronę"
pagination.prevPage      → "Poprzednia strona"
pagination.nextPage      → "Następna strona"
import.filter.all        → "Wszystkie"
import.filter.income     → "Przychody"
import.filter.expense    → "Wydatki"
import.filter.dateFrom   → "Data od"
import.filter.dateTo     → "Data do"
```

---

## Testing

No dedicated spec files for this phase — logic is minimal (pure filter functions, UI composition). To test:

- **Amount comparator**: test in integration with AG Grid sort (manual or e2e)
- **usePreviewFilters**: pure function matchers (`matchesTypeFilter`, `matchesDateRange`) are testable in isolation
- **PaginationBar**: Storybook visual verification + a11y (aria-labels on buttons)

To add unit tests for the filter logic:

```typescript
// usePreviewFilters.spec.ts
import { renderHook, act } from '@testing-library/react';
import { usePreviewFilters } from './usePreviewFilters';

const mockRows: TransactionRow[] = [
  { id: '1', date: '2026-01-15', amount: 500, /* ... */ },
  { id: '2', date: '2026-02-10', amount: -120, /* ... */ },
];

it('filters income only', () => {
  const { result } = renderHook(() => usePreviewFilters(mockRows));
  act(() => result.current.setTypeFilter('income'));
  expect(result.current.filteredRows).toHaveLength(1);
  expect(result.current.filteredRows[0].amount).toBeGreaterThan(0);
});
```

---

## Related Docs

- [CSV Import Feature](./csv-import-feature.md) — full import wizard architecture
- [Design doc](../../plans/archive/preview-grid-improvements.md) — original spec with dependency graph
- [Architecture: CSV Engine](../../architecture/csv-engine/overview.md) — parser/anonymizer that produces the rows this grid displays
