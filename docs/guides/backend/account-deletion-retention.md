# Account deletion and retention policy

This is the MVP operational decision for `DELETE /api/users/me`.

## Application data

The deletion transaction removes the authenticated user, their workspace when
they are its sole member, workspace vault, permissions and invite-code
references. `invite_codes.created_by` is deleted with the creator;
`invite_codes.used_by` is cleared when the referenced user is deleted. The
opaque vault is removed before the workspace is removed. A retry after a
successful deletion must not recreate the account or restore the vault.

The retired financial tables are removed by the forward migration
`0006_retire_financial_tables.sql`. The migration must be applied as a reviewed
environment operation before the MVP database is used in production.

## Logs and support data

The application does not persist support tickets or provider records. Runtime
logs must remain operational-only: no passwords, access or refresh tokens,
CSV contents, decrypted vault data or ciphertext payloads. Log retention and
access control are infrastructure responsibilities and must be configured in
the production runbook before release.

## Backups and restore

The server vault is an opaque encrypted application record and is deleted with
the account. Infrastructure backups are not treated as an active application
store. Production backups must have a documented expiry and restore procedure;
restores must be followed by the account-deletion event list or equivalent
deletion verification before the restored service is exposed. A restored
deleted account must never become active merely because it existed in an older
backup.

This policy does not claim that a database backup is immediately rewritten by
an account deletion. Backup expiry, restore rehearsal and evidence retention
remain deployment/release prerequisites.
