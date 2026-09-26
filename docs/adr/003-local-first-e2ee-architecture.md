# ADR-003: Local-First Architecture with E2EE Sync

**Date:** 2026-07-03  
**Status:** Planned  
**Context:** BudgetFlow currently runs as classic SaaS (NestJS backend + React FSD frontend). Frontend already processes all sensitive data locally (CSV parsing, PII anonymization, categorization). Backend receives only anonymized data. Migration to local-first with E2EE eliminates server-side data exposure entirely.

---

## Problem

Server stores anonymized financial data — but still stores it. This creates:
1. RODO compliance burden (DPIA required, breach notification obligations)
2. Monthly hosting cost (~170-250 PLN for Vercel+Supabase) for a personal finance tool
3. Trust barrier — user must believe anonymization is sufficient
4. Server becomes single point of failure for data access

Current architecture already does 90% of work locally. The remaining 10% (persistence, sync) can move client-side with minimal changes.

## Solution

Phased migration to local-first E2EE architecture. IndexedDB for persistence, Web Crypto API for encryption, encrypted blobs for cloud backup. Backend transforms from data processor to encrypted relay.

**Detailed implementation:** [Local-First E2EE Migration](../architecture/local-first-e2ee.md)

## Architectural Variants Comparison

| Criterion | Local-only PWA | Local + Encrypted Backup | E2EE Sync (target) | Classic SaaS (current) |
|---|---|---|---|---|
| Privacy | ★★★★★ | ★★★★★ | ★★★★★ | ★★★☆☆ |
| Cost/mo | 0-30 PLN | 0-50 PLN | 50-80 PLN | 170-250 PLN |
| UX (multi-device) | ✗ single device | ✗ manual restore | ✓ auto sync | ✓ auto sync |
| Complexity | Low | Medium | High | Medium |
| Server sees data? | No server | Ciphertext only | Ciphertext only | Anonymized plaintext |
| Data loss risk | Device failure = loss | Recoverable | Recoverable | Recoverable |
| Offline support | Full | Full | Full | None |

**Chosen:** Phases 1→4 progression. Ship local+backup first (immediate cost/privacy win), add sync later.

## Key Design Decisions

1. **IndexedDB via Dexie.js** — mature wrapper, schema migrations, good TypeScript support. idb is lighter but lacks migration tooling needed for evolving schema.

2. **Web Crypto API (AES-256-GCM + PBKDF2)** — native browser API, no JS crypto library needed. AES-GCM provides authenticated encryption. PBKDF2 for key derivation from password (Argon2id via WASM if bundle size allows).

3. **Typed encrypted repositories behind Zustand stores** — Zustand holds the hydrated unlocked session only; Dexie stores authenticated AES-256-GCM envelopes. Financial data is never serialized through Zustand `persist`.

4. **TanStack Query hooks swap to IndexedDB reads** — `queryFn` changes from `fetch('/api/...')` to `db.transactions.where(...)`. UI layer untouched. This is WHY the port/adapter pattern in `shared/adapters/` was set up.

5. **Cloudflare R2 for encrypted blobs** — zero egress cost, generous free tier (10GB storage, 10M reads/mo). At personal scale: 0 PLN/mo.

6. **Backend retains auth + billing only** — JWT issuance, subscription management, encrypted blob storage API. No access to financial data.

7. **Recovery key UX is explicit** — user shown recovery key at setup, must confirm backup. No server-side recovery possible (by design, not limitation).

8. **XSS mitigation is P0** — decrypted data lives in browser memory. CSP strict-dynamic, no innerHTML, subresource integrity on all scripts. Key material in non-extractable CryptoKey objects.

## Cost Comparison (monthly, single user)

| Component | Classic SaaS | Local-first + backup |
|---|---|---|
| Compute (API) | 80-120 PLN (Vercel Pro) | 0 PLN (static hosting) |
| Database | 60-100 PLN (Supabase Pro) | 0 PLN (IndexedDB) |
| Blob storage | — | 0 PLN (R2 free tier) |
| CDN/hosting | 30 PLN | 0-30 PLN (Cloudflare Pages) |
| **Total** | **170-250 PLN** | **0-50 PLN** |

## RODO Impact Assessment

| Aspect | Current (SaaS) | After migration (local-first) |
|---|---|---|
| Data controller obligations | Full (server stores data) | Minimal (server has ciphertext) |
| DPIA required? | Yes (financial data processing) | No (no plaintext processing server-side) |
| Breach notification (Art. 33) | Required (72h to UODO) | Not applicable (breach yields ciphertext) |
| Right to erasure (Art. 17) | Must implement server-side | User deletes local DB (self-service) |
| Data portability (Art. 20) | Backend must export | Already local (IndexedDB export) |
| Cross-border transfer | Relevant if hosting outside EU | Irrelevant (data encrypted, no processing) |

**KNF/regulatory:** Not applicable. Manual CSV import only, no open banking API, no PSD2 scope.

## FSD Layer Impact

| Layer | Changes needed | Phase |
|---|---|---|
| `model/` (types, transformers) | ZERO | — |
| `ui/` (components) | ZERO | — |
| `store/` (Zustand) | Hydrate unlocked session and write through encrypted repositories | 2 |
| `api/` (TanStack Query hooks) | Swap queryFn to IndexedDB | 2 |
| `shared/adapters/persistence/` | NEW — IndexedDB port + Dexie adapter | 2 |
| `shared/lib/crypto/` | Web Crypto primitives used by encrypted persistence | 2 |
| `shared/adapters/sync/` | NEW — encrypted sync protocol | 4 |

## Assumptions

- User accepts "lose key = lose data" tradeoff (standard for E2EE products)
- Browser IndexedDB storage sufficient (typical budget data: 5-50MB over years)
- Web Crypto API available in all target browsers (baseline 2023+)
- Single-user or household use (not enterprise multi-tenant at this stage)
- Sync conflicts rare (1-2 devices, sequential editing pattern)

## Risks

- **XSS = total compromise** — mitigated by strict CSP, no eval, no innerHTML, framework auto-escaping
- **IndexedDB eviction** — browsers may clear under storage pressure. Mitigated by encrypted backup (Phase 3)
- **Key management UX** — users forget passwords. Recovery key ceremony + optional biometric unlock
- **Server-side AI/analytics** — must operate on anonymized/aggregated data or move to client (WASM models)

## Phased Rollout (summary)

| Phase | Scope | Effort | Prerequisite |
|---|---|---|---|
| 1 (current) | Complete MVP features, SaaS mode | — | — |
| 2 | IndexedDB persistence, offline-first | ~2-3 weeks | MVP complete |
| 3 | Encrypted cloud backup (R2) | ~1 week | Phase 2 |
| 4 | E2EE multi-device sync | ~3-5 weeks | Phase 3 |

Details: [Local-First E2EE Migration](../architecture/local-first-e2ee.md)

## Future Considerations

- Argon2id via WASM for stronger key derivation (when bundle size allows)
- CRDT-based sync for Phase 4 (Yjs or custom op-log) — evaluate vs last-write-wins
- OPFS (Origin Private File System) as IndexedDB alternative for large datasets
- Passkey/WebAuthn for key unlock (passwordless UX)
- Shared workspaces (household budgeting) — requires key sharing protocol
