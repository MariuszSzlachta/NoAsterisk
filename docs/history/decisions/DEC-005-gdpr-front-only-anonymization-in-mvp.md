# DEC-005 — GDPR — Front-only Anonymization in MVP

## Source status

Historical decision recorded on 2026-06-20. The source provides an explicit decision statement. The source does not assign a separate lifecycle status to this record. Chronological presence does not prove current authority.

## Preserved decision record

**Decision:** MVP — anonymization exclusively on the front end. The architecture does not block server-side transit processing in the future.

**Context:** The app already processes PII (users: name, email) → GDPR compliance is required regardless.

**For the future:** Server-side processing is possible under the conditions: explicit consent, zero persistence, no logs, documented in the privacy policy.

## Source provenance

- Original source: legacy decision log
- Pre-atomization path: `docs/history/decision-log.md`
- Original identifier: `DEC-005`
- Original order: 5 of 59
- Original source lines: 69–75
- Frozen source commit: `582b3e8b147293c7b33dd0f839839aa81d7c8c20`
