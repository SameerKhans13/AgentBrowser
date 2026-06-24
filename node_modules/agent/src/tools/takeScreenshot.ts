import { Page } from 'playwright';
import fs from 'fs';
import path from 'path';

export async function takeScreenshot(page: Page, filePath: string): Promise<string> {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
  await page.screenshot({ path: filePath, fullPage: true });
  return filePath;
}
