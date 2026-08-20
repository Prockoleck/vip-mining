"use client";
import { useState, useEffect } from "react";

interface AdminData {
  totalBalance: number;
  pendingDeposits: number;
  pendingWithdrawals: number;
  users: { id: number; username: string; balance: number; total_recharge: number }[];
  deposits: { id: number; user_id: number; amount: number; status: string; created_at: string; users: { username: string } }[];
  withdrawals: { id: number; user_id: number; wallet_address: string; amount: number; fee: number; status: string; created_at: string; users: { username: string } }[];
}

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [data, setData] = useState<AdminData | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        setAuthenticated(true);
        loadData();
      } else {
        setError("Access Denied: Invalid Administrative Key");
      }
    } catch {
      setError("Network error");
    }
  };

  const loadData = async () => {
    const res = await fetch("/api/admin");
    if (res.ok) {
      const d = await res.json();
      setData(d);
    }
  };

  const handleAction = (action: string, id: number) => {
    window.location.href = `/api/admin?action=${action}&id=${id}`;
  };

  if (!authenticated) {
    return (
      <div style={{ minHeight: "100vh", background: "#0b0f1a", fontFamily: "var(--font-plus-jakarta), sans-serif", display: "flex", alignItems: "center", justifyContent: "center", color: "white", overflow: "hidden" }}>
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", zIndex: -1, filter: "blur(100px)", opacity: 0.3 }}>
          <div style={{ position: "absolute", width: "600px", height: "600px", borderRadius: "50%", background: "#0071e3", animation: "move 20s infinite alternate" }} />
        </div>
        <div style={{ background: "rgba(255,255,255,0.05)", backdropFilter: "blur(20px)", padding: "50px", borderRadius: "40px", border: "1px solid rgba(255,255,255,0.1)", textAlign: "center", width: "380px", boxShadow: "0 40px 100px rgba(0,0,0,0.5)" }}>
          <i className="fa-solid fa-shield-halved" style={{ fontSize: "3rem", color: "#0071e3", marginBottom: "20px", display: "block", textShadow: "0 0 20px rgba(0,113,227,0.5)" }} />
          <h1 style={{ fontSize: "1.8rem", fontWeight: 800, marginBottom: "30px", letterSpacing: "-1px" }}>Admin Vault</h1>
          {error && <div style={{ color: "#ff453a", fontSize: "0.85rem", marginBottom: "15px", fontWeight: 600 }}>{error}</div>}
          <form onSubmit={handleLogin}>
            <input type="password" value={password} onChange={(e) => { setPassword(e.target.value); setError(""); }}
              placeholder="Administrative Key" autoFocus required
              style={{ width: "100%", padding: "18px", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(0,0,0,0.2)", color: "white", marginBottom: "20px", fontSize: "1rem", textAlign: "center", outline: "none" }} />
            <button type="submit" style={{ width: "100%", padding: "18px", borderRadius: "20px", border: "none", background: "#0071e3", color: "white", fontWeight: 800, cursor: "pointer" }}>
              Unlock System
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (!data) return <div style={{ minHeight: "100vh", background: "#0b0f1a", color: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>Loading...</div>;

  return (
    <div style={{ background: "#0b0f1a", fontFamily: "var(--font-plus-jakarta), sans-serif", color: "#f1f5f9", padding: "40px", maxWidth: "1280px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "40px" }}>
        <h1 style={{ fontWeight: 800, letterSpacing: "-1.5px", margin: 0 }}>Command Center <span style={{ color: "#0071e3" }}>.</span></h1>
        <div style={{ textAlign: "right", marginRight: "20px" }}>
          <small style={{ color: "#86868b", fontWeight: 800, fontSize: "0.6rem", textTransform: "uppercase" }}>Current IST</small>
          <div style={{ color: "#30d158", fontWeight: 800, fontSize: "0.9rem" }}>{new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" })}</div>
        </div>
        <a href="/api/admin?action=logout" style={{ color: "#ff453a", textDecoration: "none", fontWeight: 800, fontSize: "0.85rem", padding: "12px 24px", border: "1px solid rgba(255, 69, 58, 0.2)", borderRadius: "20px" }}>
          <i className="fa-solid fa-power-off" /> Secure Terminate
        </a>
      </div>

      {/* Stats Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px", marginBottom: "40px" }}>
        {[
          { label: "Total Net Balance", value: `$${data.totalBalance.toLocaleString()}`, color: "white" },
          { label: "Deposits Processing", value: `${data.pendingDeposits} Requests`, color: "#ff9f0a" },
          { label: "Withdrawals Pending", value: `${data.pendingWithdrawals} Requests`, color: "#ff453a" },
          { label: "Network Health", value: "Secured", color: "#30d158" },
        ].map((s, i) => (
          <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", padding: "25px", borderRadius: "30px", backdropFilter: "blur(10px)" }}>
            <small style={{ color: "#86868b", fontWeight: 800, textTransform: "uppercase", fontSize: "0.65rem", letterSpacing: "1px" }}>{s.label}</small>
            <h3 style={{ fontSize: "1.8rem", margin: "10px 0 0", fontWeight: 800, color: s.color }}>{s.value}</h3>
          </div>
        ))}
      </div>

      {/* Users Table */}
      <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "40px", padding: "35px", marginBottom: "40px" }}>
        <h2 style={{ fontSize: "1.2rem", fontWeight: 800, marginBottom: "25px", display: "flex", alignItems: "center", gap: "10px" }}>
          <i className="fa-solid fa-users" style={{ color: "#0071e3" }} /> Member Master List
        </h2>
        <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 10px" }}>
          <thead>
            <tr>
              {["Username", "Balance", "Total Recharge", "Current Profit"].map(h => (
                <th key={h} style={{ textAlign: "left", padding: "15px", color: "#86868b", fontSize: "0.7rem", fontWeight: 800, textTransform: "uppercase" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.users.map((u) => (
              <tr key={u.id}>
                <td style={{ padding: "15px", background: "rgba(255,255,255,0.02)", borderTop: "1px solid rgba(255,255,255,0.08)", borderBottom: "1px solid rgba(255,255,255,0.08)", borderLeft: "1px solid rgba(255,255,255,0.08)", borderRadius: "15px 0 0 15px" }}>
                  <b style={{ color: "white" }}>{u.username}</b>
                </td>
                <td style={{ padding: "15px", background: "rgba(255,255,255,0.02)", borderTop: "1px solid rgba(255,255,255,0.08)", borderBottom: "1px solid rgba(255,255,255,0.08)", color: "#0071e3", fontWeight: 800 }}>${Number(u.balance).toFixed(2)}</td>
                <td style={{ padding: "15px", background: "rgba(255,255,255,0.02)", borderTop: "1px solid rgba(255,255,255,0.08)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>${Number(u.total_recharge).toFixed(2)}</td>
                <td style={{ padding: "15px", background: "rgba(255,255,255,0.02)", borderTop: "1px solid rgba(255,255,255,0.08)", borderBottom: "1px solid rgba(255,255,255,0.08)", borderRight: "1px solid rgba(255,255,255,0.08)", borderRadius: "0 15px 15px 0", color: "#30d158" }}>+${(Number(u.balance) - Number(u.total_recharge)).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Deposits Table */}
      <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "40px", padding: "35px", marginBottom: "40px" }}>
        <h2 style={{ fontSize: "1.2rem", fontWeight: 800, marginBottom: "25px", display: "flex", alignItems: "center", gap: "10px" }}>
          <i className="fa-solid fa-circle-arrow-down" style={{ color: "#0071e3" }} /> Deposit Pipeline
        </h2>
        <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 10px" }}>
          <thead>
            <tr>
              {["Member", "Amount", "Status", "Action"].map(h => (
                <th key={h} style={{ textAlign: "left", padding: "15px", color: "#86868b", fontSize: "0.7rem", fontWeight: 800, textTransform: "uppercase" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.deposits.map((d) => (
              <tr key={d.id}>
                <td style={{ padding: "15px", background: "rgba(255,255,255,0.02)", borderTop: "1px solid rgba(255,255,255,0.08)", borderBottom: "1px solid rgba(255,255,255,0.08)", borderLeft: "1px solid rgba(255,255,255,0.08)", borderRadius: "15px 0 0 15px" }}>{d.users?.username}</td>
                <td style={{ padding: "15px", background: "rgba(255,255,255,0.02)", borderTop: "1px solid rgba(255,255,255,0.08)", borderBottom: "1px solid rgba(255,255,255,0.08)", fontWeight: 800, color: "#30d158" }}>${Number(d.amount).toFixed(2)}</td>
                <td style={{ padding: "15px", background: "rgba(255,255,255,0.02)", borderTop: "1px solid rgba(255,255,255,0.08)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                  <span style={{ padding: "6px 12px", borderRadius: "10px", fontSize: "0.65rem", fontWeight: 800, textTransform: "uppercase", background: d.status === "pending" ? "rgba(255,159,10,0.1)" : d.status === "approved" ? "rgba(48,209,88,0.1)" : "rgba(255,69,58,0.1)", color: d.status === "pending" ? "#ff9f0a" : d.status === "approved" ? "#30d158" : "#ff453a" }}>{d.status}</span>
                </td>
                <td style={{ padding: "15px", background: "rgba(255,255,255,0.02)", borderTop: "1px solid rgba(255,255,255,0.08)", borderBottom: "1px solid rgba(255,255,255,0.08)", borderRight: "1px solid rgba(255,255,255,0.08)", borderRadius: "0 15px 15px 0" }}>
                  <button onClick={() => handleAction("approve_dep", d.id)} disabled={d.status !== "pending"}
                    style={{ padding: "10px 18px", borderRadius: "12px", background: d.status === "pending" ? "#0071e3" : "rgba(255,255,255,0.05)", color: d.status === "pending" ? "white" : "#666", border: "none", fontWeight: 800, fontSize: "0.75rem", cursor: d.status === "pending" ? "pointer" : "default", marginRight: "8px" }}>Approve</button>
                  <button onClick={() => handleAction("reject_dep", d.id)} disabled={d.status !== "pending"}
                    style={{ padding: "10px 18px", borderRadius: "12px", background: "rgba(255,255,255,0.05)", color: "#ff453a", border: "1px solid rgba(255,69,58,0.2)", fontWeight: 800, fontSize: "0.75rem", cursor: d.status === "pending" ? "pointer" : "default" }}>Reject</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Withdrawals Table */}
      <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "40px", padding: "35px" }}>
        <h2 style={{ fontSize: "1.2rem", fontWeight: 800, marginBottom: "25px", display: "flex", alignItems: "center", gap: "10px" }}>
          <i className="fa-solid fa-circle-arrow-up" style={{ color: "#0071e3" }} /> Withdrawal Verification
        </h2>
        <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 10px" }}>
          <thead>
            <tr>
              {["Member", "Net Amount", "Address", "Status", "Action"].map(h => (
                <th key={h} style={{ textAlign: "left", padding: "15px", color: "#86868b", fontSize: "0.7rem", fontWeight: 800, textTransform: "uppercase" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.withdrawals.map((w) => (
              <tr key={w.id}>
                <td style={{ padding: "15px", background: "rgba(255,255,255,0.02)", borderTop: "1px solid rgba(255,255,255,0.08)", borderBottom: "1px solid rgba(255,255,255,0.08)", borderLeft: "1px solid rgba(255,255,255,0.08)", borderRadius: "15px 0 0 15px" }}>{w.users?.username}</td>
                <td style={{ padding: "15px", background: "rgba(255,255,255,0.02)", borderTop: "1px solid rgba(255,255,255,0.08)", borderBottom: "1px solid rgba(255,255,255,0.08)", color: "#ff453a", fontWeight: 800 }}>${(Number(w.amount) - Number(w.fee)).toFixed(2)}</td>
                <td style={{ padding: "15px", background: "rgba(255,255,255,0.02)", borderTop: "1px solid rgba(255,255,255,0.08)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                  <span style={{ fontFamily: "'Courier New', monospace", fontSize: "0.75rem", color: "#818cf8", background: "rgba(129,140,248,0.1)", padding: "5px 10px", borderRadius: "8px" }}>{w.wallet_address}</span>
                </td>
                <td style={{ padding: "15px", background: "rgba(255,255,255,0.02)", borderTop: "1px solid rgba(255,255,255,0.08)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                  <span style={{ padding: "6px 12px", borderRadius: "10px", fontSize: "0.65rem", fontWeight: 800, textTransform: "uppercase", background: w.status === "pending" ? "rgba(255,159,10,0.1)" : w.status === "approved" ? "rgba(48,209,88,0.1)" : "rgba(255,69,58,0.1)", color: w.status === "pending" ? "#ff9f0a" : w.status === "approved" ? "#30d158" : "#ff453a" }}>{w.status}</span>
                </td>
                <td style={{ padding: "15px", background: "rgba(255,255,255,0.02)", borderTop: "1px solid rgba(255,255,255,0.08)", borderBottom: "1px solid rgba(255,255,255,0.08)", borderRight: "1px solid rgba(255,255,255,0.08)", borderRadius: "0 15px 15px 0" }}>
                  <button onClick={() => handleAction("approve_wit", w.id)} disabled={w.status !== "pending"}
                    style={{ padding: "10px 18px", borderRadius: "12px", background: w.status === "pending" ? "#0071e3" : "rgba(255,255,255,0.05)", color: w.status === "pending" ? "white" : "#666", border: "none", fontWeight: 800, fontSize: "0.75rem", cursor: w.status === "pending" ? "pointer" : "default", marginRight: "8px" }}>Confirm</button>
                  <button onClick={() => handleAction("reject_wit", w.id)} disabled={w.status !== "pending"}
                    style={{ padding: "10px 18px", borderRadius: "12px", background: "rgba(255,255,255,0.05)", color: "#ff453a", border: "1px solid rgba(255,69,58,0.2)", fontWeight: 800, fontSize: "0.75rem", cursor: w.status === "pending" ? "pointer" : "default" }}>Refund</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
