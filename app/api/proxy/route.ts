import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

// Proxy API for Raspberry Pi
// This avoids CORS issues by making requests through our own server

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
    
    // Get Raspberry Pi settings from cookies
    const cookieStore = await cookies();
    const ipValue = cookieStore.get("raspberry_pi_ip")?.value || "";
    const portValue = cookieStore.get("raspberry_pi_port")?.value || "5000";
    
    if (!ipValue) {
      return NextResponse.json(
        { error: "Raspberry Pi IP not configured" },
        { status: 400 }
      );
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
      return NextResponse.json(
        { error: `Failed to connect to Raspberry Pi: ${(error as Error).message}` },
        { status: 502 }
      );
    }
  } catch (error) {
    console.error("Proxy error:", error);
    return NextResponse.json(
      { error: "Proxy error" },
      { status: 500 }
    );
  }
} 