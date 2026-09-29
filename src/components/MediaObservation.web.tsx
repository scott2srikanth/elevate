import React, { useEffect, useRef, useState } from "react";
import { parseMediaMessage, type MediaReport } from "../shared/observation";
export function MediaObservation({
  onReport,
}: {
  onReport: (report: MediaReport) => void;
}) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [session] = useState(
    () => `${Date.now()}-${Math.random().toString(36).slice(2)}`,
  );
  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (
        event.origin !== window.location.origin ||
        event.source !== frame.current?.contentWindow
      )
        return;
      const report = parseMediaMessage(event.data, session);
      if (report) onReport(report);
    };
    window.addEventListener("message", receive);
    return () => window.removeEventListener("message", receive);
  }, [onReport, session]);
  return (
    <iframe
      ref={frame}
      title="Automatic photo, video and voice analysis"
      src={`/observation/?session=${session}`}
      style={{ width: "100%", height: 620, border: 0, borderRadius: 16 }}
      allow="camera 'none'; microphone 'none'"
    />
  );
}
