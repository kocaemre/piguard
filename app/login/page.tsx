import { redirect } from "next/navigation";

export default function LoginRedirectPage() {
  // Redirect to auth/login
  redirect("/auth/login");
} 