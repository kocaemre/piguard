import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { requireAdmin } from "@/app/lib/auth/session";
import crypto from "crypto";

// GET /api/users/pending
// Lists users waiting for approval
export async function GET() {
  try {
    await requireAdmin();

    const pendingUsers = await prisma.user.findMany({
      where: {
        role: "USER",
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

    return NextResponse.json(pendingUsers);
  } catch (error) {
    console.error("Error fetching pending users:", error);
    return NextResponse.json(
      { error: "Unauthorized or server error" },
      { status: 500 }
    );
  }
}

// POST /api/users/pending
// Approves a user (upgrades to APPROVED role)
export async function POST(req: NextRequest) {
  try {
    await requireAdmin();

    const body = await req.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Find the user
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Create password reset token for the user
    const resetToken = crypto.randomBytes(20).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 24 * 3600000); // Valid for 24 hours

    // Update user role to APPROVED and add password reset token
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { 
        role: "APPROVED",
        resetToken,
        resetTokenExpiry
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    return NextResponse.json({
      ...updatedUser,
      resetToken,
      resetUrl: `/auth/reset-password?token=${resetToken}`
    });
  } catch (error) {
    console.error("Error approving user:", error);
    return NextResponse.json(
      { error: "Unauthorized or server error" },
      { status: 500 }
    );
  }
} 