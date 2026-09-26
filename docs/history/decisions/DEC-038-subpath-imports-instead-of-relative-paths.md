# DEC-038 — Subpath imports (#) instead of relative paths

## Source status

Historical decision recorded on 2026-06-25. The source provides an explicit decision statement. The source does not assign a separate lifecycle status to this record. Chronological presence does not prove current authority.

## Preserved decision record

**Date:** 2026-06-25

**Decision:** Use Node subpath imports (`"imports"` in package.json) with the prefix `#` instead of relative paths (`../../`). Defined in `client/package.json`.

**Mapping:**
```json
{
  "imports": {
    "#app/*": "./src/app/*",
    "#pages/*": "./src/pages/*",
    "#features/*": "./src/features/*",
    "#entities/*": "./src/entities/*",
    "#shared/*": "./src/shared/*"
  }
}
```

**Justification:**
- TS6 deprecated `baseUrl`/`paths` (removed in TS7) — `#imports` is a future-proof standard
- Native to Node.js (no plugin, no TS hack) — Vite, bun, esbuild respect it natively
- IntelliJ supports it since 2023.1 (autocomplete, go-to-definition, refactoring)
- No impact on tree-shaking and lazy loading (resolve-time alias, bundler sees the final path)
- Cleaner imports: `#shared/lib/domain-error` vs `../../../shared/lib/domain-error`

**Rejected:**
- `ignoreDeprecations: "6.0"` + `paths` — hack, requires migration in TS7
- Relative imports — unreadable, error-prone during refactoring
- Vite-only aliases — TS does not validate, IDE does not suggest

## Source provenance

- Original source: legacy decision log
- Pre-atomization path: `docs/history/decision-log.md`
- Original identifier: `DEC-038`
- Original order: 38 of 59
- Original source lines: 699–728
- Frozen source commit: `582b3e8b147293c7b33dd0f839839aa81d7c8c20`
