# Session 07: Implement the Opaque Blob Sync API

## Status

**Complete — verified 2026-09-10.** The backend provides an authenticated,
workspace-isolated zero-knowledge relay with atomic compare-and-swap writes.

## Objective

Make the backend a zero-knowledge synchronization relay for authenticated devices. It stores and returns one opaque encrypted snapshot per user/workspace with concurrency metadata, without receiving keys or parsing financial content.

**Prerequisites:** Session 06 snapshot contract is fixed; Session 05 is recommended but not required

## Verified implementation

- `GET /users/me/vault` returns the current opaque ciphertext and revision metadata, or an explicit empty state.
- `PUT /users/me/vault` validates strict base64 transport data and size limits, then performs an atomic revision compare-and-swap.
- First write creates revision 1; matching writes advance the revision; stale writers receive a conflict and cannot overwrite newer data.
- Identical retries are idempotent and do not advance the revision.
- PostgreSQL and in-memory repositories preserve workspace isolation.
- Migration `0003_opaque_vault_sync_metadata` adds the required metadata and defines legacy rows with revision 1; the migration journal includes it.
- The server stores only opaque ciphertext, byte size, hash, revision and timestamps. It does not parse encrypted snapshot content or log secrets.
- The API contract and retention/recovery limitations are documented in `docs/guides/backend/user-settings-module.md`.

## Required tests and evidence

- First upload/read-back, matching-revision update, stale-writer rejection, idempotent retry and workspace isolation are covered.
- PostgreSQL integration covers concurrent writers and proves exactly one winner; the winner's ciphertext survives.
- New persistence guards/parsers have focused tests for valid and corrupted database values.
- Full server run with PostgreSQL integration: **49 suites passed, 315 tests passed**.
- Backend quality gate: **5/5 passed** — build, ESLint, architecture boundaries, strict TypeScript patterns and Jest.
- `git diff --check`: passed.

## Closure evidence


The plan is closed and must not be reopened unless a regression or explicitly
expanded requirement is recorded.
