# DEC-022 — Refresh token in body (not httpOnly cookie) — MVP trade-off

## Source status

Historical decision recorded on 2026-06-22. The source provides an explicit decision statement. The source does not assign a separate lifecycle status to this record. Chronological presence does not prove current authority.

## Preserved decision record

**Date:** 2026-06-22

**Decision:** Refresh token returned in JSON body and sent in the body during `POST /auth/refresh`. Not in an httpOnly cookie.

**Justification:**
- API-first approach — facilitates testing and integration with any client
- httpOnly cookie requires CSRF protection, cookie path configuration, SameSite policy
- When adding a frontend client: migration to httpOnly cookie (no changes in backend logic — only the controller sets the cookie instead of returning it in the body)

**Risk:** XSS on the frontend = leakage of refresh token. Acceptable for MVP without a frontend.

## Source provenance

- Original source: legacy decision log
- Pre-atomization path: `docs/history/decision-log.md`
- Original identifier: `DEC-022`
- Original order: 22 of 59
- Original source lines: 306–317
- Frozen source commit: `582b3e8b147293c7b33dd0f839839aa81d7c8c20`
