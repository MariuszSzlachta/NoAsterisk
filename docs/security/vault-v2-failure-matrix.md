# Vault Protocol v2 failure matrix

| Failure | Required result |
|---|---|
| invalid AAD, nonce, version or suite | reject before parse/mutation |
| wrong LocalShare, ServerShare or PRF | locked; no fallback in high-security |
| password login on unknown device | no empty vault and no overwrite; recovery/enrollment required |
| refresh/background bootstrap requests ServerShare | reject with `step-up-required` |
| replay/rollback/CAS conflict | reject or surface explicit conflict; never overwrite silently |
| device revocation | reject unlock/sync and clear in-memory keys |
| lock during hydration/write | abort generation; no post-lock durable write |
| lost envelope and recovery | irreversible data loss; user-facing recovery warning |
| cutover failure | remain locked; exact-scope retry remains possible |
