"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertCircle, Compass, Ruler, Joystick } from "lucide-react";
import { useState, useEffect } from "react";
import { useDemo } from "@/app/lib/DemoContext";

export default function SensorsPage() {
  const { isDemoMode } = useDemo();
  const [sensorData, setSensorData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isUsingCache, setIsUsingCache] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const maxRetries = 3;

  const fetchSensorData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/robot-db/sensors');
      
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
        
        if (data) {
          setSensorData(data);
          setRetryCount(0);
        } else {
          setError("No sensor data found");
        }
      } else {
        setRetryCount(prev => {
          const newCount = prev + 1;
          if (newCount >= maxRetries) {
            setError("Failed to fetch sensor data. Please check your connection.");
          }
          return newCount;
        });
      }
    } catch (err) {
      console.error("Error fetching sensor data:", err);
      setRetryCount(prev => {
        const newCount = prev + 1;
        if (newCount >= maxRetries) {
          setError("Failed to fetch sensor data. Please check your connection.");
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
    await fetchSensorData();
  };

  useEffect(() => {
    fetchSensorData();
    
    const interval = setInterval(fetchSensorData, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Sensors</h1>
        <p className="text-gray-500 mt-2">
          Monitor sensor data from your Raspberry Pi robot.
        </p>
      </div>

      {/* Cache Notice */}
      {isUsingCache && lastUpdated && (
        <div className="bg-amber-50 border-l-4 border-amber-400 p-4">
          <div className="flex">
            <AlertCircle className="h-6 w-6 text-amber-500 mr-2 flex-shrink-0" />
            <div>
              <p className="font-medium text-amber-700">Using cached data</p>
              <p className="text-sm text-amber-600">
                Unable to connect to the robot API. Showing previously cached data from {new Date(lastUpdated).toLocaleString()}.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Gyroscope Data */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center">
            <Compass className="h-5 w-5 mr-2 text-blue-500" />
            Gyroscope
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
              <p className="font-medium">Error: {error}</p>
              {retryCount >= maxRetries && (
                <p>Maximum retry attempts reached. Please refresh manually.</p>
              )}
            </div>
          )}
          
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : sensorData?.gyro ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">
                      X-Axis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{sensorData.gyro.x}</div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                      <div
                        className="bg-blue-600 h-2.5 rounded-full"
                        style={{ width: `${Math.min(100, Math.max(0, (parseInt(sensorData.gyro.x) + 180) / 3.6))}%` }}
                      ></div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">
                      Y-Axis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{sensorData.gyro.y}</div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                      <div
                        className="bg-green-600 h-2.5 rounded-full"
                        style={{ width: `${Math.min(100, Math.max(0, (parseInt(sensorData.gyro.y) + 180) / 3.6))}%` }}
                      ></div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">
                      Z-Axis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{sensorData.gyro.z}</div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                      <div
                        className="bg-purple-600 h-2.5 rounded-full"
                        style={{ width: `${Math.min(100, Math.max(0, (parseInt(sensorData.gyro.z) + 180) / 3.6))}%` }}
                      ></div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* 3D Orientation Visualization (simplified) */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-500 mb-4">Orientation Visualization</h3>
                <div className="aspect-square max-w-sm mx-auto relative border border-gray-200 rounded-lg overflow-hidden bg-white">
                  <div 
                    className="absolute inset-0 flex items-center justify-center"
                    style={{
                      transform: `rotateX(${parseInt(sensorData.gyro.x) / 10}deg) rotateY(${parseInt(sensorData.gyro.y) / 10}deg) rotateZ(${parseInt(sensorData.gyro.z) / 10}deg)`
                    }}
                  >
                    <div className="w-24 h-16 bg-blue-500 rounded-md opacity-80 flex items-center justify-center text-white font-bold">
                      ROBOT
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 text-center mt-2">
                  Simplified representation, not to scale
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No gyroscope data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Distance Sensors */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Ruler className="h-5 w-5 mr-2 text-green-500" />
            Distance Sensors
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : sensorData?.distances ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">
                      Front
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{sensorData.distances.front} cm</div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                      <div
                        className="bg-red-600 h-2.5 rounded-full"
                        style={{ width: `${Math.min(100, Math.max(0, 100 - (parseFloat(sensorData.distances.front) / 2)))}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between mt-1 text-xs text-gray-500">
                      <span>Close</span>
                      <span>Far</span>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">
                      Left
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{sensorData.distances.left} cm</div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                      <div
                        className="bg-yellow-600 h-2.5 rounded-full"
                        style={{ width: `${Math.min(100, Math.max(0, 100 - (parseFloat(sensorData.distances.left) / 2)))}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between mt-1 text-xs text-gray-500">
                      <span>Close</span>
                      <span>Far</span>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">
                      Right
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{sensorData.distances.right} cm</div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                      <div
                        className="bg-blue-600 h-2.5 rounded-full"
                        style={{ width: `${Math.min(100, Math.max(0, 100 - (parseFloat(sensorData.distances.right) / 2)))}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between mt-1 text-xs text-gray-500">
                      <span>Close</span>
                      <span>Far</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Distance Visualization */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-500 mb-4">Distance Visualization</h3>
                <div className="aspect-square max-w-sm mx-auto relative border border-gray-200 rounded-lg overflow-hidden bg-white">
                  <div className="absolute inset-0">
                    {/* Robot in the center */}
                    <div className="absolute top-1/2 left-1/2 w-16 h-16 -ml-8 -mt-8 bg-gray-800 rounded-full flex items-center justify-center text-white">
                      <span className="text-xs">Robot</span>
                    </div>
                    
                    {/* Front distance */}
                    <div 
                      className="absolute top-0 left-1/2 w-16 -ml-8 bg-red-200 border-red-400 border rounded"
                      style={{ height: `${Math.min(48, Math.max(5, parseFloat(sensorData.distances.front) * 2))}%` }}
                    >
                      <div className="absolute bottom-0 left-0 right-0 h-2 bg-red-400"></div>
                      <div className="absolute bottom-3 left-0 right-0 text-center text-xs text-red-700">
                        {sensorData.distances.front} cm
                      </div>
                    </div>
                    
                    {/* Left distance */}
                    <div 
                      className="absolute top-1/2 left-0 h-16 -mt-8 bg-yellow-200 border-yellow-400 border rounded"
                      style={{ width: `${Math.min(48, Math.max(5, parseFloat(sensorData.distances.left) * 2))}%` }}
                    >
                      <div className="absolute right-0 top-0 bottom-0 w-2 bg-yellow-400"></div>
                      <div className="absolute right-3 top-0 bottom-0 flex items-center text-xs text-yellow-700">
                        {sensorData.distances.left} cm
                      </div>
                    </div>
                    
                    {/* Right distance */}
                    <div 
                      className="absolute top-1/2 right-0 h-16 -mt-8 bg-blue-200 border-blue-400 border rounded"
                      style={{ width: `${Math.min(48, Math.max(5, parseFloat(sensorData.distances.right) * 2))}%` }}
                    >
                      <div className="absolute left-0 top-0 bottom-0 w-2 bg-blue-400"></div>
                      <div className="absolute left-3 top-0 bottom-0 flex items-center text-xs text-blue-700">
                        {sensorData.distances.right} cm
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 text-center mt-2">
                  Distances represented as percentage of maximum range
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No distance sensor data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Servo Angles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Joystick className="h-5 w-5 mr-2 text-purple-500" />
            Servo Motors
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : sensorData?.servo ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">
                    Neck Servo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{sensorData.servo.neck}°</div>
                  <div className="mt-4 relative h-6 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="absolute top-0 bottom-0 bg-gradient-to-r from-blue-300 to-purple-600"
                      style={{ 
                        left: '0%', 
                        width: '100%',
                      }}
                    ></div>
                    <div 
                      className="absolute top-0 bottom-0 w-2 bg-white border-2 border-purple-700 rounded"
                      style={{ 
                        left: `${(parseInt(sensorData.servo.neck) / 180) * 100}%`,
                        transform: 'translateX(-50%)'
                      }}
                    ></div>
                  </div>
                  <div className="flex justify-between mt-1 text-xs text-gray-500">
                    <span>0°</span>
                    <span>90°</span>
                    <span>180°</span>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">
                    Head Servo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{sensorData.servo.head}°</div>
                  <div className="mt-4 relative h-6 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="absolute top-0 bottom-0 bg-gradient-to-r from-green-300 to-blue-600"
                      style={{ 
                        left: '0%', 
                        width: '100%',
                      }}
                    ></div>
                    <div 
                      className="absolute top-0 bottom-0 w-2 bg-white border-2 border-blue-700 rounded"
                      style={{ 
                        left: `${(parseInt(sensorData.servo.head) / 180) * 100}%`,
                        transform: 'translateX(-50%)'
                      }}
                    ></div>
                  </div>
                  <div className="flex justify-between mt-1 text-xs text-gray-500">
                    <span>0°</span>
                    <span>90°</span>
                    <span>180°</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No servo data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Motor State */}
      <Card>
        <CardHeader>
          <CardTitle>Motor State</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : sensorData?.motorState ? (
            <div className="bg-gray-50 p-6 rounded-lg text-center">
              <div className={`text-3xl font-bold ${
                sensorData.motorState === "STOP" ? "text-red-600" :
                sensorData.motorState === "FORWARD" ? "text-green-600" :
                sensorData.motorState === "BACKWARD" ? "text-yellow-600" :
                sensorData.motorState.includes("LEFT") ? "text-blue-600" :
                sensorData.motorState.includes("RIGHT") ? "text-purple-600" :
                "text-gray-600"
              }`}>
                {sensorData.motorState}
              </div>
              <div className="mt-4 text-sm text-gray-500">
                Current motor command
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No motor state data available
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 