import type { Page } from '@playwright/test';

export async function waitForReactHydration(page: Page, selector: string) {
  await page.waitForFunction((targetSelector) => {
    const element = document.querySelector(targetSelector);

    return Object.getOwnPropertyNames(element ?? {}).some(
      (key) => key.startsWith('__reactProps$') || key.startsWith('__reactFiber$'),
    );
  }, selector);
}
