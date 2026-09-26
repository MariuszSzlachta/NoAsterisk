# Session 09A: Financial API Retirement and Data Lifecycle

## Objective

Close the production blocker around server-side financial data and implement a
tested, truthful account-deletion contract before final legal copy is approved.

**Prerequisites:** Sessions 06–08 have passed their implementation gates

## Scope

1. Remove or physically disable the remaining financial-domain API surface:
   `/api/transactions`, `/api/categories` and `/api/import-profiles`.
2. Remove or retire their production tables and migrations where they are no
   longer part of the MVP. If any endpoint or table remains, record an explicit
   product, privacy and legal decision explaining why.
3. Implement one account-deletion contract: `DELETE /api/users/me`, with the
   required password/confirmation semantics documented and tested.
4. Delete all user-owned server state, including the user, workspace, vault,
   permissions, invite-code references and any retained domain records.
5. Resolve foreign-key behavior explicitly, including `invite_codes.created_by`
   and `invite_codes.used_by`; the operation must not leave orphaned records.
6. Define deletion behavior for application logs, support tickets, provider
   records and backups. Backups must have a documented expiry and restore rule
   preventing a deleted account from silently becoming active again.
7. Clear refresh cookies and invalidate sessions as part of account deletion.
8. Separate and implement the UX/actions for logout, locking the local vault,
   wiping local device data and deleting the server account.
9. Warn before logout or wipe when unsynchronized local changes may be lost.
10. Namespace local stores and synchronization metadata by a stable opaque
    workspace/account identifier, and test switching accounts in one browser.
11. Add a documented local-vault auto-lock policy for inactivity, backgrounding
    and screen/device lifecycle; clear decrypted state and key references when
    locking. Require vault-passphrase confirmation/strength guidance and state
    clearly that there is no operator password recovery.

## Required tests and gates

- No financial-domain route is reachable in the deployed MVP API unless an
  explicit approved exception is recorded.
- PostgreSQL E2E deletion passes with real foreign keys and verifies no
  user/workspace/vault/domain rows remain.
- Deletion is safe to retry or resume and returns a truthful completion result.
- Refresh cookies are cleared and old access/refresh tokens are rejected.
- Logout, lock, local wipe and account deletion have distinct user-visible
  behavior and tests.
- Unsynchronized local data is not silently destroyed by ordinary logout.
- Two accounts used in the same browser cannot read each other's local data or
  synchronization metadata.
- Inactivity/background/device-lock behavior closes the unlocked vault according
  to the documented policy and requires a fresh unlock.
- No deletion test logs passwords, tokens, CSV content, plaintext financial data
  or ciphertext.

## Handoff

- Route inventory and negative API tests.
- Database dependency/deletion map and migration results.
- Account-deletion contract and PostgreSQL E2E evidence.
- Retention/backup/restore decision and runbook link.
- UX evidence for logout, lock, local wipe and account deletion.
- Exact build, test, lint and `git diff --check` results.

## Explicitly dispositioned follow-ups

Before release, record whether each item is fixed, accepted with mitigation or
deferred with an owner and target: self-describing/versioned vault format,
context-bound AAD, not returning ciphertext unnecessarily after upload, multi-
session/revocation controls, password reset or recovery messaging, administrator
audit logs, Argon2id evaluation, SBOM/CVE automation, URL-query minimization and
regular restore/incident exercises.
