"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import NavDock from "@/components/NavDock";
import { tiers } from "@/lib/tiers";

interface UserData {
  balance: number;
  total_recharge: number;
  last_mining_time: string | null;
}

const themeColors: Record<string, { color: string; glow: string }> = {
  Starter: { color: "#34c759", glow: "rgba(52,199,89,0.2)" },
  Basic: { color: "#0071e3", glow: "rgba(0,113,227,0.2)" },
  Standard: { color: "#af52de", glow: "rgba(175,82,222,0.2)" },
  Advanced: { color: "#ff9500", glow: "rgba(255,149,0,0.2)" },
  Premium: { color: "#ff3b30", glow: "rgba(255,59,48,0.2)" },
  Elite: { color: "#5856d6", glow: "rgba(88,86,214,0.2)" },
  VIP: { color: "#ffcc00", glow: "rgba(255,204,0,0.2)" },
};

export default function MiningPage() {
  const [user, setUser] = useState<UserData | null>(null);
  const [canMine, setCanMine] = useState(true);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [mining, setMining] = useState(false);
  const [statusMsg, setStatusMsg] = useState("> INITIALIZING...");
  const [orbActive, setOrbActive] = useState(false);
  const router = useRouter();

  const loadData = useCallback(async () => {
    try {
      const res = await fetch("/api/user-data");
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        const recharge = Number(data.total_recharge);
        if (recharge < 10) {
          setStatusMsg("> INSUFFICIENT COLLATERAL (MIN $10)");
          setCanMine(false);
          return;
        }
        if (data.last_mining_time) {
          const diff = (Date.now() - new Date(data.last_mining_time + (data.last_mining_time.endsWith("Z") ? "" : "Z")).getTime()) / 1000;
          if (diff < 86400) {
            setCanMine(false);
            setSecondsLeft(Math.floor(86400 - diff));
            setStatusMsg("> NODE COOLDOWN");
            setOrbActive(true);
            return;
          }
        }
        setStatusMsg("> SYSTEM READY");
        setCanMine(true);
      } else {
        router.push("/");
      }
    } catch {
      setStatusMsg("> SYSTEM ERROR");
    }
  }, [router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (secondsLeft <= 0 || canMine) return;
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          window.location.reload();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [secondsLeft, canMine]);

  const getTheme = () => {
    if (!user) return { name: "Unranked", min: 0, profit: 0, color: "#666", glow: "rgba(0,0,0,0.1)" };
    const recharge = Number(user.total_recharge);
    let current = tiers()[0];
    for (const tier of tiers()) {
      if (recharge >= tier.min) current = tier;
    }
    const colors = themeColors[current.name] || { color: "#666", glow: "rgba(0,0,0,0.1)" };
    return { ...current, ...colors };
  };

  const theme = getTheme();
  const lowBalance = user ? Number(user.total_recharge) < 10 : true;

  const startSequence = async () => {
    setMining(true);
    setOrbActive(true);
    setStatusMsg("> CONNECTING TO GLOBAL NODES...");
    const logPoints = [
      { time: 2, msg: "> ALLOCATING COMPUTATIONAL POWER..." },
      { time: 4, msg: "> DECRYPTING BLOCKCHAIN PACKETS..." },
      { time: 6, msg: "> SYNCHRONIZING PROFIT LEDGER..." },
      { time: 8, msg: "> AUTHORIZING TRANSACTION..." },
    ];
    logPoints.forEach((pt) => {
      setTimeout(() => setStatusMsg(pt.msg), pt.time * 1000);
    });

    setTimeout(async () => {
      try {
        const res = await fetch("/api/mining", { method: "POST" });
        const data = await res.json();
        if (data.status === "success") {
          setStatusMsg(`> PROFIT ADDED: $${data.earned}`);
          alert(`Cycle Complete: $${data.earned} added via Compounding.`);
          window.location.reload();
        } else {
          alert(data.error || "Mining failed");
          window.location.reload();
        }
      } catch {
        alert("Error processing mining cycle.");
        window.location.reload();
      }
    }, 10000);
  };

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600).toString().padStart(2, "0");
    const m = Math.floor((s % 3600) / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${h}:${m}:${sec}`;
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", paddingBottom: "140px", overflowX: "hidden" }}
      className="animate-reveal">
      <div className="aurora-bg"><div className="blob b1" /><div className="blob b2" /></div>

      <div style={{ width: "100%", maxWidth: "430px", padding: "40px 20px" }}>
        {/* Tier Card */}
        <div style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(30px)", borderRadius: "32px", padding: "22px", marginBottom: "25px", border: "1px solid rgba(255,255,255,0.5)", display: "flex", alignItems: "center", gap: "15px", boxShadow: "0 10px 40px rgba(0,0,0,0.03)" }}>
          <div style={{ width: "54px", height: "54px", background: theme.color, borderRadius: "18px", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "1.6rem", boxShadow: `0 8px 25px ${theme.glow}` }}>
            <i className="fa-solid fa-crown" />
          </div>
          <div style={{ textAlign: "left", flex: 1 }}>
            <p style={{ fontSize: "0.65rem", fontWeight: 800, opacity: 0.5, letterSpacing: "1px" }}>CURRENT NODE</p>
            <h3 style={{ fontWeight: 800, fontSize: "1.2rem" }}>{theme.name.toUpperCase()}</h3>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: "0.65rem", fontWeight: 800, opacity: 0.5, letterSpacing: "1px" }}>PROFIT RATE</p>
            <h3 style={{ color: theme.color, fontWeight: 800, fontSize: "1.2rem" }}>{theme.profit}%</h3>
          </div>
        </div>

        {/* Engine Card */}
        <div style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(40px)", borderRadius: "48px", padding: "50px 24px 45px", textAlign: "center", border: "1px solid rgba(255,255,255,0.5)", boxShadow: "0 45px 90px rgba(0,0,0,0.06)" }}>
          {/* Orb */}
          <div style={{ width: "220px", height: "220px", margin: "0 auto 35px", position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ position: "absolute", inset: "-10px", border: "2px solid transparent", borderTopColor: theme.color, borderRadius: "50%", opacity: orbActive ? 1 : 0, animation: orbActive ? "spin 3s linear infinite" : "none", transition: "0.5s" }} />
            <div style={{ width: "170px", height: "170px", borderRadius: "50%", background: `linear-gradient(135deg, ${theme.color}, #1d1d1f)`, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "4rem", boxShadow: `0 25px 60px ${theme.glow}` }}>
              <i className={`fa-solid fa-atom ${mining ? "fa-spin" : ""}`} />
            </div>
          </div>

          <div style={{ fontFamily: "monospace", fontSize: "0.85rem", color: theme.color, fontWeight: 700, margin: "25px 0", minHeight: "20px", letterSpacing: "0.5px" }}>
            {statusMsg}
          </div>

          {!canMine && (
            <div style={{ fontSize: "3.4rem", fontWeight: 800, letterSpacing: "-3px", margin: "10px 0", color: "#1d1d1f" }}>
              {lowBalance ? "---" : formatTime(secondsLeft)}
            </div>
          )}

          {canMine && !lowBalance && (
            <button onClick={startSequence} disabled={mining}
              style={{ background: theme.color, color: "white", border: "none", width: "100%", padding: "24px", borderRadius: "28px", fontWeight: 800, fontSize: "1.1rem", cursor: "pointer", boxShadow: `0 18px 40px ${theme.glow}` }}>
              TRADE {theme.name.toUpperCase()} CYCLE
            </button>
          )}
        </div>
      </div>

      <NavDock />
    </div>
  );
}
