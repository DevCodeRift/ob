"use client";

export function Vignette() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-[999]"
      style={{
        background: `radial-gradient(
          ellipse at center,
          transparent 0%,
          transparent 50%,
          rgba(0, 0, 0, 0.4) 100%
        )`,
      }}
      aria-hidden="true"
    />
  );
}
