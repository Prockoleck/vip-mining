"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const WALLET = "0x153777e1127BBa3a0C7bD88CD04EC61468e2628D";

export default function DepositPage() {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (val < 50) {
      alert("Minimum deposit is 50 USDT.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: val }),
      });
      if (res.ok) {
        alert("Protocol Initiated! Funds will appear in 2-4 hours.");
        router.push("/dashboard");
      } else {
        const data = await res.json();
        alert("Error: " + (data.error || "Failed"));
      }
    } catch {
      alert("Network error");
    } finally {
      setLoading(false);
    }
  };

  const copyAddr = () => {
    navigator.clipboard.writeText(WALLET);
    alert("Address Copied! Use BEP20 network only.");
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div className="aurora-bg"><div className="blob b1" /><div className="blob b2" /></div>

      <div style={{ width: "100%", maxWidth: "440px", padding: "30px 24px" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "30px" }}>
          <a href="/dashboard" style={{ width: "45px", height: "45px", background: "rgba(255,255,255,0.7)", borderRadius: "15px", display: "flex", alignItems: "center", justifyContent: "center", color: "#1d1d1f", border: "1px solid rgba(255,255,255,0.8)", textDecoration: "none" }}>
            <i className="fa-solid fa-chevron-left" />
          </a>
          <h2 style={{ fontWeight: 800, fontSize: "1.2rem", letterSpacing: "-0.5px" }}>Recharge Assets</h2>
          <div style={{ width: "45px" }} />
        </div>

        {/* Deposit Card */}
        <div style={{ background: "rgba(255,255,255,0.7)", backdropFilter: "blur(30px)", border: "1px solid rgba(255,255,255,0.8)", borderRadius: "35px", padding: "30px 20px", boxShadow: "0 20px 40px rgba(0,0,0,0.05)", textAlign: "center", animation: "fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1)" }}>
          {/* QR Code */}
          <div style={{ width: "180px", height: "180px", margin: "0 auto 25px", padding: "15px", background: "#fff", borderRadius: "30px", boxShadow: "0 10px 30px rgba(0, 113, 227, 0.1)" }}>
            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${WALLET}`} alt="QR" style={{ width: "100%", borderRadius: "15px" }} />
          </div>

          {/* Address Box */}
          <div onClick={copyAddr} style={{ background: "rgba(0,0,0,0.03)", border: "1px dashed #0071e3", padding: "15px", borderRadius: "20px", marginBottom: "25px", cursor: "pointer", position: "relative", textAlign: "left" }}>
            <small style={{ display: "block", fontSize: "0.65rem", fontWeight: 800, color: "#0071e3", textTransform: "uppercase", marginBottom: "4px" }}>USDT BEP20 (BSC Network)</small>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, wordBreak: "break-all", color: "#1d1d1f", paddingRight: "30px", display: "block" }}>{WALLET}</span>
            <i className="fa-solid fa-copy" style={{ position: "absolute", right: "15px", top: "50%", transform: "translateY(-50%)", color: "#0071e3" }} />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div style={{ textAlign: "left", marginBottom: "25px" }}>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 800, color: "#86868b", textTransform: "uppercase", marginLeft: "5px", marginBottom: "8px" }}>Amount to Recharge</label>
              <div style={{ position: "relative" }}>
                <i className="fa-solid fa-dollar-sign" style={{ position: "absolute", left: "18px", top: "50%", transform: "translateY(-50%)", color: "#0071e3" }} />
                <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
                  placeholder="50.00" required step="0.01"
                  style={{ width: "100%", padding: "18px 18px 18px 45px", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.8)", background: "rgba(255,255,255,0.5)", fontFamily: "inherit", fontSize: "1rem", fontWeight: 700, outline: "none", transition: "0.3s", boxSizing: "border-box" }} />
              </div>
            </div>
            <button type="submit" disabled={loading}
              style={{ width: "100%", background: "#0071e3", color: "#fff", border: "none", padding: "22px", borderRadius: "22px", fontWeight: 800, fontSize: "1rem", boxShadow: "0 15px 30px rgba(0, 113, 227, 0.3)", cursor: "pointer", marginTop: "10px" }}>
              {loading ? "PROCESSING..." : "Recharge Completed"}
            </button>
          </form>
        </div>

        {/* Guidelines */}
        <div style={{ marginTop: "25px", background: "#1d1d1f", borderRadius: "28px", padding: "20px", display: "flex", gap: "15px", color: "white" }}>
          <i className="fa-solid fa-circle-info" style={{ color: "#0071e3", fontSize: "1.1rem", marginTop: "2px" }} />
          <div>
            <p style={{ fontSize: "0.7rem", opacity: 0.8, lineHeight: 1.6, fontWeight: 500 }}>• Transfer <b style={{ color: "#0071e3" }}>USDT (BEP20)</b> only. Other tokens will be lost.</p>
            <p style={{ fontSize: "0.7rem", opacity: 0.8, lineHeight: 1.6, fontWeight: 500 }}>• Verification time: <b style={{ color: "#0071e3" }}>2-4 hours</b> typically.</p>
            <p style={{ fontSize: "0.7rem", opacity: 0.8, lineHeight: 1.6, fontWeight: 500 }}>• Minimum amount: <b style={{ color: "#0071e3" }}>50 USDT</b>.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
