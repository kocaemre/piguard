"use client";

import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Legend, BarChart, Bar
} from "recharts";
import { Button } from "@/components/ui/button";
import { useDemo } from "@/app/lib/DemoContext";
import { AlertTriangle, MapPin, Camera, Navigation, RefreshCw, Database } from "lucide-react";
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

// In a real app, this would come from your Raspberry Pi
const generateMockGPSData = (count: number) => {
  const now = new Date();
  const data = [];
  
  // Base coordinates (somewhere in Turkey)
  const baseLat = 41.015137;
  const baseLng = 28.979530;
  
  for (let i = count - 1; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 15000); // 15 seconds intervals
    data.push({
      time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      latitude: baseLat + (Math.random() - 0.5) * 0.001,
      longitude: baseLng + (Math.random() - 0.5) * 0.001,
      altitude: Math.round((100 + Math.sin(i / 5) * 10 + Math.random() * 2) * 10) / 10,
      satellites: Math.floor(Math.random() * 3) + 6, // 6-8 satellites
      signalStrength: Math.round((70 + Math.sin(i / 10) * 20 + Math.random() * 5) * 10) / 10,
    });
  }
  
  return data;
};

// Generate mock camera data
const generateMockCameraData = (count: number) => {
  const now = new Date();
  const data = [];
  
  for (let i = count - 1; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 15000); // 15 seconds intervals
    data.push({
      time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      framerate: Math.round((30 + Math.sin(i / 5) * 5 + Math.random() * 2) * 10) / 10,
      brightness: Math.round((60 + Math.cos(i / 8) * 10 + Math.random() * 5) * 10) / 10,
      contrast: Math.round((50 + Math.sin(i / 7) * 10 + Math.random() * 5) * 10) / 10,
      motionDetected: Math.random() > 0.7 ? 1 : 0,
    });
  }
  
  return data;
};

// Generate more realistic movement path with smooth curves
const generateRealisticPath = (count: number) => {
  // Mimicking a robot's movement pattern - starting point
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

export default function SensorsPage() {
  const { isDemoMode, loading: demoLoading, useDummyGpsData, toggleDummyGpsData } = useDemo();
  const [selectedTimeRange, setSelectedTimeRange] = useState<'15m' | '1h' | '24h'>('15m');
  const [gpsData, setGpsData] = useState<any[]>([]);
  const [cameraData, setCameraData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [showPath, setShowPath] = useState(true);
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [leafletIcon, setLeafletIcon] = useState<any>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [currentDummyIndex, setCurrentDummyIndex] = useState(0);
  const maxRetries = 10;
  
  // Load Leaflet CSS and setup Icon
  useEffect(() => {
    const loadLeafletResources = async () => {
      try {
        // Import Leaflet CSS
        await import('leaflet/dist/leaflet.css');
        
        // Import Leaflet and create icon
        const L = await import('leaflet');
        const icon = L.icon({
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41]
        });
        
        setLeafletIcon(icon);
        setLeafletLoaded(true);
        setMapReady(true);
      } catch (err) {
        console.error('Error loading Leaflet resources:', err);
      }
    };
    
    loadLeafletResources();
  }, []);
  
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      if (isDemoMode) {
        // Use mock data in demo mode - with realistic movement path
        const dataPoints = selectedTimeRange === '15m' ? 60 : selectedTimeRange === '1h' ? 120 : 240;
        setGpsData(generateRealisticPath(dataPoints));
        setCameraData(generateMockCameraData(dataPoints));
        setLoading(false);
        return;
      }

      if (useDummyGpsData) {
        // Use dummy GPS data with timestamps
        const now = new Date();
        const dataPoints = selectedTimeRange === '15m' ? 60 : selectedTimeRange === '1h' ? 120 : 240;
        const newGpsData = [];

        // Create a sequence of dummy points for the selected time range
        for (let i = 0; i < Math.min(dataPoints, dummyGpsData.length); i++) {
          // Calculate time offset for each point
          const timeOffset = dataPoints - i;
          const pointTime = new Date(now.getTime() - timeOffset * 15000);

          const dummyPoint = {
            latitude: dummyGpsData[i % dummyGpsData.length].latitude,
            longitude: dummyGpsData[i % dummyGpsData.length].longitude,
            altitude: dummyGpsData[i % dummyGpsData.length].altitude,
            time: pointTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            satellites: Math.floor(Math.random() * 3) + 6,
            signalStrength: 75 + Math.random() * 15,
          };
          newGpsData.push(dummyPoint);
        }

        setGpsData(newGpsData);
        setCameraData(generateMockCameraData(dataPoints));
        setLoading(false);
        return;
      }
      
      try {
        // Fetch GPS data via our proxy
        try {
          const gpsResponse = await fetch('/api/proxy?endpoint=gps');
          
          if (!gpsResponse.ok) {
            throw new Error(`Failed to connect to GPS API (Status: ${gpsResponse.status})`);
          }
          
          const singleGpsPoint = await gpsResponse.json();
          
          // Reset retry count on success
          setRetryCount(0);
          
          // If we have no data or got zeros, initialize with demo data
          if (gpsData.length === 0 || 
              (singleGpsPoint.latitude === 0 && singleGpsPoint.longitude === 0)) {
            const dataPoints = selectedTimeRange === '15m' ? 60 : selectedTimeRange === '1h' ? 120 : 240;
            setGpsData(generateRealisticPath(dataPoints));
          } else {
            // Add the new point to our history
            const newGpsData = [...gpsData];
            newGpsData.push(singleGpsPoint);
            
            // Keep only a certain number of points based on selected time range
            const maxPoints = selectedTimeRange === '15m' ? 60 : selectedTimeRange === '1h' ? 120 : 240;
            if (newGpsData.length > maxPoints) {
              newGpsData.shift();
            }
            
            setGpsData(newGpsData);
          }
        } catch (err) {
          console.error("Error fetching GPS data:", err);
          
          // Increment retry count
          setRetryCount(prev => {
            const newCount = prev + 1;
            if (newCount >= maxRetries) {
              setError(`Failed to fetch GPS data after ${maxRetries} attempts. Please try refreshing.`);
            }
            return newCount;
          });
          
          // If we have no data yet, initialize with demo data
          if (gpsData.length === 0) {
            const dataPoints = selectedTimeRange === '15m' ? 60 : selectedTimeRange === '1h' ? 120 : 240;
            setGpsData(generateRealisticPath(dataPoints));
          }
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        
        // Increment retry count
        setRetryCount(prev => {
          const newCount = prev + 1;
          if (newCount >= maxRetries) {
            setError(`Failed to fetch data after ${maxRetries} attempts. Please try refreshing.`);
          }
          return newCount;
        });
      } finally {
        setLoading(false);
      }
    };

    if (!demoLoading) {
      fetchData();
    }
    
    // Set up polling interval
    let interval: NodeJS.Timeout | null = null;
    
    if (!demoLoading && retryCount < maxRetries) {
      interval = setInterval(fetchData, 5000); // Poll every 5 seconds
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isDemoMode, demoLoading, selectedTimeRange, retryCount, useDummyGpsData]);
  
  const handleTimeRangeChange = (range: '15m' | '1h' | '24h') => {
    setSelectedTimeRange(range);
  };

  const handleRefresh = () => {
    // Reset retry counter and error state
    setRetryCount(0);
    setError(null);
    
    // Reload the data
    setGpsData([]);
    setCameraData([]);
    setLoading(true);
    
    if (isDemoMode) {
      const dataPoints = selectedTimeRange === '15m' ? 60 : selectedTimeRange === '1h' ? 120 : 240;
      setTimeout(() => {
        setGpsData(generateRealisticPath(dataPoints));
        setCameraData(generateMockCameraData(dataPoints));
        setLoading(false);
      }, 1000);
    } else if (useDummyGpsData) {
      // Refresh dummy GPS data
      const now = new Date();
      const dataPoints = selectedTimeRange === '15m' ? 60 : selectedTimeRange === '1h' ? 120 : 240;
      const newGpsData = [];

      // Create a sequence of dummy points for the selected time range
      for (let i = 0; i < Math.min(dataPoints, dummyGpsData.length); i++) {
        // Calculate time offset for each point
        const timeOffset = dataPoints - i;
        const pointTime = new Date(now.getTime() - timeOffset * 15000);

        const dummyPoint = {
          latitude: dummyGpsData[i % dummyGpsData.length].latitude,
          longitude: dummyGpsData[i % dummyGpsData.length].longitude,
          altitude: dummyGpsData[i % dummyGpsData.length].altitude,
          time: pointTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          satellites: Math.floor(Math.random() * 3) + 6,
          signalStrength: 75 + Math.random() * 15,
        };
        newGpsData.push(dummyPoint);
      }

      setTimeout(() => {
        setGpsData(newGpsData);
        setCameraData(generateMockCameraData(dataPoints));
        setLoading(false);
      }, 1000);
    } else {
      // This would fetch from the real API in a non-demo application
      setTimeout(() => {
        if (Math.random() > 0.7) {
          setError("Failed to connect to Raspberry Pi. Check connection or enable Demo Mode.");
        } else {
          setError(null);
          const dataPoints = selectedTimeRange === '15m' ? 60 : selectedTimeRange === '1h' ? 120 : 240;
          setGpsData(generateRealisticPath(dataPoints));
          setCameraData(generateMockCameraData(dataPoints));
        }
        setLoading(false);
      }, 1500);
    }
  };

  // Render the map component with proper icons
  const renderMap = () => {
    if (!mapReady || !leafletLoaded || !leafletIcon || gpsData.length === 0) {
      return (
        <div className="h-[400px] flex items-center justify-center bg-gray-100 rounded-md">
          <p className="text-gray-500">
            {loading ? "Loading map..." : "No GPS data available"}
          </p>
        </div>
      );
    }
    
    // Get current position from the latest GPS data
    const currentPosition = {
      lat: gpsData[gpsData.length - 1].latitude,
      lng: gpsData[gpsData.length - 1].longitude,
    };
    
    // Format path positions for polyline
    const pathPositions = gpsData.map(point => [
      point.latitude,
      point.longitude
    ]);
    
    return (
      <div className="h-[400px] rounded-lg border overflow-hidden">
        <MapContainer
          center={[currentPosition.lat, currentPosition.lng]}
          zoom={16}
          style={{ height: "100%", width: "100%" }}
          key={`map-${gpsData.length}`}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* Robot movement path */}
          {showPath && pathPositions.length > 1 && (
            <Polyline
              positions={pathPositions}
              color="#3b82f6"
              weight={3}
              opacity={0.7}
            />
          )}
          
          {/* Current position marker */}
          <Marker position={[currentPosition.lat, currentPosition.lng]} icon={leafletIcon}>
            <Popup>
              <div className="p-1">
                <p className="font-medium">Current Location</p>
                <p className="text-xs">
                  Lat: {currentPosition.lat.toFixed(6)}<br />
                  Lng: {currentPosition.lng.toFixed(6)}<br />
                  Alt: {gpsData[gpsData.length - 1].altitude} m
                </p>
                <p className="text-xs mt-1">
                  Signal: {gpsData[gpsData.length - 1].signalStrength}%<br />
                  Satellites: {gpsData[gpsData.length - 1].satellites}
                </p>
              </div>
            </Popup>
          </Marker>
        </MapContainer>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Sensor Data</h1>
        <p className="text-gray-500 mt-2">
          View and analyze data from your Raspberry Pi robot's sensors.
          {isDemoMode && <span className="ml-2 text-yellow-600 font-medium">(Demo Mode)</span>}
        </p>
      </div>
      
      {/* Demo Mode Notice */}
      {isDemoMode && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
          <div className="flex">
            <AlertTriangle className="h-6 w-6 text-yellow-500 mr-2" />
            <div>
              <p className="font-medium text-yellow-700">Demo Mode Active</p>
              <p className="text-sm text-yellow-600">
                You're viewing simulated sensor data. To connect to your actual Raspberry Pi,
                disable Demo Mode in Settings.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Dummy GPS Data Notice */}
      {useDummyGpsData && !isDemoMode && (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
          <div className="flex">
            <Database className="h-6 w-6 text-blue-500 mr-2" />
            <div>
              <p className="font-medium text-blue-700">Using Dummy GPS Data</p>
              <p className="text-sm text-blue-600">
                You're viewing pre-recorded GPS data for testing purposes due to poor indoor GPS reception.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Error Message */}
      {error && !isDemoMode && !useDummyGpsData && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
          <div className="flex">
            <AlertTriangle className="h-6 w-6 text-red-500 mr-2" />
            <div>
              <p className="font-medium text-red-700">Connection Error</p>
              <p className="text-sm text-red-600">{error}</p>
              {retryCount >= maxRetries && (
                <p className="text-sm text-red-600 mt-1">
                  Maximum retry attempts reached ({maxRetries}). Please refresh manually or enable Dummy GPS Data.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Time Range and Controls */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div className="flex space-x-2">
          <Button
            variant={selectedTimeRange === '15m' ? 'default' : 'outline'}
            onClick={() => handleTimeRangeChange('15m')}
            disabled={loading}
          >
            15 minutes
          </Button>
          <Button
            variant={selectedTimeRange === '1h' ? 'default' : 'outline'}
            onClick={() => handleTimeRangeChange('1h')}
            disabled={loading}
          >
            1 hour
          </Button>
          <Button
            variant={selectedTimeRange === '24h' ? 'default' : 'outline'}
            onClick={() => handleTimeRangeChange('24h')}
            disabled={loading}
          >
            24 hours
          </Button>
        </div>
        
        <div className="flex items-center gap-4">
          {!isDemoMode && (
            <div className="flex items-center space-x-2">
              <Switch
                checked={useDummyGpsData}
                onCheckedChange={toggleDummyGpsData}
                id="sensors-dummy-gps-mode"
              />
              <label 
                htmlFor="sensors-dummy-gps-mode" 
                className="text-sm text-gray-500 cursor-pointer select-none"
              >
                Use Dummy GPS Data
              </label>
            </div>
          )}
          
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            {loading ? "Loading..." : "Refresh Data"}
            {retryCount > 0 && retryCount < maxRetries && (
              <span className="ml-1 text-xs bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full">
                Retry: {retryCount}/{maxRetries}
              </span>
            )}
          </Button>
        </div>
      </div>
      
      {/* Sensor Cards */}
      <div className="grid grid-cols-1 gap-6">
        {/* GPS Module Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center">
              <MapPin className="h-5 w-5 mr-2" />
              NEO-6M-0-001 GPS Module
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="grid place-items-center h-80">
                <div className="flex flex-col items-center space-y-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
                  <p className="text-gray-500">Loading GPS data...</p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Current GPS Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500">Current Location</p>
                    <p className="text-lg font-medium">
                      {gpsData.length > 0 ? (
                        `${gpsData[gpsData.length - 1].latitude.toFixed(6)}, ${gpsData[gpsData.length - 1].longitude.toFixed(6)}`
                      ) : "N/A"}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500">Altitude</p>
                    <p className="text-lg font-medium">
                      {gpsData.length > 0 ? `${gpsData[gpsData.length - 1].altitude} m` : "N/A"}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500">Satellites / Signal</p>
                    <p className="text-lg font-medium">
                      {gpsData.length > 0 ? (
                        `${gpsData[gpsData.length - 1].satellites} / ${gpsData[gpsData.length - 1].signalStrength}%`
                      ) : "N/A"}
                    </p>
                  </div>
                </div>
                
                {/* Map Controls */}
                <div className="flex justify-between items-center">
                  <p className="text-sm font-medium">GPS Location Map</p>
                  <div className="flex space-x-2">
                    <Button 
                      size="sm" 
                      variant={showPath ? "default" : "outline"}
                      onClick={() => setShowPath(!showPath)}
                    >
                      <Navigation className="h-4 w-4 mr-2" />
                      {showPath ? "Hide Path" : "Show Path"}
                    </Button>
                    {/* Add more map controls as needed */}
                  </div>
                </div>
                
                {/* Map Display */}
                {renderMap()}
                
                {/* GPS Signal Strength Chart */}
                <div className="h-80">
                  <p className="text-sm font-medium mb-2">GPS Signal Strength (%)</p>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={gpsData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="signalStrength"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Camera Sensor Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center">
              <Camera className="h-5 w-5 mr-2" />
              IMX708 Raspberry Pi 5 Model 3 Camera
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="grid place-items-center h-80">
                <div className="flex flex-col items-center space-y-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
                  <p className="text-gray-500">Loading camera data...</p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Camera Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500">Frame Rate</p>
                    <p className="text-lg font-medium">
                      {cameraData.length > 0 ? `${cameraData[cameraData.length - 1].framerate.toFixed(1)} FPS` : "N/A"}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500">Brightness</p>
                    <p className="text-lg font-medium">
                      {cameraData.length > 0 ? `${cameraData[cameraData.length - 1].brightness.toFixed(1)}%` : "N/A"}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500">Contrast</p>
                    <p className="text-lg font-medium">
                      {cameraData.length > 0 ? `${cameraData[cameraData.length - 1].contrast.toFixed(1)}%` : "N/A"}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500">Motion Detected</p>
                    <p className="text-lg font-medium">
                      {cameraData.length > 0 ? 
                        (cameraData[cameraData.length - 1].motionDetected ? "Yes" : "No") : 
                        "N/A"}
                    </p>
                  </div>
                </div>
                
                {/* Camera Frame Rate Chart */}
                <div className="h-80">
                  <p className="text-sm font-medium mb-2">Camera Frame Rate (FPS)</p>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={cameraData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis domain={[0, 40]} />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="framerate"
                        stroke="#10b981"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 