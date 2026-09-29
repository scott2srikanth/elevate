import React, { useEffect, useRef, useState } from "react";
import { parseGarmentMessage, type GarmentResult } from "../shared/garment";
export function GarmentAnalysis({
  onResult,
}: {
  onResult: (result: GarmentResult) => void;
}) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [session] = useState(
    () => `${Date.now()}-${Math.random().toString(36).slice(2)}`,
  );
  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (
        event.origin !== location.origin ||
        event.source !== frame.current?.contentWindow
      )
        return;
      const result = parseGarmentMessage(event.data, session);
      if (result) {
        onResult(result);
        frame.current?.contentWindow?.postMessage(
          JSON.stringify({
            type: "elevate-garment-saved",
            session,
            id: result.id,
          }),
          location.origin,
        );
      }
    };
    window.addEventListener("message", receive);
    return () => window.removeEventListener("message", receive);
  }, [onResult, session]);
  return (
    <iframe
      ref={frame}
      title="On-device garment analysis"
      src={`/observation/garment/index.html?session=${session}`}
      style={{ width: "100%", height: 850, border: 0, borderRadius: 16 }}
      allow="camera 'none'; microphone 'none'"
    />
  );
}
