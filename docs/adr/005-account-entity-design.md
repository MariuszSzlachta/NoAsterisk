# ADR-005: Account Entity — Design & Integration

**Date:** 2026-07-06
**Status:** Accepted
**Context:** BudgetFlow needs account tracking to support multi-account personal finance (bank accounts, cash, savings). All data is client-side only (local-first, E2EE — see ADR-003). Backend stores encrypted blobs, knows nothing about accounts.

---

## Problem

Current model (`Transaction`) has no `accountId`. This means:
1. Cannot track balances per account
2. Cannot link imports to a specific bank account
3. Cannot support manual cash transactions tied to a source
4. Import Profiles float without context — user doesn't know "this profile is FOR which account"
5. Balance from CSV is parsed but discarded at submit time

User's target view:

| Date | Title | Category | Amount | Account | Balance |
|------|-------|----------|--------|---------|---------|

---

## Decisions

### D1: Account entity lives in `entities/account/` (FSD)

Account is cross-feature — used by csv-import, manual transaction entry, dashboard, future transfers. Therefore it belongs in FSD `entities/` layer, not inside any single feature.

### D2: AccountType — hybrid (predefined suggestions + custom string)

**Model stores `type` as plain string.** UI provides predefined suggestions with icons/colors, plus free-form input.

Predefined suggestions:
| Type key | Label (EN) | Icon | Use case |
|----------|-----------|------|----------|
| `operational` | Operational | 💳 | Everyday expenses, bank account |
| `savings` | Savings | 🏦 | Deposits, savings accounts |
| `cash` | Cash | 💵 | Manual transactions, no CSV |
| `household` | Household | 🏠 | Shared household expenses |
| `business` | Business | 💼 | Business account |
| `investment` | Investment | 📈 | Stock market, funds |
| `credit` | Credit | 🔴 | Credit card, credit line |

User can type any custom value (e.g., "For vacation", "Family").

**Rationale:** Predefined give UX value (icons, quick selection). Free-form gives flexibility. No constraint in data — `type` is just a string.

### D3: ImportProfile links to Account via `accountId`

```
ImportProfile { ..., accountId: string }
```

- First import with new profile → user selects/creates account
- Subsequent imports → system matches CSV headers to existing profile → auto-suggests account
- User confirms → skips column mapping, goes straight to preview

### D4: Re-import auto-detection flow

```
Upload CSV → parse headers → match against saved profiles (headerSignatures)
  → MATCH FOUND:
      "Detected format: [profile name]. Account: [account name]. Continue?"
      → Yes: skip mapping, proceed with linked account
      → No: manual mapping
  → NO MATCH:
      Normal column mapping flow + account selection
```

### D5: Balance — always computed from transactions

**Balance = computed, never stored as separate field on Account.**

```
Account balance = initialBalance + sum(all transactions on account, ordered by date)
```

- CSV `balance` per row is stored on Transaction as informational snapshot (useful for display in import review, reconciliation)
- Source of truth for "current balance" is always the computed sum
- No "override balance" mechanism — corrections go through adjustment transactions

### D6: Balance correction via adjustment transaction

When computed balance doesn't match reality, user creates an **adjustment transaction**:

```
{
  title: "Balance correction"        // auto-generated, user can edit
  amount: +54.33                     // difference: real - computed
  type: 'adjustment'
  accountId: "..."
  date: today
  categoryId: undefined              // not income, not expense
}
```

**Where in UI:**
- **Account page** — always available "Correct balance" button
- **Post-import hint** — soft prompt (not a wizard step):
  ```
  ✅ Imported 245 transactions to account "mBank Main"
  Balance after import: 12 345,67 PLN
  [Correct balance]  ← optional, not blocking
  ```

**Rationale:**
- Correction is not an import concern — it's an account concern
- Single mechanism for all cases (import mismatch, forgotten cash expense, bank fees)
- No special "override" state on Account — just transactions all the way down

### D7: TransactionType extended

```typescript
type TransactionType = 'income' | 'expense' | 'adjustment';
```

Adjustment transactions:
- Don't count toward spending/income analytics
- Show in transaction list with distinct styling
- Affect balance computation (that's their purpose)

### D8: Account persistence — IndexedDB (client-side only)

Per ADR-003: all data is local-first. Account lives in IndexedDB alongside transactions. Backend never sees account data (encrypted blob at most).

---

## Data Model

### Account

```typescript
interface Account {
  readonly id: string;
  readonly name: string;              // "mBank Main", "Cash"
  readonly type: string;              // "operational" | "savings" | "cash" | custom
  readonly currency: string;          // "PLN", "EUR"
  readonly initialBalance: number;    // starting balance (default: 0)
  readonly createdAt: string;         // ISO 8601
  readonly isArchived: boolean;       // soft-delete
}
```

### Transaction (extended)

```typescript
interface Transaction {
  readonly id: string;
  readonly accountId: string;         // ← NEW: links to Account
  readonly date: string;
  readonly title: string;             // anonymized
  readonly amount: number;            // signed
  readonly currency: string;
  readonly balance?: number;          // ← NEW: snapshot from CSV (informational)
  readonly type: TransactionType;     // income | expense | adjustment
  readonly categoryId?: string;
  readonly contentHash: string;
  readonly importBatchId?: string;
}

type TransactionType = 'income' | 'expense' | 'adjustment';
```

### ImportProfile (extended)

```typescript
interface ImportProfile {
  readonly id: string;
  readonly name: string;
  readonly accountId: string;         // ← NEW: linked account
  readonly mapping: ColumnMapping;
  readonly headerSignatures: readonly string[][];
  readonly bankProfileId?: string;
  readonly dateFormat: DateFormat;
  readonly amountLocale: AmountLocale;
}
```

---

## FSD Structure

```
entities/
  account/
    model/
      types.ts                        ← Account, AccountType suggestions, etc.
      compute-balance.ts              ← computeBalance(transactions[], initialBalance)
      compute-balance.spec.ts
    store/
      useAccountStore/
        useAccountStore.ts            ← Zustand: accounts[], CRUD actions
        index.ts
    ui/
      AccountSelector/                ← Dropdown (used in import, manual entry)
        AccountSelector.tsx
        index.ts
      AccountBadge/                   ← Chip: icon + name + type color
        AccountBadge.tsx
        index.ts
      AccountTypeSelect/              ← Hybrid: predefined + custom input
        AccountTypeSelect.tsx
        index.ts
    index.ts                          ← Public API
```

---

## Integration Points

### 1. CSV Import (features/csv-import)

**Step 1 (Column Mapping) changes:**
- Auto-detection matches headers → finds profile → profile has `accountId` → pre-select
- If no profile: show AccountSelector in mapping step
- On "Save profile": include selected `accountId`

**Step 4 (Submit) changes:**
- `ImportChunkPayload` includes `accountId`
- `TransactionRow.balance` is preserved (not discarded)
- `contentHash` includes `accountId` in hash input (dedup is per-account)

### 2. Manual Transaction Entry (future feature)

```
Form: Amount* | Description* | Date* | Account* (AccountSelector) | Category
```

Account is required field — every transaction belongs to exactly one account.

### 3. Dashboard / Account Page

- Account list with current balance per account
- Transaction table filtered by account
- "Correct balance" button → creates adjustment transaction

### 4. Content Hash (dedup)

Current: `hash(date|amount|title)`
New: `hash(accountId|date|amount|title)`

Rationale: same transaction imported to different accounts (shouldn't happen but defensive) must not be deduped across accounts.

---

## Migration (existing data)

If user already has imported transactions without `accountId`:
- On first load after update: prompt "Assign account to existing transactions"
- Create default account ("Main account", type: operational)
- Assign all orphan transactions to it
- Non-blocking — app works without migration, just shows "No account" badge

---

## What This Does NOT Cover

- Transfers between accounts (future: transaction pair with type `transfer`)
- Multi-currency conversion
- Shared accounts (household members) — depends on E2EE Phase 4 sync
- Backend changes (none needed — backend stores encrypted blobs per ADR-003)
- Account-level budget limits (separate feature, uses accountId as filter)

---

## Risks

| Risk | Mitigation |
|------|-----------|
| User creates too many accounts → confusion | UI: show most-used accounts first, archive old ones |
| Balance drift (user never corrects) | Soft nudge: "Balance not verified in 30 days" |
| ImportProfile auto-match false positive (similar headers, different accounts) | Always show confirmation: "Account: X. Is that correct?" |
| Adjustment abuse (user corrects instead of entering real transactions) | Not our problem — it's their data, their choice |
