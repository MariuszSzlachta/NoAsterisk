# Devplan: Privacy, Legal & Deployment

> **Superseded for MVP execution:** Legal implementation is scoped in [Session 09 — Privacy, terms and consent](./mvp-release/09-privacy-terms-consent.md), legal validation in [Session 10](./mvp-release/10-legal-copy-validation.md), mobile adaptation in [Session 11](./mvp-release/11-mobile-responsiveness-audit.md), and deployment in [Session 13](./mvp-release/13-deployment.md). This file is retained as source-era detail; its provider, cookie and backend-import assumptions require verification before reuse.

## Context

Before any external user accesses the app, legal compliance must be in place. Key advantage: local-first + E2EE architecture minimizes GDPR obligations (server doesn't process financial data).

**What server processes:** email, hashed password, user preferences, encrypted vault blob (opaque). That's it.

---

## Part A: Privacy & Legal

### Bullet 1: Privacy Policy page

**Scope:** Static page at `/privacy`

**Content must cover:**
- Who is the data controller (you, contact info)
- What data is collected: email, hashed password, encrypted vault backup (opaque to server)
- What data is NOT stored on server: transactions, budgets, categories, rules (all local-only)
- Legal basis: contract performance (Art. 6(1)(b) GDPR) — you need the email to provide the service
- Data retention: account active = data kept. Delete account = everything wiped.
- User rights: access, rectification, erasure (via Settings → Delete Account), data portability (vault export)
- E2EE explanation: server cannot read financial data, only encrypted blob
- Third parties: hosting provider (Fly.io/Cloudflare), no analytics, no tracking, no ads
- Cookies: httpOnly refresh token cookie (functional, not tracking — no consent needed)
- Contact: email for privacy questions

**Gate:** Page renders. Content is factually correct per architecture.

---

### Bullet 2: Terms of Service page

**Scope:** Static page at `/terms`

**Content must cover:**
- Service description (budget management app, local-first)
- Account responsibilities (user keeps password — lost password = lost vault data)
- Acceptable use (personal finance management, no illegal activity)
- No warranty (MVP, as-is)
- Limitation of liability (especially re: data loss if user loses password/clears browser)
- Termination (user can delete account anytime; admin can block abusive accounts)
- Changes to terms (notice via email or in-app)

**Gate:** Page renders.

---

### Bullet 3: Registration consent checkbox

**Scope:** `features/auth/ui/RegisterForm/`

**What:**
- Checkbox: "I agree to the [Privacy Policy](/privacy) and [Terms of Service](/terms)"
- Registration button disabled until checked
- Consent timestamp stored on User entity (new field: `consentedAt: Date`)

**Gate:** Cannot register without consent. Timestamp persisted.

---

### Bullet 4: Cookie/consent banner (minimal)

**Scope:** `shared/ui/` or `app/`

**What:**
- Since you ONLY use functional cookies (httpOnly auth) and NO tracking/analytics:
- A simple info banner: "This app uses essential cookies for authentication. No tracking."
- Dismiss button (stored in localStorage so it doesn't show again)
- NO cookie consent modal needed (GDPR exempts strictly necessary cookies)

**Gate:** Banner shows once, dismissible, doesn't reappear.

---

### Bullet 5: Delete account confirms data implications

**Scope:** `features/user-settings/ui/DangerZone/`

**What:** Update delete account confirmation to clearly state:
- Server data (email, vault backup) will be permanently deleted
- Local data (browser) will remain until manually cleared
- This action is irreversible

**Gate:** Confirmation modal has clear language. Existing delete flow works.

---

## Part B: Deployment

### Bullet 6: Dockerize backend

**Scope:** `server/Dockerfile`

**What:**
```dockerfile
FROM node:24-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY packages/domain/package*.json ./packages/domain/
RUN npm ci
COPY . .
RUN npm run build --workspace=server

FROM node:24-alpine
WORKDIR /app
COPY --from=builder /app/server/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/domain/dist ./packages/domain/dist
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "dist/main.js"]
```

**Gate:** `docker build` succeeds. Container starts and responds on :3000.

---

### Bullet 7: Fly.io backend config

**Scope:** `fly.toml` in project root

**What:**
- App name, region (waw = Warsaw)
- Internal port 3000
- Health check on `/api/health` (need to add simple health endpoint)
- Env vars via `fly secrets set`
- Auto-stop after 5 min idle (free tier)
- Min machines: 0 (allows sleep), max: 1

**Steps:**
1. `fly launch` (creates app)
2. `fly postgres create` (creates DB)
3. `fly secrets set JWT_SECRET=... DB_PASSWORD=...`
4. `fly deploy`

**Gate:** `fly status` shows app running. `curl https://app-name.fly.dev/api/health` returns 200.

---

### Bullet 8: Cloudflare Pages frontend

**Scope:** `client/` deployment

**Steps:**
1. Connect GitHub repo to Cloudflare Pages
2. Build command: `npm run build --workspace=client`
3. Output directory: `client/dist`
4. Environment variable: `VITE_API_URL=https://api.example.com`
5. Custom domain: connect purchased domain

**Gate:** the separately approved production origin loads the SPA and proxies API
calls correctly. No NoAsterisk domain is implied by this plan.

---

### Bullet 9: Health endpoint + CORS update

**Scope:** `server/src/app.controller.ts`, `server/src/main.ts`

**What:**
1. Add `GET /api/health` → `{ status: 'ok', timestamp }` (public, no auth)
2. Update CORS origin to include production domain
3. Update CSP connect-src to include production API domain

**Gate:** Health check responds. CORS allows production domain.

---

### Bullet 10: CI/CD pipeline (optional, nice-to-have)

**What:** GitHub Actions workflow:
- On push to `main`: run tests → build → deploy to Fly.io
- On PR: run tests only

**Gate:** Push to main = auto-deploy. Broken tests = no deploy.

---

## Estimated Effort

| Bullet | Effort |
|--------|--------|
| 1-2 (Privacy + ToS) | 2h (content writing) |
| 3 (Consent checkbox) | 30 min |
| 4 (Cookie banner) | 30 min |
| 5 (Delete account text) | 15 min |
| 6 (Dockerfile) | 1h |
| 7 (Fly.io config) | 1h |
| 8 (Cloudflare Pages) | 30 min |
| 9 (Health + CORS) | 30 min |
| 10 (CI/CD) | 1h (optional) |
| **Total** | **~7-8 hours** |

---

## Pre-deploy Checklist

- [ ] All security fixes applied (✅ done 2026-08-22)
- [ ] Privacy policy page accessible
- [ ] Terms of service page accessible
- [ ] Registration requires consent
- [ ] Delete account explains consequences
- [ ] JWT_SECRET is strong random value (not dev default)
- [ ] CORS restricted to production domain only
- [ ] CSP header includes production domains
- [ ] Invite-only registration mode enabled
- [ ] Health endpoint responds
- [ ] Vault backup/restore works on production
- [ ] Dictionaries seeded in production DB
