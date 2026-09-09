import { expect, test } from '@playwright/test';

test.describe('Register Page — E2E', () => {
  const acceptRequiredConsents = async (page: import('@playwright/test').Page): Promise<void> => {
    await page.getByLabel('Akceptuję Politykę prywatności').check();
    await page.getByLabel('Akceptuję Regulamin').check();
  };

  test.beforeEach(async ({ page }) => {
    await page.route('**/api/auth/register', (route) => {
      const request = route.request();
      const body = request.postDataJSON() as { email: string; password: string; inviteCode?: string };

      if (body.email === 'existing@user.com') {
        return route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({ statusCode: 400, message: 'Registration failed' }),
        });
      }

      if (body.inviteCode === 'BADCODE') {
        return route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({ statusCode: 400, message: 'Invalid invite code' }),
        });
      }

      return route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          accessToken: 'e2e-new-token',
          user: { id: 'u-new', email: body.email, role: 'Member', workspaceId: 'ws-new' },
        }),
      });
    });

    await page.route('**/api/auth/refresh', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ accessToken: 'e2e-new-token' }),
      }),
    );

    await page.route('**/api/users/me', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'u-new',
          email: 'new@user.com',
          role: 'Member',
          preferences: { language: 'pl', currency: 'PLN', theme: 'dark' },
        }),
      }),
    );

    await page.goto('/register');
  });

  test('renders register form with all fields', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Utwórz konto' })).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Hasło', { exact: true })).toBeVisible();
    await expect(page.getByLabel('Potwierdź hasło')).toBeVisible();
    await expect(page.getByLabel('Kod zaproszenia')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Zarejestruj się' })).toBeVisible();
  });

  test('shows validation errors on empty submit', async ({ page }) => {
    await page.getByRole('button', { name: 'Zarejestruj się' }).click();

    await expect(page.getByText('Email jest wymagany')).toBeVisible();
    await expect(page.getByText('Hasło jest wymagane')).toBeVisible();
    await expect(page.getByText('Potwierdzenie hasła jest wymagane')).toBeVisible();
  });

  test('shows password strength errors for weak password', async ({ page }) => {
    await page.getByLabel('Email').fill('new@user.com');
    await page.getByLabel('Hasło', { exact: true }).fill('lowercase1!');
    await page.getByLabel('Potwierdź hasło').fill('lowercase1!');
    await page.getByRole('button', { name: 'Zarejestruj się' }).click();

    await expect(page.getByText('Hasło musi zawierać wielką literę')).toBeVisible();
  });

  test('shows password mismatch error', async ({ page }) => {
    await page.getByLabel('Email').fill('new@user.com');
    await page.getByLabel('Hasło', { exact: true }).fill('P@ssw0rd!x');
    await page.getByLabel('Potwierdź hasło').fill('different');
    await page.getByRole('button', { name: 'Zarejestruj się' }).click();

    await expect(page.getByText('Hasła nie są identyczne')).toBeVisible();
  });

  test('shows email conflict error from server', async ({ page }) => {
    await page.getByLabel('Email').fill('existing@user.com');
    await page.getByLabel('Hasło', { exact: true }).fill('P@ssw0rd!x');
    await page.getByLabel('Potwierdź hasło').fill('P@ssw0rd!x');
    await acceptRequiredConsents(page);
    await page.getByRole('button', { name: 'Zarejestruj się' }).click();

    await expect(page.getByText('Konto z tym adresem email już istnieje')).toBeVisible();
  });

  test('shows invalid invite code error from server', async ({ page }) => {
    await page.getByLabel('Email').fill('new@user.com');
    await page.getByLabel('Hasło', { exact: true }).fill('P@ssw0rd!x');
    await page.getByLabel('Potwierdź hasło').fill('P@ssw0rd!x');
    await page.getByLabel('Kod zaproszenia').fill('BADCODE');
    await acceptRequiredConsents(page);
    await page.getByRole('button', { name: 'Zarejestruj się' }).click();

    await expect(page.getByText('Nieprawidłowy lub wygasły kod zaproszenia')).toBeVisible();
  });

  test('successful registration redirects to dashboard', async ({ page }) => {
    await page.getByLabel('Email').fill('new@user.com');
    await page.getByLabel('Hasło', { exact: true }).fill('P@ssw0rd!x');
    await page.getByLabel('Potwierdź hasło').fill('P@ssw0rd!x');
    await acceptRequiredConsents(page);
    await page.getByRole('button', { name: 'Zarejestruj się' }).click();

    await page.waitForURL('**/dashboard');
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('sends invite code to API when provided', async ({ page }) => {
    const registerPromise = page.waitForRequest('**/api/auth/register');

    await page.getByLabel('Email').fill('new@user.com');
    await page.getByLabel('Hasło', { exact: true }).fill('P@ssw0rd!x');
    await page.getByLabel('Potwierdź hasło').fill('P@ssw0rd!x');
    await page.getByLabel('Kod zaproszenia').fill('ABC123');
    await acceptRequiredConsents(page);
    await page.getByRole('button', { name: 'Zarejestruj się' }).click();

    const request = await registerPromise;
    const body = request.postDataJSON() as { inviteCode?: string };
    expect(body.inviteCode).toBe('ABC123');
  });

  test('does not send invite code when field is empty', async ({ page }) => {
    const registerPromise = page.waitForRequest('**/api/auth/register');

    await page.getByLabel('Email').fill('new@user.com');
    await page.getByLabel('Hasło', { exact: true }).fill('P@ssw0rd!x');
    await page.getByLabel('Potwierdź hasło').fill('P@ssw0rd!x');
    await acceptRequiredConsents(page);
    await page.getByRole('button', { name: 'Zarejestruj się' }).click();

    const request = await registerPromise;
    const body = request.postDataJSON() as Record<string, unknown>;
    expect(body).not.toHaveProperty('inviteCode');
  });

  test('canonicalizes email — spaces and uppercase sent as trimmed lowercase', async ({ page }) => {
    const registerPromise = page.waitForRequest('**/api/auth/register');

    await page.getByLabel('Email').fill('  NEW@User.COM  ');
    await page.getByLabel('Hasło', { exact: true }).fill('P@ssw0rd!x');
    await page.getByLabel('Potwierdź hasło').fill('P@ssw0rd!x');
    await acceptRequiredConsents(page);
    await page.getByRole('button', { name: 'Zarejestruj się' }).click();

    const request = await registerPromise;
    const body = request.postDataJSON() as { email: string };
    expect(body.email).toBe('new@user.com');
  });

  test('shows loading state during submit', async ({ page }) => {
    await page.route('**/api/auth/register', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          accessToken: 'tok',
          user: { id: 'u-1', email: 'new@user.com', role: 'Member', workspaceId: 'ws-1' },
        }),
      });
    });

    await page.getByLabel('Email').fill('new@user.com');
    await page.getByLabel('Hasło', { exact: true }).fill('P@ssw0rd!x');
    await page.getByLabel('Potwierdź hasło').fill('P@ssw0rd!x');
    await acceptRequiredConsents(page);
    await page.getByRole('button', { name: 'Zarejestruj się' }).click();

    await expect(page.getByRole('button', { name: 'Tworzenie konta...' })).toBeDisabled();
  });

  test('login link navigates to login page', async ({ page }) => {
    await page.getByRole('link', { name: 'Zaloguj się' }).click();

    await expect(page).toHaveURL(/\/login/);
  });

  test('clears validation error when user starts typing', async ({ page }) => {
    await page.getByRole('button', { name: 'Zarejestruj się' }).click();
    await expect(page.getByText('Email jest wymagany')).toBeVisible();

    await page.getByLabel('Email').fill('a');
    await expect(page.getByText('Email jest wymagany')).not.toBeVisible();
  });
});
