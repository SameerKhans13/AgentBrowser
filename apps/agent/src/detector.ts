import { Page } from 'playwright';

export interface InteractiveElement {
  id: number;
  tagName: string;
  role: string;
  label: string;
  x: number;
  y: number;
}

export async function detectInteractiveElements(page: Page): Promise<InteractiveElement[]> {
  return await page.evaluate(() => {
    // Inline the interface inside the browser context to avoid external TS types errors
    interface InlinedInteractiveElement {
      id: number;
      tagName: string;
      role: string;
      label: string;
      x: number;
      y: number;
    }

    const interactors: InlinedInteractiveElement[] = [];
    const selectors = 'button, input, a, select, textarea, [role="button"], [contenteditable="true"]';
    const elements = Array.from(document.querySelectorAll(selectors));
    let currentId = 1;

    for (const el of elements) {
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);

      // 1. Filter out invisible size elements
      if (
        rect.width === 0 ||
        rect.height === 0 ||
        style.display === 'none' ||
        style.visibility === 'hidden' ||
        style.opacity === '0'
      ) {
        continue;
      }

      // 2. Filter out offscreen elements
      if (
        rect.bottom < 0 ||
        rect.right < 0 ||
        rect.top > window.innerHeight ||
        rect.left > window.innerWidth
      ) {
        continue;
      }

      // 3. Resolve label priority: aria-label -> placeholder -> innerText -> id -> name -> 'Unlabeled'
      let label = el.getAttribute('aria-label') || '';
      if (!label) {
        label = el.getAttribute('placeholder') || '';
      }
      if (!label) {
        label = (el as HTMLElement).innerText?.trim() || '';
      }
      if (!label) {
        label = el.getAttribute('id') || '';
      }
      if (!label) {
        label = el.getAttribute('name') || '';
      }
      if (!label) {
        label = 'Unlabeled';
      }

      // 4. Calculate exact absolute viewport center coordinate
      const x = Math.round(rect.left + rect.width / 2);
      const y = Math.round(rect.top + rect.height / 2);

      interactors.push({
        id: currentId++,
        tagName: el.tagName.toLowerCase(),
        role: el.getAttribute('role') || el.tagName.toLowerCase(),
        label: label.substring(0, 60), // Cap at 60 characters for brevity
        x,
        y,
      });
    }

    return interactors;
  });
}
