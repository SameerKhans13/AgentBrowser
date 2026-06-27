import { chromium, firefox, webkit, Browser, BrowserContext, Page } from 'playwright';

export async function openBrowser(): Promise<{
  browser: Browser;
  context: BrowserContext;
  page: Page;
}> {
  const browserType = process.env.BROWSER_TYPE || 'chromium';
  let launcher = chromium;

  if (browserType.toLowerCase() === 'firefox') {
    launcher = firefox;
  } else if (browserType.toLowerCase() === 'webkit') {
    launcher = webkit;
  }

  console.log(`Launching browser: ${browserType}`);
  const browser = await launcher.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });
  const page = await context.newPage();
  return { browser, context, page };
}
