# Devplan: Documentation Translation (PL → EN)

## Context

Codebase documentation is mixed Polish/English. For international readability and SaaS standards, active docs should be in English. Historical decisions archive stays in Polish (archival value, no active readers outside team).

---

## Bullet 1: Translate product docs

**Scope:** `docs/product/`

**Files:**
- `docs/product/README.md`
- `docs/product/vision.md`
- `docs/product/product-concept.md`
- `docs/product/user-and-data-flows.md`
- `docs/product/access-and-workspaces.md`
- `docs/product/original-categorization-concept.md`
- `docs/product/capabilities/csv-import.md`
- `docs/product/capabilities/categorization.md`
- `docs/product/capabilities/dashboard.md`
- `docs/product/capabilities/privacy-and-security.md`
- `docs/product/concepts/human-in-the-loop-anonymization.md`

**Rules:**
- Translate all prose to English
- Keep technical terms (Zustand, NestJS, PBKDF2) as-is
- Keep file names as-is (no rename)
- Polish examples (bank names: mBank, PKO) stay — they're domain examples, not language

**Gate:** All files readable in English. No Polish prose remains (except quoted examples).

---

## Bullet 2: Translate architecture docs

**Scope:** `docs/architecture/`

**Files:**
- `docs/architecture/README.md`
- `docs/architecture/local-first-e2ee.md`
- `docs/architecture/categorization-engine.md`
- `docs/architecture/original-system-assumptions.md`
- `docs/architecture/csv-engine/overview.md`
- `docs/architecture/csv-engine/parser.md`
- `docs/architecture/csv-engine/pii-anonymizer.md`

**Gate:** All prose in English.

---

## Bullet 3: Translate ADRs

**Scope:** `docs/adr/`

**Files:** `001` through `010` + `README.md`

**Rules:**
- ADR format (Status, Context, Decision, Consequences) in English
- Decision rationale translated fully
- Code snippets unchanged

**Gate:** All 11 files in English.

---

## Bullet 4: Translate developer guides

**Scope:** `docs/guides/`

**Files:**
- `docs/guides/backend/*.md` (all files)
- `docs/guides/frontend/*.md` (all files)

**Gate:** All guide prose in English.

---

## Bullet 5: Translate active plans + roadmap

**Scope:** `docs/plans/`

**Files:**
- `docs/plans/README.md`
- `docs/plans/roadmap.md`
- `docs/plans/active/*.md` (all active plans)

**Skip:** `docs/plans/completed/` (historical), `docs/plans/deferred/` (low priority)

**Gate:** Active planning docs in English.

---

## Bullet 6: Add English locale (i18n)

**Scope:** `client/src/shared/i18n/`

**Steps:**
1. Create `client/src/shared/i18n/locales/en.json` as translation of `pl.json`
2. Register in i18n config (if not already set up for multiple locales)
3. Set fallback language to `en`
4. Verify app renders correctly in EN locale

**Gate:** App can switch between PL and EN. All visible text has EN translation. No missing keys.

---

## Bullet 7: Update root README.md

**Scope:** `/README.md`

**Content:**
- Project name + one-line description
- Architecture overview (local-first, NestJS + React + Zustand)
- Quick start (prerequisites, install, run)
- Tech stack table
- Link to docs/

**Gate:** README gives new developer enough context to set up and understand the project.

---

## What stays in Polish (explicit skip list)

- `docs/history/decisions/` — historical archive, ~50 DEC files. Polish OK.
- `docs/plans/completed/` — historical completed plans. Polish OK.
- `docs/plans/deferred/post-mvp-backlog.md` — low priority.
- Code comments — already English per steering conventions.
- Commit messages — historical, cannot change.

---

## Estimated Effort

| Bullet | Files | Effort |
|--------|-------|--------|
| 1 | 11 | 2h |
| 2 | 7 | 1.5h |
| 3 | 11 | 1.5h |
| 4 | ~8 | 1h |
| 5 | ~6 | 1h |
| 6 | 1 + config | 1h |
| 7 | 1 | 30 min |
| **Total** | **~45** | **~8.5 hours** |
