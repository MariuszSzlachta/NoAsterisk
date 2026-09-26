# Vault v2 enrollment boundary

The MVP enrollment path is recovery-based. A new browser is never admitted by a
password login alone: it receives `enrollment-required`, restores the complete
client-held VMK from the recovery representation, creates a fresh non-extractable
LocalShare and fresh per-device ServerShare, and submits only the opaque device
envelope plus the device signing public key.
The server keeps the device in `pending` state until the client has locally
unwrapped and initialized the authenticated v2 database, then accepts a fresh,
single-use confirmation bound to the same challenge, vault, key and device.

The enrollment challenge is random, single-use, short-lived, bound to account,
workspace and device, and rate-limited through the authenticated endpoint. A retry
cannot consume a challenge twice. A failed recovery validation does not call the
enrollment endpoint. A successful enrollment does not replace another device's
envelope or create an empty vault for an existing keyset. A failed local
initialization never activates the pending device; retrying replaces only that
pending device record.

Initial-vault creation is additionally protected by the database-level unique
workspace-to-vault constraint. Concurrent first-device enrollment attempts are
therefore resolved atomically: one transaction creates the vault and the other
rolls back its challenge consumption and all partial rows, leaving a retryable
challenge rather than a second vault.

The trusted-device protocol is now implemented as a separate ciphertext-only QR
transport. The requesting device creates an ephemeral ECDH key and the unlocked
approving device encrypts the VMK under an ECDH/HKDF-derived AES-GCM key. The
response is signed by the approving device and includes both device identities,
the vault key context and a one-time request identifier. The server accepts the
new device's finalize request only when that signature matches an active device
in the same account/workspace/vault. The camera-driven two-browser UI and its
manual accessibility/E2E walkthrough remain release gates; recovery remains the
user-facing fallback until those gates are complete.

Recovery code generation, copy/download, transient QR rendering and possession
confirmation occur locally. The QR is generated from the canonical recovery
representation only for the active setup screen; neither the QR SVG nor the
recovery code is persisted, logged or sent to telemetry.
The code and VMK are never sent to the backend, placed in telemetry or written to
IndexedDB. Losing every usable envelope and the recovery code remains irreversible.

After standard device enrollment, settings can register a maintained WebAuthn
credential and create a credential-specific PRF envelope. The client verifies
the recovery VMK locally, performs a fresh PRF ceremony and sends only the
opaque envelope; the device-wrap envelope and LocalShare remain available as
the explicit standard fallback. High-security enablement is a separate
transition that removes that fallback after the same checks.

Device metadata can be listed and a device can be revoked through a fresh-authenticated
control-plane operation. Revocation prevents new ServerShare issuance and sync writes;
it cannot erase cached ciphertext from a device that is already offline. Recovery-based
VMK rotation is a separate, fresh-authenticated operation: the client re-encrypts all
records under a new VMK, keeps only an encrypted retry journal, and the server commits
the new keyset, removes old opaque snapshots/envelopes and revokes every other device
in one database transaction. The journal is cleared only after idempotent server
confirmation. High-security rotation uses only the verified credential PRF and never
falls back to LocalShare.
