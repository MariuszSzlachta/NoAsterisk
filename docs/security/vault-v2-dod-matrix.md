# Vault Protocol v2 — 09B Definition of Done matrix

This matrix is an evidence index, not a claim of perfect security. “Repository
verified” means that the implementation and its automated tests provide direct
evidence in this worktree. “External gate” requires a named environment owner and
must not be replaced by a local mock or a production reset.

| 09B section | Requirement evidence | Status |
|---|---|---|
| 09B.1 Reconcile | `docs/security/vault-v2-implementation-map.md`, preserved dirty worktree, agent and FE layer gates | Repository verified |
| 09B.2 Browser/security spike | `vault-v2-browser-matrix.md`, capability tests and maintained WebAuthn library integration | Repository verified; browser-owner matrix still required |
| 09B.3 Protocol module | ADR-012 labels, HKDF hierarchy, AES-GCM/AAD validators, vectors and mutation tests | Repository verified |
| 09B.4 Backend authority | keysets, devices, credentials, encrypted ServerShare, fresh-auth assertions, authoritative security profile, revocation and migrations `0007–0015` | Repository verified |
| 09B.5 Split unlock/persistence | account-scoped v2 Dexie, non-extractable LocalShare, transient ServerShare, generation/lock guards | Repository verified; browser raw-storage capture is external evidence |
| 09B.6 Passkey/PRF | explicit WebAuthn DTO allowlist, standard PRF enrollment with retained split fallback, PRF-only high-security path, no `toJSON`, no PRF in network DTOs | Repository verified; authenticator-specific PRF coverage remains matrix evidence |
| 09B.7 Recovery/enrollment | local 256-bit recovery representation, copy/download/transient QR display, clean-profile recovery, pending-to-active key confirmation, device list/revoke, standard and PRF VMK rotation, encrypted retry journal, signed trusted-device QR transfer protocol and server-side approval verification | Recovery and trusted-device protocol verified; camera/UI walkthrough and full two-browser E2E remain open |
| 09B.8 Opaque sync | encrypted/signed snapshots, CAS, high-water mark, replay/rollback/tamper/revocation handling, automatic unlock-only sync | Repository verified; two-browser production-like walkthrough remains external evidence |
| 09B.9 Cutover | exact allowlist, dry-run, idempotent marker, locked failure and control-plane preservation tests | Repository verified locally; two separate production-like restore rehearsals are external gates |
| 09B.10 UX/accessibility | no routine vault-password prompt, recovery/new-device messaging, high-security copy, rotation UX, PL/EN strings | Repository verified; keyboard/mobile/manual walkthrough remains external evidence |
| 09B.11 Independent verification | client/server tests, builds, strict lint, Kiro gates, PostgreSQL integration, browser E2E and security report | Repository verified for functional/security gates; repository-wide coverage commands remain below their pre-existing global thresholds, and raw deployment/browser/DB captures remain external gates |

## Explicit non-claims

- OPAQUE is not implemented and is intentionally outside MVP.
- The trusted-device QR cryptographic transport and server-side approval check are
  implemented, but the camera-driven two-browser UI is not advertised until its
  manual accessibility and E2E walkthrough is complete. Recovery remains the
  production fallback.
- Production destructive cutover was not executed.
- Same-origin XSS, malware and a deployment operator able to ship arbitrary frontend
  JavaScript remain inside the web trust boundary.

## Required release-owner evidence

Before a production release, attach two separately identified production-like restore
records, the exact inventory diff, raw IndexedDB/backend table captures, browser/PRF
matrix results and reviewer sign-off. The repository deliberately contains no command
that can broaden the allowlist or perform an unapproved production reset.
