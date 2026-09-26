# Local-First E2EE Migration — Technical Reference

> **Naming compatibility:** `budgetflow-*` examples in this reference are legacy
> persistence/protocol identifiers preserved byte-for-byte by ADR-015. They do not
> name the current NoAsterisk product identity.

> **Current MVP note (2026-09-09):** The migration is partially implemented. CSV
> import and user-owned financial state use encrypted client-local persistence, and
> cross-device MVP sync transports an opaque encrypted snapshot through the backend.
> This document still contains historical transition examples and future-phase
> designs; do not treat every example or endpoint below as an implemented contract.

> **Status:** Sessions 02–08 client foundation and whole-snapshot sync flow implemented incrementally (2026-09-09). The release closure plan remains the authority for gate completion.
>
> **Decision:** [ADR-003](../adr/003-local-first-e2ee-architecture.md)
>
> **Related:** [Privacy and security](../product/capabilities/privacy-and-security.md), [CSV engine overview](./csv-engine/overview.md)

> **TODO — owner review:** Backend module guides still describe PostgreSQL as planned, while this target architecture says that plan was cancelled. Confirm the current persistence roadmap and update the affected guides through a new decision; this migration does not choose between them.

---

## Problem & Constraints

The migration started from a classic SaaS baseline: React sent anonymized transaction
data to a NestJS backend via REST, and server-side repositories stored financial data.
That description is historical. The current MVP path uses encrypted client-local
persistence and an opaque encrypted snapshot for cross-device synchronization; the
former server-side financial-data path is retired.

**Problems with current model:**
1. Server holds financial data — breach exposes spending patterns even without PII
2. RODO compliance requires ongoing DPIA, data retention policies, UODO notifications
3. Hosting cost scales with data volume (DB, compute for queries, backups)
4. User has no data sovereignty — account deletion requires trust in server-side wipe
5. Offline usage impossible — network required for every read/write

**Constraints:**
- Frontend already processes raw CSV locally (`features/csv-import/model/`)
- Backend receives only anonymized data (privacy-by-design since Phase 1)
- FSD architecture with port/adapter pattern enables data source swapping
- Must maintain existing UX — migration transparent to user
- Single developer — phased approach mandatory, each phase independently shippable
- No breaking changes to existing import flow during migration

**Enablers already in place:**

| Layer | Current code | Migration impact |
|-------|-------------|-----------------|
| `features/csv-import/model/` | Pure functions, zero HTTP deps | ZERO changes |
| `features/csv-import/store/` | Zustand + immer | Keep raw CSV in memory; persist only safe wizard navigation in sessionStorage when introduced |
| `features/csv-import/api/` | TanStack Query → HTTP | Swap `queryFn` to IndexedDB |
| `features/dashboard-widgets/ui/` | Renders ViewModels only | ZERO changes |
| `shared/adapters/charts/` | Port/adapter (Nivo) | ZERO changes |
| `shared/adapters/grid/` | Port/adapter (AG Grid) | ZERO changes |
| `shared/api/http-client.ts` | Centralized HTTP | Becomes backup sync client only |

---

## Architecture Overview

### Current (Phase 1): Classic SaaS

```
┌─────────────────────────────────────────────────────────────────┐
│  BROWSER                                                         │
│                                                                   │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────┐   │
│  │  CSV Import  │    │  Dashboard   │    │  Categorization  │   │
│  │  model/      │    │  widgets/    │    │  Rules           │   │
│  │  (parse+anon)│    │  (render VM) │    │  (local apply)   │   │
│  └──────┬───────┘    └──────┬───────┘    └────────┬─────────┘   │
│         │                   │                     │              │
│         ▼                   ▼                     ▼              │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  api/ layer (TanStack Query → HTTP fetch → REST)        │    │
│  └─────────────────────────┬───────────────────────────────┘    │
│                             │                                    │
└─────────────────────────────┼────────────────────────────────────┘
                              │ HTTPS (anonymized data only)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  SERVER (NestJS)                                                 │
│                                                                   │
│  ┌────────────┐  ┌──────────────┐  ┌─────────────────────────┐ │
│  │  Auth      │  │  Imports     │  │  Categorization Rules   │ │
│  │  (JWT)     │  │  (validate)  │  │  (CRUD + auto-apply)    │ │
│  └────────────┘  └──────────────┘  └─────────────────────────┘ │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  In-Memory Repositories (→ PostgreSQL planned)              │ │
│  │  transactions, import-batches, rules, categories, users     │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Target (Phase 4): Local-First + E2EE Sync

```
┌─────────────────────────────────────────────────────────────────┐
│  BROWSER (Device A)                                              │
│                                                                   │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────┐   │
│  │  CSV Import  │    │  Dashboard   │    │  Categorization  │   │
│  │  model/      │    │  widgets/    │    │  Rules           │   │
│  │  (unchanged) │    │  (unchanged) │    │  (unchanged)     │   │
│  └──────┬───────┘    └──────┬───────┘    └────────┬─────────┘   │
│         │                   │                     │              │
│         ▼                   ▼                     ▼              │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  api/ layer (TanStack Query → IndexedDB read/write)     │    │
│  └─────────────────────────┬───────────────────────────────┘    │
│                             │                                    │
│  ┌──────────────────────────▼──────────────────────────────┐    │
│  │  shared/adapters/persistence/ (Dexie.js)                │    │
│  │  ┌─────────────┐  ┌────────────┐  ┌────────────────┐   │    │
│  │  │ Transactions│  │ Rules      │  │ Categories     │   │    │
│  │  │ (encrypted) │  │ (encrypted)│  │ (encrypted)    │   │    │
│  │  └─────────────┘  └────────────┘  └────────────────┘   │    │
│  └─────────────────────────┬───────────────────────────────┘    │
│                             │                                    │
│  ┌──────────────────────────▼──────────────────────────────┐    │
│  │  shared/lib/crypto/ (Web Crypto API)                    │    │
│  │  AES-256-GCM encryption ← PBKDF2/Argon2id(password)    │    │
│  └─────────────────────────┬───────────────────────────────┘    │
│                             │                                    │
│  ┌──────────────────────────▼──────────────────────────────┐    │
│  │  shared/adapters/sync/ (encrypted operation log)        │    │
│  └─────────────────────────┬───────────────────────────────┘    │
│                             │                                    │
└─────────────────────────────┼────────────────────────────────────┘
                              │ HTTPS (encrypted blobs only)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  SERVER (minimal — "encrypted relay")                            │
│                                                                   │
│  ┌────────────┐  ┌───────────────────┐  ┌──────────────────┐   │
│  │  Auth      │  │  Blob Storage     │  │  Device Registry │   │
│  │  (JWT)     │  │  (R2/S3 — opaque) │  │  (pubkeys)       │   │
│  └────────────┘  └───────────────────┘  └──────────────────┘   │
│                                                                   │
│  Server CANNOT decrypt any user data. Zero knowledge.            │
└─────────────────────────────────────────────────────────────────┘
```


---

## Migration Phases

### Phase 1 (Current): Classic SaaS — COMPLETE

No migration work. Finish existing MVP features. Backend stores anonymized data.

**What already enables local-first:**
- `features/csv-import/model/parser/` — pure parsing, zero network calls
- `features/csv-import/model/anonymizer/` — full PII pipeline runs in-browser
- `shared/api/auth-tokens.ts` — tokens in memory only, never localStorage
- All `model/` layers are pure functions with no HTTP imports
- Zustand stores use `immer` — already serialize/deserialize cleanly

**Invariant preserved:** Raw CSV data never leaves browser. Only anonymized titles sent to server.

---

### Phase 2: Local-First Single Device (~2-3 weeks)

**Goal:** App works fully offline. IndexedDB is source of truth. Server becomes optional backup target.

**Session 02 implementation status (2026-09-07):** Financial Zustand stores are now
in-memory session views backed by `client/src/shared/adapters/persistence/`. Durable
records are encrypted before Dexie commits them. The only localStorage allowlist is
non-sensitive presentation state: `budget-preferences` and `budget-theme`. Financial
keys from the former Zustand stores are read only by the one-time migration and are
removed after authenticated read-back.

#### 2.1 New module: `shared/adapters/persistence/`

```
shared/adapters/persistence/
├── ports/
│   ├── encrypted-repository.ts   # Typed encrypted CRUD boundary
│   └── persistence-types.ts      # Envelope, metadata and collection types
├── crypto/                       # PBKDF2 + AES-256-GCM + AAD
├── dexie/                        # Versioned schema and transactional adapter
├── migrations/                   # Validated localStorage → IndexedDB migration
├── session/                      # In-memory CryptoKey lifecycle and locks
└── index.ts                      # Narrow public API
```

#### 2.2 IndexedDB schema (Dexie.js)

```typescript
// client/src/shared/adapters/persistence/dexie/budget-database.ts
class BudgetDatabase extends Dexie {
  records!: Table<EncryptedRecordEnvelope, [string, string]>;
  metadata!: Table<DatabaseMetadataRecord, string>;

  constructor() {
    super('budgetflow-encrypted-financial-data');
    this.version(1).stores({
      records: '[collection+id], collection, updatedAt',
      metadata: 'id',
    });
  }
}

// `records` contains only technical envelope fields. Amounts, dates,
// descriptions, categories, budgets, keywords and filenames are ciphertext.
```

The database metadata contains only a random 16-byte salt, schema/crypto
versions, an encrypted verification sentinel and a migration marker. The
passphrase and non-extractable AES key exist only during an unlocked session.

#### 2.3 Persistence port (implemented)

`EncryptedRepository<T>` exposes typed `get`, `getAll`, `put`, `putMany`,
`replace`, `delete` and `clear` operations. Encryption is performed before a
Dexie read-write transaction commits. Because business fields are encrypted,
MVP filtering and sorting happens after collection hydration in memory; no
deterministic encrypted indexes are introduced.

#### 2.4 API layer swap (main change)

Current pattern (`features/dashboard-widgets/api/`):

```typescript
// BEFORE: HTTP fetch
export const useTransactionsQuery = (workspaceId: string): QueryState<TransactionDto[]> => {
  return useApiQuery({
    queryKey: ['transactions', workspaceId],
    queryFn: () => apiClient.get<TransactionDto[]>(`/transactions?workspaceId=${workspaceId}`),
  });
};
```

After migration:

```typescript
// AFTER: IndexedDB read
import { transactionStore } from '#shared/adapters/persistence';

export const useTransactionsQuery = (workspaceId: string): QueryState<TransactionDto[]> => {
  return useApiQuery({
    queryKey: ['transactions', workspaceId],
    queryFn: () => transactionStore.findAll(workspaceId),
  });
};
```

**Key insight:** Only `queryFn` changes. TanStack Query caching, loading states, error handling — all unchanged. UI components never know the difference.

#### 2.5 Import flow change

Current: the local import flow prepares records and writes them to encrypted IndexedDB; it does not call `/imports`.
The former server-submission path is retired; the code example below is retained as
implementation guidance, not as a live API contract.

```typescript
// features/csv-import/api/useImportMutation/useImportMutation.ts — AFTER
import { db } from '#shared/adapters/persistence';

export const useImportMutation = (): UseImportMutationResult => {
  const mutation = useMutation({
    mutationFn: async (chunk: ImportChunkPayload): Promise<ImportChunkResult> => {
      // Dedup check (same logic as server's existsByContentHash)
      const existingHashes = await Promise.all(
        chunk.rows.map((r) => db.transactions.where({ contentHash: r.contentHash }).first()),
      );

      const newRows = chunk.rows.filter((_, i) => !existingHashes[i]);
      await db.transactions.bulkAdd(newRows.map(toStoredTransaction));
      await db.importBatches.put(toBatchRecord(chunk, newRows.length));

      return { status: 'accepted', saved: newRows.length, duplicatesSkipped: chunk.rows.length - newRows.length };
    },
  });

  return { submitChunk: (chunk) => mutation.mutateAsync(chunk) };
};
```

#### 2.6 Wizard state and raw CSV lifecycle

The current wizard keeps its parsed file and rows in memory and clears them on
route departure. If safe navigation persistence is added, it must use
`sessionStorage` only and exclude `file`, `parsedData`, rows and all raw PII.

**Security:** Raw CSV data (`parsedData`, `file`) excluded from persistence. Only safe navigation state persisted.

#### 2.7 Migration script (legacy localStorage → encrypted IndexedDB)

The shipped migration reads only the known former Zustand keys
(`budget-transactions`, `budget-rules`, `budget-budgets`,
`budget-period-history`, `budget-categories` and `budget-import-profiles`). It
validates every payload, encrypts all records before one Dexie transaction,
decrypts the stored rows for read-back verification, then removes the legacy
financial keys. Invalid or interrupted migrations retain the source keys and
leave the non-sensitive preferences allowlist untouched. A non-sensitive
completion marker makes subsequent unlocks idempotent.

```typescript
// The migration never calls the financial HTTP API and never deletes a
// legacy key until authenticated IndexedDB read-back succeeds.
```


---

### Phase 3: Encrypted Cloud Backup (~1 week)

**Goal:** User's IndexedDB data gets encrypted and backed up to cloud. Server stores opaque ciphertext. Recovery possible from any browser with password.

#### 3.1 New module: `shared/lib/crypto/`

```
shared/lib/crypto/
├── types.ts                  # CryptoKey wrapper types
├── key-derivation.ts         # PBKDF2/Argon2id: password → AES key
├── symmetric.ts              # AES-256-GCM encrypt/decrypt
├── constants.ts              # Salt length, iteration count, IV size
└── index.ts
```

#### 3.2 Key derivation

```typescript
// shared/lib/crypto/key-derivation.ts
const PBKDF2_ITERATIONS = 600_000; // OWASP 2024 recommendation
const SALT_LENGTH = 16;            // 128 bits
const KEY_LENGTH = 256;            // AES-256

export const deriveKey = async (
  password: string,
  salt: Uint8Array,
): Promise<CryptoKey> => {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey'],
  );

  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: KEY_LENGTH },
    false,              // not extractable
    ['encrypt', 'decrypt'],
  );
};

export const generateSalt = (): Uint8Array => {
  return crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
};
```

#### 3.3 Symmetric encryption

```typescript
// shared/lib/crypto/symmetric.ts
const IV_LENGTH = 12; // 96 bits for AES-GCM

export interface EncryptedPayload {
  readonly iv: Uint8Array;
  readonly ciphertext: ArrayBuffer;
  readonly salt: Uint8Array;       // stored alongside for key re-derivation
}

export const encrypt = async (
  plaintext: string,
  key: CryptoKey,
): Promise<{ iv: Uint8Array; ciphertext: ArrayBuffer }> => {
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const encoder = new TextEncoder();

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(plaintext),
  );

  return { iv, ciphertext };
};

export const decrypt = async (
  ciphertext: ArrayBuffer,
  key: CryptoKey,
  iv: Uint8Array,
): Promise<string> => {
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext,
  );

  return new TextDecoder().decode(decrypted);
};
```

#### 3.4 Backup flow

```
User clicks "Backup" → serialize IndexedDB tables → JSON string
  → AES-256-GCM encrypt(JSON, derivedKey)
  → POST /backup/upload (encrypted blob + salt + IV)
  → Server stores in R2/S3 (cannot read content)
```

```typescript
// features/backup/model/create-backup.ts
import { db } from '#shared/adapters/persistence';
import { deriveKey, generateSalt } from '#shared/lib/crypto';
import { encrypt } from '#shared/lib/crypto';

interface BackupBlob {
  readonly salt: Uint8Array;
  readonly iv: Uint8Array;
  readonly ciphertext: ArrayBuffer;
  readonly version: number;           // schema version for forward compat
  readonly createdAt: string;
}

export const createEncryptedBackup = async (password: string): Promise<BackupBlob> => {
  // 1. Export all tables
  const data = {
    transactions: await db.transactions.toArray(),
    rules: await db.rules.toArray(),
    categories: await db.categories.toArray(),
    importBatches: await db.importBatches.toArray(),
    exportedAt: new Date().toISOString(),
    schemaVersion: 1,
  };

  // 2. Serialize
  const plaintext = JSON.stringify(data);

  // 3. Derive key from password
  const salt = generateSalt();
  const key = await deriveKey(password, salt);

  // 4. Encrypt
  const { iv, ciphertext } = await encrypt(plaintext, key);

  return { salt, iv, ciphertext, version: 1, createdAt: data.exportedAt };
};
```

#### 3.5 Restore flow

```
User enters password → GET /backup/latest
  → decrypt(blob.ciphertext, deriveKey(password, blob.salt), blob.iv)
  → JSON.parse → validate schema version → bulkPut into IndexedDB
```

#### 3.6 Server changes

Backend shrinks to 3 endpoints for backup:

```
POST   /backup/upload     — store encrypted blob (max 50MB)
GET    /backup/latest     — return latest blob for user
GET    /backup/list       — list all backup timestamps
DELETE /backup/:id        — delete specific backup
```

The former imports, transactions and rules persistence endpoints are not part of the
current local-first MVP data path. The backend retains auth, administration,
dictionaries and opaque vault synchronization responsibilities.

#### 3.7 Storage: Cloudflare R2

| Metric | Value |
|--------|-------|
| Storage | 10GB free, $0.015/GB after |
| Egress | Free (no bandwidth charges) |
| Operations | 1M Class A free, 10M Class B free |
| Typical user backup | ~2-5MB (1 year of transactions) |
| Cost at 100 users | ~0 PLN/month |
| Cost at 10,000 users | ~50 PLN/month |

---

### Phase 4: E2EE Sync Chain (~3-5 weeks)

**Goal:** Multiple devices sync encrypted data via server. No device trusts the server. Devices trust each other via key exchange.

#### MVP implementation: whole-snapshot push/pull

The MVP uses user-initiated whole-snapshot synchronization. The client reads and remembers
the opaque server revision, encrypts the complete validated local payload in the browser,
and uploads it with `baseRevision`. A stale write is rejected and exposed as a conflict;
the client never silently overwrites a newer remote snapshot. Pull decrypts and validates
the entire payload before the encrypted IndexedDB collections or Zustand views are changed.

The browser persists only synchronization metadata: observed revision, last successful
sync revision/time, and dirty state. Passwords, derived keys, plaintext digests and
financial records are never persisted as sync metadata or sent to the server. Retrying
the same encrypted payload against the same base revision is safe because the server
contract treats identical ciphertext as idempotent.

#### 4.1 New module: `shared/adapters/sync/`

```
shared/adapters/sync/
├── ports/
│   └── sync.port.ts              # SyncEngine interface
├── adapters/
│   └── operation-log/
│       ├── operation-log.ts      # Append-only encrypted op log
│       ├── conflict-resolver.ts  # LWW per field + custom merge
│       └── sync-client.ts        # WebSocket/polling to server
├── types.ts                      # SyncOperation, DeviceId, SyncState
└── index.ts
```

#### 4.2 Device pairing (key exchange)

```
Device A (existing)                      Device B (new)
─────────────────                        ─────────────────
1. Generate QR code containing:          
   - deviceA.publicKey (X25519)
   - one-time pairing code (6 digits)
   - server endpoint
                                         2. Scan QR → extract pubkey + code
                                         3. Generate own keypair
                                         4. POST /devices/pair {
                                              devicePublicKey: B.pub,
                                              pairingCode: "123456",
                                              targetDeviceId: A.id
                                            }
5. Server notifies A: "B wants to pair"
6. A confirms (enters same 6-digit code)
7. Both derive shared secret:
   sharedKey = X25519(A.priv, B.pub)
   = X25519(B.priv, A.pub)
8. A encrypts master key with sharedKey
   → sends to B via server (opaque to server)
9. B decrypts master key
   → can now decrypt all IndexedDB data
```

#### 4.3 Operation log (sync protocol)

Every local write produces an encrypted operation:

```typescript
// shared/adapters/sync/types.ts
interface SyncOperation {
  readonly id: string;               // ULID (time-sortable)
  readonly deviceId: string;
  readonly timestamp: number;        // lamport clock
  readonly table: 'transactions' | 'rules' | 'categories' | 'importBatches';
  readonly recordId: string;
  readonly type: 'create' | 'update' | 'delete';
  readonly patch: Record<string, unknown> | undefined;  // only changed fields for update
  readonly checksum: string;         // HMAC of operation content
}

interface EncryptedOperation {
  readonly id: string;
  readonly deviceId: string;
  readonly timestamp: number;
  readonly ciphertext: ArrayBuffer;  // encrypted SyncOperation
  readonly iv: Uint8Array;
}
```

#### 4.4 Conflict resolution

**Strategy: Last-Write-Wins per field (LWW-Register)**

```typescript
// shared/adapters/sync/adapters/operation-log/conflict-resolver.ts
interface FieldTimestamp {
  readonly field: string;
  readonly timestamp: number;
  readonly deviceId: string;
}

export const resolveConflict = (
  local: SyncOperation,
  remote: SyncOperation,
): SyncOperation => {
  if (local.type === 'delete' || remote.type === 'delete') {
    // Delete always wins (tombstone)
    return local.timestamp > remote.timestamp ? local : remote;
  }

  if (local.type === 'create' && remote.type === 'create') {
    // Same record created on two devices — higher timestamp wins
    return local.timestamp > remote.timestamp ? local : remote;
  }

  // Update: merge per-field (LWW per field)
  const mergedPatch: Record<string, unknown> = {};
  const allFields = new Set([
    ...Object.keys(local.patch ?? {}),
    ...Object.keys(remote.patch ?? {}),
  ]);

  for (const field of allFields) {
    const localHas = local.patch && field in local.patch;
    const remoteHas = remote.patch && field in remote.patch;

    if (localHas && !remoteHas) {
      mergedPatch[field] = local.patch![field];
    } else if (!localHas && remoteHas) {
      mergedPatch[field] = remote.patch![field];
    } else {
      // Both modified same field — LWW
      mergedPatch[field] = local.timestamp > remote.timestamp
        ? local.patch![field]
        : remote.patch![field];
    }
  }

  return { ...local, patch: mergedPatch, timestamp: Math.max(local.timestamp, remote.timestamp) };
};
```

**Why LWW, not CRDT:**
- Financial data is simple key-value (amount, date, title, categoryId)
- No concurrent collaborative editing (single user, multiple devices)
- Conflicts are rare (user typically uses one device at a time)
- CRDT overhead unjustified for the data model

#### 4.5 Sync flow

```
Device writes to IndexedDB
  → append SyncOperation to local op log
  → encrypt operation with master key
  → push to server (POST /sync/operations)

Server stores encrypted ops (cannot read them)
  → notifies other paired devices (WebSocket or polling)

Other device polls/receives notification
  → GET /sync/operations?since={lastSync}
  → decrypt operations
  → apply to local IndexedDB (with conflict resolution)
  → update lastSync cursor
```

#### 4.6 Server endpoints (Phase 4)

```
POST   /devices/pair           — initiate pairing
POST   /devices/confirm        — confirm pairing (both sides)
GET    /devices                — list paired devices
DELETE /devices/:id            — unpair device

POST   /sync/operations        — push encrypted ops (batch)
GET    /sync/operations        — pull ops since cursor
WS     /sync/stream            — real-time push (optional, polling fallback)
```


---

## Core Interfaces (New Adapters/Ports)

### Persistence Port (`shared/adapters/persistence/`)

```typescript
// shared/adapters/persistence/ports/persistence.port.ts

interface QueryFilter {
  readonly field: string;
  readonly operator: 'eq' | 'gte' | 'lte' | 'contains' | 'in';
  readonly value: unknown;
}

interface SortOption {
  readonly field: string;
  readonly direction: 'asc' | 'desc';
}

interface QueryOptions {
  readonly filters?: ReadonlyArray<QueryFilter>;
  readonly sort?: SortOption;
  readonly page?: number;
  readonly limit?: number;
}

interface QueryResult<TRecord> {
  readonly items: ReadonlyArray<TRecord>;
  readonly total: number;
  readonly hasMore: boolean;
}

interface PersistencePort<TRecord extends { id: string; workspaceId: string }> {
  // CRUD
  findById(id: string): Promise<TRecord | undefined>;
  findByWorkspace(workspaceId: string, options?: QueryOptions): Promise<QueryResult<TRecord>>;
  save(record: TRecord): Promise<void>;
  saveBatch(records: ReadonlyArray<TRecord>): Promise<void>;
  update(id: string, patch: Partial<TRecord>): Promise<void>;
  delete(id: string): Promise<void>;
  deleteByWorkspace(workspaceId: string): Promise<void>;

  // Sync support (Phase 4)
  getVersion(id: string): Promise<number>;
  getAllSince(workspaceId: string, timestamp: number): Promise<ReadonlyArray<TRecord>>;
}
```

### Crypto Port (`shared/lib/crypto/`)

```typescript
// shared/lib/crypto/types.ts

interface DerivedKeyResult {
  readonly key: CryptoKey;
  readonly salt: Uint8Array;
}

interface EncryptResult {
  readonly ciphertext: ArrayBuffer;
  readonly iv: Uint8Array;
}

interface CryptoPort {
  deriveKey(password: string, salt?: Uint8Array): Promise<DerivedKeyResult>;
  encrypt(plaintext: string, key: CryptoKey): Promise<EncryptResult>;
  decrypt(ciphertext: ArrayBuffer, key: CryptoKey, iv: Uint8Array): Promise<string>;
  generateKeyPair(): Promise<CryptoKeyPair>;                    // Phase 4: device pairing
  deriveSharedSecret(privateKey: CryptoKey, publicKey: CryptoKey): Promise<CryptoKey>; // X25519
}
```

### Sync Port (`shared/adapters/sync/`)

```typescript
// shared/adapters/sync/ports/sync.port.ts

type SyncStatus = 'idle' | 'syncing' | 'conflict' | 'error' | 'offline';

interface SyncState {
  readonly status: SyncStatus;
  readonly lastSyncAt: number | undefined;
  readonly pendingOps: number;
  readonly conflictCount: number;
}

interface SyncPort {
  // Lifecycle
  initialize(masterKey: CryptoKey): Promise<void>;
  destroy(): void;

  // Push/Pull
  pushOperations(ops: ReadonlyArray<SyncOperation>): Promise<void>;
  pullOperations(since: number): Promise<ReadonlyArray<SyncOperation>>;

  // State
  getState(): SyncState;
  onStateChange(callback: (state: SyncState) => void): () => void;

  // Conflict UI
  getConflicts(): ReadonlyArray<SyncConflict>;
  resolveConflict(conflictId: string, resolution: 'local' | 'remote'): Promise<void>;
}
```

---

## Design Decisions

### D1: Dexie.js over raw IndexedDB

| Criteria | Dexie.js | Raw IndexedDB | idb (wrapper) |
|----------|----------|---------------|---------------|
| API ergonomics | Excellent (Promises, chaining) | Terrible (events, cursors) | Good |
| Compound queries | `.where().between().and()` | Manual cursor iteration | Basic |
| Schema migrations | Built-in versioning | Manual | Manual |
| Bulk operations | `.bulkPut()` (transactional) | Manual transaction handling | Basic |
| Bundle size | ~30KB gzip | 0 (native) | ~3KB |
| Production usage | 10M+ weekly downloads | — | 1M+ |
| Encryption plugin | dexie-encrypted (exists) | — | — |

**Decision:** Dexie.js. The query API, migration system, and bulk operations justify the 30KB cost. Budget app will have thousands of records — need efficient compound indices.

**Rejected:** idb (too minimal for compound queries), raw IndexedDB (unmaintainable cursor code).

### D2: AES-256-GCM over AES-256-CBC

| Criteria | AES-GCM | AES-CBC |
|----------|---------|---------|
| Authentication | Built-in (AEAD) | Requires separate HMAC |
| Padding oracle | Impossible | Vulnerable without HMAC |
| Web Crypto support | Native | Native |
| Performance | Slightly faster (one pass) | Two passes with HMAC |
| IV requirement | Unique per encryption (96 bits) | Unique per encryption (128 bits) |

**Decision:** AES-256-GCM. Authenticated encryption by default — cannot decrypt tampered ciphertext. One algorithm, no composition bugs.

### D3: LWW-Register over CRDT

| Criteria | LWW per field | CRDT (Automerge/Yjs) |
|----------|---------------|----------------------|
| Complexity | Simple timestamp comparison | Complex merge semantics |
| Bundle size | ~0 (custom, tiny) | 50-150KB |
| Data model fit | Perfect (flat records) | Overkill (designed for text/sequences) |
| Conflict visibility | Explicit (can show both) | Implicit (auto-merged) |
| Multi-user | Not needed (single user, multi-device) | Designed for multi-user |

**Decision:** LWW per field. Single-user app with multiple devices = conflicts are rare. When they happen, latest write wins per field. User can see sync history if needed.

**Rejected:** Automerge (100KB+ for a use case that rarely conflicts), Yjs (collaborative editing semantics unnecessary).

### D4: PBKDF2 over Argon2id (initial)

| Criteria | PBKDF2 | Argon2id |
|----------|--------|----------|
| Web Crypto native | ✅ Yes | ❌ No (WASM required) |
| Memory-hard | ❌ No | ✅ Yes |
| GPU resistance | Weak | Strong |
| Bundle impact | 0 (native) | ~200KB WASM |
| Browser support | Universal | Requires WASM support |

**Decision:** Start with PBKDF2 (600K iterations, OWASP 2024). Migrate to Argon2id-WASM when threat model justifies the 200KB cost. For a budget app with encrypted backups (not auth), PBKDF2 is adequate — attacker needs both the encrypted blob AND password.

**Future:** Add Argon2id as optional upgrade path. Detect WASM support → offer "stronger encryption" toggle.

### D5: Operation log over snapshot sync

| Criteria | Operation log (ops) | Full snapshot sync |
|----------|--------------------|--------------------|
| Bandwidth | Δ only (tiny per sync) | Full DB dump each time |
| Conflict resolution | Per-operation, fine-grained | Document-level only |
| History/audit | Built-in (log IS history) | No history |
| Partial sync | Natural (resume from cursor) | All-or-nothing |
| Complexity | Higher (log compaction needed) | Simple |
| Storage | Grows indefinitely without compaction | Fixed size |

**Decision:** Operation log. Bandwidth efficiency critical for mobile. Fine-grained conflict resolution enables field-level merge. Log compaction runs periodically (compact ops older than 30 days into snapshot).

### D6: sessionStorage for wizard state, NOT IndexedDB

Wizard in-progress state (step, column mapping) goes to `sessionStorage` via Zustand `persist`. NOT IndexedDB.

**Rationale:**
- Wizard state contains references to in-memory parsed CSV data
- `sessionStorage` dies on tab close — correct lifecycle for wizard
- IndexedDB persist would create orphaned state if user abandons import
- Security: no raw data remnants in persistent storage


---

## Performance Considerations

### IndexedDB Read Performance

| Operation | Expected latency | Strategy |
|-----------|-----------------|----------|
| Single record by ID | <1ms | Primary key lookup |
| Page of 50 transactions | <5ms | Compound index on `[workspaceId, date]` |
| Full workspace export (2000 records) | <50ms | Bulk read, single transaction |
| Count by category | <10ms | Index on `[workspaceId, categoryId]` |
| Content hash dedup check | <1ms | Unique index on `[workspaceId, contentHash]` |

### Encryption Performance (Web Crypto API)

| Operation | Data size | Expected time | Notes |
|-----------|-----------|---------------|-------|
| Key derivation (PBKDF2 600K) | — | ~300ms | One-time on login |
| Encrypt 1 transaction (~500B) | 500B | <1ms | Per-record for sync ops |
| Encrypt full backup (2000 txns) | ~2MB | ~15ms | Bulk export |
| Decrypt full backup | ~2MB | ~15ms | Restore flow |
| Encrypt sync operation | ~200B | <0.5ms | Per write operation |

### Sync Bandwidth

| Scenario | Payload size | Frequency |
|----------|-------------|-----------|
| Single transaction create | ~300B encrypted | Per import row |
| Batch import (200 rows) | ~60KB | Per import session |
| Category reassignment | ~150B | Per user action |
| Full day typical usage | ~5-20KB | Background sync |
| Initial device sync (1 year data) | ~2-5MB | One-time |

### Index Strategy (Dexie)

```typescript
// Compound indices for common query patterns
this.version(1).stores({
  transactions: 'id, workspaceId, [workspaceId+date], [workspaceId+categoryId], [workspaceId+contentHash], batchId',
  rules: 'id, workspaceId, [workspaceId+priority]',
  categories: 'id, workspaceId, [workspaceId+parentId]',
  importBatches: 'id, workspaceId, [workspaceId+importedAt]',
  syncLog: 'id, [workspaceId+timestamp], deviceId',
});
```

---

## Edge Cases & Risks

### E1: IndexedDB Storage Limits

| Browser | Default quota | Can request more? |
|---------|--------------|-------------------|
| Chrome | ~60% of disk (often 10-50GB) | `navigator.storage.persist()` |
| Firefox | ~50% of disk | `navigator.storage.persist()` |
| Safari | 1GB per origin | No (hard limit, eviction after 7 days w/o interaction) |

**Mitigation:**
- Call `navigator.storage.persist()` on first login — prevents eviction
- Monitor usage via `navigator.storage.estimate()`
- Show warning at 80% quota usage
- Safari: MUST have encrypted cloud backup enabled (data loss risk otherwise)

### E2: Browser Data Loss (cache clear, reinstall)

**Risk:** User clears browser data → all local transactions gone.

**Mitigation:**
- Phase 3 encrypted backup is **mandatory** UX before Phase 2 goes live
- Show persistent banner if backup is >7 days old
- On first load with empty IndexedDB: check server for backup → offer restore
- PWA install prompt (installed PWAs are less likely to have data cleared)

### E3: Key Loss (forgotten password)

**Risk:** User forgets encryption password → data unrecoverable.

**Mitigation:**
- Recovery phrase (BIP-39 style, 12 words) generated at account creation
- Recovery phrase encrypts a copy of the master key
- UX: force user to confirm 3 random words from phrase before proceeding
- NO server-side recovery possible (by design — this IS the security model)

### E4: XSS Attack Vector

**Risk:** With local-first, decrypted data lives in browser memory. XSS = full data access.

**Mitigation:**
- CSP headers (strict, no `eval`, no inline scripts)
- Subresource Integrity on all CDN-loaded scripts
- Zero `dangerouslySetInnerHTML` in React components
- DOMPurify for any user-generated content rendering
- Auth tokens in module-scoped variables (already done: `shared/api/auth-tokens.ts`)
- Master key in non-extractable `CryptoKey` object (cannot be read by JS, only used for operations)

**Residual risk:** XSS can still call `crypto.subtle.encrypt/decrypt` with the CryptoKey in memory. This is inherent to any client-side encryption. Mitigated by preventing XSS entirely.

### E5: Concurrent Tab Writes

**Risk:** User has app open in 2 tabs → both write to same IndexedDB → corruption.

**Mitigation:**
- Dexie transactions (ACID within a single origin)
- `BroadcastChannel` API for cross-tab state sync
- TanStack Query's `broadcastQueryClient` plugin — cache invalidation across tabs
- Leader election: only one tab runs sync (via `navigator.locks.request()`)

```typescript
// shared/adapters/sync/leader-election.ts
export const acquireSyncLock = async (callback: () => void): Promise<void> => {
  await navigator.locks.request('budgetflow-sync-leader', async () => {
    callback(); // only one tab reaches here
    // Hold lock until tab closes (never resolves intentionally)
    await new Promise(() => {});
  });
};
```

### E6: Service Worker + Offline

**Risk:** App must work offline immediately (not after first load).

**Plan:**
- Register service worker with Workbox (cache-first for app shell)
- All API calls → IndexedDB (offline by default in Phase 2)
- Sync operations queue in IndexedDB when offline → flush on reconnect
- `navigator.onLine` + periodic fetch to detect connectivity

### E7: Schema Migration (IndexedDB versions)

**Risk:** Schema changes after user has data → must migrate without data loss.

**Mitigation:**
- Dexie built-in versioning (`this.version(N).stores(...).upgrade(...)`)
- Each migration is a pure function transforming old records
- Migrations run automatically on `db.open()` if version increased
- Test all migrations with snapshot data in CI

---

## Security Model

### Threat Model

| Threat | Phase 1 (current) | Phase 2-3 | Phase 4 |
|--------|-------------------|-----------|---------|
| Server breach | Anonymized data exposed | Encrypted blobs only | Encrypted blobs + op log |
| MITM (TLS broken) | Anonymized data exposed | Encrypted blobs (double protection) | Encrypted ops |
| XSS | Session token stolen | Decrypted data in memory | Decrypted data in memory |
| Browser data theft (physical) | Nothing stored locally | IndexedDB readable | IndexedDB readable (if unlocked) |
| Malicious browser extension | Can read DOM | Can read decrypted data | Can read decrypted data |
| Server operator (insider) | Can read anonymized data | Cannot read anything | Cannot read anything |

### Key Hierarchy

```
User Password
     │
     ▼ PBKDF2 (600K iterations + random salt)
Master Encryption Key (MEK) ─── stored as non-extractable CryptoKey
     │
     ├── encrypts/decrypts IndexedDB records (Phase 2)
     ├── encrypts/decrypts backup blobs (Phase 3)
     └── encrypts/decrypts sync operations (Phase 4)

Recovery Phrase (12 words, BIP-39)
     │
     ▼ PBKDF2 (same params)
Recovery Key
     │
     └── encrypts a copy of MEK (stored on server, opaque)

Device Pairing (Phase 4 only):
     Device A keypair (X25519) ──┐
                                  ├── ECDH shared secret
     Device B keypair (X25519) ──┘
                                  │
                                  ▼
                        Wrap/unwrap MEK for new device
```

### Data at Rest

| Location | Phase 1 | Phase 2 | Phase 3-4 |
|----------|---------|---------|-----------|
| IndexedDB | Empty | Encrypted envelopes (AES-256-GCM) | Encrypted envelopes (AES-256-GCM) |
| Server DB | Anonymized transactions | Auth + device registry only | Auth + device registry |
| Server blob store | — | — | Encrypted blobs |
| sessionStorage | — | Wizard nav state only | Wizard nav state only |
| localStorage | Empty | `budget-preferences`, `budget-theme` only | `budget-preferences`, `budget-theme` only |
| Cookies | Refresh token (httpOnly) | Refresh token (httpOnly) | Refresh token (httpOnly) |

### Data in Transit

| Route | Phase 1 | Phase 2 | Phase 3-4 |
|-------|---------|---------|-----------|
| Browser → Server | TLS + anonymized data | TLS only (no data sent) | TLS + encrypted blobs |
| Server → Browser | TLS + anonymized data | TLS only (no data received) | TLS + encrypted blobs |

### Invariants (All Phases)

1. **Raw CSV data NEVER leaves browser** — unchanged from Phase 1
2. **Server CANNOT decrypt user financial data** — from Phase 3 onward
3. **No PII in logs, errors, or server-side storage** — unchanged
4. **Auth tokens in memory only** — unchanged (`shared/api/auth-tokens.ts`)
5. **Master key non-extractable** — cannot be read by JS, only used for crypto operations
6. **Recovery = user responsibility** — documented, no server-side backdoor

---

## Cost Comparison

### Monthly Infrastructure Cost (small user base: 1-100 users)

| Architecture | Hosting | DB/Storage | Total (PLN) |
|--------------|---------|------------|-------------|
| **Current SaaS** (Vercel + Supabase) | 80-120 | 90-130 | 170-250 |
| **Local-first + encrypted backup** (CF Workers + R2) | 0-30 | 0-20 | 0-50 |
| **Pure local PWA** (static hosting only) | 0-30 | 0 | 0-30 |

### Why Local-First Wins on Cost

- No server-side DB (PostgreSQL planned → cancelled)
- No server-side query compute
- Blob storage (R2) is nearly free at small scale
- Cloudflare Workers: 100K requests/day free tier
- Static frontend: any CDN (Cloudflare Pages = free)

### Break-even Analysis

Local-first becomes MORE expensive than SaaS only if:
- >50,000 active users (R2 storage exceeds $15/month)
- Real-time sync requires persistent WebSocket connections (Workers don't support this cheaply)
- At that scale: introduce paid tier, WebSocket via Durable Objects (~$5/month per 1000 users)

---

## Implementation Checklist

### Phase 2 Prerequisites
- [ ] All backend endpoints have equivalent local logic identified
- [x] Dexie.js added to `client/package.json` (pinned version)
- [x] `shared/adapters/persistence/` module created with encrypted port + Dexie adapter
- [ ] Feature flag: `VITE_DATA_SOURCE=local|remote` for gradual rollout
- [x] One-time migration script: legacy localStorage → encrypted IndexedDB
- [x] `navigator.storage.persist()` called by the persistence provider
- [x] Persistent-storage warning implemented
- [ ] All TanStack Query hooks have `queryFn` swappable via feature flag

### Phase 3 Prerequisites
- [ ] Phase 2 stable (1 week in production without data loss)
- [ ] `shared/lib/crypto/` module with PBKDF2 + AES-GCM
- [ ] Backup/restore flow with recovery phrase UX
- [ ] R2 bucket provisioned + worker deployed
- [ ] Backup age banner (>7 days = warning)

### Phase 4 Prerequisites
- [ ] Phase 3 stable (encrypted backup proven reliable)
- [ ] Device pairing UX designed (QR code scan flow)
- [ ] X25519 key exchange implemented
- [ ] Operation log schema finalized
- [ ] Conflict resolution tested with simulated multi-device scenarios
- [ ] `navigator.locks` leader election for sync
- [ ] BroadcastChannel cross-tab coordination

---

## Regulatory Impact (RODO/GDPR)

| Requirement | Phase 1 (current) | Phase 3-4 (target) |
|-------------|-------------------|---------------------|
| DPIA required? | Yes (financial data processing) | Simplified (no server access to data) |
| Data breach notification (72h) | Required (server holds data) | Minimal impact (ciphertext only) |
| Right to erasure | Server-side wipe needed | User deletes local DB (self-service) |
| Data portability | Export endpoint needed | User owns all data locally |
| Purpose limitation | Must document processing purposes | N/A (server doesn't process) |
| Storage limitation | Must define retention policy | User controls own data lifecycle |
| UODO registration | May be required | Not required (no data processing) |
| KNF involvement | None (manual CSV import only) | None (unchanged) |

**Key regulatory win:** Server that cannot read data is not a "data processor" under GDPR Article 28. No DPA (Data Processing Agreement) needed with hosting provider for user financial data.
