# Auth Feature — Developer Guide

## Domain Context

Users authenticate via email + password to access the application. Authentication is required for all routes except `/login` and `/register`. Tokens live in memory only (never localStorage) for security.

---

## Architecture

```
features/auth/
├── index.ts                    # Public API: LoginForm, RegisterForm
├── model/
│   ├── types.ts                # LoginFormValues, RegisterFormValues, AuthResponse, FieldErrors
│   └── validators.ts           # Pure validation functions (tested)
├── api/
│   ├── useLoginMutation/       # POST /auth/login with skipAuth
│   └── useRegisterMutation/    # POST /auth/register with skipAuth
└── ui/
    ├── LoginForm/              # Form component (zero logic, all from hook)
    ├── RegisterForm/           # Form component with confirmPassword
    └── hooks/
        ├── useLoginForm/       # Form lifecycle: values, validation, submit, navigate
        └── useRegisterForm/    # Same pattern + confirmPassword validation
```

---

## Data Flow

```
LoginForm → useLoginForm (hook)
  → validates via model/validators
  → calls useLoginMutation.mutateAsync
    → apiClient.post('/auth/login', { email, password }, { skipAuth: true })
    → on success: authTokens.setAccessToken(token)
      → dispatches 'auth:login' event
      → RequireAuth re-evaluates → Outlet renders
  → navigate('/dashboard')
```

---

## Security Boundaries

- Tokens stored in **module-scoped variable** only (`shared/api/auth-tokens.ts`)
- Login/register use `skipAuth: true` — no Authorization header sent
- `confirmPassword` is stripped before API call (never sent to backend)
- Error messages are generic ("Nieprawidłowy email lub hasło") — no information leakage
- Email regex requires 2+ char TLD (prevents `a@b.c`)
- `RequireAuth` guard uses `useSyncExternalStore` — instant redirect on token clear

---

## Routing

| Path | Component | Auth Required |
|------|-----------|:---:|
| `/login` | `LoginPage` | ❌ |
| `/register` | `RegisterPage` | ❌ |
| `/dashboard`, `/transactions`, etc. | Inside `RequireAuth` | ✅ |

`auth:session-expired` event (from token refresh failure) → redirects to `/login` via `RequireAuth`.

---

## Extension Points

### Adding OAuth/SSO
1. Add new mutation hook in `api/useOAuthMutation/`
2. Add button in `LoginForm` component
3. Same flow: on success → `authTokens.setAccessToken(token)` → navigate

### Adding "Forgot Password"
1. Create `features/auth/api/useResetPasswordMutation/`
2. Create `features/auth/ui/ForgotPasswordForm/`
3. Add route in `routes.tsx`

---

## Limitations

| Feature | Status |
|---------|--------|
| Password reset | ❌ Not implemented |
| OAuth/SSO | ❌ Not implemented |
| Remember me | ❌ N/A (tokens are session-only by design) |
| Email verification | ❌ Backend handles, no FE flow |

---

*Updated: 2026-08-20 | Source: `client/src/features/auth/`*
