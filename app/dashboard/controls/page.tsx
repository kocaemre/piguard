"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Power, Pause, AlertTriangle } from "lucide-react";
import { toast } from "react-hot-toast";
import { useDemo } from "@/app/lib/DemoContext";

export default function ControlsPage() {
  const { isDemoMode } = useDemo();
  const [motorPower, setMotorPower] = useState(75);
  const [cameraAngle, setCameraAngle] = useState(45);
  const [isMoving, setIsMoving] = useState(false);
  const [currentDirection, setCurrentDirection] = useState("");
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "disconnected" | "connecting">("connecting");
  const [error, setError] = useState<string | null>(null);

  // Check connection to Raspberry Pi
  useEffect(() => {
    const checkConnection = async () => {
      setConnectionStatus("connecting");
      setError(null);
      
      try {
        if (isDemoMode) {
          // In demo mode, simulate connection
          setTimeout(() => {
            setConnectionStatus("connected");
          }, 1500);
        } else {
          // In a real app, fetch Raspberry Pi settings
          const response = await fetch("/api/settings/raspberry-pi");
          const data = await response.json();
          
          if (!data.ip) {
            setError("Raspberry Pi IP not configured. Please set it in Settings.");
            setConnectionStatus("disconnected");
            return;
          }
          
          // Simulate connection attempt
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          // 70% chance of success in real mode
          if (Math.random() > 0.3) {
            setConnectionStatus("connected");
          } else {
            throw new Error("Could not connect to robot");
          }
        }
      } catch (err) {
        console.error("Robot connection error:", err);
        setError("Failed to connect to robot. Check connection or enable Demo Mode.");
        setConnectionStatus("disconnected");
      }
    };

    checkConnection();
  }, [isDemoMode]);

  // In a real app, these would send commands to the Raspberry Pi
  const handleMove = (direction: string) => {
    if (connectionStatus !== "connected" && !isDemoMode) {
      toast.error("Cannot control robot: disconnected");
      return;
    }
    
    setIsMoving(true);
    setCurrentDirection(direction);
    
    // Simulate sending command to Raspberry Pi
    toast.success(`Moving ${direction}`);
    
    // In a real app, you would send a request to your API
    // fetch("/api/robot/move", { 
    //   method: "POST", 
    //   body: JSON.stringify({ direction, power: motorPower }) 
    // });
  };

  const handleStop = () => {
    if (connectionStatus !== "connected" && !isDemoMode) {
      return;
    }
    
    setIsMoving(false);
    setCurrentDirection("");
    toast.success("Stopped");
    
    // In a real app, you would send a request to your API
    // fetch("/api/robot/stop", { method: "POST" });
  };

  const handlePowerChange = (value: number[]) => {
    setMotorPower(value[0]);
    
    if (connectionStatus !== "connected" && !isDemoMode) {
      return;
    }
    
    // In a real app, you would send a request to your API
    // fetch("/api/robot/power", { 
    //   method: "POST", 
    //   body: JSON.stringify({ power: value[0] }) 
    // });
  };

  const handleCameraAngleChange = (value: number[]) => {
    setCameraAngle(value[0]);
    
    if (connectionStatus !== "connected" && !isDemoMode) {
      return;
    }
    
    // In a real app, you would send a request to your API
    // fetch("/api/robot/camera-angle", { 
    //   method: "POST", 
    //   body: JSON.stringify({ angle: value[0] }) 
    // });
  };

  const handleReconnect = () => {
    setConnectionStatus("connecting");
    setError(null);
    
    setTimeout(() => {
      if (isDemoMode) {
        setConnectionStatus("connected");
      } else {
        // 70% chance of success when not in demo mode
        if (Math.random() > 0.3) {
          setConnectionStatus("connected");
        } else {
          setError("Failed to connect to robot. Check connection or enable Demo Mode.");
          setConnectionStatus("disconnected");
        }
      }
    }, 1500);
  };

  const isControlEnabled = isDemoMode || connectionStatus === "connected";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Robot Controls</h1>
        <p className="text-gray-500 mt-2">
          Control your Raspberry Pi robot's movements and settings.
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
                You're using simulated robot controls. Robot movement commands won't affect a real robot.
                To connect to your actual Raspberry Pi robot, disable Demo Mode in Settings.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Connection Error */}
      {error && !isDemoMode && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <AlertTriangle className="h-6 w-6 text-red-500 mr-2" />
            <div>
              <p className="font-medium text-red-700">Connection Error</p>
              <p className="text-sm text-red-600">{error}</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2" 
                onClick={handleReconnect}
              >
                Try reconnecting
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Movement Controls */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Movement</CardTitle>
            {connectionStatus === "connecting" && !isDemoMode && (
              <div className="flex items-center text-sm text-gray-500">
                <div className="animate-spin mr-2 h-4 w-4 border-2 border-gray-500 border-t-transparent rounded-full"></div>
                Connecting...
              </div>
            )}
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-8 max-w-xs mx-auto">
              {/* Top row - Forward */}
              <div className="col-start-2">
                <Button
                  className="w-full h-16"
                  variant={currentDirection === "forward" ? "default" : "outline"}
                  onMouseDown={() => handleMove("forward")}
                  onMouseUp={handleStop}
                  onTouchStart={() => handleMove("forward")}
                  onTouchEnd={handleStop}
                  disabled={!isControlEnabled}
                >
                  <ArrowUp className="h-8 w-8" />
                </Button>
              </div>

              {/* Middle row - Left, Stop, Right */}
              <Button
                className="w-full h-16"
                variant={currentDirection === "left" ? "default" : "outline"}
                onMouseDown={() => handleMove("left")}
                onMouseUp={handleStop}
                onTouchStart={() => handleMove("left")}
                onTouchEnd={handleStop}
                disabled={!isControlEnabled}
              >
                <ArrowLeft className="h-8 w-8" />
              </Button>

              <Button
                className="w-full h-16"
                variant="destructive"
                onClick={handleStop}
                disabled={!isControlEnabled}
              >
                <Pause className="h-8 w-8" />
              </Button>

              <Button
                className="w-full h-16"
                variant={currentDirection === "right" ? "default" : "outline"}
                onMouseDown={() => handleMove("right")}
                onMouseUp={handleStop}
                onTouchStart={() => handleMove("right")}
                onTouchEnd={handleStop}
                disabled={!isControlEnabled}
              >
                <ArrowRight className="h-8 w-8" />
              </Button>

              {/* Bottom row - Backward */}
              <div className="col-start-2">
                <Button
                  className="w-full h-16"
                  variant={currentDirection === "backward" ? "default" : "outline"}
                  onMouseDown={() => handleMove("backward")}
                  onMouseUp={handleStop}
                  onTouchStart={() => handleMove("backward")}
                  onTouchEnd={handleStop}
                  disabled={!isControlEnabled}
                >
                  <ArrowDown className="h-8 w-8" />
                </Button>
              </div>
            </div>

            <div className="mt-8 space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Motor Power</span>
                  <span className="text-sm text-gray-500">{motorPower}%</span>
                </div>
                <Slider
                  value={[motorPower]}
                  onValueChange={handlePowerChange}
                  min={0}
                  max={100}
                  step={5}
                  disabled={!isControlEnabled}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Camera & Other Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Camera Angle */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Camera Angle</span>
                <span className="text-sm text-gray-500">{cameraAngle}°</span>
              </div>
              <Slider
                value={[cameraAngle]}
                onValueChange={handleCameraAngleChange}
                min={0}
                max={90}
                step={5}
                disabled={!isControlEnabled}
              />
            </div>

            {/* Power Controls */}
            <div className="pt-4 border-t">
              <h3 className="text-sm font-medium mb-4">Power Controls</h3>
              <div className="grid grid-cols-2 gap-4">
                <Button 
                  variant="outline"
                  disabled={!isControlEnabled}
                >
                  <Power className="mr-2 h-4 w-4" /> Restart
                </Button>
                <Button 
                  variant="destructive"
                  disabled={!isControlEnabled}
                >
                  <Power className="mr-2 h-4 w-4" /> Shutdown
                </Button>
              </div>
            </div>

            {/* Action Status */}
            <div className="mt-6 p-3 rounded-md bg-gray-100">
              <h3 className="text-sm font-medium">Status</h3>
              <p className="text-sm text-gray-500 mt-1">
                {connectionStatus === "disconnected" && !isDemoMode
                  ? "Robot disconnected"
                  : connectionStatus === "connecting" && !isDemoMode
                  ? "Connecting to robot..."
                  : isMoving
                  ? `Moving ${currentDirection}`
                  : "Robot is idle"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 