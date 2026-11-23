import { expect, type Page } from '@playwright/test';

export async function waitForAppHydration(page: Page) {
  const offlineStatus = page.getByTestId('offline-status');

  await page.evaluate(() => {
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: false });
    window.dispatchEvent(new Event('offline'));
  });
  await expect(offlineStatus).toBeVisible();
  await page.evaluate(() => {
    Reflect.deleteProperty(navigator, 'onLine');
    window.dispatchEvent(new Event('online'));
  });
  await expect(offlineStatus).toBeHidden();
}
