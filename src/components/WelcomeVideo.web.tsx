import React, { useEffect, useRef, useState } from "react";
import { Image } from "../i18n";
const source = require("../../assets/video/welcome.mp4");
export default function WelcomeVideo({
  width,
  height,
}: {
  width: number;
  height: number;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    const video = ref.current;
    const update = () => {
      if (!video) return;
      if (document.hidden) video.pause();
      else void video.play().catch(() => setPlaying(false));
    };
    update();
    document.addEventListener("visibilitychange", update);
    return () => {
      document.removeEventListener("visibilitychange", update);
      video?.pause();
    };
  }, []);
  return (
    <div
      role="img"
      aria-label="Welcome to Elevate. Tap Continue below to begin."
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        pointerEvents: "none",
      }}
    >
      <Image
        source={require("../../assets/brand-splash.png")}
        style={{
          width,
          height,
          position: "absolute",
          top: 0,
          opacity: playing ? 0 : 1,
        }}
        resizeMode="contain"
        accessible={false}
      />
      <video
        ref={ref}
        data-testid="welcome-video"
        src={source}
        muted
        autoPlay
        loop
        playsInline
        controls={false}
        aria-hidden="true"
        onPlaying={() => setPlaying(true)}
        onError={() => setPlaying(false)}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width,
          height,
          objectFit: "cover",
          pointerEvents: "none",
          opacity: playing ? 1 : 0,
        }}
      />
    </div>
  );
}
