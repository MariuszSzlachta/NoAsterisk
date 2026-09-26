# CSV Import Feature — Developer Guide

> **Status:** CSV import is local-first. The wizard parses, anonymizes, categorizes and persists accepted records in encrypted IndexedDB. Dictionary data is fetched from the backend with offline fallback. See also: [Anonymization Step UI](./csv-import-anonymization-step.md).

## Domain Context

Users need to import bank transaction history from CSV files. Polish banks export in inconsistent formats (encoding, separators, date/amount formats, metadata preambles). The import flow must:

1. Parse any Polish bank CSV without manual configuration
2. Anonymize PII (names, IBANs, PESELs) before data leaves the browser
3. Let users review, edit, and batch-correct transactions
4. Persist accepted records locally with dedup and import history

This is the largest frontend feature (~40 files, 5 wizard steps) and the product's core UX.

---

## Architecture & Layers

```
features/csv-import/
├── index.ts                    # Public API (what pages can import)
├── model/                      # Pure logic — zero React, zero side effects
│   ├── types.ts                # All domain types (ParsedCsvData, TransactionRow, etc.)
│   ├── parser/                 # CSV parsing pipeline (see architecture/csv-engine/parser.md)
│   ├── anonymizer/             # PII detection pipeline (see architecture/csv-engine/pii-anonymizer.md)
│   ├── column-mapper.ts        # Header → DomainField heuristic mapping
│   ├── row-transformer.ts      # CsvRow[] → TransactionRow[] (typed, validated)
│   ├── duplicate-detector.ts   # In-batch + cross-file dedup
│   ├── find-similar-rows.ts    # Title similarity for batch edit
│   ├── bank-detector.ts        # Header fingerprint → bank name
│   └── persistence/            # Prepares and writes encrypted local records
├── store/
│   └── useImportWizardStore/   # Zustand wizard state (immer middleware)
├── api/
│   ├── fetchDictionaries/      # HTTP call: GET /dictionaries → DictionarySet
│   └── dictionaryProvider/     # Backend dictionaries with bundled fallback
└── ui/
    ├── hooks/                  # Business logic composition
    │   ├── useImportWizard/    # Master orchestrator (file → parse → map → anonymize → submit)
    │   ├── useColumnMappingStep/  # Step 1 logic (auto-detect, manual override)
    ├── useImportPreviewGrid/  # Step 3 grid data preparation
    │   ├── useBatchEditPanel/  # Smart batch edit (edit propagation to similar rows)
    │   ├── useImportSubmit/    # Step 4 local persistence and progress
    │   └── useAnonymizationStep/ # Step 2 state + handlers (see guides/frontend/csv-import-anonymization-step.md)
    │   └── useAnonymizationGrid/ # Step 2 grid data (dynamic columns, row joining)
    ├── UploadStepCard/         # Step 0: file drop zone
    ├── ColumnMappingStep/      # Step 1: map columns to domain fields
    ├── FieldAssignmentRow/     # Row in column mapping table
    ├── ColumnMappingRow/       # Individual column ↔ domain field assignment row
    ├── DataPreviewTable/       # Raw CSV data preview (first 5 rows)
    ├── AnonymizationStep/      # Step 2: anonymization review (grid + popover + filters)
    ├── AnonymizationPopover/   # Modal overlay: original vs masked + Restore/Edit
    ├── TitleCellRenderer/      # AG Grid cell: status dot + mono text + bg color
    ├── ImportPreviewGrid/      # Step 3: AG Grid with editable cells
    ├── BatchEditPanel/         # Smart edit propagation panel
    ├── ImportConfirmStep/      # Step 3: summary + submit
    ├── FileInfoSection/        # Encoding/separator info display
    ├── BankProfileBar/         # Detected bank name badge
    ├── DetectionChip/          # PII detection type indicator
    ├── SaveProfileBar/         # Save current mapping as profile
    └── constants/
        └── grid-columns.tsx    # AG Grid column definitions
```

### Data Flow (wizard pipeline)

```
Step 0: User drops file
  → parseCsvFile(file)
  → ParsedCsvData { headers, rows: CsvRow[], encoding, separator }
  → autoDetectMapping(headers)
  → Store: { parsedData, detectedMapping }

Step 1: User confirms/adjusts column mapping
  → transformRows(csvRows, mapping)
  → TransactionRow[] (typed: date parsed, amount parsed, status set)
  → dictionaryProvider.loadAll() (API fetch with stub fallback, cached)
  → processRows(titles, dictionaries)
  → AnonymizationEntry[] (masked titles, review status)
  → Apply anonymized titles to rows
  → detectDuplicatesInBatch(rows)
  → Store: { rows, anonymizationEntries }

Step 2: User reviews/edits in grid
  → Cell edit → useBatchEditPanel.handleCellEdit()
  → findSimilarRows() → suggest propagation
  → Store: { rows (updated), batchEditPanel state }

Step 3: User confirms import
  → prepareImportedTransactions(rows, entries, batchId)
  → categorizeImportedTransactions(records, local rules)
  → saveImportedBatch(records, import history metadata)
  → Progress tracking (savedRows, duplicatesSkipped, errors)
```

---

## Public API

Everything consumed by pages comes from `features/csv-import/index.ts`. Key exports (curated — full list has ~40 exports including all parser/anonymizer utilities and types):

```typescript
// Hooks (used by ImportPage)
export { useImportWizard } from './ui/hooks/useImportWizard';
export { useAnonymizationStep } from './ui/hooks/useAnonymizationStep';
export { useBatchEditPanel } from './ui/hooks/useBatchEditPanel';
export { useImportSubmit } from './ui/hooks/useImportSubmit';

// Components (composed in ImportPage)
export { ColumnMappingStep } from './ui/ColumnMappingStep';
export { ImportPreviewGrid } from './ui/ImportPreviewGrid';
export { BatchEditPanel } from './ui/BatchEditPanel';
export { ImportConfirmStep } from './ui/ImportConfirmStep';
export { UploadStepCard } from './ui/UploadStepCard';
export { AnonymizationStep } from './ui/AnonymizationStep';

// Store (direct access from components)
export { useImportWizardStore } from './store/useImportWizardStore';

// API
export { dictionaryProvider } from './api/dictionaryProvider';

// Model functions (for unit testing or composition)
export { parseCsvFile, CsvParseError } from './model/parser/csv-parser';
export { autoDetectMapping, normalizeHeader } from './model/column-mapper';
export { transformRows } from './model/row-transformer';
export { anonymizeTitle, processRows } from './model/anonymizer/pipeline';
export { detectBankFromHeaders } from './model/bank-detector';
export { buildFromStubs, createDictionaryProvider, devDictionaryProvider } from './model/anonymization/dictionaries/dictionary.provider';
```

### Usage from page:

```typescript
// pages/ImportPage.tsx
import {
  useImportWizard,
  useImportSubmit,
  useBatchEditPanel,
  UploadStepCard,
  ColumnMappingStep,
  AnonymizationStep,
  ImportPreviewGrid,
  ImportConfirmStep,
  BatchEditPanel,
} from '#features/csv-import';

export const ImportPage = (): React.JSX.Element => {
  const wizard = useImportWizard();
  const submit = useImportSubmit();
  const batchEdit = useBatchEditPanel();

  // Render step-based wizard UI using these hooks
};
```

---

## Extension Points

### Adding a new PII detector

1. Create `model/anonymizer/detectors/{type}-detector.ts` implementing `PiiDetector` interface:
```typescript
export const myDetector: PiiDetector = {
  id: 'my_type',
  priority: 75, // Choose based on confidence (higher = wins conflicts)
  detect(text: string, dictionaries: DictionarySet): readonly DetectionSpan[] {
    // Return spans with start/end/confidence
  },
};
```

2. Add `PiiType` to `model/types.ts`:
```typescript
export type PiiType = ... | 'my_type';
```

3. Register in `model/anonymizer/pipeline.ts` `DEFAULT_DETECTORS` array:
```typescript
const DEFAULT_DETECTORS: readonly PiiDetector[] = [
  ...existingDetectors,
  myDetector,
];
```

4. Add masking strategy in `model/anonymizer/masker.ts`:
```typescript
const MASK_STRATEGIES: Record<string, MaskFn> = {
  ...existing,
  my_type: (original) => `masked_${original.slice(0, 2)}•••`,
};
```

5. Write tests in `model/anonymizer/detectors/{type}-detector.spec.ts`.

### Adding a new bank profile

1. Create signature in `model/bank-detector.ts`:
```typescript
{
  displayName: 'MyBank',
  headerPatterns: [['data', 'opis', 'kwota', 'waluta']],
}
```

2. Add header heuristics in `model/column-mapper.ts` if the bank uses unique column names:
```typescript
const HEADER_HEURISTICS: Record<string, DomainField> = {
  ...existing,
  'my bank column name': 'title',
};
```

### Adding a new wizard step

1. Update `WizardStep` type in `model/types.ts` (currently `0 | 1 | 2 | 3 | 4`)
2. Add state slice to `store/useImportWizardStore.ts`
3. Create hook in `ui/hooks/useMyStep/`
4. Create component in `ui/MyStep/`
5. Wire into page's step-based rendering

---

## Store Design

The `useImportWizardStore` is a single Zustand store with immer middleware. It holds all wizard state across steps:

**Design decisions:**
- **Single store (not per-step):** Steps share data (parsedData from step 0 is needed in step 1+2). Splitting would require cross-store orchestration.
- **Immer middleware:** Enables mutable-looking updates for nested state (rows array, batchEditPanel).
- **`reset()` on route unmount:** Security requirement — clears all data (including original titles) from memory.

**State shape:**
| Section | Fields | Purpose |
|---------|--------|---------|
| Navigation | `step` | Current wizard step (0-4) |
| Upload | `file`, `parsedData`, `parseError` | Raw file + parse result |
| Mapping | `columnMapping`, `detectedMapping` | User-confirmed column assignments |
| Preview | `rows`, `anonymizationEntries` | Transformed + anonymized data |
| Submission | `isSubmitting`, `submitError`, `batchId` | Local persistence state |
| UI | `selectedRowIds`, `batchEditPanel` | Grid selection + batch edit panel |

**Security invariant:** `anonymizationEntries[].originalTitle` contains raw PII. It exists only for the review UI and is stripped before encrypted local persistence. The `reset()` action clears everything from memory on navigation away.

---

## Key Model Functions

### `column-mapper.ts`

**`autoDetectMapping(headers)`** — heuristic-based column-to-domain-field mapping:
- Normalizes headers (strip `#`, quotes, parenthetical suffixes, BOM)
- Matches against `HEADER_HEURISTICS` dictionary (PL + EN column names)
- Handles debit/credit split columns (`Kwota Wn` = debit, `Kwota Ma` = credit)
- Returns `ColumnMapping` — `Partial<Record<string, DomainField>>`

**`hasRequiredFields(mapping)`** — validates minimum: date + title + (amount OR debit/credit)

### `row-transformer.ts`

**`transformRows(rows, mapping)`** — converts raw string CsvRows to typed TransactionRows:
- Auto-detects date format from first 10 samples
- Auto-detects amount locale (PL vs EN) from first 10 samples
- Handles debit/credit merge (Wn = negative, Ma = positive)
- Returns per-row status: `ok`, `warning` (unparseable date), `error` (invalid amount/empty title)
- Generates UUID per row for grid identity

### `duplicate-detector.ts`

**`detectDuplicatesInBatch(rows)`** — near-duplicate handling:
- Hash: `date|amount|title_lowercase`
- 1st occurrence: pass through
- 2nd: `warning` (likely real — two coffees same day)
- 3rd+: `duplicate` (unlikely legitimate)

**`detectDuplicatesAgainstExisting(rows, existingHashes)`** — cross-file dedup (strict)

### Local import persistence

The local persistence pipeline prepares encrypted records:
- Filters out error/duplicate rows
- Computes SHA-256 `contentHash` per row for local deduplication
- Stores the batch and its metadata in encrypted IndexedDB

**Important ([DEC-003](../../history/decisions/DEC-003-content-hash-before-anonymization.md)):** Content hash is computed from `date|amount|title` — where `title` is the anonymized version at this point. The original architectural decision specified hash from raw data for stronger dedup, but current implementation hashes post-anonymization for security. This is a known deviation — the hash is still effective because anonymized titles retain enough uniqueness per transaction.

---

## Dictionary API Integration

The anonymization pipeline requires dictionary data (first names, surnames, merchants, cities, common phrases) for PII detection. Dictionaries are loaded from the backend [Dictionaries API](../backend/dictionaries-module.md) with offline fallback to bundled stubs.

### Architecture

```
api/fetchDictionaries/      ← HTTP client: GET /dictionaries → DictionarySet
api/dictionaryProvider/     ← Production provider: fetch + stub fallback, cached
model/.../dictionaries/
  dictionary.provider.ts    ← Factory (createDictionaryProvider) + devDictionaryProvider
  stubs/                    ← Bundled JSON files (~28KB) for offline/test use
```

**Layer placement:**
- `createDictionaryProvider` factory in `model/` — pure function, defines the `DictionaryProvider` interface, enables DIP (caller passes loader function).
- `fetchDictionaries` in `api/` — HTTP call using shared `apiClient`, converts arrays to `ReadonlySet<string>`.
- `dictionaryProvider` in `api/` — production instance wired with fetch + stub fallback loader.
- `devDictionaryProvider` in `model/` — stub-only instance for tests and offline development.

### Loading strategy

| Aspect | Behavior |
|--------|----------|
| When loaded | Lazy — on first `handleMappingConfirm` (Step 1 → Step 2 transition) |
| Caching | Single in-memory cache per provider instance |
| Cache invalidation | Page reload (no active TTL; acceptable for rarely-changing reference data) |
| Fallback | On any fetch error → bundled stubs (with console warning) |
| Backend caching | `GET /dictionaries` supports `ETag` + `Cache-Control: public, max-age=86400` |

### Data flow

```
useImportWizard.handleMappingConfirm()
  → dictionaryProvider.loadAll()
    → fetchDictionaries()                       [api/fetchDictionaries]
      → apiClient.get<DictionaryApiResponse>('/dictionaries')
      → converts arrays → ReadonlySet<string>   [O(1) lookup in detectors]
    → on error: buildFromStubs()                [model/dictionaries/stubs]
  → processRows(titles, dictionaries)           [model/anonymization/pipeline]
  → PII detection with Set.has() lookups
```

### Why not TanStack Query?

The provider already implements single-instance caching with `loadAll()` returning the same `Promise` on repeated calls. TanStack Query would add:
- Unnecessary component re-renders on cache state changes
- Stale-while-revalidate semantics that are wrong for this use case (dictionaries don't go stale mid-import)
- Extra abstraction around a non-reactive data source

The provider's built-in cache is simpler, predictable, and sufficient for reference data that changes at most once per deployment.

### Test isolation

| Provider | Usage | HTTP calls |
|----------|-------|------------|
| `dictionaryProvider` | Production (wired in `useImportWizard`) | Yes (with fallback) |
| `devDictionaryProvider` | Unit tests, Storybook, offline dev | Never |

Tests that exercise the anonymization pipeline use `devDictionaryProvider` directly — no mocking needed, deterministic stubs. Tests for `dictionaryProvider` itself mock `fetchDictionaries` to verify fallback behavior and caching.

### Test coverage

- `fetchDictionaries.spec.ts` — 5 tests: correct endpoint, array→Set conversion, data preservation, empty arrays, error propagation.
- `dictionaryProvider.spec.ts` — 8 tests: API success, 500 fallback, network error fallback, caching (one call), fallback caching, `isLoaded()`, `resetCache()`, console warning on fallback.

---

## Boundaries & Non-Goals

**What this feature DOES:**
- Parse any CSV file to structured data
- Detect and mask PII client-side
- Let users map columns, edit data, batch-correct
- Persist accepted transactions and import history in encrypted IndexedDB

**What this feature does NOT do:**
- **Store raw CSV data in any persistent storage** — all processing is in-memory, cleared on unmount
- **Send financial rows to the backend** — the retired `/imports` API is not part of the flow
- **Display imported transaction history** — that's the `transactions` feature/page
- **Manage import profiles persistently** — backend `import-profiles` module handles CRUD; this feature only uses profiles for auto-detection hints
- **Run categorization rules on the server** — local rules are applied before persistence
- **Cross-file duplicate check via API** — local encrypted persistence performs deduplication

---

## Trade-offs

> Relevant historical records: [DEC-003](../../history/decisions/DEC-003-content-hash-before-anonymization.md) (content hash before anonymization), [DEC-005](../../history/decisions/DEC-005-gdpr-front-only-anonymization-in-mvp.md) (GDPR front-only MVP), [DEC-031](../../history/decisions/DEC-031-tanstack-query-for-server-state-zustand-for-local-domain-state.md) (state split), [DEC-057](../../history/decisions/DEC-057-simplified-frontend-architecture-layered-fsd-no-ddd-hexagonal.md) (simplified FE architecture).
>
> **TODO — owner decision required:** This guide records post-anonymization hashing in the implementation, which conflicts with DEC-003. Preserve both statements until the intended security/deduplication trade-off is decided explicitly.

### 1. Single monolithic store vs per-step stores
**Chose:** One store with all wizard state.
**Trade-off:** Large interface (30+ fields + actions). But steps share data extensively — splitting would require subscribers or event bus between stores, adding complexity for no UX benefit.

### 2. Eagerly anonymize on mapping confirm (not separate step)
**Chose:** Run anonymization pipeline in `handleMappingConfirm` — user sees anonymized data in the grid.
**Trade-off:** No dedicated "review anonymization" step in MVP. The `AnonymizationStepPlaceholder` exists but anonymization currently runs inline. User can still see original via DetectionChip spans.

### 3. Local persistence (not server submission)
**Chose:** Persist prepared records and import metadata directly to encrypted IndexedDB.
**Trade-off:** The server cannot query imported rows, but financial data remains local and the same source of truth works offline.

### 4. In-batch dedup: warn on 2nd occurrence (not reject)
**Chose:** 2nd identical row gets `warning`, not `duplicate`.
**Trade-off:** May let real duplicates through. But rejecting them causes data loss for common real-world patterns (two trips to same store, same amount, same day). User reviews warnings in the grid.

### 5. Client-side only parsing (no server assist)
**Chose:** All parsing runs in browser (no file upload to backend).
**Trade-off:** Limited to 10MB files (browser memory), no server-side validation of parse results. But guarantees zero PII leakage — raw data physically cannot leave the device.

---

## Testing Strategy

### Model layer (pure functions) — unit tests
```
model/parser/csv-parser.spec.ts           # Orchestrator integration
model/parser/date-parser.spec.ts          # 9 formats × valid/invalid
model/parser/amount-parser.spec.ts        # PL/EN locales, edge cases
model/parser/separator-detector.spec.ts   # Multiple separator types
model/parser/encoding-detector.spec.ts    # BOM, jschardet, fallback
model/anonymizer/pipeline.spec.ts         # Full pipeline (detect→mask)
model/anonymizer/conflict-resolver.spec.ts # Priority + overlap
model/anonymizer/masker.spec.ts           # All 10 mask strategies
model/anonymizer/detectors/*.spec.ts      # Per-detector (20+ cases each)
model/anonymizer/dictionaries/dictionary.provider.spec.ts  # devDictionaryProvider (stubs)
model/column-mapper.spec.ts              # Heuristic matching
model/row-transformer.spec.ts            # Type conversion + error handling
model/duplicate-detector.spec.ts         # In-batch + cross-file dedup
model/import-chunks.spec.ts              # Chunking + hashing
model/__tests__/csv-stubs-integration.spec.ts  # 5 real CSV files end-to-end
```

### API layer — mocked HTTP tests
```
api/fetchDictionaries/fetchDictionaries.spec.ts    # 5 tests: endpoint, conversion, data, empty, errors
api/dictionaryProvider/dictionaryProvider.spec.ts   # 8 tests: success, fallback, cache, resetCache, isLoaded
```

**Test approach:** Every `model/` function is pure — no mocks needed. Input → expected output. The integration test uses real bank CSV stubs (mBank, PKO BP, Santander, Revolut, mixed formats).

### UI hooks — harder to test in isolation
Hook tests would require mocking the store and API. Currently covered by the integration tests on the model layer + manual testing. Full component testing planned post-MVP.

### Running tests
```bash
cd client
npx vitest run --reporter=verbose   # all tests
npx vitest run model/parser          # parser only
npx vitest run model/anonymizer      # anonymizer only
```

---

## Security Considerations

| Concern | Mitigation |
|---------|-----------|
| Raw PII in memory | `store.reset()` on route unmount, `AnonymizationEntry.originalTitle` never sent to API |
| Raw PII in network traffic | Raw CSV and original PII never leave the browser |
| Raw PII in console | All `console.info` in DEV only (`import.meta.env.DEV`), never log row content |
| Raw PII in error messages | Errors reference row index only, never title content |
| Dictionary data persistence | In-memory only (ReadonlySet), never localStorage/sessionStorage. Fetched from `GET /dictionaries` on first use; bundled stubs as offline fallback. |
| File data after import | `file` reference cleared on reset, ArrayBuffer GC'd |

---

## Related Documentation

- [CSV Parser — Technical](../../architecture/csv-engine/parser.md) — parsing algorithm internals
- [PII Anonymizer — Technical](../../architecture/csv-engine/pii-anonymizer.md) — detection pipeline
- [Architecture: CSV Anonymizer Engine](../../architecture/csv-engine/overview.md) — system design
- [Dictionaries Module — Backend](../backend/dictionaries-module.md) — API endpoints, schema, caching
- [ADR-002: Boundary Detection](../../adr/002-csv-boundary-detection-algorithm.md) — algorithm decisions
- [ADR-001: Bank CSV Categories](../../adr/001-bank-csv-categories.md) — planned `category` DomainField
- [Legacy decision index](../../history/decisions/README.md) — atomized DEC records and authority warnings

---

*Updated: 2026-08-22 | Source: `client/src/features/csv-import/`*
