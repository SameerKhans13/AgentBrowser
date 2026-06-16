import { Page } from 'playwright';

export async function doubleClick(page: Page, x: number, y: number): Promise<void> {
  await page.mouse.dblclick(x, y);
}
