# Vault v2 cutover rehearsal

## Reproducible evidence captured in this change

The automated rehearsal suite is
`client/src/shared/adapters/persistence/cutover/legacy-cutover.spec.ts`.
It executes the following evidence cases:

- restore A surrogate: exact legacy database and storage key are removed;
  unrelated storage is preserved;
- second run: the committed marker makes the operation an idempotent no-op;
- restore B surrogate: dry-run reports exactly the supplied allowlist and
  performs no deletion or broadcast;
- invalid scope: wildcard/path-like names are rejected and `lockOnFailure` is
  called before the error is returned.
- failure surrogate: a deletion failure invokes `lockOnFailure`, leaves the
  marker absent, and a later bounded retry can complete;
- two isolated restore surrogates: each preserves control-plane storage and
  receives its own marker without sharing state.

Run it with:

```text
npm run test --workspace=client -- src/shared/adapters/persistence/cutover/legacy-cutover.spec.ts
```

For the complete browser verification, use the serialized default runner:

```text
npm run e2e --workspace=client -- --project=chromium
```

This is deterministic local evidence, not evidence from a production
database. A release owner must still attach the two production-like restore
identifiers, raw IndexedDB inventory, backend table inventory and command
output before authorising a destructive environment run.

Production execution is intentionally not part of this change. The procedure is designed for two runs against separate production-like restores.

1. Record the restore identifier, schema version and exact allowlist of legacy database names, tables and storage keys.
2. Call `performLegacyCutover(exactDatabaseNames, exactStorageKeys, storage, { dryRun: true })` and review the inventory diff. Wildcards and path-like values are rejected.
3. Run it once against restore A; verify control-plane records remain and all legacy financial stores are absent.
4. Run it again against the same restore A; verify the second run is a no-op.
5. Repeat against restore B and capture raw IndexedDB plus backend table evidence.
6. Inject a failure before marker commit; verify `lockOnFailure` was invoked,
   the application remains locked and retry does not broaden scope.

No command in this repository performs a production destructive reset. Owner approval is required for a concrete environment and restore identifier.
