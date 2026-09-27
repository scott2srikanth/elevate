import React from "react";
export default function FileVideo({ url }: { url: string }) {
  return (
    <video
      src={url}
      controls
      playsInline
      preload="metadata"
      style={{
        display: "block",
        width: "100%",
        maxWidth: "100%",
        aspectRatio: "16/9",
        objectFit: "contain",
        background: "#173B31",
      }}
    />
  );
}
