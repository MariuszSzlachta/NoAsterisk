# DEC-061 — CSV Parser & Anonymizer — Enterprise-Grade Rewrite

## Source status

Recovered historical decision dated 2026-06-29 with explicit status **Accepted**.
It was recovered on 2026-08-01 from an untracked temporary workspace used on
another computer. Its identifier, date and implementation are corroborated by
commit `f57e7da` and the CSV engine architecture. Later ADRs and implementation
documentation may refine or supersede individual details.

## Preserved decision record

**Date:** 2026-06-29  
**Status:** Accepted  
**Context:** Initial implementation used naive regex (3 patterns: IBAN, phone, `[Capitalized] [Capitalized]` for names). This produces ~60-70% accuracy — unacceptable. Users will abandon the feature if >5% of rows need manual correction.

**Decision:** Full rewrite with production architecture:

1. **Dictionary-based name detection** — backend maintains dictionaries (names PL/EN, surnames, merchants, cities, banking phrases). Frontend loads via API, caches as `Set<string>` for O(1) lookup. Dev mode uses local JSON stubs.

2. **Plugin system for detectors** — each PII type (IBAN, phone, name, email, address) is a separate module implementing `PiiDetector` interface. New detectors added without touching pipeline core.

3. **Confidence scoring + conflict resolution** — each detection has confidence (0.0–1.0). Spans overlapping with known merchants/cities are discarded. Confidence ≥0.9 auto-accepted, 0.7–0.9 needs user review, <0.7 discarded.

4. **Encoding detection** — mandatory (jschardet). Polish bank CSVs export Windows-1250; without detection, diacritics corrupt and dictionaries fail.

5. **User correction feedback loop** — accept/reject decisions stored per workspace, improve future imports.

6. **Security:** original titles stripped from store after anonymization accepted. Zero PII in errors/logs.

**Rejected alternatives:**
- AI-based NER (spaCy/Transformers in browser) — too heavy for client-side, adds 50MB+ WASM, latency unacceptable
- Regex-only approach — proven insufficient for 95% KPI (false positives on merchant names)
- Server-side anonymization — violates core security principle (raw data never leaves browser)

**Full architecture:** `docs/architecture/csv-anonymizer-engine.md`

**Impact:** Existing `anonymizer.ts`, `csv-parser.ts`, `column-mapper.ts` will be deleted and rewritten from scratch.

## Related records

- [CSV engine overview](../../architecture/csv-engine/overview.md) preserves the approved architecture derived from this decision.
- [CSV parser reference](../../architecture/csv-engine/parser.md) documents parser behavior.
- [Phase 4.3 CSV import](../../plans/completed/phase-4-3-csv-import.md) records the delivered roadmap work.
- [ADR-007](../../adr/007-csv-import-code-quality-refactoring.md) records a later CSV-import refactoring boundary.
- [DEC-003](./DEC-003-content-hash-before-anonymization.md) and the [integrity record](./integrity-issues.md#dec-003-content-hash-timing-conflict) preserve the unresolved content-hash timing conflict.

## Source provenance

- Recovered source: `decision-log.md` from an untracked BudgetFlow `temp` workspace
- Recovery copy inspected from an owner-provided local decision-log export.
- Recovered on: 2026-08-01
- Original identifier: `DEC-061`
- Recovered source order: 3 of 3
- Chronological corpus position: after DEC-060
- Decision date stated by source: 2026-06-29
- Original decision-log metadata supplied with the recovery: created 2026-06-29 18:14:13, modified 2026-06-29 19:37:48
- Original DEC-061 review metadata supplied with the recovery: created 2026-06-29 20:16:39, modified 2026-06-29 20:41:56
- Corroborating application commit: `f57e7da`
- The desktop copies' filesystem dates reflect copying on 2026-08-01; the earlier timestamps above come from `file-metadata.md`, captured from the original `temp/` files
