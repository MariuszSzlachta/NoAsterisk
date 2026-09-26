# MVP Release Closure Plan

## Status and planning boundary

This is the execution index for the remaining work before the first external MVP release. Each linked plan is intentionally scoped to one development session and has its own prerequisites, non-goals, binary gates, and handoff requirements.

The original MVP definition underestimated the product needed for a usable release. It is retained as historical sequencing in the roadmap, but it is no longer the release contract.

The owner confirmed on 2026-09-07 that CSV import is a frontend-local capability. Financial rows and import metadata must not be sent to `POST /imports`. The backend participates in cross-device synchronization only as a zero-knowledge relay: it accepts and returns a versioned opaque E2EE blob but never receives keys or financial plaintext. These constraints are consistent with the target direction in ADR-003. ADR-003 remains marked `Planned`; this planning document does not silently change its formal status.

On 2026-09-11 the owner accepted ADR-012 and required a pre-MVP destructive cutover
to a random client-held VMK, automatic split local/server unlock and optional passkey
PRF. Legacy local financial databases and v1 server vault snapshots will be
deleted instead of migrated. Authentication/control-plane records are not part of
that reset. Session 09B is therefore a release blocker before final legal copy,
quality gate, deployment and penetration-test sign-off.

## Verified baseline

Historical baseline: `0fdb4793db56b1ab2dd9e5bfb79ea40bf513ab7d` (`main`, 2026-08-28).
It is retained below as the starting point for this roadmap, but it is no longer a
description of the current tree. The implementation since that snapshot includes
encrypted local persistence, local CSV import, backend import retirement, complete
vault snapshots, opaque sync API/client work and ALPHA legal surfaces.

Current planning snapshot: `30cb7b5` (`2026-09-09`). The latest implementation
commits are evidence that code exists, not by themselves proof that the corresponding
session is closed. The exact gate results and handoff record remain the source of
truth for lifecycle status.

### Lifecycle status after the implementation wave

| Sessions | Current status | Evidence / remaining documentation |
|---|---|---|
| 01 | Complete | Plan moved to `docs/plans/completed/mvp-release/`; build, tests and lint evidence recorded. |
| 02 | Complete | Plan moved to `docs/plans/completed/mvp-release/`; encrypted storage, persistence and full E2E gates recorded. |
| 04 | Complete | Plan moved to `docs/plans/completed/mvp-release/`; local history, deletion semantics, visual evidence and gates recorded. |
| 03 | Complete | Plan moved to `docs/plans/completed/mvp-release/`; local import boundary and gates recorded. |
| 05 | Complete | Plan moved to `docs/plans/completed/mvp-release/`; backend import retirement was recorded. |
| 06–08 | Implementation present; closure not recorded | Re-run the session-specific gates, especially the two-browser sync scenario, and record results. |
| 09A | Complete | Financial APIs/tables were retired and account/local-data lifecycle gates were recorded in the completed session plan. |
| 09 | Implementation present; ALPHA only | Legal pages, consent persistence and data inventory exist; publication remains blocked pending Sessions 09A and 10. |
| 09B | Active; architecture accepted | ADR-012 is accepted. Split unlock, optional passkey PRF, recovery, destructive v1 financial-data reset and security evidence remain required. |
| 10 | Active | Requires owner/legal inputs and evidence; unresolved placeholders must remain non-production. |
| 11–14 | Active | Sequential release work; no implementation or deployment completion is implied by the plan links. |

The original baseline facts were:

- the client build and lint were failing;
- the client still called `POST /imports` and the server still exposed the imports module;
- the encrypted vault serialized only transactions and categorization rules;
- privacy/terms/consent, deployment and penetration-test evidence were absent.

Re-run the relevant checks at the beginning of each session. This baseline is evidence,
not a promise that the tree will remain unchanged.

## ADR assessment

The implementation wave establishes a lasting architecture boundary: financial data is
processed and persisted locally, while the backend accepts only an opaque encrypted
snapshot for user-initiated synchronization. This is an ADR-worthy change because a
future developer could otherwise reintroduce `/imports` or server-side financial
repositories while believing the old SaaS boundary is still authoritative.

ADR-003 already covers the intended direction, but its source status is still
`Planned` and its legal/cost claims are partly historical. A follow-up ADR review is
required before release to either accept and update ADR-003 or supersede it with a
current-state decision. The review must record the implemented MVP boundary, snapshot
protocol and explicit non-goals. The legal-copy work and the mobile audit do not need
separate ADRs: they belong in Sessions 10 and 11 unless they introduce a new
cross-cutting architectural constraint.

ADR-012 now governs the client key lifecycle. It preserves ADR-011's opaque backend
boundary but replaces direct password-derived record/snapshot keys with a random VMK,
domain-separated subkeys, split local/server envelopes, optional passkey PRF and
explicit device enrollment. Its accepted status does not imply implementation completion; Session
09B and its security gates are authoritative for release readiness.

ADR-013 (accepted 2026-09-12) adds an independent user-held recovery authority.
Signed PostgreSQL v2 enrollment and browser initial/recovery/trusted QR flows now
exist, with focused cryptographic/database/initialization evidence in the
[security checkpoint](../../security/vault-v2-coding-checkpoint-2026-09-12.md).
Actual financial recovery/trusted join and interrupted restore retry now have
focused real crypto/IndexedDB evidence, pending clean-browser E2E and independent
review. Replacement-backup upgrade UI is now wired with focused form/lifecycle and
native visual evidence. Session 09B remains blocked until dual-root rotation, memory authority unification
and the independent quality/security/browser gates are complete. A passing
enrollment contract is not a completed recovery or MVP release sign-off.

## Session sequence

| Order | Session | Depends on | Exit condition |
|---:|---|---|---|
| 1 | [Restore the frontend baseline](../completed/mvp-release/01-frontend-baseline.md) | — | Complete — `132f22f`; client build, tests and lint pass |
| 2 | [Build the encrypted IndexedDB foundation](../completed/mvp-release/02-encrypted-indexeddb-foundation.md) | 1 | Complete — encrypted storage, persistence and repository-wide E2E gates pass |
| 3 | [Cut CSV import over to encrypted local persistence](../completed/mvp-release/03-local-import-persistence.md) | 2 | Complete — `75d6c6e`; encrypted local records and no `/imports` call |
| 4 | [Add encrypted local import history](../completed/mvp-release/04-local-import-history.md) | 3 | Complete — local history, deletion semantics, visual evidence and gates pass |
| 5 | [Retire the backend imports API](../completed/mvp-release/05-retire-backend-imports.md) | 3 | Complete — `/imports` is absent and server gates pass |
| 6 | [Make the encrypted snapshot complete](../completed/mvp-release/06-vault-completeness.md) | 2, 4 | Complete — v1 snapshot, atomic restore, legacy compatibility, manual roundtrip and repository gates pass |
| 7 | [Implement the opaque blob sync API](../completed/mvp-release/07-opaque-blob-sync-api.md) | 6 | Complete — backend CAS, workspace isolation and PostgreSQL race evidence pass |
| 8 | [Implement cross-device sync on the client](../completed/mvp-release/08-multi-device-sync-client.md) | 6–7 | Complete — two-context push/pull, stale conflict and ciphertext-only E2E pass |
| 9A | [Retire financial APIs and implement the data lifecycle](../completed/mvp-release/09a-data-lifecycle-and-account-deletion.md) | 6–8 | Complete — no unintended financial API remains; account deletion and local-data lifecycle passed PostgreSQL/E2E gates |
| 9B | [Implement split-unlock VMK and optional passkey PRF](./mvp-release/09b-device-bound-vault-and-sync-chain.md) | 1–9A | One ordinary login unlocks a recognized browser; supported PRF credentials authenticate/unlock in one ceremony; recovery, opaque sync, v1 reset and all security gates pass |
| 9 | [Implement privacy, terms and consent](./mvp-release/09-privacy-terms-consent.md) | 1, 8, 9A, 9B | Legal pages and persisted registration consent work against the final data lifecycle and implemented key model |
| 10 | [Validate and finalize legal copy](./mvp-release/10-legal-copy-validation.md) | 9, 9B | Approved, code-verified legal copy or explicit publication block |
| 11 | [Audit and adapt mobile responsiveness](./mvp-release/11-mobile-responsiveness-audit.md) | 1–10 | Per-view evidence report and responsive mobile flow pass |
| 12 | [Run the release quality gate](./mvp-release/12-release-quality-gate.md) | 2–11 | Full repository CI-equivalent gate is green |
| 13 | [Prepare and execute deployment](./mvp-release/13-deployment.md) | 12 | Production-like environment is healthy and smoke-tested |
| 14 | [Penetration test and sign off the release](./mvp-release/14-pentest-release-signoff.md) | 13 | No unresolved P0/P1 or high/critical security findings |

Session 5 may run in parallel with Session 4 after Session 3. Unrelated legal UI work
may start earlier, but Sessions 9 and 10 cannot close until Session 09B is implemented
and verified. Sessions 12–14 cannot begin their release-signoff role against the old
key model. All other ordering is intentional.

## Release contract

The MVP release is complete only when a user can:

1. Register with recorded legal consent and unlock a recognized browser with one
   ordinary login; use a passkey PIN/biometric ceremony where PRF is supported.
2. Import a bank CSV entirely in the browser.
3. Review local PII detection and correct masking before persistence; the product must not promise anonymization or complete de-identification.
4. Save, deduplicate, categorize, browse and delete imported transactions in encrypted IndexedDB.
5. Browse local import history without sending financial rows or metadata to `/imports`.
6. Use transactions, budgets, dashboard and analytics from the same local source of truth.
7. Enroll a new device using an unlocked trusted device or recovery secret, then
   synchronize all MVP local state through signed opaque encrypted snapshots without
   submitting an encryption password to the backend.
8. Delete their server account and understand the separate effect on local data.
9. Complete the core flow in the deployed environment with all release gates green.

## Global invariants

- Raw, masked and pseudonymized financial rows do not cross the financial-data HTTP boundary. The server receives only opaque encrypted vault blobs.
- User financial records are encrypted at rest in IndexedDB with Web Crypto AES-256-GCM. Zustand is an in-memory view/state layer, not durable financial storage.
- Financial records and sync snapshots are encrypted under distinct HKDF-derived keys
  rooted in a random 256-bit VMK. Human passwords never directly encrypt either.
- Standard trusted-browser unlock requires both a non-extractable local share and a
  server share released after fresh interactive authentication. Neither the backend
  nor a logged-out copied profile is sufficient alone, the server share is never
  persisted by the client, and refresh-only session restoration cannot obtain it.
- A supported passkey may replace the local share with a client-only WebAuthn PRF
  result. The backend must never receive that result, VMK, derived keys, local share,
  device private keys or recovery secret. PRF is not required for baseline support.
- Account authentication alone does not establish vault authority on a new or
  unenrolled device. Enrollment requires an unlocked device or recovery secret.
- `localStorage` may hold only an explicit allowlist of non-sensitive presentation preferences; it must not contain transactions, budgets, rules, categories, import profiles or import history.
- Raw CSV contents and original PII are never persisted in browser storage, logs, telemetry, test snapshots, or the vault.
- The dictionary endpoint may remain server-backed because its corpus is application data, not user financial data.
- Auth, user settings, invite codes, administrative controls, and opaque blob synchronization remain valid backend responsibilities.
- The server may store sync metadata needed for concurrency control, such as an opaque revision, ciphertext hash, size and update time. It must not parse or derive business metadata from the encrypted payload.
- The MVP release cannot retain unused plaintext financial APIs or tables merely because the current client does not call them.
- The pre-MVP v2 cutover deletes exact application-owned v1 IndexedDB databases,
  legacy sync metadata and v1 server vault snapshots without record migration. It
  must preserve users, workspaces, permissions, consent, invite codes, dictionaries
  and administrative configuration, and must have idempotent rehearsal evidence.
- Account deletion, local wipe, logout and vault lock are separate operations with separate confirmation and data-loss behavior.
- Public legal claims must use the actual masking/pseudonymization model and must not call masked transactions anonymous.
- Do not expand this closure into real-time collaborative merging, AI categorization, billing, or public registration.
- Do not claim a session complete from TypeScript alone: run every gate listed in that session.

## Completion record

When a session is completed, move its plan to `docs/plans/completed/mvp-release/`, update this table, and record the implementation commit and exact gate results. Do not mark a later session complete merely because its code appears to exist.
