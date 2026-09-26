# ADR-013: Independent recovery authority and delegated enrollment transcripts

Date: 2026-09-12. Status: **Accepted — implementation in progress**.
Scope: amends the recovery representation and enrollment authorization in ADR-012;
does not replace split unlock, optional PRF, local/sync encryption or account auth.
Acceptance does not imply implementation or security sign-off.

## Why this is a decision, not a missing conditional

The existing recovery code encodes only the VMK and a checksum. Every unlocked
trusted device necessarily knows that VMK. Consequently, a recovery authorization
signing key derived from VMK, or encrypted under a VMK-derived key in downloadable
metadata, can also be recovered by such a device. Revocation checks on the old
device signing key do not prevent it from using that separate recovery authority
if it also has fresh account authentication. This is a consequence of the current
key ownership model, not a weakness repaired by a different hash or stronger KDF.

The PostgreSQL enrollment path currently accepts an existing vault only with an
old-device approval. The clean-profile recovery caller has no such device. Simply
removing the approval check would make password login sufficient for enrollment,
violating ADR-012. A typed checksum is not backend-verifiable proof of possession.

## Decision

Keep the random 32-byte VMK. Generate a separate, independent random 32-byte
recovery authority seed `R`. Keep **one user-facing recovery code** containing both
secrets, version information and an error-detection checksum. Neither secret nor a
private recovery signing key is sent to the server, stored in ordinary device
metadata or included in the standard/passkey VMK envelopes. QR device transfer
transmits VMK only, never R.

The server stores only the recovery verification public key, bound to the current
vault/key version. Ed25519 is a candidate for this authority because its standard
defines a 32-byte private seed and published test vectors; use a maintained,
reviewed implementation rather than custom elliptic-curve arithmetic. This is a
primitive selection, not a claim that RFC-8032 validates our full protocol.
[RFC 8032](https://www.rfc-editor.org/rfc/rfc8032.html).

If a KDF is used for signing-key domain separation, freeze its salt, context,
labels and encoding. HKDF provides an application-context info input; it does
not make two parties with the same root secret independent.
[RFC 5869](https://datatracker.ietf.org/doc/html/rfc5869).

The backup codec is `BF2:` followed by exactly 136 lowercase hexadecimal digits:
VMK (32 bytes), independent R (32 bytes), checksum (4 bytes). The checksum is the
first four bytes of SHA-256 over UTF-8 `budgetflow/recovery-backup/v2` followed by
one zero byte and VMK || R. Total length: 140 ASCII characters. No trimming,
case normalization or legacy-code coercion is allowed. The checksum detects
accidental damage; it is not an authorization MAC.

Browser Ed25519 uses pinned `@noble/curves` 2.4.0, direct R as the RFC-8032 seed,
and strict RFC-8032 verification (`zip215: false`). This does not require native
browser Ed25519 support. See the [maintainer's release](https://github.com/paulmillr/noble-curves/releases/tag/2.4.0).
Historical audits do not constitute an independent audit of our protocol or every
line of this exact release. Canonical authorization transcript bytes and backend
verification parity still require verified vectors before implementation sign-off.
Do not silently treat a legacy VMK-only code as an independent authority.

### Recognized-profile recovery authority registration transcript

Registration uses two signatures over identical UTF-8 JSON array bytes, in this
exact order: `[domain, version, cryptoSuite, accountId, workspaceId, vaultId,
keyId, deviceId, challenge, expiresAt, signingPublicKey, recoveryPublicKey]`.
Domain is `budgetflow/recovery-authority-registration/v2`, version is integer 2,
suite is `HKDF-SHA256/AES-256-GCM`, challenge is 32 random bytes encoded as
43-character unpadded base64url, expiry is server-owned ISO UTC with milliseconds,
and the device public JWK is the exact stored JSON string, not reserialized JSON.
Recovery public key and signatures are lowercase hex (32 and 64 bytes respectively).
Expiry is exactly 60 seconds after creation. No normalization is accepted.

The active device signs with ECDSA P-256/SHA-256 (64-byte IEEE-P1363 signature),
and the independent recovery seed signs with Ed25519. Both are mandatory: a new
recovery-key possession proof alone does not grant account/vault mutation rights.
Fresh account authentication is checked before and after cryptographic awaits.
The backup-confirmed DTO flag is a UX assertion, not cryptographic authorization.

PostgreSQL commit uses the common vault advisory transaction lock and rechecks
the stored transcript, expiry, unused challenge, current key/suite/protocol and
current non-revoked device public key/status. Challenge consumption and public
authority installation are atomic; an existing authority cannot be overwritten.
The backend and browser use the same pinned strict Noble Ed25519 verifier. A
regression vector rejects an identity/small-order forgery accepted by the locally
observed Node/OpenSSL verifier; native verification is not used for this authority.
These vectors cover registration, not the remaining enrollment transcripts.

### Separate authorization paths

The v2 finalize canonical UTF-8 JSON array is `[domain, 2, suite, purpose,
accountId, workspaceId, vaultId, keyId, newDeviceId, challenge, expiresAt,
newSigningPublicKey, oldDeviceIdOrNull, newEphemeralPublicKeyOrNull,
authorityBinding, deviceEnvelope, passkeyEnvelopeOrNull]`. Domain is
`budgetflow/enrollment-finalize/v2`; suite and nonce/expiry encodings match
registration. `purpose` is exactly `initial`, `trusted` or `recovery`.
For initial/recovery, authorityBinding is the recovery public key. For trusted
join it is lowercase SHA-256 hex of the exact canonical delegation message.
Envelope and JWK strings are never parsed/reserialized for signing. The encoded
message must not exceed 65,536 bytes, including UTF-8 expansion and JSON escaping.

The trusted delegation array is `[budgetflow/enrollment-delegation/v2, 2, suite,
accountId, workspaceId, vaultId, keyId, newDeviceId, challenge, expiresAt,
oldDeviceId, newSigningPublicKey, newEphemeralPublicKey]`. The server-generated
unique challenge is the request identity. An additional unsynchronized QR-only
request identifier cannot stand in for it. Finalize recomputes the delegation
digest; it cannot accept the supplied digest alone as proof. Public ephemeral
JWKs must be native-valid P-256 public ECDH keys, with no signing/private usages.

The new device signs the full finalize bytes in every path. Initial/recovery also
require the independent R signature over those same bytes. Trusted join requires
the old active device signature over delegation bytes. Current approver public
key/status, key version and authority are server-owned and rechecked atomically
at commit. The PostgreSQL v2 endpoints and browser orchestration now use these
exact codecs. Canonical byte vectors and actual P-256/strict Ed25519 proofs cover
initial setup, trusted join and recovery enrollment. This is not evidence that
financial recovery or the complete browser/device release matrix is finished.

1. Initial setup: fresh account auth, one-use setup challenge, unique workspace
   creation and local possession confirmation for the complete new recovery code.
2. Trusted-device join: server-issued challenge with expiry; old active device
   signs a narrow delegation binding account/workspace/vault/key, request ID,
   new device identity and its signing/ephemeral public keys. The new device signs
   the full finalize transcript containing the delegation digest and exact final
   envelope bytes. Verify both signatures. This binds final envelopes without
   adding another QR scan merely to ask the old device to sign those envelopes.
3. Recovery: fresh account auth plus signature under R's authority over the exact
   challenge, expiry, context, new signing key and finalized envelope transcript.
   No old device is required. VMK alone must not authorize this route.

Prepare must bind the claimed new keys and server-owned challenge context. Finalize
must atomically check expiry/current key version/current approver status, consume
the challenge, write pending device/envelopes and reject substitutions/replay.
Use the same vault transaction lock as rotation/revoke/sync. Recheck state after
cryptographic awaits in the memory implementation too. Confirmation activates only
the exact locally initialized pending device with its one-use confirmation.
Its signed UTF-8 JSON array is `[budgetflow/enrollment-confirm/v2, 2, suite,
accountId, workspaceId, vaultId, keyId, newDeviceId, challenge, expiresAt,
finalizeSha256Digest]`. The server stores the digest of the verified full finalize
bytes; challenge-only activation is unavailable. Final challenge writes check
expiry and the interactive-auth deadline against PostgreSQL `clock_timestamp()`;
a failed conditional write rolls back device/envelope writes as well. Browser
confirmation runs in local initialization before the public `unlocked` snapshot
or session-unlocked broadcast, avoiding routing/unmount and automatic-sync races.
The exact explicitly supplied approved signing key/device identity replaces stale
local pending metadata; ordinary unlock without a new key retains its old key.

A pending device may be replaced only after every consumed confirmation challenge
for that scoped device has expired, and only by another complete authorized v2
finalize. The common vault lock prevents a concurrent old confirmation from
activating a replaced binding. Active/high-security/revoked devices cannot be
replaced through this retry. The retired unsigned enrollment controller/provider
is no longer registered. Memory v2 enrollment deliberately fails closed until its
authority graph is unified; no fallback to the retired handler is allowed.

Recovery must restore actual encrypted records/snapshot, not just initialize an
empty database or parse a remote payload and discard it. Empty remote storage and
wrong recovery material are different states. All publication remains scoped.

### Upgrade and rotation

- Existing recognized browsers retain financial data. They generate R, present a
  replacement recovery code, confirm its external backup, and register the public
  authority with a fresh one-use signature from their current active device.
- Legacy codes remain recognizable for local upgrade validation but cannot bypass
  the new existing-vault authorization route. Users must be told that their old
  VMK-only backup is replaced. A clean profile with only a legacy code cannot gain
  stronger authority retroactively without a trusted device or an explicitly
  accepted weaker compatibility mode. No such weaker mode is proposed here.
- Rotation generates new VMK and R; confirm the new complete backup before local
  re-encryption or server commit. Commit the new public authority atomically with
  the keyset, envelopes and revocations. Journal only encrypted retry material;
  never persist R/plain backup just to reconstruct it later.
- Do not delete financial/account data as an implicit upgrade step. Any reset is
  a separately authorized cutover operation.

## Limits and user-visible consequences

Daily login remains unchanged: no second password, mandatory manager or hardware.
The recovery code changes format/length; copy/download/QR avoids manual entry.
Recognized pre-MVP users must save a replacement backup once. A device that knows
only VMK cannot reconstruct R after revocation. A device that copied the complete
recovery code can recover as its holder; rotate both secrets after compromise.
An active compromised device may authorize another device before revocation —
independent R does not remove that inherent delegation risk.

This protects confidentiality against backend storage/control-plane compromise;
it does not protect against malicious JavaScript served by an administrator,
XSS on an unlocked client, endpoint malware or availability/rollback on a clean
profile without an independent trusted checkpoint. Do not promise 100% security.

## Financial restoration implementation follow-up

Clean-profile recovery and trusted join now stage an authenticated snapshot before
enrollment mutation and publish its validated financial records through encrypted
replacement after signed device confirmation, before the public unlocked state.
An authenticated complete existing local vault is preserved, including unsynced
changes, rather than overwritten by an older remote snapshot. Lost device
credentials use a fresh signing identity, never replace an active binding, and
persist the new browser ID only after restoration/initialization succeeds.

Native metadata persists `requiresRemoteRestore` until scoped completion. Failed
or interrupted restoration therefore cannot turn a later ordinary login into an
empty unlocked vault. A recovered clean profile requires an available authentic
snapshot; absence is not evidence that financial history is empty. Initial setup
is the only enrollment path that intentionally initializes a new empty vault.

Without an independent retained checkpoint, clean-profile restore authenticates
the snapshot but cannot detect every replay of an older authentic snapshot. Known
local revision/hash checkpoints are retained and enforced; missing intermediate
chain links still reject rather than disabling fork checks. This is not a claim
of global rollback resistance or independent release approval.

## Approval

The product owner approved this decision on 2026-09-12, including one replacement
recovery code with an independent R and the one-time backup replacement for
existing recognized profiles. Recovery authority and enrollment transcript
implementation and independent review remain release blockers.
