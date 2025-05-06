"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Download, RefreshCw, AlertCircle } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Types for our logs
type LogLevel = "info" | "warning" | "error" | "debug";
type LogSource = "system" | "camera" | "motion" | "sensor" | "network";

interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  source: LogSource;
  message: string;
}

// Function to get the badge color based on log level
const getLogLevelBadge = (level: LogLevel) => {
  switch (level) {
    case "info":
      return "bg-blue-100 text-blue-800";
    case "warning":
      return "bg-yellow-100 text-yellow-800";
    case "error":
      return "bg-red-100 text-red-800";
    case "debug":
      return "bg-gray-100 text-gray-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

// Function to get the text color based on log level
const getLogTextColor = (level: LogLevel) => {
  switch (level) {
    case "info":
      return "text-blue-600";
    case "warning":
      return "text-yellow-600";
    case "error":
      return "text-red-600";
    case "debug":
      return "text-gray-600";
    default:
      return "";
  }
};

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUsingCache, setIsUsingCache] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  
  // Filters
  const [levelFilter, setLevelFilter] = useState<LogLevel | "all">("all");
  const [sourceFilter, setSourceFilter] = useState<LogSource | "all">("all");
  
  // Parse log file content and convert to LogEntry
  const parseLogFile = (fileContent: any, filename: string): LogEntry[] => {
    // Check if we have Arduino log file
    if (filename.includes("Arduino")) {
      // Create entries for Arduino log data
      const entries: LogEntry[] = [];
      
      // Add an entry for gyro data
      entries.push({
        id: `${filename}-gyro`,
        timestamp: fileContent.Timestamp || new Date().toISOString(),
        level: "info",
        source: "sensor",
        message: `Gyro - X: ${fileContent.Gyro?.X || 'N/A'}, Y: ${fileContent.Gyro?.Y || 'N/A'}, Z: ${fileContent.Gyro?.Z || 'N/A'}`
      });
      
      // Add an entry for servo angles
      entries.push({
        id: `${filename}-servo`,
        timestamp: fileContent.Timestamp || new Date().toISOString(),
        level: "info",
        source: "system",
        message: `Servo Angles - Neck: ${fileContent.ServoAngles?.Neck || 'N/A'}, Head: ${fileContent.ServoAngles?.Head || 'N/A'}`
      });
      
      // Add an entry for distances
      entries.push({
        id: `${filename}-distance`,
        timestamp: fileContent.Timestamp || new Date().toISOString(),
        level: "info",
        source: "sensor",
        message: `Distances - Front: ${fileContent.Distances?.Front || 'N/A'} cm, Left: ${fileContent.Distances?.Left || 'N/A'} cm, Right: ${fileContent.Distances?.Right || 'N/A'} cm`
      });
      
      // Add an entry for motor state
      const motorStateMessage = fileContent.MotorState || 'Unknown';
      const motorLevel: LogLevel = motorStateMessage === "STOP" ? "info" : "warning";
      
      entries.push({
        id: `${filename}-motor`,
        timestamp: fileContent.Timestamp || new Date().toISOString(),
        level: motorLevel,
        source: "motion",
        message: `Motor State: ${motorStateMessage}`
      });
      
      return entries;
    } 
    // Check if we have Pi system log file
    else if (filename.includes("Pi5")) {
      // Create entries for Pi system data
      const entries: LogEntry[] = [];
      
      // Add an entry for CPU and RAM
      entries.push({
        id: `${filename}-cpu-ram`,
        timestamp: fileContent.Timestamp || new Date().toISOString(),
        level: "info",
        source: "system",
        message: `System Status - CPU: ${fileContent.CPU || 'N/A'}, RAM: ${fileContent.RAM || 'N/A'}`
      });
      
      // Add an entry for temperatures
      const cpuTemp = parseFloat(fileContent["CPU Temp"] || "0");
      const tempLevel: LogLevel = 
        cpuTemp > 75 ? "error" : 
        cpuTemp > 65 ? "warning" : 
        "info";
      
      entries.push({
        id: `${filename}-temp`,
        timestamp: fileContent.Timestamp || new Date().toISOString(),
        level: tempLevel,
        source: "system",
        message: `Temperatures - CPU: ${fileContent["CPU Temp"] || 'N/A'}, GPU: ${fileContent["GPU Temp"] || 'N/A'}`
      });
      
      // Add an entry for network
      entries.push({
        id: `${filename}-network`,
        timestamp: fileContent.Timestamp || new Date().toISOString(),
        level: "info",
        source: "network",
        message: `Network Traffic - Upload: ${fileContent["Upload (KB/s)"] || '0'} KB/s, Download: ${fileContent["Download (KB/s)"] || '0'} KB/s`
      });
      
      return entries;
    }
    
    // For any other log type, return empty array
    return [];
  };
  
  // Fetch logs on component mount
  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch real logs from API
        try {
          // Get list of log files
          const logsResponse = await fetch('/api/robot-db/logs');
          
          if (!logsResponse.ok) {
            throw new Error(`Failed to fetch logs: ${logsResponse.status}`);
          }
          
          const logsData = await logsResponse.json();
          
          // Check if data is coming from cache
          if (logsData.isFromCache) {
            setIsUsingCache(true);
            setLastUpdated(logsData.lastUpdated);
          } else {
            setIsUsingCache(false);
            setLastUpdated(null);
          }
          
          // Check if we have log files
          if (!logsData.logs || logsData.logs.length === 0) {
            setError("No log files available");
            setLoading(false);
            return;
          }
          
          // Process each log file
          let allLogs: LogEntry[] = [];
          
          // Only process the latest Arduino and Pi5 logs
          const arduinoLog = logsData.logs.find((file: any) => file.filename.includes('Arduino'));
          const piLog = logsData.logs.find((file: any) => file.filename.includes('Pi5'));
          
          // Process logs with available content
          if (arduinoLog) {
            try {
              // Fetch log file content
              const response = await fetch('/api/robot-db/logs', {
                method: 'POST',
                headers: await (async () => {
                  return {
                    'Content-Type': 'application/json',
                  };
                })(),
                body: JSON.stringify({ logUrl: arduinoLog.url }),
              });
              
              if (response.ok) {
                const logContent = await response.json();
                if (logContent.log) {
                  const entries = parseLogFile(logContent.log, arduinoLog.filename);
                  allLogs = [...allLogs, ...entries];
                }
              }
            } catch (err) {
              console.error("Error fetching Arduino log content:", err);
            }
          }
          
          if (piLog) {
            try {
              // Fetch log file content
              const response = await fetch('/api/robot-db/logs', {
                method: 'POST',
                headers: await (async () => {
                  return {
                    'Content-Type': 'application/json',
                  };
                })(),
                body: JSON.stringify({ logUrl: piLog.url }),
              });
              
              if (response.ok) {
                const logContent = await response.json();
                if (logContent.log) {
                  const entries = parseLogFile(logContent.log, piLog.filename);
                  allLogs = [...allLogs, ...entries];
                }
              }
            } catch (err) {
              console.error("Error fetching Pi log content:", err);
            }
          }
          
          // If we have logs, set them
          if (allLogs.length > 0) {
            // Sort logs by timestamp (newest first)
            allLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            setLogs(allLogs);
          } else {
            // Empty logs array in case of error
            setLogs([]);
            setError("No log data found or could not be processed. Check your connection.");
          }
        } catch (err) {
          console.error("Error fetching logs:", err);
          setError("Failed to fetch logs. Check your connection.");
          setLogs([]);
        }
      } catch (err) {
        console.error("Error in logs component:", err);
        setError("An unexpected error occurred.");
        setLogs([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchLogs();
  }, []);
  
  // Apply filters whenever logs or filters change
  useEffect(() => {
    let filtered = [...logs];
    
    if (levelFilter !== "all") {
      filtered = filtered.filter((log) => log.level === levelFilter);
    }
    
    if (sourceFilter !== "all") {
      filtered = filtered.filter((log) => log.source === sourceFilter);
    }
    
    setFilteredLogs(filtered);
  }, [logs, levelFilter, sourceFilter]);
  
  const handleRefresh = async () => {
    setLogs([]);
    setLoading(true);
    setError(null);
    
    // Fetch real logs
    try {
      // Get list of log files
      const logsResponse = await fetch('/api/robot-db/logs');
      
      if (!logsResponse.ok) {
        throw new Error(`Failed to fetch logs: ${logsResponse.status}`);
      }
      
      const logsData = await logsResponse.json();
      
      // Check if data is coming from cache
      if (logsData.isFromCache) {
        setIsUsingCache(true);
        setLastUpdated(logsData.lastUpdated);
      } else {
        setIsUsingCache(false);
        setLastUpdated(null);
      }
      
      // Check if we have log files
      if (!logsData.logs || logsData.logs.length === 0) {
        setError("No log files available");
        setLoading(false);
        return;
      }
      
      // Process each log file
      let allLogs: LogEntry[] = [];
      
      // Only process the latest Arduino and Pi5 logs
      const arduinoLog = logsData.logs.find((file: any) => file.filename.includes('Arduino'));
      const piLog = logsData.logs.find((file: any) => file.filename.includes('Pi5'));
      
      // Process logs with available content
      if (arduinoLog) {
        try {
          // Fetch log file content
          const response = await fetch('/api/robot-db/logs', {
            method: 'POST',
            headers: await (async () => {
              return {
                'Content-Type': 'application/json',
              };
            })(),
            body: JSON.stringify({ logUrl: arduinoLog.url }),
          });
          
          if (response.ok) {
            const logContent = await response.json();
            if (logContent.log) {
              const entries = parseLogFile(logContent.log, arduinoLog.filename);
              allLogs = [...allLogs, ...entries];
            }
          }
        } catch (err) {
          console.error("Error fetching Arduino log content:", err);
        }
      }
      
      if (piLog) {
        try {
          // Fetch log file content
          const response = await fetch('/api/robot-db/logs', {
            method: 'POST',
            headers: await (async () => {
              return {
                'Content-Type': 'application/json',
              };
            })(),
            body: JSON.stringify({ logUrl: piLog.url }),
          });
          
          if (response.ok) {
            const logContent = await response.json();
            if (logContent.log) {
              const entries = parseLogFile(logContent.log, piLog.filename);
              allLogs = [...allLogs, ...entries];
            }
          }
        } catch (err) {
          console.error("Error fetching Pi log content:", err);
        }
      }
      
      // If we have logs, set them
      if (allLogs.length > 0) {
        // Sort logs by timestamp (newest first)
        allLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setLogs(allLogs);
      } else {
        // Empty logs array in case of error
        setLogs([]);
        setError("No log data found or could not be processed. Check your connection.");
      }
    } catch (err) {
      console.error("Error refreshing logs:", err);
      setError("Failed to refresh logs. Check your connection.");
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };
  
  const handleDownloadLogs = () => {
    // Create CSV content
    const headers = "timestamp,level,source,message\n";
    const csvContent = headers + logs.map(log => 
      `"${log.timestamp}","${log.level}","${log.source}","${log.message}"`
    ).join("\n");
    
    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `pi-guard-logs-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">System Logs</h1>
        <p className="text-gray-500 mt-2">
          View and analyze system logs from your Raspberry Pi robot.
        </p>
      </div>
      
      {/* Cache Notice */}
      {isUsingCache && lastUpdated && (
        <div className="bg-amber-50 border-l-4 border-amber-400 p-4">
          <div className="flex">
            <AlertCircle className="h-6 w-6 text-amber-500 mr-2 flex-shrink-0" />
            <div>
              <p className="font-medium text-amber-700">Using cached logs</p>
              <p className="text-sm text-amber-600">
                Unable to connect to the robot API. Showing previously cached logs from {new Date(lastUpdated).toLocaleString()}.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Error Notice */}
      {error && (
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
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>System Logs</CardTitle>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="animate-spin mr-2 h-4 w-4 border-2 border-gray-500 border-t-transparent rounded-full"></div>
                  Loading...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" /> Refresh
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadLogs}
              disabled={loading || logs.length === 0}
            >
              <Download className="mr-2 h-4 w-4" /> Download CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="space-y-1">
              <label className="text-sm font-medium">Filter by Level</label>
              <Select 
                value={levelFilter} 
                onValueChange={(value) => setLevelFilter(value as LogLevel | "all")}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Log Levels</SelectLabel>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                    <SelectItem value="debug">Debug</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-1">
              <label className="text-sm font-medium">Filter by Source</label>
              <Select 
                value={sourceFilter} 
                onValueChange={(value) => setSourceFilter(value as LogSource | "all")}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Log Sources</SelectLabel>
                    <SelectItem value="all">All Sources</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                    <SelectItem value="camera">Camera</SelectItem>
                    <SelectItem value="motion">Motion</SelectItem>
                    <SelectItem value="sensor">Sensor</SelectItem>
                    <SelectItem value="network">Network</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Log display */}
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-800"></div>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {logs.length === 0 ? "No logs available" : "No logs match the selected filters"}
            </div>
          ) : (
            <div className="border rounded-md divide-y overflow-hidden">
              {filteredLogs.map((log) => (
                <div key={log.id} className="p-4 hover:bg-gray-50">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <span className={`text-xs px-2 py-1 rounded ${getLogLevelBadge(log.level)}`}>
                        {log.level.toUpperCase()}
                      </span>
                      <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700">
                        {log.source}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {formatTimestamp(log.timestamp)}
                    </span>
                  </div>
                  <p className={`mt-2 ${getLogTextColor(log.level)}`}>{log.message}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 