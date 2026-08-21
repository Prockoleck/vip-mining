"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function WithdrawPage() {
  const [amount, setAmount] = useState("");
  const [address, setAddress] = useState("");
  const [withdrawable, setWithdrawable] = useState(0);
  const [balance, setBalance] = useState(0);
  const [unlocked, setUnlocked] = useState(false);
  const [l1Count, setL1Count] = useState(0);
  const [l2Count, setL2Count] = useState(0);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/user-data").then(r => r.json()).then(data => {
      setBalance(Number(data.balance));
      setWithdrawable(Number(data.withdrawable_total));
      setUnlocked(data.principal_unlocked);
      setL1Count(data.l1_count || 0);
      setL2Count(data.l2_count || 0);
    });
  }, []);

  const fee = (parseFloat(amount) || 0) * 0.10;
  const net = (parseFloat(amount) || 0) - fee;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (amt < 10) { alert("Minimum withdrawal is 10 USDT."); return; }
    if (amt > withdrawable) {
      alert(unlocked ? "Insufficient balance." : `Principal Locked. Current profit: $${withdrawable.toFixed(2)}`);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: amt, address }),
      });
      if (res.ok) {
        alert("Transaction Initiated! Your request is being verified by the node.");
        router.push("/dashboard");
      } else {
        const data = await res.json();
        alert("System Notice: " + (data.error || "Failed"));
      }
    } catch { alert("Network error"); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: "100vh", paddingBottom: "40px" }}>
      <div className="aurora-bg"><div className="blob b1" /><div className="blob b2" /></div>

      <div style={{ width: "100%", maxWidth: "440px", margin: "0 auto", padding: "30px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "25px" }} className="animate-fadeInUp">
          <a href="/dashboard" style={{ width: "45px", height: "45px", background: "rgba(255,255,255,0.7)", borderRadius: "15px", display: "flex", alignItems: "center", justifyContent: "center", color: "#1d1d1f", border: "1px solid rgba(255,255,255,0.8)", textDecoration: "none" }}>
            <i className="fa-solid fa-chevron-left" />
          </a>
          <h2 style={{ fontWeight: 800, fontSize: "1.2rem", letterSpacing: "-0.5px" }}>Withdrawal</h2>
          <div style={{ width: "45px" }} />
        </div>

        {/* Profit Hero */}
        <div style={{ background: "linear-gradient(135deg, #1d1d1f 0%, #434343 100%)", padding: "30px", borderRadius: "35px", color: "white", marginBottom: "25px", boxShadow: "0 20px 40px rgba(0,0,0,0.15)", position: "relative", overflow: "hidden" }} className="animate-fadeInUp">
          <div style={{ position: "absolute", top: "-20px", right: "-20px", width: "100px", height: "100px", background: "#0071e3", filter: "blur(50px)", opacity: 0.4 }} />
          <span style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", opacity: 0.7 }}>Withdrawable Amount</span>
          <div style={{ fontSize: "2.8rem", fontWeight: 800, margin: "10px 0", letterSpacing: "-2px" }}>
            ${withdrawable.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
          <div style={{ display: "flex", gap: "20px", marginTop: "15px", borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "15px" }}>
            <div style={{ flex: 1 }}>
              <span style={{ display: "block", fontSize: "0.6rem", textTransform: "uppercase", fontWeight: 800, opacity: 0.6 }}>Total Balance</span>
              <strong style={{ fontSize: "0.9rem" }}>${balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}</strong>
            </div>
            <div style={{ flex: 1 }}>
              <span style={{ display: "block", fontSize: "0.6rem", textTransform: "uppercase", fontWeight: 800, opacity: 0.6 }}>Principal Status</span>
              <strong style={{ fontSize: "0.9rem" }}>{unlocked ? "UNLOCKED" : "LOCKED"}</strong>
            </div>
          </div>
          <div style={{ background: "rgba(255,255,255,0.1)", padding: "10px 15px", borderRadius: "15px", marginTop: "15px", fontSize: "0.65rem", fontWeight: 700 }}>
            Network Progress: Lvl 1: {l1Count}/3 | Lvl 2: {l2Count}/2
          </div>
        </div>

        {/* Form Card */}
        <div style={{ background: "rgba(255,255,255,0.7)", backdropFilter: "blur(30px)", border: "1px solid rgba(255,255,255,0.8)", borderRadius: "35px", padding: "30px 20px", boxShadow: "0 20px 40px rgba(0,0,0,0.05)" }} className="animate-fadeInUp" >
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 800, color: "#86868b", textTransform: "uppercase", margin: "0 0 8px 5px" }}>BEP20 Receiving Address</label>
              <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="0x..." required
                style={{ width: "100%", padding: "18px 20px", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.8)", background: "rgba(255,255,255,0.5)", fontFamily: "inherit", fontSize: "1rem", fontWeight: 700, outline: "none", transition: "0.3s", boxSizing: "border-box" }} />
            </div>
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 800, color: "#86868b", textTransform: "uppercase", margin: "0 0 8px 5px" }}>Withdraw Amount (USDT)</label>
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Min. 10" required step="0.01"
                style={{ width: "100%", padding: "18px 20px", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.8)", background: "rgba(255,255,255,0.5)", fontFamily: "inherit", fontSize: "1rem", fontWeight: 700, outline: "none", transition: "0.3s", boxSizing: "border-box" }} />
            </div>

            <div style={{ background: "rgba(0,0,0,0.03)", borderRadius: "20px", padding: "15px", marginBottom: "25px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", fontWeight: 600, marginBottom: "6px" }}>
                <span>Processing Fee (10%)</span>
                <span>{fee > 0 ? fee.toFixed(2) : "0.00"} USDT</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", fontWeight: 800, color: "#0071e3", borderTop: "1px solid rgba(0,0,0,0.05)", paddingTop: "8px", marginTop: "5px" }}>
                <span>Net Settlement</span>
                <span>{net > 0 ? net.toFixed(2) : "0.00"} USDT</span>
              </div>
            </div>

            <button type="submit" disabled={loading}
              style={{ width: "100%", background: "#0071e3", color: "#fff", border: "none", padding: "20px", borderRadius: "22px", fontWeight: 800, fontSize: "1rem", boxShadow: "0 15px 30px rgba(0, 113, 227, 0.3)", cursor: "pointer" }}>
              {loading ? "PROCESSING..." : "WITHDRAW"}
            </button>
          </form>
        </div>

        {/* Rules */}
        <div style={{ marginTop: "25px", display: "flex", flexDirection: "column", gap: "10px" }} className="animate-fadeInUp">
          {[
            { icon: "fa-shield-halved", text: "Unlock Principal: ", bold: "3 Lvl-1 & 2 Lvl-2 referrals required." },
            { icon: "fa-clock", text: "Processing: ", bold: "24-72 hours typical window." },
            { icon: "fa-calendar-days", text: "Limit: ", bold: "One withdrawal every 7 days." },
          ].map((rule, i) => (
            <div key={i} style={{ background: "rgba(255,255,255,0.7)", padding: "15px", borderRadius: "20px", display: "flex", alignItems: "center", gap: "12px", border: "1px solid rgba(255,255,255,0.8)" }}>
              <i className={`fa-solid ${rule.icon}`} style={{ color: "#0071e3", fontSize: "1rem" }} />
              <span style={{ fontSize: "0.7rem", fontWeight: 600, color: "#86868b" }}>{rule.text}<b style={{ color: "#1d1d1f" }}>{rule.bold}</b></span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}