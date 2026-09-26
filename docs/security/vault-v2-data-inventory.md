# Vault Protocol v2 data-inventory diff

## Browser

| Location | v1 status | v2 rule |
|---|---|---|
| account-scoped IndexedDB | legacy financial records may exist | only encrypted records/envelopes and non-secret metadata; no ServerShare, PRF output or plaintext financial payload |
| Web Storage | legacy migration markers/preferences | no VMK, shares or derived keys |
| React/query/telemetry | application state | no cryptographic material or PRF output |

## Backend

| Table/data | v2 rule |
|---|---|
| vault_keysets | protocol identifiers only |
| vault_devices | account/vault/device status and revocation metadata |
| vault_server_shares | infrastructure-encrypted ciphertext, nonce, tag and key version only |
| vault_device_envelopes | opaque VMK envelopes only |
| webauthn_credentials | public key, counter, credential metadata; never PRF output |
| vaults | opaque sync ciphertext and CAS metadata only |

The migration is additive and does not execute a production reset. Raw-storage and production-like rehearsal evidence is a release gate.
