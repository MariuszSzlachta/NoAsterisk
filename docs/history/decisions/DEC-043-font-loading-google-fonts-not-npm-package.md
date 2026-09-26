# DEC-043 — Font loading — Google Fonts (not npm package)

## Source status

Historical decision recorded on 2026-06-26. The source provides an explicit decision statement. The source does not assign a separate lifecycle status to this record. Chronological presence does not prove current authority.

## Preserved decision record

**Date:** 2026-06-26

**Decision:** Geist font is loaded from Google Fonts (`<link>` in `index.html`), not via npm package.

**Rejected:** `npm install geist` — the package is a Next.js font loader, and it does not work with Vite.

**Rationale:**
- Google Fonts CDN = shared cache with other websites, fast TTFB
- Preconnect hints ensure early handshake
- Zero bundler complexity (no woff2 imports, no font-face declarations)
- Fallback: self-hosting woff2 in `public/fonts/` (if CDN dependency is undesirable in production)

## Source provenance

- Original source: legacy decision log
- Pre-atomization path: `docs/history/decision-log.md`
- Original identifier: `DEC-043`
- Original order: 43 of 59
- Original source lines: 818–830
- Frozen source commit: `582b3e8b147293c7b33dd0f839839aa81d7c8c20`
