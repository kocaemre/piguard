import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

// In a real application, you would store these settings in a database
// For demo purposes, we'll use cookies as simple storage

// GET /api/settings/raspberry-pi
export async function GET() {
  try {
    // cookies() fonksiyonunu await edelim
    const cookieStore = await cookies();
    
    // Değerleri alırken await kullanmadan
    const ipValue = cookieStore.get("raspberry_pi_ip")?.value || "";
    const portValue = cookieStore.get("raspberry_pi_port")?.value || "8000";

    return NextResponse.json({
      ip: ipValue,
      port: portValue,
    });
  } catch (error) {
    console.error("Error fetching Raspberry Pi settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

// POST /api/settings/raspberry-pi
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { ip, port } = body;

    // Basic validation
    if (ip && !/^(\d{1,3}\.){3}\d{1,3}$/.test(ip)) {
      return NextResponse.json(
        { error: "Invalid IP address format" },
        { status: 400 }
      );
    }

    if (!port || isNaN(Number(port)) || Number(port) < 1 || Number(port) > 65535) {
      return NextResponse.json(
        { error: "Invalid port number" },
        { status: 400 }
      );
    }

    // cookies() fonksiyonunu await edelim
    const cookieStore = await cookies();
    
    // Store settings in cookies (in a real app, use a database)
    cookieStore.set("raspberry_pi_ip", ip, {
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      httpOnly: true,
    });
    
    cookieStore.set("raspberry_pi_port", port, {
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      httpOnly: true,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving Raspberry Pi settings:", error);
    return NextResponse.json(
      { error: "Failed to save settings" },
      { status: 500 }
    );
  }
} 