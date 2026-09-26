# ADR-011: MVP Local-First Financial Data Boundary and Opaque Sync

**Date:** 2026-09-09  
**Status:** Accepted  
**Supersedes for the implemented MVP path:** the current-state portions of [ADR-003](./003-local-first-e2ee-architecture.md)

## Context

The original application used a server-side financial-data model. The MVP
implementation now processes CSV files in the browser, persists user-owned financial
state in encrypted IndexedDB and synchronizes a complete encrypted snapshot through
the authenticated backend. The backend must not become a financial-data processor
again through a convenience endpoint or a future feature built from an old plan.

ADR-003 remains a useful migration rationale, but its status and several operational,
cost and legal statements describe an earlier planning state. This ADR records the
implemented MVP boundary and its non-negotiable consequences.

## Decision

1. CSV parsing, PII review, categorization, transaction persistence, import history,
   budgets, rules and other user-owned financial state are client-side capabilities.
2. Durable client financial state is stored through the encrypted persistence adapter
   using Web Crypto AES-256-GCM envelopes in IndexedDB. Zustand is an in-memory view
   layer, not the durable source of truth.
3. The backend does not accept or persist raw or anonymized financial rows. The former
   `/imports` boundary is retired.
4. Cross-device MVP synchronization uses a user-initiated whole-snapshot protocol.
   The client encrypts and validates the snapshot; the backend stores and returns
   only opaque ciphertext plus transport metadata required for optimistic concurrency.
5. The server must not receive vault keys, passphrases, plaintext digests, entity
   change sets or decrypted business metadata. It may store revision, ciphertext
   hash, size and timestamps when required by the sync contract.
6. Pull and restore decisions remain in the browser. Stale writes are rejected; MVP
   does not use silent last-write-wins, server-side merge, CRDTs or background sync.
7. Account/authentication, administration, dictionaries, settings and opaque vault
   transport remain valid backend responsibilities. This boundary does not claim
   that the product has no controller, privacy or security obligations.

## Consequences

### Benefits

- The server cannot inspect users' financial records through the MVP data path.
- Local operation and encrypted-at-rest persistence are possible without a financial
  database query API.
- Sync conflict and decryption decisions are explicit and user-visible.

### Costs and risks

- Losing the vault passphrase can make local data unrecoverable.
- Decrypted data exists in browser memory and remains exposed to a successful XSS
  compromise.
- Encrypted records cannot use plaintext business indexes; the MVP hydrates validated
  data into memory for filtering and sorting.
- Whole-snapshot transfer is simpler but less bandwidth-efficient than future
  operation-based synchronization.
- Legal, retention and controller obligations require separate validation and are not
  inferred from ciphertext-only storage.

## Verification requirements

- No client runtime request sends financial data to `/imports`.
- Raw IndexedDB records contain only encrypted envelopes and explicitly allowed
  technical metadata.
- Sync tests cover first push, pull, stale-write conflict, tampering and malformed
  snapshot handling without partial local mutation.
- Any future server endpoint handling user financial data requires a new ADR and owner
  approval before implementation.

## Related records

- [ADR-003 — Local-First Architecture with E2EE Sync](./003-local-first-e2ee-architecture.md)
- [MVP closure plan](../plans/active/mvp-closure-plan.md)
- [Local-First E2EE technical reference](../architecture/local-first-e2ee.md)
