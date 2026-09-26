# Vault v2 MVP — Dual Root Rotation

Status: **BLOCKED / partial; ready for independent verification**, not approved.

## Engineering and validation requirements

Follow [CONTRIBUTING.md](../../../../CONTRIBUTING.md), the current ADRs and the
security threat model. Preserve frontend FSD and backend hexagonal boundaries,
keep secrets out of stores and caches, and use strict TypeScript in source and
tests. Cover success, boundary and failure behavior; use isolated PostgreSQL for
repository tests. Run the focused checks while developing and the frontend and/or
backend quality gates after the final change. Record executed commands, blocked
checks and residual risks in this plan or the current security verification
report. UI evidence must use synthetic data only.

## Invariants and Working Style

Backend does not receive VMK, recovery seed R, full backup, or plaintext finances. It may have public authority, signatures, ciphertext, and half of split unlock, insufficient for decryption. Login password does not derive financial keys. Data is encrypted on every write; logout removes access to keys, not "sends an encrypting request to the database".

Every async step checks generation, full account/workspace/vault/key/device context and deadline; cancel/lock/logout/unmount invalidates the operation. Clean owned byte buffers in finally; do not promise deletion of immutable strings or protection against malicious frontend/XSS/device compromise. Do not add your own cryptography.

Read ADR-012, ADR-013, the threat model, security closure and coding checkpoint.
Verify the current tree and preserve unrelated changes. Execute the steps
sequentially with evidence; implement backend changes from lower layers upward.
New decisions require an ADR. Do not migrate or reset real data, deploy, or delete
accounts without explicit approval.

## Goal and Dependencies

Close rotation for vaults with recovery authority without weakening the current fail-closed. Dependency: existing signed enrollment and BF2; common locks agree with plan 02. Do not unlock legacy endpoint before.

## Next Implementation Steps

1. Inventory vault-rotation.ts, rotate-vault-records, journal, UI rotation and backend rotate handlers/repositories. Break down state before/after, boundaries of IDB/PG and recovery for each crash point.
2. ADR: canonical, versioned rotation transcript binding purpose/suite, full scope, old/new keyId and authority, nonce/expiry, exact envelope bytes/hashes and devices. Require proof of current authority and possession of new; explicitly resolve separate permissions of a regular device and operations requiring R. VMK cannot replace R signature.
3. Readonly domain transition and port: prepare/finalize/confirm or equivalent explicit state machine. Validation of all invariants in constructor, one-use challenge, stale/revoked/auth deadline.
4. PG: order of shared workspace/vault lock, current authority again after crypto await. CAS and change keyset/R authority/devices/challenge atomically. Deadline enforced also by DB clock after lock wait. Repeating the same commit is safe, change transcript is rejected.
5. Client: random VMK-next and R-next, BF2-next; explicit local confirmation of full backup before re-encryption and commit. Cancellation does not change active roots.
6. Journal stores only authenticated encrypted next-root material with correct AAD/scope/transcript binding; never plaintext R/BF2. Document root needed to restore and crash-resume for local/passkey/recovery. Do not accept legacy confirmed flag as proof of new backup.
7. Recovery after crash: first confirmed backend state, then proper local state/publication; no transaction of IDB+PG+localStorage. Preserve access path after each crash and do not send old snapshot under new keyId.
8. Only full success cleans journal/owned roots and publishes new context. Revoked old-device does not receive new shares; old backup does not recover new data. Historical ciphertext known to old VMK does not become retroactively secret.
9. Update threat/failure matrices, codec vectors, guides and DoD.

## Acceptance Criteria / Behavior

- Native crypto roundtrips: BF2-next recovers new finances; BF2-old does not enroll into current keyset.
- Cancel, timeout, logout and concurrent revoke do not commit; auth expired during PG lock wait is rejected.
- Failures before/after every PG/IDB commit, restart and duplicate requests have deterministic resume, without data loss and downgrade.
- Concurrent rotate/rotate, rotate/enroll, rotate/revoke and envelope/public-key substitution are rejected.
- Secrets do not appear in HTTP, logs, Query cache/store or plaintext IDB.

## Handoff

Do not deploy to production. Submit commit, list of files, current status of criteria and the report required above. Do not start the next plan with an unresolved security block. Review will be done separately after user signal.
