# NoAsterisk

[![CI](https://github.com/MariuszSzlachta/NoAsterisk/actions/workflows/ci.yml/badge.svg)](https://github.com/MariuszSzlachta/NoAsterisk/actions/workflows/ci.yml)

NoAsterisk is a local-first personal and household budgeting application. It
combines browser-side bank-statement import, reviewable PII masking, encrypted
local persistence and user-initiated end-to-end encrypted snapshot sync.

> [!IMPORTANT]
> NoAsterisk is under active development. It is not security-certified,
> independently audited or approved for production use with real financial data.

> [!NOTE]
> The repository is source-available for review and evaluation; it is **not open
> source**. The code remains proprietary and `UNLICENSED`. See [LICENSE](./LICENSE).

## Implemented capabilities

| Area                        | Current behavior                                                                                                                                                                                                                                                     |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CSV import                  | Five-step browser workflow: parsing, column mapping, PII review, transaction review and local commit. The parser handles multiple separators, encodings, date/amount formats, metadata rows, footers and unescaped descriptive fields covered by committed fixtures. |
| Transactions                | Imported and manually entered transactions are persisted locally and feed filtering, dashboards and analytics.                                                                                                                                                       |
| Categorization              | Local categories and priority-ordered contains/exact rules can categorize imported and manually entered transactions.                                                                                                                                                |
| Budgets and analytics       | Budget progress, KPIs, trends, category breakdowns, savings rate and recent transactions are computed from local state. Recurring-expense detection remains placeholder data.                                                                                        |
| Local persistence           | Financial collections are encrypted with AES-256-GCM before storage in IndexedDB. Zustand is an in-memory view layer, not durable storage.                                                                                                                           |
| Vault and sync              | Vault enrollment, recovery, device management, passkeys, rotation and explicit whole-snapshot synchronization are implemented. The backend transports opaque encrypted snapshots and protocol metadata.                                                              |
| Accounts and administration | Password/JWT authentication, invite-aware registration, user settings, dictionaries and administrative endpoints are provided by the NestJS backend.                                                                                                                 |

The detailed, code-aligned capability pages live in the
[product documentation](./docs/product/README.md).

## Data and security boundary

Raw CSV contents are parsed in the browser and are not uploaded. After review,
financial records are encrypted before durable browser storage. A synchronization
request may send a complete encrypted snapshot to the backend; it does not send
transaction plaintext, vault keys or the vault passphrase.

This boundary does **not** mean that all server-side data is anonymous. The backend
processes account, authentication, device and protocol metadata, and ciphertext can
still be personal data under applicable law. Decrypted financial data exists in
browser memory while the vault is unlocked and remains exposed to a compromised
client runtime.

The authoritative current decision is
[ADR-011](./docs/adr/011-mvp-local-first-opaque-sync-boundary.md). The
[privacy and security capability page](./docs/product/capabilities/privacy-and-security.md)
describes guarantees, non-guarantees and remaining release blockers.

## Architecture

```text
browser
  React + feature-oriented slices
  cross-feature application model (records, shared state and policies)
  CSV parsing and PII review
  domain operations and analytics
  encrypted IndexedDB persistence
  snapshot encryption, validation and restore
            |
            | account/auth requests and opaque encrypted snapshots
            v
server
  NestJS + hexagonal boundaries
  authentication and administration
  vault protocol and opaque sync relay
  PostgreSQL via Drizzle ORM

packages/domain
  framework-free TypeScript domain model shared by the workspaces
```

Important references:

- [Architecture map](./docs/architecture/README.md)
- [Current local-first data flow](./docs/architecture/local-first-e2ee.md)
- [CSV engine](./docs/architecture/csv-engine/overview.md)
- [Architecture Decision Records](./docs/adr/README.md)

## Local development

### Prerequisites

- Node.js 24 (see [`.nvmrc`](./.nvmrc)) with its bundled npm
- Docker with Compose

### Start a complete local environment

The checked-in environment templates contain development-only values. Never reuse
them for deployment.

```bash
npm ci
cp server/.env.example server/.env
cp client/.env.example client/.env
docker compose --env-file server/.env up -d postgres
npm run db:migrate --workspace=server
npm run db:seed:dictionaries --workspace=server
npm run dev
```

The client is available at `http://localhost:5173`; Vite proxies `/api` to the
server at `http://localhost:3000`. The development template enables open
registration so a local account can be created without a pre-seeded invite.

Stop the database without deleting its volume:

```bash
docker compose --env-file server/.env down
```

### Verification

```bash
# Domain, client and backend unit tests; no database required
npm run test

# Seven PostgreSQL suites in an isolated ephemeral database
npm run test:integration

# Build, non-mutating lint, unit tests and integration tests
npm run verify

# Client coverage and Chromium browser flow
npm run test:coverage --workspace=client
npm run e2e --workspace=client
```

The integration runner provisions a uniquely named PostgreSQL 16 container on a
random loopback port, runs migrations and removes the container and storage after
success, failure or interruption. It does not use the development database.

Additional workspace commands and ownership are documented in
[`package.json`](./package.json), [CONTRIBUTING.md](./CONTRIBUTING.md) and the
[documentation map](./docs/README.md).

## Known limitations and release status

- This repository is a development candidate, not a production release.
- Production deployment, migration rehearsal, operational monitoring and final
  browser/security evidence are separate release gates.
- CSV support is fixture-backed and intentionally does not claim compatibility
  with every bank export. OFX, QIF and MT940 are not supported.
- PII detection is heuristic and requires user review; masking is not a guarantee
  of anonymization.
- Synchronization is explicit whole-snapshot transfer. There is no background
  sync, server-side merge or CRDT conflict resolution.
- Losing all configured recovery mechanisms can make encrypted data unrecoverable.
- Recurring-expense detection is not implemented; its dashboard widget uses
  placeholder data.

Active publication and release work is tracked under
[`docs/plans/active/`](./docs/plans/active/).

## Repository layout

```text
budget/
├── client/           # React, Vite, FSD and encrypted browser persistence
├── server/           # NestJS, vault protocol, auth and PostgreSQL adapters
├── packages/domain/  # shared framework-free domain package
├── docs/             # product, architecture, ADRs, guides and evidence
└── stubs/            # deterministic CSV regression fixtures
```

## License

Copyright © 2026 Mariusz Szlachta. All rights reserved.

The source is published for inspection and evaluation only. No open-source license
is granted. See [LICENSE](./LICENSE) for the permitted evaluation use and
restrictions.
