# DEC-046 — Pinned dependency versions (zero ^ or ~)

## Source status

Historical decision recorded on 2026-06-26. The source provides an explicit decision statement. The source does not assign a separate lifecycle status to this record. Chronological presence does not prove current authority. This source identifier occurs twice. The filename suffix is a migration-level disambiguator only and is not part of the historical decision number. Owner resolution remains required.

## Preserved decision record

**Date:** 2026-06-26

**Decision:** All dependencies in client/ and server/ package.json have exact pinned versions (without `^` or `~`).

**Rationale:**
- Reproducible builds — `npm install` gives the identical tree regardless of the installation time
- Controlled upgrades — `npm outdated` → review changelog → bump manually → tests → commit
- AG Grid, Nivo, NestJS change API between minors — surprises on CI are not acceptable

**Upgrade process:** `npm outdated` → risk assessment → bump in package.json → `npm install` → full test suite → commit.

## Source provenance

- Original source: legacy decision log
- Pre-atomization path: `docs/history/decision-log.md`
- Original identifier: `DEC-046`
- Original order: 46 of 59
- Original source lines: 880–891
- Frozen source commit: `582b3e8b147293c7b33dd0f839839aa81d7c8c20`
