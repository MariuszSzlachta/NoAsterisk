import { expect, test } from '@playwright/test';

test.describe('Login Page — E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Mock auth endpoints to avoid needing a real server
    await page.route('**/api/auth/login', (route) => {
      const request = route.request();
      const body = request.postDataJSON() as { email: string; password: string };

      if (body.email === 'user@budget.pl' && body.password === 'Secure1!pass') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            accessToken: 'e2e-access-token',
            refreshToken: 'e2e-refresh-token',
            user: { id: 'u-1', email: 'user@budget.pl', role: 'Member', workspaceId: 'ws-1' },
          }),
        });
      }

      return route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ statusCode: 401, message: 'Unauthorized' }),
      });
    });

    // Mock any redirected pages to avoid 404
    await page.route('**/api/auth/refresh', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ accessToken: 'e2e-access-token' }),
      }),
    );

    await page.route('**/api/users/me', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'u-1',
          email: 'user@budget.pl',
          role: 'Member',
          preferences: { language: 'pl', currency: 'PLN', theme: 'dark' },
        }),
      }),
    );

    await page.goto('/login');
  });

  test('renders login form with all fields and submit button', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Zaloguj się' })).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Hasło')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Zaloguj' })).toBeVisible();
  });

  test('shows validation errors on empty submit', async ({ page }) => {
    await page.getByRole('button', { name: 'Zaloguj' }).click();

    await expect(page.getByText('Email jest wymagany')).toBeVisible();
    await expect(page.getByText('Hasło jest wymagane')).toBeVisible();
  });

  test('shows email format error for invalid email', async ({ page }) => {
    await page.getByLabel('Email').fill('not-an-email');
    await page.getByLabel('Hasło').fill('password123');
    await page.getByRole('button', { name: 'Zaloguj' }).click();

    await expect(page.getByText('Nieprawidłowy format email')).toBeVisible();
  });

  test('shows password min length error for short password', async ({ page }) => {
    await page.getByLabel('Email').fill('user@budget.pl');
    await page.getByLabel('Hasło').fill('short');
    await page.getByRole('button', { name: 'Zaloguj' }).click();

    await expect(page.getByText(/Hasło musi mieć minimum/)).toBeVisible();
  });

  test('clears validation error when user starts typing', async ({ page }) => {
    await page.getByRole('button', { name: 'Zaloguj' }).click();
    await expect(page.getByText('Email jest wymagany')).toBeVisible();

    await page.getByLabel('Email').fill('a');
    await expect(page.getByText('Email jest wymagany')).not.toBeVisible();
  });

  test('shows server error on invalid credentials', async ({ page }) => {
    await page.getByLabel('Email').fill('user@budget.pl');
    await page.getByLabel('Hasło').fill('wrongpassword');
    await page.getByRole('button', { name: 'Zaloguj' }).click();

    await expect(page.getByRole('alert')).toContainText('Nieprawidłowy email lub hasło');
  });

  test('successful login redirects to dashboard', async ({ page }) => {
    await page.getByLabel('Email').fill('user@budget.pl');
    await page.getByLabel('Hasło').fill('Secure1!pass');
    await page.getByRole('button', { name: 'Zaloguj' }).click();

    await page.waitForURL('**/dashboard');
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('shows loading state during submit', async ({ page }) => {
    // Delay the response to observe loading state
    await page.route('**/api/auth/login', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          accessToken: 'e2e-token',
          refreshToken: 'e2e-refresh',
          user: { id: 'u-1', email: 'user@budget.pl', role: 'Member', workspaceId: 'ws-1' },
        }),
      });
    });

    await page.getByLabel('Email').fill('user@budget.pl');
    await page.getByLabel('Hasło').fill('Secure1!pass');
    await page.getByRole('button', { name: 'Zaloguj' }).click();

    await expect(page.getByRole('button', { name: 'Logowanie...' })).toBeDisabled();
  });

  test('canonicalizes email — spaces and uppercase sent as trimmed lowercase', async ({ page }) => {
    const loginPromise = page.waitForRequest('**/api/auth/login');

    await page.getByLabel('Email').fill('  User@Budget.PL  ');
    await page.getByLabel('Hasło').fill('Secure1!pass');
    await page.getByRole('button', { name: 'Zaloguj' }).click();

    const request = await loginPromise;
    const body = request.postDataJSON() as { email: string };
    expect(body.email).toBe('user@budget.pl');
  });

  test('register link navigates to register page', async ({ page }) => {
    await page.getByRole('link', { name: 'Zarejestruj się' }).click();

    await expect(page).toHaveURL(/\/register/);
  });
});
