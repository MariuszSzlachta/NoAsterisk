# DEC-011 — Shared module instance via imports (no duplication of providers)

## Source status

Historical decision recorded on 2026-06-20. The source provides an explicit decision statement. The source does not assign a separate lifecycle status to this record. Chronological presence does not prove current authority.

## Preserved decision record

**Date:** 2026-06-20

**Decision:** `ImportsModule` imports `TransactionsModule` instead of duplicating the `TRANSACTION_REPOSITORY` provider.

**Rationale:**
- Duplicate provider = separate in-memory repository instance → transactions "disappear" between modules
- NestJS module exports guarantee shared singleton instance
- With PostgreSQL — shared connection pool, consistent data

## Source provenance

- Original source: legacy decision log
- Pre-atomization path: `docs/history/decision-log.md`
- Original identifier: `DEC-011`
- Original order: 11 of 59
- Original source lines: 142–151
- Frozen source commit: `582b3e8b147293c7b33dd0f839839aa81d7c8c20`
