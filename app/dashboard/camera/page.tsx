"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { RotateCw, ZoomIn, ZoomOut, Settings, AlertTriangle } from "lucide-react";
import { useDemo } from "@/app/lib/DemoContext";

export default function CameraPage() {
  const { isDemoMode } = useDemo();
  const [streaming, setStreaming] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Connect to camera stream
  useEffect(() => {
    const connectToCamera = async () => {
      setStreaming(false);
      setError(null);
      
      try {
        if (isDemoMode) {
          // In demo mode, just simulate a connection
          setTimeout(() => {
            setStreaming(true);
          }, 2000);
        } else {
          // In a real app, fetch Raspberry Pi info and connect to the camera
          const ipResponse = await fetch("/api/settings/raspberry-pi");
          const ipData = await ipResponse.json();
          
          if (!ipData.ip) {
            setError("Raspberry Pi IP not configured. Please set it in Settings.");
            return;
          }
          
          // Simulate connection attempt
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // 70% chance of success
          if (Math.random() > 0.3) {
            setStreaming(true);
          } else {
            throw new Error("Could not connect to camera");
          }
        }
      } catch (err) {
        console.error("Camera connection error:", err);
        setError("Failed to connect to camera. Check connection or enable Demo Mode.");
      }
    };

    connectToCamera();
  }, [isDemoMode]);

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleRefresh = () => {
    setStreaming(false);
    setError(null);
    
    setTimeout(() => {
      if (isDemoMode) {
        setStreaming(true);
      } else {
        // 70% chance of success when not in demo mode
        if (Math.random() > 0.3) {
          setStreaming(true);
        } else {
          setError("Failed to connect to camera. Check connection or enable Demo Mode.");
        }
      }
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Live Camera</h1>
        <p className="text-gray-500 mt-2">
          View and control the camera feed from your Raspberry Pi robot.
          {isDemoMode && <span className="ml-2 text-yellow-600 font-medium">(Demo Mode)</span>}
        </p>
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
              <CardTitle>Camera Feed</CardTitle>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefresh}
                disabled={!streaming && !error}
              >
                Refresh Feed
              </Button>
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
                    // For prototyping, we'll show a placeholder with proper containment
                    <div className="w-full h-full relative">
                      <div 
                        className="absolute inset-0 bg-gradient-to-r from-gray-800 to-gray-700 flex items-center justify-center origin-center"
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
                          <p className="text-white">Live camera feed</p>
                        )}
                      </div>
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

              {/* Additional Settings */}
              <Button 
                variant="outline" 
                className="w-full"
                disabled={!streaming && !error}
              >
                <Settings className="mr-2 h-4 w-4" /> Advanced Settings
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 