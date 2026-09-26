# Vault v2 MVP — Plan Order

Status: **READY_FOR_REVIEW — local scope completed**, this is not an MVP sign-off.

Plans 01–06 retain their current implementation status. Items requiring isolated
PostgreSQL, real browser/security evidence, operator authorization or independent
verification remain clearly BLOCKED/OPEN and are not marked as approved or done.

1. [Dual-root rotation](./01-dual-root-rotation.md)
2. [Backend authority graph](./02-backend-authority-graph.md)
3. [Checkpoint/rollback policy](./03-checkpoint-rollback-policy.md)
4. [Full all-file quality closure](./04-full-quality-closure.md)
5. [Real browser/security evidence](./05-browser-and-security-evidence.md)
6. [Cutover/release](./06-cutover-and-release.md)

Proceed sequentially. Plans 01 and 02 require a shared decision on ports and lock
ordering; plan 04 covers the entire feature rather than only the latest diff.
Follow [CONTRIBUTING.md](../../../../CONTRIBUTING.md) and the security documents
linked from each plan. Resetting real data, migrating an environment and deploying
require separate operator approval.
