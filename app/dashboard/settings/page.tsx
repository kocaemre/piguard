"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";
import Link from "next/link";

export default function SettingsPage() {
  const [isAdmin, setIsAdmin] = useState(false);

  // Load admin status on mount
  useEffect(() => {
    // Check if user is an admin
    const checkAdminStatus = async () => {
      try {
        const response = await fetch("/api/users/admin");
        setIsAdmin(response.ok);
      } catch (error) {
        console.error("Failed to check admin status:", error);
        setIsAdmin(false);
      }
    };
    
    checkAdminStatus();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-gray-500 mt-2">
          Configure your Pi Guard system settings
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Admin Settings Card */}
        <Card>
          <CardHeader>
            <CardTitle>Administrator Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">Admin Management</p>
                <p className="text-sm text-gray-500">
                  View and manage administrator users
                </p>
              </div>
              <Link href="/dashboard/settings/admin">
                <Button size="sm">
                  <Shield className="mr-2 h-4 w-4" /> 
                  Admin Settings
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 