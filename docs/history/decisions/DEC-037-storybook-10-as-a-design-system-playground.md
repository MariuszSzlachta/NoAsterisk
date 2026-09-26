# DEC-037 — Storybook 10 as a design system playground

## Source status

Historical decision recorded on 2026-06-25. The source provides an explicit decision statement. The source does not assign a separate lifecycle status to this record. Chronological presence does not prove current authority.

## Preserved decision record

**Date:** 2026-06-25

**Decision:** Storybook 10 (Vite-native) setup from the beginning. It serves as:
1. An isolated environment for working on components
2. Design system documentation (autodocs)
3. Dark/light mode testing (toolbar toggle)
4. Future: visual regression in CI (Chromatic)

**Justification:**
- Components are tested in isolation (without app state, router, providers)
- Two themes are visible side by side
- Storybook 10 + Vite = fast start, no webpack
- Work on the design system does not require running the full application
- Alternative (route `/dev/components`) was rejected — no isolation, no autodocs, no toolbar

**Rejected:** Ladle (fewer features, smaller community), dedicated route (no isolation).

## Source provenance

- Original source: legacy decision log
- Pre-atomization path: `docs/history/decision-log.md`
- Original identifier: `DEC-037`
- Original order: 37 of 59
- Original source lines: 678–695
- Frozen source commit: `582b3e8b147293c7b33dd0f839839aa81d7c8c20`
