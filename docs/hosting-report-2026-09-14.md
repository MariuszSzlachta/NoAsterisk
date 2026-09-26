# Hosting Assessment — 2026-09-14

> This dated assessment predates the NoAsterisk rebrand. Provider prices and
> availability are historical and must be checked again before purchase.

## Recommendation

The preferred low-cost starting point was a European OVHcloud VPS running Docker
Compose and Caddy, with one domain. This option assumes responsibility for Linux,
PostgreSQL, backups and monitoring. Railway Hobby with serverless sleeping disabled
was the convenience-oriented alternative. Free Render services and a Vercel
serverless conversion were rejected for the current architecture.

No service or domain was purchased as part of this assessment. The comparison
assumed low initial traffic, one API instance and no high-availability requirement.

## Workload

- The React/Vite client builds to static assets and does not require a rendering
  server in production.
- The NestJS API runs as a persistent Node.js 24 process.
- PostgreSQL is required in production; the in-memory persistence mode is not a
  production fallback.
- Browser financial data remains encrypted and synchronization sends opaque
  encrypted snapshots. The server still stores account, device and protocol
  metadata.
- HTTPS and a stable relying-party domain are required for secure cookies and
  WebAuthn/passkeys.
- CSV parsing runs in the browser. The basic deployment does not require Redis or
  a separate file-storage service.

## Historical provider comparison

| Option | Assessment at the time |
| --- | --- |
| OVHcloud VPS | Lowest-cost preferred option; full system and database operations remain the owner's responsibility. |
| Hetzner Cloud | Comparable VPS alternative, subject to plan availability and final basket price. |
| Railway Hobby | Preferred managed experience; usage-based cost and PostgreSQL backup policy require monitoring. |
| Paid Render | Straightforward managed option but more expensive at the smallest useful API/database combination. |
| Free Render | Rejected because services sleep and the free database expires. |
| Fly.io | Viable, but introduced more infrastructure choices without a clear advantage for this stage. |
| Vercel for the whole app | Rejected because converting the persistent API to functions did not match the current server design. |

The historical research used the providers' official pricing and platform
documentation: [OVHcloud VPS](https://www.ovhcloud.com/pl/vps/),
[Hetzner Cloud](https://www.hetzner.com/cloud/),
[Railway pricing](https://docs.railway.com/pricing),
[Render pricing](https://render.com/pricing),
[Fly.io autostop](https://fly.io/docs/launch/autostop-autostart/) and
[NestJS on Vercel](https://vercel.com/docs/frameworks/backend/nestjs).

## Proposed topology

Use three Compose services on one VM:

1. Caddy serves `client/dist`, terminates TLS and proxies `/api` without removing
   the prefix.
2. The NestJS API runs as a single instance initially.
3. PostgreSQL 16 uses a persistent volume and is not exposed publicly.

Build deployable images in CI. Configure automatic restarts, health checks, SPA
routing to `index.html`, log rotation, disk/availability alerts and restricted SSH.
Set `NODE_ENV=production`, `PERSISTENCE_MODE=postgres`, database credentials, JWT
secrets, `CORS_ORIGIN` and `WEBAUTHN_RP_ID` explicitly. Preserve the public domain
when moving providers because changing the WebAuthn relying-party ID can require
passkey re-registration.

## Production prerequisites

- Add an independent encrypted PostgreSQL backup and rehearse restoration. A VPS
  snapshot is not a substitute for a tested recovery procedure.
- Rehearse migrations on an isolated copy and verify a fresh installation.
- Patch the operating system, Node.js and PostgreSQL; monitor failed backups and
  resource exhaustion.
- Verify TLS to any external database rather than disabling certificate checks.
- Configure trusted-proxy handling so authentication rate limits use the correct
  client address.
- Complete the [Vault v2 definition-of-done matrix](./security/vault-v2-dod-matrix.md),
  [cutover runbook](./runbooks/vault-v2-cutover.md) and target-domain tests for
  login, passkeys, synchronization and recovery.

One VM is a single point of failure. It is an acceptable cost trade-off for an
initial private deployment, not a high-availability design.
