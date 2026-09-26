# Vault v2 cutover runbook

> **Naming compatibility:** `budgetflow-*` values in this runbook identify legacy
> persisted state governed by ADR-015. Operators must use the exact bytes shown;
> the NoAsterisk rebrand does not authorize a storage migration.

Status: **prepared for review; execution blocked**. This document is an
operator procedure, not authorization to delete data, migrate a database, or
deploy a release.

## Safety boundary

The procedure must run against a named isolated restore or an explicitly
approved environment. Account, user, workspace, permission, consent,
invite-code, dictionary, WebAuthn, keyset, device, server-share, envelope,
rotation, and v2 snapshot records are control-plane or v2 data and are never
targets of the v1 financial reset.

The only client-side destructive API is
`performLegacyCutover(databaseNames, storageKeys, storage, options)`. Callers
must provide exact, deduplicated names. Wildcards, prefixes, `?`, and `..` are
rejected. `dryRun: true` performs no deletion, marker write, or broadcast.

## Inventory

1. Record the commit, migration journal, browser/OS version, database name,
   account/workspace scope, and operator/reviewer names.
2. In a clean isolated browser profile, enumerate `indexedDB.databases()` and
   record names only. The current v2 database format is
   `budgetflow-encrypted-financial-data:<userId>:<workspaceId>` and must be
   preserved. Any legacy name requires an explicit exact entry in the review
   manifest; do not infer targets from a prefix.
3. Record exact local-storage keys to remove. Preserve theme, device identity,
   auth/session, and all v2 keys unless a reviewed manifest explicitly says
   otherwise. The cutover marker is written only after deletion verification.
4. On the server, run read-only counts on an isolated copy for the historical
   financial tables (`transactions`, `categories`, `import_profiles`, and
   `import_batches`) only if they exist. Do not count or delete `vaults`,
   `vault_keysets`, `vault_devices`, `vault_server_shares`,
   `vault_device_envelopes`, `vault_sync_snapshots`, or challenge/rotation
   tables as v1 targets.

Example read-only inventory (replace the connection mechanism, never the
allowlist):

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'transactions', 'categories', 'import_profiles', 'import_batches'
  )
ORDER BY table_name;
```

Counts must be recorded as non-sensitive numbers. Never export row contents,
ciphertexts, recovery backups, or keys.

## Rehearsal

1. Take two independent, production-shaped restores. Verify that the control
   plane and the v2 allowlist are present in both.
2. Run the client cutover once with `dryRun: true`; preserve its exact result
   and verify that no marker, storage key, broadcast, or database changed.
3. On each isolated restore, execute the exact allowlisted client deletion,
   keep the application locked, verify every deletion, and then verify the
   marker. A blocked database or failed verification must leave the app locked,
   leave no marker, and permit a bounded retry.
4. Verify twice that preserved control-plane and v2 records are unchanged and
   that no v1 client can write after the marker. A second run must return
   `already-completed` without touching unrelated storage.
5. Attach before/after counts, command output, versions, and reviewer
   signatures. Attach no contents or secrets.

## Abort and rollback

Abort on an unknown database/key, missing isolated-restore identity, open tab,
unexpected schema, failed verification, failed lock, or any mismatch in the
preservation counts. The client remains locked and retryable. Before a
destructive reset, restore the isolated backup and repeat the rehearsal. After
reset, rollback may restore operational state but must not reintroduce a
password-derived or unsigned v1 unlock path.

## Release gate

Execution remains blocked until the browser matrix, two rehearsals, isolated
PostgreSQL evidence, independent security review, and explicit per-environment
operator approval are attached. This runbook does not authorize production
execution and does not change the MVP status to APPROVED or DONE.
