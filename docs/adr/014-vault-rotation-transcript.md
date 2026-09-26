# ADR-014: Canonical dual-root vault rotation transcript

Date: 2026-09-13. Status: **Proposed — implementation in progress**.
Scope: the v2 replacement of both the VMK and independent recovery authority R;
it does not authorize production cutover or replace ADR-013.

## Decision

Dual-root rotation uses one versioned UTF-8 JSON-array transcript. The current
device signing key and the current independent recovery seed R must sign the
same bytes. VMK possession, the `recoveryConfirmed` UX flag, or a device
signature alone is not a substitute for the R proof.

The canonical array is exactly:

```text
[
  "budgetflow/vault-rotation/v2", 2, "HKDF-SHA256/AES-256-GCM",
  accountId, workspaceId, vaultId, deviceId,
  currentKeyId, nextKeyId, challenge, expiresAt,
  currentRecoveryPublicKey, nextRecoveryPublicKey, signingPublicKey,
  envelopePurpose, envelope, passkeyEnvelopeOrNull
]
```

`expiresAt` is the server-owned UTC ISO timestamp with milliseconds. Public
recovery keys are exactly 64 lowercase hexadecimal characters. `challenge` is
the server-generated 43-character unpadded base64url value. `signingPublicKey`
and both envelope values are opaque exact strings: they are never parsed,
re-serialized, normalized, or trimmed before signing. The transcript is capped
at 65,536 UTF-8 bytes; identifiers are capped at 128 characters and envelopes
at 128 KiB. The current and next key ids and recovery public keys must differ.

`envelopePurpose` is `device-wrap` or `passkey-wrap`. A `passkey-wrap` primary
rotation cannot carry a second passkey envelope; a `device-wrap` rotation may
carry one optional passkey envelope. The server must validate these invariants
before signature verification and revalidate authority, key version, device
status, expiry, and challenge consumption inside the common vault transaction.

## Consequences

The transcript binds the exact public operation, both roots, authority change,
device scope, challenge freshness, and ciphertext-wrapping envelopes. A retry
with the same idempotency key must match the original transcript byte-for-byte;
any substitution is a conflict. No private root or plaintext financial data
crosses the API boundary. Existing legacy VMK-only rotation remains fail-closed
for vaults with a registered recovery authority until the full prepare/sign/
commit transaction and crash-resume journal are implemented and independently
verified.

The transcript object and validation tests are implemented in the backend as a
safe first layer. Endpoint wiring, PostgreSQL challenge storage, dual-root
client orchestration, and independent integration/browser evidence remain
open work and must not be represented as complete by this ADR.
