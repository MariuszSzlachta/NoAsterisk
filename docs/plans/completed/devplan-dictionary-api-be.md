# Devplan BE: Dictionary API — Anonymization Dictionaries

## Context

PII anonymizer uses dictionaries (first names, surnames, cities, merchants, phrases) for detecting personal data in CSV imports. Currently bundled as JSON stubs on frontend. Moving to backend for dynamic management without redeploy.

**Architecture:** Hexagonal (Ports & Adapters), CQRS-lite. Dual persistence (InMemory + Postgres via Drizzle). Module pattern same as existing `categories/`, `import-profiles/`.

**Data model:** 5 dictionary types, ~1000 entries total. Expected growth: up to 10k. Reference data, NOT workspace-scoped (shared across all users).

---

## Bullet 1: Domain layer

**Scope:** `server/src/dictionaries/domain/`

**Create:**
```
server/src/dictionaries/domain/
  dictionary-type.enum.ts
  dictionary-entry.entity.ts
  dictionary-entry.entity.spec.ts
  ports/
    dictionary.repository.ts
```

**DictionaryType enum:**
```typescript
export enum DictionaryType {
  FirstName = 'FirstName',
  Surname = 'Surname',
  Merchant = 'Merchant',
  City = 'City',
  Phrase = 'Phrase',
}
```

**DictionaryEntry entity:**
```typescript
export class DictionaryEntry {
  constructor(
    readonly id: string,
    readonly type: DictionaryType,
    readonly value: string,
    readonly createdAt: Date,
  ) {
    if (!id) throw new DomainError('DictionaryEntry ID is required');
    if (!value || !value.trim()) throw new DomainError('DictionaryEntry value is required');
    if (value.length > 255) throw new DomainError('DictionaryEntry value too long');
  }

  static create(props: { type: DictionaryType; value: string }): DictionaryEntry {
    const normalized = DictionaryEntry.normalize(props.type, props.value);
    return new DictionaryEntry(crypto.randomUUID(), props.type, normalized, new Date());
  }

  private static normalize(type: DictionaryType, value: string): string {
    const trimmed = value.trim();
    switch (type) {
      case DictionaryType.Merchant:
      case DictionaryType.City:
        return trimmed.toUpperCase();
      default:
        return trimmed.toLowerCase();
    }
  }
}
```

**Repository port:**
```typescript
export const DICTIONARY_REPOSITORY = Symbol('DICTIONARY_REPOSITORY');

export interface DictionaryRepository {
  findByType(type: DictionaryType): Promise<ReadonlyArray<DictionaryEntry>>;
  findAll(): Promise<ReadonlyArray<DictionaryEntry>>;
  save(entry: DictionaryEntry): Promise<DictionaryEntry>;
  saveBatch(entries: ReadonlyArray<DictionaryEntry>): Promise<number>;
  delete(id: string): Promise<void>;
  existsByTypeAndValue(type: DictionaryType, value: string): Promise<boolean>;
}
```

**Gate:** `tsc --noEmit` clean. Entity spec tests: create() normalizes, constructor rejects empty, value length limit.

---

## Bullet 2: Application layer — queries + commands

**Scope:** `server/src/dictionaries/application/`

**Create:**
```
server/src/dictionaries/application/
  queries/
    get-all-dictionaries.handler.ts
    get-dictionaries-by-type.handler.ts
  commands/
    add-entry.handler.ts
    delete-entry.handler.ts
    bulk-import.handler.ts
  mappers/
    dictionary-response.mapper.ts
  dto/
    dictionary-response.dto.ts
```

**GetAllDictionariesHandler:**
- Returns entries grouped by type: `{ firstNames: string[], surnames: string[], merchants: string[], cities: string[], phrases: string[] }`
- Maps domain entities → response DTO (values only, grouped)

**AddEntryHandler:**
- Validates no duplicate (existsByTypeAndValue)
- Creates entity via `DictionaryEntry.create()`
- Saves to repo

**BulkImportHandler:**
- Accepts `{ type: DictionaryType, values: string[] }`
- Deduplicates against existing
- Normalizes via entity factory
- Bulk saves
- Returns `{ imported: number, skipped: number }`

**DeleteEntryHandler:**
- Deletes by ID
- No ownership check needed (reference data, not user-scoped)

**Response DTO:**
```typescript
interface DictionaryResponseDto {
  readonly firstNames: readonly string[];
  readonly surnames: readonly string[];
  readonly merchants: readonly string[];
  readonly cities: readonly string[];
  readonly phrases: readonly string[];
}
```

**Gate:** `tsc --noEmit` clean. Handler tests with mocked repo.

---

## Bullet 3: Infrastructure layer — InMemory + Postgres repos

**Scope:** `server/src/dictionaries/infrastructure/`

**Create:**
```
server/src/dictionaries/infrastructure/
  in-memory-dictionary.repository.ts
  postgres-dictionary.repository.ts
```

**InMemory:** Standard Map<string, DictionaryEntry> implementation.

**Postgres:** Uses Drizzle schema (Bullet 4).

**Gate:** Both repos implement DictionaryRepository port. Tests pass.

---

## Bullet 4: Database schema + migration

**Scope:** `server/src/shared/infrastructure/database/schema/`

**Create:** `dictionaries.schema.ts`

```typescript
import { pgTable, uuid, varchar, timestamp, index, unique } from 'drizzle-orm/pg-core';

export const dictionaries = pgTable('dictionaries', {
  id: uuid('id').primaryKey(),
  type: varchar('type', { length: 30 }).notNull(),
  value: varchar('value', { length: 255 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
}, (table) => ({
  typeIdx: index('idx_dictionaries_type').on(table.type),
  uniqueTypeValue: unique('uq_dictionaries_type_value').on(table.type, table.value),
}));
```

**Steps:**
1. Create schema file
2. Export from `schema/index.ts`
3. Generate Drizzle migration: `npx drizzle-kit generate`

**Gate:** Migration file generated. Schema exports cleanly.

---

## Bullet 5: Presentation layer — Controller + DTOs

**Scope:** `server/src/dictionaries/presentation/`

**Create:**
```
server/src/dictionaries/presentation/
  dictionaries.controller.ts
  dictionaries.controller.spec.ts
  dto/
    add-entry.dto.ts
    bulk-import.dto.ts
```

**Endpoints:**
```
GET    /api/dictionaries          ← @Public(), returns grouped DictionaryResponseDto
                                     + Cache-Control: public, max-age=86400
                                     + ETag header (hash of content)
GET    /api/dictionaries/:type    ← @Public(), returns string[] for specific type
POST   /api/dictionaries          ← auth required, add single entry
POST   /api/dictionaries/bulk     ← auth required, bulk import
DELETE /api/dictionaries/:id      ← auth required, delete entry
```

**Caching strategy (GET endpoints):**
- `Cache-Control: public, max-age=86400` (24h browser cache)
- `ETag` based on content hash (MD5 of sorted values)
- Client sends `If-None-Match` → 304 Not Modified (zero transfer) if unchanged
- On write (POST/DELETE): ETag changes → next GET fetches fresh data
- Response size: ~200-300KB raw, ~60-80KB gzipped. Single fetch, no pagination needed.
- Frontend caches in DictionaryProvider memory after first load

**Why no pagination:**
Dictionaries are bulk lookup data (Set<string>), not browseable lists. Anonymizer needs ALL entries in memory to do O(1) `.has()` lookups. Pagination would require N requests and partial matching — unacceptable.

**Zod schemas:**
```typescript
// add-entry.dto.ts
export const AddEntrySchema = z.object({
  type: z.enum(['FirstName', 'Surname', 'Merchant', 'City', 'Phrase']),
  value: z.string().min(1).max(255),
});

// bulk-import.dto.ts
export const BulkImportSchema = z.object({
  type: z.enum(['FirstName', 'Surname', 'Merchant', 'City', 'Phrase']),
  values: z.array(z.string().min(1).max(255)).min(1).max(5000),
});
```

**Key decisions:**
- `@Public()` on GET — dictionaries are reference data, no auth needed for read
- Auth on POST/DELETE — standard JwtAuthGuard
- No workspace scoping — shared data
- `@SkipThrottle()` on GET (large response, read-only)

**Gate:** Controller spec tests: 200 on GET, 201 on POST, 400 on invalid Zod, 401 without auth on write.

---

## Bullet 6: Module registration + seed script

**Scope:** `server/src/dictionaries/dictionaries.module.ts` + seed script

**Module:**
```typescript
@Module({
  controllers: [DictionariesController],
  providers: [
    GetAllDictionariesHandler,
    GetDictionariesByTypeHandler,
    AddEntryHandler,
    DeleteEntryHandler,
    BulkImportHandler,
    DictionaryResponseMapper,
    createRepositoryProvider(
      DICTIONARY_REPOSITORY,
      PostgresDictionaryRepository,
      InMemoryDictionaryRepository,
    ),
  ],
  exports: [DICTIONARY_REPOSITORY],
})
export class DictionariesModule {}
```

**Register in AppModule** — add to imports array.

**Seed script:** `server/src/shared/infrastructure/database/seed-dictionaries.ts`
- Reads JSON stubs from `client/src/.../stubs/` (or copy them to `server/src/dictionaries/data/`)
- Bulk inserts with `ON CONFLICT DO NOTHING` (idempotent)
- Add npm script: `"seed:dictionaries": "tsx src/shared/infrastructure/database/seed-dictionaries.ts"`

**Gate:** `npm run dev` starts without errors. `GET /api/dictionaries` returns seeded data (after seed). All existing tests still pass.

---

## Bullet 7: Full test suite + quality gate

**Steps:**
1. Domain tests: entity invariants, normalization
2. Application tests: handlers with mocked repo
3. Controller spec: HTTP contract (status codes, Zod validation, auth)
4. `tsc --noEmit` — zero errors
5. `npx jest --passWithNoTests` — all pass (existing 250 + new)

**Gate:** All green. No regressions.

---

## Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Workspace-scoped? | **No** | Reference data shared by all users. Not financial data. |
| Auth on read? | **No** (`@Public()`) | Performance + simplicity. Dictionaries aren't sensitive. |
| Normalization timing | **On write** | Backend normalizes at insert. API returns pre-normalized strings. Client doesn't need to normalize. |
| Unique constraint | **type + value** | Prevent duplicate entries. `ON CONFLICT DO NOTHING` for idempotent seeds. |
| Stubs kept in FE? | **Yes** | Offline fallback + test fixtures. Backend is source of truth when available. |

---

## Estimated Effort

| Bullet | Effort |
|--------|--------|
| 1 | 30 min |
| 2 | 45 min |
| 3 | 30 min |
| 4 | 15 min |
| 5 | 45 min |
| 6 | 30 min |
| 7 | 30 min |
| **Total** | **~3.5 hours** |
