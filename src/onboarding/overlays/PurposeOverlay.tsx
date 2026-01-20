// src/components/overlays/PurposeOverlay.tsx
import React, { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import purposeSvg from "/assets/purpose_overlay.svg";

type ScreenPoint = { x: number; y: number };

type PurposeOverlayProps = {
  anchor: ScreenPoint;
  visible: boolean;
};

export default function PurposeOverlay({
  anchor,
  visible,
}: PurposeOverlayProps): React.ReactElement {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // Rotation (runs once)
  useLayoutEffect(() => {
    const el = imgRef.current;
    if (!el) return;

    const tween = gsap.to(el, {
      rotation: 360,
      duration: 24,
      ease: "none",
      repeat: -1,
      transformOrigin: "50% 50%",
    });

    return () => {
      tween.kill();
    };
  }, []);

  // Fade in / out
  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    if (visible) {
      gsap.to(el, {
        opacity: 1,
        duration: 3,
        ease: "power2.out",
      });
    } else {
      gsap.to(el, {
        opacity: 0,
        duration: 1,
        ease: "power2.in",
      });
    }
  }, [visible]);

  return (
    <div
      ref={containerRef}
      style={{
        position: "absolute",
        left: anchor.x,
        top: anchor.y,
        transform: "translate(-50%, -50%)",
        pointerEvents: "none",
        zIndex: 20,
        opacity: 0, // start hidden until first fade-in
        willChange: "opacity, transform",
        display: 'none',
      }}
    >
      <img
        ref={imgRef}
        src={purposeSvg}
        alt="Purpose overlay"
        draggable={false}
        style={{
          display: "block",
          width: 220,
          height: "auto",
          userSelect: "none",
          willChange: "transform",
        }}
      />
    </div>
  );
}
