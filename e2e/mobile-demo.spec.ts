import { expect, test } from '@playwright/test';

const screenIds = [
  'A01',
  'A02',
  'O01',
  'O02',
  'O03',
  'O04',
  'O05',
  'O06',
  'O07',
  'O08',
  'O09',
  'T01',
  'M01',
  'M02',
  'M03',
  'M04',
  'M05',
  'H01',
  'H02',
  'H03',
  'H04',
  'P01',
  'P02',
  'P03',
  'P04',
  'S01',
  'S02',
  'S03',
  'S04',
  'S05',
  'S06',
  'S07',
  'L01',
];

for (const viewport of [
  { width: 320, height: 700 },
  { width: 390, height: 844 },
]) {
  test.describe(`demo at ${viewport.width}px`, () => {
    test.use({ viewport });

    test('login, navigation and core screens fit without horizontal overflow', async ({ page }) => {
      await page.goto('/fa');
      await expect(page.getByText('ورود به دموی دیت‌یار', { exact: true })).toBeVisible();
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      ).toBe(true);

      await page.getByRole('button', { name: 'ورود به دمو' }).click();
      await expect(page).toHaveURL(/\/fa\/demo\/T01$/);
      await expect(page.getByRole('heading', { name: 'امروز' })).toBeVisible();
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      ).toBe(true);

      await page.getByRole('button', { name: 'بازکردن فهرست' }).click();
      await expect(page.getByRole('link', { name: /M03 مرور وعده/ })).toBeVisible();
      await page.getByRole('link', { name: /M03 مرور وعده/ }).click();
      await expect(page.getByRole('heading', { name: 'مرور وعده' })).toBeVisible();
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      ).toBe(true);

      for (const screenId of screenIds) {
        await page.goto(`/fa/demo/${screenId}`);
        await expect(page.locator('h1')).toBeVisible();
        expect(
          await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
        ).toBe(true);
      }
    });
  });
}
