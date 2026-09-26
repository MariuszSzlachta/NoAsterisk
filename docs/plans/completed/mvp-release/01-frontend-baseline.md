# Session 01: Restore the Frontend Baseline

**Status:** Complete — verified 2026-09-09

**Implementation commit:** `132f22f` (`fix(client): restore frontend baseline`)

## Objective

Return the existing client to a trustworthy green baseline without changing product behavior. This session removes accidental source corruption and resolves the currently observed build, test, and lint regressions.

**Prerequisites:** none

## Evidence to reproduce first

Run from the repository root and record the failures before editing:

```bash
npm run build --workspace=client
npm run test --workspace=client
npm run lint --workspace=client
```

Known symptoms at snapshot `0fdb479`:

- invalid JSX/comment fragments in `AnonymizationPopover.tsx`;
- unresolved `#features/csv-import/model/anonymization/pipeline` import in `useImportWizard.ts`;
- CSV boundary tests read a missing `footerLines` property;
- amount cell-renderer tests receive an incompatible parameter shape;
- retry behavior retries a non-retryable 4xx response;
- lint reports duplicate declarations/imports, invalid hooks in stories, and undefined or unused identifiers.

## Scope

1. Remove every accidentally embedded review annotation or prose fragment from executable client source. Search beyond the first compiler error.
2. Repair moved-module imports against the actual post-refactor directory structure. Do not introduce compatibility barrels solely to hide incorrect imports.
3. For every failing test, determine whether code or expectation is stale and make the smallest behavior-preserving correction.
4. Fix lint errors. Resolve warnings that indicate real runtime or test-hygiene defects; document any deliberately accepted warning.
5. Re-run the complete client gate, not only focused tests.

## Non-goals

- Do not replace HTTP import submission yet; Session 03 owns that architecture change after Session 02 creates encrypted persistence.
- Do not redesign the wizard, grids, stores, or visual system.
- Do not update dependencies except when a broken lockfile makes the baseline impossible to reproduce.
- Do not convert expected-fail tests into passing tests unless their underlying feature is already implemented.

## Gates

```bash
npm run build --workspace=client
npm run test --workspace=client
npm run lint --workspace=client
git diff --check
```

All commands must exit 0. The final report must state test-file/test counts and list any remaining expected failures or warnings.

## Handoff

- Root causes, not just edited files.
- Focused regression tests added or updated.
- Exact gate output summary.
- Any suspicious source annotation intentionally left in place, with justification.

## Completion evidence

- `npm run build --workspace=client`: passed.
- `npm run test --workspace=client`: 290 test files passed; 2588 tests passed and 8 expected failures remain explicitly tracked by the suite.
- `npm run lint --workspace=client`: passed with pre-existing Fast Refresh warnings in `dashboard-widgets/widget-registry.tsx`.
- `git diff --check`: passed.

The baseline was restored without changing the MVP product boundary. The remaining
warnings and expected failures are not release blockers for this session, but remain
visible to the later quality gate.
