# Categorization Rules Module — Developer Guide

> ⚠️ **WIP:** In-memory repositories (PostgreSQL planned). System seed rules, rule analytics, regex matcher, and AI categorization not yet implemented. CRUD + auto-categorize engine fully functional.

## Domain Context

Users create keyword-based rules to automatically assign categories to imported transactions. Instead of manually categorizing each "BIEDRONKA" transaction as "Groceries", the user creates one rule: `keyword="BIEDRONKA", matcherType=Contains, category=Groceries`. Every future import containing that keyword gets auto-categorized.

This is the "if-this-then-that" engine for transaction categorization — simple, deterministic, user-controlled.

---

## Architecture & Layers

```
src/categorization-rules/
├── domain/
│   ├── categorization-rule.entity.ts    # Rich model: invariants, immutable update, matches()
│   ├── matcher-type.enum.ts             # Contains | Exact
│   └── matchers.ts                      # Strategy pattern: ContainsMatcher, ExactMatcher
│
├── application/
│   ├── commands/
│   │   ├── create-rule.handler.ts       # Create with category validation
│   │   ├── update-rule.handler.ts       # Immutable update (new entity instance)
│   │   ├── delete-rule.handler.ts       # Workspace-scoped delete
│   │   └── auto-categorize.handler.ts   # Apply rules to uncategorized transactions
│   ├── queries/
│   │   └── get-rules.handler.ts         # Paginated listing
│   ├── ports/
│   │   └── categorization-rule.repository.ts
│   ├── dto/
│   │   └── categorization-rule-response.dto.ts
│   └── mappers/
│       ├── categorization-rule-response.mapper.ts
│       └── matcher-type.mapping.ts      # DTO string ↔ domain enum
│
├── infrastructure/
│   └── in-memory-categorization-rule.repository.ts
│
└── presentation/
    ├── categorization-rules.controller.ts  # CRUD + POST /apply
    └── rule.dto.ts                         # Zod schemas (strict, string literal enums)
```

### Dependencies

```
CategorizationRulesModule
  ├── imports CategoriesModule  → CATEGORY_REPOSITORY (validate categoryId exists)
  ├── imports TransactionsModule → TRANSACTION_REPOSITORY (find uncategorized, saveMany)
  └── exports AutoCategorizeHandler for explicit categorization workflows
  └── exports CATEGORIZATION_RULE_REPOSITORY for module consumers
```

---

## Public API

### Exported from module
- `AutoCategorizeHandler` — available to explicit categorization workflows
- `CATEGORIZATION_RULE_REPOSITORY` — DI token for module wiring

### HTTP Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST /categorization-rules` | JWT | Create rule |
| `GET /categorization-rules` | JWT | List rules (paginated) |
| `PUT /categorization-rules/:id` | JWT | Update rule |
| `DELETE /categorization-rules/:id` | JWT | Delete rule |
| `POST /categorization-rules/apply` | JWT | Run all rules on uncategorized transactions |

### Create/Update Body

```json
{
  "keyword": "BIEDRONKA",
  "categoryId": "uuid",
  "matcherType": "Contains",   // "Contains" | "Exact"
  "priority": 5                 // optional, default 0
}
```

---

## Extension Points

### Adding a new matcher type

1. Add to `domain/matcher-type.enum.ts`:
```typescript
export enum MatcherType {
  Contains = 'Contains',
  Exact = 'Exact',
  StartsWith = 'StartsWith',  // new
}
```

2. Create matcher class in `domain/matchers.ts`:
```typescript
export class StartsWithMatcher implements CategorizationMatcher {
  matches(description: string, keyword: string): boolean {
    return description.toLowerCase().startsWith(keyword.toLowerCase());
  }
}
```

3. Register in `MATCHERS` record:
```typescript
export const MATCHERS: Record<MatcherType, CategorizationMatcher> = {
  ...existing,
  [MatcherType.StartsWith]: new StartsWithMatcher(),
};
```

4. Add DTO mapping in `application/mappers/matcher-type.mapping.ts`

5. Update Zod schema in `presentation/rule.dto.ts` (add to `z.enum(...)`)

Entity's `matches()` method uses `MATCHERS[this.matcherType]` — zero entity changes.

### Adding regex matcher (planned post-MVP)

Same pattern. `RegexMatcher.matches()` would compile and test the keyword as a regex. Security: validate regex complexity before storing (ReDoS prevention).

---

## Boundaries & Non-Goals

**What this module DOES:**
- CRUD for keyword-based categorization rules
- Apply rules to uncategorized transactions (manual trigger + import hook)
- Strategy pattern matching (case-insensitive Contains / Exact)
- Priority-based ordering (higher priority rules checked first)
- Workspace-scoped isolation

**What this module does NOT do:**
- **AI/ML categorization** — planned separate module with `CategorizationPort` interface
- **Category CRUD** — separate `categories` module
- **Rule analytics** (match count, effectiveness) — planned for Phase 5
- **System/seed rules** — planned for Phase 5 with `isSystem` flag (DEC-related priority 0)
- **Bulk import/export rules** — planned for Phase 5
- **Workspace-scoped category validation** — enforced in CreateRuleHandler and UpdateRuleHandler (validates categoryId belongs to workspace)

---

## Trade-offs

### 1. Direct `matches()` method on entity (not separate service)
**Chose:** Entity has `matches(description)` that delegates to `MATCHERS` record.
**Trade-off:** Entity depends on `MATCHERS` constant (slight coupling). But matching IS the entity's core behavior — extracting it would create anemic entity.

### 2. Auto-categorize runs on ALL uncategorized transactions (not just new)
**Chose:** `findUncategorized(workspaceId)` returns all transactions without categories.
**Trade-off:** Repeated work — re-checks already-processed transactions. At MVP scale (1000s of transactions) this is fine. PostgreSQL migration will use indexed query + optional batchId filter (already available).

### 3. First-match semantics (highest priority wins)
**Chose:** Rules sorted by `priority DESC`, first match stops.
**Trade-off:** A transaction can only get ONE category from auto-categorize. If user wants multiple categories per transaction, they must do it manually. Rationale: multi-category auto-assign creates ambiguity (which rule takes precedence?).

### 4. Priority convention: 0 = system/default, 1-5 = user rules
**Chose:** Integer priority, higher wins. Convention (not enforced): system rules at 0, user rules at 1+.
**Trade-off:** Nothing stops user from using priority 0. When system/seed rules arrive
in Phase 5, user rules will always override because they are higher. This is
intentional: user intent takes precedence over system defaults.

---

## Testing Strategy

| Layer | File | What it tests |
|-------|------|---------------|
| Entity | `domain/categorization-rule.entity.spec.ts` | Invariants, update immutability, matches() |
| Matchers | `domain/matchers.spec.ts` | Contains + Exact cases |
| CRUD handlers | `application/rule-handlers.spec.ts` | Create/update/delete with mocks |
| Auto-categorize | `application/commands/auto-categorize.handler.spec.ts` | Priority ordering, batch scope |
| Controller | `presentation/categorization-rules.controller.spec.ts` | HTTP integration (supertest) |

```bash
cd server
npx jest --testPathPattern=categorization-rules --verbose
```

---

*Generated: 2026-07-02 | Source: `server/src/categorization-rules/`*
