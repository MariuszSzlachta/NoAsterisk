import { expect, test, type Page } from '@playwright/test';

import type { VaultResponse } from '../../src/features/user-settings/api/useVaultQuery/vault-response';

interface UploadRequest {
  readonly encryptedBlob: string;
  readonly baseRevision: number;
}

interface RemoteVaultState {
  snapshot: VaultResponse;
  readonly uploads: UploadRequest[];
}

const EMPTY_REMOTE: VaultResponse = { status: 'empty' };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const parseUploadRequest = (value: string | null): UploadRequest => {
  const parsed: unknown = JSON.parse(value ?? '{}');
  if (
    !isRecord(parsed) ||
    typeof parsed.encryptedBlob !== 'string' ||
    typeof parsed.baseRevision !== 'number'
  ) {
    throw new Error('Unexpected sync request shape');
  }
  return {
    encryptedBlob: parsed.encryptedBlob,
    baseRevision: parsed.baseRevision,
  };
};

const setupSyncSession = async (
  page: Page,
  remote: RemoteVaultState,
): Promise<void> => {
  await page.route('**/*', async (route) => {
    const requestUrl = new URL(route.request().url());
    const { pathname } = requestUrl;

    if (pathname.endsWith('/api/auth/refresh')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ accessToken: 'e2e-fake-token' }),
      });
      return;
    }

    if (pathname.endsWith('/api/auth/login')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          accessToken: 'e2e-fake-token',
          user: {
            id: 'user-e2e',
            email: 'member@budget.local',
            role: 'Member',
            workspaceId: 'workspace-e2e',
          },
        }),
      });
      return;
    }

    if (pathname.endsWith('/api/users/me/vault')) {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(remote.snapshot),
        });
        return;
      }

      const upload = parseUploadRequest(route.request().postData());
      remote.uploads.push(upload);

      const currentRevision =
        remote.snapshot.status === 'available' ? remote.snapshot.revision : 0;
      if (upload.baseRevision !== currentRevision) {
        await route.fulfill({
          status: 409,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Stale vault revision' }),
        });
        return;
      }

      const revision = currentRevision + 1;
      const now = `2026-09-10T16:30:0${revision}.000Z`;
      remote.snapshot = {
        status: 'available',
        encryptedBlob: upload.encryptedBlob,
        byteSize: new TextEncoder().encode(upload.encryptedBlob).length,
        revision,
        contentHash: `e2e-hash-${revision}`,
        createdAt:
          remote.snapshot.status === 'available'
            ? remote.snapshot.createdAt
            : now,
        updatedAt: now,
      };
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(remote.snapshot),
      });
      return;
    }

    if (pathname.endsWith('/api/users/me')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'user-e2e',
          email: 'member@budget.local',
          displayName: 'E2E User',
          role: 'Member',
          workspaceId: 'workspace-e2e',
          createdAt: '2026-01-01T00:00:00.000Z',
          preferences: { language: 'pl', currency: 'PLN', theme: 'dark' },
        }),
      });
      return;
    }

    await route.continue();
  });
};

const seedTransactions = async (
  page: Page,
  descriptions: ReadonlyArray<string>,
): Promise<void> => {
  await page.addInitScript((transactionDescriptions) => {
    localStorage.setItem(
      'budget-transactions',
      JSON.stringify({
        state: {
          transactions: transactionDescriptions.map((description, index) => ({
            id: `e2e-transaction-${index}`,
            date: '2026-09-10',
            description,
            amount: -12.5,
            currency: 'PLN',
            contentHash: `e2e-hash-${index}`,
            batchId: 'manual',
            importedAt: '2026-09-10T10:00:00.000Z',
          })),
        },
        version: 0,
      }),
    );
  }, descriptions);
};

const loginAndUnlock = async (page: Page): Promise<void> => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('member@budget.local');
  await page.getByLabel('Hasło').fill('e2e-test-password');
  await page.getByRole('button', { name: 'Zaloguj' }).click();
  await page.waitForURL('**/dashboard');
  await page.getByLabel('Hasło sejfu').fill('e2e-vault-passphrase');
  await page.getByRole('button', { name: 'Odblokuj dane' }).click();
  await page.getByLabel('Hasło sejfu').waitFor({ state: 'hidden' });
};

const openSettings = async (page: Page): Promise<void> => {
  await page.getByRole('button', { name: 'Konto domowe' }).click();
  await page.getByRole('menuitem', { name: 'Ustawienia' }).click();
  await expect(page.getByText('Dane i synchronizacja')).toBeVisible();
};

test.describe('Encrypted vault — multi-device synchronization', () => {
  test('pushes from device A, rejects stale device B, then pulls without plaintext upload', async ({
    browser,
  }) => {
    const remote: RemoteVaultState = {
      snapshot: EMPTY_REMOTE,
      uploads: [],
    };
    const contextA = await browser.newContext();
    const contextB = await browser.newContext();
    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    try {
      await seedTransactions(pageA, ['Device A secret merchant']);
      await seedTransactions(pageB, [
        'Device B local merchant',
        'Device B second merchant',
      ]);
      await setupSyncSession(pageA, remote);
      await setupSyncSession(pageB, remote);

      await loginAndUnlock(pageA);
      await openSettings(pageA);
      await expect(pageA.getByText('Masz lokalne zmiany')).toBeVisible();

      await loginAndUnlock(pageB);
      await openSettings(pageB);
      await expect(pageB.getByText('Masz lokalne zmiany')).toBeVisible();

      await pageA.getByRole('button', { name: 'Wyślij lokalne dane' }).click();
      await pageA.getByLabel('Hasło szyfrowania').fill('e2e-vault-passphrase');
      await pageA.getByRole('button', { name: 'Zaszyfruj i prześlij' }).click();
      await expect(
        pageA.getByText('Dane zaszyfrowane i przesłane pomyślnie.'),
      ).toBeVisible();

      await pageB.getByRole('button', { name: 'Wyślij lokalne dane' }).click();
      await pageB.getByLabel('Hasło szyfrowania').fill('e2e-vault-passphrase');
      await pageB.getByRole('button', { name: 'Zaszyfruj i prześlij' }).click();
      await expect(
        pageB.getByText('Wykryto konflikt synchronizacji'),
      ).toBeVisible();

      expect(remote.snapshot.status).toBe('available');
      expect(remote.uploads).toHaveLength(2);
      expect(remote.uploads[0]?.baseRevision).toBe(0);
      expect(remote.uploads[1]?.baseRevision).toBe(0);
      remote.uploads.forEach((upload) => {
        expect(upload.encryptedBlob).not.toContain('Device A secret merchant');
        expect(upload.encryptedBlob).not.toContain('Device B local merchant');
        expect(upload.encryptedBlob).not.toContain('e2e-vault-passphrase');
      });

      pageB.once('dialog', (dialog) => dialog.accept());
      await pageB
        .getByRole('button', { name: 'Pobierz dane z serwera' })
        .click();
      await pageB.getByLabel('Hasło szyfrowania').fill('e2e-vault-passphrase');
      await pageB.getByRole('button', { name: 'Odszyfruj i przywróć' }).click();
      await expect(
        pageB.getByText('Dane przywrócone pomyślnie.'),
      ).toBeVisible();
      await expect(
        pageB
          .locator('main')
          .getByText('Transakcje', { exact: true })
          .last()
          .locator('..'),
      ).toContainText('1');
    } finally {
      await contextA.close();
      await contextB.close();
    }
  });
});
