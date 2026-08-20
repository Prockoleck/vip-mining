"use client";
import { useState, useEffect } from "react";
import NavDock from "@/components/NavDock";

interface TeamData {
  total_team: number;
  total_comm: number;
  invite_link: string;
  lvl1: number;
  lvl2: number;
  lvl3: number;
  lvl4: number;
}

export default function TeamPage() {
  const [data, setData] = useState<TeamData | null>(null);

  useEffect(() => {
    fetch("/api/team").then(r => r.json()).then(setData);
  }, []);

  const copyRef = () => {
    if (data) {
      navigator.clipboard.writeText(data.invite_link);
      alert("Partner link secured to clipboard.");
    }
  };

  if (!data) return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}><p>Loading...</p></div>;

  const levels = [
    { icon: "fa-users", title: "Level 1 Members", sub: `${data.lvl1} Direct Partners`, badge: "5% REWARD", anim: 0.3 },
    { icon: "fa-network-wired", title: "Level 2 Members", sub: `${data.lvl2} Secondary Partners`, badge: "3% REWARD", anim: 0.4 },
    { icon: "fa-sitemap", title: "Level 3 Members", sub: `${data.lvl3} Ternary Partners`, badge: "1% REWARD", anim: 0.5 },
    { icon: "fa-diagram-project", title: "Level 4 Members", sub: `${data.lvl4} Quaternary Partners`, badge: "$0.25 FLAT", anim: 0.6 },
  ];

  return (
    <div style={{ minHeight: "100vh", paddingBottom: "140px", display: "flex", flexDirection: "column", alignItems: "center", overflowX: "hidden" }}>
      <div className="aurora-bg"><div className="blob b1" /><div className="blob b2" /></div>

      <div style={{ width: "100%", maxWidth: "440px", padding: "40px 24px" }}>
        {/* Hero */}
        <div style={{ textAlign: "center", marginBottom: "30px" }} className="animate-fadeInUp">
          <p style={{ fontSize: "0.75rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1.5px", color: "#86868b" }}>Total Nodes in Empire</p>
          <h1 style={{ fontSize: "3rem", fontWeight: 800, letterSpacing: "-2px", color: "#0071e3" }}>{data.total_team}</h1>
        </div>

        {/* Commission Card */}
        <div style={{ background: "linear-gradient(135deg, #1d1d1f, #3a3a3c)", padding: "30px", borderRadius: "35px", color: "white", boxShadow: "0 20px 40px rgba(0,0,0,0.15)", marginBottom: "30px" }} className="animate-fadeInUp">
          <h4 style={{ fontSize: "0.7rem", textTransform: "uppercase", opacity: 0.7, letterSpacing: "1px" }}>Total Network Revenue</h4>
          <div style={{ fontSize: "2.2rem", fontWeight: 800, margin: "8px 0" }}>${data.total_comm.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
          <div style={{ fontSize: "0.75rem", opacity: 0.6, fontWeight: 600 }}>Aquired commission added to balance</div>
        </div>

        {/* Referral Link */}
        <div style={{ background: "rgba(255,255,255,0.7)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.8)", borderRadius: "25px", padding: "20px", marginBottom: "30px" }} className="animate-fadeInUp">
          <label style={{ fontSize: "0.65rem", fontWeight: 800, color: "#0071e3", textTransform: "uppercase", display: "block", marginBottom: "10px" }}>Invitation Protocol</label>
          <div onClick={copyRef} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(0,0,0,0.03)", padding: "12px 16px", borderRadius: "15px", cursor: "pointer" }}>
            <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#1d1d1f", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "70%" }}>{data.invite_link}</span>
            <div style={{ background: "#0071e3", color: "white", fontSize: "0.7rem", fontWeight: 800, padding: "8px 14px", borderRadius: "10px" }}>COPY LINK</div>
          </div>
        </div>

        {/* Level Stack */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {levels.map((lvl, i) => (
            <div key={i} style={{ background: "rgba(255,255,255,0.7)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.8)", borderRadius: "28px", padding: "22px", display: "flex", alignItems: "center", justifyContent: "space-between", animation: `slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${lvl.anim}s both` }}>
              <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                <div style={{ width: "45px", height: "45px", borderRadius: "14px", background: "rgba(0,113,227,0.1)", color: "#0071e3", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem" }}>
                  <i className={`fa-solid ${lvl.icon}`} />
                </div>
                <div>
                  <b style={{ display: "block", fontSize: "1rem", fontWeight: 800 }}>{lvl.title}</b>
                  <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#86868b" }}>{lvl.sub}</span>
                </div>
              </div>
              <div style={{ background: "#34c759", color: "white", fontSize: "0.65rem", fontWeight: 800, padding: "4px 10px", borderRadius: "8px" }}>{lvl.badge}</div>
            </div>
          ))}
        </div>
      </div>

      <NavDock />
    </div>
  );
}
