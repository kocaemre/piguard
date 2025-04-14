import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

// Demo data generators
const generateDummyGpsData = () => {
  // Istanbul coordinates with slight randomization
  const latitude = 41.015137 + (Math.random() - 0.5) * 0.01;
  const longitude = 28.979530 + (Math.random() - 0.5) * 0.01;
  
  return {
    id: `gps_${Date.now()}`,
    latitude,
    longitude,
    altitude: 100 + Math.random() * 10,
    speed: 5 + Math.random() * 20,
    satellites: Math.floor(Math.random() * 3) + 6,
    signalStrength: 75 + Math.random() * 15,
    timestamp: new Date().toISOString(),
  };
};

const generateDummyCameraData = () => {
  // Base64 encoded small colored rectangle (placeholder for real camera data)
  // This is a tiny 1x1 pixel PNG in base64
  const imageData = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAFhQJ/zODHJgAAAABJRU5ErkJggg==";
  
  return {
    id: `cam_${Date.now()}`,
    image: imageData,
    timestamp: new Date().toISOString(),
  };
};

const generateDummyStatusData = () => {
  // Generate random time intervals for metrics updates
  const timeIntervals = [
    '2 minutes ago',
    '3 minutes ago',
    '5 minutes ago',
    '7 minutes ago',
    '10 minutes ago',
    'just now',
    '1 minute ago'
  ];
  
  // Random CPU usage between 20-60%
  const cpuUsage = Math.floor(20 + Math.random() * 40);
  const cpuChange = (Math.random() > 0.5 ? "+" : "-") + Math.floor(Math.random() * 10);
  const cpuUpdateTime = timeIntervals[Math.floor(Math.random() * timeIntervals.length)];
  
  // Random RAM usage
  const ramTotal = 2048; // 2GB in MB
  const ramUsed = Math.floor(200 + Math.random() * 800);
  const ramChange = (Math.random() > 0.5 ? "+" : "-") + Math.floor(Math.random() * 50);
  const ramUpdateTime = timeIntervals[Math.floor(Math.random() * timeIntervals.length)];
  
  // Random temperature between 35-50°C
  const temperature = Math.floor(35 + Math.random() * 15);
  const tempChange = (Math.random() > 0.5 ? "+" : "-") + (Math.random() * 3).toFixed(1);
  const tempUpdateTime = timeIntervals[Math.floor(Math.random() * timeIntervals.length)];
  
  // Random battery level between 60-100%
  const batteryLevel = Math.floor(60 + Math.random() * 40);
  const batteryChange = (Math.random() > 0.3 ? "-" : "+") + Math.floor(Math.random() * 5);
  const batteryUpdateTime = timeIntervals[Math.floor(Math.random() * timeIntervals.length)];
  
  // Random uptime between 1-24 hours
  const uptimeHours = Math.floor(1 + Math.random() * 24);
  const uptimeMinutes = Math.floor(Math.random() * 60);
  
  // Return formatted data
  return {
    // Basic metrics
    cpu: `${cpuUsage}%`,
    cpu_change: cpuChange + "%",
    cpu_details: {
      usage: cpuUsage,
      cores: 4,
      processes: Math.floor(10 + Math.random() * 20),
      updated: cpuUpdateTime
    },
    
    ram: `${ramUsed}MB / ${ramTotal}MB`,
    ram_change: ramChange + "MB",
    ram_details: {
      total: ramTotal,
      used: ramUsed,
      free: ramTotal - ramUsed,
      updated: ramUpdateTime
    },
    
    temperature: `${temperature}°C`,
    temp_change: tempChange + "°C",
    temp_details: {
      current: temperature,
      max: temperature + Math.floor(Math.random() * 5),
      min: temperature - Math.floor(Math.random() * 5),
      updated: tempUpdateTime
    },
    
    battery: `${batteryLevel}%`,
    battery_change: batteryChange + "%",
    battery_details: {
      level: batteryLevel,
      charging: Math.random() > 0.7,
      estimated_remaining: Math.floor(batteryLevel / 10 * 60),
      updated: batteryUpdateTime
    },
    
    // System status
    timestamp: new Date().toISOString(),
    camera: Math.random() > 0.1 ? "connected" : "disconnected",
    warnings: `${Math.floor(Math.random() * 3)}`,
    uptime: `${uptimeHours}h ${uptimeMinutes}m`,
    
    // Additional system info
    disk_usage: {
      total: "16GB",
      used: Math.floor(3 + Math.random() * 8) + "GB",
      free: Math.floor(4 + Math.random() * 4) + "GB"
    },
    network: {
      status: "connected",
      ip: "192.168.1." + Math.floor(Math.random() * 254),
      signal_strength: Math.floor(60 + Math.random() * 40) + "%",
      updated: timeIntervals[Math.floor(Math.random() * timeIntervals.length)]
    }
  };
};

const generateDummySensorData = (type: string) => {
  let value, unit;
  
  switch (type) {
    case "temperature":
      value = 20 + Math.random() * 15;
      unit = "°C";
      break;
    case "humidity":
      value = 40 + Math.random() * 40;
      unit = "%";
      break;
    case "distance":
      value = Math.random() * 100;
      unit = "cm";
      break;
    case "voltage":
      value = 3.3 + Math.random() * 1.7;
      unit = "V";
      break;
    default:
      value = Math.random() * 100;
      unit = "units";
  }
  
  return {
    id: `sensor_${Date.now()}`,
    sensor_type: type,
    value: parseFloat(value.toFixed(2)),
    unit,
    timestamp: new Date().toISOString(),
  };
};

// Proxy API for Raspberry Pi or Dummy Data (when Raspberry Pi is not available)
export async function GET(req: NextRequest) {
  try {
    // Get endpoint from query parameters
    const endpoint = req.nextUrl.searchParams.get("endpoint");
    
    if (!endpoint) {
      return NextResponse.json(
        { error: "Endpoint parameter required" },
        { status: 400 }
      );
    }
    
    // Check if we should use dummy data (for development without Raspberry Pi)
    const useDummyData = req.nextUrl.searchParams.get("dummy") === "true";
    
    if (useDummyData) {
      // Return dummy data based on the requested endpoint
      switch (endpoint) {
        case "gps":
          return NextResponse.json(generateDummyGpsData());
        case "camera":
          return NextResponse.json(generateDummyCameraData());
        case "status":
          return NextResponse.json(generateDummyStatusData());
        case "sensors":
          const sensorType = req.nextUrl.searchParams.get("type") || "temperature";
          return NextResponse.json(generateDummySensorData(sensorType));
        default:
          return NextResponse.json(
            { error: `Unknown endpoint: ${endpoint}` },
            { status: 400 }
          );
      }
    }
    
    // If not using dummy data, try to connect to Raspberry Pi
    // Get Raspberry Pi settings from cookies
    const cookieStore = await cookies();
    const ipValue = cookieStore.get("raspberry_pi_ip")?.value || "";
    const portValue = cookieStore.get("raspberry_pi_port")?.value || "5000";
    
    if (!ipValue) {
      // Fallback to dummy data if no IP is configured
      console.log("No Raspberry Pi IP configured, falling back to dummy data");
      
      switch (endpoint) {
        case "gps":
          return NextResponse.json(generateDummyGpsData());
        case "camera":
          return NextResponse.json(generateDummyCameraData());
        case "status":
          return NextResponse.json(generateDummyStatusData());
        case "sensors":
          const sensorType = req.nextUrl.searchParams.get("type") || "temperature";
          return NextResponse.json(generateDummySensorData(sensorType));
        default:
          return NextResponse.json(
            { error: `Unknown endpoint: ${endpoint}` },
            { status: 400 }
          );
      }
    }
    
    // Build the Raspberry Pi API URL
    const apiUrl = `http://${ipValue}:${portValue}/${endpoint}`;
    
    // Forward the request to the Raspberry Pi
    try {
      console.log(`Proxying request to ${apiUrl}`);
      const response = await fetch(apiUrl, {
        method: "GET",
        // Add timeout to prevent long-hanging requests
        signal: AbortSignal.timeout(10000), // 10 seconds timeout
      });
      
      if (!response.ok) {
        throw new Error(`Raspberry Pi returned status: ${response.status}`);
      }
      
      // Get the response data
      const data = await response.json();
      
      // Return the data to the client
      return NextResponse.json(data);
    } catch (error) {
      console.error(`Error proxying request to ${apiUrl}:`, error);
      console.log("Falling back to dummy data after connection error");
      
      // Fallback to dummy data if connection fails
      switch (endpoint) {
        case "gps":
          return NextResponse.json(generateDummyGpsData());
        case "camera":
          return NextResponse.json(generateDummyCameraData());
        case "status":
          return NextResponse.json(generateDummyStatusData());
        case "sensors":
          const sensorType = req.nextUrl.searchParams.get("type") || "temperature";
          return NextResponse.json(generateDummySensorData(sensorType));
        default:
          return NextResponse.json(
            { error: `Unknown endpoint: ${endpoint}` },
            { status: 400 }
          );
      }
    }
  } catch (error) {
    console.error("Proxy error:", error);
    return NextResponse.json(
      { error: "Proxy error" },
      { status: 500 }
    );
  }
} 