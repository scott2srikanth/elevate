import React from "react";
export default function SplashBackdrop() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        background:
          "radial-gradient(ellipse at 50% 32%, #F5EDDB 0%, #EADCC4 48%, #DBC5A4 100%)",
      }}
    />
  );
}
