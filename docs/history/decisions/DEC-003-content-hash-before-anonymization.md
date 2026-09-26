# DEC-003 — Content hash BEFORE anonymization

## Source status

Historical decision recorded on 2026-06-20. The source provides an explicit decision statement. The source does not assign a separate lifecycle status to this record. Chronological presence does not prove current authority.

## Preserved decision record

**Decision:** Content hash calculated on the front using raw data, sent to the server as an opaque dedup key.

**Composition:** `SHA-256(transactionDate + amount + rawTitle + SHA-256(accountNumber))`

**Rationale:**
- Stronger hash — raw title from the bank is almost always unique
- Irreversible — does not violate the principle of "raw data not reaching the backend"
- The server must trust the client (acceptable — the user sabotages only themselves)

**Rejected:** Hash after anonymization (weaker discriminator).

## Source provenance

- Original source: legacy decision log
- Pre-atomization path: `docs/history/decision-log.md`
- Original identifier: `DEC-003`
- Original order: 3 of 59
- Original source lines: 41–52
- Frozen source commit: `582b3e8b147293c7b33dd0f839839aa81d7c8c20`
