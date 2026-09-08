import { expect, test } from '@playwright/test';

test.describe('Security baseline', () => {
  test('declares a restrictive CSP with form and frame protections', async ({ page }) => {
    await page.goto('/login');

    const content = await page
      .locator('meta[http-equiv="Content-Security-Policy"]')
      .getAttribute('content');

    expect(content).toContain("default-src 'self'");
    expect(content).toContain("object-src 'none'");
    expect(content).toContain("base-uri 'self'");
    expect(content).toContain("form-action 'self'");
    expect(content).toContain("frame-ancestors 'none'");
    expect(content).not.toContain("script-src 'self' 'unsafe-inline'");
    expect(content).not.toContain("script-src 'self' 'unsafe-eval'");
  });

  test('does not persist authentication or financial data in web storage', async ({ page }) => {
    await page.goto('/login');

    const storage = await page.evaluate(() => ({
      cookies: document.cookie,
      localStorageKeys: Object.keys(localStorage),
      sessionStorageKeys: Object.keys(sessionStorage),
    }));

    expect(storage.cookies).not.toContain('refresh');
    expect(storage.cookies).not.toContain('access');
    expect(storage.localStorageKeys).toEqual(['budget-theme']);
    expect(storage.sessionStorageKeys).toEqual([]);
  });
});
