import type { Page } from '@playwright/test';

/**
 * Mocks an authenticated e2e session:
 * 1. Intercepts login/profile endpoints with the requested role
 * 2. Logs in through the real login form so the token stays module-scoped
 * 3. Unlocks the real encrypted local database before the test navigates
 */
export const setupAuthenticatedUser = async (
  page: Page,
  role: 'Superuser' | 'Member' = 'Superuser',
  options: { readonly unlock?: boolean } = {},
): Promise<void> => {
  // The broad matcher also covers full reloads, where the app requests auth/profile
  // before the route tree has mounted. Other API requests continue to the test server.
  await page.route('**/*', (route) => {
    const requestUrl = new URL(route.request().url());
    if (requestUrl.pathname.endsWith('/api/auth/refresh')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ accessToken: 'e2e-fake-token' }) });
    }
    if (requestUrl.pathname.endsWith('/api/auth/login')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
        accessToken: 'e2e-fake-token',
        user: { id: 'user-e2e', email: role === 'Superuser' ? 'admin@budget.local' : 'member@budget.local', role, workspaceId: 'workspace-e2e' },
      }) });
    }
    if (requestUrl.pathname !== '/api/users/me' && requestUrl.pathname !== '/api/users/me/vault') {
      return route.continue();
    }

    const pathname = requestUrl.pathname;

    if (pathname.endsWith('/vault')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'empty' }),
      });
    }

    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 'user-e2e',
        email: role === 'Superuser' ? 'admin@budget.local' : 'member@budget.local',
        displayName: 'E2E User',
        role,
        workspaceId: 'workspace-e2e',
        createdAt: '2026-01-01T00:00:00.000Z',
        preferences: { language: 'pl', currency: 'PLN', theme: 'dark' },
      }),
    });
  });

  await page.goto('/login');
  await page.getByLabel('Email').fill(role === 'Superuser' ? 'admin@budget.local' : 'member@budget.local');
  await page.getByLabel('Hasło').fill('e2e-test-password');
  await page.getByRole('button', { name: 'Zaloguj' }).click();
  await page.waitForURL('**/dashboard');

  if (options.unlock !== false) {
    await unlockVault(page);
  }
};

export const unlockVault = async (page: Page): Promise<void> => {
  await page.getByLabel('Hasło sejfu').fill('e2e-vault-passphrase');
  await page.getByRole('button', { name: 'Odblokuj dane' }).click();
  await page.getByLabel('Hasło sejfu').waitFor({ state: 'hidden' });
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
