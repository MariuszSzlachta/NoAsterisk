# Vault Protocol v2 verification report

Date: 2026-09-12

This report records repository-level verification. It does not authorise a
destructive production cutover and does not claim protection against same-origin
XSS, malware or a deployment that serves a malicious frontend.

## Automated results

| Area | Command | Result |
|---|---|---|
| Client unit/integration | `npm run test --workspace=client -- --run` | 333 files passed; 2699 passed, 8 existing expected-fail (2707 total) |
| Versioned protocol vectors | `npm run test --workspace=client -- --run src/shared/adapters/vault-protocol/vault-protocol.spec.ts` | 12 passed; hierarchy and split-wrap HKDF vectors execute against Web Crypto |
| Client coverage | `npm run test:coverage --workspace=client -- --run` | 328 files passed; 81.72% statements / 82.03% lines; command remains below the repository-wide 85% threshold |
| Client cutover rehearsal | `npm run test --workspace=client -- src/shared/adapters/persistence/cutover/legacy-cutover.spec.ts` | 5 passed; includes two isolated restore surrogates and failure-lock/retry behavior |
| Legacy v1 route shutdown | `JWT_SECRET=... JWT_REFRESH_SECRET=... npm run test --workspace=server -- --runInBand src/user-settings/presentation/user-settings.controller.spec.ts` | 2 passed; legacy vault read/write routes return `410 Gone` before exposing or mutating v1 state |
| Recovery QR protocol/UI contract | `npm run test --workspace=client -- --run src/shared/adapters/vault-protocol/recovery-qr.spec.ts src/app/routing/useVaultUnlock/useVaultUnlock.spec.ts` | 5 passed |
| Client lint | `npm run lint --workspace=client -- --max-warnings=0` | passed |
| Client production build | `npm run build --workspace=client` | passed; existing large-bundle warning only |
| Server full unit suite | `JWT_SECRET=... JWT_REFRESH_SECRET=... npm run test --workspace=server -- --runInBand` | 73 suites passed; 383 passed, 18 skipped (401 total) |
| Server coverage | `RUN_POSTGRES_INTEGRATION=true DB_HOST=127.0.0.1 DB_PORT=5432 DB_NAME=budget DB_USER=budget_app DB_PASSWORD=<container-configured> VAULT_INFRASTRUCTURE_KEY_BASE64=<ephemeral-32-byte-key> JWT_SECRET=... JWT_REFRESH_SECRET=... npm run test:cov --workspace=server -- --runInBand --testTimeout=30000` | 74 suites passed; 74.81% statements / 64.53% branches / 66.37% functions / 74.35% lines; command remains below the repository-wide thresholds |
| Server E2E | `JWT_SECRET=... JWT_REFRESH_SECRET=... npm run test:e2e --workspace=server -- --runInBand` | 2 suites, 10 passed |
| PostgreSQL Vault v2 integration | `RUN_POSTGRES_INTEGRATION=true DB_HOST=127.0.0.1 DB_PORT=5432 DB_NAME=budget DB_USER=budget_app DB_PASSWORD=<container-configured> VAULT_INFRASTRUCTURE_KEY_BASE64=<ephemeral-32-byte-key> npm run test --workspace=server -- postgres-vault-protocol.integration.spec.ts --runInBand` | 14 passed against the current local PostgreSQL 16 container; password and infrastructure key were supplied only through the process environment |
| Client security E2E | `npm run e2e:security --workspace=client` | 3 passed, including the secure-context/Web Crypto/IndexedDB browser baseline |
| Vault v2 browser E2E | `npm run e2e --workspace=client -- --project=chromium e2e/security/vault-v2.spec.ts` | 6 passed, including trusted-device request/scanner UI, recovery QR display, automatic sync and new-device password-only guard |
| Trusted-device scanner component | `npm run test --workspace=client -- src/shared/ui/TrustedDeviceQrScanner/TrustedDeviceQrScanner.spec.tsx` | 4 passed; unsupported capability, inactive state, successful decode/camera cleanup and permission failure are covered |
| Cross-device snapshot signer | `npm run test --workspace=client -- src/shared/adapters/vault-protocol/opaque-sync-snapshot.spec.ts` | 3 passed; a second device snapshot verifies with the sender public key and rejects a different device key |
| Full Chromium E2E | `npm run e2e --workspace=client -- --project=chromium` | 111 passed with one worker (7.7 min), including all Vault v2/security scenarios. The runner defaults to one worker for reproducibility; bounded parallelism is opt-in via `E2E_WORKERS`. An earlier five-worker run produced infrastructure/dev-server timeouts and is retained only as a stability finding. |
| Server build/lint | `npm run build --workspace=server`; strict lint | passed; ServerShare infrastructure fields are bounded and validated before Base64 decode/decrypt |
| Production dependency audit | `npm audit --offline --omit=dev --json` | 0 info/low/moderate/high/critical advisories from the local npm advisories cache; Drizzle 0.45.2, multer 2.3.0 and qs 6.16.0 are locked. Online registry refresh was unavailable in this environment and remains a release-owner follow-up |
| Frontend quality gate | `bash scripts/quality/fe-quality-gate.sh` | passed; 38 warnings, no blocking errors |
| Backend quality gate | `bash scripts/quality/be-quality-gate.sh` | passed; 5/5 steps clean, with the account-scoped WebAuthn repository exception documented in its port |
| Frontend layer checks | `bash scripts/quality/fe-layer-check.sh api`; `model`; `store`; `ui`; `page` | all requested layers passed; model layer reports existing missing-spec warnings only |

The abbreviated `JWT_SECRET=...` values above represent the repository test
secrets used in the command, not deployable credentials.

The PostgreSQL integration rerun passed against the current local container and
schema. The password and ephemeral infrastructure key were not written to the
repository, test output or documentation.

## Boundary evidence

- The only WebAuthn network DTOs are the explicit allowlists in
  `client/src/shared/adapters/webauthn/allowlisted-webauthn-dto.ts`.
- Passkey option responses are bounded and allowlisted before any challenge or
  credential descriptor reaches the browser WebAuthn API; malformed credential
  types and transports fail closed.
- No call to `PublicKeyCredential.toJSON()` exists in the protocol path.
- PRF output is read from the ceremony result, immediately imported into an
  HKDF `CryptoKey`, and is not included in the assertion DTO, application
  state, query cache, storage or telemetry.
- A recognized passkey login carries the PRF result only through a transient
  in-memory handoff from authentication to vault bootstrap; the handoff is
  context-bound, single-consume and cleared on logout. Password login does not
  invoke a second passkey ceremony in Standard mode.
- VMK, LocalShare, PRF output and derived vault keys have no network DTO path. During
  an unlocked trusted-device approval, a VMK copy exists only in the session's
  memory and is zeroed after the local QR response is created; lock/account switch
  clears the session copy.
- ServerShare is returned only by the fresh-authenticated endpoint and is
  zeroed after the unlock/high-security operation; the browser persistence
  adapter stores only the non-extractable LocalShare.
- Refresh preserves the original `authTime` and `amr`; the ServerShare
  endpoint calls `assertFreshInteractiveAuth` and returns `step-up-required`
  for missing, stale or future authentication metadata.
- Raw backend ServerShare storage consists of infrastructure ciphertext,
  nonce, authentication tag and infrastructure key version. No plaintext
  ServerShare column exists in the schema or migration.
- Sync writes verify the device's stored P-256 signing key against the canonical
  versioned snapshot payload before CAS persistence; a revoked device is rejected
  before storage access.
- Sync reads return only the sender device's public P-256 JWK as additional
  non-secret metadata. The client validates/imports that key and verifies the
  sender signature before decrypting, so a second device does not incorrectly use
  its own signing key for another device's snapshot.
- The local rotation primitive encrypts every validated JSON record under the new
  key context before one Dexie transaction updates records, sentinel, keyId and
  LocalShare; authentication failure leaves the old records untouched. A pending
  rotation journal contains only authenticated ciphertext of the next VMK and is
  retained until the idempotent server commit succeeds.
- Recovery enrollment writes only a `pending` device first; after the client has
  locally initialized and authenticated its v2 database, a fresh one-time
  confirmation activates the device. A failed local initialization therefore
  cannot expose ServerShare through the pending record.
- Account deletion uses the transactional repository path rather than a raw user
  delete: sole-user workspace deletion removes the Vault first, then relies on
  the foreign-key graph to remove keysets, devices, ServerShare, envelopes,
  snapshots, WebAuthn records and rotations. The integration contract asserts
  the complete graph, including the Vault itself.
- Standard rotation derives the new device envelope from LocalShare + ServerShare;
  high-security rotation derives it from the verified PRF output and explicitly passes
  `localShare: null` to the persistence layer.
- Standard settings can register a maintained WebAuthn credential and store an opaque
  PRF envelope while retaining the device-wrap envelope as the explicit fallback;
  high-security transition uses the same credential ceremony but deletes that fallback.
- Bootstrap exposes a non-secret `securityProfile`; high-security fallback is rejected
  from that authoritative profile even if a stale device envelope appears in a response.
- The server rotation transaction updates the keyset, deletes old snapshots and
  envelopes, retains the initiating device envelope plus the optional standard
  PRF envelope, revokes other devices and records an idempotency result. A retry
  cannot apply a second rotation.

The local PostgreSQL inspection after migration reported all nine v2 tables:
`vault_keysets`, `vault_devices`, `vault_server_shares`,
`vault_device_envelopes`, `vault_sync_snapshots`,
`vault_enrollment_challenges`, `webauthn_credentials`, `webauthn_challenges` and
`vault_rotations`. It reported zero plaintext-like `vmk`, `prf` or
`server_share` columns; the only matching capability column is the boolean
`webauthn_credentials.supports_prf`. The integration test also verified that
the ServerShare ciphertext is not the raw base64 secret, that revoked devices
cannot receive it, that device list/revoke is workspace-scoped, and that account
deletion cascades through the v2 graph.

## External release gates still requiring an environment owner

The repository cannot produce truthful evidence for these without access to a
real production-like restore and raw PostgreSQL/IndexedDB captures:

1. two destructive-cutover rehearsals against separately identified restores;
2. raw PostgreSQL inspection proving ciphertext values and cascade results;
3. raw browser-profile inspection on each supported browser/PRF capability;
4. deployment-specific CSP, dependency provenance and malicious-frontend
   controls.

The exact procedure and required evidence are in
`docs/security/vault-v2-cutover-rehearsal.md`. The production cutover remains
disabled and requires explicit owner approval for a named environment.

The complete requirement-by-requirement status is indexed in
`docs/security/vault-v2-dod-matrix.md`; it intentionally separates repository
evidence from environment-owner release gates.

## Release blockers that are intentionally not hidden

Offline cached ciphertext cannot be remotely erased after device revocation; the
protocol addresses this by rotating the VMK and revoking the device, not by claiming
remote deletion. The repository-level implementation now covers the rotation protocol,
but production release still requires the external rehearsal and raw-capture gates
listed above. This is not a claim of protection against XSS, malware or malicious
frontend deployment.

Trusted-device QR transfer now has a versioned ECDH/HKDF/AES-GCM payload, an
ECDSA device approval signature and server-side verification against an active
device in the same account/workspace/vault. The camera-driven two-browser UI and
its manual accessibility walkthrough are still external release evidence; recovery
remains the production fallback until that UI evidence is complete.
