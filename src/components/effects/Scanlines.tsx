"use client";

export function Scanlines() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-[1000]"
      style={{
        background: `repeating-linear-gradient(
          0deg,
          transparent,
          transparent 2px,
          rgba(0, 0, 0, 0.1) 2px,
          rgba(0, 0, 0, 0.1) 4px
        )`,
        opacity: 0.3,
      }}
      aria-hidden="true"
    />
  );
}
