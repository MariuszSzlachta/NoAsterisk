# DEC-046 — Infinite scroll (non-classical pagination) on the transaction list

## Source status

Historical decision recorded on 2026-06-26. The source provides an explicit decision statement. The source does not assign a separate lifecycle status to this record. Chronological presence does not prove current authority. This source identifier occurs twice. The filename suffix is a migration-level disambiguator only and is not part of the historical decision number. Owner resolution remains required.

## Preserved decision record

**Date:** 2026-06-26

**Decision:** The transaction list uses infinite scroll with AG Grid virtualization. The backend returns data in pages (offset/limit), and the frontend automatically loads subsequent chunks when scrolling.

**Rejected:** Classical pagination with page controls.

**Justification:**
- Date filters eliminate the need to jump to a specific page
- UX for budgeting = natural feed (chronological scrolling as in banking)
- AG Grid Community supports virtualization OOB — zero custom code
- Design does not include a paginator — the footer shows status (count, sum)

## Source provenance

- Original source: legacy decision log
- Pre-atomization path: `docs/history/decision-log.md`
- Original identifier: `DEC-046`
- Original order: 50 of 59
- Original source lines: 945–957
- Frozen source commit: `582b3e8b147293c7b33dd0f839839aa81d7c8c20`
