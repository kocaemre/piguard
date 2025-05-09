"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { useDemo } from "@/app/lib/DemoContext";
import { RefreshCw, AlertCircle, Cpu, HardDrive, Thermometer, Gauge } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

export default function DashboardPage() {
  const { isDemoMode } = useDemo();
  const [statusData, setStatusData] = useState<any>(null);
  const [statusRetryCount, setStatusRetryCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [isUsingCachedStatus, setIsUsingCachedStatus] = useState(false);
  const [statusLastUpdated, setStatusLastUpdated] = useState<string | null>(null);
  const maxRetries = 3;
  const [metrics, setMetrics] = useState([
    {
      id: "cpu",
      title: "CPU Usage",
      value: "--",
      change: "--",
      changeType: "neutral",
      icon: <Cpu className="h-5 w-5 text-blue-500" />
    },
    {
      id: "ram",
      title: "RAM",
      value: "--",
      change: "--",
      changeType: "neutral", 
      icon: <HardDrive className="h-5 w-5 text-green-500" />
    },
    {
      id: "temp",
      title: "Temperature",
      value: "--",
      change: "--",
      changeType: "neutral",
      icon: <Thermometer className="h-5 w-5 text-red-500" />
    },
    {
      id: "gpu",
      title: "GPU Temperature",
      value: "--",
      change: "--",
      changeType: "neutral",
      icon: <Gauge className="h-5 w-5 text-purple-500" />
    },
  ]);
  
  useEffect(() => {
    fetchData();
    
    const interval = setInterval(fetchData, 20000); // Update every 20 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch status data
      try {
        const response = await fetch('/api/robot-db/status');
        if (response.ok) {
          const data = await response.json();
          
          // Check for isFromCache flag
          if (data.isFromCache) {
            setIsUsingCachedStatus(true);
            setStatusLastUpdated(data.lastUpdated);
          } else {
            setIsUsingCachedStatus(false);
            setStatusLastUpdated(null);
          }
          
          if (data) {
            setStatusData(data);
            setStatusError(null);
            setStatusRetryCount(0);
            
            // Format metrics from the received data
            setMetrics([
              {
                id: "cpu",
                title: "CPU Usage",
                value: `${data.cpu || "--"}`,
                change: data.cpu_change || "--",
                changeType: data.cpu_change && parseFloat(data.cpu_change) > 0 ? "increase" : "decrease",
                icon: <Cpu className="h-5 w-5 text-blue-500" />
              },
              {
                id: "ram",
                title: "RAM Usage",
                value: `${data.ram || "--"}`,
                change: data.ram_change || "--",
                changeType: data.ram_change && parseFloat(data.ram_change) > 0 ? "increase" : "decrease",
                icon: <HardDrive className="h-5 w-5 text-green-500" />
              },
              {
                id: "temp",
                title: "CPU Temperature",
                value: `${data.temperature || "--"}`,
                change: data.temp_change || "--",
                changeType: data.temp_change && parseFloat(data.temp_change) > 0 ? "increase" : "decrease",
                icon: <Thermometer className="h-5 w-5 text-red-500" />
              },
              {
                id: "gpu",
                title: "GPU Temperature",
                value: `${data.gpu_temp || "--"}`,
                change: "0.0",
                changeType: "neutral",
                icon: <Gauge className="h-5 w-5 text-purple-500" />
              },
            ]);
          } else {
            setStatusError("System status data not available");
          }
        } else {
          setStatusRetryCount(prev => {
            const newCount = prev + 1;
            if (newCount >= maxRetries) {
              setStatusError("Unable to fetch system status data. Please check your connection.");
            }
            return newCount;
          });
        }
      } catch (err) {
        console.error("Error fetching system status data:", err);
        setStatusRetryCount(prev => {
          const newCount = prev + 1;
          if (newCount >= maxRetries) {
            setStatusError("Unable to fetch system status data. Please check your connection.");
          }
          return newCount;
        });
      }
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Handle refresh for status data
  const handleStatusRefresh = () => {
    setStatusRetryCount(0);
    setStatusError(null);
    fetchData();
  };

  // Get last system update time
  const lastSystemUpdate = statusData?.timestamp ? new Date(statusData.timestamp).toLocaleString() : "N/A";

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-gray-500 mt-2">
            Monitor and control your Raspberry Pi robot.
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500">Last System Update</div>
          <div className="text-lg font-medium">{lastSystemUpdate}</div>
        </div>
      </div>

      {/* Cache Notice */}
      {isUsingCachedStatus && (
        <div className="bg-amber-50 border-l-4 border-amber-400 p-4">
          <div className="flex">
            <AlertCircle className="h-6 w-6 text-amber-500 mr-2 flex-shrink-0" />
            <div>
              <p className="font-medium text-amber-700">Using cached data</p>
              <p className="text-sm text-amber-600">
                Unable to connect to the robot API. Showing previously cached data.
                {isUsingCachedStatus && statusLastUpdated && (
                  <span className="block">System status last updated: {new Date(statusLastUpdated).toLocaleString()}</span>
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Refresh Button */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={handleStatusRefresh}
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh Data
        </Button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-2">
        {metrics.map((metric, i) => (
          <Card key={i} className="border-l-4" style={{ borderLeftColor: metric.id === 'cpu' ? '#3b82f6' : 
                                                                  metric.id === 'ram' ? '#22c55e' : 
                                                                  metric.id === 'temp' ? '#ef4444' : 
                                                                  '#a855f7' }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 flex items-center">
                {metric.icon}
                <span className="ml-2">{metric.title}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              {metric.value === "Data not available" ? (
                <div className="text-xs font-medium mt-2 text-amber-600">
                  Data not available
                </div>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>

      {statusError && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
          <p className="font-medium">Error: {statusError}</p>
          {statusRetryCount >= maxRetries && (
            <p>Maximum retry attempts reached. Please refresh manually.</p>
          )}
        </div>
      )}

      {/* Robot Image */}
      <div className="flex flex-col items-center mt-0">
        <div className="relative w-256 h-256">
          <Image
            src="/robot.jpeg"
            alt="Robot Assistant"
            fill
            style={{ objectFit: "contain" }}
            priority
            onError={(e) => {
              // Fallback for image error
              const target = e.target as HTMLImageElement;
              target.onerror = null;
              target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 24 24' fill='none' stroke='%23888888' stroke-width='1' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='12' cy='8' r='5'/%3E%3Cpath d='M20 21v-2a5 5 0 0 0-5-5H9a5 5 0 0 0-5 5v2'/%3E%3C/svg%3E";
            }}
          />
        </div>
        <p className="mt-0 text-gray-500 text-sm">PiGuard Robot Monitoring System</p>
      </div>
    </div>
  );
} 