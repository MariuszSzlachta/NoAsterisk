# Original System and Architecture Assumptions

> **Source status:** These are initial design assumptions from the legacy product plan. They are not automatically current canonical architecture. Current component references and ADRs may diverge; unresolved differences remain visible.

## Technology Stack

### Frontend
- **Vite** — bundler
- **React + TypeScript**
- **Zustand** — state management
- **papaparse** — CSV parsing in the browser (in-memory)
- **TanStack Table** — DataGrid for CSV preview and mapping (alternatively ag-grid-community)

### Backend
- **NestJS + TypeScript**
- **PostgreSQL**
- **Drizzle ORM** — typesafe SQL, schema separate from domain entities, plain objects ideal for mapper pattern
- **Zod** — DTO validation and runtime

---

## Backend Architecture

**Modular Monolith + Hexagonal-lite (Ports & Adapters) with DDD elements**

Not full DDD (too much ceremony at this stage), not MVC (too flat). Middle ground: clean domain layers with ports for external dependencies (AI, database).

### Key architecture principles:

**Layering with mappers at every boundary — zero leaks:**

```
Persistence (Postgres row)
   ↓ [mapper: Persistence → Domain Entity]
Domain Entity (business logic, lives only in domain/ + application/)
   ↓ [mapper: Domain → DTO]  ← ABAC filter applied here
DTO (HTTP contract)
   ↓ [mapper: DTO → ViewModel]  ← on the frontend side
ViewModel (UI — views + hooks)
```

**CQRS-lite:**
- Command = state-changing operation (CSV import, category confirmation, rule addition)
- Query = side-effect-free read (agent insights, budget summary)

---

## Import Batch and Deduplication

### Problem

Bank CSV files have no unique transaction IDs. A user may accidentally import the same file twice, or files with overlapping date ranges (January–March, then February–April).

### Solution: two-level deduplication

**Level 1 — Content hash per row (primary dedup)**

Frontend generates a hash from raw data (before anonymization):
```
contentHash = SHA-256(transactionDate + amount + rawTitle + SHA-256(accountNumber))
```

**Level 2 — Batch hash (early-return)**
```
batchHash = SHA-256(sorted(contentHashes[]))
```

### Data Model

```
import_batches
- id (UUID, generated on the frontend)
- workspace_id
- batch_hash (unique per workspace)
- source_filename (optional)
- total_rows / saved_rows
- status (Pending → InProgress → Complete/PartiallyRejected)
- imported_at / completed_at

transactions
- ...existing fields...
- import_batch_id (FK → import_batches, nullable)
- content_hash (unique per workspace)
```

---

## Server-side Anti-PII Validation

Backend applies an advanced validation engine with feedback loop:

```
Front: sends chunk → Backend: anti-PII validation
  ├─ ALL OK → 201 { status: 'accepted', saved: N }
  └─ PARTIAL REJECT → 207 { status: 'partial', saved: N, rejected: [...] }
       → Front: shows rejected → User corrects → retry
```

---

## Current architecture references

- [Architecture map](./README.md)
- [Local-first target architecture](./local-first-e2ee.md)
- [Legacy decision index](../history/decisions/README.md)
- [DEC-003 hash conflict](../history/decisions/integrity-issues.md#dec-003-content-hash-timing-conflict)

## Source provenance

- Original source: legacy product plan
- Pre-atomization path: `docs/product/product-concept.md`
- Original source lines: 241–336
- Frozen source commit: `582b3e8b147293c7b33dd0f839839aa81d7c8c20`
