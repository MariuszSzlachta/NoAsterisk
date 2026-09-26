# Session 03: Cut CSV Import Over to Encrypted Local Persistence

**Status:** Complete — verified 2026-09-09

**Implementation commit:** `75d6c6e` (`feat: persist local CSV imports securely`)

## Objective

Make the CSV wizard persist accepted transactions through the encrypted IndexedDB repository created in Session 02, without calling `POST /imports` or writing financial data to `localStorage`.

**Prerequisite:** Session 02 complete

## Architectural boundary

- The final import action writes through the encrypted persistence port backed by Dexie/IndexedDB. Zustand may cache decrypted records in memory but is not the durable store.
- Neither raw rows nor anonymized rows are sent to the backend.
- Dictionary fetching from `GET /dictionaries` remains allowed.
- Raw CSV data and original titles stay in wizard memory and are cleared when the flow ends or is abandoned.

## Scope

1. Trace `TransactionRow` through anonymization, validation, categorization and the existing `StoredTransaction` shape. Define a pure mapper at the feature boundary.
2. Replace `useImportMutation`/chunk HTTP submission with an encrypted IndexedDB transaction.
3. Deduplicate atomically using the stable content hash. Detect duplicates both inside the current file and against existing local transactions.
4. Persist only accepted, post-review transaction data. Encrypt every record through the Session 02 adapter before it reaches IndexedDB. Never persist raw CSV cells or original PII.
5. Preserve user feedback: accepted count, duplicate count, rejected rows and terminal success/failure state. Remove network retry/chunk concepts that no longer apply.
6. Ensure a completed import cannot be submitted twice from stale wizard state.
7. Remove dead client `/imports` API code, exports, tests and translations after the cutover.
8. Add an explicit test that spies on the HTTP client and proves the complete import action performs no `/imports` request.

## Non-goals

- Import-history UI and batch deletion belong to Session 04.
- Backend module removal belongs to Session 05.
- Do not bypass the encrypted repository with direct Dexie calls from feature code.
- Do not persist the wizard itself or original CSV material.

## Required tests

- mapping preserves amount, date, currency, category and content hash;
- original title/PII is absent from persisted records;
- duplicate rows are skipped deterministically;
- local write is all-or-nothing on validation failure;
- successful import updates the transactions store and completion summary;
- repeated submit does not duplicate data;
- no call targets `/imports`;
- no financial transaction is written to `localStorage` or plaintext IndexedDB fields.

## Gates

```bash
rg -n "['\"]\/imports" client/src
npm run build --workspace=client
npm run test --workspace=client
npm run lint --workspace=client
git diff --check
```

The `rg` command must return no client runtime call to `/imports`. Historical documentation and tests that explicitly assert absence may still contain the string.

## Handoff

- Local persistence boundary and mapper used.
- Deduplication key and atomicity behavior.
- Proof that raw/original data is not persisted.
- Exact build/test/lint results.

## Completion evidence

- No client runtime reference to `/imports` remains.
- `npm run build --workspace=client`: passed.
- `npm run test --workspace=client`: 290 test files passed; 2588 tests passed and 8 expected failures remain explicitly tracked by the suite.
- `npm run lint --workspace=client`: passed with existing Fast Refresh warnings.
- `git diff --check`: passed.
