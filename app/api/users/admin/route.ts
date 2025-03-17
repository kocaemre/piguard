import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { requireAdmin } from "@/app/lib/auth/session";
import bcrypt from "bcrypt";
import crypto from "crypto";

// GET /api/users/admin
// Returns the list of admin users
export async function GET() {
  try {
    await requireAdmin();

    const adminUsers = await prisma.user.findMany({
      where: {
        role: "ADMIN",
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    return NextResponse.json(adminUsers);
  } catch (error) {
    console.error("Error fetching admin users:", error);
    return NextResponse.json(
      { error: "Unauthorized or server error" },
      { status: 500 }
    );
  }
}

// POST /api/users/admin
// Makes a user an admin (creates the user if not found)
export async function POST(req: NextRequest) {
  try {
    // Only admin users can use this endpoint
    await requireAdmin();

    const body = await req.json();
    const { email, name } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Find user by email
    let user = await prisma.user.findUnique({
      where: { email },
    });

    let resetToken = null;
    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      // Kullanıcı yoksa, şifre sıfırlama token'ı ile yeni kullanıcı oluştur
      resetToken = crypto.randomBytes(20).toString('hex');
      const resetTokenExpiry = new Date(Date.now() + 24 * 3600000); // 24 saat geçerli
      
      // Rastgele geçici şifre - kullanıcı ilk girişinde sıfırlayacak
      const temporaryPassword = crypto.randomBytes(10).toString('hex');
      const hashedPassword = await bcrypt.hash(temporaryPassword, 10);
      
      try {
        user = await prisma.user.create({
          data: {
            email,
            name: name || email.split('@')[0], // Use part before @ as name if not provided
            password: hashedPassword,
            role: "USER", // Start as regular user
            resetToken,
            resetTokenExpiry,
          },
        });
        
        console.log(`Created new user ${email} with reset token: ${resetToken}`);
      } catch (createError) {
        console.error("Error creating user:", createError);
        return NextResponse.json(
          { error: "Failed to create user" },
          { status: 500 }
        );
      }
    }

    // Update user role to ADMIN
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { role: "ADMIN" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    return NextResponse.json({
      ...updatedUser,
      isNewUser,
      // Sadece yeni kullanıcı oluşturulduysa token'ı döndür
      resetToken: isNewUser ? resetToken : undefined,
      resetUrl: isNewUser ? `/auth/reset-password?token=${resetToken}` : undefined
    });
  } catch (error) {
    console.error("Error updating user role:", error);
    return NextResponse.json(
      { error: "Unauthorized or server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/users/admin
// Removes admin role from a user (changes to USER role)
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
    
    // Count total number of admins
    const adminCount = await prisma.user.count({
      where: { role: "ADMIN" }
    });
    
    // Don't allow removing the last admin
    if (adminCount <= 1) {
      return NextResponse.json(
        { error: "Cannot remove the last admin user" },
        { status: 400 }
      );
    }

    // Update user role to USER
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

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error removing admin role:", error);
    return NextResponse.json(
      { error: "Unauthorized or server error" },
      { status: 500 }
    );
  }
} 