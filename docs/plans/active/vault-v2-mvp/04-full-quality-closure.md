# Vault v2 MVP — Full File Review and Architecture Closure

Status: **PASS with environment-blocked evidence / ready for independent verification**, not approved.

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

Backend does not receive VMK, recovery seed R, full backup or plaintext finances. It may have public authority, signatures, ciphertext and half of split unlock, insufficient for decryption. Login password does not derive financial keys. Data is encrypted on every write; logout removes access to keys rather than sending an encryption request to the database.

Every async step checks generation, full account/workspace/vault/key/device context and deadline; cancel/lock/logout/unmount invalidates the operation. Clean owned byte buffers in finally; do not promise removal of immutable strings or protection against malicious frontend/XSS/device compromise. Do not add your own cryptography.

Read ADR-012, ADR-013, the threat model, security closure and coding checkpoint.
Verify the current tree and preserve unrelated changes. Execute the steps
sequentially with evidence; implement backend changes from lower layers upward.
New decisions require an ADR. Do not migrate or reset real data, deploy, or delete
accounts without explicit approval.

## Goal and Dependencies

Review the complete feature scope, not only the latest diff. Execute after plans
01–03, then update the file manifest after plans 05–06.

## Next Implementation Steps

1. Establish the base feature commit range 3a388ee0 (parent as diff point), its descendants to current HEAD and worktree; agree on renames/deletions and do not rely solely on the number of files written.
2. Read each file semantically. Full matrix of FE/BE requirements, reasons for N/A and findings also LOW. Ast/regex are a help, not a review proof.
3. Priority root useVaultUnlock: separate public wizard state, lifecycle and protocols, small composable hooks/units; root buffers remain volatile. Remove unmeasured useCallback/useMemo, stale closures and raw untrusted errors in UI.
4. Separate vault-rotation, rotate-vault-records, opaque-sync-snapshot, device-id, encrypted-persistence without public utility dump. Do not change AAD, transcript bytes, key lifetime or queue semantics during mechanical refactoring.
5. API fetch/transform only; store access/business orchestration move to the appropriate concern. Keep secrets outside Query cache even during error/retry.
6. BE domain ports/bootstrap projections, mappers and response Zod: remove layer leaks/optional soup, verify constructor invariants/copy and workspace ownership.
7. Structure of each logical unit is consistent with the report: ownfolder/index/spec, aliases, one export, named constants/pattern files, strict also in tests.
8. Review dependent UI Modal/a11y, DS reuse, tokens, callbacks, ready ViewModels. New or inherited blocking security/a11y dependencies are not excluded just because they did not belong to the last diff.
9. Improve one concern at a time while maintaining behavior tests; update ledger after refactoring.
10. Full gates once after final fixes, all warnings resolved; an independent reviewer must read the full scope, not just check the checklist.

## Acceptance Criteria / Behavior

- No OPEN/FAIL in all-file matrix and no unresolved severity; deleted files have reason and confirmation of no dead imports/routes.
- Regressions of session cancellation/proof binding/financial restore/rotation are preserved.
- READY_FOR_REVIEW with full manifest; APPROVED only after independent review.

## Handoff

Do not deploy to production. Submit commit, list of files, current status of criteria and required report above. Do not start the next plan with unresolved security blockage. Review will be done separately after user signal.
