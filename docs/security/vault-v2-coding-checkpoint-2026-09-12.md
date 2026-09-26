# Vault v2 — coding checkpoint

Baseline: `f94294f5`, 2026-09-12. Changes are in the worktree, not a new commit.
Overall status: **NEEDS_CHANGES / implementation in progress**, not MVP-ready.

## Latest — 2026-09-13 implementation checkpoint

The correction round covers recovery backup,
enrollment resource lifetime, authorization boundaries and touched sync helpers.
The public-authority transaction now enforces the original interactive-auth
deadline using the PostgreSQL clock. Prepared share projection/failure paths
dispose owned buffers. Backup API mutation, volatile form and operation lifecycle
are separate units; helper tests no longer cast empty objects to CryptoKey.
Trusted request preparation checks cancellation between asynchronous stages.

The current acceptance criteria are maintained in the
[Vault v2 definition-of-done matrix](./vault-v2-dod-matrix.md) and
[verification report](./vault-v2-verification-report.md). This checkpoint is not
an MVP release verdict.

## Latest — recovery backup upgrade settings UI

`VaultSection` now includes the user-facing one-time recovery backup upgrade.
TanStack Query returns only scoped public availability, with account/workspace/
vault/key/device/generation cache binding and bounded abortable reads. Registered
authorities do not generate another backup or overwrite R. Local Zustand contains
only the operation phase; backup text, confirmation and native QR remain volatile
component-local form state and are cleared on confirm/cancel/session invalidation.
Lock, generation change, unmount and duplicate starts invalidate delayed results.

The dialog composes existing DS Card/Button/Input/Modal/QueryRenderer. It offers
copy/download/native QR and requires the complete saved code before allowing
registration. It explicitly says VMK/data stay unchanged and a possibly leaked
old backup requires separate data-key rotation. The clipboard is not a backup.
QR markup comes only from the native encoder, never server SVG/scanned content.
No backup/private R entered Zustand, query cache or durable persistence.

After confirm, the form is removed before backend registration. A failed/uncertain
request keeps the warning to retain the saved new backup even if the subsequent
availability read also fails, and provides an explicit read-only recheck action.
Successful upgrade requires the existing operation's scoped matching R readback;
the completion phase cannot immediately generate another backup on stale query
data. Stale results after lock/unmount cannot report success.

Focused final verification: **7 spec files / 23 tests passed**, including actual
DS form interaction with invalid/exact saved code, cancellation, duplicate starts,
late lock/generation/unmount completion, uncertain-request plus readback failure,
foreign query scope, native BF2/crypto and complete registration proofs. App and
additional affected-spec TypeScript checks passed. Scoped lint and whitespace
checks were used; no complete build/suite or backend/database mutation was needed.

Native visual evidence uses the actual DS components, Polish translations and
native QR for explicitly synthetic all-zero/all-one test roots, not user secrets.
Screenshots cover initial, loading, known configured, confirmed, working, mismatched
code, exact-code enabled confirm, cancelled dialog and uncertain readback error.
Desktop plus measured mobile **375 x 812 CSS px**: document width 375, dialog
width 343/height 780, internal scroll height 874, no page horizontal overflow.
Surface rgb(16,19,25), radius 12px match existing Modal/DS tokens; QR stays square
with its native quiet zone. The long dialog intentionally scrolls internally.
No approved mockup exists; reference is the current DS and prior backup dialog.
The synthetic presentation harness does not make registration requests; the real
hook/form integration is covered separately by the focused tests. Hardware QR
scanning and real authenticated browser/backend integration remain release gates.
Owned harness files/spec tsconfig were removed, native tabs closed and viewport
override reset. No actual financial/user database was changed.

Next: dual-root VMK/R rotation. Memory-state conformance, verified checkpoint/chain
policy, complete independent every-file review, browser/crash/accessibility and
security/release gates remain open. Existing shared Modal focus-trap/background-
inert behavior also needs accessibility gate review; DS reuse is not sign-off.

## Recovery backup upgrade — client protocol groundwork

The client now has strict public registration response parsing, exact backend
canonical signing bytes, bounded/abortable HTTP prepare/confirm and a guarded
`upgradeRecoveryBackup` operation. It preserves the existing VMK, generates an
independent random R, forms the complete BF2 backup locally and waits for explicit
external-backup confirmation before any registration mutation. Prepare sends
only scoped IDs/public R and possession acknowledgement. Confirm sends active
device P-256 and independent R Ed25519 signatures over the exact one-use intent.
Returned signing authority is imported/exported and compared with the actual
local public key; exact original JWK bytes remain in the signed transcript.

Completion requires successful confirm plus a scoped bootstrap readback of the
same public R. Lock/generation/context/flow invalidation, malformed/foreign or
expired intent and mismatched signing authority fail closed. Owned VMK copies and
R are zeroed in finally; no private authority/backup persistence was added.
An existing registered authority is a distinct already-registered result, never
overwritten. An uncertain network outcome is not reported as successful upgrade;
the UI must tell the user to keep the saved backup and recheck server authority.

Focused evidence: **5 spec files / 14 tests passed**, real Web Crypto/Ed25519,
BF2 decoding and encrypted native IndexedDB, with mocked HTTP only. Includes
backup-before-request, cancelled backup, lock, substituted signing key, both real
proofs and post-confirm readback mismatch. Client app/additional affected-spec
TypeScript checks passed. No global build/suite or application database changes.

This groundwork is **not yet user-facing**: operation is not wired into settings,
and no existing user is automatically upgraded. Next: context-scoped query/UI,
an honest non-rotation backup dialog with copy/download/QR, possession confirmation,
cancel/lock/unmount/duplicate-submit handling and all-state native visual evidence.
Do not mark the backup-upgrade UI or Session 09B complete.

## Latest checkpoint — actual financial recovery / trusted join

The previous clean-profile restore and lost-material binding implementation gaps
are now addressed in the worktree, pending independent review/browser release
gates. Recovery authenticates the BF2 independent authority, verifies the actual
remote snapshot with real client keys before enrollment mutation, restores its
financial collections locally after signed confirmation, acknowledges only the
committed snapshot and publishes `unlocked` last. Trusted encrypted QR transfer
uses the same financial restore path and exact approved signing identity.

When an authenticated complete local vault still exists, credential recovery
preserves local financial records and unsynced mutations instead of overwriting
them from remote storage. Recovery/QR for a lost-material active browser creates
a new binding; the original active device ID is not overwritten. A replacement
browser ID is persisted only at the end of successful initialization.

`requiresRemoteRestore` is durable native vault metadata, not a UI-only flag.
Interrupted restores remain required and ordinary unlock retries before UI and
automatic sync publication. Scoped transactional completion rejects changed
identity/session and rolls back cancellation. New local databases default to
requiring restore unless initial setup explicitly creates a new empty vault.
Remote absence/unavailability fails closed for clean join/recovery. Users who
join before their first authentic snapshot was uploaded must retry; we do not
equate server absence with an empty financial history.

Fresh profiles have no independent rollback checkpoint. They verify signature,
AEAD, workspace/vault/key scope and transport/hash binding without inventing a
trusted watermark from server-provided revision/hash. Retained local checkpoints
still reject rollback/fork; skipped chain links are not silently accepted.

Latest focused verification: **16 spec files / 51 tests passed**, using real Web
Crypto and encrypted IndexedDB. Includes actual financial records after recovery,
real encrypted trusted QR transfer, lost-material replacement binding, interrupted
ordinary unlock retry, empty/tampered/wrong-key/rollback rejection, preserved local
unsynced data and transactional marker cancellation. HTTP/enrollment boundaries
are mocked; this is not real-browser or global JWT/throttle coverage.
Client app and additional affected-spec strict TypeScript checks passed, scoped
Oxlint passed. The selection includes unlock lifecycle/policy and native
persistence regressions. No full suite/build, backend mutation/migration, user data deletion,
UI markup change, deployment or pentest was performed in this follow-up. Synthetic
IndexedDB fixtures delete only their owned UUID-named test databases.

Remaining: backup-upgrade UI, dual-root rotation, memory state unification,
verified checkpoint/chain policy, full every-file quality review, supported-browser
and real clean-profile/network E2E, security/release gates. No MVP/APPROVED claim.

Implemented work through PostgreSQL registration was committed as `bb3a9f98`
(`feat(vault): add independent recovery authority registration`, 223 files).
Pre-existing untracked review documents were excluded; commit hooks passed.
Subsequent enrollment transcript/proof work is not included in that commit.

## Enrollment transcript follow-up after bb3a9f98

Canonical immutable backend value objects now bind initial/recovery/trusted purpose,
account/workspace/vault/key/device, server nonce/expiry, exact new signing/ephemeral
keys, authority/delegation digest and exact final envelopes. Constructor guards
include UTF-8/JSON-escaped total signing-byte bounds. Native complete-proof verifier
requires the new-device signature, plus either independent R or the old-device
delegation signature and a recomputed canonical delegation digest. Strict native
ECDH public-JWK validation rejects private/signing usages. These units are not yet
activated by the existing enrollment endpoints, and are not an end-to-end fix.
Focused verification: **5 spec files / 35 tests passed** after the final change,
including real ECDSA/Ed25519 proofs and old-delegation replay against a new challenge
even with a valid fresh new-device signature and recomputed digest. Server
typecheck, scoped strict ESLint and `git diff --check` passed. No full test suite,
production/database mutation or new UI change was required for these units.

## Implemented and checked

Rotation backup confirmation before key replacement; explicit legacy-journal backup
repair before retry; cleanup on decline/lock/unmount; pending old-root verification
against the next sentinel; pinned persistence publication; mutation/store/high-water
restore guards; shared manual/automatic sync and restore queue; bounded network
lifetimes; exact transport-envelope binding and uploaded-snapshot acknowledgement.

Final affected test selection: **14 spec files, 57/57 tests passed**. The selection
includes real Web Crypto, encrypted IndexedDB replacement/rotation and a real
encrypted/signed remote-restore roundtrip through the actual snapshot parser. Only
the HTTP boundary is mocked in that roundtrip. Earlier iterations exposed and fixed
a queue timing assumption and attempts to spy on a frozen API object; the final
test run is after those fixes.

Checks run: client `tsc -b --noEmit`, scoped Oxlint on changed/new client files,
Prettier on those files, `git diff --check`. No complete repository test suite,
backend build, database migration, data reset, deployment or pentest was run.
Passing these checks is not independent security approval or closure of previous
architecture comments.

## Visual verification

Native browser screenshots in the current coding task cover pre-confirmation,
wrong-code error, exact-code enabled confirmation, mobile and closed-dialog states.
Only the deliberately invalid fixture `PRZYKLADOWY-KOD-TESTOWY-NIE-UZYWAC` was
displayed; no actual recovery root, credential or financial record was captured.
The isolated harness used the actual component, stylesheet and Polish translations;
no corresponding approved mockup exists for reference comparison.

Measured desktop modal: width 448px, padding 24px, radius 12px, background
rgb(16,19,25), text rgb(232,234,238), existing shadow-card. Mobile: 390×844, no
horizontal document overflow, buttons/input readable and reachable in the observed
states. Native screenshots were visually inspected. Existing Button/Input/Modal
primitives were reused in accordance with the repository's design-system guide.
This is not the full browser/keyboard/accessibility release matrix.

The first sandboxed headless browser launch was denied by macOS; native in-app
browser verification succeeded instead. Temporary harness files were deleted after
verification, the temporary tab was closed and the viewport override reset. The
pre-existing development server and user tabs were left intact.

## Remaining work and approval

### PostgreSQL registration implementation follow-up

Implemented scoped prepare/confirm endpoints for recognized-profile independent
recovery authority registration. The immutable domain entity validates ownership,
current version/suite/device authority, expiry and consumption. Both active-device
and independent-recovery signatures bind the same canonical server challenge.
Public-key installation and challenge consumption share the existing PostgreSQL
vault transaction lock and roll back together. No private root enters persistence.

Strict P-256 public-JWK parsing rejects private/unknown fields. Recovery verification
uses pinned Noble 2.4.0 with `zip215: false` on both client and server, including an
identity/small-order forgery regression. The server Jest transform handles only the
Noble ESM packages; production uses the existing supported Node runtime. Client
bootstrap is a strict discriminated Zod contract and checks returned device identity.
Legacy rotation rejects registered recovery authorities before key mutation.

Real PostgreSQL: **2 spec files / 11 tests passed**, including actual cryptography,
transactions, concurrent commits, replay and revocation after proof verification.
All migrations through 0017 were applied only to an agent-created isolated test
database. The repository's existing generated snapshot baseline is not repaired;
schema-generation/release compatibility remains a gate. No app database migration,
data reset, deployment or complete test suite was run.

Affected backend native/domain/application/DTO tests: 11 files / 68 passed.
The HTTP contract adds 3 passed tests; only application handlers are mocked there,
not a claim of full JWT/throttling integration. Its initial sandbox run could not
open a socket; a localhost-only rerun succeeded. Combined current backend evidence
is 14 files / 82 tests. Server/client typechecks, scoped server strict ESLint and
`git diff --check` passed. The affected client contract/rotation/crypto/lifecycle
selection passed 6 files / 32 tests; no full suite or backend build was run.

The agent-created isolated PostgreSQL database was removed after checking that
no connections remained. Only synthetic test data was deleted; application and
financial/account data were untouched. Fixtures can recreate this test database.

Memory registration intentionally fails closed: current memory enrollment, device
revocation and rotation repositories maintain separate authority graphs. Claiming
equivalent authorization there would be unsafe. Their state unification remains
required; this restriction affects the new registration operation only.

Clean-profile recovery, signed enrollment finalization, replacement-backup UI and
dual-root rotation still remain open. Passing registration tests does not close
those items or the broader quality findings from the original review.

### Follow-up after owner acceptance

ADR-013 was accepted on 2026-09-12. New isolated native-crypto adapter units provide
BF2 encode/decode/create, a domain-separated checksum and Ed25519 public derivation,
signing and strict verification. `@noble/curves` is pinned to 2.4.0 in the client
manifest/lockfile; installation used `--ignore-scripts`. No unrelated dependencies
were upgraded. Synthetic codec and RFC-8032 vectors, malformed/legacy inputs and
length bounds passed: 7 spec files / 38 tests. These units are not activated in
enrollment/UI, so this is not a claim that independent recovery works end-to-end.

Rotation journal confirmation/cleanup now use session-guarded native IndexedDB
transactions. Their integration tests exercise parallel metadata writes, exact
operation/key ownership and rollback on invalidation during native writes. Together
with the existing persistence facade tests, 3 files / 11 tests passed.

Final combined affected-client verification after this follow-up: **23 spec files /
102 tests passed** (2026-09-12, 21:08 local time; 2.71 s). Client
`npx tsc -b --pretty false --noEmit`, scoped Oxlint and `git diff --check` passed.
No full-suite/backend build, deployment, production migration or pentest was run.

Recovery authority for a clean profile and enrollment transcript/proof binding
remain unimplemented. A VMK-only recovery representation cannot provide authority
independent of a device that already knows VMK. Accepted ADR-013 introduces an
independent recovery seed in one replacement recovery code, with an explicit
recognized-profile backup upgrade. The owner approved this ownership/backup model
on 2026-09-12; implementation and review remain open.
See `docs/plans/active/vault-v2-security-closure.md`.

Final crash/multi-tab evidence, external gates and remaining quality findings are
not marked complete. Existing review files remain untouched and untracked. No
financial/account data was deleted; only the agent-created temporary UI harness
was removed and can be recreated from its description above.

### Signed enrollment activation — 2026-09-12

The earlier enrollment-pending statements above describe the preceding checkpoint.
PostgreSQL prepare/finalize/confirm v2 and initial/recovery/trusted browser flows
now use the canonical complete transcripts from ADR-013. New device signing keys
exist before prepare and are retained through QR approval. Recovery signs with
the independent R; QR transfers VMK only, never R. Finalize stores public intent,
an encrypted server half and the verified complete-finalize digest, not VMK/R.
The retired unsigned enrollment controller and repository provider are not wired.

Immutable domain state enforces scope, authority, TTL, one-use transitions and
recorded lifecycle consistency. PostgreSQL transactions take workspace-setup and
common-vault locks, recheck authority after actual crypto, and condition the final
challenge write on database wall-clock expiry and interactive-auth freshness.
Failed writes roll back device/share/envelopes. Fresh authorized retry can replace
only expired pending state; live confirmations, active/high-security and revoked
devices cannot be overwritten. Revocation while verifying confirmation cannot
activate the pending device.

Browser confirmation now runs inside native initialization **before** publishing
the unlocked snapshot/broadcast. This prevents routing/unmount and automatic-sync
from racing activation. Explicit approved signing keys/device identity replace
stale pending local metadata; ordinary unlock still retains its stored key.
Real IndexedDB tests verify this ordering, rejection without unlocked publication,
the actual approved public key and unchanged pre-existing encrypted records.
Cancellation, lock, generation change and unmount discard delayed QR results;
owned VMK/R transfer copies are cleared. Fixed-length wire guards require an
absolute string end, rejecting a final line terminator replacing a missing digit.

Final focused verification: **backend 19 spec files / 74 tests passed; client
28 spec files / 61 tests passed**. These include real P-256/strict Ed25519 crypto,
native IndexedDB, PostgreSQL transactions/revocation/retry races and HTTP contracts
with real application handlers. HTTP tests inject a synthetic trusted user and
mock only the repository; they do not prove global JWT/throttling integration.
Client/server source typechecks, scoped backend strict ESLint, client Oxlint and
diff whitespace checks passed. A temporary strict config additionally typechecked
the new client specs (normally excluded by the app config), then was removed.

Native-browser screenshots inspected idle/confirm/generating/error/response and
actual cancellation. At measured desktop CSS width 1201 px the SVG was 360 px
square; at 375 px CSS mobile it was about 277.6 px square, with no document
horizontal overflow. The generating action was disabled and both confirmation
actions wrapped. Card/Button/scanner were reused from the design system; SVG is
generated by the native QR library, not supplied by the backend. Fixtures used
only synthetic public context/encrypted transfers. No real backup or user data
was shown. These screenshots are not a physical-camera scan/browser matrix.

All migrations through 0018 were applied only to an agent-created isolated test
database. After checks and confirming no active connections, that database and
its synthetic data were removed. The temporary visual harness/tab and viewport
override were also removed/reset. No account/financial data, application database,
production migration, deployment, full-suite build/test or pentest was touched.

Overall status remains **not complete / not independently approved**. Actual
clean-profile financial restore/publication, lost-material fresh binding,
recognized-profile replacement-backup UI, dual-root rotation, memory authority
unification, full touched-file quality review and crash/multi-tab/browser/security
release gates are still required. Memory signed enrollment intentionally fails
closed until that authority unification; it does not fall back to legacy routes.
