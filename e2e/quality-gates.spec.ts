import { expect, test } from '@playwright/test';
import { waitForReactHydration } from './helpers/hydration';
import { expectNoWcagViolations } from './helpers/quality';

for (const locale of ['en', 'fa'] as const) {
  test(`${locale} public identity surfaces meet WCAG AA and reduced-motion gates`, async ({
    page,
  }, testInfo) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    for (const route of ['register', 'login', 'recover'] as const) {
      await page.goto(`/${locale}/${route}`);
      await waitForReactHydration(page, 'form');
      await expectNoWcagViolations(page, testInfo, `${locale}-${route}`);
    }

    const longestMotionMs = await page.evaluate(() => {
      const milliseconds = (value: string) =>
        value
          .split(',')
          .map((part) => part.trim())
          .map((part) =>
            part.endsWith('ms') ? Number.parseFloat(part) : Number.parseFloat(part) * 1000,
          )
          .filter(Number.isFinite);
      return Math.max(
        0,
        ...[...document.querySelectorAll('*')].flatMap((element) => {
          const style = getComputedStyle(element);
          return [
            ...milliseconds(style.animationDuration),
            ...milliseconds(style.transitionDuration),
          ];
        }),
      );
    });
    expect(longestMotionMs).toBeLessThanOrEqual(10);

    const primaryButton = page.locator('button[type="submit"]');
    const box = await primaryButton.boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(44);
    expect(box?.width).toBeGreaterThanOrEqual(44);
  });
}

test('offline and transient API failures retain registration input and recover', async ({
  context,
  page,
}, testInfo) => {
  await page.goto('/en/register');
  await waitForReactHydration(page, 'form');
  await page.locator('#displayName').fill('Failure test');
  await page.locator('#username').fill(`failure_${Date.now()}`);
  await page.locator('#password').fill('Failure-test-password-123!');

  await context.setOffline(true);
  await expect(page.getByTestId('offline-status')).toBeVisible();
  await page.locator('button[type="submit"]').click();
  await expect(page.locator('p[role="alert"]')).toBeVisible();
  await expect(page.locator('#username')).not.toHaveValue('');

  await context.setOffline(false);
  await expect(page.getByTestId('offline-status')).toBeHidden();
  await page.route('**/api/register', (route) =>
    route.fulfill({
      status: 503,
      contentType: 'application/json',
      body: '{"error":"UNAVAILABLE"}',
    }),
  );
  await page.locator('button[type="submit"]').click();
  await expect(page.locator('p[role="alert"]')).toBeVisible();
  await expect(page.locator('#displayName')).toHaveValue('Failure test');
  await expectNoWcagViolations(page, testInfo, 'recoverable-registration-error');

  await page.unroute('**/api/register');
  await page.locator('button[type="submit"]').click();
  await expect(page.locator('output')).toBeVisible();
});
