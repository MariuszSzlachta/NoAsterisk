# Next Sprint — Priority Plan

Historical priority plan recorded on 2026-08-20.

---

## Tier 1 — Critical (app is broken/unsafe without these)

| # | Task | Effort | Rationale |
|---|---|---|---|
| ~~1.1~~ | ~~Fix workspace isolation: Categories GET/PUT/DELETE~~ | ✅ Done | Fixed 2026-08-20 |
| ~~1.2~~ | ~~Fix workspace isolation: Transactions GET/:id, PUT/:id, DELETE/:id~~ | ✅ Done | Fixed 2026-08-20 |
| 1.3 | Connect Dashboard to real data from Zustand stores | ~1 day | 🟡 All 7 widget hooks return hardcoded mock. Rewrite to read from useTransactionsStore + useBudgetsStore. |

**Why Tier 1:** Security holes are a showstopper for any deployment. Dashboard without real data means user imports CSV, navigates to dashboard, and sees someone else's fictional numbers.

---

## Tier 2 — High priority (closes MVP loop)

| # | Task | Effort | Rationale |
|---|---|---|---|
| 2.1 | Connect Analytics to real data | ~1 day | Same problem as dashboard. 3 hooks to rewrite (read from transactions + budgets stores). |
| 2.2 | Login page (real component) | ~0.5 day | Placeholder `<div>Login</div>` — no new user can log in. RequireAuth exists, backend auth works. |
| ~~2.3~~ | ~~ABAC enforcement — activate Permission checking~~ | ✅ Done | Option B: ARCH-EXCEPTION + inactive PermissionGuard. Completed 2026-08-20. |

**Why Tier 2:** Closes the MVP loop: user can log in → import → browse transactions → dashboard/analytics show THEIR data → budgets work.

---

## Tier 3 — Important but not blocking

| # | Task | Effort | Rationale |
|---|---|---|---|
| 3.1 | IndexedDB persistence + encrypted backup (ADR-003 Phase 2) | ~2–3 weeks | Local-first persistence via Dexie.js. Backend becomes encrypted relay (user PII only + opaque blobs). Frontend already local-first with Zustand/localStorage — this upgrades to proper IndexedDB with E2EE backup capability. |
| 3.2 | Admin Rules page (categorization rules CRUD UI) | ~1 day | Placeholder → real page. Backend CRUD exists, only FE UI needed. Rules will migrate to IndexedDB with 3.1. |
| 3.3 | Formally close Phase 4.4 in docs | ~15 min | ✅ Done — moved to completed/. |

---

## Tier 4 — Nice-to-have / Deferred

| # | Task | Effort | Rationale |
|---|---|---|---|
| 4.1 | Bank profiles (mBank, PKO, ING, Santander, Revolut) | ~2 days | Eases import but generic mapper works |
| 4.2 | RegexMatcher + "Starts with" matcher | ~0.5 day | More matching flexibility |
| 4.3 | Modal/Toast in design system | ~0.5 day | Tech debt — budgets uses custom overlay |
| 4.4 | Infinite scroll instead of pagination | ~1 day | DEC-046-b, UX polish |
| 4.5 | Provider-neutral AI-assisted categorization | ~3 days | Post-MVP |
| 4.6 | Refresh token in httpOnly cookie | ~0.5 day | Security hardening |

---

## Proposed Execution Sequence

```
Week 1:
  [1.1] Fix categories workspace isolation          (2h)
  [1.2] Fix transactions workspace isolation        (2h)
  [1.3] Dashboard → real data from stores           (1d)
  [2.1] Analytics → real data from stores           (1d)
  [2.2] Login page component                        (0.5d)

Week 2:
  [2.3] ABAC decision (enforce or ARCH-EXCEPTION)   (0.5d)
  [3.2] Admin Rules page                            (1d)
  [3.1] PostgreSQL migration (start)                (3-5d, may span into next sprint)
  [3.3] Phase 4.4 docs closure                      (15min)
```

---

## Success Criteria (end of sprint)

After Week 1:
- Zero cross-tenant data leaks in categories and transactions
- Dashboard and Analytics display real user data (from imported transactions + created budgets)
- User can log in via a real login form

After Week 2:
- ABAC either enforced or explicitly documented as deferred
- Admin Rules page functional (CRUD categorization rules from UI)
- PostgreSQL migration started (at minimum: schema + one module migrated)
- All plan documents reflect actual implementation state

---

## Dependencies & Risks

| Risk | Mitigation |
|---|---|
| Dashboard hooks rewrite may require new transformer functions | Model layer already has transformers; likely extend, not rewrite from scratch |
| IndexedDB persistence touches all features (transactions, budgets, rules, categories) | Zustand persist middleware → Dexie.js swap is incremental per-store. ADR-003 Phase 2 scope. |
| ABAC enforcement may break existing flows | Spike first: verify what Permission records exist after registration, what actions are assigned |
| Login page needs token storage + redirect logic | shared/api/auth-tokens.ts already exists; RequireAuth checks token presence |

---

## Persistence Strategy (ADR-003 alignment)

This sprint does NOT plan PostgreSQL migration for financial data. Per ADR-003:
- **Financial data** (transactions, categories, budgets, rules) → stays client-side (currently localStorage/Zustand, target: IndexedDB + E2EE backup)
- **Backend retains**: auth (user email, password hash, JWT) + encrypted blob storage API
- **Backend does NOT store**: plaintext financial data of any kind (zero knowledge)

Tier 3.1 implements ADR-003 Phase 2: IndexedDB via Dexie.js as local persistence layer.

---

## Reference

- Security issues: Categories (AP-5 violation), Transactions (AP-5 violation), ABAC dead code
- Quality gate: DEC-049 — feature complete before moving forward
