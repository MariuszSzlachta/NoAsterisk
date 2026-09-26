# Original Product Future Work

> **Source status:** These blocks were explicitly framed as phase 2+, deferred, non-MVP or post-MVP in the original product concept. They are preserved as plans, not current capabilities.

## Things to Defer (Not MVP)

- ABAC implementation (architecture is ready, code is not)
- Sharing sub-budgets between users (edit/view)
- Direct integration with bank APIs (PSD2) — for now, CSV is sufficient
- RegexMatcher in the rule engine
- Mobile application

---

## Planned Features (Post MVP)

### Category Matching from Bank CSV

Banks (mBank) export a category in CSV (`#Kategoria`). This feature uses these data:

1. **Import:** `category` as a DomainField in column mapping — the user assigns a column
2. **Matching:** during import, check if the bank's category matches an existing system category
   - Exact match → assign automatically
   - Partial/fuzzy → suggest a mapping
   - No match → suggest creating a new category
3. **Mapping profile:** `bank_category → system_category` saved in the import profile. Next import = zero questions.
4. **Seed:** during the first import, suggest creating a set of categories from the CSV

**Data from mBank (14 categories):** No category, Leasing, Materials and services - other, Fees and interest, Fuel, Taxes - other, Business Travel, Service and parts, Goods and materials, Insurance, Accounting and advisory services, Inflows - other, Cash withdrawal, Private purchases

**Bank mechanism:** The bank maps based on MCC (Merchant Category Code) from Visa/MC for card payments + recipient recognition for transfers.

**Decision log:** [ADR-001: Bank CSV Categories](../../adr/001-bank-csv-categories.md)

## Related Records

- [ADR-001 — Bank CSV categories](../../adr/001-bank-csv-categories.md)
- [Current categorization capability](../../product/capabilities/categorization.md)

## Source Provenance

- Original source: legacy product plan
- Pre-atomization path: `docs/product/product-concept.md`
- Original source lines: 160–184 and 337–367
- Frozen source commit: `582b3e8b147293c7b33dd0f839839aa81d7c8c20`
