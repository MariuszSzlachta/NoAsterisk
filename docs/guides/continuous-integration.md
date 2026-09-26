# Continuous Integration

The required GitHub Actions workflow is
[`.github/workflows/ci.yml`](../../.github/workflows/ci.yml). It runs for pull
requests, pushes to `main` and manual dispatches. Concurrent runs for the same ref
are cancelled so an obsolete commit cannot consume release capacity after a newer
one is available.

## Required checks

Configure branch protection or a repository ruleset for `main` to require these
five job names:

| Check                         | Command/policy                                                                                                                      |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `Build, lint, and unit tests` | `npm ci`, `npm run build`, `npm run lint`, `npm run test`                                                                           |
| `Client coverage`             | `npm run test:coverage --workspace=client` with repository thresholds                                                               |
| `PostgreSQL integration`      | `npm run test:integration`; the runner provisions and destroys an isolated PostgreSQL environment                                   |
| `Chromium browser E2E`        | installs the lockfile-selected Playwright Chromium build and runs `npm run e2e --workspace=client` with one worker and zero retries |
| `Dependency policy`           | fails on high/critical production advisories; for public pull requests, also rejects newly introduced high/critical dependencies    |

Required checks should apply to administrators and should require the branch to be
up to date before merge. Direct pushes and force pushes to `main` should be
disabled when the repository is published.

## Reproducibility

- Node is pinned by [`.nvmrc`](../../.nvmrc).
- JavaScript dependencies are installed only through `npm ci` and the committed
  lockfile.
- GitHub Actions dependencies are pinned to full commit SHAs.
- PostgreSQL is pinned to an official image digest.
- The npm download cache is keyed from `package-lock.json`; `node_modules`, test
  databases and application state are never cached.
- PostgreSQL integration credentials and cryptographic test values are random or
  fixed non-production fixtures scoped to the runner. No repository secret is
  required by the test workflow.

## Failure artifacts

The workflow intentionally does not upload browser traces, screenshots, storage
state, raw logs, database files, coverage HTML or application payloads. Those can
contain credentials, cookies, transaction data, ciphertext or recovery material.

On failure, the local composite action uploads one short manifest containing only
the job name and public GitHub run identifiers. Retention is seven days. Detailed
diagnostics remain in GitHub's access-controlled live job log and must be reviewed
before any additional artifact is shared.

## Dependency policy

The blocking baseline is `npm audit --omit=dev --audit-level=high`: a high or
critical production advisory fails CI. Dependency Review applies the same severity
threshold to additions in public pull requests. Existing development-only audit
findings are not silently accepted; their remediation or explicit disposition is
enforced by the dependency-policy CI job.

The workflow does not run `npm audit fix` and never performs an automatic major
upgrade. Dependency changes remain ordinary reviewed pull requests.
