import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { supabase } from "./supabase";

const SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || "vip-mining-secret-key-change-in-production"
);

export interface User {
  id: number;
  username: string;
  referral_code: string;
  balance: number;
  total_recharge: number;
  profile_pic: string | null;
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hashed: string) {
  return bcrypt.compare(password, hashed);
}

export async function createToken(userId: number, username: string) {
  const token = await new SignJWT({ userId, username })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .setIssuedAt()
    .sign(SECRET);
  return token;
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as { userId: number; username: string };
  } catch {
    return null;
  }
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function getUser() {
  const session = await getSession();
  if (!session) return null;

  const { data } = await supabase
    .from("users")
    .select("id, username, referral_code, balance, total_recharge, withdrawable_profit, last_mining_time, profile_pic, referrer_id")
    .eq("id", session.userId)
    .single();

  return data as User & { referrer_id: number; last_mining_time: string | null; withdrawable_profit: number } | null;
}

export function tiers() {
  return [
    { id: 1, name: "Starter", min: 10, profit: 3.5, icon: "fa-seedling" },
    { id: 2, name: "Basic", min: 51, profit: 3.0, icon: "fa-coins" },
    { id: 3, name: "Standard", min: 101, profit: 2.75, icon: "fa-crown" },
    { id: 4, name: "Advanced", min: 301, profit: 2.5, icon: "fa-gem" },
    { id: 5, name: "Premium", min: 501, profit: 2.25, icon: "fa-diamond" },
    { id: 6, name: "Elite", min: 1001, profit: 2.0, icon: "fa-shuttle-space" },
    { id: 7, name: "VIP", min: 2001, profit: 1.75, icon: "fa-fire-flame-curved" },
  ];
}

export function calculateTier(balance: number) {
  let current = 0;
  for (const tier of tiers()) {
    if (balance >= tier.min) current = tier.id;
  }
  return current;
}
