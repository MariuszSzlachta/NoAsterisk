# ADR-001: Handling Categories from Bank CSV Files

**Date:** 2026-07-02  
**Status:** Planned  
**Context:** CSV import from mBank

---

## Problem

Banks (mBank) export CSV files with a `#Kategoria` column containing their own transaction categories. This data is valuable and should be utilized in the budget system.

## Data from mBank (business account)

```
Bez kategorii
Leasing
Materiały i usługi - inne
Opłaty i odsetki
Paliwo
Podatki - inne
Podróże służbowe
Serwis i części
Towary i materiały
Ubezpieczenia
Usługi księgowe i doradcze
Wpływy - inne
Wypłata gotówki
Zakupy prywatne
```

14 unique categories. Breakdown: 12 expense, 1 income ("Wpływy - inne"), 1 empty ("Bez kategorii").

## Decisions

### 1. `category` as a DomainField in column mapping

Add `'category'` to the `DomainField` union type so the user can assign the CSV category column.

### 2. Matching logic during import

At the import stage (step 3/4):
- **Exact match** → assign existing system category
- **Partial/fuzzy match** → suggest a mapping (e.g., "Podatki - inne" → "Podatki")
- **No match** → suggest creating a new category or mapping to an existing one

### 3. Seed categories from first import

If the system has no categories yet — suggest creating a set based on the CSV. User confirms/modifies the list.

### 4. Bank → system mappings (per profile)

Store `bank_category → system_category` mapping in the import profile. On subsequent imports from the same bank — automatic assignment without prompting.

## Not doing now

- Not implementing full matching logic — that's a separate feature
- For now: add `category` to DomainField + store the value in TransactionRow

## Related

- CSV Parser: `csv-parser.ts` — boundary detection fixed (MAX_SCAN_LINES=50, column count weight)
- Column mapping: `useColumnMappingStep.ts` — field options
- Model types: `types.ts` — DomainField union

---

## For consideration: "return failed subset" pattern

Enterprise data migration wizards (hundreds of thousands of records) do:
- Import CSV → validation → what passes goes forward → what doesn't pass = returned as CSV with unmigrated items for manual correction

Since enterprise apps with hundreds of thousands of records return a subset that failed for manual correction, maybe we should go in that direction too. Alternative to inline edit in DataGrid — user gets a file with problematic rows, fixes them in Excel, re-uploads.

**Tradeoff:** inline edit is more convenient (you don't leave the wizard), but exporting failed CSV scales better with large files.
