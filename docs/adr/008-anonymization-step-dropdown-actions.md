# ADR-008: Anonymization Step — Dropdown Actions Instead of Row Click

**Date:** 2026-07-10
**Status:** Accepted
**Context:** Anonymization step (step 2 of CSV import wizard) needed a clear interaction model for per-row actions (edit masked text, restore original). The initial implementation used row click + anchor-positioned popover.

---

## Problem

The initial interaction model had multiple UX issues:

1. **No visual affordance** — clicking a row to open a popover is not discoverable. Users don't know rows are interactive.
2. **Safe rows not clickable** — safe (no PII) rows did nothing on click, creating inconsistent behavior. Users click a green row, nothing happens — confusing.
3. **Anchor positioning fragile** — popover positioned relative to the clicked cell required manual anchor measurement and broke on scroll.
4. **Destructive action without re-confirmation** — "Restore" button in popover reverts anonymization immediately. With one-click access via row click, accidental restores were too easy.
5. **Mobile/touch unfriendly** — row click conflicts with touch scrolling gestures.

---

## Decision

Replace row click + anchor-positioned popover with **per-row dropdown action menu** + **fixed centered modal** for edit/review.

### Interaction Model (new):

```
Row → Dropdown icon (⋮) → Actions menu (context-dependent per status)
  └── "Restore" → immediate restore (status → safe)
  └── "Edit" → opens fixed centered modal with edit input
```

### Key changes:

| Aspect | Before | After |
|--------|--------|-------|
| Trigger | Row click (invisible) | Dropdown button (visible ⋮) |
| Popover position | Anchored to cell (fragile) | Fixed centered modal (stable) |
| Safe row interaction | Blocked (no click handler) | Dropdown shows "Edit" only (no Restore) |
| Grid port API | `onCellClick` handler | `rowActions: (row) => RowAction[]` |
| Actions per status | Same for all non-safe | Dynamic: safe=Edit, non-safe=Restore+Edit |

### Dynamic `rowActions` in grid port:

```typescript
// Before (static)
rowActions?: RowAction<TRow>[];

// After (static OR dynamic)
rowActions?: RowAction<TRow>[] | ((row: TRow) => RowAction<TRow>[]);
```

Backward-compatible — existing consumers passing static arrays continue to work unchanged.

---

## Alternatives Considered

### 1. Keep row click + improve with hover hint
**Rejected:** Adding hover tooltips ("click to review") still doesn't solve safe-row inconsistency or anchor positioning issues. Discoverability remains poor.

### 2. Inline edit (AG Grid edit mode)
**Rejected:** AG Grid Community inline editing replaces cell content with an input. For anonymization review, users need to see original vs masked side-by-side — requires a modal/panel, not inline replacement.

### 3. Side panel (selection-driven)
**Rejected:** Permanently visible side panel wastes horizontal space. With 400px min-width on the title column, a side panel would force horizontal scrolling on standard screens.

### 4. Row expand (accordion)
**Rejected:** AG Grid Community doesn't support row expand natively. Would require custom cell rendering with state management — equivalent complexity to the modal approach but worse UX (pushes rows down, loses scroll position).

---

## Consequences

### Positive
- **Clear affordance** — dropdown icon visible on every row, universally understood
- **Consistent** — all rows have actions (safe=Edit, non-safe=Restore+Edit)
- **Scroll-safe** — fixed modal doesn't depend on cell position
- **Extensible** — adding new per-row actions (e.g. "Flag as false positive") = add to the actions array
- **Reusable** — dynamic `rowActions` in grid port benefits future grids (transactions list, batch management)

### Negative
- Extra click required (dropdown → action) vs direct row click — acceptable trade-off for discoverability
- Dropdown column takes ~48px width — minimal impact given title column flex:1 + minWidth:400

### Grid Port Change
- `minWidth` added to `GridColumn` — enables ensuring title column never shrinks below readable width
- `rowActions` accepts function `(row: TRow) => RowAction<TRow>[]` — backward-compatible, no migration needed for existing consumers

---

## Related

- [Anonymization Step Developer Guide](../guides/frontend/csv-import-anonymization-step.md)
- [ADR-007: CSV Import Code Quality Refactoring](./007-csv-import-code-quality-refactoring.md)
- [Human-in-the-Loop Anonymization (concept)](../product/concepts/human-in-the-loop-anonymization.md)
