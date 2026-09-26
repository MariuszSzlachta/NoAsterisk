# Planning Map

Planning describes future work or historical execution intent. It is not authoritative documentation of implemented behavior.

## Roadmap and active work

- [Development roadmap](./roadmap.md) — concise phase ordering and lifecycle navigation.
- [Sprint priorities](./completed/sprint-next-priorities.md) — completed Tier 1–4 source-era priority plan.
- [MVP release closure](./active/mvp-closure-plan.md) — ordered index of independently executable release sessions.

### MVP release sessions

1. [Restore the frontend baseline](./completed/mvp-release/01-frontend-baseline.md)
2. [Build the encrypted IndexedDB foundation](./completed/mvp-release/02-encrypted-indexeddb-foundation.md)
3. [Cut CSV import over to encrypted local persistence](./completed/mvp-release/03-local-import-persistence.md)
4. [Add encrypted local import history](./completed/mvp-release/04-local-import-history.md)
5. [Retire the backend imports API](./completed/mvp-release/05-retire-backend-imports.md)
6. [Make the encrypted snapshot complete](./completed/mvp-release/06-vault-completeness.md)
7. [Implement the opaque blob sync API](./completed/mvp-release/07-opaque-blob-sync-api.md)
8. [Implement cross-device sync on the client](./completed/mvp-release/08-multi-device-sync-client.md)
9. [Retire financial APIs and implement the data lifecycle](./completed/mvp-release/09a-data-lifecycle-and-account-deletion.md)
10. [Replace password-derived encryption with split-unlock VMK and optional passkey PRF](./active/mvp-release/09b-device-bound-vault-and-sync-chain.md)
11. [Implement privacy, terms and consent](./active/mvp-release/09-privacy-terms-consent.md)
12. [Validate and finalize legal copy](./active/mvp-release/10-legal-copy-validation.md)
13. [Audit and adapt mobile responsiveness](./active/mvp-release/11-mobile-responsiveness-audit.md)
14. [Run the release quality gate](./active/mvp-release/12-release-quality-gate.md)
15. [Prepare and execute deployment](./active/mvp-release/13-deployment.md)
16. [Penetration test and sign off the release](./active/mvp-release/14-pentest-release-signoff.md)

## Completed phase records

- [Repository quality gate](./completed/code-quality-gate.md) — superseded source-era quality plan, retained as a completion record.
- [PostgreSQL and Drizzle persistence](./completed/postgresql-drizzle-persistence.md)
- [User settings backend](./completed/user-settings-backend.md)
- [User settings frontend](./completed/user-settings-frontend.md)
- [Legacy E2EE vault plan](./completed/e2ee-vault-legacy.md) — superseded by Vault v2.
- [Admin rules technical-debt closure](./completed/admin-rules-tech-debt.md)
- [Phase 1 — Import Batch](./completed/phase-1-import-batch.md)
- [Phase 2 — Categorization Rules](./completed/phase-2-categorization-rules.md)
- [Phase 2.5 — Auth + ABAC](./completed/phase-2-5-auth-abac.md)
- [Phase 3 — Import Profiles](./completed/phase-3-import-profiles.md)
- [Phase 4.0 — Frontend Setup](./completed/phase-4-0-frontend-setup.md)
- [Phase 4.1 — App Shell](./completed/phase-4-1-app-shell.md)
- [Phase 4.2 — Dashboard Widgets](./completed/phase-4-2-dashboard-widgets.md)
- [Phase 4.3 — CSV Import](./completed/phase-4-3-csv-import.md)
- [Phase 4.6 — Budget Period Closure & Rollover FE](./completed/phase-4-6-closure-rollover-fe.md)
- [Phase 4.4 — Transactions List](./completed/transactions-list.md)
- [Tier 1 — Security Fixes + Dashboard Real Data](./completed/tier-1-security-dashboard.md)
- [Tier 2 BE — ABAC Enforcement](./completed/tier-2-be-abac.md)
- [Tier 2 FE — Login Page + Analytics Real Data](./completed/tier-2-fe-login-analytics.md)

## Deferred work

- [Post-MVP backlog](./deferred/post-mvp-backlog.md)
- [Phase 5 — Admin/Maintenance](./deferred/phase-5-admin-maintenance.md)
- [Original product future work](./deferred/original-product-future-work.md)

## Archived plans

- [Shared-domain refactoring](./archive/shared-domain-refactoring.md)
- [Preview-grid improvements](./archive/preview-grid-improvements.md)
- [Anonymization UI](./archive/anonymization-ui.md)
- [Phase 4.2.7 dashboard enhancements](./archive/phase-4-2-7-dashboard-enhancements.md) — mixed/unresolved source status.
- [Phase 4.2.8 dashboard polish](./archive/phase-4-2-8-dashboard-polish.md) — mixed specification and completion evidence.

Archived plans retain rationale and sequencing but may be superseded by ADRs or current developer guides.

## Historical numbering

Original identifiers remain unchanged, including 2.5, 4.0, 4.1.5, 4.2.7, 4.2.8 and 4.3.E–J. Placement under `completed` records a source-supported status, not independent verification against application code.
