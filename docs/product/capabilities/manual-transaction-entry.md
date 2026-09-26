# Manual Transaction Entry — What It Does

## User Problem

Tomek regularly buys a coffee from a small café that only accepts cash. He also lends money to friends and receives repayments. These transactions never appear on his bank statement — but they're real expenses and income that affect his budget.

**NoAsterisk lets you manually add individual transactions in seconds — no CSV, no bank file, no server required.**

---

## How It Works

### 1. Open the form

On the Transactions page, click the "Add" button in the toolbar. A modal appears with a form.

### 2. Fill in the details

| Field | Required | Description |
|-------|----------|-------------|
| Title | ✅ | What the transaction is (e.g. "Grocery shopping", "Refund from Jan") |
| Amount | ✅ | How much — always enter as a positive number |
| Date | ✅ | When it happened (defaults to today, cannot be in the future) |
| Type | ✅ | Expense or Income — determines the sign of the amount |
| Category | ❌ | Optional — select from existing categories |

### 3. Click "Add"

The transaction is immediately saved locally and appears in the transaction list. If you have categorization rules and didn't select a category — the system automatically matches a rule.

That's it. No network call, no upload, no wait.

---

## Key Behaviors

### Local-first — nothing leaves the browser

Manual transactions are stored as encrypted records in browser IndexedDB. No API call is made. This means:
- Works offline
- Instant feedback
- Privacy by default — no data transmitted

### Auto-categorization

If you leave the "Category" field empty, the system checks your categorization rules (from Admin → Rules):
- If a rule matches the transaction title → the category is assigned automatically
- If no rule matches → the transaction remains uncategorized (you can categorize it later)

If you explicitly select a category in the form, that selection is respected — auto-categorization is skipped.

### Amount sign convention

You always enter a positive amount in the form. The system applies the correct sign based on type:
- **Expense** → stored as negative (e.g. you enter "87.50" → stored as −87.50)
- **Income** → stored as positive (e.g. you enter "8500" → stored as +8500.00)

### Date validation

- Defaults to today
- Cannot be in the future (prevents accidental mistakes)
- Any valid past date is accepted

---

## Validation Rules

The form validates before saving. You see errors inline on the field that's wrong.

| Field | Rules |
|-------|-------|
| Title | Required, max 200 characters |
| Amount | Required, must be > 0, max 99 999 999.99, max 2 decimal places |
| Date | Required, must be a valid date, cannot be in the future |
| Type | Required — Expense or Income must be selected |
| Category | Optional — no validation |

---

## How Manual Transactions Differ from Imported

| Aspect | CSV Import | Manual Entry |
|--------|-----------|--------------|
| Source | Bank CSV file | User form input |
| Volume | Hundreds at once | One at a time |
| Deduplication | Content hash prevents re-import | Not applicable (each entry is unique) |
| Batch | Named by file, shown in history | Marked as "manual" (no batch management) |
| Privacy | Anonymization pipeline applies | No raw data to anonymize — user enters what they want |
| Auto-categorization | Applied during import | Applied on save |

Both types appear identically in the transaction list, dashboard, and analytics once saved.

---

## Integration with Other Features

| Feature | Interaction |
|---------|-------------|
| **Transaction list** | Manual entries appear alongside imported transactions, fully filterable and sortable |
| **Categorization rules** | Rules auto-apply on save (if no category was manually selected) |
| **Dashboard widgets** | Manual entries count toward KPIs, charts, and spending summaries |
| **Budgets** | Manual entries can be assigned to budgets like any other transaction |
| **Analytics** | Included in all analytical aggregations |

---

## Limits

| What | Limit |
|------|-------|
| Title length | 200 characters |
| Maximum amount | 99 999 999.99 |
| Decimal places | 2 |
| Date range | Any past date up to today |
| Currency | PLN (fixed) |

---

## Frequently Asked Questions

**Q: Can I edit a manually added transaction?**
Not from the form modal. Currently you can change the category from the transaction list (inline category picker). Full editing is planned for a future release.

**Q: Does the "Add" button appear on mobile?**
Yes — the toolbar adapts to screen width. The Add button is always visible on the Transactions page.

**Q: What happens if I add a transaction and then import a bank file with the same purchase?**
Both will exist side by side. Manual entries use a unique random identifier for their content hash, so they're never detected as duplicates of imported transactions. Delete the manual one if you prefer the imported version.

**Q: Can I add multiple transactions at once?**
Not through the manual form — that's what CSV import is for. The manual form adds one transaction per submission.

**Q: Are manual transactions synchronized?**
They are stored as encrypted records in local IndexedDB. A manual transaction can
be included in a user-initiated end-to-end encrypted vault snapshot; the backend
stores the opaque snapshot, not transaction plaintext. Synchronization is explicit,
not automatic background sync.

**Q: What currency are manual transactions in?**
PLN only (Polish złoty). Multi-currency support is planned post-MVP.

---

*Updated: 2026-09-25*
