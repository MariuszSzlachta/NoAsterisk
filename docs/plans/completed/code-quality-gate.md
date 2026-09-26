# Code Quality Gate

Status: **SUPERSEDED AND COMPLETED**

> **Superseded for MVP execution:** [Session 01 — Restore the frontend baseline](./mvp-release/01-frontend-baseline.md) records the historical baseline work. This file is retained as source-era planning detail and must not be executed independently without reconciling it against the current tree.

## Context

Pre-deployment quality check. All builds and tests must be green, known tech debt resolved or explicitly deferred.

**Prerequisites:** Security audit ✅ (completed 2026-08-22)

---

## Bullet 1: Pin all dependencies (remove ^ and ~)

**Scope:** `server/package.json`, `client/package.json`, `packages/domain/package.json`

**Steps:**

1. Run `npm pkg fix` or manually replace `^` and `~` with exact versions in all three package.json files
2. For server: `@nestjs/platform-express` was installed with `^11.2.1` — pin to `11.2.1`
3. Verify `package-lock.json` is consistent: `npm ci` in each package

**Gate:** Zero `^` or `~` in dependencies/devDependencies (regex-based pattern matches in jest config are OK).

---

## Bullet 2: Resolve STUB_CATEGORIES duplication

**Scope:** Per [Admin Rules Technical-Debt Closure](./admin-rules-tech-debt.md), Problem 1.

**Steps:**

1. Create `client/src/entities/category/` with `types.ts`, `constants.ts`, `index.ts`
2. Move `CategoryInfo` interface to `entities/category/types.ts`
3. Move `STUB_CATEGORIES` + `CATEGORY_SELECT_OPTIONS` to `entities/category/constants.ts`
4. Update imports in `features/transactions/` and `features/admin-rules/`
5. Delete old duplicated files (`features/admin-rules/ui/constants/category-options/`)
6. Remove `categoryOptions` from `useRulesTable` return type

**Gate:** `tsc --noEmit` clean. No duplicate CategoryInfo/CategoryOption types exist.

---

## Bullet 3: Add `id` prop to Select component (accessibility)

**Scope:** Per [Admin Rules Technical-Debt Closure](./admin-rules-tech-debt.md), Problem 2.

**Steps:**

1. Add `id?: string` and `aria-labelledby?: string` props to `shared/ui/Select/Select.tsx`
2. Pass `id` and `aria-labelledby` to the trigger `<button>`
3. Update `RuleFormModal` to use `<label htmlFor="...">` + `<Select id="...">`
4. Verify existing Select tests don't break

**Gate:** `tsc --noEmit` clean. Accessibility: label is programmatically associated with Select trigger.

---

## Bullet 4: Catalog and decide on TODO comments

**Scope:** All `// TODO` in `client/src/` and `server/src/`

**Known TODOs (non-test files):**

- Sidebar badge dynamic from server state — **DEFER** (cosmetic)
- RecurringExpenses detection — **DEFER** (post-MVP, marked in plan)
- Save profile dialog — **DEFER** (E.16 bank profiles deferred)
- handleUseProfile bank profile mapping — **DEFER** (E.16)
- AnalyticsChart bar/area switch — **DEFER** (post-MVP)
- Grid server-side pagination — **DEFER** (post-MVP)
- AG Grid Enterprise features — **DEFER** (post-MVP)
- STUB_CATEGORIES replace with real data — **RESOLVES IN BULLET 2** (stub stays until categories API)

**Steps:**

1. Add `— post-MVP` suffix to deferred TODOs so intent is explicit
2. Remove any TODOs that are already resolved
3. Do NOT add new functionality — only clarify intent

**Gate:** Each TODO either fixed, removed, or marked with explicit `— post-MVP` / `— deferred`

---

## Bullet 5: Full build + test green check

**Steps:**

1. `cd server && npx tsc --noEmit` — zero errors
2. `cd client && npx tsc --noEmit` — zero errors
3. `cd packages/domain && npx tsc --noEmit` — zero errors
4. `cd server && JWT_SECRET=ci-test npx jest --passWithNoTests` — all pass
5. `cd client && npx vitest run` — all pass
6. `cd packages/domain && npx vitest run` — all pass
7. Lint: `cd client && npx oxlint .` — zero errors (or eslint equivalent)

**Gate:** ALL commands exit 0.

---

## Estimated Effort

| Bullet    | Effort               |
| --------- | -------------------- |
| 1         | 10 min               |
| 2         | 20 min               |
| 3         | 10 min               |
| 4         | 10 min               |
| 5         | 5 min (verification) |
| **Total** | **~55 min**          |
