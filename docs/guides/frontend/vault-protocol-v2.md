# Vault protocol v2

> **Naming compatibility:** Every `budgetflow/...` value below is an immutable
> legacy protocol domain under ADR-015. Renaming it would break existing derived
> keys, signatures or persisted data; it is not current product copy.

This document is the implementation contract for the client-side v2 protocol.
It deliberately describes wire-visible metadata without describing or storing
secret key material.

## Key hierarchy

The first trusted client generates `VMK` as 32 random bytes from Web Crypto.
HKDF-SHA-256 derives three non-extractable AES-256-GCM keys using the vault ID as
the salt and a fixed purpose label as `info`:

| Key | Label | Purpose |
| --- | --- | --- |
| `K_local` | `budgetflow/local-records/v2` | IndexedDB records |
| `K_sync` | `budgetflow/sync-snapshot/v2` | Synchronization snapshots |
| `K_check` | `budgetflow/key-check/v2` | Authenticated sentinel |

## Split unlock

The standard trusted-browser fallback combines two values:

- `LocalShare`: a non-extractable HKDF `CryptoKey` stored only in the
  account-scoped IndexedDB metadata store;
- `ServerShare`: a random 32-byte per-device value stored encrypted at rest by
  the backend and returned only after recent interactive account authentication.
  Refresh/session bootstrap is insufficient. It is never persisted by the client.

The client derives the device wrapping key with HKDF-SHA-256 using
`LocalShare` as input key material, `ServerShare` as salt and canonical account,
vault, key and device context under `budgetflow/device-wrap/v1` as `info`. The
wrapping key opens a versioned AES-256-GCM VMK envelope. Backend state alone
lacks `LocalShare`; a logged-out copied profile alone lacks `ServerShare`.

Where the actual WebAuthn credential supports PRF, the preferred envelope uses
the credential's client-only PRF output instead of `LocalShare`, combined with
the same per-device `ServerShare` and `budgetflow/passkey-wrap/v1` context. The
authentication DTO must be constructed from an explicit allowlist and must not
send the PRF output; an unfiltered `PublicKeyCredential.toJSON()` is forbidden.

VMK, LocalShare, PRF output and all derived key material remain client-only.
The ordinary account password, password hash and JWT are never KDF inputs.
The public PRF input is stable across VMK rotations (account/workspace/vault/device)
so a rotated passkey envelope remains unlockable; the rotating `keyId` remains
bound in the `K_wrap_prf` context and authenticated envelope AAD.

Standard VMK rotation writes the new device-wrap envelope and, when the existing
credential still completes PRF, a second passkey-wrap envelope in one server
transaction. If the optional PRF ceremony is cancelled or unavailable, rotation
continues through split unlock and retains only the device-wrap envelope. This
fail-soft behavior is forbidden in high-security mode, where rotation is PRF-only.

## Canonical encoding and AAD

Objects are serialized as JSON after recursively sorting object property names;
array order is preserved. Protocol version `2` and suite
`HKDF-SHA256/AES-256-GCM` are mandatory. Record AAD binds account, workspace,
vault, key, collection and record IDs. Snapshot AAD additionally binds revision,
previous envelope hash, creating device, timestamp and nonce. Unknown versions,
malformed base64, context substitution and size-limit violations fail closed.

AES-GCM uses a fresh 96-bit nonce per encryption. Plaintext is limited to 5 MB,
ciphertext to 5 MB plus the GCM tag, and a serialized snapshot to 6 MB.

## Snapshot chain

The signed input is:

```text
budgetflow/snapshot-signature/v2 | canonical(header) | ciphertext
```

The content hash is SHA-256 over the complete canonical envelope. A client keeps
the highest accepted revision and its envelope hash. A lower revision is a
rollback; the same revision with another hash is a replay; a higher revision
must point to the retained hash. A newly recovered client cannot infer freshness
from the server alone and must establish a checkpoint through recovery or a
trusted device.

Once the vault is unlocked, changes to financial stores schedule a debounced
opaque sync automatically. The coordinator uses the encrypted-session keys
only while unlocked, submits the next CAS revision, and retains the dirty
marker after a failure. A remote-newer or CAS-conflict result never causes an
automatic overwrite; the settings screen requires an explicit restore or
overwrite confirmation. Manual sync uses the same coordinator.

## Cutover

The pre-MVP reset accepts an explicit allow-list of legacy database names and
storage keys. It never wildcard-deletes browser storage, writes the cutover
marker before deletion verification, or touches account/control-plane data.
Repeated execution is idempotent. A blocked open handle leaves the marker unset
and requires the caller to close other tabs before retrying.

## Compatibility and residual risks

The supported baseline is a browser with Web Crypto AES-GCM/HKDF, IndexedDB
structured cloning of a non-extractable HKDF `CryptoKey`, and the standard split
unlock. Passkey PRF is a preferred enhancement, not a baseline requirement.
Availability is verified for the actual credential; browser names and server
capability flags cannot silently select or downgrade the protocol.

High-security mode deletes the automatic local envelope after a successful PRF
roundtrip and recovery confirmation, together with its corresponding LocalShare.
It never recreates the weaker fallback automatically. A synchronized passkey may
authenticate the account but cannot reuse another device's bound VMK envelope. A
new browser needs recovery or trusted-device enrollment.

VMK rotation is an explicit recovery-protected operation, not part of routine
unlock. Standard rotation derives a new device envelope from the existing
LocalShare and freshly obtained ServerShare. High-security rotation performs a new
credential-specific PRF ceremony and uses only `K_wrap_prf`; it fails closed when
the ceremony is cancelled or PRF is unavailable. In both modes the client first
authenticates and re-encrypts every validated record in one Dexie transaction,
keeping a pending journal whose VMK material is authenticated ciphertext under
both the old and new local keys. The server then atomically changes the keyset,
deletes opaque old snapshots and envelopes, retains the initiating envelope and
revokes all other devices. The journal is removed only after idempotent server
confirmation, so a crash or transport failure is retryable without storing a
plaintext VMK.

An operator who can deploy arbitrary JavaScript to the origin can still
exfiltrate plaintext after unlock. This implementation does not claim to
eliminate that operational trust boundary.
## Client implementation contract

The public client boundary is `client/src/shared/adapters/vault-protocol/vault-protocol.ts`. It has no HTTP, React, IndexedDB or server imports. `vault-session.ts` owns only in-memory derived-key references and a generation token; lock invalidates the generation before closing persistence.

`LocalShare` is created from fresh random bytes and immediately imported into Web Crypto as HKDF with `extractable=false` and `['deriveKey']`. The raw bytes are not persisted. `ServerShare` is accepted only as a transient 32-byte value returned by a fresh-authenticated server call. `wrapVmk` stores only the authenticated envelope.

The client must serialize WebAuthn explicitly. Allowed assertion fields are `id`, `rawId`, `type`, and the required response buffers (`clientDataJSON`, `authenticatorData`, `signature`, and optional `userHandle`) encoded as base64url. Registration has a separate allowlist. The client must not call `PublicKeyCredential.toJSON()` and must not include extension results or PRF output in network DTOs.

Account passkey login is a separate public flow at `/auth/passkey/options` and
`/auth/passkey/verify`. It verifies the allowlisted assertion with the stored
credential public key, one-time login challenge, expected origin, RP ID and
required user verification, then issues a normal account session with
`amr=webauthn`. For a recognized device, the options response contains only the
public account/workspace/vault/device context needed to derive the stable PRF
salt. The same WebAuthn ceremony requests PRF, and the client keeps the result
in a transient in-memory handoff until the authenticated bootstrap consumes it;
no second routine passkey prompt is shown. If that credential has no PRF,
Standard mode uses the explicit LocalShare + ServerShare fallback. Password
login likewise uses that split path without prompting for a vault passkey.
High-security mode has no such fallback and remains locked when the one-ceremony
PRF result is unavailable. Account authentication alone does not authorize
another device's vault envelope; vault access still requires the local envelope,
a credential-specific PRF envelope, trusted-device enrollment or recovery.

## Envelope invariants

Every envelope rejects unknown versions/suites/fields, validates size before decoding, authenticates AAD before parsing JSON, and binds account, workspace, vault, key, purpose and record/device identity. VMK is encoded as base64 only inside the encrypted VMK envelope payload; it is never sent to the server in plaintext.

The server response containing ServerShare is one-shot application memory. Refresh, background bootstrap and token rotation preserve the original interactive `authTime` and cannot obtain ServerShare.

## Recovery representation

The client recovery helper represents the complete random 256-bit VMK as 64 hexadecimal characters followed by a 32-bit SHA-256 checksum (72 hexadecimal characters total). It is an encoding and possession proof, never a password-KDF input. `restore` validates length and checksum before returning VMK. The server receives neither the recovery code nor plaintext VMK. During initial setup the client may render this canonical value as a transient local QR SVG for offline copying; the SVG is not persisted, logged or transmitted.

Trusted-device enrollment uses a separate QR transcript. The new browser creates a
one-time request containing only account/workspace/vault/key/device context and an
ephemeral P-256 ECDH public key. The unlocked trusted browser derives an
ECDH/HKDF-SHA-256 transfer key, encrypts the VMK with AES-256-GCM and signs the
ciphertext with its device signing key. The response binds both device IDs,
`requestId`, the key context, nonce, ephemeral public key and signer key. The new
browser verifies the signer against the public key returned by the device control
plane before decrypting. The server repeats that check against the active device
row during enrollment finalization. VMK and ServerShare never enter the QR text in
plaintext; the VMK exists only in the unlocked approving session and is cleared
after the response is created. Unsupported camera/browser capability falls back to
recovery rather than weakening the protocol.

Before enabling high-security mode, the client restores the supplied recovery
code and compares that VMK with the VMK opened from the active device envelope.
Only the boolean confirmation and the new opaque passkey envelope cross the
network.
