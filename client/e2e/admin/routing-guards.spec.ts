import { test, expect } from '@playwright/test';

import { setupAuthenticatedUser } from '../helpers/auth';

test.describe('Routing Guards', () => {
  test('non-superuser is redirected from /admin to /dashboard', async ({ page }) => {
    await setupAuthenticatedUser(page, 'Member');
    await page.goto('/admin');

    // Should be redirected to dashboard
    await page.waitForURL('**/dashboard');
    expect(page.url()).toContain('/dashboard');
  });

  test('superuser can access /admin', async ({ page }) => {
    await setupAuthenticatedUser(page, 'Superuser');

    // Mock admin endpoints for the dashboard to load
    await page.route('**/api/admin/users', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ users: [], total: 0 }),
      }),
    );
    await page.route('**/api/admin/invite-codes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ codes: [], total: 0 }),
      }),
    );

    await page.goto('/admin');

    // Should stay on admin page
    await expect(page.url()).toContain('/admin');
  });

  test('non-superuser can access /admin/rules (no role guard on rules page)', async ({ page }) => {
    // Rules page is NOT behind RequireRole guard (it's a separate route)
    await setupAuthenticatedUser(page, 'Member');
    await page.goto('/admin/rules');

    // Should show rules page content
    await expect(page.getByText(/reguły kategoryzacji/i)).toBeVisible();
  });

  test('unauthenticated user is redirected to /login', async ({ page }) => {
    // Don't setup auth — no token, no mocks
    await page.route('**/api/auth/refresh', (route) =>
      route.fulfill({ status: 401, body: '{}' }),
    );

    await page.goto('/admin');

    // Should redirect to login
    await page.waitForURL('**/login');
    expect(page.url()).toContain('/login');
  });
});
