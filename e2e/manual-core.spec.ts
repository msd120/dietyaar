import { expect, test } from '@playwright/test';
import { waitForAppHydration } from './helpers/hydration';
import {
  expectNoWcagViolations,
  installQualityObservers,
  readQualityMetrics,
} from './helpers/quality';

for (const locale of ['en', 'fa'] as const) {
  test(`${locale} manual core journey remains accessible and deterministic`, async ({
    page,
  }, testInfo) => {
    const suffix = `${Date.now()}${testInfo.workerIndex}`.slice(-10);
    await installQualityObservers(page);
    await page.goto(`/${locale}/register`);
    // The route can be visible before its client form has hydrated. Wait for a
    // client-only effect so clicking submit cannot trigger a native reload.
    await waitForAppHydration(page);
    await expectNoWcagViolations(page, testInfo, `${locale}-registration`);
    await page.locator('#displayName').fill(locale === 'fa' ? 'کاربر آزمون' : 'Test user');
    await page.locator('#username').fill(`e2e_${locale}_${suffix}`);
    await page.locator('#password').fill('E2e-test-password-123!');
    const registrationResponse = page.waitForResponse(
      (response) =>
        response.url().endsWith('/api/register') && response.request().method() === 'POST',
    );
    await page.locator('button[type="submit"]').click();
    expect((await registrationResponse).ok()).toBe(true);
    await expect(page.locator('output')).toBeVisible();
    await page.locator('input[type="checkbox"]').check();
    await page.locator('button').last().click();

    await expect(page).toHaveURL(new RegExp(`/${locale}/onboarding`));
    await page.locator('#age').fill('30');
    await page.locator('input[name="terms"]').check();
    await page.locator('button[type="submit"]').click();
    await page.locator('#preferredName').fill(locale === 'fa' ? 'سارا' : 'Sara');
    await page.locator('button[type="submit"]').click();
    await page.locator('select[name="goal"]').selectOption('MAINTAIN_WEIGHT');
    await page.locator('button[type="submit"]').click();
    await page.locator('#timezone').fill('Asia/Tehran');
    await page.locator('button[type="submit"]').click();

    await page.waitForURL(new RegExp(`/${locale}/plan`));
    await page.locator(`a[href="/${locale}/plan/new"]`).click();
    await page.locator('#title').fill(locale === 'fa' ? 'برنامه آزمون' : 'Test plan');
    await page
      .locator('#mealGuidance')
      .fill(locale === 'fa' ? 'راهنمای نمونه' : 'Example guidance');
    await page.locator('#breakfastLabel').fill(locale === 'fa' ? 'صبحانه' : 'Breakfast');
    await page.locator('input[name="energyKcalMin"]').fill('1800');
    await page.locator('input[name="energyKcalMax"]').fill('2000');
    await page.locator('button[type="submit"]').click();

    await page.waitForURL(new RegExp(`/${locale}/today`));
    await page.locator(`a[href="/${locale}/meals/new"]`).first().click();
    await page.locator('#displayName').fill(locale === 'fa' ? 'صبحانه آزمون' : 'Test breakfast');
    await page.locator('#linkedSlotId').selectOption('breakfast');
    await page.locator('#grams').fill('100');
    await page.locator('#energyKcal').fill('500');
    await page
      .locator('form')
      .filter({ has: page.locator('#linkedSlotId') })
      .locator('button[type="submit"]')
      .click();
    const confirmButton = page.locator('button').filter({ hasText: /Confirm|تأیید/ });
    const mealSaveStarted = Date.now();
    await confirmButton.click();

    await page.waitForURL(new RegExp(`/${locale}/today`));
    const mealSaveMs = Date.now() - mealSaveStarted;
    await testInfo.attach(`${locale}-meal-save-performance`, {
      body: JSON.stringify({ mealSaveMs, targetMs: 1500 }),
      contentType: 'application/json',
    });
    expect(mealSaveMs).toBeLessThanOrEqual(1500);
    await expect(page.getByText(locale === 'fa' ? 'صبحانه آزمون' : 'Test breakfast')).toBeVisible();
    await expect(page.getByText('500', { exact: false }).first()).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    expect(await page.locator('html').getAttribute('dir')).toBe(locale === 'fa' ? 'rtl' : 'ltr');
    expect(await page.locator('html').getAttribute('lang')).toBe(locale);

    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toBeVisible();
    await page.waitForTimeout(250);
    await expectNoWcagViolations(page, testInfo, `${locale}-today`);
    const metrics = await readQualityMetrics(page);
    await testInfo.attach(`${locale}-web-vitals`, {
      body: JSON.stringify(metrics),
      contentType: 'application/json',
    });
    if (testInfo.project.name.includes('chromium')) expect(metrics.lcp).toBeGreaterThan(0);
    expect(metrics.lcp).toBeLessThanOrEqual(2500);
    expect(metrics.inp).toBeLessThanOrEqual(200);
    expect(metrics.cls).toBeLessThanOrEqual(0.1);
  });
}
