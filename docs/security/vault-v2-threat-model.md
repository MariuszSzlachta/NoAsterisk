# NoAsterisk Vault Protocol v2 — threat model

The `budgetflow/...` strings retained by the implementation and test vectors are
immutable legacy protocol domains under ADR-015, not the current product name.

Status: implementation work in progress; this document is normative for the MVP security boundary.

## Assets

- VMK: random 256-bit vault root key.
- LocalShare: non-extractable HKDF `CryptoKey`, scoped to one account/device profile.
- ServerShare: random 256-bit per-device secret, encrypted at rest with an infrastructure key and never persisted in browser storage.
- K_local, K_sync and K_check: purpose-separated keys derived only from VMK and vaultId.
- Financial records and sync snapshots.

## Trust boundaries

The server stores opaque ciphertext and protocol metadata. A database administrator with only backend data cannot derive VMK. The browser is trusted only within the normal web trust boundary: same-origin XSS, malicious deployment, browser malware, extensions with page access and a compromised endpoint can access plaintext while the vault is unlocked.

Password hashes, JWTs, refresh cookies and session state are authentication material only. They are never KDF input for the vault.

## Required controls

1. AES-256-GCM with a fresh 96-bit nonce per operation.
2. Canonical, versioned AAD binding account, workspace, vault, key, purpose and record/device identity.
3. Authenticate before parse and validate plaintext before mutation.
4. Fresh interactive authentication for ServerShare; refresh and background bootstrap cannot satisfy this requirement.
5. High-security mode is PRF-only and fails closed.
6. Exact-scope, idempotent cutover; production destructive execution requires separate owner approval.

## Residual risks

Recovery loss is an intentional data-loss condition. XSS, malware and a deployment administrator who can ship a malicious frontend are outside cryptographic protection and require CSP, dependency controls, protected deployment and operational monitoring.
