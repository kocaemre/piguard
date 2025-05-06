"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertCircle, Film, Camera, ZoomIn, ZoomOut, Maximize, Download } from "lucide-react";
import { useState, useEffect } from "react";
import { useDemo } from "@/app/lib/DemoContext";

export default function CameraPage() {
  const { isDemoMode } = useDemo();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isUsingCache, setIsUsingCache] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [fullscreen, setFullscreen] = useState(false);
  const maxRetries = 3;

  const fetchImage = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/robot-db/camera');
      
      if (response.ok) {
        const data = await response.json();
        
        // Check if data is coming from cache
        if (data.isFromCache) {
          setIsUsingCache(true);
          setLastUpdated(data.lastUpdated);
        } else {
          setIsUsingCache(false);
          setLastUpdated(null);
        }
        
        if (data && data.image_url) {
          setImageUrl(data.image_url);
          setFileName(data.filename);
          setRetryCount(0);
        } else {
          setError("No camera feed available");
        }
      } else {
        setRetryCount(prev => {
          const newCount = prev + 1;
          if (newCount >= maxRetries) {
            setError("Failed to fetch camera feed. Please check your connection.");
          }
          return newCount;
        });
      }
    } catch (err) {
      console.error("Error fetching camera feed:", err);
      setRetryCount(prev => {
        const newCount = prev + 1;
        if (newCount >= maxRetries) {
          setError("Failed to fetch camera feed. Please check your connection.");
        }
        return newCount;
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRetryCount(0);
    setError(null);
    await fetchImage();
  };

  const handleZoomIn = () => {
    if (zoomLevel < 2) {
      setZoomLevel(prev => prev + 0.1);
    }
  };

  const handleZoomOut = () => {
    if (zoomLevel > 0.5) {
      setZoomLevel(prev => prev - 0.1);
    }
  };

  const toggleFullscreen = () => {
    setFullscreen(!fullscreen);
  };

  const downloadImage = () => {
    if (!imageUrl) return;
    
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = fileName || 'robot-camera.jpg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    fetchImage();
    
    const interval = setInterval(fetchImage, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Camera</h1>
        <p className="text-gray-500 mt-2">
          View live camera feed from your Raspberry Pi robot.
        </p>
      </div>

      {/* Cache Notice */}
      {isUsingCache && lastUpdated && (
        <div className="bg-amber-50 border-l-4 border-amber-400 p-4">
          <div className="flex">
            <AlertCircle className="h-6 w-6 text-amber-500 mr-2 flex-shrink-0" />
            <div>
              <p className="font-medium text-amber-700">Using cached image</p>
              <p className="text-sm text-amber-600">
                Unable to connect to the robot API. Showing previously cached image from {new Date(lastUpdated).toLocaleString()}.
              </p>
            </div>
          </div>
        </div>
      )}

      <Card className={fullscreen ? "fixed inset-0 z-50 rounded-none" : ""}>
        <CardHeader className="flex flex-row items-center justify-between bg-gray-50 dark:bg-gray-800">
          <CardTitle className="flex items-center">
            <Camera className="h-5 w-5 mr-2 text-blue-500" />
            Live Camera Feed
          </CardTitle>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomOut}
              disabled={zoomLevel <= 0.5 || !imageUrl}
              className="hidden sm:flex items-center"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomIn}
              disabled={zoomLevel >= 2 || !imageUrl}
              className="hidden sm:flex items-center"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleFullscreen}
              disabled={!imageUrl}
              className="hidden sm:flex items-center"
            >
              <Maximize className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={downloadImage}
              disabled={!imageUrl}
              className="hidden sm:flex items-center"
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className={`p-0 ${fullscreen ? 'flex-1 flex items-center justify-center bg-black' : ''}`}>
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
              <p className="font-medium">Error: {error}</p>
              {retryCount >= maxRetries && (
                <p>Maximum retry attempts reached. Please refresh manually.</p>
              )}
            </div>
          )}
          
          <div className="relative bg-black rounded-b-lg overflow-hidden h-[calc(100vh-300px)]">
            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
              </div>
            ) : imageUrl ? (
              <div className="relative h-full flex items-center justify-center">
                <img
                  src={imageUrl}
                  alt="Camera feed"
                  className="max-h-full max-w-full object-contain transition-transform duration-300"
                  style={{ 
                    transform: `scale(${zoomLevel})`,
                  }}
                />
                {fileName && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white p-3 flex justify-between items-center">
                    <div>
                      <div className="text-sm font-medium">{fileName}</div>
                      <div className="text-xs text-gray-300">
                        {isUsingCache ? `Cached: ${lastUpdated ? new Date(lastUpdated).toLocaleString() : 'Unknown'}` : 'Live feed'}
                      </div>
                    </div>
                    <div className="flex space-x-2 sm:hidden">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleZoomOut}
                        disabled={zoomLevel <= 0.5}
                        className="text-white hover:text-white hover:bg-white/20"
                      >
                        <ZoomOut className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleZoomIn}
                        disabled={zoomLevel >= 2}
                        className="text-white hover:text-white hover:bg-white/20"
                      >
                        <ZoomIn className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={toggleFullscreen}
                        className="text-white hover:text-white hover:bg-white/20"
                      >
                        <Maximize className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={downloadImage}
                        className="text-white hover:text-white hover:bg-white/20"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                <Camera className="h-16 w-16 mb-4 opacity-30" />
                <p className="text-xl">No camera feed available</p>
                <p className="text-sm text-gray-400 mt-2">
                  Check your robot's camera connection or try refreshing
                </p>
              </div>
            )}
          </div>
          
          {imageUrl && !fullscreen && (
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-b-lg border-t dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Film className="h-4 w-4 mr-2 text-blue-500" />
                  <span className="text-sm">
                    Image updates automatically every 5 seconds
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  Zoom: {(zoomLevel * 100).toFixed(0)}%
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 