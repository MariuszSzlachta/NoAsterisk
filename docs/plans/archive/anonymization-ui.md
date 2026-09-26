# Step 3: Anonymization UI — Findings from the Conversation (2026-07-06)

> **Archived plan:** Preserved for historical rationale. The row/cell-click interaction below is superseded by [ADR-008](../../adr/008-anonymization-step-dropdown-actions.md). The source also calls this “Step 3”, while ADR-008 calls it “step 2”; product-flow numbering requires owner verification.

## Decisions Made

1. **Anonymization runs AUTO** — no manual trigger required, the pipeline runs automatically on all rows
2. **AG Grid** — we use the existing DataGrid adapter (not a custom table), as it provides virtualization for free
3. **Dynamic columns** — they come from what the user imported (from `columnMapping`), not hardcoded DATE/OPIS/KWOTA
4. **Virtualization** — AG Grid Community has built-in row virtualization, which handles 1800 rows without issues

## UI from the design (mockup [NoAsterisk.dc.html](../../design/mockups/NoAsterisk.dc.html) + [screenshots](../../design/mockups/screenshots/))

### Layout

```
┌──────────────────────────────────────────────────────────────┐
│ Header: "Data Anonymization"                                │
│ Description: "Personal data is detected and masked locally..."    │
│ CTA: [Accept All Suggestions] (primary, top right)          │
├──────────────────────────────────────────────────────────────┤
│ Legend: 🟢 Safe | 🟡 To Review | 🔴 Anonymized │
│ Hint: "Click a cell to see the original"                    │
├──────────────────────────────────────────────────────────────┤
│ AG Grid (full width):                                      │
│   Columns: [dynamic from mapping] — e.g. DATA | OPIS | KWOTA│
│   Per row:                                                 │
│     - border-left 2px in the color of the status            │
│     - colored dot (dot) indicating the status before the description │
│     - cell background color for the description = soft status color │
│     - monospace font on the description                     │
│   On click: popover showing original vs masked              │
├──────────────────────────────────────────────────────────────┤
│ Stats bar: "Scanned 245 cells • 12 anonymized • 3…"        │
├──────────────────────────────────────────────────────────────┤
│ [Back]                                    [Next →]          │
└──────────────────────────────────────────────────────────────┘
```

### Popover (on cell click)

- Status badge (e.g., "Anonymized" with a colored dot)
- Section "ORIGINAL" — raw text in monospace, border, gray background
- Section "AFTER ANONYMIZATION" — masked text in monospace
- Buttons: "Restore" (secondary) | "Edit" (primary)

### Row Statuses

| Status | Color | Description |
|--------|-------|-------------|
| safe (Safe) | `--income` (green) | No PII detected |
| needs_review (To Review) | `--warning` (yellow) | Confidence 0.7–0.9 |
| anonymized (Anonymized) | `--expense` (red) | Auto-masked (confidence ≥ 0.9) |

### Stats Bar

- "Scanned **N** cells"
- "• 🔴 X anonymized"
- "• 🟡 Y to review"

## What Already Exists (model/ — complete)

- 10 PII detectors (IBAN, card, PESEL, NIP, national ID, birth date, phone, email, name, address)
- Conflict resolver, masker, pipeline orchestrator
- Dictionary provider (dev stubs)
- `processRows()` — returns `AnonymizationEntry[]` with `originalTitle`, `anonymizedTitle`, `spans`, `status`
- `AnonymizationEntry` has: `rowIndex`, `originalTitle`, `anonymizedTitle`, `spans`, `status`, `accepted`

## What Needs to Be Done (UI layer)

- [ ] Replace `AnonymizationStepPlaceholder` with a full `AnonymizationStep`
- [ ] Hook `useAnonymizationStep` — runs the pipeline, manages the state of entries
- [ ] Custom cell renderer for the "title" column — dot + monospace + background color
- [ ] Row styling (border-left via AG Grid `getRowStyle` or `rowClassRules`)
- [ ] Popover component (on cell click — original vs masked + Restore/Edit)
- [ ] Stats bar (computed from entries)
- [ ] "Accept All Suggestions" — bulk accept
- [ ] Restore/Edit per row (user correction flow)
- [ ] Dynamic columns from `columnMapping`

## Open Questions to Be Decided

- How does "Edit" work in the popover? Inline editing of the masked text? Or a popover with an input?
- Does "Restore" restore the entire original (zero masking) or per span?
- When does the pipeline run in the flow? On mount of the step (lazy) or eager on mapping confirmation (like now)?
- Do we need to filter the grid by status (show only "to review")?
