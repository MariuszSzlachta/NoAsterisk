# Session 11: Mobile View Audit and Responsive Adaptation

## Objective

Produce an evidence-backed report for every user-facing view and adapt the application for phone-sized screens before release quality validation and deployment.

**Prerequisites:** Sessions 01–10 complete, with legal copy status explicitly recorded

## Mandatory report

Record durable verification evidence in `docs/verification/mobile-responsiveness.md`,
with one entry for every route and significant responsive state. At minimum cover
`/login`, `/register`, `/privacy`, `/terms`, dashboard/widgets, transactions, CSV
import, local import history, budgets, analytics, admin/rules/invites/dictionaries
and user settings/vault flows.

Each entry must include viewport sizes, evidence source, issue, severity, recommendation, implementation status and a human-review flag. Separate findings verified from code, findings verified with Playwright screenshots/assertions, and scenarios Playwright could not verify.

Do not mark an interaction verified solely because a page renders. Record unavailable browser APIs, authentication/setup blockers, visual ambiguity and manual-only keyboard or screen-reader checks.

## Implementation scope

1. Add or correct responsive breakpoints, layout flow, overflow handling, touch targets, dialogs, tables, charts and typography for phone widths.
2. Preserve desktop behavior and design tokens.
3. Add deterministic Playwright coverage for each feasible route and critical mobile interaction.
4. Capture redacted screenshots or equivalent artifacts for representative success, empty, error and modal states.
5. Leave unresolved visual decisions in the report for human approval.

## Gates

- Every route and significant state has a report row.
- Every untestable scenario is explicitly marked for human review.
- No horizontal overflow or inaccessible control is present in tested phone viewports.
- Client build, tests, lint and Playwright mobile coverage pass.
- `git diff --check` passes and report links resolve.

## Handoff

- Per-view mobile audit report and evidence index.
- Human-review items and owner decisions required.
- Responsive files changed and breakpoint rationale.
- Exact viewport matrix and command results.
