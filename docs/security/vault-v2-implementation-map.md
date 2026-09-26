# Vault v2 reconciliation map

| Existing area | Decision | Reason |
|---|---|---|
| `adapters/vault-protocol` | keep and extend | pure Web Crypto boundary; split wrapping and strict validation belong here |
| `persistence/cutover` | keep and extend | exact allowlist and idempotency are reusable; production execution remains prohibited |
| `persistence/crypto` | keep for compatibility, isolate from v2 | existing v1 envelope shape must not silently become the v2 wire contract |
| `persistence/session` | improve and integrate with generation-based v2 session | lock clears key references; generation guards reject post-lock writes |
| `persistence/dexie` | preserve control-plane data and add account/vault-scoped v2 schema | v1 financial DB must not be opened as the v2 store |
| `persistence/migrations` | retain only for explicitly legacy tooling/cutover audit | v2 bootstrap must not migrate v1 financial records |
| server auth | extend with `authTime`/`amr` and public passkey login | password and passkey account authentication are separate from vault authority; refresh preserves original freshness |
| server vault storage | add v2 keyset/device/credential/share/envelope tables | backend stores opaque material and encrypted ServerShare only; WebAuthn login challenges are single-use |

Existing uncommitted owner changes were preserved and inspected. Legacy v1 financial
modules remain isolated for the reviewed cutover path; runtime bootstrap, split unlock,
public passkey authentication, recovery setup, high-security transition, opaque sync,
standard PRF envelope enrollment, device listing/revocation, backend device-signature verification, standard and
high-security VMK rotation, encrypted client rotation journaling and the atomic
server keyset transaction are now wired. Trusted-device enrollment now has a
versioned ECDH/HKDF/AES-GCM transfer module, device-signature proof verifier,
session-only VMK handoff and a native QR scanner component; the final two-browser
screen orchestration remains a release gate.
Production destructive cutover and production-like restore rehearsals remain explicitly
outside this worktree execution. Rotation revokes all other active devices in the same
server transaction, clears opaque snapshots and requires recovery plus fresh auth.
