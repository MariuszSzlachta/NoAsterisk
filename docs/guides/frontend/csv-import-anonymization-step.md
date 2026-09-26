# CSV Import — Anonymization Step UI (Phase 4.3.I) — Developer Guide

## Domain Context

When a user imports a bank CSV, the system must detect and mask personally identifiable information (names, IBANs, PESELs, phone numbers, etc.) **before any data leaves the browser**. The anonymization step is wizard step 2 (0-indexed) — it sits between column mapping confirmation and the editable preview grid.

This is a **human-in-the-loop review** step. The pipeline auto-masks high-confidence detections but surfaces medium-confidence ones for user verification. Users can:
- Accept all automated suggestions in bulk
- Restore original text (undo masking) per row
- Manually edit the masked version per row
- Filter the grid by anonymization status to focus review

**Why it matters:** If users don't trust the anonymization, they won't import. False positives (masking merchant names as PII) erode trust. The UI must make it trivial to spot and fix mistakes.

---

## Architecture

### Hook Separation (Three-Hook Design)

The step is split into three hooks with distinct responsibilities:

```
┌─────────────────────────────────────────────────────────────┐
│  AnonymizationStep (component)                               │
│    ├── useAnonymizationStep()       ← state + handlers       │
│    ├── useAnonymizationGrid()       ← grid data preparation  │
│    └── useAnonymizationRowActions() ← per-row action menu    │
└─────────────────────────────────────────────────────────────┘
```

| Hook | Responsibility | State Owned |
|------|----------------|-------------|
| `useAnonymizationStep` | Filter state, popover state, entry mutations (restore, edit, bulk accept), row selection | `activeFilter`, `selectedRowIndex`, `isEditing`, `editValue` |
| `useAnonymizationGrid` | Column definitions from mapping, row joining (TransactionRow + AnonymizationEntry), row class assignment, status filtering | None (pure derivation from store) |
| `useAnonymizationRowActions` | Dynamic per-row dropdown actions (context-dependent on anonymization status) | None (pure function returning actions) |

**Why three hooks?** Single Responsibility — grid data preparation, action menu logic, and modal/edit state are independent concerns. The row actions hook encapsulates the "which actions are available for this row" decision, keeping it out of both the grid hook and the step state hook.

### Data Flow

```
Store (useImportWizardStore)
  │
  ├── rows: TransactionRow[]              ← written by useImportWizard on step 1→2 transition
  ├── anonymizationEntries: Entry[]       ← written by useImportWizard on step 1→2 transition
  └── columnMapping: ColumnMapping        ← set during step 0 (file parse)
  │
  ▼
useAnonymizationGrid(cellRenderers, statusFilter)
  │ joins rows[i] + entries[i] by positional index
  │ builds dynamic columns from columnMapping
  │ applies status filter
  ▼
AnonymizationGridRow[] → DataGrid (AG Grid adapter)
  │
  ▼ rowActions dropdown (per-row, dynamic)
useAnonymizationRowActions(onEdit, onRestore)
  │ returns context-dependent actions:
  │   safe rows → [Edit]
  │   non-safe rows → [Restore, Edit]
  ▼
"Restore" → useAnonymizationStep.handleRestore(rowIndex)
  │ reverts title, sets status=safe, updates store
"Edit" → useAnonymizationStep.handleSelectRow(rowIndex)
  │ opens modal popover
  ▼
AnonymizationPopover (fixed centered modal — shows original vs masked + edit input)
  │
  ▼ handleEdit (save) / handleClose
Updates store (entries + rows) → grid re-renders
```

### Pipeline Trigger Point

The anonymization pipeline (`processRows()`) runs during the **step 1→2 transition** inside `useImportWizard.handleMappingConfirm()` — NOT on mount of step 2. This means:

1. When `AnonymizationStep` renders, entries are already in the store
2. No loading state needed in the step itself
3. Going back and forward between steps preserves user corrections (entries persist in store)

**Post-masking whitespace normalization:** After PII tokens are replaced with masked placeholders, surrounding whitespace may collapse (e.g. `"Jan  Kowalski" → "J•••  K•••••••"` leaves double spaces). The pipeline normalizes: tabs → spaces, multi-space → single space, trim. This prevents visual artifacts in the grid display.

---

## Component Tree

```
ImportPage
  └── AnonymizationStep
        ├── Header (heading + description + "Accept All" button)
        ├── Legend (colored dots: safe/needs_review/anonymized)
        ├── FilterTabs (all | safe | needs_review | anonymized)
        ├── DataGrid (AG Grid adapter)
        │     ├── TitleCellRenderer (custom cell: dot + mono text + bg color + Tooltip)
        │     └── Row actions dropdown (⋮) — dynamic per-row via useAnonymizationRowActions
        ├── Stats bar (scanned / anonymized / needs review counts)
        ├── Navigation (Back / Next buttons)
        └── AnonymizationPopover (conditional — fixed centered modal when editing)
              ├── Status badge
              ├── Original title section (mono, bordered)
              ├── Anonymized title section / Edit input
              └── Action buttons (Save / Cancel)
```

### File Map

```
ui/
├── AnonymizationStep/
│   ├── AnonymizationStep.tsx      # Orchestrating component (zero logic)
│   ├── constants.ts               # LEGEND_ITEMS, CELL_RENDERERS
│   └── index.ts
├── AnonymizationPopover/
│   ├── AnonymizationPopover.tsx   # Fixed centered modal, role=dialog, Escape dismiss
│   └── index.ts
├── TitleCellRenderer/
│   ├── TitleCellRenderer.tsx      # AG Grid custom cell (dot + background + mono + Tooltip)
│   └── index.ts
└── hooks/
    ├── useAnonymizationStep/
    │   ├── useAnonymizationStep.ts      # State management + handlers
    │   ├── useAnonymizationStep.spec.ts # Unit tests
    │   └── index.ts
    ├── useAnonymizationGrid/
    │   ├── useAnonymizationGrid.ts      # Grid data derivation
    │   ├── useAnonymizationGrid.spec.ts # Unit tests
    │   └── index.ts
    └── useAnonymizationRowActions/
        ├── useAnonymizationRowActions.ts # Dynamic per-row actions (status-dependent)
        └── index.ts
```

---

## Key Patterns

### 1. Positional Index Joining

`AnonymizationGridRow` is NOT a domain entity — it's a ViewModel created by joining:
- `rows[i]` (TransactionRow — date, amount, currency, title)
- `entries[i]` (AnonymizationEntry — status, anonymizedTitle, spans)

They share the same positional index. This is enforced by:
- Pipeline producing entries with sequential `rowIndex` matching the rows array
- Store arrays never being reordered between column mapping step and anonymization step

```typescript
// In useAnonymizationGrid:
const gridRows = rows.map((row, idx) => {
  const entry = entries[idx];
  return {
    ...row,
    title: entry ? entry.anonymizedTitle : row.title,
    anonymizationStatus: entry ? entry.status : 'safe',
    rowIndex: idx,
  };
});
```

### 2. CellRendererMap Pattern

Cell renderers are passed from the component layer to the grid hook via a typed map:

```typescript
// constants.ts
export const CELL_RENDERERS = { title: TitleCellRenderer } as const;

// AnonymizationStep.tsx
const { columns, rows, getRowId, getRowClass } = useAnonymizationGrid(CELL_RENDERERS, activeFilter);
```

This keeps the hook framework-agnostic (no JSX imports) while letting the component control rendering. The hook matches renderers to columns by DomainField key.

### 3. Grid Port Extensions

Props added to `DataGridProps<TRow>` for the anonymization step (backward-compatible):

```typescript
// shared/adapters/grid/ports/grid.port.ts
onCellClick?: (row: TRow, field: string) => void;
getRowClass?: (row: TRow) => string | undefined;
rowActions?: RowAction<TRow>[] | ((row: TRow) => RowAction<TRow>[]);
```

**`rowActions` dynamic variant:** When passed as a function, the grid adapter calls it per row to get context-dependent actions. This enables the anonymization step to show different dropdown items based on row status (safe rows get Edit only, non-safe rows get Restore + Edit).

**`GridColumn.minWidth`** — ensures columns don't shrink below a readable threshold. Used for the title column (`minWidth: 400`) to prevent truncation of masked transaction titles.

The AG Grid adapter maps these to native AG Grid APIs (`onCellClicked`, `getRowClass`, custom actions column with `cellRendererParams`).

### 4. Row Styling via CSS Classes

Status-based row styling uses CSS classes defined in `index.css`:

```css
.anonymization-row-safe        { border-left: 2px solid var(--income); }
.anonymization-row-needs-review { border-left: 2px solid var(--warning); }
.anonymization-row-anonymized  { border-left: 2px solid var(--expense); }
```

The `getRowClass` function maps `AnonymizationStatus → class name` via a Record lookup.

### 4b. TitleCellRenderer — Tooltip for Truncated Titles

Transaction titles are often long (80-120 chars after masking). The title column uses `flex: 1` + `minWidth: 400` to take available space, but still truncates on narrow viewports. `TitleCellRenderer` wraps the title text in a `Tooltip` component with `maxWidth={600}` — hovering reveals the full masked title.

Implementation:
- Cell uses `min-w-0 overflow-hidden text-ellipsis whitespace-nowrap` for proper CSS truncation
- `text-base` font (not `text-xs`) for readability in the data-dense grid
- Status dot (colored circle) to the left of the text
- Tooltip leverages the enhanced `shared/ui/Tooltip` (now supports `maxWidth` and `className` props)

### 5. Popover as Fixed Centered Modal

The popover is implemented as a **fixed centered modal** (`role="dialog"`, `aria-modal="true"`) with:
- Semi-transparent backdrop (`bg-background/60`)
- Escape key dismissal (useEffect with keydown listener)
- Fixed positioning (`fixed inset-0`) — always visible regardless of grid scroll position
- Centered card layout (`flex items-center justify-center`)
- `useRef` pattern for stable `onClose` callback (avoids stale closure in Escape handler)

**Why fixed centered modal instead of anchor-positioned popover?** The dropdown trigger (⋮ button) doesn't provide a stable anchor element for positioning. Fixed centering is simpler, accessible, works regardless of scroll position, and doesn't require measuring cell geometry. The modal approach also prevents interaction with the grid while editing — desirable because edits mutate the underlying data.

**Safe rows:** The modal hides the "Restore" button for safe rows (nothing to restore). Only "Save" and "Cancel" are available.

### 6. resetPopoverState() Atomic Reset

All popover-related state (`selectedRowIndex`, `isEditing`, `editValue`) is reset atomically via a shared helper. This prevents stale state when:
- User clicks Restore (closes popover + resets edit state)
- User clicks Edit Save (closes popover + resets selection)
- User clicks the X or presses Escape

---

## How to Extend

### Adding a New PII Detector

The UI layer **does not need changes** when adding a new detector. The pipeline produces `AnonymizationEntry[]` with the same shape regardless of how many detectors run. The flow:

1. Add detector in `model/anonymization/detectors/` (implement `PiiDetector` interface)
2. Register in pipeline's detector array
3. Add masking strategy in `model/anonymization/masker.ts` if the new type needs custom masking

The grid will display the new detections automatically — the `TitleCellRenderer` renders based on `status`, not detector type.

### Adding a New Status

If a fourth anonymization status is needed (e.g. `'user_corrected'`):

1. Add to `AnonymizationStatus` type in `model/anonymization/types.ts`
2. Add color entries in:
   - `TitleCellRenderer` → `STATUS_DOT_COLORS` + `STATUS_BG_COLORS`
   - `useAnonymizationGrid` → `ROW_STATUS_CLASSES`
   - `AnonymizationPopover` → `STATUS_DOT_COLORS` + `STATUS_LABELS`
   - `AnonymizationStep/constants.ts` → `LEGEND_ITEMS`
3. Add CSS class in `index.css` (`.anonymization-row-{status}`)
4. Add i18n key in `pl.json` → `import.anonymization.legend.*`
5. Update `isValidFilter` type guard in `useAnonymizationStep`
6. Add tab to `FilterTabs` array in `AnonymizationStep.tsx`

### Adding a New User Action in Popover

1. Add handler in `useAnonymizationStep` (must update store entries + rows if modifying data)
2. Add to `AnonymizationStepResult` interface
3. Pass as prop to `AnonymizationPopover` (via destructuring in `AnonymizationStep.tsx`)
4. Add button/UI in `AnonymizationPopover.tsx`
5. Add test case in `useAnonymizationStep.spec.ts`

### Adding a New Column to the Grid

The grid columns are **fully dynamic** — they're built from `columnMapping` (what the user mapped in step 1). To add a new domain field:

1. Add field to `DomainField` type
2. Add mapping in `useAnonymizationGrid` → `DOMAIN_FIELD_TO_GRID_FIELD`
3. Add i18n header key in `DOMAIN_FIELD_HEADER_I18N`
4. Optionally add fixed width in `COLUMN_WIDTHS`

---

## Boundaries — What This Module Does NOT Handle

| Concern | Where It Lives |
|---------|----------------|
| Running the anonymization pipeline | `useImportWizard.handleMappingConfirm()` |
| PII detection logic (detectors) | `model/anonymization/detectors/` |
| Dictionary loading | `model/anonymization/dictionaries/` |
| Conflict resolution between detectors | `model/anonymization/conflict-resolver.ts` |
| Masking strategies | `model/anonymization/masker.ts` |
| Wizard step navigation state | `useImportWizardStore` |
| Row persistence to backend | `useImportSubmit` (step 4) |
| Cross-file duplicate detection | `model/transformation/duplicate-detector.ts` |

---

## Testing Strategy

### Unit Tests (31 total: 15 + 16)

**`useAnonymizationStep.spec.ts` (15 tests):**
- Stats computation from entries
- Filter state transitions (all → specific status)
- Cell click: opens popover for non-safe, ignores safe
- Close popover: clears selection + edit state
- Bulk accept: marks all entries accepted
- Restore: reverts title to original, sets status=safe, updates store rows, closes popover
- Edit: updates anonymizedTitle + rows, preserves status, marks accepted, closes popover

**`useAnonymizationGrid.spec.ts` (16 tests):**
- Column building from columnMapping (order, headers, widths, flex, dedup)
- Skipping unmappable fields (debit/credit)
- Row joining (anonymizedTitle from entry, status propagation, rowIndex)
- `getRowId` function
- Status filtering (all, specific status, empty results)

### Testing Pattern

Both hooks are tested with `@testing-library/react`'s `renderHook`. Store state is set directly via `useImportWizardStore.setState()` before each test — no mocking of the store itself. Handlers are invoked via `act()`.

```typescript
// Pattern: set store → render hook → act → assert store
beforeEach(() => {
  useImportWizardStore.setState({
    anonymizationEntries: buildEntries(),
    rows: buildRows(),
  });
});

it('restores original title', () => {
  const { result } = renderHook(() => useAnonymizationStep());
  act(() => { result.current.handleRestore(0); });
  const entries = useImportWizardStore.getState().anonymizationEntries;
  expect(entries[0]?.status).toBe('safe');
});
```

### What's NOT Tested Here

- AG Grid rendering (tested at adapter level)
- AnonymizationPopover visual output (Storybook, not unit test)
- AnonymizationStep composition (covered by manual QA + potential E2E)
- Pipeline accuracy (covered by model/ layer tests — 224 tests)

---

## Key Invariants

1. **Positional index stability** — `rows[]` and `anonymizationEntries[]` arrays maintain the same positional ordering from pipeline run until import submission. No reordering, no splicing.

2. **Safe rows have limited actions** — safe rows show only "Edit" in the dropdown (no Restore — nothing to restore). Non-safe rows (`needs_review`, `anonymized`) show both Restore and Edit. All rows are interactive via the dropdown.

3. **Restore = full revert** — restoring a row sets its title back to `originalTitle`, clears all spans, sets status to `safe`. It's a complete undo, not per-span.

4. **Edit preserves status** — editing the anonymized title updates the text but does NOT change the entry's status. The status reflects what the pipeline detected, not what the user did.

5. **Store dual-update** — both `handleRestore` and `handleEdit` update TWO store slices atomically: `anonymizationEntries` (for the anonymization grid) AND `rows` (for downstream steps that use row titles).

6. **Popover state resets atomically** — `resetPopoverState()` clears `selectedRowIndex`, `isEditing`, and `editValue` together. No partial state possible.

7. **Raw data never leaves the browser** — the component displays `originalTitle` ONLY in the popover overlay. Grid cells show `anonymizedTitle`. No raw titles are passed to the backend or logged.

8. **Filter validation at boundary** — `handleFilterChange` validates the incoming string with `isValidFilter` type guard before updating state. Invalid filter strings are silently ignored.

---

## Related Documentation

- [CSV Import Feature (overview)](./csv-import-feature.md) — parent feature architecture
- [PII Anonymizer (technical)](../../architecture/csv-engine/pii-anonymizer.md) — detection pipeline internals
- [CSV Anonymizer Engine (architecture)](../../architecture/csv-engine/overview.md) — full engine design
- [Human-in-the-Loop Anonymization (concept)](../../product/concepts/human-in-the-loop-anonymization.md) — product rationale
- [ADR-007: CSV Import Code Quality Refactoring](../../adr/007-csv-import-code-quality-refactoring.md) — model/ restructuring that preceded this UI work
- [ADR-008: Dropdown Actions Instead of Row Click](../../adr/008-anonymization-step-dropdown-actions.md) — interaction model change (2026-07-10)
