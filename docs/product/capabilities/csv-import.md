# CSV Import

Status: **implemented, fixture-backed MVP capability**

Updated: 2026-09-25

## Current flow

NoAsterisk imports bank-statement CSV files through a five-step browser workflow:

1. **File** — validate and parse a `.csv` file of at most 10 MiB.
2. **Columns** — inspect automatic field mapping and correct it where needed.
3. **PII review** — review detected sensitive spans and edit or restore titles.
4. **Preview** — inspect normalized transactions and exclude unwanted rows.
5. **Import** — validate, categorize, deduplicate and atomically persist the
   accepted batch in encrypted IndexedDB.

The raw file is parsed in the browser. The import path does not upload CSV data or
transaction rows to the backend. Import history and accepted transactions are part
of the encrypted local financial collections and can later be included in an
explicit encrypted vault snapshot.

## Parser contract

The parser detects the separator, encoding, header/data boundary and common date
and amount formats. It includes strategies for quoted CSV, trailing separators,
unescaped separators in descriptive fields, metadata prefixes and report footers.

Regression fixtures currently cover representative exports and adversarial layouts
for Revolut, mBank, PKO BP, Santander, SBI, GTBank, Vietcombank and Ziraat. This is
evidence for those fixture shapes, not a claim that every export from those banks
or every bank CSV is compatible.

Supported input boundary:

| Property | Current contract |
| --- | --- |
| File type | `.csv` |
| Maximum size | 10 MiB |
| Separators | comma, semicolon, tab and pipe when detectable |
| Encodings | UTF-family and legacy encodings covered by detection tests, including Windows-1250 fixtures |
| Dates and amounts | Explicit parser registries; ambiguous values may require user mapping/review |
| Required semantic data | a usable date, description and amount representation |

OFX, QIF and MT940 are not supported. Malformed or previously unseen exports can be
rejected or require mapping corrections.

## PII review

The browser-side masking pipeline combines format-aware detectors, dictionaries
and confidence thresholds. High-confidence findings can be masked automatically;
ambiguous findings are presented for human review. The user can inspect the
original and masked values before accepting the import.

Masking is a risk-reduction control, not a guarantee of anonymization. The current
flow deliberately requires review instead of publishing an unsupported accuracy
percentage.

See [Privacy and security](./privacy-and-security.md) for the complete data
boundary.

## Persistence and deduplication

Accepted rows are normalized into local transaction records. The write path:

- validates every record before opening persistence;
- applies active local categorization rules;
- uses content hashes to skip already stored imported transactions;
- writes transactions and their import-history record as one related operation;
- encrypts business fields before IndexedDB commit.

Raw CSV contents and the original pre-review wizard rows are not durable records.
Leaving the import route resets the in-memory wizard state.

## Known limitations

- Parser compatibility is fixture-backed rather than universal.
- A newly encountered bank layout may require a new regression fixture and parser
  strategy.
- PII detection remains heuristic and user-reviewed.
- The import profile UI and the parser's generic fallback do not constitute a
  maintained catalogue of every bank format.
- Import is local; sharing data with another device requires a separate,
  user-initiated encrypted snapshot synchronization.

## Evidence

- Parser regression suite:
  `client/src/features/csv-import/model/parsing/csv-parser/csv.parser.e2e.spec.ts`
- Local atomic write:
  `client/src/features/csv-import/model/persistence/save-imported-batch/`
- Import orchestration:
  `client/src/features/csv-import/ui/hooks/useImportSubmit/`
- Current boundary decision:
  [ADR-011](../../adr/011-mvp-local-first-opaque-sync-boundary.md)
