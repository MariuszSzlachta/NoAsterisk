# Vault v2 MVP — Secure Cutover from v1 and MVP Sign-off

Status: **BLOCKED / runbook prepared / ready for independent verification**, not approved.

## Engineering and validation requirements

Follow [CONTRIBUTING.md](../../../../CONTRIBUTING.md), the current ADRs and the
security threat model. Preserve frontend FSD and backend hexagonal boundaries,
keep secrets out of stores and caches, and use strict TypeScript in source and
tests. Cover success, boundary and failure behavior; use isolated PostgreSQL for
repository tests. Run the focused checks while developing and the frontend and/or
backend quality gates after the final change. Record executed commands, blocked
checks and residual risks in this plan or the current security verification
report. UI evidence must use synthetic data only.

## Invariants and Work Process

Backend does not receive VMK, recovery seed R, full backup, or plaintext finances. It may have public authority, signatures, ciphertext, and half of split unlock, insufficient for decryption. Login password does not derive financial keys. Data is encrypted on every write; logout removes access to keys, not "sends an encrypting request to the database".

Every async step checks generation, full account/workspace/vault/key/device context and deadline; cancel/lock/logout/unmount invalidates the operation. Clean owned byte buffers in finally; do not promise deletion of immutable strings or protection against malicious frontend/XSS/device compromise. Do not add your own cryptography.

Read ADR-012, ADR-013, the threat model, security closure and coding checkpoint.
Verify the current tree and preserve unrelated changes. Execute the steps
sequentially with evidence; implement backend changes from lower layers upward.
New decisions require an ADR. Do not migrate or reset real data, deploy, or delete
accounts without explicit approval.

## Goal and Dependencies

After 01–05 and independent review, close the release. Preparation of scripts/runbook does not grant approval for real reset/migration/deploy. Reset of v1 finances does not include accounts/auth.

## Next Implementation Steps

1. Inventory v1 plaintext/ciphertext/stores/legacy endpoints/local DB and current schema. List specific tables/columns/stores and FK references; no wildcards/broad deletes.
2. ADR/runbook reset: designated environment, accounts/workspaces/permissions to preserve, finances to delete, backup/retention and rollback method. Rollback does not restore insecure legacy unlock as fallback.
3. Dry-run/read-only script with exact counts/targets, explicit environment guard, required separate confirmation of destruction. Parameterized SQL and transactions; do not use reset of the entire database.
4. Check migrations 0017/0018 and new rotational tables on an isolated copy/synthetic DB: order/journal constraints, fresh installation and existing schema, indexes, ownership. Do not reverse applied migrations without explicit strategy.
5. Client cutover: detects v1/version mismatch and safely instructs the user; does not read plaintext finances to backend, does not delete current v2/context or overwrite recoverable data without confirmation.
6. Feature/config flags, supported PG-only, CSP/XSS hardening, origin/CORS/headers, telemetry redaction and fail-closed unsupported paths. Check real configurations, not only defaults.
7. Full FE/BE/release gates after the last fix, independent code/security review and required pentest. Findings of every severity block according to quality reports.
8. Update MVP closure/session09B, DoD matrix, threat model, guides, cutover rehearsal and verification report. For each gate, actual proof/status/owner, not prose "done".
9. Give the operator a separate list of exact destructive actions. Execute none
   until the operator has approved each action.
10. Release only after explicit operator approval and complete sign-off; document residual risks webapp (malicious delivered JS/XSS/device compromise) without marketing "100% secure".

## Acceptance Criteria / Behavior

- Rehearsal does not delete account/auth/permissions and does not send financial data to the backend.
- Fresh installation and supported cutover work; no active v1 unlock and downgrade.
- No mandatory BLOCKED/OPEN/NEEDS_CHANGES in release matrix; independent APPROVED and operator authorization.

## Handoff

Do not deploy to production. Submit commit, list of files, current status of criteria and required report above. Do not start the next plan with unresolved security blockage. Review will be done separately after user signal.
