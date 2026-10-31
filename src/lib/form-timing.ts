import { useState } from "react";

/**
 * Time since the form mounted, measured entirely on the browser's clock.
 * Sent as `formElapsedMs` so the server's "submitted too fast" check is not
 * affected by differences between the visitor's clock and the server's.
 */
export function useFormElapsed(): () => number {
  const [mountedAt] = useState(() => performance.now());
  return () => Math.max(0, Math.round(performance.now() - mountedAt));
}
