# Phase 4.3: CSV Import Flow — ✅ COMPLETE

> **Source status:** The source heading explicitly marks Phase 4.3 COMPLETE. Subphase E.16 remains deferred in the source. The unrelated Phase 4.0 implementation block originally embedded between these ranges moved to its own phase file.

| # | Task | Status |
|---|---|---|
| 4.3.1 | CSV parser (papaparse adapter + domain entities + preview) | ✅ Done (DEC-061 rewrite) |
| 4.3.2 | DataGrid with editing (AG Grid, editable cells, column mapping) | ✅ Done |
| 4.3.3 | Smart batch edit (edit propagation, side panel UX) | ✅ Done |
| 4.3.4 | Anonymization pipeline (auto regex + per-profile + manual review) | ✅ Done (DEC-061 rewrite) |
| 4.3.5 | Import API integration (chunking, retry, progress, error handling) | ✅ Done |

### Phase 4.3.E: Enterprise CSV Engine (DEC-061) — ✅ Done (E.16 bank profiles deferred)

Full architecture: [CSV parser and anonymizer engine](../../architecture/csv-engine/overview.md)

| # | Task | Status |
|---|---|---|
| 4.3.E.1 | Types rewrite + PiiDetector/DictionaryProvider/BankProfile interfaces | ✅ Done |
| 4.3.E.2 | Dictionary provider (port) + dev JSON stubs (names, surnames, merchants, cities, phrases) | ✅ Done |
| 4.3.E.3 | Parser: encoding-detector (jschardet) | ✅ Done |
| 4.3.E.4 | Parser: separator-detector (statistical, streak+mode, handles metadata) | ✅ Done |
| 4.3.E.5 | Parser: date-parser (9 formats, auto-detect, PL months, flexible fallback) | ✅ Done |
| 4.3.E.6 | Parser: amount-parser (multi-locale, NBSP, parentheses-negative, leading +) | ✅ Done |
| 4.3.E.7 | Parser: csv-parser orchestrator (encoding → BOM → NBSP → boundaries → sep → parse) | ✅ Done |
| 4.3.E.7b | Parser: data-boundary-detector (header offset, footer detection, scoring heuristic) | ✅ Done |
| 4.3.E.8 | Anonymizer: IBAN detector (regex + mod97 + bare PL 26-digit + quote handling) | ✅ Done |
| 4.3.E.8b | Anonymizer: card detector (Luhn, BIN prefix, masked patterns) | ✅ Done |
| 4.3.E.8c | Anonymizer: PESEL detector (11-digit, checksum mod10, birth date validation) | ✅ Done |
| 4.3.E.8d | Anonymizer: NIP detector (10-digit, checksum mod11, context-dependent) | ✅ Done |
| 4.3.E.8e | Anonymizer: national ID detector (3 letters + 6 digits, identity card) | ✅ Done |
| 4.3.E.8f | Anonymizer: birth date detector (context keywords: ur., urodzona + date) | ✅ Done |
| 4.3.E.9 | Anonymizer: phone detector (PL + INT, no-space prefix, context-aware) | ✅ Done |
| 4.3.E.10 | Anonymizer: email detector | ✅ Done |
| 4.3.E.11 | Anonymizer: name detector (dictionary + positional heuristics + company prefix filter) | ✅ Done |
| 4.3.E.12 | Anonymizer: address detector (street patterns + postal code) | ✅ Done |
| 4.3.E.13 | Anonymizer: conflict-resolver (extracted module, priority + confidence) | ✅ Done |
| 4.3.E.14 | Anonymizer: masker (extracted module, 10 type-specific strategies) | ✅ Done |
| 4.3.E.15 | Anonymizer: pipeline orchestrator (configurable detector registry, whitelist, gate) | ✅ Done |
| 4.3.E.16 | Column mapper: bank profiles (mBank, PKO, ING, Santander, Revolut, generic) | ⬜ |
| 4.3.E.17 | Column mapper: auto-detector (sample-based column inference) | ✅ Done (heuristic headers + normalization + debit/credit + category + anchor strategy) |
| 4.3.E.18 | Integration tests: 5 real CSV stubs (easy/medium/hard/mixed) | ✅ Done |
| 4.3.E.19 | Delete old naive implementations (anonymizer.ts, csv-parser.ts, column-mapper.ts) | N/A (rewritten in-place) |

### Phase 4.3.F: CSV Engine Follow-up Tickets (from code review) — ✅ Done

| # | Task | Status | Source |
|---|---|---|---|
| 4.3.F.1 | Column mapper: strip #, quotes, normalize case, parenthetical suffixes | ✅ Done | CR-4 |
| 4.3.F.2 | Column mapper: Kwota Wn/Ma debit/credit split handling | ✅ Done | CR-7 |
| 4.3.F.3 | Phone detector: exclude BLK/REF/NR POLISY patterns | ✅ Done | CR-12 |
| 4.3.F.4 | Duplicate detector: near-duplicate handling (same amount, different auth code) | ✅ Done | CR-6 |
| 4.3.F.5 | Encoding detector: count replacement chars, warn user if >0 | ✅ Done | CR-14 |
| 4.3.F.6 | Date parser: i18n month registry (DE, full month names) | ✅ Done | CR-15 |

**Acceptance criteria (updated):**
- ✅ Parser handles Windows-1250 + semicolons (most PL banks)
- ✅ Name detector ≥95% recall, <5% false positive (dictionary + positional + company filter)
- ✅ IBAN detector 100% accuracy (mod97, full + bare PL with quote)
- ✅ PESEL/NIP checksum validation (zero false positives on valid checksums)
- ✅ Full pipeline: 10 PII detectors, conflict resolution, type-specific masking
- ✅ Zero PII in errors/logs/stored state
- ✅ 224 tests passing (23 files), tsc clean
- ⬜ Full pipeline: 1800 rows in <2 seconds (not benchmarked yet)
- ⬜ Bank profile auto-detection (header fingerprinting)

### Implemented (Phase 4.3.E — session 2026-06-30)

**Parser pipeline:**
- Encoding detection (UTF-8, Windows-1250, ISO-8859-2, BOM)
- NBSP normalization at top of pipeline
- Data boundary detection: header scoring (keyword match + date penalty + position bias), footer detection (bottom-up non-matching lines)
- Separator detection: mode+streak algorithm, handles metadata headers (pipe, semicolon, comma, tab)
- Date parser: 9 formats, data-driven factory (`createNumericParser`), Polish month names (CZE, STY, etc.), English months, short year, `parseDateFlexible` for mixed-format files
- Amount parser: NBSP, parentheses-negative `(8.50)→-8.50`, leading `+`, leading quote strip, currency suffix strip

**Anonymizer pipeline:**
- 10 detectors: IBAN (full + bare PL), card (Luhn + masked), PESEL (checksum), NIP (checksum), national ID (identity card), birth date (context), phone (PL+INT+no-space), email, name (dictionary + positional + company prefix filter), address (street + postal code)
- Conflict resolver: extracted module, priority + confidence, non-overlapping output
- Masker: extracted module, 10 type-specific strategies
- Pipeline: configurable detector registry (DI via parameter), whitelist filter, confidence gate
- Company abbreviation handling (P.H.U, F.H.U, Sp. z o.o.) — names after company prefixes not flagged as PII
- Shared constants module (COMPANY_FORM_VARIANTS)

**Integration tests:**
- 5 real-world CSV stubs (Revolut easy, mBank medium/Win-1250, PKO BP hard/multiline/footer, mixed-format, Santander pipe-separated/metadata)
- 45 integration tests covering encoding, separator, boundaries, dates, amounts

**Tests:**
- 224 total tests, 23 files, all passing
- tsc --noEmit clean


### Tooling Stack (DEC-034 → DEC-037)

- **Grid:** AG Grid Community (grouping, sort, pagination, editable cells, row expand)
- **UI:** shadcn/ui + Radix + Tailwind CSS v4
- **Charts:** Nivo (behind a facade — possible switch to paid lib)
- **Forms:** React Hook Form
- **Routing:** React Router v7
- **Dark mode:** Immediately (CSS vars, Tailwind dark:, class strategy)
- **Design system dev:** Storybook 10 (Vite-native, autodocs, dark mode toolbar)

### Phase 4.3.G: CSV Column Mapping UX + Parser Robustness — ✅ COMPLETE

| # | Task | Status |
|---|---|---|
| 4.3.G.1 | Preview row selection (click row → update example values in field mapping) | ✅ Done |
| 4.3.G.2 | E2E tests for parseCsvFile() across all 15 CSV stubs | ✅ Done |
| 4.3.G.3 | Anchor-based strategy (resilient to any number of separators in content) | ✅ Done |
| 4.3.G.4 | CRLF normalization in parser pipeline | ✅ Done |
| 4.3.G.5 | Trailing separator normalizer (strip consistent trailing empties) | ✅ Done |
| 4.3.G.6 | AMOUNT_PATTERN — accept currency suffix (e.g. -180,62 PLN) | ✅ Done |
| 4.3.G.7 | `category` as DomainField + auto-detect + row-transformer extraction | ✅ Done |
| 4.3.G.8 | ADR-004: Category import modal design (step 5, fuzzy matching) | ✅ Done (design only) |
| 4.3.G.9 | Review findings fix (gitignore, unused imports, shared patterns.ts, # imports) | ✅ Done |

**Key decisions:**
- Anchor-based parsing: dates left, amounts right, everything in middle = merged blob → resilient to format changes
- Category mapped from CSV but full import modal (matching existing categories) deferred to step 5 feature (ADR-004)
- Exotic language CSVs (Vietnamese, Turkish, Japanese) degrade gracefully to headerless mode (by design)
- Footer detection not implemented yet (Santander PODSUMOWANIE still included in data)

**Acceptance criteria (updated):**
- ✅ Parser handles Windows-1250 + semicolons (most PL banks)
- ✅ mBank personal + business format (amounts with/without PLN suffix) — no column shift
- ✅ Revolut, PKO BP, Santander, Indian SBI, Nigerian GTB — correct header→value mapping
- ✅ 367 tests passing, tsc clean (3 pre-existing failures in old footerLines tests)
- ✅ Category auto-detected from CSV header heuristics

---

### Phase 4.3.H: CSV Import Code Quality Refactoring (ADR-007) — ✅ COMPLETE

| # | Task | Status |
|---|---|---|
| 4.3.H.1 | Restructure model/ → domain-grouped modules (parsing/, column-mapping/, transformation/, anonymization/, submission/) | ✅ Done |
| 4.3.H.2 | Folder-per-file with index.ts barrels | ✅ Done |
| 4.3.H.3 | Role suffixes (.detector.ts, .parser.ts, .strategy.ts, .registry.ts) | ✅ Done |
| 4.3.H.4 | Extract registries (HeaderHeuristicRegistry, BankProfileRegistry) | ✅ Done |
| 4.3.H.5 | Add specs for registries + data-boundary-detector | ✅ Done |
| 4.3.H.6 | Update all internal + external imports | ✅ Done |
| 4.3.H.7 | Unified model/index.ts barrel (public API) | ✅ Done |

**Results:** 384 tests pass (+17 new), 3 pre-existing failures unchanged, tsc clean.
**Prerequisite for:** Step 3 Anonymization UI, Account integration, any import extension.

---

### Phase 4.3.I: Anonymization Step UI (Step 3 Import Wizard) — ✅ Done

Design doc: [archived anonymization UI plan](../archive/anonymization-ui.md)

| # | Task | Status |
|---|---|---|
| 4.3.I.1 | `useAnonymizationStep` hook — runs pipeline on mount, manages state entries (AnonymizationEntry[]), bulk accept, per-row restore/edit | ✅ |
| 4.3.I.2 | `AnonymizationStep` component (replaces placeholder) — header, legend of statuses, stats bar, grid container, navigation Back/Next | ✅ |
| 4.3.I.3 | AG Grid column definitions — dynamic columns from `columnMapping`, custom cell renderer for title (dot + mono + background color per status) | ✅ |
| 4.3.I.4 | Row styling — border-left 2px in color of status via `rowClassRules`, cell background color = soft color of status | ✅ |
| 4.3.I.5 | Cell click popover — status badge, section "Original" vs "Anonymized" (mono, borders), buttons "Restore" / "Edit" | ✅ |
| 4.3.I.6 | "Edit" flow in popover — input with masked text, save user correction to entry | ✅ |
| 4.3.I.7 | "Restore" flow — restores original text of row (status → safe, clears spans) | ✅ |
| 4.3.I.8 | "Accept all suggestions" — bulk accept (CTA button in header), updates accepted flag on all entries | ✅ |
| 4.3.I.9 | Stats bar (computed) — "Scanned N cells • X anonymized • Y to review" | ✅ |
| 4.3.I.10 | Filtering grid by status (safe / to review / anonymized) — toolbar with chip/tab filters | ✅ |

**Prereqs:** Model layer done (pipeline, detectors, masker, conflict resolver — Phase 4.3.E). Store (`useImportWizardStore`) has parsed rows available.

**Context:**
- Pipeline runs **on mount of step** (lazy), not on previous step
- Dynamic columns from `columnMapping` (not hardcoded DATE/OPIS/KWOTA)
- AG Grid Community — built-in row virtualization (handles 1800 rows)
- Statuses: `safe` (green/income), `needs_review` (yellow/warning), `anonymized` (red/expense)
- "Edit" = popover with input (not inline editing in grid)
- "Restore" = restores entire original row text
- Filtering by status needed because anonymized entries can also be wrong — user must be able to fix
- Everything client-side (zero API calls) — raw data NEVER leaves browser

---

### Phase 4.3.J: Preview Grid Improvements (Pagination, Filters, Sort Fix) — ✅ Done

Design doc: [archived preview-grid improvements plan](../archive/preview-grid-improvements.md)

| # | Task | Status |
|---|---|---|
| 4.3.J.1 | Grid port — `comparator` field + AG Grid adapter mapping | ✅ |
| 4.3.J.2 | Sort fix — numeric comparator on column `amount` (NaN → end) | ✅ |
| 4.3.J.3 | Custom `PaginationBar` — shared UI component (design system) | ✅ |
| 4.3.J.4 | DataGrid adapter — custom pagination mode (replaces AG Grid built-in) | ✅ |
| 4.3.J.5 | `Calendar` — shared UI component (react-day-picker + Radix Popover, dark theme tokens, PL locale) | ✅ |
| 4.3.J.6 | `DateRangePicker` — shared UI component (based on Calendar, popover trigger with selected range, preset options: "last week/month/3 months") | ✅ |
| 4.3.J.7 | `FilterToolbar` — transaction type (all/income/expense) + DateRangePicker + hook `usePreviewFilters` | ✅ |
| 4.3.J.8 | Integration — wiring FilterToolbar + custom pagination in ImportPreviewGrid | ✅ |

**Context:** Step 4 wizard (Preview) works but pagination is unstyled (AG Grid default), no filters, sort on amount has NaN bug. Everything client-side.

**DateRangePicker stack:**
- `react-day-picker` (shadcn/ui standard) — calendar rendering
- `@radix-ui/react-popover` — popover container (click trigger → floating calendar)
- `date-fns` — date manipulation (locale pl, format, isSameDay, isWithinInterval)
- Styling: Tailwind tokens (bg-surface, border-border, text-foreground), dark mode via CSS vars
- Storybook story required

---

## Related delivered-state and decision records

- [CSV import developer guide](../../guides/frontend/csv-import-feature.md)
- [CSV engine architecture](../../architecture/csv-engine/overview.md)
- [ADR-007 refactoring decision](../../adr/007-csv-import-code-quality-refactoring.md)
- [Archived anonymization UI plan](../archive/anonymization-ui.md)
- [Archived preview-grid plan](../archive/preview-grid-improvements.md)
- [Recovered DEC-061 — enterprise-grade CSV parser and anonymizer rewrite](../../history/decisions/DEC-061-csv-parser-anonymizer-enterprise-grade-rewrite.md)

## Source provenance

- Original source: legacy development plan
- Pre-atomization path: `docs/plans/roadmap.md`
- Original source lines: 348–437 and 448–561
- Frozen source commit: `582b3e8b147293c7b33dd0f839839aa81d7c8c20`
