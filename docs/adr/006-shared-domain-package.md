# ADR-006: Shared Domain Package — DDD in Monorepo

**Date:** 2026-07-06
**Status:** Accepted
**Supersedes:** Previous rule "no DDD on frontend"
**Prerequisite for:** All new features (Account, manual transactions, budgets)
**Related:** ADR-003 (E2EE local-first), ADR-005 (Account entity)

> **TODO — architecture boundary:** Reconcile this ADR's shared DDD package with [legacy DEC-057](../history/decisions/DEC-057-simplified-frontend-architecture-layered-fsd-no-ddd-hexagonal.md) and [DEC-025](../history/decisions/DEC-025-frontend-architecture-feature-sliced-design-layered-internals.md). See the [integrity record](../history/decisions/integrity-issues.md#dec-025-dec-057-and-adr-006-boundary). The intended boundary for feature-local code is not stated explicitly.

---

## Problem

### Historical context

The project started as a classic SaaS — backend owns the domain (DDD with classes), frontend is a thin client (plain interfaces + pure functions). The "no DDD on frontend" rule made sense in that model.

### What changed

1. **E2EE constraint (ADR-003):** Backend NEVER sees financial data in plaintext. Data lives in the client.
2. **Domain is complex:** Account, Transaction, ImportProfile, CategorizationRule, Budget, SubBudget — with relationships, invariants, lifecycle.
3. **Future migration:** When the app grows (shared budgets, multi-user), the domain must return to the backend. Domain code must be portable, not rewritable.

### Current situation

- Backend has DDD with classes (Transaction, ImportBatch, CategorizationRule, Money)
- Frontend has "plain interfaces + pure functions" (csv-import model/)
- Resulting gap: domain logic is duplicated, inconsistent, or missing

### Why "plain functions" are not enough

- **No invariant enforcement** — nothing prevents creating an Account without a name
- **Bag of functions** — 50+ loose functions without responsibility boundaries
- **Not portable** — functional code on FE ≠ class-based code on BE, so migration = rewrite
- **DDD without classes is not DDD** — it's functional programming with a nice label

---

## Decision

### We create `packages/domain/` — a shared TypeScript package with DDD

Pure TypeScript. Zero dependencies on React, NestJS, Zustand, IndexedDB, or any framework. Classes with invariants, Value Objects, factory methods. Identical pattern to the current backend (`server/src/*/domain/`).

### Package is imported by both workspaces

```
packages/domain/     ← pure TS, DDD classes
   ↑           ↑
   |           |
client/       server/
(IndexedDB)   (encrypted blob relay)
```

- **Now:** Client imports domain, uses it with IndexedDB persistence
- **Future:** Server imports the same domain, adds PostgreSQL persistence + ABAC
- **Migration cost:** moving handlers + repos, zero changes in domain

---

## Architecture

### Monorepo structure

```
budget/
  package.json              ← workspaces: ["client", "server", "packages/*"]
  packages/
    domain/
      package.json          ← name: "@budget/domain", zero deps
      tsconfig.json
      src/
        shared/
          domain-error.ts
          identifier.ts     ← UUID generation helper
        account/
          account.entity.ts
          account.entity.spec.ts
          account-type.ts
        transaction/
          transaction.entity.ts
          transaction.entity.spec.ts
          transaction-type.enum.ts
          money.vo.ts
          money.vo.spec.ts
          content-hash.ts
        import-profile/
          import-profile.entity.ts
        categorization-rule/
          categorization-rule.entity.ts
          matchers.ts
        category/
          category.entity.ts
        budget/
          budget.entity.ts
          sub-budget.entity.ts
        index.ts            ← public API barrel
  client/
    src/
      features/             ← UI + ViewModels + hooks
      shared/               ← adapters, ui components
      app/
  server/
    src/
      modules/              ← handlers, repos, controllers (thin — delegates to domain)
```

### Dependency rule

```
packages/domain → NOTHING (zero imports from client or server)
client → packages/domain (import entities for business logic)
server → packages/domain (import entities for handlers)
```

### Entity pattern (same as current BE)

```typescript
// packages/domain/src/account/account.entity.ts
import { DomainError } from '../shared/domain-error';

export class Account {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly type: string,
    public readonly currency: string,
    public readonly initialBalance: number,
    public readonly createdAt: Date,
    public readonly isArchived: boolean,
  ) {
    if (!id) throw new DomainError('Account ID cannot be empty');
    if (!name.trim()) throw new DomainError('Account name cannot be empty');
    if (name.length > 100) throw new DomainError('Account name too long');
    if (currency.length !== 3) throw new DomainError('Currency must be 3-letter code');
  }

  static create(props: {
    name: string;
    type: string;
    currency: string;
    initialBalance?: number;
  }): Account {
    return new Account(
      crypto.randomUUID(),
      props.name.trim(),
      props.type,
      props.currency.toUpperCase(),
      props.initialBalance ?? 0,
      new Date(),
      false,
    );
  }

  rename(name: string): Account {
    return new Account(this.id, name.trim(), this.type, this.currency, this.initialBalance, this.createdAt, this.isArchived);
  }

  archive(): Account {
    return new Account(this.id, this.name, this.type, this.currency, this.initialBalance, this.createdAt, true);
  }

  unarchive(): Account {
    return new Account(this.id, this.name, this.type, this.currency, this.initialBalance, this.createdAt, false);
  }
}
```

### Persistence boundary — Record ↔ Domain

Store (Zustand/IndexedDB) operates on **plain records** (serializable). Domain classes exist at the moment of business operation.

```typescript
// client/src/features/accounts/model/account-mapper.ts
import { Account } from '@budget/domain';

export interface AccountRecord {
  readonly id: string;
  readonly name: string;
  readonly type: string;
  readonly currency: string;
  readonly initialBalance: number;
  readonly createdAt: string;   // ISO string (serializable)
  readonly isArchived: boolean;
}

export const toDomain = (record: AccountRecord): Account =>
  new Account(
    record.id,
    record.name,
    record.type,
    record.currency,
    record.initialBalance,
    new Date(record.createdAt),
    record.isArchived,
  );

export const toRecord = (entity: Account): AccountRecord => ({
  id: entity.id,
  name: entity.name,
  type: entity.type,
  currency: entity.currency,
  initialBalance: entity.initialBalance,
  createdAt: entity.createdAt.toISOString(),
  isArchived: entity.isArchived,
});
```

### Zustand + immer compatibility

Store holds `AccountRecord[]` (plain objects) — immer is happy. Business logic:

```typescript
// client/src/features/accounts/store/useAccountStore.ts
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { Account } from '@budget/domain';
import { toDomain, toRecord, type AccountRecord } from '../model/account-mapper';

interface AccountStoreState {
  readonly accounts: ReadonlyArray<AccountRecord>;
  readonly createAccount: (props: { name: string; type: string; currency: string }) => void;
  readonly archiveAccount: (id: string) => void;
}

export const useAccountStore = create<AccountStoreState>()(
  immer((set) => ({
    accounts: [],

    createAccount: (props) => set((state) => {
      // Domain creates (validates invariants)
      const entity = Account.create(props);
      // Store holds record
      (state.accounts as AccountRecord[]).push(toRecord(entity));
    }),

    archiveAccount: (id) => set((state) => {
      const records = state.accounts as AccountRecord[];
      const idx = records.findIndex((a) => a.id === id);
      if (idx === -1) return;
      // Domain operation (validates state transition)
      const entity = toDomain(records[idx]);
      const archived = entity.archive();
      // Store updated record
      records[idx] = toRecord(archived);
    }),
  })),
);
```

**Pattern:** Store action = toDomain() → domain operation → toRecord() → store update.

---

## Rules

### packages/domain/ rules:

1. **Zero deps** — no React, no NestJS, no Zustand, no Dexie, no Node-only APIs
2. **Pure TypeScript** — compiles to ES modules, works in browser AND node
3. **Classes with invariants** — constructor ALWAYS validates. No invalid instance can exist.
4. **Immutable updates** — entity methods return new instance (same pattern as current BE)
5. **Factory `create()`** — for NEW entities (generates ID, sets defaults)
6. **Constructor** — for reconstitution (from DB/store, all fields provided)
7. **No `async`** — domain is synchronous. IO is not domain's job.
8. **Tests live next to code** — `*.spec.ts` in same directory

### Client rules:

1. **Features remain flat** — model/ (ViewModels + mappers), api/, store/, ui/
2. **model/ in features** — holds Record types, domain↔record mappers, ViewModels for UI
3. **Store holds Records** — never domain class instances (serialization + immer)
4. **Domain operations** — always: toDomain() → operation → toRecord() → store update
5. **No entities/ layer in FSD** — domain is in packages/domain/, not in client src

### Server rules (unchanged):

1. Server imports from `@budget/domain` — same entities
2. Server adds: repository implementations, handlers, controllers, ABAC
3. Infrastructure mappers: domain ↔ DB row

---

## Migration Plan (existing code)

### What moves to packages/domain/:

| Current location | Target |
|---|---|
| `server/src/transactions/domain/transaction.entity.ts` | `packages/domain/src/transaction/` |
| `server/src/transactions/domain/value-objects/money.ts` | `packages/domain/src/transaction/money.vo.ts` |
| `server/src/imports/domain/import-batch.entity.ts` | `packages/domain/src/import-batch/` |
| `server/src/categorization-rules/domain/` | `packages/domain/src/categorization-rule/` |
| `server/src/categories/domain/` | `packages/domain/src/category/` |
| `server/src/shared/domain/domain.error.ts` | `packages/domain/src/shared/domain-error.ts` |

### What stays:

| Location | Why |
|---|---|
| `client/features/csv-import/model/anonymizer/` | FE-only concern (PII detection runs in browser, not domain logic) |
| `client/features/csv-import/model/parser/` | FE-only (CSV parsing is infrastructure, not domain) |
| `server/src/*/application/` | Server handlers (orchestration) |
| `server/src/*/infrastructure/` | Server repos (Postgres) |
| `server/src/*/presentation/` | Server controllers (HTTP) |

### New in packages/domain/ (not in existing codebase):

- `account/account.entity.ts` — new entity (ADR-005)
- `transaction/transaction-type.enum.ts` — extended with `Adjustment`
- `import-profile/import-profile.entity.ts` — with accountId

---

## TypeScript/Build Setup

### packages/domain/package.json

```json
{
  "name": "@budget/domain",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "test": "vitest",
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "typescript": "^5.8.0",
    "vitest": "^3.2.0"
  }
}
```

### packages/domain/tsconfig.json

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noUnusedLocals": true,
    "noImplicitOverride": true,
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "declaration": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "composite": true
  },
  "include": ["src/**/*.ts"],
  "exclude": ["**/*.spec.ts"]
}
```

### Root package.json change

```json
{
  "workspaces": ["client", "server", "packages/*"]
}
```

### Client imports

```typescript
// In client code:
import { Account, Transaction, Money, DomainError } from '@budget/domain';
```

Vite resolves workspace packages natively (no build step needed — imports source directly via `"main": "./src/index.ts"`).

---

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Domain classes not tree-shakeable | At our scale (~6 entities) irrelevant. If needed later: split into sub-exports. |
| `crypto.randomUUID()` not available in all envs | Available in all target browsers (baseline 2022+) and Node 19+. Polyfill as fallback. |
| Circular imports between entities | Entities reference each other by ID (string), never by instance. No circular deps. |
| Test setup duplication (vitest in domain, vitest in client) | Same runner, shared config extends. No duplication. |
| Immer + domain classes confusion | Clear rule: store = Records, operations = domain classes. Mapper on boundary. |

---

## What This Enables

1. **Account entity** — create once in domain, use everywhere
2. **TransactionType: adjustment** — domain enforces no-category invariant
3. **Balance computation** — domain function, not scattered across features
4. **Content hash with accountId** — domain responsibility (dedup logic)
5. **Future BE migration** — copy domain, add repos + handlers. Done.
6. **Import Profile ↔ Account link** — domain validates the relationship
7. **Shared budgets** — same domain, different persistence + access layer
