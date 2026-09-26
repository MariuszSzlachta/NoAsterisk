# ADR-015: NoAsterisk product identity and compatibility boundary

Date: 2026-09-25

Status: Accepted

## Context

`BudgetFlow` was a working title. Historical DEC-048 records that it was not an
acceptable launch identity and left selection of the replacement name open. The
canonical product identity is now `NoAsterisk`.

A literal repository-wide rename would be unsafe. The old string is embedded in
cryptographic domain separators, signed protocol transcripts, persisted browser
state and committed test vectors. Those values identify data and protocol versions;
changing their bytes would be a migration, not a visual rebrand.

The repository is source-available under its existing proprietary grant. A product
rename does not change the copyright owner, licence terms, deployment state or
release readiness. Choosing the name also does not establish trademark, domain,
store-name or social-handle availability.

## Decision

1. The canonical product name and casing are exactly `NoAsterisk`.
2. User-visible identity changes to `NoAsterisk` in the application, generated
   download names, passkey registration display copy, active public documentation
   and repository metadata.
3. This ADR resolves and supersedes only the open naming outcome in DEC-048.
   DEC-048 remains unchanged as historical provenance.
4. Existing identifiers containing `budgetflow`, including `budgetflow/*`,
   `budgetflow-*` and `budgetflow:*`, remain byte-for-byte unchanged when they are:
   - cryptographic domain separators, derivation labels or authenticated-data
     prefixes;
   - wire-format kinds, signed transcript domains or committed protocol vectors;
   - IndexedDB names, localStorage keys, lock names, BroadcastChannel names,
     cutover markers or other persisted compatibility keys.
5. Retained old-name identifiers are compatibility constants, not current product
   claims. Any future change to them requires an explicit protocol or storage
   migration with backward-compatibility tests.
6. New protocol versions use a neutral namespace or a separately approved
   `NoAsterisk` namespace. Existing v1/v2 bytes are immutable.
7. Historical decisions, archived reports, screenshots, evidence and commit
   messages keep the identity that was true when they were created. Current indexes
   may label them as pre-rebrand material.
8. Generic budgeting-domain names such as the repository name `budget`, workspace
   names `client` and `server`, and the package scope `@budget/domain` remain. They
   are technical domain names rather than the retired product mark.
9. One owner-approved vector mark is the canonical graphical asset for both the
   favicon and in-application branding. Until that exact mark is approved, no
   inferred replacement mark enters production code.
10. The rebrand does not change the copyright owner, source-available licence terms
    or production-readiness status, and it makes no legal-clearance claim.

## Consequences

- Active product copy and safe tooling labels can be renamed directly.
- Compatibility-sensitive occurrences require an explicit allowlist and regression
  coverage instead of a zero-match replacement target.
- The WebAuthn relying-party display name changes, while RP ID and origin remain
  unchanged so existing credentials retain their security boundary.
- Recovery download filenames change, while payload formats, checksum domains and
  cryptographic material remain unchanged.
- Historical evidence stays auditable instead of being rewritten to look current.
- Publication verification must be rerun against the post-rebrand commit; earlier
  release evidence cannot certify the new source candidate.

## Verification

- Assert the canonical name and translation parity in both supported locales.
- Cover the sidebar mark, recovery filenames and WebAuthn display name with focused
  tests.
- Maintain a deterministic inventory of every retained old-name occurrence and its
  compatibility or historical classification.
- Re-run protocol vectors, full automated checks, secret scanning and clean-clone
  publication verification after the rebrand.

## Related records

- [DEC-048: App name BudgetFlow is placeholder only](../history/decisions/DEC-048-app-name-budgetflow-is-placeholder-only-taken.md)
- [ADR-012: Device-bound vault root key and sync chain](./012-device-bound-vault-root-key-and-sync-chain.md)
- [ADR-013: Independent recovery authority and enrollment transcripts](./013-independent-recovery-authority-and-enrollment-transcripts.md)
- [ADR-014: Vault rotation transcript](./014-vault-rotation-transcript.md)
