# Phase 4.3.J: Preview Grid Improvements (Pagination, Filters, Sort Fix)

> **Archived plan:** Implementation intent preserved for historical context. Use the [Preview Grid Improvements developer guide](../../guides/frontend/preview-grid-improvements.md) for delivered behavior.

## Context

Step 4 of the import wizard (Preview) has a working grid based on AG Grid (shared adapter), but requires UX improvements:

1. **Pagination** — AG Grid's built-in pagination panel is unstyled (gray, generic look, doesn't match the design system)
2. **Filters** — no filtering at all. Needed: transaction type (expense/income/all) + date range (from–to)
3. **Sorting amount** — potential bug with NaN values (when amount is not parsed) or lack of custom comparator. The grid port doesn't have a `comparator` field → add it to the `GridColumn<TRow>` port interface.

## Solution Architecture

### Pagination
- **Do not** use AG Grid built-in pagination (ugly, impossible to style)
- Implement **custom pagination** at the adapter level:
  - Hide AG Grid `pagination=false`
  - Render a custom `PaginationBar` below the grid (design system component in `shared/ui/`)
  - The adapter manages data slicing (client-side) and exposes page state

### Filters
- Toolbar with chip/tab filters **above** the grid (in `ImportPreviewGrid`)
- Client-side filtering (data is already in the store)
- Filter type: `all | income | expense` (3 buttons/tabs)
- Date filter: DatePicker range (from–to) — optional (nice-to-have if there's a DatePicker in the design system)
- Filter state → hook `usePreviewFilters` (local state, not in the store — transient UI state)
- Filtered rows passed to DataGrid

### Sort Fix
- Add `comparator` field to `GridColumn<TRow>` in the grid port
- AG Grid adapter: map the port `comparator` → AG Grid `comparator` in ColDef
- Amount column: explicit numeric comparator (NaN → end)

## Implementation Bullet Points

### Bullet 1: Grid port — `comparator` field + adapter mapping

**Scope:** `shared/adapters/grid/`

- Add to `GridColumn<TRow>` in `ports/grid.port.ts`:
  ```ts
  comparator?: (valueA: unknown, valueB: unknown, rowA: TRow, rowB: TRow) => number;
  ```
- In `useAgGrid.ts` → `mapColumns()`: if `col.comparator` exists, set `colDef.comparator` (map port comparator to AG Grid comparator signature)
- Tests: expand `useAgGrid.spec.ts` with a case for custom comparator

### Bullet 2: Sort fix — numeric comparator on the `amount` column

**Scope:** `features/csv-import/ui/constants/grid-columns.tsx`

- Add `comparator` to the column def `amount`:
  ```ts
  comparator: (a, b) => {
    const numA = typeof a === 'number' && !Number.isNaN(a) ? a : Number.NEGATIVE_INFINITY;
    const numB = typeof b === 'number' && !Number.isNaN(b) ? b : Number.NEGATIVE_INFINITY;
    return numA - numB;
  }
  ```
- NaN values are sorted to the end (treated as -Infinity → always last in descending order)
- Verify: after the fix, sorting -1217 < -800 < -5 < +8500 (ascending) works correctly

### Bullet 3: Custom PaginationBar — shared UI component

**Scope:** `shared/ui/PaginationBar/`

- New `PaginationBar` component in the design system:
  - Props: `currentPage`, `totalPages`, `totalRows`, `pageSize`, `onPageChange`, `onPageSizeChange`
  - UI: "Showing X–Y of Z" label | page buttons (prev/next + numbered) | page size selector (dropdown: 25, 50, 100)
  - Styling: `bg-surface-2`, `text-muted-foreground`, `border-t border-border`, compact height
  - Storybook story
- Geist/shadcn inspired design — fits with the rest of the app shell

### Bullet 4: DataGrid adapter — custom pagination mode (replace AG Grid built-in)

**Scope:** `shared/adapters/grid/`

- Add to `DataGridProps<TRow>` in the port:
  ```ts
  paginationMode?: 'builtin' | 'custom';
  ```
  Default: `'builtin'` (backward compatible)
- When `paginationMode === 'custom'`:
  - AG Grid: `pagination={false}` (disable built-in)
  - Adapter internally slices `rows` based on current page state
  - Render `PaginationBar` below the grid
  - Expose controlled pagination (page state managed by adapter hook)
- Update `AgGridAdapter.tsx` + `useAgGrid.ts` accordingly
- Backward compatible: existing grids with `pageSize` without `paginationMode` behave as before

### Bullet 5: Calendar — shared UI component

**Scope:** `shared/ui/Calendar/`

**New dependencies:**
- `react-day-picker` (^9.x) — calendar rendering (shadcn/ui standard)
- `@radix-ui/react-popover` — popover container
- `date-fns` — date math + locale PL

**Component:**
- `Calendar.tsx` — wrapper over `react-day-picker` with our design tokens
- Props: `mode: 'single' | 'range'`, `selected`, `onSelect`, `locale?`, `disabled?`, `fromDate?`, `toDate?`
- Styling: Tailwind tokens (`bg-surface`, `border-border`, `text-foreground`, `bg-primary` for selected day, `text-muted-foreground` for outside days)
- Navigation: prev/next month arrows (Lucide icons: `ChevronLeft`, `ChevronRight`)
- Locale: `pl` with date-fns (Polish month and day names)
- Storybook story (single + range mode)
- Unit test: renders, selection callback fires

### Bullet 6: DateRangePicker — shared UI component

**Scope:** `shared/ui/DateRangePicker/`

**Component:**
- `DateRangePicker.tsx` — Radix Popover with Calendar(mode='range') as content
- Props: `value: { from?: Date; to?: Date }`, `onChange`, `placeholder?`, `presets?`
- **Trigger button:** calendar icon + formatted range ("01.07 – 13.07.2026") or placeholder ("Select date range")
- **Popover content:**
  - Left side (optional): presets ("Last Week", "Last Month", "Last 3 Months", "Full Range")
  - Right side: Calendar in range mode (two months side by side if viewport > sm, one month on mobile)
  - Footer: "Apply" button + "Clear" link
- Styling: `bg-surface`, `border-border`, `rounded-lg`, `shadow-card`
- Storybook story (with presets, without presets, controlled)
- Unit test: opens popover, selects range, fires onChange

### Bullet 7: FilterToolbar — transaction type + DateRangePicker + hook

**Scope:** `features/csv-import/ui/FilterToolbar/`

- New `FilterToolbar` component:
  - Segmented control (FilterTabs from shared/ui): "All" | "Income" (+) | "Expenses" (−)
  - `DateRangePicker` from shared/ui (calendar-based, with presets)
  - Layout: flex row, gap-3, items-center, below badges and above the grid
- Hook `usePreviewFilters`:
  - State: `{ type: 'all' | 'income' | 'expense'; dateFrom?: Date; dateTo?: Date }`
  - Derived: `filteredRows` (computed from `rows` + filter state)
  - Return: `{ filters, setTypeFilter, setDateRange, clearDateRange, filteredRows, activeFilterCount }`
- Connect in `ImportPreviewGrid` — pass `filteredRows` instead of `rows` to DataGrid
- Stats badges (total/ok/warning/duplicate/error) are recalculated on `filteredRows`

### Bullet 8: Integration + wiring in `ImportPreviewGrid`

**Scope:** `features/csv-import/ui/ImportPreviewGrid/`

- Connect FilterToolbar + DataGrid (with custom pagination) + updated columns (comparator)
- Layout: badges → FilterToolbar → BatchEditPanel → Grid (with PaginationBar) → nav buttons
- Ensure that batch edit panel and selection work with filtered rows
- Test the flow: filter → edit → switch filter → data remains consistent

## Dependencies Between Bullet Points

```
[1] Grid port comparator
 ↓
[2] Amount sort fix (uses comparator from bullet 1)

[3] PaginationBar component (standalone)
 ↓
[4] DataGrid custom pagination mode (uses PaginationBar from bullet 3)

[5] Calendar component (standalone, new deps: react-day-picker, @radix-ui/react-popover, date-fns)
 ↓
[6] DateRangePicker (uses Calendar from bullet 5)
 ↓
[7] FilterToolbar + hook (uses DateRangePicker from bullet 6 + FilterTabs from shared/ui)

[8] Integration (depends on: 2, 4, 7 — all previous bullets)
```

**Recommended order:** 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 (sequential, each builds on previous)

## Decisions

- **Client-side filtering/pagination** — data is already in memory (max ~2000 rows), no API calls
- **Custom pagination instead of AG Grid built-in** — AG Grid pagination panel can't be styled without Enterprise; custom is simpler and consistent with the design system
- **Filter type as segmented control** — not dropdown — fast 1-click toggle, visible state
- **DateRangePicker with calendar** — react-day-picker + Radix Popover (shadcn/ui pattern), reusable across the app
- **Filter state in a hook, not in the store** — transient UI state, resets on navigation. No need for persistence.
- **Calendar + DateRangePicker = shared/ui** — reusable: Analytics page, Transactions page filters, Budget period selector

## Acceptance Criteria

- [ ] Sorting amount works numerically (NaN at the end)
- [ ] Pagination: custom styled bar, "1-50 of 248", prev/next buttons, page size selector
- [ ] Calendar renders correctly in dark mode, PL locale (Monday = first day)
- [ ] DateRangePicker: opens popover, selects range, presets work, "Clear" resets
- [ ] Filter type: "Expenses" shows only amount < 0, "Income" only amount > 0
- [ ] Date filter: selecting a range → grid filtered by the date column
- [ ] Badges (stats) update after filtering
- [ ] Filtering + cell editing = no regression (edited data visible after changing filter)
- [ ] tsc --noEmit clean, tests pass
- [ ] Storybook stories for Calendar + DateRangePicker
