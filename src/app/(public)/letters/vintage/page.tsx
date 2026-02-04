"use client";

import { useState, useRef, useMemo } from "react";

export default function VintageLetterPage() {
  const letterRef = useRef<HTMLDivElement>(null);
  const [letterContent, setLetterContent] = useState({
    recipient: "Adept",
    salutation: "Dear",
    body: "We regret to inform you that your recent request has been denied pursuant to Covenant Protocol VII.\n\nFurther inquiries regarding this matter are to be directed to the Inner Circle.\n\nThis correspondence shall be consumed by flame upon reading. The Serpent watches.",
    closing: "In eternal cycle,",
    sender: "Archmagos of the Foundation",
    classification: "EYES ONLY",
  });
  const [downloading, setDownloading] = useState(false);

  // Get today's date but with 1942
  const today = new Date();
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const formattedDate = `${months[today.getMonth()]} ${today.getDate()}, 1942`;

  // Stable reference number
  const refNumber = useMemo(() => {
    return `OBF-${String(today.getMonth() + 1).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}-${Math.floor(Math.random() * 9000) + 1000}`;
  }, []);

  async function downloadLetter() {
    if (!letterRef.current) return;
    setDownloading(true);

    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(letterRef.current, {
        backgroundColor: null,
        scale: 2,
      });

      const link = document.createElement("a");
      link.download = `ouroboros-correspondence-${Date.now()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (error) {
      console.error("Failed to download:", error);
      alert("Failed to generate image. Please take a screenshot instead.");
    } finally {
      setDownloading(false);
    }
  }

  // SVG Ouroboros symbol
  const OuroborosSVG = ({ size = 60, color = "#2c2416" }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="35" stroke={color} strokeWidth="8" fill="none" />
      <path
        d="M 85 50 Q 85 30 70 20 L 75 28 M 70 20 L 78 22"
        stroke={color}
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      <circle cx="22" cy="50" r="4" fill={color} />
      <circle cx="20" cy="45" r="1.5" fill={color} />
      <circle cx="20" cy="55" r="1.5" fill={color} />
    </svg>
  );

  // Wax seal ouroboros
  const WaxSealOuroboros = () => (
    <svg width="50" height="50" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="30" stroke="#ffd4a8" strokeWidth="5" fill="none" opacity="0.8" />
      <path
        d="M 80 50 Q 80 28 62 18 L 68 26 M 62 18 L 72 21"
        stroke="#ffd4a8"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        opacity="0.8"
      />
      <circle cx="26" cy="50" r="4" fill="#ffd4a8" opacity="0.8" />
      <circle cx="24" cy="44" r="1.5" fill="#ffd4a8" opacity="0.7" />
      <circle cx="24" cy="56" r="1.5" fill="#ffd4a8" opacity="0.7" />
    </svg>
  );

  return (
    <div className="min-h-screen py-8 bg-[#1a1a1a]">
      <div className="max-w-4xl mx-auto px-4">
        {/* Controls */}
        <div className="mb-8 space-y-4">
          <h1 className="font-mono text-xl text-[#d4af37] tracking-widest">ARCHIVAL CORRESPONDENCE</h1>
          <p className="font-mono text-xs text-[#888]">Generate classified documents in the style of the Ouroboros Foundation, circa 1942</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-mono text-xs text-[#888] mb-1">Classification</label>
              <select
                value={letterContent.classification}
                onChange={(e) => setLetterContent({ ...letterContent, classification: e.target.value })}
                className="w-full bg-[#2a2a2a] border border-[#444] text-[#eee] px-3 py-2 font-mono text-sm"
              >
                <option value="EYES ONLY">EYES ONLY</option>
                <option value="COVENANT SEALED">COVENANT SEALED</option>
                <option value="ARCHMAGOS CLEARANCE">ARCHMAGOS CLEARANCE</option>
                <option value="INNER CIRCLE">INNER CIRCLE</option>
                <option value="RESTRICTED">RESTRICTED</option>
                <option value="CLASSIFIED">CLASSIFIED</option>
              </select>
            </div>
            <div>
              <label className="block font-mono text-xs text-[#888] mb-1">Recipient Name/Title</label>
              <input
                type="text"
                value={letterContent.recipient}
                onChange={(e) => setLetterContent({ ...letterContent, recipient: e.target.value })}
                className="w-full bg-[#2a2a2a] border border-[#444] text-[#eee] px-3 py-2 font-mono text-sm"
              />
            </div>
            <div>
              <label className="block font-mono text-xs text-[#888] mb-1">Salutation</label>
              <input
                type="text"
                value={letterContent.salutation}
                onChange={(e) => setLetterContent({ ...letterContent, salutation: e.target.value })}
                className="w-full bg-[#2a2a2a] border border-[#444] text-[#eee] px-3 py-2 font-mono text-sm"
              />
            </div>
            <div>
              <label className="block font-mono text-xs text-[#888] mb-1">Closing</label>
              <input
                type="text"
                value={letterContent.closing}
                onChange={(e) => setLetterContent({ ...letterContent, closing: e.target.value })}
                className="w-full bg-[#2a2a2a] border border-[#444] text-[#eee] px-3 py-2 font-mono text-sm"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block font-mono text-xs text-[#888] mb-1">Letter Body</label>
              <textarea
                value={letterContent.body}
                onChange={(e) => setLetterContent({ ...letterContent, body: e.target.value })}
                className="w-full bg-[#2a2a2a] border border-[#444] text-[#eee] px-3 py-2 font-mono text-sm min-h-[120px]"
              />
            </div>
            <div>
              <label className="block font-mono text-xs text-[#888] mb-1">Sender Name/Title</label>
              <input
                type="text"
                value={letterContent.sender}
                onChange={(e) => setLetterContent({ ...letterContent, sender: e.target.value })}
                className="w-full bg-[#2a2a2a] border border-[#444] text-[#eee] px-3 py-2 font-mono text-sm"
              />
            </div>
          </div>

          <button
            onClick={downloadLetter}
            disabled={downloading}
            className="bg-[#d4af37] text-[#1a1a1a] px-6 py-2 font-mono text-sm hover:bg-[#c4a030] disabled:opacity-50"
          >
            {downloading ? "GENERATING..." : "DOWNLOAD AS IMAGE"}
          </button>
        </div>

        {/* The Letter */}
        <div
          ref={letterRef}
          className="relative mx-auto"
          style={{
            width: "700px",
            minHeight: "900px",
            background: "linear-gradient(135deg, #f5e6c8 0%, #e8d4a8 25%, #f2e2bc 50%, #e5d0a0 75%, #f0deb5 100%)",
            padding: "60px",
            fontFamily: "'Courier New', Courier, monospace",
            color: "#2c2416",
            boxShadow: "0 4px 30px rgba(0,0,0,0.3), inset 0 0 100px rgba(139,109,56,0.1)",
            border: "1px solid #c4a35a",
          }}
        >
          {/* Paper texture overlay */}
          <div
            className="absolute inset-0 pointer-events-none opacity-30"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
            }}
          />

          {/* Coffee stain effect */}
          <div
            className="absolute opacity-10 pointer-events-none"
            style={{
              width: "120px",
              height: "120px",
              borderRadius: "50%",
              background: "radial-gradient(ellipse at center, #8b6914 0%, transparent 70%)",
              top: "15%",
              right: "10%",
            }}
          />

          {/* Classification stamp top */}
          <div
            className="absolute text-center"
            style={{
              top: "20px",
              left: "50%",
              transform: "translateX(-50%) rotate(-3deg)",
              border: "3px solid #8b0000",
              padding: "5px 20px",
              color: "#8b0000",
              fontWeight: "bold",
              fontSize: "18px",
              letterSpacing: "4px",
            }}
          >
            {letterContent.classification}
          </div>

          {/* Ouroboros Symbol */}
          <div className="text-center mb-4 mt-8 flex justify-center">
            <OuroborosSVG size={60} color="#2c2416" />
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <div
              style={{
                fontSize: "16px",
                letterSpacing: "6px",
                marginBottom: "5px",
                fontWeight: "bold",
              }}
            >
              THE OUROBOROS FOUNDATION
            </div>
            <div
              style={{
                fontSize: "10px",
                letterSpacing: "4px",
                color: "#5a4a2a",
                fontStyle: "italic",
              }}
            >
              &ldquo;THAT WHICH CONSUMES ITSELF SHALL BE REBORN&rdquo;
            </div>
            <div
              style={{
                width: "250px",
                height: "2px",
                background: "linear-gradient(90deg, transparent, #8b7355, transparent)",
                margin: "15px auto",
              }}
            />
            <div
              style={{
                fontSize: "9px",
                letterSpacing: "3px",
                color: "#6a5a3a",
              }}
            >
              INNER CIRCLE CORRESPONDENCE
            </div>
          </div>

          {/* Date and Reference */}
          <div className="flex justify-between mb-8" style={{ fontSize: "12px" }}>
            <div style={{ color: "#5a4a2a" }}>
              REF: {refNumber}
            </div>
            <div>{formattedDate}</div>
          </div>

          {/* Recipient */}
          <div className="mb-6" style={{ fontSize: "14px" }}>
            <div>{letterContent.salutation} {letterContent.recipient},</div>
          </div>

          {/* Body */}
          <div
            className="mb-8 whitespace-pre-wrap"
            style={{
              fontSize: "14px",
              lineHeight: "1.8",
              textAlign: "justify",
              textIndent: "40px",
            }}
          >
            {letterContent.body}
          </div>

          {/* Closing */}
          <div className="mt-12" style={{ fontSize: "14px" }}>
            <div className="mb-8">{letterContent.closing}</div>
            <div
              style={{
                fontFamily: "'Brush Script MT', cursive",
                fontSize: "28px",
                color: "#1a1a2e",
                marginBottom: "5px",
              }}
            >
              {letterContent.sender.split(" ")[0]}
            </div>
            <div style={{ borderTop: "1px solid #2c2416", width: "200px", paddingTop: "5px" }}>
              {letterContent.sender}
            </div>
          </div>

          {/* Wax Seal */}
          <div
            className="absolute flex items-center justify-center"
            style={{
              bottom: "70px",
              right: "60px",
              width: "80px",
              height: "80px",
              borderRadius: "50%",
              background: "radial-gradient(circle at 30% 30%, #8b2500, #5c1a00 50%, #3d1100)",
              boxShadow: "inset 0 2px 4px rgba(255,255,255,0.2), inset 0 -2px 4px rgba(0,0,0,0.3), 2px 2px 8px rgba(0,0,0,0.4)",
            }}
          >
            <WaxSealOuroboros />
          </div>

          {/* Bottom classification */}
          <div
            className="absolute text-center"
            style={{
              bottom: "20px",
              left: "50%",
              transform: "translateX(-50%) rotate(2deg)",
              border: "3px solid #8b0000",
              padding: "5px 20px",
              color: "#8b0000",
              fontWeight: "bold",
              fontSize: "18px",
              letterSpacing: "4px",
            }}
          >
            {letterContent.classification}
          </div>

          {/* Fold lines */}
          <div
            className="absolute left-0 right-0 pointer-events-none"
            style={{
              top: "33%",
              height: "1px",
              background: "linear-gradient(90deg, transparent, rgba(139,115,85,0.3), transparent)",
            }}
          />
          <div
            className="absolute left-0 right-0 pointer-events-none"
            style={{
              top: "66%",
              height: "1px",
              background: "linear-gradient(90deg, transparent, rgba(139,115,85,0.3), transparent)",
            }}
          />

          {/* Corner wear */}
          <div
            className="absolute pointer-events-none"
            style={{
              top: 0,
              right: 0,
              width: "50px",
              height: "50px",
              background: "linear-gradient(135deg, transparent 50%, rgba(139,115,85,0.2) 50%)",
            }}
          />
        </div>

        <p className="text-center font-mono text-xs text-[#666] mt-4">
          Right-click the letter to save as image, or use the download button above
        </p>
      </div>
    </div>
  );
}
