# NoAsterisk data inventory (ALPHA / non-production)

This inventory reflects the local-first implementation as of 2026-09-09. It is an engineering record, not legal advice. The controller identity, contact, jurisdiction, production domain and providers remain explicit NON-PRODUCTION placeholders in the legal pages.

| Data | Location | Purpose | Notes |
|---|---|---|---|
| Email, password hash, role, workspace ID | Server `users` table | Authentication and access control | Password is stored as a bcrypt hash; email is account data. |
| Consent versions and server timestamp | Server `users` table | Auditable registration consent | Current ALPHA versions are `privacy-alpha-1` and `terms-alpha-1`. |
| Preferences | Server and encrypted browser store | Personalization | Browser persistence is encrypted after vault unlock. |
| Invite/admin data | Server tables | Controlled registration and administration | No financial rows are required for registration. |
| Financial data, rules, import history | Browser IndexedDB | Local budgeting | Stored as encrypted records; CSV parsing stays in the browser. |
| Encrypted sync blob, hash, byte size, revision | Server `vaults` table | Cross-device synchronization | The server exchanges opaque ciphertext and metadata; it cannot decrypt the vault. |
| Functional access/refresh tokens and cookies | Browser memory and HTTP-only cookie | Session management | No analytics or marketing SDK is present. |
| Operational logs | Runtime/hosting | Reliability and security | Do not log passwords, raw CSV data, account numbers or decrypted vault contents. |

Account deletion must distinguish server-side deletion from browser-local data. The settings screen therefore retains a deliberate, confirmation-gated “Clear local data” action and explains that account deletion alone cannot erase every browser profile.

## Publication gate

This is an ALPHA, non-production legal placeholder. It must not be published or treated as final legal text until the controller, contact, jurisdiction, audience/age restriction, providers and production domain are supplied and the copy is validated by qualified legal counsel.
