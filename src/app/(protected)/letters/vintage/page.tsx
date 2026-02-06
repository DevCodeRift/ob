"use client";

import { useState, useRef, useMemo } from "react";
import Image from "next/image";

const DOCUMENT_TYPES = {
  internal: {
    label: "Internal Memorandum",
    subtitle: "INNER CIRCLE CORRESPONDENCE",
    showClassification: true,
    showBurnNotice: true,
  },
  decree: {
    label: "Official Decree",
    subtitle: "BY ORDER OF THE FOUNDATION",
    showClassification: true,
    showBurnNotice: false,
  },
  summons: {
    label: "Summons",
    subtitle: "MANDATORY ATTENDANCE REQUIRED",
    showClassification: true,
    showBurnNotice: true,
  },
  pressRelease: {
    label: "Public Press Release",
    subtitle: "FOR IMMEDIATE RELEASE",
    showClassification: false,
    showBurnNotice: false,
  },
  commendation: {
    label: "Certificate of Commendation",
    subtitle: "IN RECOGNITION OF SERVICE",
    showClassification: false,
    showBurnNotice: false,
  },
  warning: {
    label: "Official Warning",
    subtitle: "DISCIPLINARY NOTICE",
    showClassification: true,
    showBurnNotice: true,
  },
  invitation: {
    label: "Formal Invitation",
    subtitle: "YOUR PRESENCE IS REQUESTED",
    showClassification: true,
    showBurnNotice: false,
  },
};

const CLASSIFICATIONS = [
  "EYES ONLY",
  "COVENANT SEALED",
  "ARCHMAGOS CLEARANCE",
  "INNER CIRCLE",
  "RESTRICTED",
  "CLASSIFIED",
  "TOP SECRET - SERPENT",
  "UMBRA LEVEL",
];

const DEPARTMENTS = [
  "Office of the Archmagos",
  "Department of Arcane Studies",
  "Bureau of Internal Affairs",
  "Division of External Operations",
  "Council of Elders",
  "Archives & Records",
  "Treasury & Acquisitions",
  "Security Directorate",
  "Research & Development",
  "Personnel & Initiations",
];

const CLOSINGS = [
  "In eternal cycle,",
  "The Serpent watches,",
  "By the Covenant bound,",
  "In shadow and light,",
  "Until the cycle renews,",
  "Sub umbra serpentis,",
  "Per aspera ad astra,",
  "Fiat lux in tenebris,",
  "Yours in perpetuity,",
  "With serpentine regards,",
];

const LATIN_PHRASES = [
  { phrase: "In Perpetuum", meaning: "Forever" },
  { phrase: "Sub Rosa", meaning: "In secret" },
  { phrase: "Memento Mori", meaning: "Remember death" },
  { phrase: "Veritas Lux", meaning: "Truth is light" },
  { phrase: "Vincit Omnia", meaning: "Conquers all" },
  { phrase: "Nil Desperandum", meaning: "Never despair" },
];

const SAMPLE_BODIES = {
  internal: "We regret to inform you that your recent request has been denied pursuant to Covenant Protocol VII.\n\nFurther inquiries regarding this matter are to be directed to the Inner Circle.\n\nThis correspondence shall be consumed by flame upon reading. The Serpent watches.",
  decree: "LET IT BE KNOWN to all members of the Foundation that by this decree, effective immediately, the following directive shall be enacted and enforced without exception.\n\nAll personnel are hereby commanded to observe and comply with the terms herein. Failure to do so shall result in disciplinary measures as prescribed by the Covenant.",
  summons: "You are hereby SUMMONED to appear before the Council at the appointed hour.\n\nYour attendance is MANDATORY. Failure to appear shall be considered an act of defiance against the Covenant itself.\n\nCome prepared to account for your actions. Bring no witnesses.",
  pressRelease: "The Ouroboros Foundation is pleased to announce the successful completion of Project ETERNAL DAWN.\n\nThis milestone represents years of dedicated research and unwavering commitment to our founding principles. We extend our gratitude to all contributors and partners who made this achievement possible.\n\nFor press inquiries, contact the Office of External Communications.",
  commendation: "In recognition of exceptional service to the Foundation and unwavering dedication to the principles of the Covenant, this commendation is hereby bestowed.\n\nYour contributions have not gone unnoticed. The Serpent remembers those who serve faithfully.\n\nMay this honor inspire continued excellence in all your endeavors.",
  warning: "This notice serves as an OFFICIAL WARNING regarding your recent conduct.\n\nYour actions have been found to be in violation of Foundation protocols. Consider this your first and final warning.\n\nFurther infractions shall result in immediate review by the Disciplinary Council. The Serpent does not forgive twice.",
  invitation: "The pleasure of your company is formally requested at the upcoming gathering of the Inner Circle.\n\nDress code: Formal attire befitting your rank. Arrive promptly; the doors seal at the appointed hour.\n\nRSVP not required. Your presence has already been foreseen.",
};

export default function VintageLetterPage() {
  const letterRef = useRef<HTMLDivElement>(null);
  const templateRef = useRef<HTMLDivElement>(null);
  const [documentType, setDocumentType] = useState<keyof typeof DOCUMENT_TYPES>("internal");
  const [letterContent, setLetterContent] = useState({
    recipient: "Adept",
    salutation: "Dear",
    body: SAMPLE_BODIES.internal,
    closing: "In eternal cycle,",
    sender: "Archmagos of the Foundation",
    senderTitle: "Supreme Commander",
    classification: "EYES ONLY",
    department: "Office of the Archmagos",
    latinMotto: "In Perpetuum",
    protocolRef: "VII",
    showWatermark: true,
    showSeal: true,
    includeLatinFooter: true,
  });
  const [downloading, setDownloading] = useState(false);
  const [downloadingBg, setDownloadingBg] = useState(false);

  const docConfig = DOCUMENT_TYPES[documentType];

  // Get today's date but with 1942
  const today = new Date();
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const formattedDate = `${months[today.getMonth()]} ${today.getDate()}, 1942`;

  // Stable reference number
  const refNumber = useMemo(() => {
    const prefix = documentType === "pressRelease" ? "PR" : documentType === "decree" ? "DC" : "OBF";
    return `${prefix}-${String(today.getMonth() + 1).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}-${Math.floor(Math.random() * 9000) + 1000}`;
  }, [documentType]);

  // US Letter size at 150 DPI = 1275 x 1650 px
  const BG_WIDTH = 1275;
  const BG_HEIGHT = 1650;

  function handleDocumentTypeChange(type: keyof typeof DOCUMENT_TYPES) {
    setDocumentType(type);
    setLetterContent(prev => ({
      ...prev,
      body: SAMPLE_BODIES[type],
    }));
  }

  async function downloadLetter() {
    if (!letterRef.current) return;
    setDownloading(true);

    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(letterRef.current, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
      });

      const link = document.createElement("a");
      link.download = `ouroboros-${documentType}-${Date.now()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (error) {
      console.error("Failed to download:", error);
      alert("Failed to generate image. Please take a screenshot instead.");
    } finally {
      setDownloading(false);
    }
  }

  async function downloadBackground() {
    if (!templateRef.current) return;
    setDownloadingBg(true);

    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(templateRef.current, {
        backgroundColor: null,
        scale: 1,
        useCORS: true,
        width: BG_WIDTH,
        height: BG_HEIGHT,
      });

      const link = document.createElement("a");
      link.download = `ouroboros-template-${documentType}-${Date.now()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (error) {
      console.error("Failed to download background:", error);
      alert("Failed to generate background. Please try again.");
    } finally {
      setDownloadingBg(false);
    }
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-5xl mx-auto px-4">
        {/* Controls */}
        <div className="mb-8 space-y-4">
          <h1 className="font-mono text-xl text-gold tracking-widest">ARCHIVAL CORRESPONDENCE</h1>
          <p className="font-mono text-xs text-muted">Generate classified documents in the style of the Ouroboros Foundation, circa 1942</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Document Type */}
            <div>
              <label className="form-label">Document Type</label>
              <select
                value={documentType}
                onChange={(e) => handleDocumentTypeChange(e.target.value as keyof typeof DOCUMENT_TYPES)}
                className="input"
              >
                {Object.entries(DOCUMENT_TYPES).map(([key, val]) => (
                  <option key={key} value={key}>{val.label}</option>
                ))}
              </select>
            </div>

            {/* Classification - only if document type shows it */}
            {docConfig.showClassification && (
              <div>
                <label className="form-label">Classification</label>
                <select
                  value={letterContent.classification}
                  onChange={(e) => setLetterContent({ ...letterContent, classification: e.target.value })}
                  className="input"
                >
                  {CLASSIFICATIONS.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Department */}
            <div>
              <label className="form-label">Department / Office</label>
              <select
                value={letterContent.department}
                onChange={(e) => setLetterContent({ ...letterContent, department: e.target.value })}
                className="input"
              >
                {DEPARTMENTS.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            {/* Recipient */}
            <div>
              <label className="form-label">Recipient Name/Title</label>
              <input
                type="text"
                value={letterContent.recipient}
                onChange={(e) => setLetterContent({ ...letterContent, recipient: e.target.value })}
                className="input"
              />
            </div>

            {/* Salutation */}
            <div>
              <label className="form-label">Salutation</label>
              <input
                type="text"
                value={letterContent.salutation}
                onChange={(e) => setLetterContent({ ...letterContent, salutation: e.target.value })}
                className="input"
              />
            </div>

            {/* Closing */}
            <div>
              <label className="form-label">Closing</label>
              <select
                value={letterContent.closing}
                onChange={(e) => setLetterContent({ ...letterContent, closing: e.target.value })}
                className="input"
              >
                {CLOSINGS.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Body */}
            <div className="md:col-span-3">
              <label className="form-label">Letter Body</label>
              <textarea
                value={letterContent.body}
                onChange={(e) => setLetterContent({ ...letterContent, body: e.target.value })}
                className="input min-h-[150px]"
              />
            </div>

            {/* Sender Name */}
            <div>
              <label className="form-label">Sender Name</label>
              <input
                type="text"
                value={letterContent.sender}
                onChange={(e) => setLetterContent({ ...letterContent, sender: e.target.value })}
                className="input"
              />
            </div>

            {/* Sender Title */}
            <div>
              <label className="form-label">Sender Title</label>
              <input
                type="text"
                value={letterContent.senderTitle}
                onChange={(e) => setLetterContent({ ...letterContent, senderTitle: e.target.value })}
                className="input"
              />
            </div>

            {/* Latin Motto */}
            <div>
              <label className="form-label">Latin Motto</label>
              <select
                value={letterContent.latinMotto}
                onChange={(e) => setLetterContent({ ...letterContent, latinMotto: e.target.value })}
                className="input"
              >
                {LATIN_PHRASES.map(l => (
                  <option key={l.phrase} value={l.phrase}>{l.phrase} ({l.meaning})</option>
                ))}
              </select>
            </div>

            {/* Protocol Reference */}
            {docConfig.showClassification && (
              <div>
                <label className="form-label">Protocol Reference</label>
                <input
                  type="text"
                  value={letterContent.protocolRef}
                  onChange={(e) => setLetterContent({ ...letterContent, protocolRef: e.target.value })}
                  className="input"
                  placeholder="VII"
                />
              </div>
            )}

            {/* Checkboxes */}
            <div className="md:col-span-2 flex flex-wrap gap-6">
              <label className="flex items-center gap-2 font-mono text-sm text-muted cursor-pointer">
                <input
                  type="checkbox"
                  checked={letterContent.showWatermark}
                  onChange={(e) => setLetterContent({ ...letterContent, showWatermark: e.target.checked })}
                  className="accent-gold"
                />
                Show Watermark
              </label>
              <label className="flex items-center gap-2 font-mono text-sm text-muted cursor-pointer">
                <input
                  type="checkbox"
                  checked={letterContent.showSeal}
                  onChange={(e) => setLetterContent({ ...letterContent, showSeal: e.target.checked })}
                  className="accent-gold"
                />
                Show Wax Seal
              </label>
              <label className="flex items-center gap-2 font-mono text-sm text-muted cursor-pointer">
                <input
                  type="checkbox"
                  checked={letterContent.includeLatinFooter}
                  onChange={(e) => setLetterContent({ ...letterContent, includeLatinFooter: e.target.checked })}
                  className="accent-gold"
                />
                Include Latin Footer
              </label>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={downloadLetter}
              disabled={downloading}
              className="btn btn-primary"
            >
              {downloading ? "GENERATING..." : "DOWNLOAD AS IMAGE"}
            </button>
            <button
              onClick={downloadBackground}
              disabled={downloadingBg}
              className="btn btn-primary"
              style={{ background: "#5a4a2a" }}
            >
              {downloadingBg ? "GENERATING..." : "DOWNLOAD BACKGROUND (for Google Docs)"}
            </button>
          </div>
        </div>

        {/* The Letter */}
        <div
          ref={letterRef}
          className="relative mx-auto"
          style={{
            width: "700px",
            minHeight: "950px",
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

          {/* Watermark */}
          {letterContent.showWatermark && (
            <div
              className="absolute pointer-events-none flex items-center justify-center"
              style={{
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                opacity: 0.06,
              }}
            >
              <Image
                src="/FNP_blog_uroboro_1.png"
                alt="Watermark"
                width={400}
                height={400}
                style={{ filter: "grayscale(100%)" }}
              />
            </div>
          )}

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

          {/* Classification stamp top - only for classified documents */}
          {docConfig.showClassification && (
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
                fontSize: "16px",
                letterSpacing: "3px",
              }}
            >
              {letterContent.classification}
            </div>
          )}

          {/* Ouroboros Logo */}
          <div className="text-center mb-2 mt-8 flex justify-center">
            <Image
              src="/FNP_blog_uroboro_1.png"
              alt="Ouroboros"
              width={70}
              height={70}
              style={{ filter: "contrast(1.2)" }}
            />
          </div>

          {/* Header */}
          <div className="text-center mb-6">
            <div
              style={{
                fontSize: "15px",
                letterSpacing: "5px",
                marginBottom: "4px",
                fontWeight: "bold",
              }}
            >
              THE OUROBOROS FOUNDATION
            </div>
            <div
              style={{
                fontSize: "9px",
                letterSpacing: "3px",
                color: "#5a4a2a",
                fontStyle: "italic",
                marginBottom: "4px",
              }}
            >
              &ldquo;THAT WHICH CONSUMES ITSELF SHALL BE REBORN&rdquo;
            </div>
            <div
              style={{
                fontSize: "8px",
                letterSpacing: "2px",
                color: "#7a6a4a",
              }}
            >
              {letterContent.department.toUpperCase()}
            </div>
            <div
              style={{
                width: "250px",
                height: "2px",
                background: "linear-gradient(90deg, transparent, #8b7355, transparent)",
                margin: "12px auto",
              }}
            />
            <div
              style={{
                fontSize: "10px",
                letterSpacing: "3px",
                color: "#6a5a3a",
                fontWeight: "bold",
              }}
            >
              {docConfig.subtitle}
            </div>
          </div>

          {/* Date, Reference, and Protocol */}
          <div className="flex justify-between mb-6" style={{ fontSize: "11px" }}>
            <div>
              <div style={{ color: "#5a4a2a" }}>REF: {refNumber}</div>
              {docConfig.showClassification && letterContent.protocolRef && (
                <div style={{ color: "#5a4a2a", marginTop: "2px" }}>
                  PROTOCOL: {letterContent.protocolRef}
                </div>
              )}
            </div>
            <div style={{ textAlign: "right" }}>
              <div>{formattedDate}</div>
              <div style={{ color: "#5a4a2a", marginTop: "2px", fontStyle: "italic" }}>
                {letterContent.latinMotto}
              </div>
            </div>
          </div>

          {/* Recipient */}
          <div className="mb-5" style={{ fontSize: "13px" }}>
            <div>{letterContent.salutation} {letterContent.recipient},</div>
          </div>

          {/* Body */}
          <div
            className="mb-6 whitespace-pre-wrap"
            style={{
              fontSize: "13px",
              lineHeight: "1.75",
              textAlign: "justify",
              textIndent: "35px",
            }}
          >
            {letterContent.body}
          </div>

          {/* Burn notice - only for certain document types */}
          {docConfig.showBurnNotice && (
            <div
              className="mb-6 text-center"
              style={{
                fontSize: "9px",
                color: "#8b0000",
                letterSpacing: "2px",
                fontStyle: "italic",
              }}
            >
              *** DESTROY AFTER READING - DO NOT COPY OR RETAIN ***
            </div>
          )}

          {/* Closing */}
          <div className="mt-8" style={{ fontSize: "13px" }}>
            <div className="mb-6">{letterContent.closing}</div>
            <div
              style={{
                fontFamily: "'Brush Script MT', cursive",
                fontSize: "26px",
                color: "#1a1a2e",
                marginBottom: "4px",
              }}
            >
              {letterContent.sender.split(" ")[0]}
            </div>
            <div style={{ borderTop: "1px solid #2c2416", width: "220px", paddingTop: "4px" }}>
              <div style={{ fontWeight: "bold" }}>{letterContent.sender}</div>
              <div style={{ fontSize: "11px", color: "#5a4a2a" }}>{letterContent.senderTitle}</div>
              <div style={{ fontSize: "10px", color: "#6a5a3a", fontStyle: "italic" }}>{letterContent.department}</div>
            </div>
          </div>

          {/* Wax Seal with actual image */}
          {letterContent.showSeal && (
            <div
              className="absolute flex items-center justify-center"
              style={{
                bottom: "80px",
                right: "50px",
                width: "85px",
                height: "85px",
                borderRadius: "50%",
                background: "radial-gradient(circle at 30% 30%, #8b2500, #5c1a00 50%, #3d1100)",
                boxShadow: "inset 0 2px 4px rgba(255,255,255,0.2), inset 0 -2px 4px rgba(0,0,0,0.3), 2px 2px 8px rgba(0,0,0,0.4)",
                overflow: "hidden",
              }}
            >
              <Image
                src="/FNP_blog_uroboro_1.png"
                alt="Seal"
                width={55}
                height={55}
                style={{ filter: "brightness(1.5) contrast(0.8)", opacity: 0.7 }}
              />
            </div>
          )}

          {/* Bottom classification - only for classified documents */}
          {docConfig.showClassification && (
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
                fontSize: "16px",
                letterSpacing: "3px",
              }}
            >
              {letterContent.classification}
            </div>
          )}

          {/* Latin footer */}
          {letterContent.includeLatinFooter && !docConfig.showClassification && (
            <div
              className="absolute text-center"
              style={{
                bottom: "25px",
                left: "50%",
                transform: "translateX(-50%)",
                fontSize: "10px",
                letterSpacing: "4px",
                color: "#6a5a3a",
                fontStyle: "italic",
              }}
            >
              {letterContent.latinMotto} &bull; ANNO DOMINI MCMXLII
            </div>
          )}

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

        <p className="text-center font-mono text-xs text-muted mt-4">
          Right-click the letter to save as image, or use the download button above
        </p>
      </div>

      {/* Hidden offscreen template for background export — US Letter 8.5x11" at 150 DPI */}
      <div style={{ position: "fixed", left: "-9999px", top: 0 }}>
        <div
          ref={templateRef}
          className="relative"
          style={{
            width: `${BG_WIDTH}px`,
            height: `${BG_HEIGHT}px`,
            background: "linear-gradient(135deg, #f5e6c8 0%, #e8d4a8 25%, #f2e2bc 50%, #e5d0a0 75%, #f0deb5 100%)",
            fontFamily: "'Courier New', Courier, monospace",
            color: "#2c2416",
            overflow: "hidden",
          }}
        >
          {/* Paper texture */}
          <div
            className="absolute inset-0 pointer-events-none opacity-30"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter2'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter2)'/%3E%3C/svg%3E")`,
            }}
          />

          {/* Watermark */}
          {letterContent.showWatermark && (
            <div
              className="absolute pointer-events-none flex items-center justify-center"
              style={{
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                opacity: 0.06,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/FNP_blog_uroboro_1.png"
                alt=""
                width={700}
                height={700}
                style={{ filter: "grayscale(100%)" }}
              />
            </div>
          )}

          {/* Coffee stain */}
          <div
            className="absolute opacity-10 pointer-events-none"
            style={{
              width: "200px",
              height: "200px",
              borderRadius: "50%",
              background: "radial-gradient(ellipse at center, #8b6914 0%, transparent 70%)",
              top: "15%",
              right: "10%",
            }}
          />

          {/* Classification stamp top */}
          {docConfig.showClassification && (
            <div
              className="absolute text-center"
              style={{
                top: "35px",
                left: "50%",
                transform: "translateX(-50%) rotate(-3deg)",
                border: "4px solid #8b0000",
                padding: "8px 35px",
                color: "#8b0000",
                fontWeight: "bold",
                fontSize: "24px",
                letterSpacing: "5px",
              }}
            >
              {letterContent.classification}
            </div>
          )}

          {/* Logo */}
          <div style={{ textAlign: "center", marginTop: "100px", marginBottom: "8px" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/FNP_blog_uroboro_1.png"
              alt=""
              width={120}
              height={120}
              style={{ filter: "contrast(1.2)", display: "inline-block" }}
            />
          </div>

          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: "30px" }}>
            <div
              style={{
                fontSize: "26px",
                letterSpacing: "8px",
                marginBottom: "8px",
                fontWeight: "bold",
              }}
            >
              THE OUROBOROS FOUNDATION
            </div>
            <div
              style={{
                fontSize: "14px",
                letterSpacing: "5px",
                color: "#5a4a2a",
                fontStyle: "italic",
                marginBottom: "8px",
              }}
            >
              &ldquo;THAT WHICH CONSUMES ITSELF SHALL BE REBORN&rdquo;
            </div>
            <div
              style={{
                fontSize: "13px",
                letterSpacing: "4px",
                color: "#7a6a4a",
              }}
            >
              {letterContent.department.toUpperCase()}
            </div>
            <div
              style={{
                width: "420px",
                height: "3px",
                background: "linear-gradient(90deg, transparent, #8b7355, transparent)",
                margin: "20px auto",
              }}
            />
            <div
              style={{
                fontSize: "16px",
                letterSpacing: "5px",
                color: "#6a5a3a",
                fontWeight: "bold",
              }}
            >
              {docConfig.subtitle}
            </div>
          </div>

          {/* Wax Seal */}
          {letterContent.showSeal && (
            <div
              className="absolute flex items-center justify-center"
              style={{
                bottom: "120px",
                right: "80px",
                width: "140px",
                height: "140px",
                borderRadius: "50%",
                background: "radial-gradient(circle at 30% 30%, #8b2500, #5c1a00 50%, #3d1100)",
                boxShadow: "inset 0 3px 6px rgba(255,255,255,0.2), inset 0 -3px 6px rgba(0,0,0,0.3), 3px 3px 12px rgba(0,0,0,0.4)",
                overflow: "hidden",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/FNP_blog_uroboro_1.png"
                alt=""
                width={90}
                height={90}
                style={{ filter: "brightness(1.5) contrast(0.8)", opacity: 0.7 }}
              />
            </div>
          )}

          {/* Bottom classification stamp */}
          {docConfig.showClassification && (
            <div
              className="absolute text-center"
              style={{
                bottom: "35px",
                left: "50%",
                transform: "translateX(-50%) rotate(2deg)",
                border: "4px solid #8b0000",
                padding: "8px 35px",
                color: "#8b0000",
                fontWeight: "bold",
                fontSize: "24px",
                letterSpacing: "5px",
              }}
            >
              {letterContent.classification}
            </div>
          )}

          {/* Latin footer */}
          {letterContent.includeLatinFooter && !docConfig.showClassification && (
            <div
              className="absolute text-center"
              style={{
                bottom: "40px",
                left: "50%",
                transform: "translateX(-50%)",
                fontSize: "16px",
                letterSpacing: "6px",
                color: "#6a5a3a",
                fontStyle: "italic",
              }}
            >
              {letterContent.latinMotto} &bull; ANNO DOMINI MCMXLII
            </div>
          )}

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
              width: "80px",
              height: "80px",
              background: "linear-gradient(135deg, transparent 50%, rgba(139,115,85,0.2) 50%)",
            }}
          />
        </div>
      </div>
    </div>
  );
}
