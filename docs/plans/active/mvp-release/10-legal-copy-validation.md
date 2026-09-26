# Session 10: Validate and Finalize Legal Copy

## Objective

Replace the ALPHA legal placeholder with legally reviewed Privacy Policy and Terms copy that accurately describes NoAsterisk's local-first and E2EE data flow.

**Prerequisites:** Session 09 implemented; controller identity, privacy contact, jurisdiction, audience/age restriction, hosting providers and production domain supplied by the owner

## Scope

1. Obtain and record the final controller, contact, jurisdiction, audience, providers and domain values.
2. Verify applicable EU/Polish requirements using authoritative sources or attach professional legal review evidence.
3. Review every claim against the current code, including account data, functional cookies/tokens, operational logs, local encrypted data, opaque sync blobs, retention, rights and account deletion.
4. Replace only approved placeholders in the localized Privacy Policy and Terms copy.
5. Version the documents and keep registration consent validation aligned with both versions.
6. Confirm that no analytics, marketing consent, billing or unsupported E2EE guarantee is introduced.
7. Verify that the copy covers the complete data-governance package: ROPA/data
   map, DPIA screening, processors/DPA, international transfers, retention,
   backup deletion behavior, rights handling, incident contact and administrator
   access.
8. Archive an immutable copy or cryptographic hash of each published document,
   including language and variant, and align future material changes with a
   re-notification/re-acceptance decision.
9. Confirm that Privacy Policy information, Terms acceptance and any separate
   consent are not incorrectly presented as one generic GDPR consent.

## Non-goals

- No legal claim that has not been approved or supported by authoritative guidance.
- No public registration or deployment.
- No change to financial data flow or encryption architecture.

## Required evidence and gates

- Legal review or authoritative-source record is attached to the handoff.
- No `NON-PRODUCTION` or unresolved placeholder remains in publishable legal copy.
- Registration stores the approved versions and server timestamp.
- Published versions have an immutable archive/hash, language and change record.
- Privacy and Terms remain unauthenticated, localized, keyboard accessible and mobile readable.
- Client/server builds, focused tests and `git diff --check` pass.

If owner or legal input is unavailable, this session ends as **BLOCKED FOR PUBLICATION**, with the ALPHA placeholder retained.
