"use client";
import { useEffect, useRef } from "react";
import QRCode from "qrcode";

export default function WalletQR({ wallet, size = 160 }: { wallet: string; size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, wallet, {
        width: size,
        margin: 2,
        color: { dark: "#1d1d1f", light: "#ffffff" },
      });
    }
  }, [wallet, size]);

  return (
    <div style={{ width: size + 30, height: size + 30, padding: "15px", background: "#fff", borderRadius: "30px", boxShadow: "0 10px 30px rgba(0,113,227,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <canvas ref={canvasRef} style={{ borderRadius: "15px" }} />
    </div>
  );
}
