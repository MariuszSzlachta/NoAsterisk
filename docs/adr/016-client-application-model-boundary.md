# ADR-016: Client application-model boundary

Date: 2026-09-27

Status: Accepted

## Context

The client previously used `src/entities/` as a mixed container for persistence
records, Zustand stores, pure policies, synchronization coordination and forwarding
exports into feature-owned stores. Those modules were not domain entities, and the
name conflicted with ADR-006, which places domain entities in `packages/domain`.

The forwarding slices for budgets and import history also obscured their real
owners. A consumer appeared to depend on an entity while it actually depended on a
feature store.

## Decision

1. `packages/domain` is the only location for framework-free domain entities and
   value objects shared by the client and server.
2. `client/src/model` contains the cross-feature client application model:
   serializable browser records, long-lived shared state, pure cross-feature
   policies and coordination primitives.
3. `client/src/model` may depend on `shared` and `packages/domain`, but not on
   `features`, `pages` or `app`.
4. Feature-owned models and stores remain inside their feature. Consumers use the
   feature's public store entry point directly; the client model must not contain a
   forwarding module that merely renames that dependency.
5. The name `entities` is not used as a client source layer. Code that needs a real
   domain entity imports it from `@budget/domain`.
6. Application composition may read multiple public feature/model stores for
   hydration, encrypted snapshot creation and restore. That orchestration does not
   transfer ownership of those stores.

## Consequences

- `transaction`, `rule`, `category` and vault coordination remain shared client
  concerns under `client/src/model`.
- Budget state remains owned by `features/budgets`; import history remains owned by
  `features/csv-import`.
- Imports reveal the real owner instead of passing through compatibility barrels.
- Adding a module to `client/src/model` requires genuine cross-feature ownership;
  it is not a general-purpose location for feature code.

## Superseded guidance

This decision supersedes the frontend placement rules in ADR-005 that prescribe a
client `entities/` directory. It clarifies ADR-006 without changing the shared
domain package or its invariants.
