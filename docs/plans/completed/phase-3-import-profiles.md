# Phase 3: Import Profiles (backend) — ✅ COMPLETE

> **Source status:** The source heading explicitly marks this phase COMPLETE.

| # | Task | Status |
|---|---|---|
| 11 | ImportProfile entity + value objects (ColumnMapping, ParserConfig, AnonymizationConfig) | ✅ Done |
| 12 | Repository port + in-memory adapter (workspace-scoped) | ✅ Done |
| 13 | Create + Update command handlers | ✅ Done |
| 14 | Get + Delete handlers + controller + Zod DTOs | ✅ Done |
| 15 | Profile auto-detect (match profile by CSV headers) | ✅ Done |
| 16 | Integration with import flow (optional profileId in import) | ✅ Done |

### Implemented (Phase 3)

- `ImportProfile` entity — invariant guards (id, workspaceId, name max 255, columnMappings non-empty + unique sourceColumn), immutable `update()`, `matchesHeaders(headers)` behavior
- Value Objects: `ColumnMapping` (sourceColumn, targetField, isRequired), `ParserConfig` (delimiter, hasHeader, dateFormat, encoding), `AnonymizationConfig` (fieldsToAnonymize, strategy + Set-based equals)
- `AnonymizationStrategy` enum (Hash, Mask, Remove)
- `ImportProfileRepository` port + `InMemoryImportProfileRepository` (workspace-scoped: findById, findByWorkspaceId, findByName, delete)
- `CreateImportProfileHandler` — name uniqueness per workspace, constructs VOs from plain command data
- `UpdateImportProfileHandler` — workspace-scoped, name uniqueness on change, immutable update
- `DeleteImportProfileHandler` — workspace-scoped, returns boolean
- `GetImportProfilesHandler`, `GetImportProfileByIdHandler` — workspace-scoped queries
- `DetectImportProfileHandler` — first-match semantics via entity.matchesHeaders()
- `ImportProfileResponseMapper` + DTO (string literals, explicit STRATEGY_TO_DTO record)
- Shared `STRATEGY_FROM_DTO` mapper in `application/mappers/strategy.mapper.ts`
- `ImportProfilesController` — thin (validate→delegate→respond), zero domain imports
- Zod DTOs: `.strict()` on all schemas, `z.enum(['Hash','Mask','Remove'])` (AP-2), `delimiter.max(10)`
- `ImportProfilesModule` — exports IMPORT_PROFILE_REPOSITORY
- Integration: optional `profileId` in `ImportTransactionsCommand` + Zod DTO, validated workspace-scoped
- `ImportsModule` imports `ImportProfilesModule`
- Path alias `@import-profiles/*` + Jest moduleNameMapper
- All handlers use `DomainError` (not BadRequestException) — framework leak fixed

### Tests (Phase 3)

- 29 unit tests for ImportProfile entity + VOs (invariants, update, matchesHeaders, equals)
- 5 unit tests for Create/Update handlers (happy path, duplicate name, not found)
- 3 unit tests for DetectImportProfileHandler (match, no match, first match)
- 3 unit tests for Delete handler (happy, not found, wrong workspace)
- 4 unit tests for Get/GetById handlers
- 1 unit test for ImportTransactionsHandler (profile not found)
- Existing import handler tests still PASS (profileRepo mock added)
- **Total project: 248/248 PASS, tsc --noEmit clean**

---

## Source provenance

- Original source: legacy development plan
- Pre-atomization path: `docs/plans/roadmap.md`
- Original source lines: 121–165
- Frozen source commit: `582b3e8b147293c7b33dd0f839839aa81d7c8c20`
