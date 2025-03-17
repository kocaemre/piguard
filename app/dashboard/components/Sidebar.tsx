"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Camera, 
  BarChart, 
  Sliders, 
  Settings, 
  FileText,
  Menu,
  X 
} from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const navItems = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
  {
    name: "Live Camera",
    href: "/dashboard/camera",
    icon: <Camera className="h-5 w-5" />,
  },
  {
    name: "Sensors",
    href: "/dashboard/sensors",
    icon: <BarChart className="h-5 w-5" />,
  },
  {
    name: "Controls",
    href: "/dashboard/controls",
    icon: <Sliders className="h-5 w-5" />,
  },
  {
    name: "Settings",
    href: "/dashboard/settings",
    icon: <Settings className="h-5 w-5" />,
  },
  {
    name: "Logs",
    href: "/dashboard/logs",
    icon: <FileText className="h-5 w-5" />,
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const NavLink = ({ item }: { item: typeof navItems[0] }) => {
    const isActive = pathname === item.href;
    return (
      <Link
        href={item.href}
        className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
          isActive
            ? "bg-gray-900 text-white"
            : "text-gray-400 hover:text-white hover:bg-gray-800"
        }`}
        onClick={() => setOpen(false)}
      >
        {item.icon}
        <span>{item.name}</span>
      </Link>
    );
  };

  const SidebarContent = () => (
    <div className="space-y-6">
      <div className="px-3 py-4">
        <h2 className="text-xl font-bold text-white">Pi Guard</h2>
        <p className="text-sm text-gray-400">Robot Management System</p>
      </div>
      <nav className="space-y-1 px-3">
        {navItems.map((item, index) => (
          <NavLink key={index} item={item} />
        ))}
      </nav>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-30">
        <div className="flex flex-col flex-1 min-h-0 bg-gray-800">
          <SidebarContent />
        </div>
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild className="md:hidden fixed top-3 left-3 z-40">
          <button
            type="button"
            className="p-2 rounded-md text-gray-700 bg-white shadow-md focus:outline-none"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0 bg-gray-800">
          <SidebarContent />
        </SheetContent>
      </Sheet>
    </>
  );
} 