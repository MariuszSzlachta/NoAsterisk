# Session 06: Make the Encrypted Snapshot Complete

## Status

**Complete — verified 2026-09-10.** The implementation is present and the encrypted
snapshot now covers all six user-owned MVP collections with versioned validation,
atomic replacement, legacy compatibility and canonical export/import.

## Objective

Define the complete, versioned encrypted snapshot that cross-device synchronization will transport. Backup and restore remain supported behaviors, but transport and concurrency belong to Sessions 07 and 08.

**Prerequisites:** Sessions 02 and 04 complete

## Verified implementation

The original gap is closed. The v1 payload contains `transactions`, `rules`,
`categories`, `budgets`, `periodHistory` and `importHistory`; restore validates the
complete payload before replacing encrypted collections and preserves empty arrays as
intentional clears. The unversioned `{ transactions, rules }` reader remains
compatible without weakening record validation.

## Scope

1. Inventory every persisted client store and classify it as user-owned MVP data, device preference, cache, ephemeral wizard state or development seed.
2. Define a versioned vault envelope with an explicit schema version and creation timestamp.
3. Include all user-owned MVP data needed for recovery: transactions, rules, categories, budgets, period/rollover history and import history. Include import profiles only if they are currently persisted and user-owned.
4. Exclude raw CSV data, original PII, auth tokens, password/key material, UI caches, dismissed-banner state and ephemeral wizard state.
5. Validate the complete decrypted payload before mutating any store. Restore or remote-snapshot application must be atomic from the user's perspective: either all validated stores are replaced or none are.
6. Correctly restore empty arrays so a backup can intentionally clear stale local state.
7. Maintain a compatibility reader for the existing unversioned `{ transactions, rules }` payload. Never weaken validation to accept arbitrary records.
8. Update export/import to use the same canonical payload schema or clearly document why plaintext export is different.
9. Update vault statistics to reflect the actual included datasets.
10. Verify cryptographic constants, fresh salt/IV generation and wrong-password behavior without logging plaintext or secrets.
11. Define a stable plaintext canonicalization/digest strategy that lets the client detect local changes before encryption. The digest itself must not be treated as proof of remote content and need not be sent to the server.
12. Keep local-record encryption and sync-snapshot encryption as separate cryptographic contexts: use independent salts and fresh IVs even when the user unlocks both with the same vault passphrase.
13. Build the logical snapshot from validated in-memory domain records, encrypt the complete snapshot before network transport, and avoid durable plaintext staging. On restore, decrypt and validate in memory, then write through the Session 02 encrypted repositories so records are encrypted again for the target device's local database.

## Non-goals

- No blob transport, automatic synchronization or conflict UI; Sessions 07 and 08 own those behaviors.
- No further storage-engine migration; Session 02 must already provide encrypted IndexedDB.
- No server-side decryption, search, analytics or validation of the plaintext payload.
- Do not persist the encryption password or derived key.
- Do not upload raw IndexedDB files as an undocumented backup format or assume that another device shares the same database salt.

## Required tests

- full-state encrypt/decrypt round trip;
- legacy payload migration;
- empty-array restore clears stale state;
- malformed one-section payload causes no partial restore;
- wrong password changes no local state;
- payload contains no raw/original import fields or secrets;
- the encrypted snapshot remains opaque and self-contained for the server contract;
- restored logical records are re-encrypted at rest for the target device;
- maximum-size handling produces a safe user-visible error.

## Gates

```bash
npm run build --workspace=client
npm run test --workspace=client
npm run lint --workspace=client
JWT_SECRET=ci-test-secret-with-at-least-32-characters JWT_REFRESH_SECRET=ci-refresh-secret-with-at-least-32-characters npm run test --workspace=server -- --runInBand
git diff --check
```

Complete a manual backup → clear local data → restore flow and record the recovered entity counts.

## Handoff

- Persisted-store inventory and inclusion decision.
- Vault schema version and legacy behavior.
- Atomic restore mechanism.
- Automated and manual round-trip evidence.

## Closure evidence


The plan is closed and must not be reopened unless a regression or explicitly
expanded requirement is recorded.
