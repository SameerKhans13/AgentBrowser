import { Page } from 'playwright';

export async function clickOnScreen(page: Page, x: number, y: number): Promise<void> {
  await page.mouse.click(x, y);
}
