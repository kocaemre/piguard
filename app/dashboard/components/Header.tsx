"use client";

import { User } from "next-auth";
import { signOut } from "next-auth/react";
import { LogOut, Settings, User as UserIcon } from "lucide-react";
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
import { usePathname } from "next/navigation";

interface HeaderProps {
  user: User;
}

export default function Header({ user }: HeaderProps) {
  const pathname = usePathname();
  const { isDemoMode, toggleDemoMode } = useDemo();
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

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-end">
        <div className="flex items-center space-x-4">
          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-2 px-3 py-2 rounded-md">
                <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                  <UserIcon className="h-4 w-4 text-gray-500" />
                </div>
                <span className="hidden sm:inline">{user?.name || "User"}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <div className="flex items-center justify-start gap-2 p-2">
                <div className="flex flex-col space-y-1 leading-none">
                  {user?.name && <p className="font-medium">{user.name}</p>}
                  {user?.email && (
                    <p className="w-[200px] truncate text-sm text-gray-500">
                      {user.email}
                    </p>
                  )}
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings" className="cursor-pointer w-full flex items-center">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer text-red-600 focus:text-red-600"
                onSelect={(event) => {
                  event.preventDefault();
                  signOut({ callbackUrl: '/auth/login' });
                }}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
} 