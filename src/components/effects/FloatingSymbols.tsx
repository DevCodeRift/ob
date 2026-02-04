"use client";

const SYMBOLS = [
  "᚛", "☉", "᚜", "⛧", "᚝", "☽", "᚞", "⊕", "᚟", "◬",
  "ᚠ", "⍟", "ᚡ", "⊗", "ᚢ", "⚙", "☿", "♄", "⚶", "✧",
];

export function FloatingSymbols() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-[1] overflow-hidden"
      aria-hidden="true"
    >
      {SYMBOLS.map((symbol, i) => (
        <span
          key={i}
          className="absolute text-gold-dim animate-float"
          style={{
            left: `${(i * 5) % 100}%`,
            top: `${(i * 7) % 100}%`,
            fontSize: `${1.2 + (i % 3) * 0.4}rem`,
            animationDelay: `${i * 1.2}s`,
            animationDuration: `${18 + (i % 5) * 4}s`,
            opacity: 0.12 + (i % 3) * 0.05,
          }}
        >
          {symbol}
        </span>
      ))}
    </div>
  );
}
