# Vault v2 MVP — Checkpoint, Rollback and Fork Policy

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

## Invariants and working approach

Backend does not receive VMK, recovery seed R, full backup or plaintext finances. It may have public authority, signatures, ciphertext and half of split unlock, insufficient for decryption. Login password does not derive financial keys. Data is encrypted on every write; logout removes access to keys rather than sending an encryption request to the database.

Every async step checks generation, full account/workspace/vault/key/device context and deadline; cancel/lock/logout/unmount invalidates the operation. Clean owned byte buffers in finally; do not promise deletion of immutable strings or protection against malicious frontend/XSS/device compromise. Do not add your own cryptography.

Read ADR-012, ADR-013, the threat model, security closure and coding checkpoint.
Verify the current tree and preserve unrelated changes. Execute the steps
sequentially with evidence; implement backend changes from lower layers upward.
New decisions require an ADR. Do not migrate or reset real data, deploy, or delete
accounts without explicit approval.

## Goal and dependencies

An authentic snapshot does not mean a fresh snapshot. A new profile without an independent anchor cannot detect rollback from the backend alone. Do not declare a solution to this impossibility with a backend signature or timestamp.

## Next steps for implementation

1. Inventory opaque-sync-snapshot, high-water metadata, synchronize-vault, restore/enrollment and snapshot API. Describe current fail-closed with missed chain links.
2. ADR with threat model: where does the trusted checkpoint come from (e.g., verified device QR / previously verified local floor / versioned backup with checkpoint). Recovery code without an independent anchor must explicitly have limited freshness guarantee; if the product requires absolute detection, block this path until the anchor is obtained.
3. Define canonical signed checkpoint/chain segment schema: scope/key, revision/hash, predecessor, signer and change/revoke authority rules. Trust does not come from the public key returned by a malicious backend.
4. Choose a limited protocol for missing links/checkpoints, with size/length limits and bounded requests. Do not remove predecessor check for convenience.
5. Verify the entire required path, AEAD, signature, transport binding and authority before parse/restore/publication/markSynced. Do not promote remote revision to local trusted floor before authentication.
6. Update metadata floor monotonically under guarded IDB transaction; snapshot and ack precisely bind revision/hash. Same revision + different hash is a fork.
7. Consistent manual/auto sync policy, clean recovery, QR join, file restore and key rotation; UI conflict without silent force/downgrade.
8. Passing checkpoint via QR/backup only authenticated binding, versioned codec, test vectors and explicit compatibility.
9. Threat model describes availability vs integrity vs freshness and lack of global latest version guarantee without source independent from backend.

## Acceptance criteria / behavior

- Old snapshot and fork are rejected at trusted floor; missing links are not automatically accepted.
- Clean profile with authenticated checkpoint detects lower revision/different hash; without checkpoint, it preserves explicitly chosen limited policy.
- Changing context/cancel after verify does not publish anything; local unsynced data is not lost.
- Malformed, oversized, cross-key/signer substituted chains are rejected by real crypto.

## Handoff

Do not deploy to production. Submit commit, list of files, current status of criteria and the report required above. Do not start the next plan with unresolved security blockage. Review will be done separately after user signal.
