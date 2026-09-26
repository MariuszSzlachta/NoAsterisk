# Session 09: Implement Privacy, Terms and Registration Consent

## Objective

Add the user-facing legal surfaces and auditable registration consent required before external access, using the actual local-first/E2EE data flow rather than stale classic-SaaS claims.

**Prerequisite:** Session 01 green; Sessions 08 and 09A verified before final copy and release gate

## Required owner input

Before final legal copy is written, obtain the data-controller identity, privacy contact, governing jurisdiction, intended audience/age restriction, chosen hosting providers and production domain. If these are unavailable, implement structure with conspicuous non-production placeholders and do not pass the release gate.

Legal claims are high-risk and time-sensitive. During implementation, verify applicable requirements from authoritative EU/Polish sources or obtain professional review; do not present this engineering plan as legal advice.

## Scope

1. Trace and document the actual data inventory: account data, preferences, invite/admin data, opaque encrypted sync blob and revision metadata, local financial data, functional cookies/tokens and operational logs.
2. Add public `/privacy` and `/terms` routes accessible without authentication.
3. Write concise copy covering controller/contact, purposes, legal bases, retention, processors, user rights, local-storage implications, cross-device E2EE sync limits, account deletion, service limitations and change notice.
4. Add required consent controls to registration with links to both documents. Do not use pre-checked consent.
5. Persist consent timestamp and document/version identifiers on the server. Validate consent server-side; disabling only the button is insufficient.
6. Add a migration for consent fields without rewriting prior migrations.
7. Make account-deletion copy distinguish server deletion from remaining browser-local data and provide a deliberate local-clear action.
8. Add an essential-storage notice only if required by the verified token/storage implementation and legal review. Do not label a purely informational notice as consent.
9. Add i18n coverage and keyboard/screen-reader accessible error and link behavior.
10. Use “masking”/“pseudonymization” language, not “anonymization”, and state that
    detection can miss data and does not remove transaction identifiability.
11. Make the copy distinguish logout, vault lock, local-device wipe and server
    account deletion, including the risk of unsynchronized local changes.
12. Document the explicit-storage inventory: refresh cookie, IndexedDB, localStorage,
    URL query parameters and any migration keys.

## Non-goals

- No analytics/tracking SDK, marketing consent or newsletter consent.
- No billing/subscription terms.
- No claim that E2EE eliminates all privacy or controller obligations.
- No production release with placeholder controller/contact/provider text.

## Gates

- Registration without required consent is rejected by both UI and API.
- Consent version and timestamp persist in both in-memory and PostgreSQL modes.
- `/privacy` and `/terms` work unauthenticated and on mobile.
- Account deletion messaging and local-clear behavior are tested.
- The final copy reflects the Session 09A deletion contract and does not promise
  deletion of data the operator cannot control, such as expired/offline copies.

```bash
npm run build --workspace=client
npm run test --workspace=client
npm run lint --workspace=client
npm run build --workspace=server
JWT_SECRET=ci-test-secret-with-at-least-32-characters JWT_REFRESH_SECRET=ci-refresh-secret-with-at-least-32-characters npm run test --workspace=server -- --runInBand
npm run lint:strict --workspace=server
git diff --check
```

## Handoff

- Data inventory and authoritative sources consulted.
- Final controller/contact/provider values.
- Consent versioning and migration.
- Accessibility/visual evidence and exact gate results.
