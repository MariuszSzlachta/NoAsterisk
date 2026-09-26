# Vault v2 — security closure after f94294f5

## Granular MVP handoff — 2026-09-13

Implementation checkpoint committed as `86fa3bf5`; this is not an MVP approval.
Execute the six [mandatory-quality dev plans](./vault-v2-mvp/README.md) sequentially.
Each plan binds the complete FE/BE reports in `temp`, all-file semantic review,
behavioral evidence and independent approval. Production reset/deployment needs
separate operator authorization.

2026-09-12. Overall status: **not complete**.
No data reset or backend deployment has been performed.

## Implemented worktree changes, pending final independent review

- Rotation now obtains explicit possession confirmation of the new backup before
  local re-encryption or server commit. Decline/lock/unmount cancels the prompt.
- New retry journals record that confirmation. Legacy journals do not auto-commit;
  settings can expose the active next-root backup and confirm it before retry.
- Old-root validation in a pending journal now verifies the next sentinel instead
  of comparing the decrypted next VMK with the old VMK.
- Replace/publication checks are pinned to the requested session. Restore captures
  mutation version, high-water state and store identities before remote/file waits.
  Stores and exact covered-version ack publish inside the persistence write queue.
- Manual/automatic sync and remote restore share a queue. File restore also joins
  that queue before replacement. Sync/remote reads have bounded network lifetimes.
- Transport revision/device/key/date/hash must match the envelope. Sync ack must
  match the locally uploaded revision/hash before metadata can become clean.
- Journal confirmation/cleanup now run in guarded IndexedDB read/write transactions,
  preventing stale whole-row writes from losing concurrent metadata changes.
- ADR-013 is accepted. BF2 backup and strict browser Ed25519 primitives now feed
  signed v2 initial/recovery enrollment; trusted QR join binds the new signing key
  generated before prepare and the server-issued nonce/expiry.
- Recognized-profile recovery authority registration has a scoped PostgreSQL
  implementation, immutable domain transition, strict DTOs, canonical transcript
  and mandatory active-device plus independent-recovery signatures. Real database
  tests cover replay, proof/context substitution, revocation races and concurrent
  commits. This backend phase does not yet expose a replacement-backup UI.
- Bootstrap validates discriminated metadata at the client API boundary and returns
  the recovery public authority. Legacy rotation fails closed for registered
  authorities until dual-root rotation exists. Memory registration deliberately
  fails closed because existing memory adapters do not share device authority.

This does not claim atomicity across IndexedDB and localStorage. A committed IDB
replacement whose publication is superseded stays dirty when still in the same
session; a changed session must not receive its publication or ack. Multi-tab/crash
evidence remains part of final review, not implied by a unit test.

## Next implementation — ADR-013 accepted on 2026-09-12

Do not implement a recoverable signing authority derived from VMK while claiming
that an old VMK-holding device cannot use it. See ADR-013 for the ownership change.

Implement each bullet bottom-up with its own focused verification:

1. Freeze new recovery representation and complete transcript schemas/constants.
   Record test vectors for codec/checksum, recovery public key, canonical message
   bytes and signatures. Reject ambiguous versions, oversize/private JWK inputs,
   duplicate/unknown fields and malformed lengths. No casts or suppressions.
   Progress: BF2 backup representation and RFC-8032 primitive vectors are verified.
   Registration transcript and backend verifier parity are verified; initial,
   trusted-join, recovery-finalize and rotation transcripts remain outstanding.
   Follow-up after commit bb3a9f98: canonical initial/recovery/trusted finalize and
   trusted delegation value objects plus native complete-proof verification are
   implemented. PostgreSQL v2 prepare/finalize/confirm and the browser initial,
   recovery and QR flows are now wired to the exact canonical transcripts. QR v2
   wraps the authenticated native encrypted-transfer codec; a QR-only nonce or
   retired unsigned backend route is not accepted as enrollment authority.
2. Add readonly domain authorization/delegation state and workspace-scoped ports.
   Explicit initial/trusted/recovery transitions with DomainError; expiry,
   consumption and current key version must be invariants, not presentation flags.
3. Add recovery-public-authority persistence and key-version ownership. Add signed,
   challenge-bound registration for recognized legacy profiles; do not overwrite
   an existing authority via ordinary password login or an arbitrary client ID.
   Progress: PostgreSQL registration and migration 0017 are implemented and tested
   against an isolated database. Memory authority unification and the frontend
   backup-upgrade workflow remain open. No application database was migrated.
4. Make prepare bind new signing/ephemeral keys and the server's expiry/context.
   Generate the new device key before requesting QR approval. Retain it only in
   the guarded operation scope; initialize the exact approved key on finalize.
5. Verify old-device delegation and new-device final signature for trusted join.
   Verify the independent recovery signature for recovery. Bind exact envelope
   bytes, optional passkey envelope, purpose/suite, proof digest and challenge.
   Reject wrong purpose, stale key, same-device approver, revoked approver, replay,
   key/envelope substitution and any retry with a different transcript.
6. Atomically finalize pending state under the common vault lock. Roll back failed
   challenge consumption/writes. Define safe pending retry/expiry and exact
   confirmation behavior; memory/PostgreSQL must implement the same state model.
   Progress for 2/4/5/6: immutable one-use domain state, scoped port, public-intent
   persistence and migration 0018 are implemented. PostgreSQL verifies complete
   proofs and rechecks current authority after crypto awaits. Device writes and
   challenge consumption/confirmation are transactional and deadline-bound.
   Expired pending-device retry requires a fresh complete authority proof and
   cannot replace an active/high-security/revoked device or a live confirmation.
   The browser initializes the exact prepared signing key, then signs confirm
   over the stored-finalize digest/context. Failed initialization/confirm locks.
   QR cancellation, lock, generation change and unmount discard delayed responses;
   owned transfer/recovery VMK copies are cleared through finally paths.
   Legacy unsigned enrollment is not registered. Memory signed enrollment remains
   fail-closed pending state unification, not a completed conformance claim.
7. Clean-profile recovery decodes both roots locally, validates the authority and
   authenticated remote data, enrolls through the recovery route, then actually
   restores records and publishes through the session-scoped path. Never fall
   back to creating an empty vault for an existing workspace/key.
8. Initial setup and recognized-profile upgrade present the complete replacement
   code through copy/download/QR and local possession confirmation. No secret
   telemetry, persistent strings, real-code screenshots or backend private keys.
   Progress: guarded client upgrade operation and strict signed registration API
   are implemented. Existing VMK is preserved; independent R and BF2 are local.
   Explicit backup confirmation precedes prepare; complete proof confirmation
   and a matching scoped public-authority readback precede success. Native crypto
   and encrypted-IDB tests cover cancellation/lock/substitution. User-facing
   settings wiring and non-rotation backup dialog are now implemented. Native
   screenshots cover desktop/mobile/loading/confirmed/error/form/cancel states;
   focused tests include actual DS confirmation interaction and invalidated late
   completion. Independent browser/backend/accessibility review remains open.
9. Rotation replaces both roots/public authority, integrating backup confirmation
   already implemented here. Retry journal binds authority and envelope transcript;
   no plaintext R/backup in IDB and no automatic legacy backup upgrade.
10. Add shared behavior corpus for initial/join/recovery/rotation/revoke races.
    Crypto tests use real maintained primitives; PostgreSQL integration tests use
    actual transactions/locks. E2E must verify financial records on a second clean
    profile, not just requests. Auth/lifecycle tests must contain real owned roots.
11. Apply all applicable FE/BE quality rules to every touched file: domain/DTO
    mapping, FSD, dedicated unit/barrel/spec, one export, no casts/private utility
    dumping, render-only DS composition, typed API boundaries and warning disposition.
12. Update ADR/implementation map, threat/failure/browser matrices, guides and MVP
    DoD with actual evidence. Run proportional affected gates and independent
    review; retain required pentest/browser/rollback checks as release gates.

### Financial restoration follow-up

Implemented in the worktree: recovery/trusted enrollment authenticates and parses
the actual remote snapshot before enrollment writes, restores all validated
collections through the guarded encrypted replacement/publication queue after
signed confirmation, and publishes `unlocked` only afterward. A matching local
sentinel and complete local database instead preserve local financial records and
unsynced changes when only device credentials were lost. The old parse-and-discard
reader was removed. Recovery and QR on a lost-material recognized profile create
a fresh binding, persisting its browser identity only after successful completion.

Durable `requiresRemoteRestore` metadata stays set on interrupted restoration.
Ordinary unlock retries the real restore before UI/automatic sync publication;
initial setup explicitly starts without this requirement. Empty/unavailable remote
storage does not produce an empty recovered vault. An existing remote snapshot is
currently required for clean-profile join/recovery (including an authentic empty
financial snapshot); restore before the initial snapshot was synchronized retries
instead of treating server absence as proof of an empty vault.

A clean profile without a trusted prior checkpoint verifies AEAD, signature,
scope and envelope/transport binding but cannot prove global freshness. No remote
revision/hash is promoted into a fictitious trusted pre-decryption checkpoint.
Existing local checkpoints still reject rollback/fork; missed intermediate chain
links remain fail-closed until a verified chain/checkpoint policy is implemented.

Evidence: 16 focused spec files / 51 tests, real crypto and encrypted IndexedDB,
including financial publication after recovery and encrypted trusted QR transfer.
Independent review and real clean-browser/network E2E are still release gates.
Replacement-backup upgrade UI is now wired with focused proof/form/lifecycle and
native visual evidence, pending independent review. Next implementation: dual-root rotation,
memory-state unification and remaining quality/security/browser release gates.

Do not mark Session 09B/MVP complete before authority, transcript and all remaining
review/process requirements are satisfied. Existing broader architecture comments
are not automatically closed by these targeted security fixes.
