"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useDemo } from "@/app/lib/DemoContext";
import { AlertTriangle, Download, RefreshCw } from "lucide-react";
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

// Generate demo log entries
const generateMockLogs = (count: number): LogEntry[] => {
  const logLevels: LogLevel[] = ["info", "warning", "error", "debug"];
  const logSources: LogSource[] = ["system", "camera", "motion", "sensor", "network"];
  
  const logMessages = {
    system: [
      "System started",
      "System shut down",
      "Raspberry Pi temperature high",
      "System update available",
      "Low memory warning",
      "Battery low",
      "Configuration updated",
    ],
    camera: [
      "Camera connected",
      "Camera disconnected",
      "Camera feed interrupted",
      "Motion detected in camera feed",
      "Camera resolution changed",
      "Camera failed to initialize",
    ],
    motion: [
      "Motion detected",
      "Motion sensor calibrated",
      "No motion detected for 1 hour",
      "Motion sensor offline",
      "Multiple motion events detected",
    ],
    sensor: [
      "Temperature sensor reading: 24.5°C",
      "Humidity sensor reading: 65%",
      "Distance sensor reading: 42cm",
      "Sensor initialization failed",
      "Sensor readings outside normal range",
    ],
    network: [
      "Network connection established",
      "Network connection lost",
      "Weak WiFi signal",
      "IP conflict detected",
      "Failed to connect to remote server",
      "API rate limit exceeded",
    ],
  };
  
  const logs: LogEntry[] = [];
  const now = new Date();
  
  for (let i = 0; i < count; i++) {
    const source = logSources[Math.floor(Math.random() * logSources.length)];
    const level = i % 10 === 0 ? "error" : i % 5 === 0 ? "warning" : i % 8 === 0 ? "debug" : "info";
    const messages = logMessages[source];
    const message = messages[Math.floor(Math.random() * messages.length)];
    
    // Generate random time in the past (up to 24 hours ago)
    const timestamp = new Date(now.getTime() - Math.random() * 24 * 60 * 60 * 1000);
    
    logs.push({
      id: `log-${i}`,
      timestamp: timestamp.toISOString(),
      level,
      source,
      message,
    });
  }
  
  // Sort logs by timestamp (newest first)
  return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

export default function LogsPage() {
  const { isDemoMode } = useDemo();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [levelFilter, setLevelFilter] = useState<LogLevel | "all">("all");
  const [sourceFilter, setSourceFilter] = useState<LogSource | "all">("all");
  
  // Fetch logs on component mount
  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      setError(null);
      
      try {
        if (isDemoMode) {
          // Generate mock logs for demo mode
          const mockLogs = generateMockLogs(50);
          setLogs(mockLogs);
        } else {
          // In a real app, fetch from Raspberry Pi
          const ipResponse = await fetch("/api/settings/raspberry-pi");
          const ipData = await ipResponse.json();
          
          if (!ipData.ip) {
            setError("Raspberry Pi IP not configured. Please set it in Settings.");
            setLoading(false);
            return;
          }
          
          // Simulate API call delay
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          // Randomly fail 30% of the time to simulate connection issues
          if (Math.random() > 0.7) {
            throw new Error("Failed to connect to Raspberry Pi");
          }
          
          // For demo purposes, use mock data in both cases
          const mockLogs = generateMockLogs(50);
          setLogs(mockLogs);
        }
      } catch (err) {
        console.error("Error fetching logs:", err);
        setError("Failed to fetch logs. Check connection or enable Demo Mode.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchLogs();
  }, [isDemoMode]);
  
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
  
  const handleRefresh = () => {
    setLogs([]);
    setLoading(true);
    setError(null);
    
    setTimeout(() => {
      if (isDemoMode) {
        const mockLogs = generateMockLogs(50);
        setLogs(mockLogs);
        setLoading(false);
      } else {
        // In a real app, fetch from Raspberry Pi
        if (Math.random() > 0.7) {
          setError("Failed to fetch logs. Check connection or enable Demo Mode.");
        } else {
          const mockLogs = generateMockLogs(50);
          setLogs(mockLogs);
        }
        setLoading(false);
      }
    }, 1500);
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
                You're viewing simulated system logs. To connect to your actual Raspberry Pi logs,
                disable Demo Mode in Settings.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Error Notice */}
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