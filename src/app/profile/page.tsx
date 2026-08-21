"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import NavDock from "@/components/NavDock";
import { tiers } from "@/lib/tiers";

interface UserData {
  username: string;
  balance: number;
  total_recharge: number;
  profile_pic: string | null;
}

const tierGradients: Record<string, { gradient: string; icon: string; color: string }> = {
  Starter: { gradient: "linear-gradient(135deg, #34c759, #30b350)", icon: "fa-seedling", color: "white" },
  Basic: { gradient: "linear-gradient(135deg, #0071e3, #0056b3)", icon: "fa-coins", color: "white" },
  Standard: { gradient: "linear-gradient(135deg, #af52de, #8e3fd6)", icon: "fa-crown", color: "white" },
  Advanced: { gradient: "linear-gradient(135deg, #ff9500, #e08600)", icon: "fa-gem", color: "white" },
  Premium: { gradient: "linear-gradient(135deg, #ff3b30, #d63029)", icon: "fa-diamond", color: "white" },
  Elite: { gradient: "linear-gradient(135deg, #5856d6, #4342b8)", icon: "fa-shuttle-space", color: "white" },
  VIP: { gradient: "linear-gradient(135deg, #ffcc00, #e6b800)", icon: "fa-fire-flame-curved", color: "#1d1d1f" },
};

function getVipTier(recharge: number) {
  let matched = tiers()[0];
  for (const t of tiers()) {
    if (recharge >= t.min) matched = t;
  }
  const styles = tierGradients[matched.name] || { gradient: "linear-gradient(135deg, #8e8e93, #636366)", icon: "fa-user", color: "white" };
  return { name: matched.name, ...styles };
}

export default function ProfilePage() {
  const [user, setUser] = useState<UserData | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/user-data").then(r => r.json()).then(setUser);
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);

    setUploading(true);
    const formData = new FormData();
    formData.append("profile_image", file);
    try {
      const res = await fetch("/api/profile/upload", { method: "POST", body: formData });
      if (res.ok) {
        const data = await res.json();
        setUser((prev) => prev ? { ...prev, profile_pic: data.url } : null);
      }
    } catch {}
    setUploading(false);
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  };

  if (!user) return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      <div className="aurora-bg"><div className="blob b1" /><div className="blob b2" /></div>
      <div style={{ width: "130px", height: "130px", borderRadius: "45px", background: "rgba(255,255,255,0.1)", animation: "pulse 1.5s ease-in-out infinite" }} />
      <div style={{ width: "200px", height: "20px", borderRadius: "10px", background: "rgba(255,255,255,0.1)", marginTop: "20px", animation: "pulse 1.5s ease-in-out infinite 0.2s" }} />
      <div style={{ width: "140px", height: "16px", borderRadius: "8px", background: "rgba(255,255,255,0.08)", marginTop: "12px", animation: "pulse 1.5s ease-in-out infinite 0.4s" }} />
    </div>
  );

  const vip = getVipTier(Number(user.total_recharge));
  const imgSrc = preview || user.profile_pic;

  return (
    <div style={{ minHeight: "100vh", paddingBottom: "120px", display: "flex", flexDirection: "column", alignItems: "center", overflowX: "hidden" }}>
      <div className="aurora-bg"><div className="blob b1" /><div className="blob b2" /></div>

      <div style={{ width: "100%", maxWidth: "440px", padding: "40px 24px" }}>
        {/* Profile Card */}
        <div style={{ background: "rgba(255,255,255,0.7)", backdropFilter: "blur(30px)", border: "1px solid rgba(255,255,255,0.8)", borderRadius: "40px", padding: "40px 24px", textAlign: "center", boxShadow: "0 30px 60px rgba(0,0,0,0.06)", marginBottom: "25px", animation: "slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1)" }}>
          {/* Profile Picture */}
          <div style={{ position: "relative", width: "130px", height: "130px", margin: "0 auto 20px" }}>
            <div style={{ width: "100%", height: "100%", borderRadius: "45px", background: "#fff", border: "2px solid rgba(255,255,255,0.8)", padding: "5px", overflow: "hidden", boxShadow: "0 15px 35px rgba(0,0,0,0.08)" }}>
              {imgSrc ? (
                <img src={imgSrc} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "40px" }} alt="Profile" />
              ) : (
                <i className="fa-solid fa-user-gear" style={{ fontSize: "4rem", color: "#d1d1d6", marginTop: "25px", display: "block" }} />
              )}
            </div>
            <label style={{ position: "absolute", bottom: "-5px", right: "-5px", background: "#0071e3", color: "white", width: "42px", height: "42px", borderRadius: "15px", display: "flex", alignItems: "center", justifyContent: "center", border: "4px solid #fff", cursor: "pointer", boxShadow: "0 10px 20px rgba(0,113,227,0.2)" }}>
              <i className="fa-solid fa-camera" />
              <input type="file" accept="image/*" onChange={handleUpload} style={{ display: "none" }} />
            </label>
          </div>

          {uploading && (
            <button style={{ margin: "0 auto", display: "block", background: "#34c759", color: "white", border: "none", padding: "10px 25px", borderRadius: "15px", fontWeight: 800, fontSize: "0.8rem" }}>
              Uploading...
            </button>
          )}

          <h1 style={{ fontSize: "1.8rem", fontWeight: 800, letterSpacing: "-1px", marginBottom: "8px" }}>{user.username}</h1>

          <div style={{
            display: "inline-flex", alignItems: "center", gap: "8px", padding: "8px 20px", borderRadius: "100px",
            background: vip.gradient, color: vip.color, fontSize: "0.75rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1.5px",
            boxShadow: "0 10px 25px rgba(0,0,0,0.15)", position: "relative", overflow: "hidden",
          }}>
            <i className={`fa-solid ${vip.icon}`} />
            <span>{vip.name} Member</span>
            <div style={{ position: "absolute", top: "-50%", left: "-50%", width: "200%", height: "200%", background: "linear-gradient(60deg, transparent, rgba(255,255,255,0.4), transparent)", transform: "rotate(45deg)", animation: "shimmer 2.5s infinite" }} />
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "25px", animation: "slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both" }}>
          <a href="/deposit" style={{ background: "rgba(255,255,255,0.7)", backdropFilter: "blur(20px)", padding: "25px", borderRadius: "30px", textDecoration: "none", textAlign: "center", border: "1px solid rgba(255,255,255,0.8)" }}>
            <i className="fa-solid fa-circle-arrow-up" style={{ fontSize: "1.8rem", color: "#0071e3", display: "block", marginBottom: "10px" }} />
            <span style={{ fontWeight: 800, fontSize: "0.9rem", color: "#1d1d1f" }}>Deposit</span>
          </a>
          <a href="/withdraw" style={{ background: "rgba(255,255,255,0.7)", backdropFilter: "blur(20px)", padding: "25px", borderRadius: "30px", textDecoration: "none", textAlign: "center", border: "1px solid rgba(255,255,255,0.8)" }}>
            <i className="fa-solid fa-circle-arrow-down" style={{ fontSize: "1.8rem", color: "#0071e3", display: "block", marginBottom: "10px" }} />
            <span style={{ fontWeight: 800, fontSize: "0.9rem", color: "#1d1d1f" }}>Withdraw</span>
          </a>
        </div>

        {/* Menu List */}
        <div style={{ background: "rgba(255,255,255,0.7)", backdropFilter: "blur(20px)", borderRadius: "30px", border: "1px solid rgba(255,255,255,0.8)", overflow: "hidden", animation: "slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.2s both" }}>
          <a href="/deposit-history" style={{ display: "flex", alignItems: "center", padding: "22px 25px", textDecoration: "none", color: "#1d1d1f", borderBottom: "1px solid rgba(0,0,0,0.03)" }}>
            <i className="fa-solid fa-receipt" style={{ width: "35px", fontSize: "1.2rem", color: "#0071e3" }} />
            <span style={{ flex: 1, fontWeight: 700, fontSize: "0.95rem" }}>Deposit Logs</span>
            <i className="fa-solid fa-chevron-right" style={{ fontSize: "0.8rem", color: "#86868b" }} />
          </a>
          <a href="/withdraw-history" style={{ display: "flex", alignItems: "center", padding: "22px 25px", textDecoration: "none", color: "#1d1d1f", borderBottom: "1px solid rgba(0,0,0,0.03)" }}>
            <i className="fa-solid fa-clock-rotate-left" style={{ width: "35px", fontSize: "1.2rem", color: "#0071e3" }} />
            <span style={{ flex: 1, fontWeight: 700, fontSize: "0.95rem" }}>Withdrawal Logs</span>
            <i className="fa-solid fa-chevron-right" style={{ fontSize: "0.8rem", color: "#86868b" }} />
          </a>
          <button onClick={handleLogout} style={{ display: "flex", alignItems: "center", padding: "22px 25px", textDecoration: "none", color: "#1d1d1f", borderBottom: "none", background: "none", border: "none", width: "100%", cursor: "pointer", fontFamily: "inherit" }}>
            <i className="fa-solid fa-power-off" style={{ width: "35px", fontSize: "1.2rem", color: "#ff3b30" }} />
            <span style={{ flex: 1, fontWeight: 700, fontSize: "0.95rem", color: "#ff3b30", textAlign: "left" }}>Logout Account</span>
            <i className="fa-solid fa-chevron-right" style={{ fontSize: "0.8rem", color: "#86868b" }} />
          </button>
        </div>
      </div>

      <NavDock />
    </div>
  );
}