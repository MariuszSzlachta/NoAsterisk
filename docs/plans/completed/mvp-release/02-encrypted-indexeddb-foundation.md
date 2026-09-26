# Session 02: Build the Encrypted IndexedDB Foundation

**Status:** Complete — verified 2026-09-09

**Implementation commit:** `ceb0935` (`feat: add encrypted IndexedDB persistence foundation`)

## Objective

Replace plaintext financial persistence in Zustand `localStorage` with a real encrypted-at-rest IndexedDB data layer. Dexie.js provides transactions and schema migrations; Web Crypto provides per-record authenticated encryption. After this session, financial stores use IndexedDB as the durable source of truth and contain no durable plaintext fallback.

**Prerequisite:** Session 01 green

## Confirmed decisions and evidence

The project documentation already selects:

- Dexie.js over raw IndexedDB or `idb` for migrations, compound operations and transactional bulk writes;
- Web Crypto API with AES-256-GCM for authenticated encryption;
- PBKDF2-SHA-256 with 600,000 iterations as the initial browser-native KDF;
- a 16-byte random salt and unique 12-byte random IVs;
- non-extractable `CryptoKey` objects held only in memory;
- `sessionStorage`, never IndexedDB, for non-sensitive wizard navigation state;
- no persistence of raw CSV contents or original PII.

Primary references: ADR-003 and `docs/architecture/local-first-e2ee.md`. The architecture reference contains stale plaintext-IndexedDB language. The owner resolved the MVP planning direction on 2026-09-07: user financial records in IndexedDB must be encrypted at rest with real Web Crypto, not stored as plaintext.

## Security model for MVP

### Key lifecycle

1. The user unlocks the local financial database with the vault passphrase. Do not silently reuse or persist an account password.
2. PBKDF2-SHA-256 derives the AES-256-GCM key from the passphrase and a database-specific 16-byte random salt using 600,000 iterations.
3. The derived AES key is non-extractable and exists only in memory for the unlocked session.
4. IndexedDB stores the salt and non-secret crypto/schema metadata, never the passphrase, derived key or recovery material.
5. An encrypted verification sentinel distinguishes a wrong passphrase from an empty database without exposing financial content.
6. Lock/logout clears in-memory decrypted state and all references to the key. Reload requires unlock again.

### Record encryption

- Encrypt each persisted domain record independently with AES-256-GCM and a new random 12-byte IV on every write.
- Bind collection name, record ID and crypto/schema version as AES-GCM additional authenticated data so ciphertext cannot be moved between records or tables undetected.
- IndexedDB may contain opaque record ID, collection discriminator, ciphertext, IV, crypto version and technical update timestamp. Amount, date, description, category, budget, rule keyword, filename and other financial/business fields must not be plaintext columns or indexes.
- Because encrypted business fields cannot be indexed safely, hydrate/decrypt the required collection into in-memory Zustand state after unlock and perform current MVP filtering/sorting in memory. Do not introduce deterministic encryption for query fields.
- Dexie transactions make multi-record domain writes atomic. Encryption occurs before the transaction is committed.

Encryption at rest protects a locked browser profile and copied IndexedDB files. It does not protect data from XSS or a malicious extension while the database is unlocked; CSP and the later security session remain mandatory.

## Target structure

Create a framework-neutral persistence boundary under `client/src/shared/adapters/persistence/` or the current canonical shared infrastructure location:

```text
persistence/
├── ports/                 # encrypted repository interfaces
├── dexie/                 # schema, adapter and migrations
├── crypto/                # record envelope/AAD composition using shared Web Crypto primitives
├── migrations/            # localStorage → encrypted IndexedDB migration
└── index.ts               # narrow public API
```

Reuse and relocate the already tested PBKDF2/AES-GCM primitives where appropriate. Do not maintain separate crypto implementations for record storage and sync snapshots.

## Scope

1. Add a pinned Dexie.js dependency and define version 1 of the encrypted database schema.
2. Define strict encrypted-envelope, collection, metadata and repository types. No `any` or unvalidated JSON at hydration boundaries.
3. Implement key derivation, sentinel creation/verification, per-record encryption/decryption and AAD binding with the confirmed parameters.
4. Implement transactional repositories for all currently persisted user financial state:
   - transactions;
   - categorization rules;
   - categories;
   - budgets;
   - budget-period/rollover history;
   - existing user-owned import profiles, if present.
5. Refactor the corresponding Zustand stores so they hold hydrated session state and write through the encrypted repositories. Remove `persist`/`localStorage` for those stores.
6. Keep non-sensitive presentation preferences such as theme, locale and dismissed informational banners outside the financial database when justified. Document the allowlist; everything not allowlisted must avoid `localStorage`.
7. Add an explicit locked/unlocking/unlocked/error state and prevent financial routes from rendering data until successful unlock/hydration.
8. Implement a one-time, idempotent migration from known legacy financial `localStorage` keys:
   - validate every legacy payload before migration;
   - encrypt and write all valid collections in a single recoverable migration flow;
   - verify decrypt/read-back before deleting legacy keys;
   - retain legacy data unchanged on failure;
   - record a non-sensitive migration marker only after success.
9. Request persistent browser storage through `navigator.storage.persist()` and provide a clear warning when persistence is denied or unavailable.
10. Coordinate multiple tabs using `BroadcastChannel` and/or `navigator.locks` so two tabs do not initialize or migrate the database concurrently.
11. Ensure logout, account deletion and “clear local data” close and delete the encrypted database intentionally, with destructive confirmation.
12. Update current architecture/frontend guides to distinguish encrypted financial IndexedDB from allowed non-sensitive browser preferences.

## Non-goals

- CSV submission and import-history creation belong to Sessions 03 and 04.
- Remote blob transport and device synchronization belong to Sessions 07 and 08.
- No deterministic encryption, searchable encryption, SQL-like encrypted indexes or server-side keys.
- No Argon2id/WASM migration in this session; PBKDF2 600,000 is the documented MVP choice.
- Do not persist raw CSV, pre-masking values, auth tokens, passwords, keys or decrypted caches.
- Do not keep dual-write to plaintext `localStorage` as a rollback mechanism.

## Required tests

### Cryptography

- AES-GCM round trip and tamper rejection;
- wrong passphrase rejected through the sentinel;
- fresh IV on every write of the same record;
- AAD prevents ciphertext substitution across IDs or collections;
- derived key is non-extractable;
- documented KDF/key/salt/IV parameters are asserted.

### Persistence

- create/read/update/delete for every encrypted collection;
- no business field is present in raw IndexedDB records;
- multi-record transaction rolls back completely on failure;
- reload starts locked and exposes no decrypted financial state;
- unlock hydrates stores correctly;
- lock/logout clears hydrated state;
- malformed/tampered records fail closed without partial hydration;
- two-tab initialization/migration is serialized.

### Migration

- valid legacy stores migrate once and legacy financial keys are removed only after verified success;
- invalid legacy data is quarantined/reported without deletion;
- interrupted migration resumes safely;
- empty legacy stores migrate correctly;
- post-migration repository data matches the validated source records.

## Gates

```bash
rg -n "persist\(|localStorage" client/src/features/transactions client/src/features/budgets client/src/features/admin-rules client/src/entities/category
npm run build --workspace=client
npm run test --workspace=client
npm run lint --workspace=client
npm run e2e --workspace=client
git diff --check
```

The search may return only the explicit migration reader, non-sensitive allowlisted preferences or tests proving absence. Every remaining match must be classified in the handoff.

Perform a browser verification using DevTools/Application storage:

1. Create representative transactions, rules and budgets.
2. Confirm no financial keys or values exist in `localStorage`.
3. Inspect raw IndexedDB rows and confirm they contain only encrypted envelopes/technical metadata.
4. Reload, verify the app is locked, unlock with the correct passphrase and verify full hydration.
5. Copy or inspect ciphertext and confirm descriptions, amounts, categories and filenames are not readable.

## Handoff

- Final IndexedDB schema and plaintext metadata allowlist.
- Crypto parameters, AAD format and key lifecycle.
- Migrated stores and legacy keys removed.
- Multi-tab coordination strategy.
- Raw storage inspection evidence with no user financial content.
- Exact build/test/lint/E2E results and any residual security limitations.

## Deferred optimization follow-up

- Replace the blank `RequireAuth` bootstrap state with an app-shell page skeleton from the design system.
- Cover the bootstrap skeleton with a route-level rendering test and verify that it does not expose authentication state.

## Completion evidence

- Persistence coverage: passed — 290 files; 2590 passed, 8 expected failures; 100% statements, lines and functions; 99.12% branches.
- Encrypted storage browser verification: passed — migration, raw IndexedDB envelope inspection, reload lock and unlock hydration.
- Client build: passed.
- Client lint: passed with 8 existing Fast Refresh warnings in `dashboard-widgets/widget-registry.tsx`.
- Frontend quality gate: passed with 32 existing style warnings and no errors.
- Repository-wide Playwright gate: passed — 103 tests.
- Financial feature `persist()`/`localStorage` search: passed with no matches.
- `git diff --check`: passed.
