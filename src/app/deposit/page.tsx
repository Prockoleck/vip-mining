"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import WalletQR from "@/components/WalletQR";

const WALLET = process.env.NEXT_PUBLIC_DEPOSIT_WALLET || "0x153777e1127BBa3a0C7bD88CD04EC61468e2628D";
const EXPIRY_SECONDS = 30 * 60;

export default function DepositPage() {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState<"form" | "waiting" | "approved" | "expired">("form");
  const [depositAmount, setDepositAmount] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(EXPIRY_SECONDS);
  const [mockMode, setMockMode] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (phase !== "waiting") return;

    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          setPhase("expired");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    const poll = setInterval(async () => {
      try {
        const res = await fetch("/api/deposit-check");
        const data = await res.json();
        if (data.mock) setMockMode(true);
        if (data.status === "approved") {
          if (timerRef.current) clearInterval(timerRef.current);
          clearInterval(poll);
          setPhase("approved");
          setTimeout(() => router.push("/dashboard"), 2500);
        } else if (data.status === "no_pending") {
          if (timerRef.current) clearInterval(timerRef.current);
          clearInterval(poll);
          setPhase("expired");
        } else if (data.seconds_left !== undefined) {
          setSecondsLeft(data.seconds_left);
        }
      } catch {}
    }, 15000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      clearInterval(poll);
    };
  }, [phase, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (val < 10) { alert("Minimum deposit is 10 USDT."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: val }),
      });
      if (res.ok) {
        setDepositAmount(val);
        setSecondsLeft(EXPIRY_SECONDS);
        setPhase("waiting");
      } else {
        const data = await res.json();
        alert("Error: " + (data.error || "Failed"));
      }
    } catch { alert("Network error"); }
    finally { setLoading(false); }
  };

  const copyAddr = () => {
    navigator.clipboard.writeText(WALLET);
    alert("Address Copied! Use BEP20 network only.");
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  if (phase === "approved") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div className="aurora-bg"><div className="blob b1" /><div className="blob b2" /></div>
        <div style={{ textAlign: "center", zIndex: 1 }}>
          <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "linear-gradient(135deg, #34d399, #10b981)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", boxShadow: "0 15px 40px rgba(16,185,129,0.3)" }}>
            <i className="fa-solid fa-check" style={{ fontSize: "2rem", color: "white" }} />
          </div>
          <h2 style={{ fontWeight: 800, fontSize: "1.5rem", marginBottom: "8px" }}>Deposit Approved!</h2>
          <p style={{ color: "#86868b", fontSize: "0.85rem" }}>Redirecting to dashboard...</p>
          {mockMode && <p style={{ color: "#f59e0b", fontSize: "0.7rem", marginTop: "10px", fontWeight: 700 }}>MOCK MODE — No real blockchain check</p>}
        </div>
      </div>
    );
  }

  if (phase === "expired") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div className="aurora-bg"><div className="blob b1" /><div className="blob b2" /></div>
        <div style={{ textAlign: "center", zIndex: 1, padding: "0 24px" }}>
          <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "linear-gradient(135deg, #f43f5e, #e11d48)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", boxShadow: "0 15px 40px rgba(244,63,94,0.3)" }}>
            <i className="fa-solid fa-xmark" style={{ fontSize: "2rem", color: "white" }} />
          </div>
          <h2 style={{ fontWeight: 800, fontSize: "1.5rem", marginBottom: "8px" }}>Deposit Expired</h2>
          <p style={{ color: "#86868b", fontSize: "0.85rem", marginBottom: "25px" }}>The 30-minute detection window has passed. Your deposit is still pending — an admin will review it manually.</p>
          <button onClick={() => { setPhase("form"); setAmount(""); }} style={{ background: "#0071e3", color: "white", border: "none", padding: "16px 40px", borderRadius: "22px", fontWeight: 800, fontSize: "0.9rem", cursor: "pointer" }}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (phase === "waiting") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div className="aurora-bg"><div className="blob b1" /><div className="blob b2" /></div>
        <div style={{ width: "100%", maxWidth: "440px", padding: "30px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "25px" }}>
            <button onClick={() => { if (timerRef.current) clearInterval(timerRef.current); setPhase("form"); setAmount(""); }} style={{ width: "45px", height: "45px", background: "rgba(255,255,255,0.7)", borderRadius: "15px", display: "flex", alignItems: "center", justifyContent: "center", color: "#1d1d1f", border: "1px solid rgba(255,255,255,0.8)", cursor: "pointer" }}>
              <i className="fa-solid fa-chevron-left" />
            </button>
            <h2 style={{ fontWeight: 800, fontSize: "1.1rem" }}>Waiting for Deposit</h2>
            <div style={{ width: "45px" }} />
          </div>

          {/* Status Card */}
          <div style={{ background: "rgba(255,255,255,0.7)", backdropFilter: "blur(30px)", border: "1px solid rgba(255,255,255,0.8)", borderRadius: "35px", padding: "30px 20px", boxShadow: "0 20px 40px rgba(0,0,0,0.05)", textAlign: "center" }}>
            {mockMode && (
              <div style={{ background: "#f59e0b20", border: "1px solid #f59e0b40", borderRadius: "12px", padding: "8px", marginBottom: "15px", fontSize: "0.7rem", fontWeight: 700, color: "#f59e0b" }}>
                MOCK MODE — Detection simulated
              </div>
            )}

            {/* Pulsing radar */}
            <div style={{ position: "relative", width: "80px", height: "80px", margin: "0 auto 20px" }}>
              <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "2px solid #0071e3", opacity: 0.3, animation: "ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite" }} />
              <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "2px solid #0071e3", opacity: 0.15, animation: "ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite 0.5s" }} />
              <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "linear-gradient(135deg, #0071e3, #34d399)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <i className="fa-solid fa-satellite-dish" style={{ fontSize: "1.8rem", color: "white" }} />
              </div>
            </div>

            <h3 style={{ fontWeight: 800, fontSize: "1.1rem", marginBottom: "5px" }}>Monitoring Blockchain</h3>
            <p style={{ color: "#86868b", fontSize: "0.75rem", marginBottom: "20px" }}>Auto-detecting your USDT transfer via BSCScan</p>

            {/* Amount */}
            <div style={{ background: "rgba(0,0,0,0.03)", borderRadius: "20px", padding: "15px", marginBottom: "15px" }}>
              <div style={{ fontSize: "0.65rem", color: "#86868b", fontWeight: 700, textTransform: "uppercase", marginBottom: "4px" }}>Send exactly</div>
              <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#0071e3" }}>${depositAmount.toFixed(2)} USDT</div>
            </div>

            {/* Wallet Address */}
            <div onClick={copyAddr} style={{ background: "rgba(0,0,0,0.03)", border: "1px dashed #0071e3", padding: "12px", borderRadius: "16px", marginBottom: "15px", cursor: "pointer", textAlign: "left" }}>
              <small style={{ display: "block", fontSize: "0.6rem", fontWeight: 800, color: "#0071e3", textTransform: "uppercase", marginBottom: "3px" }}>USDT BEP20 — Tap to copy</small>
              <span style={{ fontSize: "0.7rem", fontWeight: 700, wordBreak: "break-all", color: "#1d1d1f" }}>{WALLET}</span>
            </div>

            {/* Timer */}
            <div style={{ background: secondsLeft < 300 ? "rgba(244,63,94,0.1)" : "rgba(0,113,227,0.1)", borderRadius: "16px", padding: "12px", marginBottom: "15px" }}>
              <div style={{ fontSize: "0.6rem", color: "#86868b", fontWeight: 700, textTransform: "uppercase", marginBottom: "2px" }}>Detection window</div>
              <div style={{ fontSize: "1.6rem", fontWeight: 800, color: secondsLeft < 300 ? "#f43f5e" : "#0071e3", fontVariantNumeric: "tabular-nums" }}>
                {formatTime(secondsLeft)}
              </div>
            </div>

            <p style={{ fontSize: "0.65rem", color: "#94a3b8", lineHeight: 1.5 }}>
              Scanning every 15 seconds. Send <b>USDT (BEP20)</b> only.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div className="aurora-bg"><div className="blob b1" /><div className="blob b2" /></div>
      <div style={{ width: "100%", maxWidth: "440px", padding: "30px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "30px" }}>
          <a href="/dashboard" style={{ width: "45px", height: "45px", background: "rgba(255,255,255,0.7)", borderRadius: "15px", display: "flex", alignItems: "center", justifyContent: "center", color: "#1d1d1f", border: "1px solid rgba(255,255,255,0.8)", textDecoration: "none" }}>
            <i className="fa-solid fa-chevron-left" />
          </a>
          <h2 style={{ fontWeight: 800, fontSize: "1.2rem", letterSpacing: "-0.5px" }}>Recharge Assets</h2>
          <div style={{ width: "45px" }} />
        </div>

        <div style={{ background: "rgba(255,255,255,0.7)", backdropFilter: "blur(30px)", border: "1px solid rgba(255,255,255,0.8)", borderRadius: "35px", padding: "30px 20px", boxShadow: "0 20px 40px rgba(0,0,0,0.05)", textAlign: "center", animation: "fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1)" }}>
          <div style={{ margin: "0 auto 25px", display: "flex", justifyContent: "center" }}>
            <WalletQR wallet={WALLET} />
          </div>

          <div onClick={copyAddr} style={{ background: "rgba(0,0,0,0.03)", border: "1px dashed #0071e3", padding: "15px", borderRadius: "20px", marginBottom: "25px", cursor: "pointer", position: "relative", textAlign: "left" }}>
            <small style={{ display: "block", fontSize: "0.65rem", fontWeight: 800, color: "#0071e3", textTransform: "uppercase", marginBottom: "4px" }}>USDT BEP20 (BSC Network)</small>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, wordBreak: "break-all", color: "#1d1d1f", paddingRight: "30px", display: "block" }}>{WALLET}</span>
            <i className="fa-solid fa-copy" style={{ position: "absolute", right: "15px", top: "50%", transform: "translateY(-50%)", color: "#0071e3" }} />
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ textAlign: "left", marginBottom: "25px" }}>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 800, color: "#86868b", textTransform: "uppercase", marginLeft: "5px", marginBottom: "8px" }}>Amount to Recharge</label>
              <div style={{ position: "relative" }}>
                <i className="fa-solid fa-dollar-sign" style={{ position: "absolute", left: "18px", top: "50%", transform: "translateY(-50%)", color: "#0071e3" }} />
                <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
                  placeholder="10.00" required step="0.01"
                  style={{ width: "100%", padding: "18px 18px 18px 45px", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.8)", background: "rgba(255,255,255,0.5)", fontFamily: "inherit", fontSize: "1rem", fontWeight: 700, outline: "none", transition: "0.3s", boxSizing: "border-box" }} />
              </div>
            </div>
            <button type="submit" disabled={loading}
              style={{ width: "100%", background: "#0071e3", color: "#fff", border: "none", padding: "22px", borderRadius: "22px", fontWeight: 800, fontSize: "1rem", boxShadow: "0 15px 30px rgba(0, 113, 227, 0.3)", cursor: "pointer", marginTop: "10px" }}>
              {loading ? "PROCESSING..." : "Recharge Completed"}
            </button>
          </form>
        </div>

        <div style={{ marginTop: "25px", background: "#1d1d1f", borderRadius: "28px", padding: "20px", display: "flex", gap: "15px", color: "white" }}>
          <i className="fa-solid fa-circle-info" style={{ color: "#0071e3", fontSize: "1.1rem", marginTop: "2px" }} />
          <div>
            <p style={{ fontSize: "0.7rem", opacity: 0.8, lineHeight: 1.6, fontWeight: 500 }}>• Transfer <b style={{ color: "#0071e3" }}>USDT (BEP20)</b> only. Other tokens will be lost.</p>
            <p style={{ fontSize: "0.7rem", opacity: 0.8, lineHeight: 1.6, fontWeight: 500 }}>• Auto-detection: <b style={{ color: "#34d399" }}>30 min window</b> with 15s polling.</p>
            <p style={{ fontSize: "0.7rem", opacity: 0.8, lineHeight: 1.6, fontWeight: 500 }}>• Minimum amount: <b style={{ color: "#0071e3" }}>10 USDT</b>.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
