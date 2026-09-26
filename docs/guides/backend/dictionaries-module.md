# Dictionaries Module — Developer Guide

## Domain Context

Dictionaries provide shared reference data for PII anonymization on the frontend. The CSV import feature uses these word lists (names, surnames, merchants, cities, common phrases) to detect and mask personal information in raw bank CSV data before sending anonymized transactions to the backend.

This module is **not workspace-scoped** — dictionary entries are global reference data shared across all users. This is an intentional architectural exception: dictionaries are PII detection support data, not user financial data.

---

## Architecture & Layers

```
src/dictionaries/
├── domain/
│   ├── dictionary-entry.entity.ts       # Entity: invariants, normalize()
│   ├── dictionary-entry.entity.spec.ts  # Entity unit tests
│   ├── dictionary-type.enum.ts          # FirstName | Surname | Merchant | City | Phrase
│   ├── dictionary-type.guard.ts         # Type guard for enum validation
│   └── ports/
│       └── dictionary.repository.ts     # Repository port (ARCH-EXCEPTION: global-scope)
│
├── application/
│   ├── commands/
│   │   ├── add-entry.handler.ts         # Add single entry with dedup check
│   │   ├── add-entry.handler.spec.ts
│   │   ├── bulk-import.handler.ts       # Bulk import with dedup + skip count
│   │   ├── bulk-import.handler.spec.ts
│   │   ├── delete-entry.handler.ts      # Delete by ID
│   │   └── delete-entry.handler.spec.ts
│   ├── queries/
│   │   ├── get-all-dictionaries.handler.ts       # All entries grouped by type
│   │   ├── get-all-dictionaries.handler.spec.ts
│   │   ├── get-dictionaries-by-type.handler.ts   # Values for specific type
│   │   └── get-dictionaries-by-type.handler.spec.ts
│   ├── dto/
│   │   ├── dictionary-response.dto.ts   # Grouped response shape
│   │   └── bulk-import-result.dto.ts    # { imported, skipped }
│   ├── mappers/
│   │   └── dictionary-response.mapper.ts  # Entity[] → grouped DTO / values list
│   └── __test-helpers__/
│       └── dictionary.builders.ts       # Test data builders
│
├── data/
│   └── enriched/                        # Authoritative dictionary source (2,505 entries)
│       ├── first-names-pl.json          # 338 Polish first names (iustitia/MIT)
│       ├── first-names-en.json          # 193 English first names
│       ├── surnames-pl.json             # 812 Polish surnames (jdudek/public domain)
│       ├── merchants.json               # 412 merchant names
│       ├── cities-pl.json               # 515 Polish cities (GUS TERYT)
│       └── phrases.json                 # 235 common banking phrases
│
├── infrastructure/
│   ├── in-memory-dictionary.repository.ts    # InMemory implementation (dev/test)
│   ├── postgres-dictionary.repository.ts     # PostgreSQL implementation
│   └── seed-dictionaries.ts                  # CLI seed script (reads from data/enriched/)
│
├── presentation/
│   ├── dictionaries.controller.ts       # HTTP adapter + caching (ETag, Cache-Control)
│   ├── dictionaries.controller.spec.ts  # Controller integration tests (incl. cache)
│   └── dto/
│       ├── add-entry.dto.ts             # Zod schema for single add
│       └── bulk-import.dto.ts           # Zod schema for bulk import
│
└── dictionaries.module.ts               # NestJS module wiring
```

### Dependencies

```
DictionariesModule
  ├── imports nothing (standalone)
  └── exports DICTIONARY_REPOSITORY token (available for other modules needing dictionary lookup)
```

---

## HTTP Endpoints

| Method | Path | Auth | Rate limit | Caching | Description |
|--------|------|------|-----------|---------|-------------|
| `GET /api/dictionaries` | `@Public()` | Skip throttle | ETag + 24h max-age + in-memory | All entries grouped by type |
| `GET /api/dictionaries/:type` | `@Public()` | Skip throttle | ETag + 24h max-age | Values for specific type |
| `POST /api/dictionaries` | JWT (any role) | Default | Invalidates cache | Add single entry |
| `POST /api/dictionaries/bulk` | JWT (any role) | Default | Invalidates cache | Bulk import entries |
| `DELETE /api/dictionaries/:id` | JWT (any role) | Default | Invalidates cache | Delete entry by ID |

### GET /api/dictionaries

Response headers:
- `Cache-Control: public, max-age=86400`
- `ETag: "<md5-hash>"`

Supports `If-None-Match` → returns `304 Not Modified` on ETag match.

Response `200`:
```json
{
  "firstNames": ["anna", "jan", "maria"],
  "surnames": ["kowalski", "nowak"],
  "merchants": ["BIEDRONKA", "LIDL", "ŻABKA"],
  "cities": ["WARSZAWA", "KRAKÓW"],
  "phrases": ["przelew", "opłata za"]
}
```

### GET /api/dictionaries/:type

Path param: `FirstName` | `Surname` | `Merchant` | `City` | `Phrase`

Response headers:
- `Cache-Control: public, max-age=86400`
- `ETag: "<md5-hash>"`

Supports `If-None-Match` → returns `304 Not Modified` on ETag match.

Response `200`:
```json
["anna", "jan", "maria"]
```

Response `400` — invalid type.

### POST /api/dictionaries

Request body:
```json
{
  "type": "Merchant",
  "value": "Żabka"
}
```

Response `201`:
```json
{
  "id": "uuid",
  "value": "ŻABKA"
}
```

Response `409` — entry already exists for this type.

### POST /api/dictionaries/bulk

Request body:
```json
{
  "type": "FirstName",
  "values": ["Anna", "Jan", "Maria", "Anna"]
}
```

Response `201`:
```json
{
  "imported": 3,
  "skipped": 1
}
```

Deduplication: skips values already in the database and duplicates within the same batch.

### DELETE /api/dictionaries/:id

Response `204` — no content.
Response `404` — entry not found.

---

## Domain Model

### DictionaryEntry Entity

```typescript
class DictionaryEntry {
  constructor(
    readonly id: string,          // UUID
    readonly type: DictionaryType,
    readonly value: string,       // normalized on create
    readonly createdAt: Date,
  )
}
```

**Invariants (constructor):**
- `id` must be non-empty
- `type` must be a valid `DictionaryType`
- `value` must be non-empty, trimmed, max 255 chars

**Factory:**
- `DictionaryEntry.create({ type, value })` — generates UUID, normalizes value, sets timestamp.

### DictionaryType Enum

```typescript
enum DictionaryType {
  FirstName = 'FirstName',
  Surname = 'Surname',
  Merchant = 'Merchant',
  City = 'City',
  Phrase = 'Phrase',
}
```

### Normalization Rules

Normalization happens at entity creation time (`DictionaryEntry.create()`):

| Type | Rule | Example |
|------|------|---------|
| `Merchant` | `trim().toUpperCase()` | `"  żabka "` → `"ŻABKA"` |
| `City` | `trim().toUpperCase()` | `"kraków"` → `"KRAKÓW"` |
| `FirstName` | `trim().toLowerCase()` | `"Anna"` → `"anna"` |
| `Surname` | `trim().toLowerCase()` | `"Kowalski"` → `"kowalski"` |
| `Phrase` | `trim().toLowerCase()` | `"Opłata Za"` → `"opłata za"` |

**Rationale:** Merchants and cities appear in bank statements as uppercase identifiers. Names and phrases are normalized to lowercase for case-insensitive PII matching.

---

## Database Schema

Table: `dictionaries`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `uuid` | Primary key |
| `type` | `varchar(30)` | NOT NULL, indexed |
| `value` | `varchar(255)` | NOT NULL |
| `created_at` | `timestamp with time zone` | NOT NULL |

Indexes:
- `idx_dictionaries_type` — type lookup
- `uq_dictionaries_type_value` — unique constraint on `(type, value)` for deduplication

Migration: `server/drizzle/migrations/0001_freezing_stepford_cuckoos.sql`

---

## HTTP Caching

GET endpoints implement HTTP caching to minimize redundant data transfer. The frontend fetches dictionaries on CSV import initialization — caching prevents re-downloading ~28KB of reference data on every import session.

### Strategy

| Endpoint | In-memory cache | ETag | Cache-Control | 304 support |
|----------|----------------|------|---------------|-------------|
| `GET /dictionaries` | ✅ (per-process) | ✅ MD5 of JSON body | `public, max-age=86400` | ✅ |
| `GET /dictionaries/:type` | ❌ | ✅ MD5 of JSON body | `public, max-age=86400` | ✅ |

### Behavior

1. **First request** — handler executes query, response is cached in-memory (getAll only), ETag computed as MD5 hash of serialized response.
2. **Subsequent requests** — served from in-memory cache without DB query (getAll). ETag and `Cache-Control: public, max-age=86400` (24h) sent on every response.
3. **Conditional request** — client sends `If-None-Match: "<etag>"`. If ETag matches → `304 Not Modified` with empty body. If mismatch → full `200` response.
4. **Write invalidation** — any mutation (POST, DELETE) invalidates the in-memory cache. Next GET rebuilds it from DB, computes fresh ETag.

### Design decisions

- **In-memory cache on getAll only** — per-type endpoint is rarely called directly by frontend; adding `Map<type, cache>` adds complexity for little gain.
- **MD5 ETag** — fast, collision-resistant enough for cache validation. Format: `"<32-hex-chars>"`.
- **Single-instance limitation** — writes on instance A do not invalidate cache on instance B. Acceptable for low-mutation reference data. For multi-instance: Redis pub/sub or DB-level versioning.
- **24h max-age** — dictionary data changes infrequently. Browser can serve stale data for up to 24h without revalidation, then uses ETag for conditional refresh.

### Performance expectations

| Scenario | Latency | Transfer |
|----------|---------|----------|
| Cold (no cache, full response) | ~5–15ms | ~28KB JSON |
| Warm (in-memory hit, no ETag match) | <1ms | ~28KB JSON |
| ETag match (304) | <1ms | 0 bytes body |
| Browser cache valid (< 24h) | 0ms (no request) | 0 bytes |

---

## Data Enrichment

### Overview

Dictionary entries are sourced from curated public-domain and open-license datasets to maximize PII detection coverage. The enriched dataset provides **2,505 entries across 6 files** (5 dictionary types), up from the original ~1,031 entries.

### Sources and licensing

| Source | License | Provides |
|--------|---------|----------|
| iustitia (GitHub) | MIT | Polish first names |
| jdudek (GitHub) | Public domain | Polish surnames |
| GUS TERYT (Polish Statistical Office) | Public data | Polish city names |
| Manual curation | Project | Merchants, English names, phrases |

### Entry counts by file

| File | Dictionary type | Entries |
|------|-----------------|---------|
| `first-names-pl.json` | FirstName | 338 |
| `first-names-en.json` | FirstName | 193 |
| `surnames-pl.json` | Surname | 812 |
| `merchants.json` | Merchant | 412 |
| `cities-pl.json` | City | 515 |
| `phrases.json` | Phrase | 235 |
| **Total** | | **2,505** |

### Data location

- **Server enriched data:** `server/src/dictionaries/data/enriched/` — authoritative source for seeding.
- **Client stubs:** `client/src/features/csv-import/model/anonymization/dictionaries/stubs/` — identical copies for browser-side PII detection (~28KB total).

Both locations contain the same data. Client stubs are bundled into the frontend for offline PII detection during CSV parsing.

### Updating dictionary data

To add or modify enriched data:

1. Edit the relevant JSON file in `server/src/dictionaries/data/enriched/`.
2. Copy the updated file to the client stubs directory (maintain identical content).
3. Re-run the seed script to update the database.
4. In-memory cache invalidates automatically on next write; for seed-only changes, restart the server or wait for the 24h cache TTL.

---

## Data Seeding

The seed script populates dictionaries from the enriched data directory.

### Running

```bash
cd server
npx tsx src/dictionaries/infrastructure/seed-dictionaries.ts
```

**Safety:** Blocked in `NODE_ENV=production`.

### Source files

Reads from `server/src/dictionaries/data/enriched/`:

| File | Dictionary type |
|------|-----------------|
| `first-names-pl.json` | FirstName |
| `first-names-en.json` | FirstName |
| `surnames-pl.json` | Surname |
| `merchants.json` | Merchant |
| `cities-pl.json` | City |
| `phrases.json` | Phrase |

Each file is a JSON array of strings. The seed script:
1. Reads each file from the enriched data directory
2. Creates `DictionaryEntry` instances (applying normalization)
3. Inserts with `ON CONFLICT DO NOTHING` (idempotent — safe to re-run)
4. Logs per-file stats (inserted vs skipped)

---

## Persistence Strategy

Uses `createRepositoryProvider` for dual persistence:
- **Development/Test:** `InMemoryDictionaryRepository`
- **Production (DB_HOST set):** `PostgresDictionaryRepository`

The Postgres repository uses `ON CONFLICT DO NOTHING` for both `save()` and `saveBatch()`, making all writes idempotent at the DB level.

---

## Access Control

| Operation | Access |
|-----------|--------|
| Read (GET) | Public — no auth required (`@Public()`) |
| Write (POST/DELETE) | Any authenticated user (Member or Superuser) |

**Rationale:** Dictionary data is shared reference data for PII anonymization. It's not sensitive financial data — any user benefits from a richer dictionary. Read endpoints skip throttling (`@SkipThrottle()`) because the frontend fetches dictionaries on CSV import initialization.

---

## Extension Points

### Adding a new dictionary type

1. **Add enum value** in `domain/dictionary-type.enum.ts`:
```typescript
export enum DictionaryType {
  // ...existing
  Country = 'Country',
}
```

2. **Add normalization case** in `DictionaryEntry.create()` (`domain/dictionary-entry.entity.ts`):
```typescript
case DictionaryType.Country:
  return trimmed.toUpperCase();
```

3. **Update Zod schemas** in `presentation/dto/add-entry.dto.ts` and `bulk-import.dto.ts`:
```typescript
type: z.enum(['FirstName', 'Surname', 'Merchant', 'City', 'Phrase', 'Country']),
```

4. **Update response DTO** in `application/dto/dictionary-response.dto.ts`:
```typescript
export interface DictionaryResponseDto {
  // ...existing
  readonly countries: readonly string[];
}
```

5. **Update mapper** in `application/mappers/dictionary-response.mapper.ts` — add the new type to the switch statement.

6. **Add stub file** (optional) in client stubs directory and register in `STUB_MAPPINGS` in `seed-dictionaries.ts`.

No migration needed — `type` is a `varchar(30)`, not a DB enum.

### Adding new endpoints

Follow the existing handler pattern:
- Query handlers in `application/queries/`
- Command handlers in `application/commands/`
- Register in `dictionaries.module.ts` providers
- Inject in controller

---

## Testing Strategy

| Layer | File | What it tests |
|-------|------|---------------|
| Entity | `domain/dictionary-entry.entity.spec.ts` | Invariants, normalization rules |
| Commands | `application/commands/*.spec.ts` | Dedup logic, bulk skip counting, not-found |
| Queries | `application/queries/*.spec.ts` | Grouping, type filtering |
| Controller | `presentation/dictionaries.controller.spec.ts` | HTTP integration, auth, validation |

```bash
cd server
npx jest --testPathPattern=dictionaries --verbose
```

---

## Boundaries & Non-Goals

**What this module DOES:**
- CRUD for dictionary entries (shared PII reference data)
- Normalization on write (case rules per type)
- Deduplication (unique constraint + application-level checks)
- Bulk import with skip reporting
- HTTP caching (ETag, Cache-Control, in-memory cache with write invalidation)
- Seed script from enriched data directory

**What this module does NOT do:**
- **PII detection/anonymization** — frontend CSV import uses dictionary data, not this module
- **Workspace scoping** — intentionally global (ARCH-EXCEPTION documented on port)
- **Role-based write restrictions** — any authenticated user can contribute
- **Versioning/audit** — no history of who added what (not needed for reference data)

---

*Updated: 2026-08-22 | Source: `server/src/dictionaries/`*
