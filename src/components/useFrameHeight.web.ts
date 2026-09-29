import { useCallback, useEffect, useRef, useState } from "react";

// The iframe has no independent scroll range once it fits its document.
// Observe the body (not document.scrollHeight, which cannot shrink below the viewport).
export function useFrameHeight(initialHeight: number) {
  const frame = useRef<HTMLIFrameElement>(null);
  const cleanup = useRef<(() => void) | null>(null);
  const [height, setHeight] = useState(initialHeight);
  const onLoad = useCallback(() => {
    cleanup.current?.();
    const doc = frame.current?.contentDocument;
    if (!doc?.body) return;
    let pending = 0;
    const measure = () => {
      pending = 0;
      const next = Math.ceil(doc.body.getBoundingClientRect().height) + 2;
      if (next > 0 && next <= 30000) setHeight(next);
    };
    const schedule = () => {
      if (!pending) pending = requestAnimationFrame(measure);
    };
    const observer = new ResizeObserver(schedule);
    observer.observe(doc.body);
    doc.addEventListener("load", schedule, true);
    schedule();
    cleanup.current = () => {
      observer.disconnect();
      cancelAnimationFrame(pending);
      doc.removeEventListener("load", schedule, true);
    };
  }, []);
  useEffect(() => () => cleanup.current?.(), []);
  return { frame, height, onLoad };
}
