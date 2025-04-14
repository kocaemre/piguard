"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { RotateCw, ZoomIn, ZoomOut, AlertTriangle, RefreshCw, Pause, Play } from "lucide-react";
import { useDemo } from "@/app/lib/DemoContext";

export default function CameraPage() {
  const { isDemoMode, useDummyData } = useDemo();
  const [streaming, setStreaming] = useState(false);
  const [paused, setPaused] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [cameraImage, setCameraImage] = useState<string | null>(null);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 10;

  // Connect to camera stream
  useEffect(() => {
    const connectToCamera = async () => {
      setStreaming(false);
      setError(null);
      setRetryCount(0);
      
      try {
        if (isDemoMode) {
          // In demo mode, just simulate a connection
          setTimeout(() => {
            setStreaming(true);
          }, 2000);
        } else {
          // Try connecting to the camera API via our proxy
          try {
            // Use the dummy API endpoint if needed
            const response = await fetch(`/api/proxy?endpoint=camera${useDummyData ? '&dummy=true' : ''}`);
            
            if (!response.ok) {
              throw new Error(`Failed to connect to camera (Status: ${response.status})`);
            }
            
            const data = await response.json();
            
            if (data && data.image) {
              setCameraImage(`data:image/jpeg;base64,${data.image}`);
              setStreaming(true);
              
              // Set up interval to refresh the camera image
              if (refreshInterval) {
                clearInterval(refreshInterval);
              }
              
              const interval = setInterval(async () => {
                // Skip updating if paused
                if (paused) return;

                try {
                  const refreshResponse = await fetch(`/api/proxy?endpoint=camera${useDummyData ? '&dummy=true' : ''}`);
                  
                  if (refreshResponse.ok) {
                    const refreshData = await refreshResponse.json();
                    setCameraImage(`data:image/jpeg;base64,${refreshData.image}`);
                    // Reset retry count on success
                    setRetryCount(0);
                  } else {
                    // Increment retry count
                    setRetryCount(prev => {
                      const newCount = prev + 1;
                      if (newCount >= maxRetries) {
                        // Stop refreshing if max retries reached
                        if (refreshInterval) {
                          clearInterval(refreshInterval);
                          setRefreshInterval(null);
                        }
                        setError("Failed to refresh camera after multiple attempts.");
                        setStreaming(false);
                      }
                      return newCount;
                    });
                  }
                } catch (err) {
                  console.error("Error refreshing camera:", err);
                  // Increment retry count
                  setRetryCount(prev => {
                    const newCount = prev + 1;
                    if (newCount >= maxRetries) {
                      // Stop refreshing if max retries reached
                      if (refreshInterval) {
                        clearInterval(refreshInterval);
                        setRefreshInterval(null);
                      }
                      setError("Failed to refresh camera after multiple attempts.");
                      setStreaming(false);
                    }
                    return newCount;
                  });
                }
              }, 33); // Refresh approximately 30 times per second (33ms intervals)
              
              setRefreshInterval(interval);
            } else {
              throw new Error("Invalid camera data received");
            }
          } catch (err) {
            console.error("Camera connection error:", err);
            throw new Error("Could not connect to camera");
          }
        }
      } catch (err) {
        console.error("Camera connection error:", err);
        setError("Failed to connect to camera. Check connection or enable Demo Mode.");
      }
    };

    connectToCamera();
    
    // Cleanup interval on unmount
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [isDemoMode, useDummyData]);

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const togglePause = () => {
    setPaused(prev => !prev);
  };

  const handleRefresh = () => {
    setStreaming(false);
    setError(null);
    setRetryCount(0);
    setPaused(false);
    
    // Clear existing interval
    if (refreshInterval) {
      clearInterval(refreshInterval);
      setRefreshInterval(null);
    }
    
    setTimeout(async () => {
      if (isDemoMode) {
        setStreaming(true);
      } else {
        try {
          // Try connecting to the camera API via our proxy
          const response = await fetch(`/api/proxy?endpoint=camera${useDummyData ? '&dummy=true' : ''}`);
          
          if (!response.ok) {
            throw new Error(`Failed to connect to camera (Status: ${response.status})`);
          }
          
          const data = await response.json();
          
          if (data && data.image) {
            setCameraImage(`data:image/jpeg;base64,${data.image}`);
            setStreaming(true);
            
            // Set up interval to refresh the camera image
            const interval = setInterval(async () => {
              // Skip updating if paused
              if (paused) return;
              
              try {
                const refreshResponse = await fetch(`/api/proxy?endpoint=camera${useDummyData ? '&dummy=true' : ''}`);
                
                if (refreshResponse.ok) {
                  const refreshData = await refreshResponse.json();
                  setCameraImage(`data:image/jpeg;base64,${refreshData.image}`);
                  // Reset retry count on success
                  setRetryCount(0);
                } else {
                  // Increment retry count
                  setRetryCount(prev => {
                    const newCount = prev + 1;
                    if (newCount >= maxRetries) {
                      // Stop refreshing if max retries reached
                      if (refreshInterval) {
                        clearInterval(refreshInterval);
                        setRefreshInterval(null);
                      }
                      setError("Failed to refresh camera after multiple attempts.");
                      setStreaming(false);
                    }
                    return newCount;
                  });
                }
              } catch (err) {
                console.error("Error refreshing camera:", err);
                // Increment retry count
                setRetryCount(prev => {
                  const newCount = prev + 1;
                  if (newCount >= maxRetries) {
                    // Stop refreshing if max retries reached
                    clearInterval(interval);
                    setRefreshInterval(null);
                    setError("Failed to refresh camera after multiple attempts.");
                    setStreaming(false);
                  }
                  return newCount;
                });
              }
            }, 33); // Refresh approximately 30 times per second (33ms intervals)
            
            setRefreshInterval(interval);
          } else {
            throw new Error("Invalid camera data received");
          }
        } catch (err) {
          console.error("Camera refresh error:", err);
          setError("Failed to connect to camera. Check connection or enable Demo Mode.");
        }
      }
    }, 1000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Live Camera</h1>
          <p className="text-gray-500 mt-2">
            View and control the camera feed from your Raspberry Pi robot.
            {isDemoMode && <span className="ml-2 text-yellow-600 font-medium">(Demo Mode)</span>}
          </p>
        </div>
        <div className="flex space-x-2">
          <Button 
            onClick={togglePause}
            variant={paused ? "default" : "outline"}
            className="flex items-center gap-2"
            disabled={!streaming}
          >
            {paused ? (
              <>
                <Play className="h-4 w-4" />
                Resume Stream
              </>
            ) : (
              <>
                <Pause className="h-4 w-4" />
                Pause Stream
              </>
            )}
          </Button>
          <Button 
            onClick={handleRefresh}
            variant="default"
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh Camera
          </Button>
        </div>
      </div>

      {/* Demo Mode Notice */}
      {isDemoMode && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <AlertTriangle className="h-6 w-6 text-yellow-500 mr-2" />
            <div>
              <p className="font-medium text-yellow-700">Demo Mode Active</p>
              <p className="text-sm text-yellow-600">
                You're viewing a simulated camera feed. To connect to your actual Raspberry Pi camera,
                disable Demo Mode in Settings.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Paused Notice */}
      {paused && streaming && (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
          <div className="flex">
            <Pause className="h-6 w-6 text-blue-500 mr-2" />
            <div>
              <p className="font-medium text-blue-700">Camera Stream Paused</p>
              <p className="text-sm text-blue-600">
                The camera stream is currently paused. Click "Resume Stream" to continue receiving updates.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && !isDemoMode && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <AlertTriangle className="h-6 w-6 text-red-500 mr-2" />
            <div>
              <p className="font-medium text-red-700">Connection Error</p>
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Camera Feed */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Camera Feed {paused && <span className="text-sm font-normal ml-2 text-amber-600">(Paused)</span>}</CardTitle>
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={togglePause}
                  disabled={!streaming && !error}
                >
                  {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                  {paused ? "Resume" : "Pause"}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleRefresh}
                  disabled={!streaming && !error}
                >
                  <RefreshCw className="h-4 w-4 mr-1" /> Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="bg-black aspect-video rounded-md overflow-hidden relative">
                {/* Camera feed container */}
                <div className="absolute inset-0 flex items-center justify-center">
                  {!streaming && !error ? (
                    <div className="text-white">
                      <p>Connecting to camera stream...</p>
                      <div className="mt-4 flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                      </div>
                    </div>
                  ) : error ? (
                    <div className="text-white p-6 text-center">
                      <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-red-500" />
                      <p>Unable to connect to camera</p>
                      <p className="text-sm text-gray-400 mt-2">Check connections or enable Demo Mode</p>
                    </div>
                  ) : (
                    <div className="w-full h-full relative">
                      <div 
                        className="absolute inset-0 flex items-center justify-center origin-center"
                        style={{ 
                          transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                          maxWidth: "100%",
                          maxHeight: "100%",
                          transition: "transform 0.3s ease" 
                        }}
                      >
                        {isDemoMode ? (
                          <div className="relative w-full h-full">
                            <div className="absolute inset-0 flex items-center justify-center">
                              <p className="text-white">Demo Mode: Simulated camera feed</p>
                            </div>
                            {/* Randomly placed "objects" to simulate a camera feed */}
                            <div className="absolute w-6 h-6 bg-red-500 rounded-full opacity-60"
                                style={{ top: '30%', left: '20%' }}></div>
                            <div className="absolute w-10 h-10 bg-blue-500 rounded opacity-60"
                                style={{ top: '50%', left: '70%' }}></div>
                            <div className="absolute w-8 h-8 bg-green-500 rounded-lg opacity-60"
                                style={{ top: '70%', left: '40%' }}></div>
                          </div>
                        ) : (
                          cameraImage ? (
                            <img 
                              src={cameraImage} 
                              alt="Live camera feed" 
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <p className="text-white">Waiting for image...</p>
                          )
                        )}
                      </div>
                      {/* Paused overlay */}
                      {paused && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                          <div className="bg-white bg-opacity-10 backdrop-filter backdrop-blur-sm p-4 rounded-full">
                            <Pause className="h-12 w-12 text-white" />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Controls */}
        <div>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Camera Controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Stream Control */}
              <div>
                <h3 className="text-sm font-medium mb-2">Stream Control</h3>
                <Button 
                  onClick={togglePause} 
                  className="w-full flex items-center justify-center gap-2"
                  variant={paused ? "default" : "outline"}
                  disabled={!streaming && !error}
                >
                  {paused ? (
                    <>
                      <Play className="h-4 w-4" /> Resume Live Stream
                    </>
                  ) : (
                    <>
                      <Pause className="h-4 w-4" /> Pause Live Stream
                    </>
                  )}
                </Button>
              </div>

              {/* Rotation */}
              <div>
                <h3 className="text-sm font-medium mb-2">Rotation</h3>
                <Button 
                  onClick={handleRotate} 
                  className="w-full"
                  disabled={!streaming && !error}
                >
                  <RotateCw className="mr-2 h-4 w-4" /> Rotate View
                </Button>
              </div>

              {/* Zoom */}
              <div>
                <h3 className="text-sm font-medium mb-2">Zoom: {Math.round(zoomLevel * 100)}%</h3>
                <div className="flex items-center gap-2">
                  <ZoomOut className="h-4 w-4" />
                  <Slider
                    value={[zoomLevel * 100]}
                    onValueChange={(value) => setZoomLevel(value[0] / 100)}
                    min={50}
                    max={200}
                    step={10}
                    className="flex-1"
                    disabled={!streaming && !error}
                  />
                  <ZoomIn className="h-4 w-4" />
                </div>
              </div>

              {/* Quality Settings */}
              <div>
                <h3 className="text-sm font-medium mb-2">Quality</h3>
                <div className="grid grid-cols-3 gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    disabled={!streaming && !error}
                  >
                    Low
                  </Button>
                  <Button 
                    variant="secondary" 
                    size="sm"
                    disabled={!streaming && !error}
                  >
                    Medium
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    disabled={!streaming && !error}
                  >
                    High
                  </Button>
                </div>
              </div>

              {/* Connection Status */}
              <div className="mt-6 pt-6 border-t">
                <h3 className="text-sm font-medium mb-2">Connection Status</h3>
                <div className="flex items-center space-x-2">
                  <div 
                    className={`h-3 w-3 rounded-full ${
                      streaming 
                        ? paused
                          ? "bg-yellow-500"
                          : "bg-green-500" 
                        : error 
                        ? "bg-red-500" 
                        : "bg-yellow-500"
                    }`}
                  ></div>
                  <span className="text-sm">
                    {streaming 
                      ? paused
                        ? "Paused"
                        : "Connected" 
                      : error 
                      ? "Error" 
                      : "Connecting..."
                    }
                  </span>
                </div>
                {retryCount > 0 && retryCount < maxRetries && (
                  <p className="text-xs text-amber-600 mt-1">
                    Retry attempts: {retryCount}/{maxRetries}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 