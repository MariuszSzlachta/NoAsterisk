# Original User and Data Flows

> **Source status:** Original import and profile workflow assumptions. Use the focused CSV capability and current developer guides for current behavior.

## Data Sources

Three bank accounts:
- business account
- personal account
- wife's account

Each bank exports CSV in a different format (different columns, separators, date encodings). The application supports multiple formats through configurable import profiles.

---

## Data Flow — CSV Import

```
CSV from bank (local on user's machine)
   ↓
Upload to browser — parsing by papaparse (in-memory, nothing goes to server)
   ↓
Import profile (auto-detect or user selects bank) — column mapping + anonymization rules
   ↓
Layered anonymization (in-browser):
   1. Automatic: regex strip IBAN, card numbers, PESEL, email, phone
   2. Per profile: hashing counterparties, removing columns (balance, account number)
   3. User review: manual editing of descriptions in DataGrid
   ↓
DataGrid with editing + smart batch edit:
   - user edits description → system proposes change for similar transactions (side panel)
   - user assigns categories (manually / batch)
   - option: "Save as a rule for the future?" → creates categorization rule
   ↓
Content hash generated BEFORE anonymization (on the frontend):
   SHA-256(transactionDate + amount + rawTitle + SHA-256(accountNumber))
   → hash is sent together with anonymized data as dedup key
   ↓
Chunking: frontend splits into batches of ~100-200 records
   → each chunk = separate POST /transactions/import
   → all chunks share a common batchId (UUID, generated on the frontend)
   ↓
Backend: validation (Zod + anti-PII guardrails) → save → dedup by content hash
```

**Key principles:**
- Raw CSV never reaches the server or AI
- Content hash is irreversible — storing it on the server does not violate the security principle
- Server cannot recalculate the hash (it has no raw data) — trusts the client (acceptable trade-off: user would only sabotage their own deduplication)

### Smart batch edit (UX pattern)

```
User edits a field in DataGrid (e.g., transaction description)
   ↓
System searches the current import for transactions with the same original description/counterparty
   ↓
Side panel: "Found N similar. Change them too?"
   - preview list of matched transactions
   - [Yes, change all] / [No, only this one]
   ↓
Optionally: "Save as a categorization rule?"
   - Yes → POST rule: keyword → category (after import approval)
```

The entire smart edit flow happens in-memory on the frontend — backend receives ready, clean data.

---

## Import Profiles

Column mapping per bank stored in the database (not in localStorage), because the application will be multi-user and profiles should be accessible from any device.

```
import_profiles
- id
- workspace_id
- bank_name
- column_mapping (jsonb)         ← which CSV column = date/amount/title/counterparty
- sensitive_columns (jsonb)      ← which columns to remove during anonymization
- anonymization_rules (jsonb)    ← per-field: hash | remove | keep | regex_strip
- parser_config (jsonb)          ← delimiter, encoding, date_format, decimal_separator
- created_at
```

On the next import from the same bank, the system recognizes CSV headers and suggests the saved profile — zero manual configuration each time.

### Differences between banks (real examples)

| | Bank A (ING-style) | mBank |
|---|---|---|
| Format | CSV with headers, clean columns | Text/CSV with operations embedded in description |
| Counterparty | Separate field (hashable) | Embedded in description (e.g., "MD SERWIS M. GROCHULSK") |
| Source account | Missing / separate column | In description ("6011 ... 4820") |
| Category | Provided by bank | Provided by bank |
| Operation ID | Unique, hashable | May not exist |
| Sensitive data | Minimal — mainly ref number | Surnames, addresses in descriptions |

**Conclusion:** an import profile is not just "column mapping" — it's a full parser definition + anonymization rules per field.

---

## Current focused references

- [CSV import capability](./capabilities/csv-import.md)
- [CSV import developer guide](../guides/frontend/csv-import-feature.md)


## Source provenance

- Original source: legacy product plan
- Pre-atomization path: `docs/product/product-concept.md`
- Original source lines: 28–125
- Frozen source commit: `582b3e8b147293c7b33dd0f839839aa81d7c8c20`
