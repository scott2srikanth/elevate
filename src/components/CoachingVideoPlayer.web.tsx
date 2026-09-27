import React from "react";
import { useLanguage } from "../i18n";
import { embedUrl } from "../coachingVideos";
export default function CoachingVideoPlayer({
  id,
  title,
}: {
  id: string;
  title: string;
}) {
  const { language } = useLanguage();
  return (
    <iframe
      title={title}
      src={embedUrl(id, language)}
      style={{
        width: "100%",
        aspectRatio: "16 / 9",
        minHeight: 220,
        border: 0,
        background: "#173B31",
      }}
      allow="encrypted-media; fullscreen; picture-in-picture"
      allowFullScreen
      referrerPolicy="strict-origin-when-cross-origin"
    />
  );
}
