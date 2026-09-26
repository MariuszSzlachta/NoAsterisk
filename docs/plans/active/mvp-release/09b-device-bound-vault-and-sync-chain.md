# Session 09B: Split-Unlock Vault Master Key and Optional Passkey PRF

> **Naming compatibility:** The `budgetflow/...` labels retained in this plan are
> immutable v1/v2 protocol bytes under ADR-015, not current NoAsterisk product
> copy.

## Status

**Active — mandatory pre-MVP release blocker.**

2026-09-12 implementation checkpoint: signed v2 PostgreSQL enrollment and browser
initial/recovery/trusted-QR orchestration are wired to accepted ADR-013. Both
complete-finalize proof and digest-bound confirmation are verified; the public
unlocked state is published only after confirmation. Focused evidence is recorded
in [the security checkpoint](../../../security/vault-v2-coding-checkpoint-2026-09-12.md).
Actual financial restoration after recovery/trusted join and interrupted-restore
retry are now implemented with real crypto/IndexedDB evidence; clean-browser E2E
and independent review remain open. The replacement-backup upgrade is now wired
in settings with possession-before-registration, lifecycle guards and focused
native visual/form evidence. This does not close Session 09B: dual-root rotation,
memory authority unification and independent quality/browser/crash/security gates
remain required. No application
database cutover or production deployment was performed at this checkpoint.

## Objective

Replace direct password-derived local/sync encryption with a client-generated random
Vault Master Key (`VMK`). A recognized browser must unlock automatically after one
ordinary account login using `LocalShare + ServerShare`. Where WebAuthn PRF is
available, one passkey PIN/biometric ceremony must authenticate and unlock the vault.
OPAQUE is not part of MVP.

Complete a destructive pre-MVP reset of v1 financial stores without deleting account
or control-plane data.

**Primary owners:** frontend + backend  
**Required reviewer:** independent security/code reviewer  
**Prerequisites:** Sessions 01–09A complete; ADR-012 accepted  
**Blocks:** legal copy closure, release quality gate, deployment and pentest sign-off

## Immutable product/security requirements

Security closure tracking: [current implementation and remaining work](../vault-v2-security-closure.md).
Independent recovery authority is specified by accepted ADR-013 (2026-09-12).
Recovery/enrollment sign-off remains a pre-MVP blocker; do not infer completion
from the latest passing build or targeted lifecycle tests.

1. Financial data is encrypted before every durable IndexedDB write.
2. No logout/page-close request is required to encrypt data.
3. VMK and derived vault keys never cross the network in plaintext.
4. Password, password hash, JWT and refresh token are never vault KDF inputs.
5. Backend state alone cannot unwrap VMK.
6. A logged-out copied profile alone cannot unwrap the standard VMK envelope because
   `ServerShare` is never persisted client-side.
7. `ServerShare` requires fresh interactive authentication; refresh cookies, rotated
   tokens and background bootstrap cannot retrieve it.
8. Standard users authenticate once; no second vault-password prompt exists.
9. PRF is preferred but never assumed from browser name or server flag; capability is
   verified for the actual credential.
10. Unsupported PRF falls back to split local unlock, not failure or password-derived
   encryption.
11. High-security mode removes the local automatic envelope and fails closed if PRF
    is unavailable.
12. New-device password login alone cannot join the vault.
13. Recovery material is client-held; operator recovery is impossible by design.
14. OPAQUE is deferred and must not be partially/custom implemented.
15. v1 financial ciphertext is reset before MVP, not migrated.

## Terminology

| Name | Meaning | Storage |
|---|---|---|
| `VMK` | 32-byte random vault master key | plaintext only in unlocked client memory; wrapped envelopes persist |
| `K_local` | VMK-derived AES key for records | unlocked memory only |
| `K_sync` | VMK-derived AES key for snapshots | unlocked memory only |
| `K_check` | VMK-derived sentinel/check key | unlocked memory only |
| `LocalShare` | non-extractable HKDF `CryptoKey` for a trusted profile | local IndexedDB only |
| `ServerShare` | random 32-byte per-device share | encrypted server storage; transient client memory after auth |
| `PrfOutput` | credential-specific WebAuthn PRF result | transient client memory only |
| `K_wrap_device` | wrapping key from LocalShare + ServerShare | transient client memory only |
| `K_wrap_prf` | wrapping key from PrfOutput + ServerShare | transient client memory only |
| `R` | independent 32-byte Ed25519 recovery seed; not derived from VMK | user-held complete backup; transient client memory during setup/upgrade/recovery |
| recovery secret | BF2 representation of VMK + independent R + domain-separated checksum (ADR-013) | user-held only; never ordinary device metadata, QR delegation or backend |

## Required artifacts before integration

Create and review these files before connecting protocol code to production flows:

1. `docs/security/vault-v2-threat-model.md` — assets, boundaries, attacker matrix,
   abuse cases and residual risks.
2. `docs/security/vault-v2-browser-matrix.md` — exact Chrome/Edge/Safari/Firefox and
   desktop/mobile evidence for Web Crypto, passkey and PRF.
3. `docs/architecture/vault-v2-protocol.md` or the existing v2 guide — canonical
   encodings, labels, formats, limits and state machines matching ADR-012.
4. Version-controlled non-production test vectors for HKDF, AEAD, AAD, envelope and
   signature operations.
5. Data-inventory diff classifying every new field as secret, public key, ciphertext,
   identifier or operational metadata.
6. Failure matrix for offline, cancel, crash, timeout, tab race, quota, replay,
   corruption, stale revision and account switch.

**Gate 09B.0:** artifacts agree with ADR-012 and receive independent review. The
existing PRF-only protocol draft must be updated for split unlock before integration.

## Fixed cryptographic contract

### Vault hierarchy

```text
VMK = CSPRNG(32 bytes)

K_local = HKDF-SHA-256(VMK, vaultId, "budgetflow/local-records/v2")
K_sync  = HKDF-SHA-256(VMK, vaultId, "budgetflow/sync-snapshot/v2")
K_check = HKDF-SHA-256(VMK, vaultId, "budgetflow/key-check/v2")
```

### Standard wrapping key

```text
K_wrap_device = HKDF-SHA-256(
  LocalShare,
  salt=ServerShare,
  info=canonical("budgetflow/device-wrap/v1", accountBinding,
                 vaultId, keyId, deviceId)
)
```

`LocalShare` must be generated/imported as an HKDF `CryptoKey` with
`extractable=false` and only `deriveKey` usage. Do not emulate non-extractability by
storing base64 bytes.

### Passkey wrapping key

```text
K_wrap_prf = HKDF-SHA-256(
  PrfOutput,
  salt=ServerShare,
  info=canonical("budgetflow/passkey-wrap/v1", accountBinding,
                 vaultId, keyId, deviceId, credentialId)
)
```

### AEAD rules

- AES-256-GCM through Web Crypto;
- new random 96-bit nonce for every encryption under a key;
- canonical versioned header authenticated as AAD;
- domain, account/workspace, vault, key, purpose and object identifiers bound in AAD;
- authenticate before parse; validate complete plaintext before mutation;
- reject unknown version/suite/critical fields and malformed encodings;
- enforce limits before base64 decode, allocation, decrypt or JSON parse;
- no application-authored crypto primitives or elliptic-curve arithmetic.

### Sensitive-memory rules

- no VMK/share/PRF/derived key in React state, Zustand, TanStack Query, URL, DOM,
  localStorage, sessionStorage, telemetry, errors, screenshots or test snapshots;
- use scoped byte buffers and `finally` cleanup; overwrite owned buffers where
  practical, while documenting that JavaScript GC gives no perfect erasure guarantee;
- keep operational keys non-extractable after initial envelope creation/recovery;
- use generation/abort tokens so work started before lock cannot commit afterward.

## Target persistence contracts

### Client v2 metadata

```text
VaultMetadataV2 {
  schemaVersion: 2
  cryptoVersion: 2
  cryptoSuite: "HKDF-SHA256/AES-256-GCM"
  accountBinding
  vaultId
  activeKeyId
  deviceId
  unlockMode: "split-local" | "passkey-prf"
  localShare: CryptoKey?              // only split-local
  deviceEnvelopeHeader
  wrappedVmkCache?                    // ciphertext only
  sentinel
  cutoverMarker: "v2-reset-complete"
}
```

Never index secrets or financial fields. Confirm actual browser structured-clone
behavior for non-extractable HKDF `CryptoKey` on every supported browser.

### Server tables

Prefer separate, narrowly owned records rather than adding ambiguous fields to the
current opaque snapshot row:

```text
vault_keysets
  vault_id, workspace_id, active_key_id, protocol_version, created_at, rotated_at

vault_devices
  id/device_id, vault_id, display_name, status,
  unlock_mode, credential_id?, agreement_public_key?, signing_public_key,
  encrypted_server_share, server_share_key_version,
  wrapped_vmk, envelope_header,
  created_at, last_used_at, revoked_at

webauthn_credentials
  credential_id, user_id, public_key, sign_count, transports,
  backup_eligibility/state where required, created_at, revoked_at
```

Constraints:

- workspace/vault/device uniqueness and foreign keys;
- cascade/restrict behavior explicitly tested for account deletion;
- `ServerShare` encrypted with versioned infrastructure key management;
- never return another workspace's share/envelope;
- never log serialized credential responses, shares or envelopes;
- audit events contain IDs/action/result only, not crypto payloads.

## API surface

Exact paths may follow existing conventions, but semantics are mandatory:

### Passkey

- create registration options/challenge;
- verify registration;
- create authentication options/challenge;
- verify authentication and establish the normal session;
- register/revoke/list credentials.

Validate RP ID, origin, challenge, type, user handle, user presence, user verification,
expiry and one-time use. Handle zero/non-monotonic counters according to WebAuthn
guidance rather than blindly rejecting synced passkeys. Use a maintained WebAuthn
library after dependency/security review; do not parse attestation CBOR manually.

### Vault devices and envelopes

- bootstrap first device/keyset after fresh authentication;
- fetch the authenticated device's envelope plus transient `ServerShare`;
- register pending device enrollment;
- approve/complete/cancel enrollment;
- list and revoke devices;
- rotate keyset/envelopes;
- fetch/push opaque snapshot with CAS revision.

Every challenge/enrollment is random, short-lived, single-use, user/vault/device-bound
and rate-limited. Error responses do not reveal whether another user's device exists.
The envelope/share endpoint additionally requires server-verified recent interactive
authentication. Refresh-token rotation must preserve the original authentication
time and cannot manufacture freshness. Add a distinct step-up-required response.

## State machines

### Standard recognized-browser login

```text
logged_out
  → authenticating
  → authenticated_locked
  → fetch envelope + ServerShare
  → load LocalShare
  → derive K_wrap_device
  → authenticate/decrypt VMK envelope
  → verify sentinel
  → derive vault keys
  → hydrate
  → authenticated_unlocked
```

Any crypto/context/hydration error ends in `authenticated_locked` or fail-closed
error. Never initialize a new vault merely because an expected envelope fails to
decrypt.

A refresh-only bootstrap may enter a limited `authenticated_locked` state, but cannot
follow the share-fetch transition. Financial routes remain unavailable until the user
performs one fresh password or passkey authentication.

### Passkey login

```text
logged_out
  → request challenge + PRF input
  → system passkey ceremony
  → split client result:
       server allowlist DTO (no PRF result)
       client-only PrfOutput
  → server verifies and establishes session
  → receive exact ServerShare/envelope
  → derive K_wrap_prf
  → verify/decrypt/derive/hydrate
  → authenticated_unlocked
```

Cancel, missing PRF result or credential mismatch must not loop. In standard mode the
UI may explicitly fall back to password login plus local split unlock. High-security
mode remains locked and offers retry/recovery.

### First vault bootstrap

```text
authenticated account with no vault
  → generate VMK/vaultId/keyId/deviceId
  → generate LocalShare
  → obtain new ServerShare
  → derive wrapping key
  → create VMK envelope + sentinel
  → atomically commit server keyset/device and local metadata
  → create recovery representation
  → confirm recovery possession
  → derive keys and open empty vault
```

Use an idempotency key and explicit bootstrap state so a crash cannot create two
keysets or an unrecoverable half-initialized vault.

### Lock/logout

```text
unlocked
  → stop accepting financial mutations
  → complete or abort already-started atomic encrypted writes
  → invalidate generation / cancel sync and hydration
  → clear financial and import memory
  → release ServerShare, PRF, VMK and derived keys
  → close DB and broadcast lock
  → revoke auth only for logout/timeout policy
```

Do not perform whole-database encryption here. Do not depend on network availability
or unload callbacks.

### New device

After account authentication, absence of a valid local/PRF envelope produces a clear
"new device" state, not a new empty vault. A synchronized passkey may authenticate
the account but cannot reuse another device's VMK envelope. Vault access requires QR
enrollment or recovery.

## Work breakdown

### 09B.1 — Reconcile current partial implementation

1. Inventory every uncommitted v2 file and test before editing.
2. Preserve correct VMK/HKDF/AAD/cutover work.
3. Replace PRF-only assumptions with split-unlock ports and state.
4. Update the v2 implementation guide to match ADR-012.
5. Keep changes isolated from unrelated owner files and existing dirty worktree edits.

**Gate:** reviewer maps each partial file to keep/change/remove with no silent loss of
work outside the current change.

### 09B.2 — Browser and authenticator spike

1. Define the supported MVP browser/OS matrix.
2. Test HKDF `CryptoKey` structured clone across restarts.
3. Test passkey registration/authentication on each platform.
4. Test PRF enablement and authentication result on the actual credential.
5. Verify one ceremony can provide auth assertion and PRF result.
6. Test synced versus device-bound passkeys and document provider dependency.
7. Verify failure/cancel/timeout and missing-PRF behavior.
8. Do not infer PRF from user agent or server capability.

**Gate:** full split-local proof on every supported browser; PRF proof on browsers
advertised as PRF-capable. Firefox/non-PRF fallback is explicitly exercised.

### 09B.3 — Pure protocol module

1. Define immutable constants, byte encodings and canonical serialization.
2. Implement VMK generation and domain-separated derivation.
3. Implement LocalShare generation and split wrapping-key derivation.
4. Implement passkey wrapping-key derivation.
5. Implement versioned VMK, record, sentinel and snapshot envelopes.
6. Centralize all AAD construction.
7. Implement signature verification and previous-envelope hashing.
8. Create fixed vectors and property tests.
9. Remove/forbid direct passphrase-to-record and passphrase-to-snapshot paths in v2.

Tests cover roundtrip, Unicode, boundary sizes, bit flips, truncation, nonce changes,
swapped IDs/accounts/collections/devices, invalid versions, extra critical fields,
wrong shares, wrong PRF, signature substitution and downgrade attempts.

**Gate:** vectors reviewed by a second implementer; protocol code has no HTTP, React,
Dexie or Zustand dependency.

### 09B.4 — Server split-share/device persistence

1. Add versioned schemas and migrations.
2. Implement infrastructure encryption for ServerShare.
3. Add repository ports and workspace-scoped implementations.
4. Implement idempotent bootstrap.
5. Implement authenticated envelope/share fetch.
6. Enforce recent interactive `auth_time`/`amr`; reject refresh-only/old sessions and
   test that refresh cannot extend authentication freshness.
7. Implement device list/revoke and account-deletion cascades.
8. Add DTO size/format allowlists and rate limits.
9. Ensure snapshot API rejects unsupported v1 after cutover.

**Gate:** PostgreSQL integration tests prove workspace isolation, authorization,
idempotency, encrypted-at-rest share storage, deletion and absence of secrets in logs.

### 09B.5 — Client split unlock and IndexedDB v2

1. Create a new account-scoped v2 database/schema.
2. Store LocalShare as non-extractable HKDF CryptoKey.
3. Replace persistence passphrase API with injected `K_local`/vault session.
4. Implement bootstrap and recognized-login state machines.
5. Bind all records to account/vault/key/collection/record context.
6. Preserve atomic encrypted writes and strict validators.
7. Add generation/abort handling around writes, hydration and account switch.
8. Separate lock, logout, local wipe, device revoke and account delete.
9. Remove vault-password UI only after fallback/recovery tests pass.

**Gate:** raw storage contains no business plaintext; copied local DB without an
authenticated ServerShare cannot unwrap VMK; cross-account/tab races fail closed.

### 09B.6 — Passkey authentication and PRF envelope

1. Integrate a reviewed WebAuthn library server-side.
2. Add client registration/login ceremonies.
3. Request and feature-detect PRF for each credential.
4. Build the server assertion DTO by explicit field allowlist.
5. Keep PRF result solely in a client-local scoped variable.
6. Create/rotate the passkey VMK envelope only after a successful PRF roundtrip.
7. Offer passkey as preferred login where usable.
8. Implement high-security enable/disable with recent verification and recovery check.
9. Delete the local fallback envelope and corresponding LocalShare atomically when
   high-security mode activates; delete the server-side local-envelope record too.

**Gate:** network capture contains no PRF/VMK/derived key; one gesture authenticates
and unlocks; missing PRF takes the explicit standard fallback and never downgrades
high-security mode.

### 09B.7 — Recovery and device enrollment

1. Generate 256-bit recovery representation locally with checksum.
2. Implement print/download/QR display without telemetry or persistent UI state.
3. Require possession confirmation before declaring recovery configured.
4. Restore on a clean profile and create new split/PRF envelope.
5. Implement short-lived single-use QR enrollment if retained in MVP scope.
6. Bind enrollment transcript to both device identities and ephemeral public keys.
7. Implement key confirmation before activating the device.
8. Implement device revocation and explain that cached old data cannot be remotely
   erased.
9. Provide full VMK rotation for suspected recovery/device compromise or explicitly
   document it as a release blocker rather than pretending revocation rotates keys.

**Gate:** clean-profile recovery succeeds; changed word, wrong account/vault,
corruption, expired QR and revoked device create no partial state.

### 09B.8 — Automatic opaque sync

1. Encrypt complete validated snapshots with `K_sync`.
2. Remove sync encryption-password dialogs.
3. Sign envelope and verify signer before decrypting.
4. Preserve CAS conflict handling and explicit overwrite confirmation.
5. Track previous hash/high-water mark per account/vault.
6. Reject known rollback/replay and revoked signers.
7. Run background sync only while vault is unlocked.
8. Cancel queued work on lock/account switch.
9. Use bounded retry only for transport failures.
10. Do not echo ciphertext unnecessarily or log envelopes.

**Gate:** two-browser E2E covers push, pull, conflict, overwrite, tamper, replay,
revocation and ciphertext-only request bodies.

### 09B.9 — Destructive v1 cutover

1. Inventory exact legacy IndexedDB names and sync keys.
2. Confirm no external user has a preservation commitment.
3. Record non-sensitive server v1 row/object counts.
4. Freeze/reject v1 sync writes.
5. Delete only v1 server vault ciphertext and exact associated blob objects.
6. Preserve auth, users, workspaces, permissions, consent, invite codes, dictionaries
   and admin configuration.
7. Client closes cross-tab handles and deletes only allowlisted v1 databases/keys.
8. Write cutover completion only after deletion verification.
9. Failure stays locked and retryable; never create half-initialized v2.
10. Execute the reset twice in a production-like restore to prove idempotency.
11. Save commands, versions, counts and reviewer sign-off without contents/secrets.

**Gate:** two rehearsals pass; v1 clients cannot write afterward; preserved tables are
proven intact. Production execution needs explicit per-environment owner approval.

### 09B.10 — UX, accessibility and copy

1. Remove everyday "vault password" language.
2. Default experience shows one password login or one passkey button.
3. Explain "trusted browser" without cryptographic jargon.
4. New-device screen offers recovery/approval instead of creating an empty vault.
5. Make recovery and passkey flows keyboard/screen-reader accessible.
6. Do not put recovery words in live regions or screenshots.
7. Explain standard versus high-security mode and irreversible recovery loss.
8. Warn about unsynced changes for wipe/revoke/rotation.
9. Keep lock/logout/wipe/revoke/delete labels and consequences distinct.
10. Update Polish and English legal/privacy/security copy only after behavior passes.

**Gate:** desktop/mobile, keyboard-only and both-locale walkthroughs pass without a
second routine vault prompt.

### 09B.11 — Independent security verification

Required evidence:

- all unit/integration/build/lint/E2E gates;
- standards vectors plus mutation/property tests;
- passkey challenge replay/origin/RP/user-verification tests;
- network capture proving no VMK, LocalShare, PRF or derived keys;
- raw IndexedDB/web-storage/cache inspection;
- backend DB inspection proving ServerShare at-rest encryption;
- backend-only decryption attempt fails;
- profile-only logged-out decryption attempt fails without ServerShare;
- copied profile with a refresh cookie cannot retrieve ServerShare or unlock without
  fresh interactive authentication;
- password/JWT on a new browser does not unlock;
- cross-account, collection, record, vault and device substitution fails;
- lock/write/hydration/tab/account-switch race tests;
- CSP/XSS tests in locked and unlocked states;
- recovery and total-loss behavior from a clean profile;
- dependency/SBOM review for WebAuthn/crypto additions;
- destructive-cutover rehearsal evidence;
- explicit review of public security claims.

Reviewer must answer:

1. Can backend state or an account credential alone derive VMK?
2. Is ServerShare ever persisted client-side or logged?
3. Can refresh/session bootstrap manufacture the freshness needed to obtain it?
4. Can an unfiltered WebAuthn result leak PRF output?
5. Can profile-only data unlock after logout without fresh interactive authentication?
6. Can authenticated new browser create/replace a vault instead of entering recovery?
7. Can a weaker path bypass high-security mode?
8. Can pre-lock work commit after keys/stores are cleared?
9. Can server rollback be detected when a checkpoint exists?
10. Did reset preserve every excluded control-plane record, and does public copy state
    malicious-frontend/recovery limitations?

**Final gate:** zero unresolved P0/P1 or high/critical findings; all mandatory gates
have dated reproducible evidence.

## Rollout order

1. Merge reviewed protocol contracts and tests without activating v2.
2. Deploy server schemas/endpoints dark with v1 still functional.
3. Complete split-local flow on every supported browser.
4. Complete passkey/PRF and recovery flows.
5. Rehearse reset against production-like backup twice.
6. Deploy server version gate rejecting new v1 writes.
7. Execute approved server reset.
8. Release v2 client cutover and monitor failures without secret logging.
9. Enable automatic sync after successful v2 bootstrap/unlock.
10. Stop rollout rather than falling back to password-derived encryption.

Rollback before destructive reset may restore v1 normally. After reset, an encrypted
infrastructure backup may restore operational state only under the approved runbook;
it does not create a promised user-facing migration. Never mix restored v1 ciphertext
with a v2 client.

## Definition of done

- ADR-012 and the implementation guide match runtime behavior.
- Standard recognized browser unlocks after one account authentication using split
  local/server shares.
- Supported PRF credential authenticates and unlocks in one ceremony.
- High-security mode has no automatic local VMK envelope.
- New browser requires PRF authority, trusted-device enrollment or recovery.
- Local records and sync use different VMK-derived keys.
- All durable financial data remains encrypted at rest.
- Sync has no password prompt and backend receives ciphertext only.
- Recovery works from a clean profile; operator recovery remains impossible.
- v1 financial stores are removed without control-plane loss.
- all compatibility, security, accessibility and cutover gates have evidence.

## Required handoff

- protocol spec, vectors, threat model and compatibility matrix;
- schema/API and data-inventory diff;
- implementation file map and residual-risk register;
- network/storage/database inspection artifacts;
- browser/device test results;
- cutover commands and before/after counts;
- exact build/test/lint/E2E commands and results;
- independent review with every finding dispositioned;
- deployment/rollback runbook and named owner.
