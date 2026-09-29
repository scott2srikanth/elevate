import { useFrameHeight } from "./useFrameHeight.web";
import React, { useEffect, useState } from "react";
import { parseMediaMessage, type MediaReport } from "../shared/observation";
export function MediaObservation({
  onReport,
}: {
  onReport: (report: MediaReport) => void;
}) {
  const { frame, height, onLoad } = useFrameHeight(620);
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
  }, [onReport, session, frame]);
  return (
    <iframe
      ref={frame}
      onLoad={onLoad}
      title="Automatic photo, video and voice analysis"
      src={`/observation/?session=${session}`}
      style={{
        width: "100%",
        height,
        border: 0,
        borderRadius: 16,
        flexShrink: 0,
      }}
      allow="camera 'none'; microphone 'none'"
    />
  );
}
