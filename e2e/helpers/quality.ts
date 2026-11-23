import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, type TestInfo } from '@playwright/test';

type QualityMetrics = { cls: number; inp: number; lcp: number };

export async function expectNoWcagViolations(page: Page, testInfo: TestInfo, label: string) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
  await testInfo.attach(`axe-${label}`, {
    body: JSON.stringify(results.violations, null, 2),
    contentType: 'application/json',
  });
  const summary = results.violations.map((violation) => ({
    id: violation.id,
    impact: violation.impact,
    nodes: violation.nodes.map((node) => node.target.join(' ')),
  }));
  expect(summary, `${label} must have no WCAG A/AA violations`).toEqual([]);
}

export async function installQualityObservers(page: Page) {
  await page.addInitScript(() => {
    const qualityWindow = window as typeof window & { __dietyaarQuality?: QualityMetrics };
    qualityWindow.__dietyaarQuality = { cls: 0, inp: 0, lcp: 0 };
    if (!('PerformanceObserver' in window)) return;

    if (PerformanceObserver.supportedEntryTypes.includes('largest-contentful-paint')) {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          qualityWindow.__dietyaarQuality!.lcp = Math.max(
            qualityWindow.__dietyaarQuality!.lcp,
            entry.startTime,
          );
        }
      }).observe({ type: 'largest-contentful-paint', buffered: true });
    }

    if (PerformanceObserver.supportedEntryTypes.includes('layout-shift')) {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const shift = entry as PerformanceEntry & { hadRecentInput?: boolean; value?: number };
          if (!shift.hadRecentInput) qualityWindow.__dietyaarQuality!.cls += shift.value ?? 0;
        }
      }).observe({ type: 'layout-shift', buffered: true });
    }

    if (PerformanceObserver.supportedEntryTypes.includes('event')) {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          qualityWindow.__dietyaarQuality!.inp = Math.max(
            qualityWindow.__dietyaarQuality!.inp,
            entry.duration,
          );
        }
      }).observe({ type: 'event', buffered: true, durationThreshold: 16 });
    }
  });
}

export async function readQualityMetrics(page: Page): Promise<QualityMetrics> {
  return page.evaluate(() => {
    const qualityWindow = window as typeof window & { __dietyaarQuality?: QualityMetrics };
    return qualityWindow.__dietyaarQuality ?? { cls: 0, inp: 0, lcp: 0 };
  });
}
