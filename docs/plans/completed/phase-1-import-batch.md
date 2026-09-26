# Phase 1: Import Batch (backend foundations) — ✅ COMPLETE

> **Source status:** The source heading explicitly marks this phase COMPLETE.

| # | Task | Status |
|---|---|---|
| 1 | Import Batch entity + in-memory repository | ✅ Done |
| 2 | Import transactions command (batch import handler) | ✅ Done |
| 3 | PII validation service | ✅ Done |
| 4 | Import endpoint with feedback loop | ✅ Done |
| 5 | Batch management endpoints | ✅ Done |

### Implemented (Phase 1)

- `ImportBatch` entity — statuses: Pending → InProgress → Complete/PartiallyRejected, `completedAt`, invariant guards, `markPartiallyRejected()` with state guard
- `ImportBatchRepository` port + in-memory adapter
- `ImportTransactionsHandler` — declarative flow, sequential processing, batch-level dedup (`BatchAlreadyImportedError`), per-row dedup (contentHash), workspace ownership validation, PII validation integrated
- `Transaction` entity extended with `contentHash` + `importBatchId` (propagated in all methods)
- `TransactionRepository` port extended with `existsByContentHash(workspaceId, hash)` + `deleteByBatchId(workspaceId, batchId)`
- PII Validation Service: plugin architecture (PII_RULES DI token), 5 rules (IBAN mod97, Card Luhn, PESEL checksum, Email, Phone), Unicode zero-width sanitization
- `POST /imports` endpoint: Zod DTO (SHA-256, max 200 rows, filename sanitization), 201/207/409
- `ImportsModule` imports `TransactionsModule` (shared repo instance)
- Global `DomainExceptionFilter`, CORS, body parser 1mb
- Path alias `@imports/*` + moduleNameMapper
- Batch management: `GET /imports` (paginated), `GET /imports/:id`, `DELETE /imports/:id` (cascade delete transactions)
- `GetImportBatchesHandler`, `GetImportBatchByIdHandler` queries + `DeleteImportBatchHandler` command
- `ImportBatchResponseDto` + `ImportBatchResponseMapper` (string literal status, no domain enum leak)
- `Transaction` entity extended with `workspaceId` — invariant guard, propagation in all methods (S1 security fix)
- `InMemoryTransactionRepository` — `existsByContentHash` and `deleteByBatchId` filter by `workspaceId` (defense-in-depth)
- `TransactionMapper` + `TransactionRecord` — full round-trip with `contentHash`, `importBatchId`, `workspaceId`
- Handlers return `undefined`/`false` for not-found → Controller throws NestJS `NotFoundException` (404)
- `findPaged(workspaceId, PageOptions)` in `ImportBatchRepository` port + implementation

### Tests (Phase 1)

- 18 unit tests for `ImportBatch` entity
- 9 unit tests for `ImportTransactionsHandler`
- 3 unit tests for `DeleteImportBatchHandler`
- 5 unit tests for `GetImportBatches/GetImportBatchById` handlers
- 40 unit tests for PII rules (it.each)
- 5 unit tests for PiiValidationService orchestrator
- 15 integration tests for `ImportsController` (supertest)
- 1 existing test in `app.controller`
- **Total: 98/98 PASS, tsc --noEmit clean**

---

## Source provenance

- Original source: legacy development plan
- Pre-atomization path: `docs/plans/roadmap.md`
- Original source lines: 3–47
- Frozen source commit: `582b3e8b147293c7b33dd0f839839aa81d7c8c20`
