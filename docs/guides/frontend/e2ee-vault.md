# E2EE Vault

The active financial-data protocol is Vault Protocol v2. The canonical
implementation and browser constraints are documented in
[`vault-protocol-v2.md`](./vault-protocol-v2.md).

The v2 vault uses a random client-held VMK and derives purpose-specific keys
with HKDF-SHA-256. Records and sync snapshots use AES-256-GCM with versioned,
canonical AAD. A recognized browser unlocks through the split LocalShare plus
fresh ServerShare path; a credential-specific WebAuthn PRF envelope is the
preferred optional path where that credential actually supports PRF.

The account password, password hash, JWT, refresh token and session are account
authentication material only. None is used as vault KDF input. ServerShare is
never persisted in the browser, and VMK, LocalShare, PRF output and derived
keys are never sent to the backend.

Legacy v1 encrypted-blob routes and password dialogs are retired from the
runtime. Their database compatibility structures remain only until the
reviewed, exact-scope pre-MVP cutover is approved and rehearsed. No production
destructive cutover is performed by the client.
