# ADR-010: API Security Hardening — Password Policy, Rate Limiting, HTTP Headers

**Date:** 2026-08-21  
**Status:** Accepted  
**Context:** User Settings module introduces sensitive endpoints (change password, delete account, vault). Security posture must align with OWASP ASVS Level 1+ requirements. Previous state had minimal password validation (8 chars, no complexity) and no HTTP security headers.

---

## Problem

1. **Weak password policy** — `min(8)` allowed passwords like `12345678` or `aaaaaaaa`. No complexity requirements.
2. **No rate limiting on sensitive operations** — change-password and delete-account could be brute-forced without throttling.
3. **No HTTP security headers** — responses lacked CSP, HSTS, X-Frame-Options, X-Content-Type-Options.
4. **No Content-Type enforcement** — server accepted any Content-Type, enabling CSRF via form submissions and content-type confusion attacks.
5. **CORS too permissive** — no explicit `allowedHeaders` restriction, any custom header could be sent.

---

## Decisions

### D1: Strong password policy (OWASP ASVS 2.1)

All password inputs (registration + change-password) validated with:

```
- min 8 characters (ASVS 2.1.1)
- max 128 characters (ASVS 2.1.2 + bcrypt 72-byte limit safety)
- ≥ 1 uppercase letter [A-Z]
- ≥ 1 lowercase letter [a-z]
- ≥ 1 digit [0-9]
- ≥ 1 special character [^A-Za-z0-9]
```

**Enforcement point:** Zod schema at presentation layer boundary. Domain layer does not validate password strength (only non-empty hash). This is intentional — strength is an API contract concern, not a domain invariant.

**Trade-offs:**
- Pro: Blocks trivially brute-forceable passwords
- Pro: Immediate user feedback via Zod error messages
- Con: Overly strict policies can push users to password managers (which is actually good)
- Decision: No dictionary/breach-list check in MVP. Deferred to production hardening (haveibeenpwned API integration).

### D2: Rate limiting on password-bearing endpoints

| Endpoint | Limit | Window | HTTP on exceed |
|---|---|---|---|
| `POST /users/me/change-password` | 3 requests | 60 seconds | 429 |
| `DELETE /users/me` | 3 requests | 60 seconds | 429 |
| `POST /auth/login` | 5 requests | 60 seconds | 429 |
| `POST /auth/register` | 5 requests | 60 seconds | 429 |
| All other endpoints | 30 requests | 60 seconds | 429 |

**Implementation:** `@nestjs/throttler` with per-endpoint overrides via `@Throttle()` decorator. Throttle identifier = IP address (default NestJS behavior). Token bucket = `THROTTLE_SENSITIVE` constant.

**Trade-offs:**
- Pro: Blocks automated brute-force on password fields
- Con: IP-based can be bypassed with rotating proxies
- Decision: Acceptable for MVP. Account lockout (progressive delay, CAPTCHA after N failures) deferred to production hardening.

### D3: Helmet — security response headers (global)

All responses include security headers via `helmet` middleware:

| Header | Value | Purpose |
|---|---|---|
| `Strict-Transport-Security` | `max-age=15552000; includeSubDomains` | Force HTTPS |
| `X-Content-Type-Options` | `nosniff` | Prevent MIME sniffing |
| `X-Frame-Options` | `SAMEORIGIN` | Block clickjacking |
| `Content-Security-Policy` | Helmet defaults | Block XSS, inline scripts |
| `Cross-Origin-Opener-Policy` | `same-origin` | Window isolation |
| `Referrer-Policy` | `no-referrer` | Prevent URL leakage |
| `X-Permitted-Cross-Domain-Policies` | `none` | Block Flash/PDF exploits |

**Enforcement:** Global middleware in `main.ts`, applied before all routes.

### D4: Content-Type enforcement (global)

Custom middleware rejects any request with a body (POST/PUT/PATCH/DELETE with `Content-Length > 0`) that does not declare `Content-Type: application/json`.

- Non-JSON content type → `415 Unsupported Media Type`
- No body → passes through (GET, HEAD, OPTIONS)

**Rationale:** Prevents CSRF via `<form>` (which sends `application/x-www-form-urlencoded`), XML injection, and multipart exploitation. The API is JSON-only — enforcing this explicitly closes an attack surface.

### D5: CORS hardening

```typescript
app.enableCors({
  origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  allowedHeaders: ['Content-Type', 'Authorization'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
});
```

- **Only** `Content-Type` and `Authorization` headers allowed from browser
- Custom headers (e.g., `X-Forwarded-For` spoofing) blocked by CORS preflight
- Origin restricted to known frontend URL

### D6: Password storage — bcrypt with cost 10

Passwords stored as bcrypt hashes (`$2b$10$...`). Never in plain text, never in reversible encryption.

| Property | Value |
|---|---|
| Algorithm | bcrypt |
| Cost factor (rounds) | 10 (~100ms/hash) |
| Salt | Auto-generated per hash (embedded in output) |
| Comparison | Constant-time (`bcrypt.compare`) |
| Storage format | 60-char string: `$2b$10$<22-char-salt><31-char-hash>` |

**Why bcrypt over alternatives:**
- Argon2id: Preferred by OWASP but adds native dependency complexity. Acceptable upgrade path for production.
- SHA-256/512: Too fast, no built-in salt — unsuitable for password hashing.
- PBKDF2: Acceptable but bcrypt is simpler in Node.js ecosystem.

**Trade-off:** Cost 10 = ~100ms per hash. Sufficient for blocking brute-force while keeping login latency acceptable. Increase to 12+ when hardware improves.

---

## Consequences

1. Existing users with weak passwords will NOT be forced to change (no migration). New passwords must meet the policy.
2. All E2E/integration tests updated to use strong passwords (`Secure1!pass` pattern).
3. Helmet headers may cause issues with future embedding scenarios (iframes). CSP adjustments would need a separate ADR.
4. Content-Type guard means non-JSON APIs (file upload) would need explicit exemption — currently not applicable (vault is base64 in JSON body).

---

## OWASP ASVS Alignment

| Requirement | Section | Status |
|---|---|---|
| Password min length ≥ 8 | 2.1.1 | ✅ |
| Password max length ≤ 128 | 2.1.2 | ✅ |
| Password complexity | 2.1.7 | ✅ |
| Bcrypt/Argon2/PBKDF2 | 2.4.1 | ✅ (bcrypt) |
| Salt per password | 2.4.2 | ✅ (auto) |
| Rate limiting on auth | 2.2.1 | ✅ |
| Security headers | 14.4.x | ✅ (Helmet) |
| Content-Type validation | 13.1.x | ✅ |
| CORS restrictions | 14.5.x | ✅ |

---

## Deferred (production hardening)

- [ ] Breached password check (haveibeenpwned API)
- [ ] Account lockout after N failed attempts (progressive delay)
- [ ] Upgrade bcrypt cost to 12 or migrate to Argon2id
- [ ] CAPTCHA on registration after throttle hit
- [ ] Token blacklist (Redis) for logout/password change invalidation
- [ ] Audit log of security-sensitive operations
