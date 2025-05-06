import { requireAuth } from "../lib/auth/session";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import { Toaster } from "react-hot-toast";
import { DemoProvider } from "../lib/DemoContext";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Make sure the user is authenticated
  const user = await requireAuth();

  return (
    <DemoProvider>
      <div className="flex h-screen bg-gray-100">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content */}
        <div className="flex flex-col flex-1 overflow-hidden md:ml-64">
          {/* Header */}
          <Header user={user} />
          
          {/* Content */}
          <main className="flex-1 overflow-y-auto px-4 py-6 md:px-6">
            {children}
          </main>
        </div>

        {/* Toast notifications */}
        <Toaster position="top-right" />
      </div>
    </DemoProvider>
  );
} 