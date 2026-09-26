# DEC-002 — Data for Charts — Backend Aggregates, Front End Draws

## Source status

Historical decision recorded on 2026-06-19. The source provides an explicit decision statement. The source does not assign a separate lifecycle status to this record. Chronological presence does not prove current authority.

## Preserved decision record

**Decision:** The backend serves pre-aggregated data through dedicated query endpoints.

**Rationale:**
- Performance — `SUM(amount) GROUP BY` in SQL, not 10k transactions on the front end
- Consistency — one endpoint for web/mobile/AI
- ABAC — filtering before aggregation

**Endpoints:** `/analytics/spending-by-category`, `/analytics/monthly-trend`, `/analytics/budget-usage`

## Source provenance

- Original source: legacy decision log
- Pre-atomization path: `docs/history/decision-log.md`
- Original identifier: `DEC-002`
- Original order: 2 of 59
- Original source lines: 26–35
- Frozen source commit: `582b3e8b147293c7b33dd0f839839aa81d7c8c20`
