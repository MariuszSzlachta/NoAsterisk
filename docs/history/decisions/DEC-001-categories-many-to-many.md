# DEC-001 — Categories — many-to-many

## Source status

Historical decision recorded on 2026-06-19. The source provides an explicit decision statement. The source does not assign a separate lifecycle status to this record. Chronological presence does not prove current authority.

## Preserved decision record

**Decision:** Categories as a dedicated module with a many-to-many relationship to transactions (Transaction ↔ Category).

**Rejected:** Generic tagging system.

**Rationale:**
- Category is a first-class domain concept (rule engine, AI categorization)
- A transaction may have multiple categories (e.g., "Food" + "Company")
- Sub-budget will aggregate by `categoryIds[]`

**Implications:** `Transaction.categoryIds: string[]`, `categories/` module with CRUD, OR logic filtering.

## Source provenance

- Original source: legacy decision log
- Pre-atomization path: `docs/history/decision-log.md`
- Original identifier: `DEC-001`
- Original order: 1 of 59
- Original source lines: 11–22
- Frozen source commit: `582b3e8b147293c7b33dd0f839839aa81d7c8c20`
