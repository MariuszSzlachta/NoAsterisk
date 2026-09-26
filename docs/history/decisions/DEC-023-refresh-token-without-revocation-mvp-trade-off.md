# DEC-023 — Refresh Token Without Revocation — MVP Trade-off

## Source Status

Historical decision recorded on 2026-06-22. The source provides an explicit decision statement. The source does not assign a separate lifecycle status to this record. Chronological presence does not prove current authority.

## Preserved Decision Record

**Date:** 2026-06-22

**Decision:** No blacklist/whitelist for refresh tokens. Leak = 7 days of unlimited access.

**Target:** Table `refresh_tokens(id, userId, token_hash, expires_at, revoked_at)`. Logout = revoke all. Refresh endpoint checks whether the token is revoked.

**Justification:** In-memory MVP — no persistence. With PostgreSQL, we will add a table for refresh tokens with revocation.

## Source Provenance

- Original source: legacy decision log
- Pre-atomization path: `docs/history/decision-log.md`
- Original identifier: `DEC-023`
- Original order: 23 of 59
- Original source lines: 321–329
- Frozen source commit: `582b3e8b147293c7b33dd0f839839aa81d7c8c20`
