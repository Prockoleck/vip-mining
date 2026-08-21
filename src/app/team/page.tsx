import { getUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import NavDock from "@/components/NavDock";
import CopyButton from "@/components/CopyButton";
import { redirect } from "next/navigation";

export default async function TeamPage() {
  const user = await getUser();
  if (!user) redirect("/");

  const { data: l1Data } = await supabase.from("users").select("id, total_recharge").eq("referrer_id", user.id);
  const l1Count = l1Data?.length || 0;
  let totalComm = 0;
  const l1Ids: number[] = [];

  l1Data?.forEach((u) => {
    totalComm += Number(u.total_recharge) * 0.05;
    l1Ids.push(u.id);
  });

  let l2Count = 0;
  const l2Ids: number[] = [];
  if (l1Ids.length > 0) {
    const { data: l2Data } = await supabase.from("users").select("id, total_recharge").in("referrer_id", l1Ids);
    l2Data?.forEach((u) => {
      l2Count++;
      totalComm += Number(u.total_recharge) * 0.03;
      l2Ids.push(u.id);
    });
  }

  let l3Count = 0;
  const l3Ids: number[] = [];
  if (l2Ids.length > 0) {
    const { data: l3Data } = await supabase.from("users").select("id, total_recharge").in("referrer_id", l2Ids);
    l3Data?.forEach((u) => {
      l3Count++;
      totalComm += Number(u.total_recharge) * 0.01;
      l3Ids.push(u.id);
    });
  }

  let l4Count = 0;
  if (l3Ids.length > 0) {
    const { data: l4Data } = await supabase.from("users").select("id").in("referrer_id", l3Ids);
    l4Count = l4Data?.length || 0;
    totalComm += l4Count * 0.25;
  }

  const totalTeam = l1Count + l2Count + l3Count + l4Count;
  const inviteLink = `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/?ref=${user.referral_code}`;

  const levels = [
    { icon: "fa-users", title: "Level 1 Members", sub: `${l1Count} Direct Partners`, badge: "5% REWARD", anim: 0.3 },
    { icon: "fa-network-wired", title: "Level 2 Members", sub: `${l2Count} Secondary Partners`, badge: "3% REWARD", anim: 0.4 },
    { icon: "fa-sitemap", title: "Level 3 Members", sub: `${l3Count} Ternary Partners`, badge: "1% REWARD", anim: 0.5 },
    { icon: "fa-diagram-project", title: "Level 4 Members", sub: `${l4Count} Quaternary Partners`, badge: "$0.25 FLAT", anim: 0.6 },
  ];

  return (
    <div style={{ minHeight: "100vh", paddingBottom: "140px", display: "flex", flexDirection: "column", alignItems: "center", overflowX: "hidden" }}>
      <div className="aurora-bg"><div className="blob b1" /><div className="blob b2" /></div>

      <div style={{ width: "100%", maxWidth: "440px", padding: "40px 24px" }}>
        {/* Hero */}
        <div style={{ textAlign: "center", marginBottom: "30px" }} className="animate-fadeInUp">
          <p style={{ fontSize: "0.75rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1.5px", color: "#86868b" }}>Total Nodes in Empire</p>
          <h1 style={{ fontSize: "3rem", fontWeight: 800, letterSpacing: "-2px", color: "#0071e3" }}>{totalTeam}</h1>
        </div>

        {/* Commission Card */}
        <div style={{ background: "linear-gradient(135deg, #1d1d1f, #3a3a3c)", padding: "30px", borderRadius: "35px", color: "white", boxShadow: "0 20px 40px rgba(0,0,0,0.15)", marginBottom: "30px" }} className="animate-fadeInUp">
          <h4 style={{ fontSize: "0.7rem", textTransform: "uppercase", opacity: 0.7, letterSpacing: "1px" }}>Total Network Revenue</h4>
          <div style={{ fontSize: "2.2rem", fontWeight: 800, margin: "8px 0" }}>${totalComm.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
          <div style={{ fontSize: "0.75rem", opacity: 0.6, fontWeight: 600 }}>Aquired commission added to balance</div>
        </div>

        {/* Referral Link */}
        <div style={{ background: "rgba(255,255,255,0.7)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.8)", borderRadius: "25px", padding: "20px", marginBottom: "30px" }} className="animate-fadeInUp">
          <label style={{ fontSize: "0.65rem", fontWeight: 800, color: "#0071e3", textTransform: "uppercase", display: "block", marginBottom: "10px" }}>Invitation Protocol</label>
          <CopyButton text={inviteLink} label="COPY LINK" />
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
