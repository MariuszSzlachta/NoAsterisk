# Vault v2 MVP — Real Flow for Browser and Security Evidence

Status: **BLOCKED / ready for independent verification**, not approved.

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

The backend does not receive VMK, recovery seed R, full backup, or plaintext finances. It may have public authorities, signatures, ciphertext, and half of split unlock, insufficient for decryption. The login password does not derive financial keys. Data is encrypted on every write; logout removes access to keys rather than sending an encryption request to the database.

Every async step checks generation, full account/workspace/vault/key/device context and deadline; cancel/lock/logout/unmount invalidates the operation. Clean owned byte buffers in finally; do not promise deletion of immutable strings or protection against malicious frontend/XSS/device compromise. Do not add your own cryptography.

Read ADR-012, ADR-013, the threat model, security closure and coding checkpoint.
Verify the current tree and preserve unrelated changes. Execute the steps
sequentially with evidence; implement backend changes from lower layers upward.
New decisions require an ADR. Do not migrate or reset real data, deploy, or delete
accounts without explicit approval.

## Goal and Dependencies

Verify the working module after 01–04; fix sources of discovered problems according to mandatory quality, do not weaken tests. Test double passkey does not confirm real PRF handling.

## Next Implementation Steps

1. Update browser/failure matrix: browser/OS/version, passkey+PRF supported/not supported, local mode and recovery. Do not require an additional password manager as the only MVP path.
2. Isolated two clean profiles and accounts with synthetic finances; real backend/PG, native WebCrypto and IDB, not just mocked requests.
3. Initial setup → backup confirmation → transactions → logout/reopen → unlock; check plaintext in UI and ciphertext in IDB/network. Tests do not log backups.
4. Clean-profile BF2 recovery and trusted QR join with real financial restore; local-complete unsynced data preserved; remote absent/malformed/wrong-authority blocks, does not create empty vault.
5. Real passkey PRF and no-PRF fallback; cancel authenticator, PIN/biometrics, missingcredential and unsupported environment show correct path without downgrade.
6. Network delay/lost response/server commit then disconnect, cancel/unmount/logout/idle lock between awaits, multi-tab competing writes and race revoke/rotate/enroll.
7. Rotation crash matrix from 01, rollback/forks from 03, replay and transplant signatures. Native PG deadline regression with application Date.now skew and lock wait.
8. A11y: keyboard flow, focus trap, return focus, inert background, screen-reader labels/errors, mobile scroll/no horizontal overflow. Fix dependent Modal if it blocks flow.
9. Synthetic-only screenshots of important UI states, computed styles, reference if exists. Unexecuted hardware/security review marked BLOCKED; do not replace them with emulators without label.
10. Evidence in browser/failure matrices and review report, environment versions, reproducible commands, without sensitive artefacts.

## Acceptance Criteria / Behavior

- The second clean profile actually shows the same synthetic finances after recovery/QR, not just the unlocked badge.
- No secrets in HTTP/telemetry/cache; local auto unlock does not bypass backend auth/revoke.
- All mandatory supported combinations PASS, others explicitly unsupported with tested UX; blockers not hidden in backlog.

## Handoff

Do not deploy to production. Submit commit, list of files, current status of criteria and the required report above. Do not start the next plan with unresolved security blockage. Review will be done separately after user signal.
