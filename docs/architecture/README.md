# Architecture Map

## Implemented/current references

- [CSV parser and anonymizer overview](./csv-engine/overview.md)
- [CSV parser algorithms](./csv-engine/parser.md)
- [PII anonymizer algorithms](./csv-engine/pii-anonymizer.md)
- [Categorization engine](./categorization-engine.md)
- [Current local-first data-flow reference](./local-first-e2ee.md) — CSV import and user-owned financial state are now client-local; the backend is an opaque sync relay for the MVP path.
- Backend module behavior is documented in the [backend developer guides](../guides/backend/).

## Architecture decision and migration reference

- [Local-first E2EE architecture and migration](./local-first-e2ee.md) — historical migration reference plus current MVP sync behavior; sections describing future phases remain explicitly marked as future work.
- [ADR-003](../adr/003-local-first-e2ee-architecture.md) — original decision summary. Its source status is still `Planned` and must be formally reviewed before being changed to `Accepted`.
- [ADR-011](../adr/011-mvp-local-first-opaque-sync-boundary.md) — accepted
  local-first financial-data boundary and opaque sync relay.
- [ADR-012](../adr/012-device-bound-vault-root-key-and-sync-chain.md) — accepted
  design for a random client-held VMK, split local/server unlock, optional passkey
  PRF and explicit device enrollment. The ADR preserves its pre-implementation
  source status; current code and release evidence determine delivered behavior.
- [ADR-013](../adr/013-independent-recovery-authority-and-enrollment-transcripts.md)
  — accepted independent recovery authority and delegated enrollment design.
- [ADR-014](../adr/014-vault-rotation-transcript.md) — canonical dual-root rotation
  transcript. Its source status remains proposed; implementation evidence does not
  retroactively change the recorded decision status.

## Original assumptions

- [Original system and architecture assumptions](./original-system-assumptions.md) — source-era stack, backend, import-batch and anti-PII assumptions extracted from the original product plan. These are not automatically current.

## Authority rule

Architecture references explain system structure and algorithms. ADRs explain why a choice was made. Developer guides explain how implemented modules are extended. Plans are not evidence of delivered behavior.

The root [README](../../README.md) provides the concise current end-to-end runtime
and data-flow view. Detailed protocol semantics remain in the ADRs and guides above.
