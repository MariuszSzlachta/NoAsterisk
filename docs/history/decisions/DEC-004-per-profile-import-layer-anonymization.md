# DEC-004 — Per-Profile Import Layer Anonymization

## Source status

Historical decision recorded on 2026-06-20. The source provides an explicit decision statement. The source does not assign a separate lifecycle status to this record. Chronological presence does not prove current authority.

## Preserved decision record

**Decision:** Configurable anonymization per bank/profile, three layers on the front.

**Layers:**
1. Automatic (regex): IBAN, cards, PESEL, email, phones
2. Per profile: per-field definition (hash / remove / keep / regex_strip)
3. User review: manual editing in DataGrid with smart batch propagation

**Justification:** Each bank has a different structure of sensitive data. It is not possible to create a single universal anonymizer.

## Source provenance

- Original source: legacy decision log
- Pre-atomization path: `docs/history/decision-log.md`
- Original identifier: `DEC-004`
- Original order: 4 of 59
- Original source lines: 56–65
- Frozen source commit: `582b3e8b147293c7b33dd0f839839aa81d7c8c20`
