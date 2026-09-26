# Vault v2 MVP — Consistent Authority Graph and Backend Lifecycle

Status: **PARTIAL / ready for independent verification**, not approved.

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

Backend does not receive VMK, recovery seed R, full backup, or plaintext finances. It may have public authority, signatures, ciphertext, and half of split unlock, insufficient for decryption. Login password does not derive financial keys. Data is encrypted on every write; logout removes access to keys rather than sending an encryption request to the database.

Every async step checks generation, full account/workspace/vault/key/device context and deadline; cancel/lock/logout/unmount invalidates the operation. Clean owned byte buffers in finally; do not promise deletion of immutable strings or protection against malicious frontend/XSS/device compromise. Do not add your own cryptography.

Read ADR-012, ADR-013, the threat model, security closure and coding checkpoint.
Verify the current tree and preserve unrelated changes. Execute the steps
sequentially with evidence; implement backend changes from lower layers upward.
New decisions require an ADR. Do not migrate or reset real data, deploy, or delete
accounts without explicit approval.

## Goal and Dependencies

Enrollment, bootstrap, recovery registration, revoke, unlock, and rotation use one truth about workspace/key/device. MVP recommended PostgreSQL-only; memory must be explicitly inaccessible, not seemingly compatible. Agree on ports with 01 before expansion.

## Next Implementation Steps

1. Break down all adapters/providers/routes and matrix who reads/mutates vault/key/device/challenge/recovery authority. Remove public projections and current authorization checks.
2. ADR confirming PG-only MVP; startup/config/health explicitly lists unsupported memory mode. Do not add silently-success memory bootstrap or fallback storage.
3. Domain: consistent readonly states initial/pending/active/revoked/rotated, behavior/invariants and scoped ports. Separate metadata from authorization decisions.
4. Application: shared domain authorization policies, no infrastructure dependencies. Every external ID checked in full ownership context.
5. Infrastructure: documented identical lock order in all mutations; current keyset, device status, challenge, and auth deadline verified after await and lock. Atomic device+challenge changes; no check-then-write outside of a transaction.
6. Bootstrap/response through mapper and discriminated Zod contracts, not raw row/domain DTO. No optional soup and excessive fields.
7. Remove/disable old unsigned enrollment routes and orphaned providers. Challenge cleanup cannot resurrect revoke or allow replacement of active/live-pending device.
8. Review revoke and session unlock: confirm effects for split share, active grants, and new rotation. Local logout is not global revoke.
9. Update implementation maps and operational guide for configuration.

## Acceptance Criteria / Behavior

- One shared PG lifecycle corpus; cross-account/workspace/old-key challenge rejected.
- Concurrent finalize/revoke/register/rotate and expired auth during lock wait on real PG.
- Challenge replay/duplicate finalization/transcript substitution fail-closed.
- Revoked device cannot recover share and cannot delegate join.
- Memory/config unsupported has explicit diagnostic error, no partially working seif.

## Handoff

Do not deploy to production. Submit commit, list of files, current status of criteria, and the report required above. Do not start the next plan with unresolved security blockage. Review will be done separately after user signal.
