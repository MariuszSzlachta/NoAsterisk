# Devplan FE: Dictionary API Integration — Fetch Dictionaries from Backend

## Context

PII anonymizer's `DictionaryProvider` currently loads dictionaries from bundled JSON stubs. Backend will expose `GET /api/dictionaries` returning all entries grouped by type. Frontend needs to swap the loader to fetch from API with graceful fallback to stubs when offline.

**Key insight:** Architecture ALREADY supports this. `createDictionaryProvider(loader)` accepts any async function returning `DictionarySet`. We only need to provide an HTTP loader and wire it in.

**Existing code:**
- `features/csv-import/model/anonymization/dictionaries/dictionary.provider.ts` — factory with pluggable loader
- `features/csv-import/model/anonymization/types.ts` — `DictionarySet`, `DictionaryProvider` interfaces
- Stubs in `dictionaries/stubs/*.json` — keep as fallback

**Dependency:** Backend `GET /api/dictionaries` endpoint must be deployed (devplan-dictionary-api-be.md).

---

## Bullet 1: API layer — fetch dictionaries

**Scope:** `client/src/features/csv-import/api/`

**Create:**
```
features/csv-import/api/
  fetchDictionaries/
    fetchDictionaries.ts
    fetchDictionaries.spec.ts
    index.ts
```

**Implementation:**
```typescript
import { httpClient } from '#shared/api';
import type { DictionarySet } from '../model/anonymization/types';

interface DictionaryApiResponse {
  readonly firstNames: readonly string[];
  readonly surnames: readonly string[];
  readonly merchants: readonly string[];
  readonly cities: readonly string[];
  readonly phrases: readonly string[];
}

export const fetchDictionaries = async (): Promise<DictionarySet> => {
  const data = await httpClient.get<DictionaryApiResponse>('/dictionaries');
  return {
    firstNames: new Set(data.firstNames),
    surnames: new Set(data.surnames),
    merchants: new Set(data.merchants),
    cities: new Set(data.cities),
    phrases: new Set(data.phrases),
  };
};
```

**Notes:**
- No TanStack Query needed — `DictionaryProvider` has its own caching
- Backend returns pre-normalized strings (lowercase/uppercase per type)
- Response is ~50KB (1000 entries) — acceptable single fetch

**Gate:** `tsc --noEmit` clean. Unit test mocks httpClient and verifies DictionarySet shape.

---

## Bullet 2: Provider swap — fetch with fallback

**Scope:** `client/src/features/csv-import/model/anonymization/dictionaries/dictionary.provider.ts`

**Changes:**
1. Import `fetchDictionaries` from api layer
2. Create `fetchWithFallback` loader that tries API first, falls back to stubs on error
3. Export new `dictionaryProvider` as default (replaces `devDictionaryProvider` usage)
4. Keep `devDictionaryProvider` for tests (explicitly imported in spec files)

**Implementation:**
```typescript
import { fetchDictionaries } from '#features/csv-import/api/fetchDictionaries';

const fetchWithFallback = async (): Promise<DictionarySet> => {
  try {
    return await fetchDictionaries();
  } catch {
    // Backend unavailable (offline, error) — fall back to bundled stubs
    console.warn('[Dictionaries] Backend unavailable, using bundled stubs');
    return buildFromStubs();
  }
};

/** Production provider — fetches from API with stub fallback. */
export const dictionaryProvider = createDictionaryProvider(fetchWithFallback);

/** Dev/test provider — uses bundled JSON stubs only (no HTTP). */
export const devDictionaryProvider = createDictionaryProvider();
```

**Gate:** Provider resolves successfully both when API available and when offline. Existing anonymizer tests pass (they use `devDictionaryProvider`).

---

## Bullet 3: Wire provider into anonymizer pipeline

**Scope:** Where `devDictionaryProvider` is currently injected into the anonymizer pipeline.

**Steps:**
1. Find where `devDictionaryProvider` is used in the anonymizer pipeline (likely in `useAnonymizationStep` or pipeline orchestrator)
2. Replace with `dictionaryProvider` (the fetch-with-fallback one)
3. Ensure `loadAll()` is called before anonymization starts (it's async — already handled by pipeline)

**Search pattern:** `grep -rn "devDictionaryProvider" client/src/ --include="*.ts" --include="*.tsx"`

**Gate:** CSV import flow works end-to-end. Anonymizer detects PII using dictionaries. If backend is running → fetches from API. If not → uses stubs seamlessly.

---

## Bullet 4: Tests — verify fallback behavior

**Scope:** `client/src/features/csv-import/api/fetchDictionaries/fetchDictionaries.spec.ts`

**Test cases:**
1. **Happy path:** Mock httpClient returning valid response → returns correct DictionarySet with Set instances
2. **API error (500):** Mock httpClient throwing → falls back to stubs → returns valid DictionarySet
3. **Network error:** Mock httpClient throwing TypeError (fetch failed) → falls back to stubs
4. **Empty response:** Backend returns empty arrays → returns DictionarySet with empty Sets (valid, no crash)
5. **Caching:** Call `loadAll()` twice → only 1 HTTP request made (provider cache works)

**Gate:** All tests pass. `vitest run` green.

---

## Bullet 5: Cleanup + documentation

**Steps:**
1. Update `features/csv-import/index.ts` if needed (public API doesn't change — provider is internal)
2. Add brief comment in `dictionary.provider.ts` explaining the two providers and when each is used
3. Do NOT delete stubs — they serve as: (a) offline fallback, (b) test fixtures, (c) seed source for backend
4. Verify existing anonymizer tests pass without modification (they should — they use `devDictionaryProvider`)

**Gate:** `tsc --noEmit` clean. `vitest run` all pass. No regressions in CSV import flow.

---

## Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| TanStack Query? | **No** | DictionaryProvider has built-in cache. Adding React Query wrapper adds complexity without benefit — this isn't reactive UI data. |
| Delete stubs? | **No** | Offline fallback + test fixtures. Stubs are ~1KB total. |
| Auth on fetch? | **No** | `GET /dictionaries` is `@Public()` on backend. httpClient sends JWT anyway (interceptor), but endpoint doesn't require it. |
| When to fetch? | **On first anonymizer use** | Lazy — `loadAll()` triggered by pipeline when user reaches anonymization step. Not on app boot. |
| Cache invalidation? | **Page reload** | Provider cache lives in module scope. Reload = new fetch. Acceptable because dictionaries change rarely. |

---

## Estimated Effort

| Bullet | Effort |
|--------|--------|
| 1 | 20 min |
| 2 | 15 min |
| 3 | 15 min |
| 4 | 20 min |
| 5 | 10 min |
| **Total** | **~1.5 hours** |

---

## Dependency

⚠️ **Requires backend deployed first** (devplan-dictionary-api-be.md). But frontend can be developed in parallel — just test against stub fallback until backend is ready.
