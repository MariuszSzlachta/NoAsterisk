# Privacy and Security Boundary

Status: **implemented development architecture; not independently certified**

Updated: 2026-09-25

## Scope of this document

This page describes the current technical boundary. It is not a certification,
legal conclusion, privacy policy or guarantee that the application is safe for
production use with real financial data.

## Data flow

| Data | Browser behavior | Backend behavior |
| --- | --- | --- |
| Raw CSV bytes and original import rows | Parsed and reviewed in memory; wizard state is cleared on route departure | Not accepted by the current import path |
| Financial records | Encrypted before durable storage in IndexedDB; decrypted while the vault is unlocked | Not accepted as plaintext financial rows |
| Vault snapshot | Built, encrypted, signed and validated by the client | Stores and returns opaque ciphertext plus protocol metadata |
| Vault secrets | Vault keys and passphrase remain client-side | Does not receive the vault passphrase or plaintext vault key |
| Account and protocol data | Used for login, settings and device flows | Processes account, authentication, device, recovery and synchronization metadata |
| Dictionaries | Requested by the masking feature | Served and administrated by the backend |

The backend's inability to inspect transaction plaintext does not make all stored
data anonymous. Account identifiers, device/protocol metadata and encrypted data
can remain personal data under applicable law.

## Local financial persistence

User-owned financial collections are written through the encrypted persistence
adapter. Business fields are serialized and protected with AES-256-GCM before a
Dexie transaction stores their envelopes in IndexedDB. The durable store contains
ciphertext and the technical metadata required to decrypt and version it.

Zustand stores are hydrated in-memory views. The only localStorage allowlist is
non-financial presentation state such as theme and preferences; legacy financial
keys are handled by a validated one-time migration into encrypted persistence.

When the vault is unlocked, plaintext necessarily exists in browser memory. A
successful XSS attack, malicious extension, compromised browser or compromised
device may therefore expose it.

## CSV and PII handling

CSV parsing and PII review run in the browser. Format-aware detectors and
dictionaries can mask names and structured identifiers before accepted rows become
local transaction records. Ambiguous findings require user review.

This feature is deliberately described as **masking**, not guaranteed
anonymization:

- heuristic detection can miss sensitive content;
- a masked transaction can remain identifying in context;
- users can edit or restore detected values;
- no unsupported detection-accuracy percentage is claimed.

## Encrypted synchronization

Cross-device synchronization is an explicit whole-snapshot operation. The client
encrypts and signs the snapshot, and validates remote snapshots before restore.
Optimistic concurrency rejects stale writes; conflicts require a user-visible
decision. The MVP does not provide background sync, server-side merge, CRDTs or
silent last-write-wins behavior.

The protocol includes device-bound enrollment, recovery authority, passkey flows,
device revocation and vault-root rotation. Those controls have automated unit,
integration and browser evidence, but they have not received an independent
security audit.

## Backend controls

The backend uses password hashing, short-lived access tokens, refresh-token
rotation, request throttling, CORS restrictions and workspace-scoped authorization
boundaries. PostgreSQL adapters persist authentication, administrative and vault
protocol state. Production mode fails closed unless PostgreSQL persistence is
selected.

These controls reduce risk; they do not establish production approval or eliminate
operational responsibilities such as secret management, TLS, monitoring, backup,
retention, incident response and migration rehearsal.

## Explicit non-guarantees and release blockers

- The project is not security-certified or production-approved.
- No claim of complete anonymization or universal PII detection is made.
- Client-side encryption does not protect an already compromised unlocked browser.
- Loss of all configured recovery mechanisms can make financial data unrecoverable.
- The repository's development environment values are intentionally non-secret and
  must never be reused in deployment.
- Production deployment and destructive migration/cutover require separate owner
  approval and evidence.
- Legal roles, retention duties and data-subject obligations require independent
  assessment; ciphertext-only financial storage does not remove them.

## Authoritative references

- [ADR-011 — MVP financial-data boundary and opaque sync](../../adr/011-mvp-local-first-opaque-sync-boundary.md)
- [ADR-012 — device-bound vault root key and sync chain](../../adr/012-device-bound-vault-root-key-and-sync-chain.md)
- [ADR-013 — independent recovery authority](../../adr/013-independent-recovery-authority-and-enrollment-transcripts.md)
- [ADR-014 — vault rotation transcript](../../adr/014-vault-rotation-transcript.md)
- [Current local-first architecture](../../architecture/local-first-e2ee.md)
- [Vault v2 implementation guide](../../guides/frontend/vault-protocol-v2.md)
