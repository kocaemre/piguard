"use client";

import { User } from "next-auth";
import { signOut } from "next-auth/react";
import { Bell, ChevronDown, LogOut, Settings, User as UserIcon, Cpu } from "lucide-react";
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

interface HeaderProps {
  user: User;
}

export default function Header({ user }: HeaderProps) {
  const { isDemoMode } = useDemo();
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
    <header className="bg-white shadow-sm z-10 py-2">
      <div className="px-4">
        <div className="flex justify-between items-center h-12">
          {/* Left - System Status */}
          <div className="flex items-center md:ml-0">
            {/* System Status */}
            <div className="flex items-center mr-6">
              <div className="flex flex-col">
                <div className="text-sm font-medium text-gray-500">System Status</div>
                <div className="flex items-center">
                  <div
                    className={`h-2.5 w-2.5 rounded-full mr-2 ${
                      status === "Online"
                        ? "bg-green-500"
                        : status === "Connecting"
                        ? "bg-yellow-500"
                        : "bg-red-500"
                    }`}
                  ></div>
                  <span className="text-sm font-medium text-gray-900">{status}</span>
                </div>
              </div>
            </div>

            {/* Raspberry Pi IP */}
            <div className="hidden md:flex items-center border-l pl-6">
              <Cpu className="h-5 w-5 text-gray-400 mr-2" />
              <div className="flex flex-col">
                <div className="text-sm font-medium text-gray-500">Raspberry Pi</div>
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-900">
                    {isDemoMode 
                      ? "Demo Mode" 
                      : raspberryPiIp 
                        ? `${raspberryPiIp}:${raspberryPiPort}` 
                        : "Not configured"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right - User Profile & Notifications */}
          <div className="flex items-center">
            {/* Demo Mode Indicator */}
            {isDemoMode && (
              <div className="hidden md:flex items-center mr-4">
                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded">
                  Demo Mode
                </span>
              </div>
            )}
            
            {/* Notifications */}
            <button className="p-2 rounded-full text-gray-500 hover:text-gray-700 focus:outline-none">
              <Bell className="h-5 w-5" />
            </button>

            {/* User Profile */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center ml-4 focus:outline-none">
                  <div className="flex items-center">
                    <div className="h-8 w-8 rounded-full bg-gray-500 flex items-center justify-center text-white">
                      {user.name?.[0] || user.email?.[0] || <UserIcon className="h-5 w-5" />}
                    </div>
                    <div className="ml-2 hidden md:flex md:flex-col">
                      <span className="text-sm font-medium text-gray-700 truncate max-w-[150px]">
                        {user.name || user.email}
                      </span>
                      <span className="text-xs font-medium text-gray-500 truncate">
                        {user.role}
                      </span>
                    </div>
                    <ChevronDown className="ml-1 h-4 w-4 text-gray-500" />
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{user.name || "User"}</p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
                <DropdownMenuSeparator />
                <Link href="/dashboard/settings">
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" /> Settings
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/login" })}>
                  <LogOut className="mr-2 h-4 w-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
} 