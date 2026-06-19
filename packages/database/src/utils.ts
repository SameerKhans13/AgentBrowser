/**
 * Calculates the center coordinate of a bounding box.
 * This is crucial for clicking elements accurately using pixel coordinates.
 */
export function calculateCenter(bbox: { x: number; y: number; width: number; height: number }) {
  return {
    x: Math.round(bbox.x + bbox.width / 2),
    y: Math.round(bbox.y + bbox.height / 2),
  };
}

/**
 * Formats a duration in milliseconds into a user-friendly human-readable format.
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const seconds = (ms / 1000).toFixed(1);
  return `${seconds}s`;
}

/**
 * Parses and safely types the parameters JSON stored in action logs.
 */
export function parseActionParameters<T = Record<string, any>>(params: unknown): T {
  if (!params) return {} as T;
  if (typeof params === 'string') {
    try {
      return JSON.parse(params) as T;
    } catch {
      return {} as T;
    }
  }
  return params as T;
}
