# DEC-052 — Atomic Composition in Layout Components

## Source Status

Historical decision recorded on 2026-06-26. The source provides an explicit decision statement. The source does not assign a separate lifecycle status to this record. Chronological presence does not prove current authority.

## Preserved Decision Record

**Date:** 2026-06-26

**Decision:** Layout components (Sidebar, TopBar) are built from small atoms. Each atom is a separate file. Composition component (e.g., TopBar.tsx) ONLY composes — zero inline styling logic.

**Pattern:**
```
TopBar/
  TopBar.tsx          ← composition (imports + JSX layout)
  SearchButton.tsx    ← atom
  NotificationBell.tsx ← atom (reuses shared/ui/Button)
  ThemeToggle.tsx     ← atom (reuses shared/ui/Button)
  ImportCsvLink.tsx   ← atom
  MobileMenuButton.tsx ← atom (reuses shared/ui/Button)
  index.ts            ← exports TopBar only
```

**Rules:**
- Reuse design system (shared/ui/Button, shared/ui/Badge) — DO NOT write inline buttons
- Atoms are private (not exported from index.ts) unless reusable across layouts
- Each atom has one responsibility
- The folder/index.ts barrel exports ONLY the public component

**Rationale:**
- Readability: TopBar.tsx is 30 lines of composition, not 80 lines of inline code
- Testability: atoms can be tested in isolation
- DRY: Button from the design system is reused — no duplicated styles

## Source Provenance

- Original source: legacy decision log
- Pre-atomization path: `docs/history/decision-log.md`
- Original identifier: `DEC-052`
- Original order: 53 of 59
- Original source lines: 999–1026
- Frozen source commit: `582b3e8b147293c7b33dd0f839839aa81d7c8c20`
