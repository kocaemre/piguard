import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { requireAdmin } from "@/app/lib/auth/session";

// GET /api/users/approved
// Returns the list of approved users
export async function GET() {
  try {
    await requireAdmin();

    const approvedUsers = await prisma.user.findMany({
      where: {
        role: "APPROVED",
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(approvedUsers);
  } catch (error) {
    console.error("Error fetching approved users:", error);
    return NextResponse.json(
      { error: "Unauthorized or server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/users/approved
// Revokes access for an approved user (changes to USER role)
export async function DELETE(req: NextRequest) {
  try {
    // Only admin users can use this endpoint
    await requireAdmin();
    
    // Get user ID from the URL
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('id');
    
    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Find the user to ensure they exist and have APPROVED role
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    if (user.role !== "APPROVED") {
      return NextResponse.json(
        { error: "This user is not an approved user" },
        { status: 400 }
      );
    }

    // Update user role to USER (revoke access)
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role: "USER" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "User access has been revoked",
      user: updatedUser
    });
  } catch (error) {
    console.error("Error revoking user access:", error);
    return NextResponse.json(
      { error: "Unauthorized or server error" },
      { status: 500 }
    );
  }
} 