"use client";
import { useState } from "react";

export default function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div onClick={handleCopy} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(0,0,0,0.03)", padding: "12px 16px", borderRadius: "15px", cursor: "pointer" }}>
      <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#1d1d1f", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "70%" }}>{text}</span>
      <div style={{ background: "#0071e3", color: "white", fontSize: "0.7rem", fontWeight: 800, padding: "8px 14px", borderRadius: "10px" }}>{copied ? "COPIED!" : label}</div>
    </div>
  );
}
