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
  options: {
    readonly unlock?: boolean;
    readonly vaultStatus?: 'empty' | 'enrollment-required';
  } = {},
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
    if (requestUrl.pathname.endsWith('/api/users/me/vault/bootstrap')) {
      const deviceId = requestUrl.searchParams.get('deviceId') ?? 'e2e-device';
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: options.vaultStatus ?? 'enrollment-required',
          deviceId,
          vaultId: 'vault-e2e',
          keyId: 'key-e2e',
          protocolVersion: 2,
          cryptoSuite: 'HKDF-SHA256/AES-256-GCM',
        }),
      });
    }
    if (requestUrl.pathname.endsWith('/api/users/me/vault/devices')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            deviceId: 'trusted-device-e2e',
            vaultId: 'vault-e2e',
            keyId: 'key-e2e',
            status: 'active',
            signingPublicKey: JSON.stringify({
              kty: 'EC',
              crv: 'P-256',
              x: 'e2e-public-x',
              y: 'e2e-public-y',
            }),
            createdAt: '2026-01-01T00:00:00.000Z',
            lastSeenAt: '2026-01-01T00:00:00.000Z',
          },
        ]),
      });
    }
    if (requestUrl.pathname.endsWith('/api/users/me/vault/enrollment/prepare')) {
      const body = JSON.parse(route.request().postData() ?? '{}') as { deviceId?: string };
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          challenge: 'e2e-enrollment-challenge',
          serverShare: btoa(String.fromCharCode(...new Uint8Array(32).fill(7))),
          expiresAt: new Date(Date.now() + 60_000).toISOString(),
          deviceId: body.deviceId,
        }),
      });
    }
    if (requestUrl.pathname.endsWith('/api/users/me/vault/enrollment/finalize')) {
      return route.fulfill({ status: 204, body: '' });
    }
    if (requestUrl.pathname.endsWith('/api/users/me/vault/enrollment/confirm')) {
      return route.fulfill({ status: 204, body: '' });
    }
    if (requestUrl.pathname.includes('/api/users/me/vault/sync/')) {
      if (route.request().method() === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ status: 'empty' }),
        });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ revision: 1, envelopeHash: 'e2e-envelope-hash' }),
      });
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
  await page.getByRole('button', { name: 'Zaloguj', exact: true }).click();
  await page.waitForURL('**/dashboard');

  if (options.unlock !== false) {
    // Vault gating is mounted by a financial route. The post-login dashboard
    // may remain outside that route tree, so enter the canonical vault route
    // before waiting for the v2 unlock screen.
    await page.goto('/budgets');
    await unlockVault(page);
  }
};

export const unlockVault = async (page: Page): Promise<void> => {
  const recoveryInput = page.getByLabel('Kod recovery');
  // Most suites call this helper from their own beforeEach after
  // setupAuthenticatedUser already unlocked the profile. Keep the helper
  // idempotent so those suites do not depend on the unlock screen still being
  // mounted after navigation.
  try {
    await recoveryInput.waitFor({ state: 'visible', timeout: 5_000 });
  } catch {
    return;
  }

  await recoveryInput.fill(
    `${'00'.repeat(32)}66687aad`,
  );
  await page.getByRole('button', { name: 'Odtwórz i zarejestruj urządzenie' }).click();
  await page.getByLabel('Kod recovery').waitFor({ state: 'hidden' });
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
