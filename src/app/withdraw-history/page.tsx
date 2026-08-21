import { getUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { redirect } from "next/navigation";

export default async function WithdrawHistoryPage() {
  const user = await getUser();
  if (!user) redirect("/");

  const { data: withdrawals } = await supabase
    .from("withdrawals")
    .select("amount, fee, status, wallet_address, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const { data: sumData } = await supabase
    .from("withdrawals")
    .select("amount, fee")
    .eq("user_id", user.id)
    .eq("status", "approved");

  const totalPaid = sumData?.reduce((sum, w) => sum + (Number(w.amount) - Number(w.fee)), 0) || 0;
  const withdrawalList = withdrawals || [];

  const getStatusColor = (s: string) => s === "approved" ? "#10b981" : s === "pending" ? "#f59e0b" : "#f43f5e";
  const getStatusIcon = (s: string) => s === "approved" ? "fa-paper-plane" : s === "pending" ? "fa-clock" : "fa-ban";

  return (
    <div style={{ minHeight: "100vh", background: "#0b0f1a", fontFamily: "var(--font-plus-jakarta), sans-serif", color: "white", paddingBottom: "50px" }}>
      <div style={{ padding: "30px 20px", display: "flex", alignItems: "center", gap: "15px" }}>
        <a href="/profile" style={{ width: "45px", height: "45px", background: "#151c2c", borderRadius: "15px", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none", color: "white", border: "1px solid rgba(255,255,255,0.05)" }}>
          <i className="fas fa-chevron-left" />
        </a>
        <h2 style={{ margin: 0, fontWeight: 800, fontSize: "1.3rem" }}>Withdrawal History</h2>
      </div>

      <div style={{ margin: "0 20px 30px", padding: "25px", background: "linear-gradient(135deg, #312e81 0%, #0f172a 100%)", borderRadius: "25px", border: "1px solid rgba(129, 140, 248, 0.2)", textAlign: "center", boxShadow: "0 15px 35px rgba(0,0,0,0.3)" }}>
        <h3 style={{ margin: 0, fontSize: "0.75rem", color: "#818cf8", textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: 700 }}>Total Paid Out</h3>
        <div style={{ fontSize: "2.2rem", fontWeight: 800, marginTop: "5px" }}>${totalPaid.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
      </div>

      <div style={{ padding: "0 20px" }}>
        {withdrawalList.length > 0 ? withdrawalList.map((w, i) => (
          <div key={i} style={{ background: "#151c2c", borderRadius: "22px", padding: "20px", marginBottom: "15px", border: "1px solid rgba(255,255,255,0.03)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "15px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                <div style={{ width: "50px", height: "50px", borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem", background: `${getStatusColor(w.status)}15`, color: getStatusColor(w.status) }}>
                  <i className={`fas ${getStatusIcon(w.status)}`} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700 }}>${(Number(w.amount) - Number(w.fee)).toFixed(2)}</h4>
                  <p style={{ margin: 0, fontSize: "0.75rem", color: "#94a3b8", marginTop: "2px" }}>{new Date(w.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} • {new Date(w.created_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</p>
                </div>
              </div>
              <div style={{ fontSize: "0.6rem", fontWeight: 800, textTransform: "uppercase", padding: "6px 12px", borderRadius: "10px", letterSpacing: "0.5px", color: getStatusColor(w.status), background: `${getStatusColor(w.status)}15`, border: `1px solid ${getStatusColor(w.status)}33` }}>
                {w.status}
              </div>
            </div>
            <div style={{ background: "rgba(0,0,0,0.2)", padding: "12px 15px", borderRadius: "15px", fontSize: "0.7rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontFamily: "'Courier New', monospace", color: "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "60%" }}>{w.wallet_address}</span>
              <span style={{ color: "#f43f5e", fontWeight: 700, fontSize: "0.75rem" }}>-${Number(w.fee).toFixed(2)} Fee</span>
            </div>
          </div>
        )) : (
          <div style={{ textAlign: "center", paddingTop: "60px", color: "#94a3b8" }}>
            <i className="fas fa-receipt" style={{ fontSize: "3.5rem", marginBottom: "20px", opacity: 0.1, display: "block" }} />
            <p>No transactions found yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
