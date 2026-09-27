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
  const videoHeight = Math.min((width * 9) / 16, height * 0.64);
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
          height: videoHeight,
          position: "absolute",
          top: height * 0.1,
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
          top: height * 0.1,
          left: 0,
          width,
          height: videoHeight,
          objectFit: "contain",
          pointerEvents: "none",
          opacity: playing ? 1 : 0,
        }}
      />
    </div>
  );
}
