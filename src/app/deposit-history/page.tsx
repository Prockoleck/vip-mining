"use client";
import { useState, useEffect } from "react";

interface DepositRecord {
  amount: number;
  status: string;
  created_at: string;
}

export default function DepositHistoryPage() {
  const [deposits, setDeposits] = useState<DepositRecord[]>([]);
  const [totalApproved, setTotalApproved] = useState(0);

  useEffect(() => {
    fetch("/api/deposit-history").then(r => r.json()).then(data => {
      setDeposits(data.deposits || []);
      setTotalApproved(data.total_approved || 0);
    });
  }, []);

  const getStatusIcon = (s: string) => s === "approved" ? "fa-check" : s === "pending" ? "fa-clock" : "fa-xmark";
  const getStatusColor = (s: string) => s === "approved" ? "#10b981" : s === "pending" ? "#f59e0b" : "#f43f5e";

  return (
    <div style={{ minHeight: "100vh", background: "#0b0f1a", fontFamily: "var(--font-plus-jakarta), sans-serif", color: "white", paddingBottom: "50px" }}>
      <div style={{ padding: "30px 20px", display: "flex", alignItems: "center", gap: "15px" }}>
        <a href="/profile" style={{ width: "45px", height: "45px", background: "#151c2c", borderRadius: "15px", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none", color: "white", border: "1px solid rgba(255,255,255,0.05)" }}>
          <i className="fas fa-chevron-left" />
        </a>
        <h2 style={{ margin: 0, fontWeight: 700 }}>Deposit Records</h2>
      </div>

      <div style={{ margin: "0 20px 30px", padding: "25px", background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)", borderRadius: "25px", border: "1px solid rgba(56, 189, 248, 0.2)", textAlign: "center" }}>
        <h3 style={{ margin: 0, fontSize: "0.8rem", color: "#38bdf8", textTransform: "uppercase", letterSpacing: "1.5px" }}>Total Funded</h3>
        <div style={{ fontSize: "2rem", fontWeight: 700, marginTop: "5px" }}>${totalApproved.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
      </div>

      <div style={{ padding: "0 20px" }}>
        {deposits.length > 0 ? deposits.map((d, i) => (
          <div key={i} style={{ background: "#151c2c", borderRadius: "20px", padding: "18px", marginBottom: "15px", display: "flex", alignItems: "center", justifyContent: "space-between", border: "1px solid rgba(255,255,255,0.03)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
              <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: `${getStatusColor(d.status)}15`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem", color: getStatusColor(d.status) }}>
                <i className={`fas ${getStatusIcon(d.status)}`} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: "1rem", fontWeight: 700 }}>${Number(d.amount).toFixed(2)}</h4>
                <p style={{ margin: 0, fontSize: "0.7rem", color: "#94a3b8", marginTop: "3px" }}>{new Date(d.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} • {new Date(d.created_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</p>
              </div>
            </div>
            <div style={{ fontSize: "0.65rem", fontWeight: 800, textTransform: "uppercase", padding: "5px 10px", borderRadius: "8px", color: getStatusColor(d.status), background: `${getStatusColor(d.status)}15` }}>
              {d.status}
            </div>
          </div>
        )) : (
          <div style={{ textAlign: "center", paddingTop: "50px", color: "#94a3b8" }}>
            <i className="fas fa-folder-open" style={{ fontSize: "3rem", marginBottom: "15px", opacity: 0.2, display: "block" }} />
            <p>No deposit records found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
