import { expect, test as base } from '@playwright/test';

export const test = base.extend({
  page: async ({ page }, providePage) => {
    page.on('console', (message) => {
      if (message.type() === 'error') {
        console.error(`[browser console] ${message.text()}`);
      }
    });
    page.on('pageerror', (error) => {
      console.error(`[browser pageerror] ${error.stack ?? error.message}`);
    });
    page.on('requestfailed', (request) => {
      if (request.resourceType() === 'script') {
        console.error(
          `[browser script request failed] ${request.url()} ${request.failure()?.errorText ?? ''}`,
        );
      }
    });

    await providePage(page);
  },
});

export { expect };
