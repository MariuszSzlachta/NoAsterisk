# Categorization Engine — Technical Reference

> ⚠️ **WIP:** Only 2 matcher types implemented (Contains, Exact). Regex, AI-based, and negative matchers are planned. Engine core is stable.

## Problem & Constraints

Users create keyword-matching rules to auto-categorize transactions. The engine must:
- Apply rules to uncategorized transactions **by priority** (highest first, first-match wins)
- Support two matcher strategies: `Contains` (substring) and `Exact` (full match)
- Run on every batch import (hook) and on-demand (manual trigger)
- Process workspace-scoped rules only (no cross-tenant data access)
- Be extensible for future matchers (Regex, StartsWith, AI-suggested)

**Performance budget:** 1000 rules × 2000 transactions = 2M comparisons in worst case. Acceptable for in-memory (String.includes is O(n) per call, sub-100ms total). PostgreSQL: indexed queries will pre-filter.

**See also:** [DEC-001](../history/decisions/DEC-001-categories-many-to-many.md) (categories many-to-many), [Phase 2 record](../plans/completed/phase-2-categorization-rules.md) (categorization rules implementation).

---

## Architecture Overview

```
src/categorization-rules/
├── domain/
│   ├── categorization-rule.entity.ts    # Entity with matches() behavior
│   ├── matcher-type.enum.ts             # Contains | Exact
│   └── matchers.ts                      # Strategy registry: MatcherType → CategorizationMatcher
│
└── application/commands/
    └── auto-categorize.handler.ts       # Orchestrator: load rules → find uncategorized → apply → save
```

---

## Core Interfaces

```typescript
// Strategy contract — each matcher implements this
interface CategorizationMatcher {
  matches(description: string, keyword: string): boolean;
}

// Entity delegates to matcher registry
class CategorizationRule {
  matches(description: string): boolean {
    return MATCHERS[this.matcherType].matches(description, this.keyword);
  }
}

// Registry: enum → strategy instance (static, singleton)
const MATCHERS: Record<MatcherType, CategorizationMatcher> = {
  [MatcherType.Contains]: new ContainsMatcher(),
  [MatcherType.Exact]: new ExactMatcher(),
};
```

**Design choice:** `MATCHERS` is a plain `Record` constant, not DI-injected. Matchers are pure (no dependencies, no state) — DI would add indirection without benefit. Entity accesses the registry directly via import.

---

## Algorithm: Auto-Categorize

### Input
- `workspaceId: string` — scope
- `batchId?: string` — optional: limit to a local import batch

### Step 1: Load Data (parallel)
```
[rules, allUncategorized] ← Promise.all([
  ruleRepo.findByWorkspaceId(workspaceId),
  transactionRepo.findUncategorized(workspaceId)
])
```

`findUncategorized` returns transactions where `categoryIds` is empty.

### Step 2: Filter by Batch (optional)
```
if batchId:
  transactions ← allUncategorized.filter(t => t.batchId === batchId)
else:
  transactions ← allUncategorized
```

When called from the local import flow: only categorizes the new batch (not re-processing old transactions).
When called manually: processes ALL uncategorized.

### Step 3: Sort Rules by Priority
```
sortedRules ← rules.sort((a, b) => b.priority - a.priority)
```
Higher priority = checked first. First match wins (no further rules evaluated for that transaction).

### Step 4: Match & Collect
```
toSave ← []
for each transaction in transactions:
  matchingRule ← sortedRules.find(r => r.matches(transaction.description))
  if matchingRule:
    toSave.push(transaction.assignCategory(matchingRule.categoryId))
```

**First-match semantics:** Once a rule matches, stop checking. A transaction gets exactly ONE category from auto-categorize. User can manually add more.

### Step 5: Bulk Save
```
if toSave.length > 0:
  transactionRepo.saveMany(toSave)
```

`saveMany` is a single batch operation (PostgreSQL: single query).

### Output
```typescript
{ categorized: number, total: number }
```

---

## Matcher Strategies

### ContainsMatcher

```typescript
matches(description: string, keyword: string): boolean {
  if (!keyword) return false;
  return description.toLowerCase().includes(keyword.toLowerCase());
}
```

**Behavior:** Case-insensitive substring search.
- `"ZAKUP W BIEDRONKA KRAKÓW"` + keyword `"biedronka"` → ✅ match
- `"BOLT 12.50 PLN"` + keyword `"bolt"` → ✅ match
- `"ALLEGRO"` + keyword `"allegro.pl"` → ❌ no match (keyword longer than source)

**Use case:** Most common — user enters merchant name fragment.

### ExactMatcher

```typescript
matches(description: string, keyword: string): boolean {
  if (!keyword) return false;
  return description.toLowerCase() === keyword.toLowerCase();
}
```

**Behavior:** Case-insensitive full-string equality.
- `"BIEDRONKA"` + keyword `"biedronka"` → ✅ match
- `"ZAKUP W BIEDRONKA"` + keyword `"biedronka"` → ❌ no match (not exact)

**Use case:** Exact transaction title matching (rare — most bank descriptions are verbose).

---

## Priority System

```
priority: number (integer, ≥ 0)
Higher number = higher priority = evaluated first
```

**Convention (not enforced at domain level):**

| Range | Usage | Example |
|-------|-------|---------|
| 0 | System/seed rules (planned Phase 5) | Default category mappings |
| 1–5 | User-created rules | "BIEDRONKA → Groceries" (priority 1) |
| 10+ | Explicit user overrides | "BIEDRONKA FUEL → Transport" (priority 10) |

**Conflict resolution example:**
```
Rule A: keyword="BIEDRONKA", category=Groceries, priority=1
Rule B: keyword="BIEDRONKA FUEL", category=Transport, priority=10

Transaction: "BIEDRONKA FUEL STATION"
  → Rule B checked first (priority 10 > 1)
  → Rule B matches (contains "BIEDRONKA FUEL")
  → Category = Transport ✅
```

Without priority, Rule A would match first (it also contains "BIEDRONKA") → wrong category.

---

## Integration: Import Hook

```
ImportTransactionsHandler.execute()
  ├── 1. Resolve/create batch
  ├── 2. PII validation → partition clean/rejected
  ├── 3. Save new transactions (sequential, dedup)
  ├── 4. Record saved rows on batch entity
  └── 5. autoCategorize.execute({ workspaceId, batchId })  ← HERE
```

Auto-categorize runs AFTER all transactions are saved. If it fails, the import is NOT rolled back — transactions exist but uncategorized. User can re-run manually via `POST /categorization-rules/apply`.

**Trade-off:** Synchronous coupling (DEC-related ARCH-EXCEPTION). Planned migration to event-driven: `TransactionsImported` domain event → `AutoCategorizeOnImport` event handler.

---

## Decision Log

### 1. First-match (not multi-match)
**Chose:** Stop at first matching rule per transaction.
**Over:** Apply all matching rules (accumulate categories).
**Because:** Multi-match creates ambiguity — if "BIEDRONKA" matches both "Groceries" and "Supermarkets", which one is "primary"? Users expect deterministic, predictable behavior. Priority + first-match is simple to reason about.
**Trade-off:** A transaction gets ONE category from auto-categorize. Manual multi-category assignment still works.

### 2. Entity.matches() delegates to strategy registry (not if/else)
**Chose:** `MATCHERS[this.matcherType].matches(description, this.keyword)` — registry lookup.
**Over:** `if (matcherType === 'Contains') { ... } else if (matcherType === 'Exact') { ... }`
**Because:** Adding a new matcher = add entry to `MATCHERS` record. Zero entity changes. OCP compliance.
**Trade-off:** One level of indirection (record lookup). Negligible performance cost.

### 3. Priority is not unique-constrained
**Chose:** Multiple rules can have same priority.
**Over:** Enforcing unique priority per workspace.
**Because:** Unique priority creates UX friction (user must decide ordering for every rule). Ties are broken by `Array.sort()` stability — in practice, insertion order. Acceptable — if user cares about ordering within same priority, they can adjust.

---

## Performance Characteristics

| Scenario | Complexity | Notes |
|----------|-----------|-------|
| Load rules | O(1) query | findByWorkspaceId — indexed by workspace |
| Load uncategorized | O(1) query | findUncategorized — filter by empty categoryIds |
| Sort rules | O(r log r) | r = rule count (typically <100) |
| Match (Contains) | O(d × k) per pair | d = description length, k = keyword length |
| Full run | O(r × t × d) | r rules × t transactions × d description length |
| Worst case | 100 rules × 2000 txns × 100 chars | ~20M char comparisons ≈ <50ms in-memory |

**Bottleneck at scale:** PostgreSQL query for `findUncategorized` across 100k+ transactions. Solution: add `batchId` filter (already implemented for import hook) + `is_categorized` boolean index.

---

## Edge Cases & Known Limitations

| Case | Handling |
|------|----------|
| Empty keyword in rule | Invariant guard prevents creation (DomainError) |
| Transaction matches no rule | Left uncategorized (returned in `total - categorized` count) |
| Rule's categoryId points to deleted category | Category still assigned — orphan cleanup planned (Phase 5) |
| Same keyword, different matchers (Contains vs Exact) | Both valid — priority determines which wins |
| Unicode/diacritics in keyword | `.toLowerCase()` handles — "BIEDRONKA" matches "biedronka" |
| Category assigned manually before auto-categorize | Not returned by `findUncategorized` — skipped |

### What's NOT supported yet
- Regex matchers (ReDoS risk needs mitigation)
- Negative matching ("NOT containing keyword")
- Multi-field matching (match on amount range + keyword)
- Rule deactivation (soft-disable without delete)
- Match analytics (how many times rule matched, last match date)

---

*Generated: 2026-07-02 | Source: `server/src/categorization-rules/`*
