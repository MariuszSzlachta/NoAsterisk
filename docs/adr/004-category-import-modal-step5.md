# ADR-004: Category Import Modal at Step 5 (Import)

**Date:** 2026-07-06  
**Status:** Planned  
**Context:** Extension of ADR-001 — full category import flow from CSV  
**Related:** ADR-001 (bank CSV categories)

---

## Problem

The user imports a CSV with a category column (e.g., mBank `#Kategoria`). The system should:
1. Not create duplicates of existing categories
2. Allow the user to decide what to do with new categories
3. Suggest bank → system mapping (fuzzy match)

## Decision

At step 5 (just before import) we display a modal with an overview of categories found in the CSV:

### Modal UI

```
┌─────────────────────────────────────────────────┐
│  Import categories from CSV                     │
│                                                 │
│  Found 14 categories. Matching:                 │
│                                                 │
│  ✅ Matched (existing in system):               │
│  ┌─────────────────────────────────────────┐    │
│  │ "Fuel" (CSV) → "Fuel" (system)         │    │
│  │ "Insurance" → "Insurance"              │    │
│  │ "Leasing" → "Leasing"                  │    │
│  └─────────────────────────────────────────┘    │
│                                                 │
│  ❓ New (do not exist in system):               │
│  ┌─────────────────────────────────────────┐    │
│  │ ☑ "Materials and services - other" [Create]│ │
│  │ ☑ "Service and parts"             [Create]│ │
│  │ ☐ "Uncategorized"                  [Skip] │ │
│  │ ☑ "Business travel"               [Create]│ │
│  └─────────────────────────────────────────┘    │
│                                                 │
│  [Skip category import]  [Import selected]      │
└─────────────────────────────────────────────────┘
```

### Matching Logic

1. **Exact match** (case-insensitive, trim) → automatically assign existing
2. **Partial match** (substring / Levenshtein ≤ 2) → suggest with option to change
3. **No match** → options: Create new / Assign to existing / Skip

### Rules:
- Matched → DO NOT create a duplicate, use existing category
- New + accepted → creates category in system
- New + skipped → transactions imported without category
- "Uncategorized" / empty → skipped by default (pre-unchecked)
- Mapping saved in import profile (ADR-001 point 4)

### When the modal does NOT appear:
- CSV does not have a mapped `category` column
- All categories from CSV exact-match existing ones (transparent import)

## Technical Requirements

### Frontend:
- Modal component in `features/csv-import/ui/CategoryImportModal/`
- Hook `useCategoryImportModal` — fuzzy match logic + state
- Extract unique categories from `TransactionRow[].category`

### Backend (exists):
- GET `/categories` — list of user's existing categories
- POST `/categories` — create new category
- Batch create endpoint may be needed

### Model:
- `model/category-matcher.ts` — pure function: (csvCategories[], systemCategories[]) → MatchResult[]
- Types: `CategoryMatchResult = { csvName, match: 'exact' | 'partial' | 'none', systemCategory?, suggestion? }`

## Not doing now (foundations done)

- ✅ `category` as DomainField — DONE (this session)
- ✅ Auto-detect `#Kategoria` column — DONE (HEADER_HEURISTICS)
- ✅ Category extraction in row-transformer — DONE
- ⏳ Modal UI — separate task
- ⏳ Fuzzy matcher — separate task
- ⏳ Mapping persistence in profile — separate task

## Implementation Order

1. `category-matcher.ts` (pure fn, testable offline)
2. API hook: `useCategories` query
3. `useCategoryImportModal` hook
4. `CategoryImportModal` component
5. Wire into wizard step 5 (conditionally before submit)
