# Architecture Decision Records

## Decision Placement Policy

**`docs/history/decisions/` is an archive — do NOT create new DEC entries there.**

New decisions belong in the appropriate location based on their scope:

| Decision scope                                                                     | Where to record                      |
| ---------------------------------------------------------------------------------- | ------------------------------------ |
| Local implementation detail, obvious from code                                     | Code and tests; no separate document |
| Convention for one component or module                                             | `docs/guides/...`                    |
| Product behavior or business rule                                                  | `docs/product/...`                   |
| Work scope or sequencing                                                           | `docs/plans/active/...`              |
| Process decision                                                                   | `docs/process/...`                   |
| Architecture, domain model, module boundaries, security, or cross-cutting concerns | New ADR here                         |

**Practical test:** "Could someone in 6 months reasonably choose differently without knowing the constraints and consequences?" → ADR. If the code, tests, or a module guide make it obvious → no ADR needed.

Code change size does not determine ADR necessity. A one-line change may warrant an ADR if it establishes a lasting rule. A large refactoring that introduces no new architectural decision may not need one.

---

## ADR Index

| ADR                                                                           | Status in source                             | Decision                                                                      |
| ----------------------------------------------------------------------------- | -------------------------------------------- | ----------------------------------------------------------------------------- |
| [ADR-001](./001-bank-csv-categories.md)                                       | Planned                                      | Bank CSV categories                                                           |
| [ADR-002](./002-csv-boundary-detection-algorithm.md)                          | Implemented                                  | Three-phase CSV boundary detection                                            |
| [ADR-003](./003-local-first-e2ee-architecture.md)                             | Planned                                      | Local-first architecture with E2EE sync                                       |
| [ADR-004](./004-category-import-modal-step5.md)                               | Planned                                      | Category-import modal at import step                                          |
| [ADR-005](./005-account-entity-design.md)                                     | Accepted                                     | Account entity and integration                                                |
| [ADR-006](./006-shared-domain-package.md)                                     | Accepted                                     | Shared domain package                                                         |
| [ADR-007](./007-csv-import-code-quality-refactoring.md)                       | Accepted                                     | CSV import code-quality refactoring                                           |
| [ADR-008](./008-anonymization-step-dropdown-actions.md)                       | Accepted                                     | Dropdown actions in anonymization step                                        |
| [ADR-009](./009-budget-entity-design.md)                                      | Accepted                                     | Budget entity design & transaction assignment                                 |
| [ADR-010](./010-api-security-hardening.md)                                    | Accepted                                     | API security hardening — password policy, rate limiting, HTTP headers         |
| [ADR-011](./011-mvp-local-first-opaque-sync-boundary.md)                      | Accepted                                     | MVP local-first financial-data boundary and opaque encrypted sync             |
| [ADR-012](./012-device-bound-vault-root-key-and-sync-chain.md)                | Accepted; implementation required before MVP | Client-held random VMK, split trusted-browser unlock and optional passkey PRF |
| [ADR-013](./013-independent-recovery-authority-and-enrollment-transcripts.md) | Accepted; implementation in progress         | Independent recovery authority and one-use delegated enrollment transcripts   |
| [ADR-014](./014-vault-rotation-transcript.md)                                 | Proposed; implementation in progress         | Canonical dual-root vault rotation transcript                                 |
| [ADR-015](./015-noasterisk-product-identity-and-compatibility.md)             | Accepted                                     | NoAsterisk product identity and compatibility boundary                        |

Identifiers and original statuses are preserved. ADR-011 is the current accepted
MVP boundary; ADR-003 remains the historical migration rationale and should not be
used to reintroduce the retired server-side financial-data path. “Accepted” does not
prove that every described work item is implemented; consult current developer
guides and the [roadmap](../plans/roadmap.md).

ADR-012 supersedes the password-derived client key lifecycle while preserving the
ADR-011 opaque-server boundary. ADR source statuses are historical decision
metadata; current implementation and release evidence must be checked separately.

## Legacy decision backlog

The [legacy decision index](../history/decisions/README.md) contains high-impact decisions that may deserve formal ADR treatment after owner review, including [DEC-003](../history/decisions/DEC-003-content-hash-before-anonymization.md), [DEC-005](../history/decisions/DEC-005-gdpr-front-only-anonymization-in-mvp.md), [DEC-007](../history/decisions/DEC-007-workspace-scoped-repository-operations.md), [DEC-010](../history/decisions/DEC-010-plugin-architecture-for-pii-rules-nestjs-multi-provider.md), [DEC-017](../history/decisions/DEC-017-abac-workspace-level-permissions-for-mvp-hierarchical-later.md), [DEC-025](../history/decisions/DEC-025-frontend-architecture-feature-sliced-design-layered-internals.md), [DEC-057](../history/decisions/DEC-057-simplified-frontend-architecture-layered-fsd-no-ddd-hexagonal.md), DEC-034/035 and DEC-041/042.

> **Recovered legacy source:** [DEC-061](../history/decisions/DEC-061-csv-parser-anonymizer-enterprise-grade-rewrite.md) now supplies the historical rationale for the CSV engine rewrite. It remains a legacy DEC record, not a formal ADR; later ADRs and current implementation documentation determine present authority.
