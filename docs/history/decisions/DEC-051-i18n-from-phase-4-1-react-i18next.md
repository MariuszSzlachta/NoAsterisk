# DEC-051 — i18n from Phase 4.1 (react-i18next)

## Source status

Historical decision recorded on 2026-06-26. The source provides an explicit decision statement. The source does not assign a separate lifecycle status to this record. Chronological presence does not prove current authority.

## Preserved decision record

**Date:** 2026-06-26

**Decision:** The frontend has been using `react-i18next` + `i18next` from the beginning. All user-visible strings via `t()` — zero hardcoded text in components.

**Stack:** i18next 26.3.3, react-i18next 17.0.8. Config in `shared/i18n/i18n.ts`, translations in `shared/i18n/locales/pl.json`.

**Justification:**
- Adding i18n later = refactoring every component (searching for hardcoded strings)
- The app is ultimately SaaS — multi-language is a matter of time
- Cost from the beginning: minimal (one import + `t('key')` instead of inline string)

**Rejected:** "Hardcoded PL for MVP, i18n later" — too costly migration.

## Source provenance

- Original source: legacy decision log
- Pre-atomization path: `docs/history/decision-log.md`
- Original identifier: `DEC-051`
- Original order: 52 of 59
- Original source lines: 982–995
- Frozen source commit: `582b3e8b147293c7b33dd0f839839aa81d7c8c20`
