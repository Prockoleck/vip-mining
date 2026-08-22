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
  const [checking, setChecking] = useState(true);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [data, setData] = useState<AdminData | null>(null);
  const [activeTab, setActiveTab] = useState<"deposits" | "withdrawals" | "users">("deposits");

  useEffect(() => {
    fetch("/api/admin").then((res) => {
      if (res.ok) { setAuthenticated(true); return res.json(); }
      setChecking(false);
    }).then((d) => { if (d) setData(d); }).catch(() => setChecking(false));
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
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
        const d = await res.json();
        setError(d.error || "Access Denied");
      }
    } catch {
      setError("Network error");
    }
  };

  const handleLogout = async () => {
    document.cookie = "admin_session=; path=/; max-age=0";
    setAuthenticated(false);
    setData(null);
    setPassword("");
  };

  const loadData = async () => {
    const res = await fetch("/api/admin");
    if (res.ok) {
      const d = await res.json();
      setData(d);
    }
  };

  const handleAction = async (action: string, id: number) => {
    await fetch(`/api/admin?action=${action}&id=${id}`);
    loadData();
  };

  if (!authenticated) {
    if (checking) {
      return (
        <div style={{ minHeight: "100vh", background: "#0b0f1a", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}>
          <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: "2rem", color: "#0071e3" }} />
        </div>
      );
    }
    return (
      <div style={{ minHeight: "100vh", background: "#0b0f1a", fontFamily: "var(--font-plus-jakarta), sans-serif", display: "flex", alignItems: "center", justifyContent: "center", color: "white", overflow: "hidden", padding: "20px" }}>
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", zIndex: -1, filter: "blur(100px)", opacity: 0.3 }}>
          <div style={{ position: "absolute", width: "600px", height: "600px", borderRadius: "50%", background: "#0071e3", animation: "move 20s infinite alternate" }} />
        </div>
        <div style={{ background: "rgba(255,255,255,0.05)", backdropFilter: "blur(20px)", padding: "40px 24px", borderRadius: "35px", border: "1px solid rgba(255,255,255,0.1)", textAlign: "center", width: "100%", maxWidth: "380px", boxShadow: "0 40px 100px rgba(0,0,0,0.5)" }}>
          <i className="fa-solid fa-shield-halved" style={{ fontSize: "2.5rem", color: "#0071e3", marginBottom: "15px", display: "block", textShadow: "0 0 20px rgba(0,113,227,0.5)" }} />
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "25px", letterSpacing: "-1px" }}>Admin Vault</h1>
          {error && <div style={{ color: "#ff453a", fontSize: "0.85rem", marginBottom: "15px", fontWeight: 600 }}>{error}</div>}
          <form onSubmit={handleLogin}>
            <input type="password" value={password} onChange={(e) => { setPassword(e.target.value); setError(""); }}
              placeholder="Administrative Key" autoFocus required
              style={{ width: "100%", padding: "16px", borderRadius: "18px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(0,0,0,0.2)", color: "white", marginBottom: "15px", fontSize: "1rem", textAlign: "center", outline: "none", boxSizing: "border-box" }} />
            <button type="submit" style={{ width: "100%", padding: "16px", borderRadius: "18px", border: "none", background: "#0071e3", color: "white", fontWeight: 800, fontSize: "1rem", cursor: "pointer" }}>
              Unlock System
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (!data) return <div style={{ minHeight: "100vh", background: "#0b0f1a", color: "white", display: "flex", alignItems: "center", justifyContent: "center" }}><i className="fa-solid fa-spinner fa-spin" style={{ fontSize: "2rem", color: "#0071e3" }} /></div>;

  return (
    <div style={{ background: "#0b0f1a", fontFamily: "var(--font-plus-jakarta), sans-serif", color: "#f1f5f9", padding: "20px", width: "100%", minHeight: "100vh" }}>
      <style>{`
        @media (min-width: 768px) {
          .admin-header { flex-direction: row !important; }
          .admin-stats { grid-template-columns: repeat(4, 1fr) !important; }
          .admin-page { padding: 40px !important; }
          .admin-section { padding: 35px !important; }
        }
        @media (max-width: 767px) {
          .admin-header { flex-direction: column !important; gap: 12px !important; align-items: stretch !important; }
          .admin-stats { grid-template-columns: repeat(2, 1fr) !important; }
          .admin-page { padding: 16px !important; }
          .admin-section { padding: 20px !important; border-radius: 25px !important; }
          .admin-section table { display: block !important; overflow-x: auto !important; }
          .admin-tx-card { display: flex !important; }
          .admin-tx-table { display: none !important; }
        }
        @media (min-width: 768px) {
          .admin-tx-card { display: none !important; }
          .admin-tx-table { display: block !important; }
        }
      `}</style>

      {/* Header */}
      <div className="admin-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px", gap: "12px" }}>
        <h1 style={{ fontWeight: 800, letterSpacing: "-1.5px", margin: 0, fontSize: "1.3rem" }}>Command Center <span style={{ color: "#0071e3" }}>.</span></h1>
        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          <div style={{ textAlign: "right" }}>
            <small style={{ color: "#86868b", fontWeight: 800, fontSize: "0.55rem", textTransform: "uppercase" }}>IST</small>
            <div style={{ color: "#30d158", fontWeight: 800, fontSize: "0.8rem" }}>{new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" })}</div>
          </div>
          <button onClick={handleLogout} style={{ color: "#ff453a", background: "rgba(255,69,58,0.1)", border: "1px solid rgba(255,69,58,0.2)", fontWeight: 800, fontSize: "0.75rem", padding: "10px 18px", borderRadius: "16px", cursor: "pointer", whiteSpace: "nowrap" }}>
            <i className="fa-solid fa-power-off" /> Logout
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="admin-stats" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px", marginBottom: "25px" }}>
        {[
          { label: "Total Balance", value: `$${data.totalBalance.toLocaleString()}`, color: "white" },
          { label: "Pending Deposits", value: `${data.pendingDeposits}`, color: "#ff9f0a" },
          { label: "Pending Withdrawals", value: `${data.pendingWithdrawals}`, color: "#ff453a" },
          { label: "Network", value: "Secured", color: "#30d158" },
        ].map((s, i) => (
          <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", padding: "18px", borderRadius: "22px" }}>
            <small style={{ color: "#86868b", fontWeight: 800, textTransform: "uppercase", fontSize: "0.6rem", letterSpacing: "1px" }}>{s.label}</small>
            <h3 style={{ fontSize: "1.4rem", margin: "8px 0 0", fontWeight: 800, color: s.color }}>{s.value}</h3>
          </div>
        ))}
      </div>

      {/* Tab Navigation */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "20px", overflowX: "auto" }}>
        {([
          { key: "deposits" as const, label: "Deposits", icon: "fa-circle-arrow-down", count: data.pendingDeposits, color: "#ff9f0a" },
          { key: "withdrawals" as const, label: "Withdrawals", icon: "fa-circle-arrow-up", count: data.pendingWithdrawals, color: "#ff453a" },
          { key: "users" as const, label: "Users", icon: "fa-users", count: data.users.length, color: "#0071e3" },
        ]).map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            style={{ flex: 1, padding: "12px 16px", borderRadius: "16px", border: activeTab === tab.key ? `1px solid ${tab.color}40` : "1px solid rgba(255,255,255,0.08)", background: activeTab === tab.key ? `${tab.color}15` : "rgba(255,255,255,0.03)", color: activeTab === tab.key ? tab.color : "#86868b", fontWeight: 800, fontSize: "0.75rem", cursor: "pointer", whiteSpace: "nowrap", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
            <i className={`fa-solid ${tab.icon}`} />
            {tab.label}
            {tab.count > 0 && <span style={{ background: `${tab.color}20`, padding: "2px 8px", borderRadius: "8px", fontSize: "0.65rem" }}>{tab.count}</span>}
          </button>
        ))}
      </div>

      {/* Deposits Tab */}
      {activeTab === "deposits" && (
        <div className="admin-section" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "30px", padding: "25px", marginBottom: "20px" }}>
          <h2 style={{ fontSize: "1rem", fontWeight: 800, marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
            <i className="fa-solid fa-circle-arrow-down" style={{ color: "#0071e3" }} /> Deposit Pipeline
          </h2>
          {/* Desktop Table */}
          <div className="admin-tx-table" style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 8px" }}>
              <thead>
                <tr>
                  {["Member", "Amount", "Time", "Status", "Action"].map(h => (
                    <th key={h} style={{ textAlign: "left", padding: "10px 12px", color: "#86868b", fontSize: "0.65rem", fontWeight: 800, textTransform: "uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.deposits.map((d) => (
                  <tr key={d.id}>
                    <td style={{ padding: "12px", background: "rgba(255,255,255,0.02)", borderTop: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)", borderLeft: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px 0 0 12px", fontWeight: 700 }}>{d.users?.username}</td>
                    <td style={{ padding: "12px", background: "rgba(255,255,255,0.02)", borderTop: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)", fontWeight: 800, color: "#30d158" }}>${Number(d.amount).toFixed(2)}</td>
                    <td style={{ padding: "12px", background: "rgba(255,255,255,0.02)", borderTop: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)", fontSize: "0.7rem", color: "#86868b", whiteSpace: "nowrap" }}>{new Date(d.created_at + "Z").toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</td>
                    <td style={{ padding: "12px", background: "rgba(255,255,255,0.02)", borderTop: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                      <span style={{ padding: "5px 10px", borderRadius: "8px", fontSize: "0.6rem", fontWeight: 800, textTransform: "uppercase", background: d.status === "pending" ? "rgba(255,159,10,0.1)" : d.status === "approved" ? "rgba(48,209,88,0.1)" : "rgba(255,69,58,0.1)", color: d.status === "pending" ? "#ff9f0a" : d.status === "approved" ? "#30d158" : "#ff453a" }}>{d.status}</span>
                    </td>
                    <td style={{ padding: "12px", background: "rgba(255,255,255,0.02)", borderTop: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)", borderRight: "1px solid rgba(255,255,255,0.06)", borderRadius: "0 12px 12px 0", display: "flex", gap: "6px" }}>
                      <button onClick={() => handleAction("approve_dep", d.id)} disabled={d.status !== "pending"}
                        style={{ padding: "8px 14px", borderRadius: "10px", background: d.status === "pending" ? "#0071e3" : "rgba(255,255,255,0.05)", color: d.status === "pending" ? "white" : "#555", border: "none", fontWeight: 800, fontSize: "0.7rem", cursor: d.status === "pending" ? "pointer" : "default" }}>Approve</button>
                      <button onClick={() => handleAction("reject_dep", d.id)} disabled={d.status !== "pending"}
                        style={{ padding: "8px 14px", borderRadius: "10px", background: "rgba(255,69,58,0.1)", color: "#ff453a", border: "1px solid rgba(255,69,58,0.2)", fontWeight: 800, fontSize: "0.7rem", cursor: d.status === "pending" ? "pointer" : "default" }}>Reject</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Mobile Cards */}
          <div className="admin-tx-card" style={{ flexDirection: "column", gap: "10px" }}>
            {data.deposits.length === 0 && <p style={{ color: "#86868b", fontSize: "0.8rem", textAlign: "center", padding: "20px" }}>No deposits</p>}
            {data.deposits.map((d) => (
              <div key={d.id} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "16px", padding: "15px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                  <span style={{ fontWeight: 700, fontSize: "0.85rem" }}>{d.users?.username}</span>
                  <span style={{ fontSize: "0.6rem", color: "#86868b" }}>{new Date(d.created_at + "Z").toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.6rem", fontWeight: 800, textTransform: "uppercase", padding: "4px 10px", borderRadius: "8px", background: d.status === "pending" ? "rgba(255,159,10,0.1)" : d.status === "approved" ? "rgba(48,209,88,0.1)" : "rgba(255,69,58,0.1)", color: d.status === "pending" ? "#ff9f0a" : d.status === "approved" ? "#30d158" : "#ff453a" }}>{d.status}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: "#30d158", fontWeight: 800, fontSize: "1.1rem" }}>${Number(d.amount).toFixed(2)}</span>
                  {d.status === "pending" && (
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button onClick={() => handleAction("approve_dep", d.id)} style={{ padding: "10px 16px", borderRadius: "12px", background: "#0071e3", color: "white", border: "none", fontWeight: 800, fontSize: "0.75rem", cursor: "pointer" }}>Approve</button>
                      <button onClick={() => handleAction("reject_dep", d.id)} style={{ padding: "10px 16px", borderRadius: "12px", background: "rgba(255,69,58,0.1)", color: "#ff453a", border: "1px solid rgba(255,69,58,0.2)", fontWeight: 800, fontSize: "0.75rem", cursor: "pointer" }}>Reject</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Withdrawals Tab */}
      {activeTab === "withdrawals" && (
        <div className="admin-section" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "30px", padding: "25px", marginBottom: "20px" }}>
          <h2 style={{ fontSize: "1rem", fontWeight: 800, marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
            <i className="fa-solid fa-circle-arrow-up" style={{ color: "#0071e3" }} /> Withdrawal Verification
          </h2>
          {/* Desktop Table */}
          <div className="admin-tx-table" style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 8px" }}>
              <thead>
                <tr>
                  {["Member", "Net", "Address", "Time", "Status", "Action"].map(h => (
                    <th key={h} style={{ textAlign: "left", padding: "10px 12px", color: "#86868b", fontSize: "0.65rem", fontWeight: 800, textTransform: "uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.withdrawals.map((w) => (
                  <tr key={w.id}>
                    <td style={{ padding: "12px", background: "rgba(255,255,255,0.02)", borderTop: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)", borderLeft: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px 0 0 12px", fontWeight: 700 }}>{w.users?.username}</td>
                    <td style={{ padding: "12px", background: "rgba(255,255,255,0.02)", borderTop: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)", color: "#ff453a", fontWeight: 800 }}>${(Number(w.amount) - Number(w.fee)).toFixed(2)}</td>
                    <td style={{ padding: "12px", background: "rgba(255,255,255,0.02)", borderTop: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)", maxWidth: "160px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      <span style={{ fontFamily: "'Courier New', monospace", fontSize: "0.7rem", color: "#818cf8" }}>{w.wallet_address}</span>
                    </td>
                    <td style={{ padding: "12px", background: "rgba(255,255,255,0.02)", borderTop: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)", fontSize: "0.7rem", color: "#86868b", whiteSpace: "nowrap" }}>{new Date(w.created_at + "Z").toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</td>
                    <td style={{ padding: "12px", background: "rgba(255,255,255,0.02)", borderTop: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                      <span style={{ padding: "5px 10px", borderRadius: "8px", fontSize: "0.6rem", fontWeight: 800, textTransform: "uppercase", background: w.status === "pending" ? "rgba(255,159,10,0.1)" : w.status === "approved" ? "rgba(48,209,88,0.1)" : "rgba(255,69,58,0.1)", color: w.status === "pending" ? "#ff9f0a" : w.status === "approved" ? "#30d158" : "#ff453a" }}>{w.status}</span>
                    </td>
                    <td style={{ padding: "12px", background: "rgba(255,255,255,0.02)", borderTop: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)", borderRight: "1px solid rgba(255,255,255,0.06)", borderRadius: "0 12px 12px 0", display: "flex", gap: "6px" }}>
                      <button onClick={() => handleAction("approve_wit", w.id)} disabled={w.status !== "pending"}
                        style={{ padding: "8px 14px", borderRadius: "10px", background: w.status === "pending" ? "#0071e3" : "rgba(255,255,255,0.05)", color: w.status === "pending" ? "white" : "#555", border: "none", fontWeight: 800, fontSize: "0.7rem", cursor: w.status === "pending" ? "pointer" : "default" }}>Confirm</button>
                      <button onClick={() => handleAction("reject_wit", w.id)} disabled={w.status !== "pending"}
                        style={{ padding: "8px 14px", borderRadius: "10px", background: "rgba(255,69,58,0.1)", color: "#ff453a", border: "1px solid rgba(255,69,58,0.2)", fontWeight: 800, fontSize: "0.7rem", cursor: w.status === "pending" ? "pointer" : "default" }}>Refund</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Mobile Cards */}
          <div className="admin-tx-card" style={{ flexDirection: "column", gap: "10px" }}>
            {data.withdrawals.length === 0 && <p style={{ color: "#86868b", fontSize: "0.8rem", textAlign: "center", padding: "20px" }}>No withdrawals</p>}
            {data.withdrawals.map((w) => (
              <div key={w.id} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "16px", padding: "15px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <span style={{ fontWeight: 700, fontSize: "0.85rem" }}>{w.users?.username}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "0.6rem", color: "#86868b" }}>{new Date(w.created_at + "Z").toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                    <span style={{ padding: "4px 10px", borderRadius: "8px", fontSize: "0.6rem", fontWeight: 800, textTransform: "uppercase", background: w.status === "pending" ? "rgba(255,159,10,0.1)" : w.status === "approved" ? "rgba(48,209,88,0.1)" : "rgba(255,69,58,0.1)", color: w.status === "pending" ? "#ff9f0a" : w.status === "approved" ? "#30d158" : "#ff453a" }}>{w.status}</span>
                  </div>
                </div>
                <div style={{ fontSize: "0.65rem", color: "#818cf8", fontFamily: "'Courier New', monospace", marginBottom: "6px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{w.wallet_address}</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: "#ff453a", fontWeight: 800, fontSize: "1rem" }}>${(Number(w.amount) - Number(w.fee)).toFixed(2)} <span style={{ fontSize: "0.65rem", color: "#86868b", fontWeight: 600 }}>(fee: ${Number(w.fee).toFixed(2)})</span></span>
                  {w.status === "pending" && (
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button onClick={() => handleAction("approve_wit", w.id)} style={{ padding: "10px 16px", borderRadius: "12px", background: "#0071e3", color: "white", border: "none", fontWeight: 800, fontSize: "0.75rem", cursor: "pointer" }}>Confirm</button>
                      <button onClick={() => handleAction("reject_wit", w.id)} style={{ padding: "10px 16px", borderRadius: "12px", background: "rgba(255,69,58,0.1)", color: "#ff453a", border: "1px solid rgba(255,69,58,0.2)", fontWeight: 800, fontSize: "0.75rem", cursor: "pointer" }}>Refund</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === "users" && (
        <div className="admin-section" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "30px", padding: "25px" }}>
          <h2 style={{ fontSize: "1rem", fontWeight: 800, marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
            <i className="fa-solid fa-users" style={{ color: "#0071e3" }} /> Member List ({data.users.length})
          </h2>
          {/* Desktop Table */}
          <div className="admin-tx-table" style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 8px" }}>
              <thead>
                <tr>
                  {["Username", "Balance", "Recharge", "Profit"].map(h => (
                    <th key={h} style={{ textAlign: "left", padding: "10px 12px", color: "#86868b", fontSize: "0.65rem", fontWeight: 800, textTransform: "uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.users.map((u) => (
                  <tr key={u.id}>
                    <td style={{ padding: "12px", background: "rgba(255,255,255,0.02)", borderTop: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)", borderLeft: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px 0 0 12px" }}>
                      <b style={{ color: "white" }}>{u.username}</b>
                    </td>
                    <td style={{ padding: "12px", background: "rgba(255,255,255,0.02)", borderTop: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)", color: "#0071e3", fontWeight: 800 }}>${Number(u.balance).toFixed(2)}</td>
                    <td style={{ padding: "12px", background: "rgba(255,255,255,0.02)", borderTop: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>${Number(u.total_recharge).toFixed(2)}</td>
                    <td style={{ padding: "12px", background: "rgba(255,255,255,0.02)", borderTop: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)", borderRight: "1px solid rgba(255,255,255,0.06)", borderRadius: "0 12px 12px 0", color: "#30d158" }}>+${(Number(u.balance) - Number(u.total_recharge)).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Mobile Cards */}
          <div className="admin-tx-card" style={{ flexDirection: "column", gap: "8px" }}>
            {data.users.map((u) => (
              <div key={u.id} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "14px", padding: "14px" }}>
                <div style={{ fontWeight: 700, fontSize: "0.9rem", marginBottom: "8px" }}>{u.username}</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", fontSize: "0.75rem" }}>
                  <div><span style={{ color: "#86868b" }}>Bal: </span><b style={{ color: "#0071e3" }}>${Number(u.balance).toFixed(2)}</b></div>
                  <div><span style={{ color: "#86868b" }}>In: </span>${Number(u.total_recharge).toFixed(2)}</div>
                  <div style={{ gridColumn: "span 2" }}><span style={{ color: "#86868b" }}>Profit: </span><b style={{ color: "#30d158" }}>+${(Number(u.balance) - Number(u.total_recharge)).toFixed(2)}</b></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
