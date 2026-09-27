# Contributing

NoAsterisk is a TypeScript monorepo with a React client, a NestJS server and a
framework-free shared domain package. Documentation and code added to the
repository must be written in English.

## Local setup

Requirements:

- Node.js 24, as pinned in `.nvmrc`
- npm
- Docker with Compose for PostgreSQL-backed integration tests

Install the locked dependency graph with:

```bash
npm ci
```

See the root [README](./README.md#local-development) for database setup and the
complete development environment.

## Required checks

Run the checks that cover the changed area while developing. Before submitting a
change, run the complete local verification whenever the environment supports it:

```bash
npm run verify
npm run test:coverage --workspace=client
npm run e2e --workspace=client
```

The repository also contains focused architecture and source checks:

```bash
npm run quality:frontend
npm run quality:backend
npm run quality:strict
npm run test:quality-scripts
npm run audit:test-colocation
```

`audit:test-colocation` parses production TypeScript with the compiler AST. Every
file containing an arrow-function implementation must have a matching colocated
`*.spec.ts` or `*.spec.tsx` file. The audit currently also serves as the explicit
legacy test-debt inventory; the repaired cross-feature client model is enforced as
a blocking subset by the root lint command.

The backend integration runner creates an isolated PostgreSQL container and
removes it after the run. Browser tests use Playwright Chromium and must not
publish traces, screenshots, storage state or logs containing credentials or
vault material.

## Engineering rules

- Keep the shared domain package framework-free.
- Preserve backend domain, application, infrastructure and presentation
  boundaries. Infrastructure implements application ports; domain code does not
  depend on NestJS, databases or HTTP.
- Preserve frontend Feature-Sliced Design boundaries. Features must not import
  other feature internals, and UI code should use shared adapters and components.
- Keep TypeScript strict. Do not weaken compiler, lint, test or coverage settings
  to make a change pass.
- Keep unit tests beside the production file they cover. Match the production
  basename (`calculate.ts` → `calculate.spec.ts`); qualified variants such as
  `calculate.integration.spec.ts` are allowed.
- Add focused tests for behavior changes and regression tests for bug fixes.
- Treat security and privacy claims as contracts: document guarantees,
  non-guarantees and operational prerequisites precisely.
- Never commit credentials, production data, browser storage state, raw financial
  data or generated diagnostic artifacts.

## Documentation

Durable documentation belongs under `docs/`: product behavior, architecture,
ADRs, implementation guides, security models, runbooks and current plans. Keep
temporary review notes, personal material and local working logs out
of the repository.

When behavior or an architectural contract changes, update the corresponding
documentation in the same change. Prefer an ADR for a decision that constrains
future implementation.

## Pull requests

Keep changes focused and describe:

- the user-visible or architectural outcome;
- the checks executed and any checks that could not run;
- migration, security or compatibility risks;
- documentation updated with the change.

CI repeats build, lint, unit, coverage, PostgreSQL integration, browser and
dependency-policy checks. A green CI run does not replace manual review of
security-sensitive behavior.
