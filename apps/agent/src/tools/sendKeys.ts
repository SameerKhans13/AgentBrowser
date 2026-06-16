import { Page } from 'playwright';

export async function sendKeys(page: Page, x: number, y: number, text: string): Promise<void> {
  // Triple-click to select all existing text in the target element
  await page.mouse.click(x, y, { clickCount: 3 });
  await page.keyboard.press('Backspace');
  // Type the new keys
  await page.keyboard.type(text);
}
