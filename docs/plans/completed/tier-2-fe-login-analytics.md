# Tier 2 FE — Login Page + Analytics Real Data

## Context

Tier 1 (security fixes + dashboard real data) is complete. Next priorities from [sprint-next-priorities.md](./sprint-next-priorities.md):
- **2.1** Connect Analytics to real data from stores
- **2.2** Login page (real component)

Both are FE-only. Backend auth (`POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`) already works. Analytics needs same treatment as dashboard (replace mock hooks with store reads).

**Architecture:** FSD, Zustand stores, local-first. Auth tokens live in memory (`shared/api/auth-tokens.ts`). `RequireAuth` guard exists but currently returns `true` always.

---

## Bullet 1: Login page — model + types

**Scope:** `client/src/features/auth/model/`

### What to create

New feature: `features/auth/` (follows FSD structure).

```
features/auth/
  model/
    types.ts
    index.ts
  api/
    useLoginMutation/
      useLoginMutation.ts
      index.ts
    useRegisterMutation/
      useRegisterMutation.ts
      index.ts
  ui/
    LoginForm/
      LoginForm.tsx
      index.ts
    RegisterForm/
      RegisterForm.tsx
      index.ts
    hooks/
      useLoginForm/
        useLoginForm.ts
        index.ts
      useRegisterForm/
        useRegisterForm.ts
        index.ts
  index.ts
```

**1a. `features/auth/model/types.ts`**

```typescript
export interface LoginFormValues {
  readonly email: string;
  readonly password: string;
}

export interface RegisterFormValues {
  readonly email: string;
  readonly password: string;
  readonly confirmPassword: string;
}

export interface AuthResponse {
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly user: AuthUser;
}

export interface AuthUser {
  readonly id: string;
  readonly email: string;
  readonly role: 'Superuser' | 'Member';
  readonly workspaceId: string;
}

export interface FieldErrors {
  readonly email?: string;
  readonly password?: string;
  readonly confirmPassword?: string;
}
```

### Gate
- `tsc --noEmit` clean
- Types exist and are importable

---

## Bullet 2: Login page — API mutations

**Scope:** `client/src/features/auth/api/`

### What to create

**2a. `useLoginMutation.ts`**

```typescript
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '#shared/api';
import { authTokens } from '#shared/api/auth-tokens';
import type { AuthResponse, LoginFormValues } from '#features/auth/model/types';

export const useLoginMutation = () => {
  return useMutation({
    mutationFn: async (values: LoginFormValues): Promise<AuthResponse> => {
      const response = await apiClient.post<AuthResponse, LoginFormValues>(
        '/auth/login',
        values,
        { skipAuth: true },
      );
      return response;
    },
    onSuccess: (data) => {
      authTokens.setAccessToken(data.accessToken);
      // refreshToken stored for later use (or sent as cookie by backend)
    },
  });
};
```

**2b. `useRegisterMutation.ts`**

Same pattern, calls `POST /auth/register`. On success sets access token.

### Notes
- `skipAuth: true` because login/register are unauthenticated endpoints
- Backend returns `{ accessToken, refreshToken, user }` (verified from auth-result.dto.ts)
- `authTokens.setAccessToken()` dispatches `auth:login` event → `RequireAuth` re-evaluates

### Gate
- `tsc --noeEmit` clean
- Mutations call correct endpoints with correct DTOs

---

## Bullet 3: Login page — UI hooks

**Scope:** `client/src/features/auth/ui/hooks/`

### What to create

**3a. `useLoginForm.ts`**

```typescript
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLoginMutation } from '#features/auth/api/useLoginMutation';
import type { LoginFormValues, FieldErrors } from '#features/auth/model/types';

interface UseLoginFormResult {
  readonly values: LoginFormValues;
  readonly errors: FieldErrors;
  readonly serverError: string | undefined;
  readonly isSubmitting: boolean;
  readonly handleEmailChange: (value: string) => void;
  readonly handlePasswordChange: (value: string) => void;
  readonly handleSubmit: () => void;
}
```

Validates:
- Email non-empty + basic format
- Password non-empty + min 8 chars

On submit: calls `loginMutation.mutateAsync(values)`. On success: `navigate('/dashboard')`. On 401: sets serverError "Invalid email or password".

**3b. `useRegisterForm.ts`**

Same pattern. Validates confirmPassword === password. On success: navigates to dashboard.

### Gate
- `tsc --noEmit` clean
- Hooks handle full form lifecycle (values, validation, submit, error display, redirect)

---

## Bullet 4: Login page — UI components

**Scope:** `client/src/features/auth/ui/LoginForm/`, `RegisterForm/`

### What to create

**4a. `LoginForm.tsx`**

```tsx
export const LoginForm = (): React.JSX.Element => {
  const {
    values, errors, serverError, isSubmitting,
    handleEmailChange, handlePasswordChange, handleSubmit,
  } = useLoginForm();

  return (
    <div className="flex flex-col gap-4 w-full max-w-sm">
      <h1 className="text-2xl font-semibold text-foreground">Sign in</h1>
      {serverError && <p className="text-sm text-expense">{serverError}</p>}
      <Input label="Email" value={values.email} onChange={handleEmailChange} error={errors.email} />
      <Input label="Password" type="password" value={values.password} onChange={handlePasswordChange} error={errors.password} />
      <Button onClick={handleSubmit} disabled={isSubmitting}>
        {isSubmitting ? 'Logowanie...' : 'Zaloguj'}
      </Button>
      <p className="text-sm text-muted-foreground">
        Do not have an account? <Link to="/register">Register</Link>
      </p>
    </div>
  );
};
```

**4b. `RegisterForm.tsx`**

Same layout + confirmPassword field. Link to `/login`.

### Design
- Centered on page (no sidebar/topbar — outside AppShell)
- Uses design tokens: `bg-background`, `text-foreground`, `border-border`
- Uses shared/ui: `Input`, `Button`
- Minimal — no illustrations, no OAuth buttons (MVP)

### Gate
- `tsc --noEmit` clean
- Components render, use hooks, use design system

---

## Bullet 5: Login page — routing + RequireAuth activation

**Scope:** `client/src/app/routing/`, `client/src/pages/`

### Changes

**5a. Create `LoginPage.tsx` and `RegisterPage.tsx`**

File: `client/src/pages/LoginPage.tsx`

```tsx
import { LoginForm } from '#features/auth';

export const LoginPage = (): React.JSX.Element => (
  <div className="flex min-h-screen items-center justify-center bg-background">
    <LoginForm />
  </div>
);
```

Same for `RegisterPage.tsx`.

**5b. Update `routes.tsx`**

```tsx
{
  path: '/login',
  element: <LoginPage />,
},
{
  path: '/register',
  element: <RegisterPage />,
},
```

**5c. Activate `RequireAuth`**

File: `client/src/app/routing/RequireAuth.tsx`

Change from:
```typescript
const getIsAuthenticated = (): boolean => true;
```
To:
```typescript
const getIsAuthenticated = (): boolean => authTokens.getAccessToken() !== undefined;
```

Import `authTokens` from `#shared/api/auth-tokens`.

**5d. `features/auth/index.ts`** — public API

```typescript
export { LoginForm } from './ui/LoginForm';
export { RegisterForm } from './ui/RegisterForm';
```

### Gate
- `tsc --noEmit` clean
- User without token → redirected to /login
- After login → token set → redirected to /dashboard
- After register → same flow

---

## Bullet 6: Analytics — useAnalyticsQuery from real data

**Scope:** `client/src/features/analytics/api/useAnalyticsQuery/`

### Problem
Returns hardcoded `MOCK_SERIES` and `MOCK_KPIS` for 4 metrics.

### Changes

Replace with computed data from `useTransactionsStore`. Must respect `filters.period` and `filters.granularity`.

**Period → date range mapping:**
- `1m` → last 30 days
- `3m` → last 90 days
- `6m` → last 180 days
- `1y` → last 365 days
- `ytd` → Jan 1 of current year to now

**Granularity → bucket size:**
- `daily` → 1 day per data point
- `weekly` → 7 days per data point
- `monthly` → 1 month per data point

**Metric computation per bucket:**
- `income` → sum of positive amounts in bucket
- `expenses` → abs(sum of negative amounts) in bucket
- `balance` → running cumulative sum up to each bucket end
- `savings` → income - expenses per bucket

**KPI computation:**
- Current period total for each metric
- Delta = compare current vs previous period of same length
- Trend = up/down/neutral based on delta sign

```typescript
import { useTransactionsStore } from '#features/transactions';
import { formatAmount } from '#shared/lib';
import type { AnalyticsFilters, AnalyticsKpi, AnalyticsSeries } from '#features/analytics/model/types';
import type { QueryState } from '#shared/api';

interface AnalyticsData {
  readonly series: AnalyticsSeries[];
  readonly kpis: AnalyticsKpi[];
}

export const useAnalyticsQuery = (filters: AnalyticsFilters): QueryState<AnalyticsData> => {
  const transactions = useTransactionsStore((s) => s.transactions);
  // ... compute series + kpis from real data based on filters
  return { status: 'loaded', data: { series, kpis } };
};
```

### Helper functions to extract (keep in hook file or create `features/analytics/model/computeAnalytics.ts`):
- `getDateRange(period: Period): { from: Date; to: Date }`
- `getBuckets(from: Date, to: Date, granularity: Granularity): Array<{ label: string; start: string; end: string }>`
- `computeMetricForBucket(transactions, bucket, metric: MetricType): number`
- `computeKpi(transactions, currentRange, previousRange, metric: MetricType): AnalyticsKpi`

Recommendation: extract to `features/analytics/model/compute-analytics.ts` (pure function, testable).

### Gate
- `tsc --noEmit` clean
- Chart shows real aggregated data from imported transactions
- Changing period/granularity re-computes correctly
- Empty state: flat zero line when no data in period

---

## Bullet 7: Analytics — useCategoryBreakdownQuery from real data

**Scope:** `client/src/features/analytics/api/useCategoryBreakdownQuery/`

### Problem
Returns hardcoded expense/income category breakdowns.

### Changes

Aggregate from `useTransactionsStore`:
- Filter transactions by period (from filters)
- Group by `categoryId`
- For `expenses`: only negative amounts, abs values
- For `income`: only positive amounts
- Compute percentage per category
- Sort by amount descending

```typescript
export const useCategoryBreakdownQuery = (
  filters: CategoryBreakdownFilters,
): QueryState<CategoryBreakdownItem[]> => {
  const transactions = useTransactionsStore((s) => s.transactions);
  // Group by categoryId, sum amounts, compute percentages
  return { status: 'loaded', data };
};
```

Category label resolution: use `categoryId` → label mapping. If no category system is available, use `categoryId` as label or "Bez kategorii" for undefined.

### Gate
- `tsc --noEmit` clean
- Breakdown shows real category proportions
- Empty: "No data" or an empty chart

---

## Bullet 8: Analytics — useCategoryDrilldownQuery from real data

**Scope:** `client/src/features/analytics/api/useCategoryDrilldownQuery/`

### Problem
Returns hardcoded per-category trends + transaction lists.

### Changes

Given a `category` name and `filters`:
1. **Trend**: aggregate monthly amounts for that category over last 6 months (or period from filters)
2. **Transactions**: list all transactions matching that category, sorted by date desc, limited to 10

```typescript
export const useCategoryDrilldownQuery = (
  category: string,
  filters: CategoryBreakdownFilters,
): QueryState<CategoryDrilldownData> => {
  const transactions = useTransactionsStore((s) => s.transactions);
  // Filter by category, build trend series + transaction list
  return { status: 'loaded', data: { trend, transactions } };
};
```

Note: current implementation matches category by label string (from breakdown items). If categories are identified by ID, we need to match by `categoryId`. Check what `AnalyticsCategoryBreakdown` passes as `category` param.

### Gate
- `tsc --noEmit` clean
- Drilldown shows real per-category monthly trend
- Transaction list shows real transactions for that category

---

## Bullet 9: Analytics — compute helpers (model layer)

**Scope:** `client/src/features/analytics/model/`

### What to create

**`features/analytics/model/compute-analytics/compute-analytics.ts`**

Pure functions extracted from bullet 6-8 logic:

```typescript
export const getDateRange = (period: Period, now?: Date): { from: Date; to: Date } => { ... };

export const getBuckets = (
  from: Date,
  to: Date,
  granularity: Granularity,
): ReadonlyArray<{ label: string; start: string; end: string }> => { ... };

export const aggregateByMetric = (
  transactions: ReadonlyArray<StoredTransaction>,
  buckets: ReadonlyArray<{ start: string; end: string }>,
  metric: MetricType,
): number[] => { ... };

export const computeDelta = (current: number, previous: number): { delta: string; trend: 'up' | 'down' | 'neutral' } => { ... };

export const aggregateByCategory = (
  transactions: ReadonlyArray<StoredTransaction>,
  direction: 'income' | 'expense',
): ReadonlyArray<{ categoryId: string | undefined; amount: number }> => { ... };
```

**`features/analytics/model/compute-analytics/compute-analytics.spec.ts`**

Tests for each pure function:
- `getDateRange('1m')` → last 30 days
- `getBuckets(from, to, 'monthly')` → correct month labels
- `aggregateByMetric` with test transactions → correct sums
- `computeDelta(100, 80)` → `{ delta: '+25,0%', trend: 'up' }`
- `aggregateByCategory` → correct grouping

### Gate
- `tsc --noEmit` clean
- All spec tests pass
- Pure functions, zero React dependencies

---

## Bullet 10: Analytics — empty states + integration test

**Scope:** `client/src/features/analytics/`

### Changes

**10a. Empty state handling in hooks:**

When transactions array is empty:
- `useAnalyticsQuery` → return empty series (each metric = `[]` data points) + KPIs with "0,00 zł" values
- `useCategoryBreakdownQuery` → return empty array
- `useCategoryDrilldownQuery` → return empty trend + empty transactions

**10b. Verify AnalyticsPage handles empty gracefully:**
- Chart with empty series: should show "No data" or empty axes (verify Nivo behavior)
- Category breakdown empty: no items rendered (or a "No expenses" message)

**10c. Verify feature exports:**

`features/analytics/index.ts` — ensure `useAnalyticsQuery` and breakdown hooks are exported if used by page directly (currently page imports from `#features/analytics`).

### Gate
- `tsc --noEmit` clean
- Analytics page with 0 transactions: no crashes
- Analytics page with imported data: real charts render
- All client tests pass

---

## Dependency Order

```
[1] Auth model + types
[2] Auth API mutations
[3] Auth UI hooks
[4] Auth UI components (LoginForm, RegisterForm)
[5] Routing + RequireAuth activation
    ↓ (auth complete, independent from analytics)
[6] Analytics query from real data
[7] Analytics category breakdown from real data
[8] Analytics category drilldown from real data
[9] Analytics compute helpers (model layer) — can be done before 6-8 as foundation
[10] Analytics empty states + integration
```

**Recommended execution:**
```
[9] → [6] → [7] → [8] → [10]    (analytics track — model first, then hooks)
[1] → [2] → [3] → [4] → [5]     (auth track — bottom-up)
```

Both tracks are **independent** and can run in parallel. Auth doesn't depend on analytics and vice versa.

---

## Acceptance Criteria

- [x] `/login` page renders with email + password form
- [x] `/register` page renders with email + password + confirm form
- [x] Successful login → token stored → redirect to /dashboard
- [x] Successful register → token stored → redirect to /dashboard
- [x] Wrong credentials → error message displayed (no crash)
- [x] User without token visiting /dashboard → redirected to /login
- [x] `auth:session-expired` event → redirected to /login
- [x] Analytics chart shows real aggregated data from imported transactions
- [x] Analytics respects period filter (1m/3m/6m/1y/ytd)
- [x] Analytics respects granularity (daily/weekly/monthly)
- [x] Analytics KPIs show real values with delta vs previous period
- [x] Category breakdown shows real proportions from transaction data
- [x] Category drilldown shows real monthly trend + transaction list
- [x] Analytics with 0 transactions → meaningful empty state (no crashes)
- [x] `tsc --noEmit` clean
- [x] All client tests pass

---

## NEVER

1. NEVER store tokens in localStorage — tokens live in memory only (`authTokens` module variable)
2. NEVER send credentials without `skipAuth: true` — login/register are unauthenticated
3. NEVER leave mock data in production hooks — each rewritten hook must read from store
4. NEVER put computation logic in component body — extract to model/ pure functions or hooks
5. NEVER crash on empty data — every hook must handle 0 transactions gracefully
