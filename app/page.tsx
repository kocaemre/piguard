import { redirect } from "next/navigation";
import { getCurrentUser } from "./lib/auth/session";

export default async function HomePage() {
  const user = await getCurrentUser();
  
  // Giriş yapmamış kullanıcıları login sayfasına yönlendir
  if (!user) {
    redirect("/auth/login");
  }
  
  // Onaylanmamış kullanıcıları onay bekleme sayfasına yönlendir
  if (user.role === "USER") {
    redirect("/pending-approval");
  }
  
  // Onaylanmış veya admin kullanıcıları dashboard'a yönlendir
  redirect("/dashboard");
}
