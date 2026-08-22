"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [referrerCode, setReferrerCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) {
      setReferrerCode(ref);
      setIsLogin(false);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const endpoint = isLogin ? "/api/auth/login" : "/api/auth/signup";
      const body = isLogin
        ? { username, password }
        : { username, password, referrerCode };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return;
      }

      router.push("/dashboard");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        width: "92%", maxWidth: "420px",
        background: "rgba(255, 255, 255, 0.6)",
        backdropFilter: "blur(30px) saturate(200%)",
        WebkitBackdropFilter: "blur(30px) saturate(200%)",
        border: "1px solid rgba(255, 255, 255, 0.7)",
        borderRadius: "32px", padding: "40px",
        boxShadow: "0 20px 40px rgba(0,0,0,0.04)",
        textAlign: "center", zIndex: 10,
        animation: "slideUp 0.6s ease-out",
      }}
    >
      <h1 style={{ fontSize: "2rem", fontWeight: 800, letterSpacing: "-1.5px", marginBottom: "5px" }}>
        VIP AI MINING
      </h1>
      <p style={{ color: "#86868b", fontSize: "0.9rem", fontWeight: 600, marginBottom: "35px" }}>
        Enterprise Crypto Portal
      </p>

      {error && (
        <div style={{ background: "rgba(255, 59, 48, 0.1)", color: "#ff3b30", padding: "12px", borderRadius: "12px", fontSize: "0.8rem", fontWeight: 700, marginBottom: "20px" }}>
          {error}
        </div>
      )}

      {isLogin ? (
        <form onSubmit={handleSubmit}>
          <div style={{ textAlign: "left", marginBottom: "20px" }}>
            <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 800, color: "#86868b", marginBottom: "8px", marginLeft: "5px", textTransform: "uppercase", letterSpacing: "1px" }}>
              Username
            </label>
            <input
              type="text" value={username} onChange={(e) => setUsername(e.target.value)}
              placeholder="Username" required
              style={{ width: "100%", padding: "18px 20px", background: "rgba(0, 0, 0, 0.03)", border: "1.5px solid transparent", borderRadius: "18px", fontSize: "1rem", fontFamily: "inherit", fontWeight: 600, color: "#1d1d1f", outline: "none", transition: "0.4s cubic-bezier(0.4, 0, 0.2, 1)" }}
            />
          </div>
          <div style={{ textAlign: "left", marginBottom: "20px" }}>
            <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 800, color: "#86868b", marginBottom: "8px", marginLeft: "5px", textTransform: "uppercase", letterSpacing: "1px" }}>
              Password
            </label>
            <input
              type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••" required
              style={{ width: "100%", padding: "18px 20px", background: "rgba(0, 0, 0, 0.03)", border: "1.5px solid transparent", borderRadius: "18px", fontSize: "1rem", fontFamily: "inherit", fontWeight: 600, color: "#1d1d1f", outline: "none", transition: "0.4s cubic-bezier(0.4, 0, 0.2, 1)" }}
            />
          </div>
          <button type="submit" disabled={loading}
            style={{ width: "100%", padding: "18px", background: "#0071e3", color: "white", border: "none", borderRadius: "18px", fontSize: "1rem", fontWeight: 700, cursor: "pointer", transition: "0.3s", marginTop: "10px" }}>
            {loading ? "LOADING..." : "LOGIN"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleSubmit}>
          <div style={{ textAlign: "left", marginBottom: "20px" }}>
            <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 800, color: "#86868b", marginBottom: "8px", marginLeft: "5px", textTransform: "uppercase", letterSpacing: "1px" }}>
              Username
            </label>
            <input
              type="text" value={username} onChange={(e) => setUsername(e.target.value)}
              placeholder="Choose unique name" required
              style={{ width: "100%", padding: "18px 20px", background: "rgba(0, 0, 0, 0.03)", border: "1.5px solid transparent", borderRadius: "18px", fontSize: "1rem", fontFamily: "inherit", fontWeight: 600, color: "#1d1d1f", outline: "none", transition: "0.4s cubic-bezier(0.4, 0, 0.2, 1)" }}
            />
          </div>
          <div style={{ textAlign: "left", marginBottom: "20px" }}>
            <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 800, color: "#86868b", marginBottom: "8px", marginLeft: "5px", textTransform: "uppercase", letterSpacing: "1px" }}>
              Password
            </label>
            <input
              type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="Complex password" required
              style={{ width: "100%", padding: "18px 20px", background: "rgba(0, 0, 0, 0.03)", border: "1.5px solid transparent", borderRadius: "18px", fontSize: "1rem", fontFamily: "inherit", fontWeight: 600, color: "#1d1d1f", outline: "none", transition: "0.4s cubic-bezier(0.4, 0, 0.2, 1)" }}
            />
          </div>
          <div style={{ textAlign: "left", marginBottom: "20px" }}>
            <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 800, color: "#86868b", marginBottom: "8px", marginLeft: "5px", textTransform: "uppercase", letterSpacing: "1px" }}>
              Referral Code
            </label>
            <input
              type="text" value={referrerCode} onChange={(e) => setReferrerCode(e.target.value)}
              placeholder="Optional Link" readOnly={!!referrerCode}
              style={{ width: "100%", padding: "18px 20px", background: "rgba(0, 0, 0, 0.03)", border: "1.5px solid transparent", borderRadius: "18px", fontSize: "1rem", fontFamily: "inherit", fontWeight: 600, color: "#1d1d1f", outline: "none", transition: "0.4s cubic-bezier(0.4, 0, 0.2, 1)" }}
            />
          </div>
          <button type="submit" disabled={loading}
            style={{ width: "100%", padding: "18px", background: "#0071e3", color: "white", border: "none", borderRadius: "18px", fontSize: "1rem", fontWeight: 700, cursor: "pointer", transition: "0.3s", marginTop: "10px" }}>
            {loading ? "LOADING..." : "SIGNUP"}
          </button>
        </form>
      )}

      <p style={{ marginTop: "25px", fontSize: "0.9rem", color: "#86868b", fontWeight: 600 }}>
        {isLogin ? "New here? " : "Registered? "}
        <span onClick={() => { setIsLogin(!isLogin); setError(""); }} style={{ color: "#0071e3", cursor: "pointer", fontWeight: 800 }}>
          {isLogin ? "Create Account" : "Login"}
        </span>
      </p>
    </div>
  );
}
