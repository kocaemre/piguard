import { getServerSession } from "next-auth";
import { getAuthOptions } from "./auth-options";
import { redirect } from "next/navigation";

export async function getSession() {
  const authOptions = await getAuthOptions();
  return await getServerSession(authOptions);
}

export async function getCurrentUser() {
  const session = await getSession();
  return session?.user;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect("/auth/login");
  }
  
  if (user.role === "USER") {
    redirect("/pending-approval");
  }
  
  return user;
}

export async function requireAdmin() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect("/auth/login");
  }
  
  if (user.role !== "ADMIN") {
    redirect("/dashboard");
  }
  
  return user;
} 