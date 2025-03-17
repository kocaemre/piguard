import { getCurrentUser } from "../lib/auth/session";
import { redirect } from "next/navigation";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Kullanıcı giriş yapmışsa yönlendirme yap
  const user = await getCurrentUser();
  
  if (user) {
    // Onaylanmamış kullanıcılar (USER rolü) onay bekleme sayfasına
    if (user.role === "USER") {
      redirect("/pending-approval");
    }
    
    // Onaylanmış veya admin kullanıcılar dashboard'a
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-6 space-y-6">
        {children}
      </div>
    </div>
  );
} 