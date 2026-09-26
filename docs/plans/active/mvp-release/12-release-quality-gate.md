# Session 12: Run the Release Quality Gate

## Objective

Turn the repository's scattered checks into one reproducible, non-mutating release gate and resolve or explicitly defer every failure before deployment work begins.

**Prerequisites:** Sessions 02–11 complete

## Scope

1. Reconcile the old code-quality plan with the current tree. Remove items already completed and retain evidence for unresolved ones.
2. Pin runtime and development dependencies to exact versions across workspaces and update the lockfile consistently. Ignore regex strings when checking for `^`/`~` specifiers.
3. Run TypeScript, production builds, unit/integration tests and strict lint for every workspace.
4. Run client Playwright coverage for the core release flow in a deterministic local environment.
5. Search for `TODO`, `FIXME`, `HACK`, raw review annotations, accidental Polish prose in executable code, `any`, suppressed diagnostics and skipped tests. Fix release-impacting findings; document accepted deferrals with an owner and rationale.
6. Inspect browser persistence: no financial record may remain in `localStorage`, and raw IndexedDB rows may contain only encrypted envelopes and explicitly allowed technical metadata.
7. Run dependency/security audits and classify every finding by exploitability in this application. Do not blindly apply breaking `audit fix --force` changes.
8. Add CI jobs that execute the same non-mutating commands. Lint in CI must not use `--fix`.
9. Ensure generated coverage/build artifacts are ignored and do not enter the release commit.
10. Validate internal Markdown links for active plans and guides changed by Sessions 02–09.
11. Verify the complete API route inventory: no retired financial endpoint or
    controller is reachable, and no financial plaintext can be written through
    an undocumented route.
12. Verify local-storage lifecycle: per-account/workspace namespace, account
    switching, logout versus lock versus wipe, stale migration keys, URL query
    parameters and the explicit warning for plaintext JSON export.
13. Verify security configuration: production CSP headers, fail-closed
    persistence mode, PostgreSQL transport encryption, secret rotation
    procedure and redaction of authorization headers, cookies, passwords, CSV,
    plaintext financial data and ciphertexts from logs.
14. Attach the operational/privacy readiness evidence: provider inventory, DPA/
   transfer decisions, ROPA, DPIA screening, retention schedule, rights
   procedure, incident runbook, admin-access rules and DR/RPO/RTO evidence.
15. For every remaining P2 from the privacy/security audits, record fix,
    accepted risk or post-MVP deferral with owner, mitigation and target date;
    no P2 may remain undocumented.

## Non-goals

- No broad refactor for stylistic preference.
- No dependency major-version upgrade unless required to remove a release-blocking vulnerability.
- No lowering thresholds, converting failures to expected failures, or disabling rules to manufacture green status.

## Required gate

Use exact repository scripts where available; add missing non-mutating scripts before CI wiring.

```bash
npm ci
npm run build --workspaces
   JWT_SECRET=ci-test-secret-with-at-least-32-characters JWT_REFRESH_SECRET=ci-refresh-secret-with-at-least-32-characters npm run test --workspaces
npm run lint --workspace=client
npm run lint:strict --workspace=server
npm run e2e --workspace=client
npm audit --workspaces
git diff --check
git status --short
```

An audit finding may remain only with severity, affected path, exploitability analysis, mitigation, owner and explicit release disposition recorded in the handoff.

## Handoff

- Matrix of commands, exit codes, suite/test counts and durations.
- Remaining expected/skipped tests.
- Dependency-audit dispositions.
- Deferred code-quality findings with owners.
- CI workflow path and matching local command.
- API route inventory and operational/privacy readiness checklist.
