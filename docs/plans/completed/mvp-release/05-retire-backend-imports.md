# Session 05: Retire the Backend Imports API

## Objective

Remove the obsolete server-side import transport and persistence so the backend cannot accept or expose imported financial rows through `/imports`.

**Status:** Complete — implementation verified in the working tree on 2026-09-08
**Prerequisite:** Session 03 complete and verified in the target branch

## Delivered

- Removed `ImportsModule`, its controller, handlers, repositories, PII validation service, DTOs, aliases and focused tests.
- Removed the `ImportBatch` shared-domain entity after repository-wide dead-code verification. The frontend/local history uses its own local persistence records.
- Removed server transaction runtime dependencies on `importBatchId`, `deleteByBatchId` and server-side content-hash lookup. Existing `content_hash` storage remains for compatibility with transaction records and local dedupe semantics.
- Added `0002_retire-backend-imports.sql`, which drops `import_batches` and `transactions.import_batch_id` without rewriting earlier migrations.
- Added an e2e assertion that `GET /api/imports` returns `404`.
- Updated current backend, domain, frontend import and architecture guides. Historical plans, ADRs and source-era assumptions remain unchanged.

## Migration behavior and rollback limitation

The migration permanently removes the server-side import-batch table and the transaction-to-batch column. It does not delete transaction rows, profiles, categories, or other retained backend data. There is no automatic rollback migration: restoring the removed table/column would require a deliberate follow-up migration and a backup containing the old schema/data.

The generated migration also creates the existing `invite_codes` table because the current Drizzle schema contains it while the committed migration snapshot did not. This preserves the existing invite-code backend responsibility and reconciles the migration chain without rewriting history.

## Remaining financial-domain endpoint audit

The following endpoints remain intentionally outside this session:

- `/api/transactions` — CRUD transaction API
- `/api/categories` — CRUD category API
- `/api/import-profiles` — import-profile CRUD and detection API

They are not silently retired here; any further removal requires a separate plan.

## Exact verification results

- `rg -n "ImportsModule|@imports|Controller\(['\"]imports\)" server/src server/tsconfig.json server/package.json` — no matches.
- `npm run build --workspace=server` — passed.
- `npm run typecheck --workspace=packages/domain` — passed.
- `npm run test --workspace=packages/domain` — 8 suites, 192 tests passed.
- `JWT_SECRET=... JWT_REFRESH_SECRET=... npm run test --workspace=server -- --runInBand` — 39 suites, 283 tests passed.
- `JWT_SECRET=... JWT_REFRESH_SECRET=... npm run test:e2e --workspace=server -- --runInBand` — 2 suites, 9 tests passed.
- `npm run lint:strict --workspace=server` — passed.
- `git diff --check` — passed.
