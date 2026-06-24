import { Page, Frame } from 'playwright';

export interface InteractiveElement {
  id: number;
  tagName: string;
  role: string;
  label: string;
  x: number;
  y: number;
  frameUrl?: string; // which frame this element lives in
}

/** Collect interactive elements from a single frame, offsetting by the frame's position in the main viewport */
async function collectFromFrame(
  frame: Frame,
  offsetX: number,
  offsetY: number,
  startId: number,
): Promise<InteractiveElement[]> {
  try {
    return await frame.evaluate(
      ({ offsetX, offsetY, startId, frameUrl }) => {
        interface InlinedEl {
          id: number;
          tagName: string;
          role: string;
          label: string;
          x: number;
          y: number;
          frameUrl?: string;
        }
        const interactors: InlinedEl[] = [];
        const selectors = 'button, input, a, select, textarea, [role="button"], [contenteditable="true"]';
        const elements = Array.from(document.querySelectorAll(selectors));
        let currentId = startId;

        for (const el of elements) {
          const rect = el.getBoundingClientRect();
          const style = window.getComputedStyle(el);

          if (
            rect.width === 0 || rect.height === 0 ||
            style.display === 'none' ||
            style.visibility === 'hidden' ||
            style.opacity === '0'
          ) continue;

          if (
            rect.bottom < 0 || rect.right < 0 ||
            rect.top > window.innerHeight ||
            rect.left > window.innerWidth
          ) continue;

          let label = el.getAttribute('aria-label') || '';
          if (!label) label = el.getAttribute('placeholder') || '';
          if (!label) label = (el as HTMLElement).innerText?.trim() || '';
          if (!label) label = el.getAttribute('id') || '';
          if (!label) label = el.getAttribute('name') || '';
          if (!label) label = 'Unlabeled';

          const x = Math.round(rect.left + rect.width / 2 + offsetX);
          const y = Math.round(rect.top + rect.height / 2 + offsetY);

          interactors.push({
            id: currentId++,
            tagName: el.tagName.toLowerCase(),
            role: el.getAttribute('role') || el.tagName.toLowerCase(),
            label: label.substring(0, 60),
            x,
            y,
            frameUrl,
          });
        }
        return interactors;
      },
      { offsetX, offsetY, startId, frameUrl: frame.url() },
    );
  } catch {
    // Cross-origin or detached frames — skip silently
    return [];
  }
}

export async function detectInteractiveElements(page: Page): Promise<InteractiveElement[]> {
  const all: InteractiveElement[] = [];

  // 1. Collect from the main frame
  const mainElements = await collectFromFrame(page.mainFrame(), 0, 0, 1);
  all.push(...mainElements);

  // 2. For every visible <iframe>, get its viewport offset then collect its children
  const iframeHandles = await page.$$('iframe');
  let nextId = all.length + 1;

  for (const iframeHandle of iframeHandles) {
    try {
      // Get the iframe's position in the parent page viewport
      const box = await iframeHandle.boundingBox();
      if (!box) continue;

      const frame = await iframeHandle.contentFrame();
      if (!frame) continue;

      const frameElements = await collectFromFrame(frame, box.x, box.y, nextId);
      all.push(...frameElements);
      nextId += frameElements.length;
    } catch {
      // Skip inaccessible frames
    }
  }

  return all;
}
