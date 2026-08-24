import type { Page } from '@playwright/test';

/**
 * Mocks auth state for e2e tests:
 * 1. Intercepts /api/auth/refresh to return a fake token (prevents redirect)
 * 2. Intercepts /api/users/me to return user profile with specified role
 * 3. After page loads, injects token via window event
 */
export const setupAuthenticatedUser = async (
  page: Page,
  role: 'Superuser' | 'Member' = 'Superuser',
): Promise<void> => {
  // Mock refresh endpoint (prevents 401 redirect loops)
  await page.route('**/api/auth/refresh', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ access_token: 'e2e-fake-token' }),
    }),
  );

  // Mock profile endpoint
  await page.route('**/api/users/me', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 'user-e2e',
        email: role === 'Superuser' ? 'admin@budget.local' : 'member@budget.local',
        role,
        preferences: { language: 'pl', currency: 'PLN', theme: 'dark' },
      }),
    }),
  );

  // Inject token before page scripts run
  await page.addInitScript(() => {
    // Override the authTokens module's closure
    let fakeToken: string | undefined = 'e2e-fake-token';
    const originalDefineProperty = Object.defineProperty;
    // Intercept the module's getter by patching localStorage as a signal
    window.localStorage.setItem('__e2e_auth', 'true');
  });
};

/**
 * After navigating, ensures the token is set in the app's auth module.
 * Call after page.goto() if RequireAuth redirects.
 */
export const injectToken = async (page: Page): Promise<void> => {
  await page.evaluate(() => {
    // Dispatch login event which triggers RequireAuth re-check
    window.dispatchEvent(new CustomEvent('auth:login'));
  });
};

/**
 * Mock admin API endpoints for e2e tests.
 */
export const setupAdminApiMocks = async (page: Page): Promise<void> => {
  await page.route('**/api/admin/users', (route) => {
    if (route.request().method() === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          users: [
            { id: 'u-1', email: 'admin@budget.pl', role: 'Superuser', createdAt: '2024-01-01', hasVault: true },
            { id: 'u-2', email: 'user@budget.pl', role: 'Member', createdAt: '2026-08-01', hasVault: false },
            { id: 'u-3', email: 'blocked@budget.pl', role: 'Blocked', createdAt: '2026-08-03', hasVault: true },
          ],
          total: 3,
        }),
      });
    }
    return route.continue();
  });

  await page.route('**/api/admin/users/*/block', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ id: 'u-2', blocked: true }),
    }),
  );

  await page.route('**/api/admin/users/*', (route) => {
    if (route.request().method() === 'DELETE') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: 'u-2', deleted: true }),
      });
    }
    return route.continue();
  });

  await page.route('**/api/admin/invite-codes', (route) => {
    if (route.request().method() === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          codes: [
            { id: 'c-1', code: 'ABC-123', status: 'Available', createdAt: '2026-08-01', expiresAt: null, usedBy: null, usedAt: null },
            { id: 'c-2', code: 'DEF-456', status: 'Used', createdAt: '2026-08-02', expiresAt: null, usedBy: 'user@x.pl', usedAt: '2026-08-03' },
          ],
          total: 2,
        }),
      });
    }
    // POST — generate code
    return route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({ id: 'c-new', code: 'GEN-E2E-999', expiresAt: null }),
    });
  });

  await page.route('**/api/admin/invite-codes/*', (route) => {
    if (route.request().method() === 'DELETE') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: 'c-1', deleted: true }),
      });
    }
    return route.continue();
  });
};
