"use client";

export function CornerDecorations() {
  return (
    <>
      <div
        className="fixed top-4 left-4 text-gold-dim text-2xl opacity-30 z-[998]"
        aria-hidden="true"
      >
        ⛧
      </div>
      <div
        className="fixed top-4 right-4 text-gold-dim text-2xl opacity-30 z-[998]"
        aria-hidden="true"
      >
        ⛧
      </div>
      <div
        className="fixed bottom-4 left-4 text-gold-dim text-2xl opacity-30 z-[998]"
        aria-hidden="true"
      >
        ⛧
      </div>
      <div
        className="fixed bottom-4 right-4 text-gold-dim text-2xl opacity-30 z-[998]"
        aria-hidden="true"
      >
        ⛧
      </div>
    </>
  );
}
