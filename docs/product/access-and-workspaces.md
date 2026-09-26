# Original Access and Workspace Model

> **Source status:** Original ABAC, multi-tenancy and workspace assumptions. Current authority must be verified against the auth guide and atomized decisions.

## Permissions Model — ABAC

**Decision: ABAC (Attribute-Based Access Control), not RBAC.**

RBAC is too coarse-grained for this use case. ABAC enables:
- Wife sees the "Home" sub-budget but doesn't see the business account
- Sharing a single sub-budget with a roommate without access to the rest
- Different access levels: `owner | edit | view`
- Possible extension: permission not only on a resource but also on the level of detail (e.g., "sees aggregates but not individual transactions")

```
permissions
- user_id
- resource_type  (sub_budget | account | workspace)
- resource_id
- actions        (read, write, delete — array)
- granted_by
- conditions?    (optional — data granularity)
```

**ABAC is not implemented in MVP** — but the architecture leaves room for it from the start to avoid a painful migration from RBAC later.

### What this means in practice right now

- Don't hardcode `user_id` as the sole owner everywhere — the `permissions` table exists from the start, even if initially it only has one record per resource (owner, full access)
- Sub-budget as a first-class citizen with its own ID and relation to the owner — structurally independent from workspace
- Field `access_level: owner | edit | view` in the model from the start (instead of a boolean)

---

## Multi-tenancy and users

The application is designed as multi-user SaaS from the start:
- Auth: JWT + refresh tokens (e.g., passport-jwt in NestJS)
- Each user has their own: source accounts, sub-budgets, categorization rules, import profiles
- `user_id` / `workspace_id` as foreign key everywhere + Row Level Security or global filtering in NestJS

### Workspace model (for future sharing)

```
workspaces
- id
- name  (e.g., "The Kowalski Family")

workspace_members
- workspace_id
- user_id
- role  (owner / member)

budgets, transactions, sub_budgets → belong to workspace_id, not user_id
```

This solves the "you + wife" case and is ready for selling to other couples/families/companies.

---

## Current and historical references

- [Auth developer guide](../guides/backend/auth-module.md)
- [Legacy decision index](../history/decisions/README.md)
- [Privacy and security capability](./capabilities/privacy-and-security.md)


## Source provenance

- Original source: legacy product plan
- Pre-atomization path: `docs/product/product-concept.md`
- Original source lines: 185–240
- Frozen source commit: `582b3e8b147293c7b33dd0f839839aa81d7c8c20`
