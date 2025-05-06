"use client";

import { User } from "next-auth";
import { signOut } from "next-auth/react";
import { Bell, ChevronDown, LogOut, Settings, User as UserIcon, Cpu, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useDemo } from "@/app/lib/DemoContext";
import { Switch } from "@/components/ui/switch";
import { usePathname } from "next/navigation";

interface HeaderProps {
  user: User;
}

export default function Header({ user }: HeaderProps) {
  const pathname = usePathname();
  const { isDemoMode, toggleDemoMode } = useDemo();
  const [status, setStatus] = useState<"Online" | "Offline" | "Connecting">("Connecting");
  const [raspberryPiIp, setRaspberryPiIp] = useState<string>("");
  const [raspberryPiPort, setRaspberryPiPort] = useState<string>("8000");
  
  // Fetch Raspberry Pi settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch("/api/settings/raspberry-pi");
        if (response.ok) {
          const data = await response.json();
          setRaspberryPiIp(data.ip || "");
          setRaspberryPiPort(data.port || "8000");
        }
      } catch (error) {
        console.error("Failed to fetch Raspberry Pi settings:", error);
      }
    };

    fetchSettings();
  }, []);

  // Simulate connection status
  useEffect(() => {
    if (isDemoMode) {
      // In demo mode, always show as online after initial delay
      const timer = setTimeout(() => {
        setStatus("Online");
      }, 1500);
      return () => clearTimeout(timer);
    } else if (!raspberryPiIp) {
      // If no IP is set, show as offline
      setStatus("Offline");
    } else {
      // If IP is set, simulate a connection attempt
      setStatus("Connecting");
      
      const timer = setTimeout(() => {
        // 80% chance of successful connection for demo purposes
        if (Math.random() > 0.2) {
          setStatus("Online");
        } else {
          setStatus("Offline");
        }
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [raspberryPiIp, isDemoMode]);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <span className="font-bold">PiGuard</span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-2">
          <div className="flex items-center space-x-2">
            <Switch
              checked={isDemoMode}
              onCheckedChange={toggleDemoMode}
              id="demo-mode"
            />
            <label htmlFor="demo-mode" className="text-sm text-gray-500 cursor-pointer select-none">
              Demo Mode: {isDemoMode ? "Enabled" : "Disabled"}
            </label>
          </div>
        </div>
      </div>
    </header>
  );
} 