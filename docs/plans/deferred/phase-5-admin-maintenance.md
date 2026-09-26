# Phase 5: Admin / Maintenance (post-MVP)

> **Source status:** The source labels this phase post-MVP and leaves its checklist open.

| # | Task | Description |
|---|---|---|
| 20 | Super-user role + guard | Dedicated AuthGuard for maintenance endpoints |
| 21 | Seed rules endpoint | `POST /admin/rules/seed` — bulk insert of default rules from JSON dictionary |
| 22 | Default rules dictionary (PL) | JSON seed of 500-2000 rules (merchants → categories), AI-enriched scraping |
| 23 | `isSystem` flag on CategorizationRule | Differentiation between system (seed) and user-created rules, UI hints |
| 24 | Seed categories hierarchy | Default category tree per locale (PL, EN), parentId support |
| 25 | Bulk rule import/export | `POST/GET /admin/rules/bulk` — JSON/CSV import/export for super-user |
| 26 | Workspace provisioning | Auto-seed rules + categories upon workspace creation |
| 27 | Rule analytics | How often a rule matched, effectiveness, unused rules cleanup |
| 28 | System health endpoints | Stats: number of uncategorized transactions, orphaned rules, etc. |
| 29 | Activate PermissionGuard for granular ABAC | Enable `@RequirePermission` on resource endpoints, multi-user workspace invite flow, sub_budget/account-level resource ID resolution in guard |

### Priority layering (convention)

```
priority 0     — system (seed, AI-generated defaults)
priority 1-5   — user-defined rules
priority 10+   — explicit user overrides
```

User-created rules always override system rules due to higher priority.

## Source provenance

- Original source: legacy development plan
- Pre-atomization path: `docs/plans/roadmap.md`
- Original source lines: 606–628
- Frozen source commit: `582b3e8b147293c7b33dd0f839839aa81d7c8c20`
