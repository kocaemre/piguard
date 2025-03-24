"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { useDemo } from "@/app/lib/DemoContext";
import { MapPin, Navigation, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import dynamic from "next/dynamic";

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
  const { isDemoMode } = useDemo();
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [gpsData, setGpsData] = useState<any[]>([]);
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
      title: "CPU Usage",
      value: "--",
      change: "--",
      changeType: "neutral",
      isDevelopment: true
    },
    {
      title: "RAM",
      value: "--",
      change: "--",
      changeType: "neutral",
      isDevelopment: true
    },
    {
      title: "Temperature",
      value: "--",
      change: "--",
      changeType: "neutral",
      isDevelopment: true
    },
    {
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
  }, [isDemoMode]);

  const fetchData = async () => {
    if (isDemoMode) {
      // Generate mock GPS data for demo
      setGpsData(generateRealisticPath(30));
      setLoading(false);
      return;
    }
    
    try {
      // Fetch GPS data through our proxy
      try {
        const gpsResponse = await fetch('/api/proxy?endpoint=gps');
        
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
      
      // Fetch status data through our proxy
      try {
        const statusResponse = await fetch('/api/proxy?endpoint=status');
        
        if (statusResponse.ok) {
          const data = await statusResponse.json();
          setStatusData(data);
          setStatusError(null);
          setStatusRetryCount(0);
          
          // Update metrics based on status data if available
          if (data) {
            setMetrics([
              {
                title: "CPU Usage",
                value: data.cpu || "--",
                change: data.cpu_change || "--",
                changeType: data.cpu_change && parseFloat(data.cpu_change) > 0 ? "increase" : "decrease",
                isDevelopment: !data.cpu
              },
              {
                title: "RAM",
                value: data.ram || "--",
                change: data.ram_change || "--",
                changeType: data.ram_change && parseFloat(data.ram_change) > 0 ? "increase" : "decrease",
                isDevelopment: !data.ram
              },
              {
                title: "Temperature",
                value: data.temperature || "--",
                change: data.temp_change || "--",
                changeType: data.temp_change && parseFloat(data.temp_change) > 0 ? "increase" : "decrease",
                isDevelopment: !data.temperature
              },
              {
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
                <div
                  className={`text-xs font-medium mt-2 ${
                    metric.changeType === "increase"
                      ? "text-red-600"
                      : "text-green-600"
                  }`}
                >
                  {metric.change} since last hour
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

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
              {statusItems.map((item, i) => (
                <div key={i} className="flex justify-between items-center border-b pb-2 last:border-0">
                  <span className="text-gray-500">{item.label}</span>
                  <span className="font-medium">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Map */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Robot Location</CardTitle>
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
            {gpsError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm">
                <p className="font-medium">Error: {gpsError}</p>
                {gpsRetryCount >= maxRetries && (
                  <p>Maximum retry attempts reached. Please refresh manually.</p>
                )}
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