# Import Profiles Module — Developer Guide

> ⚠️ **WIP:** Frontend UI for profile creation/management not yet built. Backend CRUD is complete. Frontend currently uses `autoDetectMapping()` without server profiles.

## Domain Context

Users who repeatedly import from the same bank want to save their column mapping + parser settings. An import profile stores: "mBank uses semicolons, Windows-1250 encoding, columns Data/Opis/Kwota map to date/title/amount." Next import from mBank auto-detects the profile by matching CSV headers and pre-fills everything.

---

## Architecture & Layers

```
src/import-profiles/
├── domain/
│   ├── import-profile.entity.ts         # Rich model: invariants, matchesHeaders(), immutable update
│   ├── anonymization-strategy.enum.ts   # Hash | Mask | Remove
│   └── value-objects/
│       ├── column-mapping.ts            # sourceColumn + targetField + isRequired
│       ├── parser-config.ts             # delimiter, hasHeader, dateFormat, encoding
│       └── anonymization-config.ts      # fieldsToAnonymize + strategy (Set-based equals)
│
├── application/
│   ├── commands/
│   │   ├── create-import-profile.handler.ts  # Name uniqueness per workspace
│   │   ├── update-import-profile.handler.ts  # Immutable update, name uniqueness on change
│   │   └── delete-import-profile.handler.ts
│   ├── queries/
│   │   ├── get-import-profiles.handler.ts
│   │   ├── get-import-profile-by-id.handler.ts
│   │   └── detect-import-profile.handler.ts  # First-match by headers
│   ├── ports/
│   │   └── import-profile.repository.ts
│   ├── dto/ + mappers/
│
├── infrastructure/
│   └── in-memory-import-profile.repository.ts
│
└── presentation/
    ├── import-profiles.controller.ts    # CRUD + POST /detect
    └── import-profile.dto.ts            # Zod (.strict(), enum literals)
```

---

## Public API

### Exported
- `IMPORT_PROFILE_REPOSITORY` — consumed by import-profile handlers and exposed for future local-first integrations

### HTTP Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST /import-profiles` | Create profile |
| `GET /import-profiles` | List all profiles for workspace |
| `GET /import-profiles/:id` | Get by ID |
| `PUT /import-profiles/:id` | Update profile |
| `DELETE /import-profiles/:id` | Delete profile |
| `POST /import-profiles/detect` | Auto-detect profile from headers |

### Detection: `POST /import-profiles/detect`
```json
{ "headers": ["Data operacji", "Opis operacji", "Kwota", "Waluta"] }
```
Returns the first profile whose required `columnMappings` all match the provided headers. 404 if no match.

---

## Extension Points

### Adding a new anonymization strategy
1. Add to `domain/anonymization-strategy.enum.ts`
2. Add DTO mapping in `application/mappers/strategy.mapper.ts`
3. Frontend handles the new strategy in anonymization pipeline config

### Integrating with frontend auto-detect
Planned flow: frontend sends `POST /import-profiles/detect` with parsed headers → gets profile → pre-fills column mapping + parser config. Not yet wired in UI.

---

## Boundaries & Non-Goals

**Does:** CRUD profiles, name uniqueness enforcement, header-based auto-detection, immutable entity updates
**Does NOT:**
- Apply profiles during parsing (frontend-only operation)
- Store raw file data
- Execute anonymization (profiles configure it, frontend applies it)
- Auto-create profiles from imports (planned: "Save as profile" UI button)

---

## Limitations (WIP)

| Feature | Status |
|---------|--------|
| Frontend profile management UI | ❌ Not built |
| Auto-detect integration in import wizard | ❌ Not wired |
| Bank profile presets (system profiles) | ❌ Planned (4.3.E.16) |
| Profile sharing across workspaces | ❌ Not planned |

---

*Generated: 2026-07-02 | Source: `server/src/import-profiles/`*
