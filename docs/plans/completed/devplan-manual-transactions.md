# Devplan: Manual Transaction Entry

## Context

Users need to add individual transactions without CSV import. Daily expenses (coffee, fuel, lunch) are entered manually in real-time. This is the primary data entry method between CSV imports.

**Architecture:** Local-first (ADR-003). Transaction is held in `useTransactionsStore` for the unlocked session and saved through the encrypted IndexedDB repository. No backend call. Auto-categorize applies after creation.

**Dependencies:** `packages/domain/src/transaction/` (Transaction entity), `features/transactions/store/` (existing store with `addTransactions`)

---

## Bullet 1: Model layer — types + validation

**Scope:** `client/src/features/transactions/model/`

**Create:**
```
features/transactions/model/
  create-transaction/
    types.ts              ← CreateTransactionFormValues, CreateTransactionErrors
    validate-transaction.ts   ← pure validation function
    validate-transaction.spec.ts
    index.ts
```

**Types:**
```typescript
interface CreateTransactionFormValues {
  readonly title: string;          // required, 1-200 chars
  readonly amount: string;         // required, string for input (parsed to number)
  readonly date: string;           // required, ISO date string
  readonly type: 'income' | 'expense';  // required
  readonly categoryId: string;     // optional (empty = uncategorized)
}

interface CreateTransactionErrors {
  readonly title?: string;
  readonly amount?: string;
  readonly date?: string;
  readonly type?: string;
}
```

**Validation rules:**
- title: required, trim, 1-200 chars
- amount: required, must parse to positive number, max 2 decimals
- date: required, valid ISO date, not in future
- type: required, must be 'income' or 'expense'

**Gate:** `vitest run` passes validation tests (happy + boundary + error cases).

---

## Bullet 2: Store action — addTransaction (single)

**Scope:** `client/src/features/transactions/store/useTransactionsStore/`

**Changes:**
1. Add `addTransaction(values: CreateTransactionFormValues): StoredTransaction` action to store
2. Inside action:
   - Generate UUID for id
   - Generate contentHash (SHA-256 of title+amount+date or simpler hash for manual entries)
   - Set `importBatchId: undefined` (manual entry, not from import)
   - Set `source: 'manual'` if field exists, otherwise leave importBatchId empty
   - Persist via the encrypted transaction repository
3. Return created transaction for UI feedback

**Gate:** Unit test: calling `addTransaction` increases store length by 1, persisted data is correct.

---

## Bullet 3: Store integration — auto-categorize after manual add

**Scope:** `client/src/features/transactions/store/` + `features/admin-rules/`

**Steps:**
1. After `addTransaction`, run auto-categorize on the single new transaction
2. Import auto-categorize logic from `features/admin-rules/model/auto-categorize/`
3. If rule matches → update transaction's categoryId in store

**Gate:** Test: create transaction with title matching rule → categoryId is assigned.

---

## Bullet 4: UI — TransactionFormModal component

**Scope:** `client/src/features/transactions/ui/TransactionFormModal/`

**Create:**
```
features/transactions/ui/
  TransactionFormModal/
    TransactionFormModal.tsx
    index.ts
  hooks/
    useTransactionForm/
      useTransactionForm.ts
      index.ts
```

**TransactionFormModal:**
- Title: "Add transaction" (i18n)
- Fields: Title (Input), Amount (Input type=number), Date (Input type=date, default=today), Type (radio: income/expense), Category (Select from STUB_CATEGORIES, optional)
- Actions: "Cancel" / "Add" buttons
- On submit: validate → addTransaction → close modal → show toast

**useTransactionForm hook:**
- Manages form state (values, errors, isSubmitting)
- Handles validation on submit
- Calls store action
- Returns { formValues, errors, handleChange, handleSubmit, isValid }

**Gate:** Component renders, form validates, submit calls store. `tsc --noEmit` clean.

---

## Bullet 5: Page integration — button + modal wiring

**Scope:** `client/src/pages/TransactionsPage/` or `features/transactions/ui/TransactionToolbar/`

**Steps:**
1. Add "Add transaction" button to TransactionToolbar (or StatusBar)
2. Button opens TransactionFormModal
3. After successful add: modal closes, transaction appears in grid, toast confirms
4. Add i18n keys for new strings

**Gate:** Full flow works: click button → fill form → submit → see new transaction in list.

---

## Bullet 6: Tests

**Scope:** Validation tests (bullet 1) + integration test (store + form)

**Coverage:**
- `validate-transaction.spec.ts` — happy path, each field error, boundary values
- `useTransactionForm.spec.ts` — hook behavior (optional if time allows)
- Store test: `addTransaction` + auto-categorize integration

**Gate:** `vitest run` — all new tests pass, no existing tests broken.

---

## Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Backend call? | No | Local-first (ADR-003). Consistent with budgets, rules. |
| accountId required? | No | Account not integrated on FE yet (ADR-005 deferred). |
| contentHash for manual? | Simplified | Use `crypto.randomUUID()` or simple hash — no dedup needed for manual entries |
| Form library? | No external lib | Plain useState via hook — consistent with other forms in app |
| Auto-categorize? | Yes | Same rules apply to manual and imported transactions |

---

## Estimated Effort

| Bullet | Effort |
|--------|--------|
| 1 | 30 min |
| 2 | 20 min |
| 3 | 20 min |
| 4 | 45 min |
| 5 | 20 min |
| 6 | 25 min |
| **Total** | **~2.5 hours** |
