# Legacy E2EE Vault Plan

Status: **SUPERSEDED AND COMPLETED**

This record preserves the intent of the original PBKDF2/AES-GCM browser-vault
plan. The original plan proposed replacing a Base64-only upload with client-side
encryption, password prompting, authenticated restore, large-blob handling and
browser crypto tests.

The implementation evolved beyond that design. Current vault behavior is
defined by the accepted vault ADRs, the Vault v2 security documentation and the
active release plans. In particular, account credentials must not be treated as
financial-data encryption keys, and the legacy PBKDF2 design must not be used as
an implementation specification.

Authoritative follow-up documentation:

- [Device-bound vault root key and sync chain](../../adr/012-device-bound-vault-root-key-and-sync-chain.md)
- [Independent recovery authority](../../adr/013-independent-recovery-authority-and-enrollment-transcripts.md)
- [Vault v2 threat model](../../security/vault-v2-threat-model.md)
- [Vault v2 active plans](../active/vault-v2-mvp/README.md)
