# ADR-012: Client-Held Vault Master Key with Split Unlock and Optional Passkey PRF

**Date:** 2026-09-11  
**Status:** Accepted; implementation required before MVP release  
**Decision owner:** Product owner  
**Implementation authority:** [Session 09B](../plans/active/mvp-release/09b-device-bound-vault-and-sync-chain.md)  
**Supersedes:** the password-derived client key lifecycle in the implemented portions
of [ADR-003](./003-local-first-e2ee-architecture.md) and the passphrase-driven sync
mechanics permitted by [ADR-011](./011-mvp-local-first-opaque-sync-boundary.md)

## Context

The current application uses an account password plus a separate vault passphrase
that is stretched with PBKDF2 and directly becomes the local AES-GCM key. Sync asks
for an encryption password again. This gives good compartmentalization only when the
vault password is strong and unique, but creates substantial abandonment, reuse and
recovery risk.

The product requires all of the following:

- one ordinary sign-in unlocks the UI and financial vault on a recognized browser;
- passkey with PIN/biometric verification is preferred where WebAuthn PRF works;
- browsers without PRF remain usable without extra hardware, a password manager or
  another application;
- an account password, JWT, backend database or server-held value alone cannot decrypt
  financial data;
- durable data is encrypted continuously, not by an unreliable logout request;
- a high-security user can require passkey PRF and remove automatic local unlock;
- OPAQUE is deferred from MVP because its auth migration adds material release risk;
- pre-MVP v1 financial data is reset rather than cryptographically migrated.

Brave Sync is the conceptual reference for a client-generated high-entropy root
secret and explicit device joining/recovery. We do not copy Brave's cipher suite,
wire protocol or native OS storage assumptions. A web app does not have the same
privileged key-store interface as a native browser.

## Decision summary

BudgetFlow uses one random 256-bit Vault Master Key (`VMK`), generated on the client
and never sent to the backend in plaintext. Domain-separated local, sync and check
keys are derived from the VMK.

The VMK can be opened by independent versioned envelopes:

1. **Preferred:** WebAuthn passkey PRF output combined with a per-device server share.
2. **Default fallback:** a non-extractable local HKDF key combined with a per-device
   server share released after successful account authentication.
3. **Emergency:** a user-held recovery secret encoding the VMK plus checksum.

The ordinary account password remains an access-control credential only. It is never
an input to vault encryption. OPAQUE is outside MVP.

## Key hierarchy

### Vault keys

```text
VMK     = CSPRNG(32 bytes)
vaultId = CSPRNG identifier
keyId   = CSPRNG identifier

K_local = HKDF-SHA-256(VMK, salt=vaultId,
                       info="budgetflow/local-records/v2")
K_sync  = HKDF-SHA-256(VMK, salt=vaultId,
                       info="budgetflow/sync-snapshot/v2")
K_check = HKDF-SHA-256(VMK, salt=vaultId,
                       info="budgetflow/key-check/v2")
```

Labels, UTF-8 encoding, identifier encoding and output lengths are immutable protocol
constants. A key is used only for its declared purpose. Runtime AES keys are derived
as non-extractable `CryptoKey` values.

### Default split-unlock envelope

Every trusted browser profile creates:

```text
LocalShare = Web Crypto HKDF key generated from CSPRNG
             extractable=false
             usages=["deriveKey"]
```

`LocalShare` is stored as a structured-clonable `CryptoKey` in account-scoped v2
IndexedDB. Raw bytes are never exported, serialized by app code, logged or synced.

The backend creates a separate random 32-byte `ServerShare` for the exact `vaultId`
and `deviceId`. It releases the share only after recent interactive account
authentication and device-envelope authorization. Refresh-token rotation, restored
cookies, background session bootstrap and an old access token are insufficient. The
server records and validates authentication time and method (`auth_time`/`amr` or an
equivalent server-side record) without accepting client-asserted freshness.

```text
K_wrap_device = HKDF-SHA-256(
  IKM  = LocalShare,
  salt = ServerShare,
  info = canonical("budgetflow/device-wrap/v1", accountBinding,
                   vaultId, keyId, deviceId)
)

wrappedVMKDevice = AES-256-GCM(
  key       = K_wrap_device,
  nonce     = fresh random 96-bit value,
  plaintext = VMK,
  AAD       = canonical device-envelope header
)
```

Neither side alone can derive `K_wrap_device`:

- backend has `ServerShare` and the VMK envelope but not `LocalShare`;
- a logged-out copied profile has `LocalShare` and possibly the envelope but must not
  persist `ServerShare`;
- only the authenticated recognized browser receives both inputs.

`ServerShare` is sensitive defense-in-depth material despite being insufficient
alone. It is encrypted at rest, excluded from logs/analytics, returned through a
narrow authenticated endpoint and erased from client memory on lock.

### Preferred passkey PRF envelope

When the actual credential reports PRF support:

```text
PrfOutput = WebAuthn-PRF(credential, PrfInput)

K_wrap_prf = HKDF-SHA-256(
  IKM  = PrfOutput,
  salt = ServerShare,
  info = canonical("budgetflow/passkey-wrap/v1", accountBinding,
                   vaultId, keyId, deviceId, credentialId)
)
```

`PrfInput` is public metadata stable for the credential/device vault authority;
it deliberately excludes the rotating `keyId`, while the envelope context still
binds the current key version. `PrfOutput` never
crosses the network. The client must not send an unfiltered
`PublicKeyCredential.toJSON()` because WebAuthn Level 3 permits PRF results in that
serialization. Authentication DTOs use an explicit allowlist omitting PRF output.

One WebAuthn ceremony can authenticate the account, produce the client-only PRF
result, authorize release of `ServerShare`, unwrap the VMK and open the vault. No
second vault prompt is shown.

## Unlock profiles and downgrade rules

### Standard profile

- use passkey PRF when a verified supported credential exists;
- otherwise use authenticated `LocalShare + ServerShare` automatic unlock;
- account password or an ordinary passkey controls account authentication;
- recovery is required on a browser with neither a usable PRF envelope nor its local
  share.

The UI may call this a "trusted browser". It must not claim that `LocalShare` is
necessarily hardware-backed or physically device-bound.

### High-security profile

After a successful PRF roundtrip and recovery-secret confirmation, the user may enable
high-security mode:

- passkey PRF is required for vault unlock;
- automatic local-share VMK envelopes and the corresponding `LocalShare` are deleted
  locally, and the local-envelope record is deleted server-side;
- password authentication alone cannot unlock the vault;
- recovery remains the only non-passkey emergency path.

A server capability flag cannot downgrade this profile. If PRF becomes unavailable,
the vault stays locked and offers recovery; it does not recreate a local fallback.

## Authentication and lifecycle

Authentication and vault authority are separate:

- login grants UI/API access and authorizes retrieval of the matching `ServerShare`;
- `ServerShare` retrieval requires recent interactive password/passkey authentication;
  refresh-only session restoration cannot unlock the vault;
- passwords, password hashes, JWTs and refresh tokens are never KDF inputs;
- an authenticated new browser is not automatically a trusted vault device;
- `ServerShare`, token or account password without local/PRF input cannot unwrap VMK.

Recognized-browser login performs, in order:

1. authenticate the account;
2. set account/workspace persistence context;
3. retrieve the exact versioned envelope and `ServerShare`;
4. obtain PRF output or load `LocalShare`;
5. derive the wrapping key and authenticate/decrypt the VMK envelope;
6. verify the account-bound sentinel;
7. derive `K_local`, `K_sync` and `K_check`;
8. hydrate validated financial state;
9. expose financial routes only after the vault result is known.

Failures are atomic and fail closed. Authentication may succeed while a new device's
vault remains locked, but stale state from another account must never render.

On logout, timeout, account switch, manual/cross-tab lock or fatal error, the client:

- invalidates pending crypto, hydration and sync work using abort/generation control;
- drops `ServerShare`, PRF results, VMK and all derived/wrapping key references;
- clears financial stores and sensitive import state;
- closes the account-scoped database and broadcasts the lock;
- separately revokes/clears authentication as appropriate.

The app never relies on `beforeunload`, `pagehide` or a request to encrypt data. Every
durable financial write is encrypted before entering IndexedDB.

Closing the application destroys the in-memory share/key capability. On the next
launch, a refresh cookie may restore a limited account session if product policy
allows it, but it cannot retrieve `ServerShare` or open financial routes until fresh
interactive authentication succeeds.

## Persistent and server data

Backend may store:

- opaque account/workspace/vault/device identifiers;
- WebAuthn credential IDs, public keys, counters and required transports;
- encrypted-at-rest `ServerShare` values;
- versioned encrypted VMK envelopes and public authenticated headers;
- device status and creation/revocation timestamps;
- opaque sync snapshot, revision, ciphertext hash, size and timestamps.

Backend must never receive/store:

- plaintext VMK or derived vault keys;
- `LocalShare` or its raw bytes;
- WebAuthn PRF result or wrapping key;
- recovery secret;
- plaintext financial data, plaintext digest or business metadata.

## Envelope requirements

Every v2 envelope has a canonical authenticated header binding at minimum:

- protocol and crypto-suite version;
- account/workspace binding;
- `vaultId`, `keyId`, purpose and envelope type;
- `deviceId` and credential ID where applicable;
- collection and record ID for local records;
- revision, previous hash and creator device for sync;
- fresh nonce and creation time.

The header is AAD. Plaintext is used only after AEAD authentication and strict schema
validation. AES-GCM uses a fresh random 96-bit nonce for every encryption under a key.
Unknown versions, algorithms, critical fields and downgrades fail closed. Size limits
are checked before allocation.

## Sync and device joining

Snapshots use `K_sync`; the server remains an opaque compare-and-swap relay. Sync
never prompts for an encryption password.

Snapshots are signed by an enrolled device key and include the previous accepted
envelope hash. Clients retain a high-water mark and reject invalid/revoked signers,
same-revision hash changes, lower revisions and broken known chain links. This cannot
prove freshness to a completely new client using only a malicious server.

A new browser obtains VMK through QR enrollment from an unlocked trusted device or
the recovery secret. A synchronized passkey may authenticate the account, but its
presence alone does not authorize the new browser to reuse another device's
device-bound VMK envelope. The default `LocalShare` is never synchronized. Account
password or passkey authentication alone does not join the vault chain.

## Recovery

Vault creation generates a representation of the full 256-bit VMK plus checksum. A
24-word BIP39 representation is acceptable; it is not a human password or VMK KDF.

Recovery material is shown locally and never uploaded in plaintext. The user confirms
possession before sync is considered recoverable. Print/download/QR actions include
clipboard, cloud-folder and screen-sharing warnings. The secret never appears in
logs, analytics, crash reports or support bundles.

Loss of every usable envelope and recovery secret means permanent loss. Backend
password reset cannot bypass this property.

## Pre-MVP destructive cutover

There is no v1-to-v2 record migration. A reviewed cutover deletes:

- exact application-owned legacy `budgetflow-encrypted-financial-data` IndexedDB
  databases, including account-scoped names;
- associated legacy sync metadata/migration markers;
- v1 encrypted server vault snapshots.

It preserves users, workspaces, permissions, consents, invite codes, dictionaries and
admin configuration. It is version-gated, allowlisted, idempotent and rehearsed twice
with counts. Unknown future databases are never wildcard-deleted.

## Threat model

### Protected in isolation

- backend/database/blob-storage disclosure;
- account password disclosure on another device;
- JWT/refresh-token disclosure;
- `ServerShare` disclosure;
- logged-out profile disclosure without an authenticated current server share;
- ciphertext modification and record/cross-account substitution;
- authentication on an unenrolled browser without recovery/PRF authority.

### Residual risks

- A copied browser profile plus valid account access can reconstruct standard unlock;
  high-security mode exists for users rejecting this risk.
- Malware or same-origin XSS can read plaintext while the vault is open.
- An operator able to deploy arbitrary production JavaScript can exfiltrate plaintext
  or invoke local keys. Web E2EE cannot remove this boundary; strict CSP, dependency
  control, protected deployments, immutable artifact hashes and separation of duties
  are required.
- Necessary transport metadata remains visible.
- A malicious server can deny service. Integrity does not guarantee availability.

## Rejected and deferred alternatives

- **Permanent separate vault password:** rejected for target UX, retained as security
  comparison baseline.
- **VMK derived from account password:** rejected because the current server receives
  that password.
- **Local automatic key alone:** rejected; accepted fallback requires both local and
  non-persisted authenticated server shares.
- **Mandatory PRF:** rejected because browser/authenticator support varies.
- **OPAQUE in MVP:** deferred to a future ADR and vetted implementation.
- **Operator escrow:** rejected because any operator-held decryptor violates the
  privacy boundary.

## Consequences

Benefits:

- recognized users authenticate once and immediately use the vault;
- passkey users get one PIN/biometric ceremony;
- non-PRF browsers need no additional hardware/software;
- backend, password or profile alone is insufficient in the standard model;
- password changes do not require record re-encryption;
- sync no longer asks for an encryption password;
- high-security users can remove automatic local fallback.

Costs:

- split unlock, WebAuthn, recovery and device state add substantial complexity;
- standard unlock requires backend availability after logout;
- recovery loss is irreversible;
- compatibility/fallback paths need continuous testing;
- public claims must describe the boundary and may not say "100% secure".

## Release rule

ADR acceptance is not implementation evidence. MVP is blocked until every mandatory
Session 09B gate has reproducible evidence and no unresolved P0/P1 or high/critical
finding. Do not remove v1 code until v2 recovery, cutover and failure tests pass.

## References

- [Brave Sync v2](https://github.com/brave/brave-browser/wiki/Brave-Sync-v2)
- [Web Crypto key storage](https://www.w3.org/TR/WebCryptoAPI/#concepts-key-storage)
- [WebAuthn PRF](https://www.w3.org/TR/webauthn-3/#prf-extension)
- [RFC 5869 — HKDF](https://www.rfc-editor.org/rfc/rfc5869)
- [RFC 9807 — deferred OPAQUE reference](https://www.rfc-editor.org/rfc/rfc9807)
