# NoAsterisk Documentation Map

Use this page as the stable entry point for human readers and retrieval systems.

## Product knowledge

- [Product knowledge map](./product/README.md) — current capabilities and atomized original product intent.
- Capabilities: [CSV import](./product/capabilities/csv-import.md), [manual transaction entry](./product/capabilities/manual-transaction-entry.md), [categorization](./product/capabilities/categorization.md), [dashboard](./product/capabilities/dashboard.md), [privacy and security](./product/capabilities/privacy-and-security.md).
- [Human-in-the-loop anonymization](./product/concepts/human-in-the-loop-anonymization.md) — concept and unresolved technical questions.

## Architecture and decisions

- [Architecture map](./architecture/README.md) — current and target technical references.
- [Architecture Decision Records](./adr/README.md) — ADR-001 through ADR-015 and legacy-decision backlog.
- [Historical knowledge map](./history/README.md) and [atomized legacy decisions](./history/decisions/README.md) — chronological DEC records with explicit integrity warnings.

## Implementation guides

The [shared domain package](./guides/domain-package.md) covers `packages/domain/` — entities (Budget, Transaction, Category, Account, CategorizationRule), value objects, and extension patterns.

Repository operations are documented in [Continuous Integration](./guides/continuous-integration.md), including the required check names, reproducibility controls, dependency policy and safe failure-artifact boundary.

Backend guides cover [auth](./guides/backend/auth-module.md), [user settings](./guides/backend/user-settings-module.md), [admin panel](./guides/backend/admin-panel-module.md), [categorization rules](./guides/backend/categorization-rules-module.md), [import profiles](./guides/backend/import-profiles-module.md), the [retired imports API](./guides/backend/imports-module.md) and [dictionaries](./guides/backend/dictionaries-module.md).

Frontend guides cover the [CSV import feature](./guides/frontend/csv-import-feature.md), [anonymization UI](./guides/frontend/csv-import-anonymization-step.md), [column merging](./guides/frontend/csv-import-column-merge.md), [preview grid](./guides/frontend/preview-grid-improvements.md), [dashboard widgets](./guides/frontend/dashboard-widgets-feature.md), [budgets](./guides/frontend/budgets-feature.md), [auth](./guides/frontend/auth-feature.md), [analytics](./guides/frontend/analytics-feature.md), [admin rules](./guides/frontend/admin-rules-feature.md), [admin panel](./guides/frontend/admin-panel-feature.md), [user settings](./guides/frontend/user-settings-feature.md) and [E2EE vault](./guides/frontend/e2ee-vault.md).

## Design and planning

- [Design system](./design/design-system.md) and [mockup assets](./design/mockups/NoAsterisk.dc.html).
- [Planning map](./plans/README.md) — atomized completed, active, deferred and archived plans.

## Historical context

- [Archived reference material](./archive/reference/) is useful context but is not canonical architecture.

## Known ambiguities

The canonical unresolved-conflict list is maintained in the [decision integrity record](./history/decisions/integrity-issues.md). In particular, verify hash timing, frontend DDD boundaries, current versus target persistence and anonymization step numbering before relying on those details. The former DEC-059–061 source gap is also documented in that record.
