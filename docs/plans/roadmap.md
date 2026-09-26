# NoAsterisk Development Roadmap

This roadmap is the navigation and sequencing view extracted from the legacy development plan. Phase files preserve detailed source-era scope, outcomes, checklists and specifications. A completed label records the source claim; it is not independently verified against application code in this documentation-only repository.

## Phase sequence

| Order | Historical phase | Source-supported lifecycle | Detailed record |
|---:|---|---|---|
| 1 | Phase 1 — Import Batch | Complete | [Phase 1](./completed/phase-1-import-batch.md) |
| 2 | Phase 2 — Categorization Rules | Complete | [Phase 2](./completed/phase-2-categorization-rules.md) |
| 3 | Phase 2.5 — Auth + ABAC | Complete | [Phase 2.5](./completed/phase-2-5-auth-abac.md) |
| 4 | Phase 3 — Import Profiles | Complete | [Phase 3](./completed/phase-3-import-profiles.md) |
| 5 | Phase 4.0 — Frontend Setup | Complete | [Phase 4.0](./completed/phase-4-0-frontend-setup.md) |
| 6 | Phase 4.1 — App Shell | Complete | [Phase 4.1](./completed/phase-4-1-app-shell.md) |
| 8 | Phase 4.2 — Dashboard Widgets | Complete | [Phase 4.2](./completed/phase-4-2-dashboard-widgets.md) |
| 9 | Phase 4.2.7 — Dashboard Enhancements | Mixed/unresolved | [Phase 4.2.7](./archive/phase-4-2-7-dashboard-enhancements.md) |
| 10 | Phase 4.2.8 — Dashboard Polish | Mixed/unresolved | [Phase 4.2.8](./archive/phase-4-2-8-dashboard-polish.md) |
| 11 | Phase 4.3 — CSV Import | Complete; E.16 deferred | [Phase 4.3](./completed/phase-4-3-csv-import.md) |
| 12 | Phase 4.4 — Transactions List | Complete | [Phase 4.4](./completed/transactions-list.md) |
| 13 | Phase 4.5 — Budgets Page | Complete | [Phase 4.5](./completed/budgets-page.md) |
| 14 | Phase 4.6 — Budget Period Closure & Rollover FE | Complete | [Phase 4.6](./completed/phase-4-6-closure-rollover-fe.md) |
| 15 | Phase 5 — Admin/Maintenance | Deferred post-MVP | [Phase 5](./deferred/phase-5-admin-maintenance.md) |
| — | Tier 1 — Security + Dashboard Real Data | Complete | [Tier 1](./completed/tier-1-security-dashboard.md) |
| — | Tier 2 BE — ABAC Enforcement | Complete | [Tier 2 BE ABAC](./completed/tier-2-be-abac.md) |
| — | Tier 2 FE — Login + Analytics Real Data | Complete | [Tier 2 FE](./completed/tier-2-fe-login-analytics.md) |

## Historical numbering

Phase identifiers are preserved exactly. Decimal insertions (2.5, 4.1.5, 4.2.7, 4.2.8) and lettered subphases (4.3.E–J) reflect historical planning order and are not silently renumbered. “Step 3” anonymization wording conflicts with ADR-008’s “step 2” wording and remains unresolved.

## Historical milestone: MVP

The original MVP was defined as Phase 1-3 (backend) + Phase 4.0-4.3 (frontend). That definition underestimated the usable release scope and is no longer the release contract.

The owner confirmed on 2026-09-07 that CSV import is frontend-local under the local-first/E2EE direction: financial rows are encrypted at rest in browser IndexedDB and may reach the backend only inside an opaque encrypted sync blob. The backend exchanges that zero-knowledge blob to synchronize authenticated devices; it does not accept CSV rows or financial plaintext. The historical requirement to import rows to the server and browse server import history is superseded for current planning.

The current independently executable release sequence and acceptance contract are maintained in the [MVP release closure plan](./active/mvp-closure-plan.md).

Before that contract can close, [Session 09B](./active/mvp-release/09b-device-bound-vault-and-sync-chain.md)
must implement [ADR-012](../adr/012-device-bound-vault-root-key-and-sync-chain.md):
the password-derived vault format is replaced by a random client-held VMK, split
trusted-browser unlock and optional passkey PRF; pre-release v1 financial stores are
reset without data migration.

---

## Deferred work

- [Post-MVP backlog](./deferred/post-mvp-backlog.md)
- [Phase 5 — Admin/Maintenance](./deferred/phase-5-admin-maintenance.md)
- [Original product future work](./deferred/original-product-future-work.md)

## Frozen aggregate provenance

The complete pre-atomization roadmap remains available at this path in Git commit
`582b3e8b147293c7b33dd0f839839aa81d7c8c20`.
