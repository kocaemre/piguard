import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

// In a real application, you would store this setting in a database
// For demo purposes, we'll use cookies as simple storage

// GET /api/settings/demo-mode
export async function GET() {
  try {
    // cookies() fonksiyonunu await edelim
    const cookieStore = await cookies();
    
    // Değeri alırken await kullanmadan
    const demoModeValue = cookieStore.get("demo_mode")?.value === "true";

    return NextResponse.json({
      enabled: demoModeValue,
    });
  } catch (error) {
    console.error("Error fetching demo mode setting:", error);
    return NextResponse.json(
      { error: "Failed to fetch demo mode setting" },
      { status: 500 }
    );
  }
}

// POST /api/settings/demo-mode
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { enabled } = body;

    if (typeof enabled !== "boolean") {
      return NextResponse.json(
        { error: "Enabled must be a boolean" },
        { status: 400 }
      );
    }

    // cookies() fonksiyonunu await edelim
    const cookieStore = await cookies();
    
    // Store setting in cookie (in a real app, use a database)
    cookieStore.set("demo_mode", enabled.toString(), {
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      httpOnly: true,
    });

    return NextResponse.json({ success: true, enabled });
  } catch (error) {
    console.error("Error saving demo mode setting:", error);
    return NextResponse.json(
      { error: "Failed to save demo mode setting" },
      { status: 500 }
    );
  }
} 