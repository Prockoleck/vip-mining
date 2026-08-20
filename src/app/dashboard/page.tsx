import { getUser, tiers, calculateTier } from "@/lib/auth";
import { redirect } from "next/navigation";
import AuroraBackground from "@/components/AuroraBackground";
import NavDock from "@/components/NavDock";
import Link from "next/link";

export default async function Dashboard() {
  const user = await getUser();
  if (!user) redirect("/");

  const currentTierId = calculateTier(Number(user.balance));
  const tierList = tiers();

  return (
    <div style={{ minHeight: "100vh", paddingBottom: "120px", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <AuroraBackground />

      <div style={{ width: "100%", maxWidth: "440px" }}>
        {/* Header */}
        <div style={{ padding: "40px 24px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <p style={{ fontSize: "0.8rem", color: "#86868b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px" }}>System Online</p>
            <h2 style={{ fontSize: "1.6rem", fontWeight: 800, letterSpacing: "-1px" }}>Hi, {user.username}</h2>
          </div>
          <Link href="/profile" style={{ width: "55px", height: "55px", borderRadius: "20px", background: "rgba(255,255,255,0.75)", border: "1px solid rgba(255,255,255,0.8)", backdropFilter: "blur(20px)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 10px 25px rgba(0,0,0,0.05)", textDecoration: "none" }}>
            {user.profile_pic ? (
              <img src={user.profile_pic} alt="User" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <i className="fa-solid fa-user-shield" style={{ color: "#d1d1d6", fontSize: "1.4rem" }} />
            )}
          </Link>
        </div>

        {/* Main Card */}
        <div style={{ margin: "0 24px 30px", padding: "35px", background: "linear-gradient(145deg, #0071e3, #0056b3)", borderRadius: "35px", color: "white", boxShadow: "0 25px 50px rgba(0, 113, 227, 0.25)", position: "relative", overflow: "hidden", animation: "fadeInUp 0.6s ease-out both" }}>
          <h3 style={{ fontSize: "0.75rem", textTransform: "uppercase", opacity: 0.8, letterSpacing: "1.5px" }}>Available Liquidity</h3>
          <div style={{ fontSize: "3rem", fontWeight: 800, margin: "10px 0 25px", letterSpacing: "-2px" }}>
            ${Number(user.balance).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
            <Link href="/deposit" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(255, 255, 255, 0.12)", border: "1px solid rgba(255, 255, 255, 0.2)", padding: "18px 5px", borderRadius: "22px", textDecoration: "none", color: "white" }}>
              <i className="fa-solid fa-bolt-lightning" style={{ fontSize: "1.3rem", marginBottom: "8px" }} />
              <span style={{ fontSize: "0.65rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px" }}>Deposit</span>
            </Link>
            <Link href="/withdraw" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(255, 255, 255, 0.12)", border: "1px solid rgba(255, 255, 255, 0.2)", padding: "18px 5px", borderRadius: "22px", textDecoration: "none", color: "white" }}>
              <i className="fa-solid fa-money-bill-transfer" style={{ fontSize: "1.3rem", marginBottom: "8px" }} />
              <span style={{ fontSize: "0.65rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px" }}>Withdraw</span>
            </Link>
            <Link href="/team" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(255, 255, 255, 0.12)", border: "1px solid rgba(255, 255, 255, 0.2)", padding: "18px 5px", borderRadius: "22px", textDecoration: "none", color: "white" }}>
              <i className="fa-solid fa-users-rays" style={{ fontSize: "1.3rem", marginBottom: "8px" }} />
              <span style={{ fontSize: "0.65rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px" }}>Team</span>
            </Link>
          </div>
        </div>

        {/* VIP Tiers */}
        <div style={{ padding: "0 28px", fontWeight: 800, fontSize: "1.2rem", marginBottom: "20px" }}>VIP TIERS</div>
        <div style={{ display: "flex", flexDirection: "column", gap: "15px", padding: "0 24px" }}>
          {tierList.map((tier, i) => {
            const isActive = currentTierId === tier.id;
            const isLocked = Number(user.balance) < tier.min;
            return (
              <div key={tier.id} style={{
                background: isActive ? "white" : "rgba(255, 255, 255, 0.75)",
                backdropFilter: "blur(25px)",
                border: isActive ? "2.5px solid #0071e3" : "1px solid rgba(255, 255, 255, 0.8)",
                borderRadius: "28px", padding: "22px",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                boxShadow: isActive ? "0 15px 30px rgba(0, 113, 227, 0.1)" : "none",
                opacity: isLocked ? 0.65 : 1,
                animation: `fadeInUp 0.6s ease-out ${i * 0.08}s both`,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
                  <div style={{ width: "50px", height: "50px", borderRadius: "15px", background: isActive ? "#0071e3" : "rgba(0, 113, 227, 0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem", color: isActive ? "white" : "#0071e3" }}>
                    <i className={`fa-solid ${tier.icon}`} />
                  </div>
                  <div>
                    <span style={{ fontWeight: 800, fontSize: "1.1rem", display: "block" }}>{tier.name}</span>
                    <span style={{ fontSize: "0.75rem", color: "#86868b", fontWeight: 600 }}>Min: ${tier.min.toLocaleString()}</span>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span style={{ fontSize: "1.3rem", fontWeight: 800, color: "#0071e3", display: "block" }}>+{tier.profit.toFixed(2)}%</span>
                  <span style={{ fontSize: "0.6rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "1px", color: isActive ? "#0071e3" : "#86868b" }}>
                    {isActive ? "Currently Active" : isLocked ? "Locked" : "Available"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <NavDock />
    </div>
  );
}
