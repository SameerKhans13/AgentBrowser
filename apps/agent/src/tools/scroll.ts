import { Page } from 'playwright';

export async function scroll(page: Page, distance: number): Promise<void> {
  await page.evaluate((d) => window.scrollBy(0, d), distance);
}
