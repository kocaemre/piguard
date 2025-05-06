"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { useDemo } from "@/app/lib/DemoContext";
import { MapPin, Navigation, RefreshCw, AlertCircle, Cpu, HardDrive } from "lucide-react";
import { Button } from "@/components/ui/button";
import dynamic from "next/dynamic";
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
  const [isUsingCachedGps, setIsUsingCachedGps] = useState(false);
  const [isUsingCachedStatus, setIsUsingCachedStatus] = useState(false);
  const [gpsLastUpdated, setGpsLastUpdated] = useState<string | null>(null);
  const [statusLastUpdated, setStatusLastUpdated] = useState<string | null>(null);
  const maxRetries = 3;
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
      id: "gpu",
      title: "GPU Temperature",
      value: "--",
      change: "--",
      changeType: "neutral",
      isDevelopment: true
    },
  ]);
  const [map, setMap] = useState<L.Map | null>(null);
  const [marker, setMarker] = useState<L.Marker | null>(null);
  const [polyline, setPolyline] = useState<L.Polyline | null>(null);
  
  useEffect(() => {
    const loadLeafletCSS = async () => {
      await import('leaflet/dist/leaflet.css');
      setLeafletLoaded(true);
    };
    
    loadLeafletCSS();
    fetchData();
    
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch GPS data
      try {
        const response = await fetch('/api/robot-db/gps');
        if (response.ok) {
          const data = await response.json();
          
          // Check if we have GPS data
          if (data && data.length > 0) {
            setGpsData(data);
            setGpsError(null);
            setGpsRetryCount(0);
            setIsUsingCachedGps(false);
            setGpsLastUpdated(null);
          } else {
            setGpsError("GPS data not available");
          }
        } else {
          setGpsRetryCount(prev => {
            const newCount = prev + 1;
            if (newCount >= maxRetries) {
              setGpsError("Unable to fetch GPS data. Please check your connection.");
            }
            return newCount;
          });
        }
      } catch (err) {
        console.error("Error fetching GPS data:", err);
        setGpsRetryCount(prev => {
          const newCount = prev + 1;
          if (newCount >= maxRetries) {
            setGpsError("Unable to fetch GPS data. Please check your connection.");
          }
          return newCount;
        });
      }

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
                value: data.cpu || "Data not available",
                change: data.cpu_change || "--",
                changeType: data.cpu_change && parseFloat(data.cpu_change) > 0 ? "increase" : "decrease",
                isDevelopment: !data.cpu
              },
              {
                id: "ram",
                title: "RAM",
                value: data.ram || "Data not available",
                change: data.ram_change || "--",
                changeType: data.ram_change && parseFloat(data.ram_change) > 0 ? "increase" : "decrease",
                isDevelopment: !data.ram
              },
              {
                id: "temp",
                title: "Temperature",
                value: data.temperature || "Data not available",
                change: data.temp_change || "--",
                changeType: data.temp_change && parseFloat(data.temp_change) > 0 ? "increase" : "decrease",
                isDevelopment: !data.temperature
              },
              {
                id: "gpu",
                title: "GPU Temperature",
                value: data.gpu_temp || "Data not available",
                change: "0.0",
                changeType: "neutral",
                isDevelopment: !data.gpu_temp
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

  // Calculate status items based on the status data from API
  const statusItems = [
    {
      label: "Connection Status",
      value: !statusData ? "Disconnected (No data)" : 
             isUsingCachedStatus ? "Offline (Using Cache)" : 
             "Online"
    },
    {
      label: "Camera Status",
      value: statusData ? (statusData.camera || "Unknown") : "No data"
    },
    {
      label: "Last Updated",
      value: !statusData ? "Never updated" :
             isUsingCachedStatus ? 
             `${new Date(statusLastUpdated || "").toLocaleString()} (Cached)` : 
             new Date(statusData.timestamp || "").toLocaleString()
    }
  ];

  // Get current GPS position
  const currentPosition = gpsData.length > 0 && 
                         gpsData[gpsData.length - 1].latitude && 
                         gpsData[gpsData.length - 1].longitude && 
                         !isNaN(gpsData[gpsData.length - 1].latitude) && 
                         !isNaN(gpsData[gpsData.length - 1].longitude)
    ? gpsData[gpsData.length - 1] 
    : null;
  
  // Default center (Istanbul) if no GPS data
  const mapCenter = currentPosition 
    ? [currentPosition.latitude, currentPosition.longitude] 
    : [41.015137, 28.979530];
    
  // Create line coordinates for path - eklenen valid koordinat kontrolü
  const pathPositions = gpsData
    .filter(point => 
      point && point.latitude && point.longitude && 
      !isNaN(point.latitude) && !isNaN(point.longitude)
    )
    .map(point => [point.latitude, point.longitude]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-500 mt-2">
          Welcome to the Robot Management System. Monitor and control your Raspberry Pi robot.
        </p>
      </div>

      {/* Cache Notice */}
      {(isUsingCachedGps || isUsingCachedStatus) && (
        <div className="bg-amber-50 border-l-4 border-amber-400 p-4">
          <div className="flex">
            <AlertCircle className="h-6 w-6 text-amber-500 mr-2 flex-shrink-0" />
            <div>
              <p className="font-medium text-amber-700">Using cached data</p>
              <p className="text-sm text-amber-600">
                Unable to connect to the robot API. Showing previously cached data.
                {isUsingCachedGps && gpsLastUpdated && (
                  <span className="block">GPS data last updated: {new Date(gpsLastUpdated).toLocaleString()}</span>
                )}
                {isUsingCachedStatus && statusLastUpdated && (
                  <span className="block">System status last updated: {new Date(statusLastUpdated).toLocaleString()}</span>
                )}
              </p>
            </div>
          </div>
        </div>
      )}

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
              {metric.value === "Data not available" ? (
                <div className="text-xs font-medium mt-2 text-amber-600">
                  Data not available
                </div>
              ) : (
                <>
                  <div
                    className={`text-xs font-medium mt-2 ${
                      metric.changeType === "increase"
                        ? "text-red-600"
                        : metric.changeType === "decrease"
                        ? "text-green-600"
                        : "text-gray-600"
                    }`}
                  >
                    {metric.change} last check
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
                        <span className={`ml-2 text-xs ${statusData.cpu_change?.startsWith('+') ? 'text-red-500' : 'text-green-500'}`}>
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
                        <span className={`ml-2 text-xs ${statusData.ram_change?.startsWith('+') ? 'text-red-500' : 'text-green-500'}`}>
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
              Refresh
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