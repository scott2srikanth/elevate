// Keep this bridge self-contained so it also works with already-downloaded pages.
export function embeddedHeightScript(session: string) {
  return `(function () {
    if (window.__elevateHeightCleanup) window.__elevateHeightCleanup();
    var last = 0, pending = 0;
    function measure() {
      pending = 0;
      var height = Math.ceil(document.body.getBoundingClientRect().height) + 2;
      if (height > 0 && height <= 30000 && height !== last) {
        last = height;
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'elevate-content-height', session: ${JSON.stringify(session)}, height: height
        }));
      }
    }
    function schedule() { if (!pending) pending = requestAnimationFrame(measure); }
    var observer = new ResizeObserver(schedule);
    observer.observe(document.body);
    window.addEventListener('resize', schedule);
    document.addEventListener('load', schedule, true);
    window.__elevateHeightCleanup = function () {
      observer.disconnect(); cancelAnimationFrame(pending);
      window.removeEventListener('resize', schedule);
      document.removeEventListener('load', schedule, true);
    };
    schedule();
  })(); true;`;
}

export function parseEmbeddedHeight(
  data: string,
  session: string,
): number | null {
  if (data.length > 1024) return null;
  try {
    const message = JSON.parse(data);
    return message?.type === "elevate-content-height" &&
      message.session === session &&
      Number.isInteger(message.height) &&
      message.height > 0 &&
      message.height <= 30000
      ? message.height
      : null;
  } catch {
    return null;
  }
}
