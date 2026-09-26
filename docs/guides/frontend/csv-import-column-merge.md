# Column Mapping Merge — Developer Guide

## Domain Context

Polish bank CSVs frequently split transaction descriptions across multiple columns. mBank has `#Opis operacji` + `#Tytuł`, PKO BP separates sender/recipient into `Nadawca` + `Adresat`. Users need a way to combine these into a single logical field without losing information.

The merge feature lets users (and auto-detection) assign the same `DomainField` to multiple CSV columns. During transformation, values from those columns are concatenated in CSV column order.

---

## Architecture

```
model/column-mapping/
  types.ts                       ← DomainField union, MERGEABLE_FIELDS set
  column-mapper/
    column.mapper.ts             ← autoDetectMapping (respects merge), isDomainField, normalizeHeader
    column.mapper.spec.ts        ← 16 tests including merge cases
  heuristics/
    header-heuristic.registry.ts ← 60+ heuristics (includes source, recipient, reference)

model/transformation/
  types.ts                       ← TransactionRow (source?, recipient?, reference?)
  row-transformer/
    row.transformer.ts           ← buildFieldToColumns, mergeColumns, transformRows
    row.transformer.spec.ts      ← 24 merge/new-field tests

ui/
  hooks/useColumnMappingStep/
    useColumnMappingStep.ts      ← isMergedColumn, getMergePartners, fieldOptions
  FieldAssignmentRow/
    FieldAssignmentRow.tsx       ← merge badge rendering (Badge variant="soft" color="primary")
    useFieldAssignmentRow.ts     ← handleChange adapter
```

---

## Key Concepts

### DomainField

Union type of all recognized target fields:

```typescript
type DomainField =
  | 'date' | 'title' | 'amount' | 'currency' | 'balance'
  | 'debit' | 'credit' | 'category'
  | 'source' | 'recipient' | 'reference';
```

### MERGEABLE_FIELDS

Controls which fields accept multi-column assignment. Only these fields can have 2+ CSV columns mapped to them simultaneously:

```typescript
export const MERGEABLE_FIELDS: ReadonlySet<DomainField> = new Set([
  'title',
  'source',
  'recipient',
]);
```

Non-mergeable fields (date, amount, currency, etc.) silently keep only the first mapped column.

### Merge Semantics

- Values are joined in **CSV column order** (not assignment order).
- Each value is trimmed before joining.
- Blank/empty values are filtered out (no double spaces).
- Separator is a single space (`MERGE_SEPARATOR = ' '`).
- If ALL merged columns are blank → the row gets `status: 'error'` (for required fields like title).

---

## Data Flow

```
CSV headers detected
  ↓ autoDetectMapping() — allows MERGEABLE_FIELDS to match multiple headers
ColumnMapping stored in wizard store (Record<csvColumn, DomainField>)
  ↓ user can manually assign additional columns to same field
transformRows() called
  ↓ buildFieldToColumns() → Record<DomainField, string[]>
  ↓ mergeColumns(row, columns) → concatenated string
TransactionRow produced with merged title/source/recipient
```

---

## Internal Functions

### `buildFieldToColumns(mapping: ColumnMapping): Partial<Record<DomainField, readonly string[]>>`

Inverts the mapping. For mergeable fields, accumulates all columns. For non-mergeable, keeps first only.

```typescript
// Input:  { 'Opis': 'title', 'Tytuł': 'title', 'Data': 'date', 'Kwota': 'amount' }
// Output: { title: ['Opis', 'Tytuł'], date: ['Data'], amount: ['Kwota'] }
```

### `mergeColumns(row: CsvRow, columns: readonly string[]): string`

Joins column values from a single row:

```typescript
// row = { 'Opis': 'PRZELEW', 'Tytuł': 'WYNAGRODZENIE', 'Extra': '' }
// columns = ['Opis', 'Tytuł', 'Extra']
// result = 'PRZELEW WYNAGRODZENIE'  (Extra filtered as blank)
```

### `autoDetectMapping(headers, registry?): ColumnMapping`

Iterates headers, matches against heuristic registry. For mergeable fields, skips the `usedFields` check — allowing multiple columns to map to the same field:

```typescript
if (field && (!usedFields.has(field) || MERGEABLE_FIELDS.has(field))) {
  mapping[header] = field;
  usedFields.add(field);
}
```

---

## UI Integration

### `isMergedColumn(header: string): boolean`

Returns true when the column's assigned field is mergeable AND at least one other column shares that field.

### `getMergePartners(header: string): readonly string[]`

Returns the other column names sharing the same field (excluding the queried header itself).

### Merge Badge

Rendered in `FieldAssignmentRow` when `isMerged` is true:

```tsx
{isMerged && (
  <Badge variant="soft" color="primary" dot={false}>
    {t('import.mapping.merge.badge', { count: mergePartners.length + 1 })}
  </Badge>
)}
```

Displays "merge ×N" where N = total columns sharing the field. The row also gets `border-l-primary` visual indicator.

---

## Extension Points

### Adding a New DomainField

1. Add to the union in `model/column-mapping/types.ts`:

```typescript
export type DomainField =
  | 'date' | 'title' | 'amount' | /* ... */
  | 'newField';
```

2. Add to `VALID_DOMAIN_FIELDS` in `column-mapper/column.mapper.ts`:

```typescript
const VALID_DOMAIN_FIELDS: ReadonlySet<string> = new Set<DomainField>([
  /* existing */, 'newField',
]);
```

3. If the field should support multi-column merge, add to `MERGEABLE_FIELDS`:

```typescript
export const MERGEABLE_FIELDS: ReadonlySet<DomainField> = new Set([
  'title', 'source', 'recipient', 'newField',
]);
```

4. Add to `TransactionRow` interface in `model/transformation/types.ts`:

```typescript
export interface TransactionRow {
  /* ... */
  readonly newField?: string;
}
```

5. Handle in `transformRows()` — add column resolution + population logic.

6. Add i18n key (`import.mapping.fields.newField`) and entry to `fieldOptions` in `useColumnMappingStep`.

### Adding a New Header Heuristic

Append to `BUILTIN_HEURISTICS` in `header-heuristic.registry.ts`:

```typescript
{ normalized: 'nowa kolumna', field: 'newField', source: 'builtin' },
```

The `normalized` value must match what `normalizeHeader()` produces (lowercase, stripped of `#`, quotes, parenthetical suffixes, BOM).

### Changing the Merge Separator

Single constant in `row.transformer.ts`:

```typescript
const MERGE_SEPARATOR = ' ';  // Change to ' | ' or '\n' etc.
```

### Backend Integration (Future)

When the local stored-transaction schema adds `source`, `recipient`, or `reference`, update only the local persistence mapper (step 4 of the wizard). The transformation layer already produces these fields on `TransactionRow`.

---

## Boundaries

This module does NOT handle:

- **Profile persistence** — saving column mappings for reuse (planned: `MappingProfile` store)
- **Bank profile auto-detection** — fingerprinting headers to select a bank (4.3.E.16, not yet built)
- **Anonymization of merged fields** — handled downstream by step 3 anonymization pipeline
- **Validation of merged content** — merge is pure concatenation; semantic validation happens later

---

## Trade-offs

| Decision | Chosen | Rejected | Rationale |
|----------|--------|----------|-----------|
| Merge order | CSV column order | Assignment order | Predictable — user sees columns left-to-right in original file |
| Non-mergeable handling | Silent first-wins | Error/warning | Most cases are auto-detection picking 2 date columns; first is correct |
| Merge separator | Space | Configurable per-field | YAGNI — all real-world CSVs use space-separated title parts |
| Merge in auto-detect | Allow unlimited | Cap at 2 | PKO/mBank genuinely have 3+ title columns; capping loses data |

---

## Testing

### Test Files

| File | Coverage |
|------|----------|
| `column-mapper/column.mapper.spec.ts` | `autoDetectMapping` merge behavior (3 merge tests) |
| `row-transformer/row.transformer.spec.ts` | `transformRows` merge (7 tests) + new fields (7 tests) |
| `parsing/csv-parser/csv.parser.e2e.spec.ts` | End-to-end with real CSV stubs (merge in title columns) |

### Key Test Scenarios

- Two title columns → joined with space
- Three title columns → order preserved
- Blank column value → filtered out (no double space)
- Whitespace-padded values → trimmed before join
- All merged columns blank → `status: 'error'`
- Single column on mergeable field → backward compatible (no merge badge)
- Non-mergeable field with 2 mappings → only first column used
- Multiple `source` columns → merged correctly
- Empty `source`/`recipient`/`reference` → `undefined` (not empty string)

---

## Related

- [CSV parser/anonymizer architecture](../../architecture/csv-engine/overview.md) — full parser/anonymizer architecture
- [ADR-007](../../adr/007-csv-import-code-quality-refactoring.md) — CSV import code quality refactoring (directory structure)
- Phase 4.3.G in development plan — column mapping UX + parser robustness
