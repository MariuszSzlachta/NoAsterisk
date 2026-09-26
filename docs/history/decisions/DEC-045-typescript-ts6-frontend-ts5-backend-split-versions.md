# DEC-045 — TypeScript — TS6 frontend, TS5 backend (split versions)

## Source status

Historical decision recorded on 2026-06-26. The source provides an explicit decision statement. The source does not assign a separate lifecycle status to this record. Chronological presence does not prove current authority.

## Preserved decision record

**Date:** 2026-06-26

**Decision:** The frontend uses TypeScript 6.0 with `erasableSyntaxOnly: true`. The backend remains on TypeScript 5.9 without this flag.

**Justification:**
- NestJS relies on parameter properties (`private readonly` in constructor) and parameter decorators (`@Inject()`) — both are "non-erasable syntax" blocked by TS6 `erasableSyntaxOnly`
- Upgrading the backend to TS6 would require modifying ~43 files (DI pattern) OR disabling `erasableSyntaxOnly` (which eliminates the point of the upgrade)
- NestJS has not officially announced support for TS6 erasable mode
- The frontend does not have these limitations (no DI with decorators, classes use `#private` fields)

**Plan:** Upgrade the backend to TS6 when NestJS releases a compatible version (expected NestJS 12 or 11.x minor).

## Source provenance

- Original source: legacy decision log
- Pre-atomization path: `docs/history/decision-log.md`
- Original identifier: `DEC-045`
- Original order: 45 of 59
- Original source lines: 864–876
- Frozen source commit: `582b3e8b147293c7b33dd0f839839aa81d7c8c20`
