# Deferred (post-MVP)

> **Source status:** The source explicitly labels this material as deferred until post-MVP. Items marked ~~strikethrough~~ are superseded by ADR-003 (local-first E2EE) or completed in Tier 1/2.

- ~~Analytics module (aggregates, charts)~~ — ✅ Completed (Tier 2 FE: analytics from real store data)
- ~~PostgreSQL + Drizzle (transition from in-memory)~~ — **Superseded by ADR-003.** Financial data remains client-side (IndexedDB). Backend retains only user auth + encrypted blobs. See [ADR-003 Phase 2](../completed/sprint-next-priorities.md).
- Provider-neutral AI-assisted categorization
- ~~Optimistic locking + Unit of Work (with PostgreSQL)~~ — **Superseded.** No server-side persistence of financial data planned.
- Refresh token flow (httpOnly cookie)
- **Budget notifications** — user-configurable threshold per budget (e.g. 80%) + notification when approaching/exceeding limit with N days remaining in month (requires notification system infrastructure)

---

## Source provenance

- Original source: legacy development plan
- Pre-atomization path: `docs/plans/roadmap.md`
- Original source lines: 595–605
- Frozen source commit: `582b3e8b147293c7b33dd0f839839aa81d7c8c20`
