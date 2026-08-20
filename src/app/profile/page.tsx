"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import NavDock from "@/components/NavDock";

interface UserData {
  username: string;
  balance: number;
  total_recharge: number;
  profile_pic: string | null;
}

function getVipTier(recharge: number) {
  if (recharge >= 10000) return { name: "Legendary", gradient: "linear-gradient(135deg, #ff0000, #4b0082)", icon: "fa-dragon", color: "white" };
  if (recharge >= 5000) return { name: "Elite", gradient: "linear-gradient(135deg, #00f2fe, #4facfe)", icon: "fa-bolt", color: "white" };
  if (recharge >= 1200) return { name: "Diamond", gradient: "linear-gradient(135deg, #e0c3fc, #8ec5fc)", icon: "fa-gem", color: "white" };
  if (recharge >= 600) return { name: "Platinum", gradient: "linear-gradient(135deg, #e6e9f0, #eef1f5)", icon: "fa-shield-halved", color: "#1d1d1f" };
  if (recharge >= 300) return { name: "Gold", gradient: "linear-gradient(135deg, #f6d365, #fda085)", icon: "fa-crown", color: "white" };
  if (recharge >= 100) return { name: "Silver", gradient: "linear-gradient(135deg, #bdc3c7, #2c3e50)", icon: "fa-medal", color: "white" };
  if (recharge >= 50) return { name: "Bronze", gradient: "linear-gradient(135deg, #a87932, #52361b)", icon: "fa-award", color: "white" };
  return { name: "Newbie", gradient: "linear-gradient(135deg, #8e8e93, #636366)", icon: "fa-user", color: "white" };
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

  if (!user) return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}><p>Loading...</p></div>;

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