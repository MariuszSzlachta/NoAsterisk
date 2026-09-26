# Client multi-device synchronization

The client synchronizes one complete encrypted vault snapshot at a time through
`GET /users/me/vault` and `PUT /users/me/vault`.

The client sends `encryptedBlob` and the last observed `baseRevision`. The server returns
an opaque snapshot with its revision and timestamps. The client does not send a password,
derived key, plaintext digest, CSV data or entity-level changes.

Local writes mark synchronization metadata dirty only after the encrypted repository
operation succeeds. A pull first decrypts and validates every section, then replaces all
included encrypted collections in one IndexedDB transaction and updates the in-memory
stores. Wrong passwords, tampered ciphertext and invalid schemas therefore leave local
state unchanged.

When a `409 Conflict` is returned, the local snapshot remains intact and the UI exposes
the conflict. Pulling remote data requires confirmation. Keeping local data and retrying
requires a fresh remote read plus a second explicit confirmation because it replaces the
other device's snapshot.
