"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { useDemo } from "@/app/lib/DemoContext";
import { MapPin, Navigation, RefreshCw, Database, Cpu, HardDrive } from "lucide-react";
import { Button } from "@/components/ui/button";
import dynamic from "next/dynamic";
import { dummyGpsData } from "@/app/lib/dummyGpsData";
import { Switch } from "@/components/ui/switch";

// Dynamically import map components to avoid SSR issues
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import("react-leaflet").then((mod) => mod.Popup),
  { ssr: false }
);
const Polyline = dynamic(
  () => import("react-leaflet").then((mod) => mod.Polyline),
  { ssr: false }
);

// Fixed marker icon component to fix Leaflet icon issues in Next.js
const MarkerIcon = () => {
  useEffect(() => {
    const L = require("leaflet");
    delete L.Icon.Default.prototype._getIconUrl;
    
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
      iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
      shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    });
  }, []);
  
  return null;
};

// Generate realistic movement path with smooth curves
const generateRealisticPath = (count: number) => {
  // Mimicking a robot's movement pattern - starting point (Istanbul)
  const baseLat = 41.015137;
  const baseLng = 28.979530;
  const data = [];
  
  // Create an initial path pattern that looks like a robot exploration
  // For a demo, we'll make a slightly randomized path 
  let currentLat = baseLat;
  let currentLng = baseLng;
  
  // First data point
  data.push({
    latitude: currentLat,
    longitude: currentLng,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    altitude: 100 + Math.random() * 5,
    satellites: Math.floor(Math.random() * 3) + 6,
    signalStrength: 75 + Math.random() * 15,
  });
  
  // Direction changes to create a more realistic path
  const movementPatterns = [
    { lat: 0.0002, lng: 0.0001 },   // Northeast
    { lat: 0.0001, lng: 0.0003 },   // East
    { lat: -0.0001, lng: 0.0002 },  // Southeast
    { lat: -0.0002, lng: 0 },       // South
    { lat: -0.0001, lng: -0.0002 }, // Southwest
    { lat: 0.0001, lng: -0.0002 },  // West
    { lat: 0.0003, lng: 0 },        // North
  ];
  
  // Generate the path
  for (let i = 1; i < count; i++) {
    // Gradually change direction to create a smooth path
    const pattern = movementPatterns[Math.floor(i / 10) % movementPatterns.length];
    const randomFactor = 0.6 + Math.random() * 0.8; // Randomize the movement a bit
    
    currentLat += pattern.lat * randomFactor;
    currentLng += pattern.lng * randomFactor;
    
    // Add some very small random noise for naturalness
    currentLat += (Math.random() - 0.5) * 0.00005;
    currentLng += (Math.random() - 0.5) * 0.00005;
    
    // Calculate time for this point (going backwards from now)
    const time = new Date(Date.now() - (count - i) * 15000);
    
    data.push({
      latitude: currentLat,
      longitude: currentLng,
      time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      altitude: 100 + Math.sin(i / 5) * 5 + Math.random() * 2,
      satellites: Math.floor(Math.random() * 3) + 6,
      signalStrength: 75 + Math.sin(i / 10) * 10 + Math.random() * 5,
    });
  }
  
  return data;
};

export default function DashboardPage() {
  const { isDemoMode, useDummyGpsData, toggleDummyGpsData } = useDemo();
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [gpsData, setGpsData] = useState<any[]>([]);
  const [currentDummyIndex, setCurrentDummyIndex] = useState(0);
  const [showPath, setShowPath] = useState(true);
  const [statusData, setStatusData] = useState<any>(null);
  const [gpsRetryCount, setGpsRetryCount] = useState(0);
  const [statusRetryCount, setStatusRetryCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const maxRetries = 10;
  const [metrics, setMetrics] = useState([
    {
      id: "cpu",
      title: "CPU Usage",
      value: "--",
      change: "--",
      changeType: "neutral",
      isDevelopment: true
    },
    {
      id: "ram",
      title: "RAM",
      value: "--",
      change: "--",
      changeType: "neutral",
      isDevelopment: true
    },
    {
      id: "temp",
      title: "Temperature",
      value: "--",
      change: "--",
      changeType: "neutral",
      isDevelopment: true
    },
    {
      id: "battery",
      title: "Battery",
      value: "--",
      change: "--",
      changeType: "neutral",
      isDevelopment: true
    },
  ]);
  
  // Load Leaflet CSS and fetch data
  useEffect(() => {
    const loadLeafletCSS = async () => {
      // @ts-ignore - Importing CSS file directly
      await import('leaflet/dist/leaflet.css');
      setLeafletLoaded(true);
    };
    
    loadLeafletCSS();
    
    fetchData();
    
    // Set up polling interval
    const interval = setInterval(fetchData, 5000); // Update every 5 seconds
    
    return () => clearInterval(interval);
  }, [isDemoMode, useDummyGpsData]);

  const fetchData = async () => {
    if (isDemoMode) {
      // Generate mock GPS data for demo
      setGpsData(generateRealisticPath(30));
      setLoading(false);
      return;
    }
    
    if (useDummyGpsData) {
      // Use dummy GPS data
      const newGpsData = [...gpsData];
      const dummyPoint = {
        latitude: dummyGpsData[currentDummyIndex].latitude,
        longitude: dummyGpsData[currentDummyIndex].longitude,
        altitude: dummyGpsData[currentDummyIndex].altitude,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        satellites: Math.floor(Math.random() * 3) + 6,
        signalStrength: 75 + Math.random() * 15,
      };

      newGpsData.push(dummyPoint);
      
      // Keep only the last 30 points
      if (newGpsData.length > 30) {
        newGpsData.shift();
      }
      
      setGpsData(newGpsData);
      
      // Move to the next dummy data point
      setCurrentDummyIndex((prevIndex) => (prevIndex + 1) % dummyGpsData.length);
      
      // If we have status data, keep it, otherwise generate dummy status
      if (!statusData) {
        setStatusData({
          cpu: "25%",
          cpu_change: "-2.5%",
          ram: "512MB / 2GB",
          ram_change: "+45MB",
          temperature: "42°C",
          temp_change: "+1.5°C",
          battery: "85%",
          battery_change: "-5%",
          timestamp: new Date().toISOString(),
          camera: "connected",
          warnings: "0",
          uptime: "4h 23m",
        });
      }
      
      setGpsError(null);
      setStatusError(null);
      setLoading(false);
      return;
    }
    
    // Check if we should use the dummy data API
    const { useDummyData } = useDemo();
    
    try {
      // Fetch GPS data
      try {
        // Use the dummy API endpoint or real API based on useDummyData
        const gpsResponse = await fetch(`/api/proxy?endpoint=gps${useDummyData ? '&dummy=true' : ''}`);
        
        if (gpsResponse.ok) {
          const singleGpsPoint = await gpsResponse.json();
          setGpsError(null);
          setGpsRetryCount(0);
          
          // Transform single GPS point to an array for compatibility
          const newGpsData = [...gpsData];
          
          // Add new point if we have valid coordinates
          if (singleGpsPoint.latitude !== 0 && singleGpsPoint.longitude !== 0) {
            newGpsData.push(singleGpsPoint);
            
            // Keep only the last 30 points
            if (newGpsData.length > 30) {
              newGpsData.shift();
            }
            
            setGpsData(newGpsData);
          } else if (newGpsData.length === 0) {
            // If we have no data yet and got zeros, use demo data
            setGpsData(generateRealisticPath(5));
          }
        } else {
          // Increment retry count for GPS
          setGpsRetryCount(prev => {
            const newCount = prev + 1;
            if (newCount >= maxRetries) {
              setGpsError("Failed to fetch GPS data after multiple attempts.");
            }
            return newCount;
          });
        }
      } catch (err) {
        console.error("Error fetching GPS data:", err);
        // Increment retry count for GPS
        setGpsRetryCount(prev => {
          const newCount = prev + 1;
          if (newCount >= maxRetries) {
            setGpsError("Failed to fetch GPS data after multiple attempts.");
          }
          return newCount;
        });
      }
      
      // Fetch status data 
      try {
        // Use the dummy API endpoint or real API based on useDummyData
        const statusResponse = await fetch(`/api/proxy?endpoint=status${useDummyData ? '&dummy=true' : ''}`);
        
        if (statusResponse.ok) {
          const data = await statusResponse.json();
          setStatusData(data);
          setStatusError(null);
          setStatusRetryCount(0);
          
          // Update metrics based on status data if available
          if (data) {
            setMetrics([
              {
                id: "cpu",
                title: "CPU Usage",
                value: data.cpu || "--",
                change: data.cpu_change || "--",
                changeType: data.cpu_change && parseFloat(data.cpu_change) > 0 ? "increase" : "decrease",
                isDevelopment: !data.cpu
              },
              {
                id: "ram",
                title: "RAM",
                value: data.ram || "--",
                change: data.ram_change || "--",
                changeType: data.ram_change && parseFloat(data.ram_change) > 0 ? "increase" : "decrease",
                isDevelopment: !data.ram
              },
              {
                id: "temp",
                title: "Temperature",
                value: data.temperature || "--",
                change: data.temp_change || "--",
                changeType: data.temp_change && parseFloat(data.temp_change) > 0 ? "increase" : "decrease",
                isDevelopment: !data.temperature
              },
              {
                id: "battery",
                title: "Battery",
                value: data.battery || "--",
                change: data.battery_change || "--",
                changeType: data.battery_change && parseFloat(data.battery_change) > 0 ? "increase" : "decrease",
                isDevelopment: !data.battery
              },
            ]);
          }
        } else {
          // Increment retry count for status
          setStatusRetryCount(prev => {
            const newCount = prev + 1;
            if (newCount >= maxRetries) {
              setStatusError("Failed to fetch status data after multiple attempts.");
            }
            return newCount;
          });
        }
      } catch (err) {
        console.error("Error fetching status data:", err);
        // Increment retry count for status
        setStatusRetryCount(prev => {
          const newCount = prev + 1;
          if (newCount >= maxRetries) {
            setStatusError("Failed to fetch status data after multiple attempts.");
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

  // Handle refresh for GPS data
  const handleGpsRefresh = () => {
    setGpsRetryCount(0);
    setGpsError(null);
    fetchData();
  };

  // Handle refresh for status data
  const handleStatusRefresh = () => {
    setStatusRetryCount(0);
    setStatusError(null);
    fetchData();
  };

  // Status information
  const statusItems = [
    { 
      label: "Last Connection", 
      value: statusData ? 
        new Date(statusData.timestamp || Date.now()).toLocaleTimeString() : 
        "Just now" 
    },
    { 
      label: "Active Sensors", 
      value: statusData ? 
        `${statusData.camera === "connected" ? "1" : "0"}/2` : 
        "Unknown" 
    },
    { 
      label: "Warnings", 
      value: statusData ? 
        (statusData.warnings || "0") : 
        "0" 
    },
    { 
      label: "Uptime", 
      value: statusData ? 
        (statusData.uptime || "Unknown") : 
        "Unknown" 
    },
  ];

  // Additional system information
  const additionalInfo = statusData ? [
    {
      label: "Disk Usage",
      value: statusData.disk_usage ? 
        `${statusData.disk_usage.used} / ${statusData.disk_usage.total}` : 
        "Unknown"
    },
    {
      label: "Network IP",
      value: statusData.network?.ip || "Unknown"
    },
    {
      label: "Network Signal",
      value: statusData.network?.signal_strength || "Unknown"
    },
    {
      label: "Network Status",
      value: statusData.network?.status || "Unknown",
      updated: statusData.network?.updated
    }
  ] : [];

  // Get current GPS position
  const currentPosition = gpsData.length > 0 ? gpsData[gpsData.length - 1] : null;
  
  // Default center (Istanbul) if no GPS data
  const mapCenter = currentPosition 
    ? [currentPosition.latitude, currentPosition.longitude] 
    : [41.015137, 28.979530];
    
  // Create line coordinates for path
  const pathPositions = gpsData.map(point => [point.latitude, point.longitude]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-500 mt-2">
          Welcome to the Robot Management System. Monitor and control your Raspberry Pi robot.
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                {metric.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              {metric.value === "--" ? (
                <div className="text-xs font-medium mt-2 text-amber-600">
                  Development mode - no real data
                </div>
              ) : (
                <>
                  <div
                    className={`text-xs font-medium mt-2 ${
                      metric.changeType === "increase"
                        ? "text-red-600"
                        : "text-green-600"
                    }`}
                  >
                    {metric.change} since last check
                  </div>
                  {statusData && statusData[`${metric.id}_details`] && (
                    <div className="text-xs text-gray-500 mt-1">
                      Updated: {statusData[`${metric.id}_details`].updated}
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* CPU and RAM Details */}
      {statusData && (statusData.cpu_details || statusData.ram_details) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* CPU Details */}
          {statusData.cpu_details && (
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-medium flex items-center">
                    <Cpu className="h-5 w-5 mr-2 text-blue-500" />
                    CPU Performance
                  </CardTitle>
                  <div className="text-xs text-gray-500">
                    Updated: {statusData.cpu_details.updated}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* CPU Usage Bar */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-500">Usage</span>
                      <span className="text-sm font-medium">{statusData.cpu}  
                        <span className={`ml-2 text-xs ${statusData.cpu_change.startsWith('+') ? 'text-red-500' : 'text-green-500'}`}>
                          {statusData.cpu_change}
                        </span>
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-blue-600 h-2.5 rounded-full"
                        style={{ width: statusData.cpu_details.usage + '%' }}
                      ></div>
                    </div>
                  </div>

                  {/* CPU Cores */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">CPU Cores</h3>
                    <div className="grid grid-cols-4 gap-2">
                      {Array.from({ length: statusData.cpu_details.cores || 4 }).map((_, i) => {
                        const coreUsage = Math.floor(
                          statusData.cpu_details.usage * (0.75 + Math.random() * 0.5)
                        );
                        return (
                          <div key={i} className="text-center">
                            <div className="relative h-20 w-full bg-gray-100 rounded-md overflow-hidden">
                              <div
                                className="absolute bottom-0 w-full bg-blue-500 rounded-b-md transition-all duration-500"
                                style={{ height: `${coreUsage}%` }}
                              ></div>
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div>
                                  <div className="text-xs font-medium">Core {i + 1}</div>
                                  <div className="text-sm font-bold">{coreUsage}%</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Additional CPU Info */}
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div className="bg-gray-50 p-3 rounded-md">
                      <div className="text-sm text-gray-500">Processes</div>
                      <div className="text-xl font-bold">{statusData.cpu_details.processes || '--'}</div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-md">
                      <div className="text-sm text-gray-500">Threads</div>
                      <div className="text-xl font-bold">{statusData.cpu_details.processes ? Math.floor(statusData.cpu_details.processes * 2.5) : '--'}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* RAM Details */}
          {statusData.ram_details && (
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-medium flex items-center">
                    <HardDrive className="h-5 w-5 mr-2 text-green-500" />
                    Memory Usage
                  </CardTitle>
                  <div className="text-xs text-gray-500">
                    Updated: {statusData.ram_details.updated}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* RAM Usage Bar */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-500">Memory</span>
                      <span className="text-sm font-medium">{statusData.ram}
                        <span className={`ml-2 text-xs ${statusData.ram_change.startsWith('+') ? 'text-red-500' : 'text-green-500'}`}>
                          {statusData.ram_change}
                        </span>
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-green-500 h-2.5 rounded-full"
                        style={{ width: (statusData.ram_details.used / statusData.ram_details.total * 100) + '%' }}
                      ></div>
                    </div>
                  </div>

                  {/* Memory Distribution */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-3">Memory Distribution</h3>
                    <div className="relative h-48 w-full bg-gray-50 rounded-md overflow-hidden p-4">
                      <div className="h-full flex items-end">
                        {/* Used Memory */}
                        <div
                          className="w-1/3 bg-green-400 rounded-t-md mx-1 relative group"
                          style={{ height: `${(statusData.ram_details.used / statusData.ram_details.total * 100)}%` }}
                        >
                          <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-medium text-gray-600">
                            Used
                          </div>
                          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white text-xs py-1 px-2 rounded pointer-events-none">
                            {statusData.ram_details.used}MB
                          </div>
                        </div>
                        
                        {/* Free Memory */}
                        <div
                          className="w-1/3 bg-blue-300 rounded-t-md mx-1 relative group"
                          style={{ height: `${(statusData.ram_details.free / statusData.ram_details.total * 100)}%` }}
                        >
                          <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-medium text-gray-600">
                            Free
                          </div>
                          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white text-xs py-1 px-2 rounded pointer-events-none">
                            {statusData.ram_details.free}MB
                          </div>
                        </div>
                        
                        {/* Cached Memory (simulated) */}
                        <div
                          className="w-1/3 bg-gray-300 rounded-t-md mx-1 relative group"
                          style={{ height: `${Math.min(30, 100 - (statusData.ram_details.used / statusData.ram_details.total * 100))}%` }}
                        >
                          <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-medium text-gray-600">
                            Cached
                          </div>
                          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white text-xs py-1 px-2 rounded pointer-events-none">
                            {Math.floor(statusData.ram_details.total * 0.2)}MB
                          </div>
                        </div>
                      </div>
                      <div className="absolute bottom-2 left-0 right-0 text-center text-xs text-gray-500">
                        Total: {statusData.ram_details.total}MB
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Status Summary and Location Map */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Summary */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Status Summary</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={handleStatusRefresh}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh Status
            </Button>
          </CardHeader>
          <CardContent>
            {statusError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
                <p className="font-medium">Error: {statusError}</p>
                {statusRetryCount >= maxRetries && (
                  <p>Maximum retry attempts reached. Please refresh manually.</p>
                )}
              </div>
            )}
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">System Status</h3>
                {statusItems.map((item, i) => (
                  <div key={i} className="flex justify-between items-center border-b pb-2 last:border-0 last:pb-0 mb-2">
                    <span className="text-gray-500">{item.label}</span>
                    <span className="font-medium">{item.value}</span>
                  </div>
                ))}
              </div>
              
              {additionalInfo.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2 pt-2 border-t">System Resources</h3>
                  {additionalInfo.map((item, i) => (
                    <div key={i} className="flex justify-between items-center border-b pb-2 last:border-0 last:pb-0 mb-2">
                      <span className="text-gray-500">{item.label}</span>
                      <div className="text-right">
                        <span className="font-medium">{item.value}</span>
                        {item.updated && (
                          <div className="text-xs text-gray-400">
                            Updated: {item.updated}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Map */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle>Robot Location</CardTitle>
              {!isDemoMode && (
                <div className="flex items-center space-x-2 ml-4">
                  <Switch
                    checked={useDummyGpsData}
                    onCheckedChange={toggleDummyGpsData}
                    id="dummy-gps-mode"
                  />
                  <label htmlFor="dummy-gps-mode" className="text-sm text-gray-500 cursor-pointer select-none">
                    Use Dummy GPS Data
                  </label>
                </div>
              )}
            </div>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowPath(!showPath)}
              >
                {showPath ? "Hide Path" : "Show Path"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleGpsRefresh}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh GPS
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0 overflow-hidden rounded-b-lg">
            {gpsError && !useDummyGpsData && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm">
                <p className="font-medium">Error: {gpsError}</p>
                {gpsRetryCount >= maxRetries && (
                  <p>Maximum retry attempts reached. Please refresh manually or enable dummy GPS data.</p>
                )}
              </div>
            )}
            {useDummyGpsData && !isDemoMode && (
              <div className="p-3 bg-blue-50 border border-blue-200 text-blue-700 text-sm">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  <p className="font-medium">Using dummy GPS data for testing</p>
                </div>
              </div>
            )}
            {leafletLoaded && (
              <div className="h-[300px] w-full">
                <MarkerIcon />
                <MapContainer 
                  center={mapCenter as [number, number]} 
                  zoom={15} 
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  
                  {currentPosition && (
                    <Marker position={[currentPosition.latitude, currentPosition.longitude]}>
                      <Popup>
                        <div className="text-sm">
                          <div className="font-semibold mb-1">Current Location</div>
                          <div>Latitude: {currentPosition.latitude.toFixed(6)}</div>
                          <div>Longitude: {currentPosition.longitude.toFixed(6)}</div>
                          <div>Altitude: {currentPosition.altitude.toFixed(1)}m</div>
                          <div>Updated: {currentPosition.time}</div>
                        </div>
                      </Popup>
                    </Marker>
                  )}
                  
                  {showPath && pathPositions.length > 1 && (
                    <Polyline 
                      positions={pathPositions as [number, number][]} 
                      color="blue" 
                      weight={3}
                      opacity={0.7}
                    />
                  )}
                </MapContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 