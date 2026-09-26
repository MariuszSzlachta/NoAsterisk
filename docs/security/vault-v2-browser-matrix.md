# Vault Protocol v2 browser matrix

This matrix records capability gates, not marketing claims. A browser is eligible for automatic standard unlock only after the local profile has a valid LocalShare and the server has issued ServerShare following fresh interactive authentication.

| Capability | Required evidence | Standard mode | High-security |
|---|---|---:|---:|
| Web Crypto AES-GCM/HKDF | runtime feature probe + protocol tests | required | required |
| IndexedDB account scoping | raw database-name/storage test | required | required |
| WebAuthn | native ceremony + maintained server verifier | optional | required |
| PRF for the concrete credential | extension result for that credential, never `toJSON()` | preferred | required |
| Secure context | `window.isSecureContext` | required | required |
| Trusted-device QR camera | `BarcodeDetector` + camera permission + two-browser walkthrough | optional recovery fallback | optional recovery fallback |

PRF support is credential-specific. A platform or browser label alone is not sufficient. If PRF is unavailable in Standard mode, the split LocalShare + ServerShare path is used. High-security mode remains locked and reports a step-up/recovery action; it does not silently fall back.

The repository contains deterministic Web Crypto tests and a Playwright Chromium
baseline that asserts secure context, Web Crypto and IndexedDB availability. The
baseline records whether a browser exposes a WebAuthn PRF capability API, but it
does not treat that API or a browser label as proof that a particular credential
supports PRF. Manual/authenticator evidence for the complete native ceremony must
still be recorded before declaring 09B.6 and 09B.11 complete.

## Required browser and device evidence

The following is the release matrix. “Repository baseline” means that only the
capability contract is covered by automated tests; it is not evidence that every
listed browser or authenticator supports PRF. The owner must replace each pending
entry with a dated run identifier, browser version, operating system, authenticator
model/provider, credential type and the observed result before advertising that
combination as supported.

| Browser / device class | Split-local Web Crypto + IndexedDB | Native passkey authentication | Credential-specific PRF | Trusted-device camera flow | Release status |
|---|---|---|---|---|---|
| Chrome desktop (macOS) | repository baseline; manual capture pending | manual ceremony pending | manual credential result pending | manual camera walkthrough pending | not release-approved |
| Chrome desktop (Windows) | repository baseline; manual capture pending | manual ceremony pending | manual credential result pending | manual camera walkthrough pending | not release-approved |
| Edge desktop (Windows) | repository baseline; manual capture pending | manual ceremony pending | manual credential result pending | manual camera walkthrough pending | not release-approved |
| Safari desktop (macOS) | repository baseline; manual capture pending | manual ceremony pending | manual credential result pending | manual camera walkthrough pending | not release-approved |
| Safari mobile (iOS/iPadOS) | repository baseline; manual capture pending | manual ceremony pending | manual credential result pending | manual camera walkthrough pending | not release-approved |
| Firefox desktop (supported OS) | repository baseline; manual capture pending | manual ceremony pending | manual credential result pending | manual camera walkthrough pending | split fallback only until verified |
| Firefox mobile (supported OS) | repository baseline; manual capture pending | manual ceremony pending | manual credential result pending | manual camera walkthrough pending | split fallback only until verified |

No row may be promoted from pending based on user-agent detection, a browser
capability flag, or a server-side PRF declaration. The test must use the concrete
credential that will unlock the vault and must verify that the returned assertion
contains no PRF output in its network DTO. Until the row is evidenced, Standard
mode remains the compatible split-local path and High-security mode remains
PRF-only and fail-closed.

Trusted-device QR is an explicit enrollment path only when the camera flow can
decode both request and response payloads and the user can complete the approval
with keyboard/screen-reader accessible controls. Browsers without `BarcodeDetector`
must keep recovery available and must not silently create an empty vault.
