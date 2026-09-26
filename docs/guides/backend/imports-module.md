# Backend Imports — Retirement Note

The backend imports module was retired in MVP release Session 05.

CSV parsing, PII detection, anonymization, deduplication and import history
are frontend-local responsibilities. The browser persists financial records
in encrypted IndexedDB and does not send financial rows or import metadata to
`/api/imports`.

## Backend contract

`/api/imports` is intentionally not registered. Requests to the former
`POST`, `GET` and `DELETE /api/imports` routes return `404`.

The server remains responsible for authentication, user settings, import
profile CRUD kept for compatibility, dictionaries, administrative controls,
and the opaque encrypted-vault/sync surface. It does not validate, persist,
list or delete imported financial rows.

## Persistence

Migration `0002_retire-backend-imports.sql` removes the obsolete
`import_batches` table and the `transactions.import_batch_id` relationship.
Committed migration history is preserved; older plans and decision records
that describe the former endpoint remain historical documentation.

## Related implementation

- Frontend-local import persistence: `client/src/features/csv-import/`
- Local import history: `client/src/shared/adapters/persistence/`
- Current backend financial APIs: `transactions`, `categories` and
  `import-profiles` remain outside this retirement session and are audited
  separately.
