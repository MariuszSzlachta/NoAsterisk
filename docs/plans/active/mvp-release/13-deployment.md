# Session 13: Prepare and Execute Deployment

## Objective

Create production deployment artifacts, provision the chosen environment, deploy the release candidate and prove the core application is reachable with correct security boundaries.

**Prerequisite:** Session 12 green and Session 11 mobile audit complete

## Preconditions requiring owner authority

- Confirm backend, database/blob and static-hosting providers; the older Fly.io/Cloudflare proposal is not automatically authoritative.
- Confirm production domain and API origin.
- Provide or approve creation of provider projects, DNS records and secrets.
- Decide closed alpha versus invite-only beta. Do not silently enable public registration.

## Scope

1. Add a multi-stage backend Dockerfile and `.dockerignore` suitable for the npm workspace layout. Run as a non-root user and include only runtime files in the final image.
2. Add a public, minimal health/readiness endpoint that does not disclose versions, secrets or database details. Readiness must reflect required backend dependencies.
3. Make CORS, cookie flags, trusted proxy behavior, body limits and production environment validation explicit and fail-closed.
4. Add frontend SPA routing, CSP/security headers and production API configuration for the chosen host.
5. Add forward-only database migration execution and dictionary seeding strategy. Seed credentials must never be printed or hard-coded.
6. Configure opaque sync-blob storage limits, revision metadata, retention and backup according to the selected provider.
7. Provision staging/production, store secrets in the provider secret manager and deploy only the Session 12 green commit.
8. Configure CI/CD so test/build failure prevents deployment. Require manual production promotion unless the owner explicitly chooses automatic release.
9. Run smoke tests for health, registration mode, login/logout, dictionary fetch, two-device encrypted blob push/pull/conflict, client routing and error handling.
10. Record rollback procedure and the exact deployed commit.
11. Enforce production persistence mode and database transport encryption;
    startup must fail closed when either is missing or invalid.
12. Configure log collection with explicit redaction and retention. Do not log
    authorization headers, cookies, passwords, deletion bodies, CSV rows,
    plaintext financial data or ciphertext blobs.
13. Document backup expiry, deletion propagation, restore behavior for deleted
    accounts, RPO/RTO and the last successful restore exercise.
14. Self-host fonts and other browser resources where practical; otherwise add
    the real provider, transfer and retention behavior to the legal inventory.

## Non-goals

- No financial-row/import endpoint may be reintroduced for deployment convenience.
- No secret or production identifier in committed files.
- No public launch, billing, analytics or multi-region architecture.
- Do not rely on outdated free-tier or pricing assumptions; verify them when choosing providers.

## Gates

- Clean local container build and non-root runtime.
- Health/readiness returns expected status.
- Production client loads on a deep link and calls only the configured API origin.
- Disallowed origins receive no CORS authorization.
- Security headers are present on client responses.
- Server exchanges an opaque encrypted sync blob with revision protection and cannot parse its plaintext.
- Core smoke flow passes against the deployed commit.
- Production configuration fails closed for persistence, DB transport and
  required secrets.
- Backup/restore and deletion behavior are documented and evidenced.

## Handoff

- Provider/project names without secrets.
- Deployed commit and environment URLs.
- Migration and rollback status.
- Smoke-test results and observed headers.
- Any manual operational step still required.
