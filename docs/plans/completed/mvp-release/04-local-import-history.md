# Session 04: Add Encrypted Local Import History

**Status:** Complete — verified 2026-09-09

**Implementation commit:** `82d470f` (`feat(client): complete encrypted vault and frontend quality`)

## Objective

Satisfy the import-history product requirement without a backend import API. Users must be able to inspect locally stored import batches and delete a batch together with its imported transactions.

**Prerequisite:** Session 03 complete

## Scope

1. Define a minimal local `ImportHistoryRecord` containing a stable batch ID, display filename, completion timestamp, accepted count, duplicate count and rejected count. Do not store raw rows or original titles.
2. Persist history through the encrypted IndexedDB port from Session 02. Zustand may expose hydrated in-memory state but must not use `localStorage` persistence.
3. Write the history record only after the local transaction write succeeds.
4. Add a user-visible import-history page or panel reachable from normal navigation.
5. Support viewing batch summary and deleting a batch.
6. Deleting a batch must atomically remove its history record and transactions carrying that batch ID. It must not remove manually created transactions or another batch.
7. Define duplicate filename behavior: filenames are labels, never identifiers.
8. Add i18n keys and responsive empty/loading/error/confirmation states using the existing design system.

## Non-goals

- No server pagination, server migration or `/imports` fallback.
- No raw CSV download or rehydration.
- No plaintext history table or `localStorage` fallback.
- No cross-device merge behavior.

## Required tests

- history creation after successful import;
- no history entry after failed/rolled-back import;
- duplicate filenames create distinct records;
- batch deletion removes only linked transactions;
- manual transactions survive batch deletion;
- empty-state and destructive confirmation behavior;
- persistence hydration rejects malformed records safely.

## Gates

```bash
npm run build --workspace=client
npm run test --workspace=client
npm run lint --workspace=client
git diff --check
```

Perform a visual check at desktop and narrow mobile widths for populated, empty and delete-confirmation states. Attach screenshots or record their paths in the handoff.

## Handoff

- Route/navigation entry added.
- Persisted history schema.
- Deletion transaction semantics.
- Visual evidence and exact automated gate results.

## Completion evidence

- Import-history domain suite: passed — 153 files; 1335 passed, 8 expected failures.
- Client build: passed.
- Client lint: passed with 8 existing Fast Refresh warnings in `dashboard-widgets/widget-registry.tsx`.
- Frontend quality gate: passed with 32 existing style warnings and no errors.
- Repository-wide Playwright gate: passed — 105 tests.
- Import-history E2E: passed — empty state, duplicate filenames as distinct batches, destructive confirmation and single-batch deletion.
- Visual verification: passed at desktop and 390px narrow viewport; screenshots recorded in the session handoff.
- `git diff --check`: passed.
