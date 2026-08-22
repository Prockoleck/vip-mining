import { Suspense } from "react";
import { getSession, getUser } from "@/lib/auth";
import AuroraBackground from "@/components/AuroraBackground";
import AuthForm from "@/components/AuthForm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function AuthPage() {
  const session = await getSession();
  if (session) {
    const user = await getUser();
    if (user) redirect("/dashboard");
    const cookieStore = await cookies();
    cookieStore.delete("session");
  }

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", overflow: "hidden", position: "relative", background: "#ffffff" }}>
      <AuroraBackground />
      <Suspense>
        <AuthForm />
      </Suspense>
    </div>
  );
}
