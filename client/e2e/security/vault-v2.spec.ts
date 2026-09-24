import { expect, test } from '@playwright/test';

import { setupAuthenticatedUser, unlockVault } from '../helpers/auth';
import { recoveryVaultFixture } from '../helpers/recovery-vault-fixture';

const readV2Storage = async (
  page: Parameters<typeof setupAuthenticatedUser>[0],
) =>
  page.evaluate(async () => {
    const databases = await indexedDB.databases();
    const name = databases.find((database) =>
      database.name?.startsWith('budgetflow-vault-v2:user-e2e:workspace-e2e:'),
    )?.name;
    if (name === undefined) return { metadata: undefined, records: [] };
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(name);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const records = await new Promise<ReadonlyArray<Record<string, unknown>>>(
      (resolve, reject) => {
        const request = database
          .transaction('records', 'readonly')
          .objectStore('records')
          .getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      },
    );
    const metadata = await new Promise<Record<string, unknown> | undefined>(
      (resolve, reject) => {
        const request = database
          .transaction('metadata', 'readonly')
          .objectStore('metadata')
          .get('vault');
        request.onsuccess = () =>
          resolve(request.result as Record<string, unknown> | undefined);
        request.onerror = () => reject(request.error);
      },
    );
    database.close();
    return { metadata, records };
  });

const createSavingsBudget = async (
  page: Parameters<typeof setupAuthenticatedUser>[0],
  name: string,
  goal: string,
): Promise<void> => {
  await page
    .getByRole('button', { name: 'Utwórz budżet', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Oszczędnościowy', exact: true })
    .click();
  await page.getByLabel('Nazwa budżetu').fill(name);
  await page.getByLabel(/Cel oszczędności/).fill(goal);
  await page.getByRole('button', { name: 'Utwórz', exact: true }).click();
};

test.describe('Vault Protocol v2', () => {
  test('ordinary account login on a new browser cannot create or replace a vault', async ({
    page,
  }) => {
    await setupAuthenticatedUser(page, 'Superuser', { unlock: false });
    await page.goto('/budgets');

    await expect(
      page.getByRole('button', { name: 'Odblokuj to urządzenie' }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Utwórz budżet', exact: true }),
    ).not.toBeVisible();
  });

  test('first trusted browser creates recovery before enrollment', async ({
    page,
  }) => {
    await setupAuthenticatedUser(page, 'Superuser', {
      unlock: false,
      vaultStatus: 'empty',
    });
    await page.goto('/budgets');
    await page.getByRole('button', { name: 'Odblokuj to urządzenie' }).click();
    await page.getByRole('button', { name: 'Wygeneruj kod recovery' }).click();
    await expect(page.locator('code')).toHaveText(/^BF2:[0-9a-f]{136}$/i);
    await expect(
      page.getByRole('img', { name: 'Kod QR kodu recovery' }),
    ).toBeVisible();
  });

  test('new browser can start trusted-device QR enrollment and opens the scanner', async ({
    page,
  }) => {
    await setupAuthenticatedUser(page, 'Superuser', { unlock: false });
    await page.goto('/budgets');
    await page.getByRole('button', { name: 'Odblokuj to urządzenie' }).click();
    await page
      .getByRole('button', { name: 'Użyj zaufanego urządzenia' })
      .click();
    await expect(
      page.getByRole('img', {
        name: 'Zatwierdź tę przeglądarkę na zaufanym urządzeniu',
      }),
    ).toBeVisible({ timeout: 30_000 });
    await page
      .getByRole('button', { name: 'Skanuj QR zaufanego urządzenia' })
      .click();
    await expect(page.getByLabel('Trusted-device QR scanner')).toBeVisible();
    await page
      .getByRole('button', { name: 'Anuluj enrollment zaufanego urządzenia' })
      .click();
    await expect(page.getByLabel('Kod recovery')).toBeVisible();
  });

  test('recovery unlocks without a vault-password prompt and stores opaque records', async ({
    page,
  }) => {
    await setupAuthenticatedUser(page, 'Superuser', { unlock: false });
    await page.goto('/budgets');
    await unlockVault(page);
    await createSavingsBudget(page, 'Private v2 budget', '15000');

    await expect
      .poll(async () => (await readV2Storage(page)).records.length)
      .toBeGreaterThan(0);
    const storage = await readV2Storage(page);
    const serialized = JSON.stringify(storage);
    expect(serialized).not.toContain('Private v2 budget');
    expect(serialized).not.toMatch(/serverShare|vmk|prfOutput/i);
    await expect(page.getByLabel('Hasło sejfu')).not.toBeVisible();
    await expect(page.getByLabel('Kod recovery')).not.toBeVisible();
  });

  test('sync request contains opaque ciphertext and no business plaintext', async ({
    page,
  }) => {
    await setupAuthenticatedUser(page, 'Superuser', { unlock: false });
    await page.goto('/budgets');
    await unlockVault(page);
    await createSavingsBudget(page, 'Opaque sync secret', '1000');
    await page.getByRole('button', { name: 'Konto domowe' }).click();
    await page.getByRole('menuitem', { name: 'Ustawienia' }).click();

    const requestPromise = page.waitForRequest(
      (request) =>
        request.url().includes('/api/users/me/vault/sync/') &&
        request.method() === 'PUT',
    );
    await page.getByRole('button', { name: 'Wyślij lokalne dane' }).click();
    const body = JSON.parse(
      (await requestPromise).postData() ?? '{}',
    ) as Record<string, unknown>;
    expect(typeof body.ciphertext).toBe('string');
    expect(typeof body.signature).toBe('string');
    expect(JSON.stringify(body)).not.toContain('Opaque sync secret');
  });

  test('local changes trigger automatic opaque sync after unlock', async ({
    page,
  }) => {
    await setupAuthenticatedUser(page, 'Superuser', { unlock: false });
    await page.goto('/budgets');
    await unlockVault(page);

    const requestPromise = page.waitForRequest(
      (request) =>
        request.url().includes('/api/users/me/vault/sync/') &&
        request.method() === 'PUT',
    );
    await createSavingsBudget(page, 'Automatic sync secret', '2000');
    const request = await requestPromise;
    const body = JSON.parse(request.postData() ?? '{}') as Record<
      string,
      unknown
    >;
    expect(typeof body.ciphertext).toBe('string');
    expect(typeof body.signature).toBe('string');
    expect(JSON.stringify(body)).not.toContain('Automatic sync secret');
  });

  test('recovery fails closed when the remote snapshot is unavailable', async ({
    page,
  }) => {
    await setupAuthenticatedUser(page, 'Superuser', { unlock: false });
    await page.route('**/api/users/me/vault/sync/vault-e2e', (route) =>
      route.request().method() === 'GET'
        ? route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ status: 'empty' }),
          })
        : route.fallback(),
    );
    await page.goto('/budgets');
    await page
      .getByRole('button', { name: 'Odblokuj to urządzenie' })
      .click();

    const recoveryInput = page.getByLabel('Kod recovery');
    await recoveryInput.fill(recoveryVaultFixture.recoveryCode);
    await page
      .getByRole('button', { name: 'Odtwórz i zarejestruj urządzenie' })
      .click();

    await expect(
      page.getByText(
        'Odtwarzanie nie powiodło się. Sprawdź kod recovery i spróbuj ponownie.',
      ),
    ).toBeVisible();
    await expect(recoveryInput).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Utwórz budżet', exact: true }),
    ).not.toBeVisible();
  });
});
