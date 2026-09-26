# Devplan BE: Dictionary API — Improvement (Caching + Data Enrichment)

## Context

**Prerequisite:** `devplan-dictionary-api-be.md` MUST be completed first (basic CRUD + module).

This improvement adds:
1. HTTP caching (ETag + Cache-Control) so frontend doesn't refetch unchanged data
2. Enriched dictionary datasets from open sources (~180 entries → ~10k entries)

---

## Part A: HTTP Caching

### Bullet 1: ETag + Cache-Control on GET endpoints

**Scope:** `server/src/dictionaries/presentation/dictionaries.controller.ts`

**What:**
- `GET /api/dictionaries` returns:
  - `Cache-Control: public, max-age=86400` (24h browser cache)
  - `ETag: "<md5-hash-of-response-body>"`
- When client sends `If-None-Match: "<etag>"`:
  - If content unchanged → respond 304 Not Modified (zero body)
  - If content changed → respond 200 with new data + new ETag

**Implementation approach:**
```typescript
@Get()
@Public()
@SkipThrottle()
async getAll(
  @Headers('if-none-match') ifNoneMatch: string | undefined,
  @Res({ passthrough: true }) res: Response,
): Promise<DictionaryResponseDto | void> {
  const data = await this.getAllHandler.execute();
  const etag = this.computeEtag(data);

  res.set('Cache-Control', 'public, max-age=86400');
  res.set('ETag', etag);

  if (ifNoneMatch === etag) {
    res.status(304);
    return;
  }

  return data;
}

private computeEtag(data: DictionaryResponseDto): string {
  const hash = createHash('md5')
    .update(JSON.stringify(data))
    .digest('hex');
  return `"${hash}"`;
}
```

**Why this matters:**
- 10k entries = ~200-300KB raw JSON, ~60-80KB gzipped
- Without caching: fetched every session = wasted bandwidth
- With ETag: subsequent visits = 304 (20ms, 0 bytes)
- `max-age=86400`: browser doesn't even ask server for 24h

**Gate:** First request returns 200 + ETag header. Second request with `If-None-Match` returns 304. Adding/deleting entry changes ETag.

---

### Bullet 2: ETag invalidation on write

**Scope:** Controller or simple in-memory cache version counter

**What:** After any POST/DELETE (write operation), the ETag must change on next GET.

**Simplest approach:** No explicit invalidation needed — ETag is computed from response body. If data changed, body changed, hash changed, ETag is different.

**Optimization (optional):** Cache the computed ETag in memory. Invalidate (set to null) on any write. Recompute on next GET. Avoids recomputing MD5 on every GET when data hasn't changed.

```typescript
private cachedEtag: string | null = null;
private cachedResponse: DictionaryResponseDto | null = null;

// On GET:
if (!this.cachedResponse) {
  this.cachedResponse = await this.getAllHandler.execute();
  this.cachedEtag = this.computeEtag(this.cachedResponse);
}

// On POST/DELETE:
this.cachedEtag = null;
this.cachedResponse = null;
```

**Gate:** Write → next GET returns new ETag. Repeated GETs without writes don't hit DB.

---

## Part B: Data Enrichment

### Bullet 3: Gather enriched datasets from open sources

**Scope:** New directory `server/src/dictionaries/data/enriched/`

**Sources (all open data / public domain / MIT):**

| Dataset | Source | License | Target size |
|---------|--------|---------|-------------|
| Polish first names (M) | `github.com/iustitia/polish-names-generator/first-m.txt` | MIT | ~1000 |
| Polish first names (F) | `github.com/iustitia/polish-names-generator/first-f.txt` | MIT | ~1000 |
| English first names | US Census Bureau top names (public domain) | Public domain | ~1000 |
| Polish surnames | `gist.github.com/jdudek/732279` + `github.com/urxvtcd/haszysz` | Public domain | ~5000 |
| Polish cities (ALL) | GUS TERYT registry (open government data) | Public domain | ~950 |
| Merchants | Current list + manual additions | Own | ~500 |
| Phrases | Current list + bank-specific additions | Own | ~200 |

**Steps:**
1. Download/copy raw text files from sources above
2. Clean: deduplicate, trim whitespace, remove empty lines
3. Normalize: lowercase for names/surnames, uppercase for cities/merchants
4. Save as JSON arrays in `server/src/dictionaries/data/enriched/`:
   - `first-names-pl.json`
   - `first-names-en.json`
   - `surnames-pl.json`
   - `cities-pl.json`
   - `merchants.json`
   - `phrases.json`

**Gate:** Each file is valid JSON array of strings. No duplicates within a file.

---

### Bullet 4: Update seed script to use enriched data

**Scope:** `server/src/shared/infrastructure/database/seed-dictionaries.ts`

**Changes:**
1. Point seed script to enriched JSON files instead of client stubs
2. Bulk import with `ON CONFLICT DO NOTHING` (idempotent)
3. Log count per type after import

**Expected seed output:**
```
Seeding dictionaries...
  FirstName: 2000 entries (1823 new, 177 existing)
  Surname:   5000 entries (4800 new, 200 existing)
  City:       950 entries (840 new, 110 existing)
  Merchant:   500 entries (215 new, 285 existing)
  Phrase:     200 entries (75 new, 125 existing)
Done. Total: 8650 entries.
```

**Gate:** Seed runs successfully. `GET /api/dictionaries` returns enriched data. Response size < 400KB raw.

---

### Bullet 5: Update client stubs (fallback) with enriched data

**Scope:** `client/src/features/csv-import/model/anonymization/dictionaries/stubs/`

**What:** Replace current small JSON stubs with enriched versions (same files from Bullet 3).

**Why:** Offline fallback should also have good detection. If backend is unreachable, at least the bundled data is rich.

**Trade-off:** Bundle size increases by ~200KB (raw JSON, tree-shakeable, gzipped ~50KB). Acceptable for an app that already bundles AG Grid (~200KB).

**Gate:** Client builds without error. Stubs are valid JSON. `vitest run` passes (anonymizer tests still work).

---

## Performance Expectations

| Scenario | Network | Time | Data transferred |
|----------|---------|------|-----------------|
| First visit (cold) | GET /dictionaries | ~150ms | ~80KB gzipped |
| Return visit (<24h) | No request (max-age) | 0ms | 0 bytes |
| Return visit (>24h) | GET + If-None-Match → 304 | ~30ms | ~200 bytes (headers only) |
| After admin adds entry | GET → 200 (new ETag) | ~150ms | ~80KB gzipped |

---

## Estimated Effort

| Bullet | Effort |
|--------|--------|
| 1 (ETag + Cache-Control) | 45 min |
| 2 (Write invalidation) | 15 min |
| 3 (Gather datasets) | 1.5h (download, clean, format) |
| 4 (Update seed) | 20 min |
| 5 (Update client stubs) | 15 min |
| **Total** | **~3 hours** |

---

## Dependencies

- ✅ `devplan-dictionary-api-be.md` completed (module exists, endpoints work)
- Internet access (for downloading open source datasets in Bullet 3)
