"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { AlertTriangle, Save, Shield } from "lucide-react";
import { useDemo } from "@/app/lib/DemoContext";
import { toast } from "react-hot-toast";
import Link from "next/link";

export default function SettingsPage() {
  // Demo mode state
  const { isDemoMode, setIsDemoMode, loading: demoLoading } = useDemo();
  
  // Raspberry Pi settings
  const [raspberryPiIp, setRaspberryPiIp] = useState("10.146.43.159");
  const [raspberryPiPort, setRaspberryPiPort] = useState("5000");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Load current settings on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch("/api/settings/raspberry-pi");
        if (response.ok) {
          const data = await response.json();
          setRaspberryPiIp(data.ip || "");
          setRaspberryPiPort(data.port || "5000");
        }
      } catch (error) {
        console.error("Failed to fetch Raspberry Pi settings:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
    
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

  // Save demo mode settings
  const handleDemoModeToggle = async (enabled: boolean) => {
    try {
      setIsDemoMode(enabled);
      
      // Save to the server
      const response = await fetch("/api/settings/demo-mode", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ enabled }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to save demo mode setting");
      }
      
      toast.success(`Demo mode ${enabled ? "enabled" : "disabled"}`);
    } catch (error) {
      console.error("Error saving demo mode:", error);
      toast.error("Failed to update demo mode");
      // Revert the state if there was an error
      setIsDemoMode(!enabled);
    }
  };

  // Save Raspberry Pi settings
  const handleSaveRaspberryPi = async () => {
    setIsSaving(true);
    
    try {
      const response = await fetch("/api/settings/raspberry-pi", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ip: raspberryPiIp,
          port: raspberryPiPort,
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to save settings");
      }
      
      toast.success("Raspberry Pi settings saved");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  // Validate IP address format
  const isValidIp = (ip: string) => {
    if (!ip) return true; // Empty is valid (not set)
    const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/;
    return ipPattern.test(ip);
  };

  // Validate port format
  const isValidPort = (port: string) => {
    if (!port) return false;
    const portNum = parseInt(port, 10);
    return !isNaN(portNum) && portNum >= 1 && portNum <= 65535;
  };

  const canSaveRaspberryPi = (!raspberryPiIp || isValidIp(raspberryPiIp)) && isValidPort(raspberryPiPort);

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

        {/* Demo Mode Card */}
        <Card>
          <CardHeader>
            <CardTitle>Demo Mode</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Enable Demo Mode</p>
                <p className="text-sm text-gray-500">
                  Run the application without connecting to actual hardware
                </p>
              </div>
              <Switch 
                checked={isDemoMode} 
                onCheckedChange={handleDemoModeToggle}
                disabled={demoLoading}
              />
            </div>
            
            {isDemoMode && (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                <div className="flex">
                  <AlertTriangle className="h-6 w-6 text-yellow-500 mr-2" />
                  <div>
                    <p className="font-medium text-yellow-700">Demo Mode Active</p>
                    <p className="text-sm text-yellow-600">
                      The system is running in demo mode. No actual robot hardware will be controlled.
                      This is useful for testing the interface without a Raspberry Pi connected.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Raspberry Pi Settings Card */}
        <Card>
          <CardHeader>
            <CardTitle>Raspberry Pi Connection</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800"></div>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <label htmlFor="ip" className="text-sm font-medium">
                    IP Address
                  </label>
                  <Input
                    id="ip"
                    value={raspberryPiIp}
                    onChange={(e) => setRaspberryPiIp(e.target.value)}
                    placeholder="e.g. 192.168.1.100"
                    className={!isValidIp(raspberryPiIp) ? "border-red-500" : ""}
                  />
                  {!isValidIp(raspberryPiIp) && (
                    <p className="text-sm text-red-500">
                      Please enter a valid IP address
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="port" className="text-sm font-medium">
                    Port
                  </label>
                  <Input
                    id="port"
                    value={raspberryPiPort}
                    onChange={(e) => setRaspberryPiPort(e.target.value)}
                    placeholder="e.g. 5000"
                    className={!isValidPort(raspberryPiPort) ? "border-red-500" : ""}
                  />
                  {!isValidPort(raspberryPiPort) && (
                    <p className="text-sm text-red-500">
                      Please enter a valid port (1-65535)
                    </p>
                  )}
                </div>

                <Button 
                  onClick={handleSaveRaspberryPi} 
                  disabled={isSaving || !canSaveRaspberryPi || isDemoMode}
                  className="w-full mt-4"
                >
                  {isSaving ? (
                    <>
                      <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" /> Save Connection Settings
                    </>
                  )}
                </Button>

                {isDemoMode && (
                  <p className="text-sm text-yellow-600 mt-2">
                    These settings are disabled while in Demo Mode
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 