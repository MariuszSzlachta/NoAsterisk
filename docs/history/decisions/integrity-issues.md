# Legacy Decision Integrity Issues

This record makes source defects and cross-document conflicts visible without repairing history or choosing an architectural outcome.

## Duplicate DEC-046

The source assigns DEC-046 to two unrelated decisions:

- [Dependency version pinning](./DEC-046-a-pinned-dependency-versions-zero-or.md) — source order 46.
- [Infinite scroll for the transaction list](./DEC-046-b-infinite-scroll-non-classical-pagination-on-the-transaction-list.md) — source order 50.

Both files retain `Original identifier: DEC-046`. Filename suffixes `a` and `b` are migration-only disambiguators. They are not historical renumbering.

## Recovered DEC-059, DEC-060 and DEC-061

The originally imported the legacy decision log ends at DEC-058, so the first atomization correctly treated DEC-059–061 as missing. On 2026-08-01, a separate `decision-log.md` was recovered from an untracked temporary workspace used on another computer. It contains complete, sequential records for [DEC-059](./DEC-059-budget-overspend-ux-graduated-red-on-spent-amount.md), [DEC-060](./DEC-060-abandon-4-2-8-4-budget-health-gauge-widget.md) and [DEC-061](./DEC-061-csv-parser-anonymizer-enterprise-grade-rewrite.md), all dated 2026-06-29.

The recovery is strongly corroborated:

- DEC-059 matches application commit `9fa9a56`, whose subject names DEC-059 and the graduated overspend color.
- DEC-060 matches the dashboard roadmap's `Abandoned (DEC-060)` entry for Budget Health.
- DEC-061 matches application commit `f57e7da`, the approved
  [CSV engine overview](../../architecture/csv-engine/overview.md) and the CSV
  roadmap.

These three files are labeled as recovered records and are not represented as members of the frozen 59-entry aggregate. The former missing-source issue is resolved; provenance of the recovered temporary source remains explicit.

## DEC-003 content-hash timing conflict

[DEC-003](./DEC-003-content-hash-before-anonymization.md) requires hashing raw transaction data before anonymization and explicitly rejects hashing after anonymization. The [current CSV import guide](../../guides/frontend/csv-import-feature.md) documents post-anonymization hashing as a known implementation deviation. No single answer is asserted here.

## DEC-025, DEC-057 and ADR-006 boundary

[DEC-025](./DEC-025-frontend-architecture-feature-sliced-design-layered-internals.md) establishes layered FSD with frontend domain entities. [DEC-057](./DEC-057-simplified-frontend-architecture-layered-fsd-no-ddd-hexagonal.md) later supersedes several parts of that design and adopts simplified feature internals without DDD/hexagonal structure. [ADR-006](../../adr/006-shared-domain-package.md) later introduces a shared DDD package and says it supersedes the earlier no-DDD rule. The intended boundary between shared domain code and feature-local code remains an owner decision.

## Infinite scroll and explicit pagination

The second [DEC-046](./DEC-046-b-infinite-scroll-non-classical-pagination-on-the-transaction-list.md) selects infinite scroll for the transaction list. The [preview-grid guide](../../guides/frontend/preview-grid-improvements.md) documents explicit pagination for the import preview grid. These likely concern different views, but the corpus does not explicitly establish the boundary. Do not generalize either record to every grid.
