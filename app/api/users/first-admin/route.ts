import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getCurrentUser } from "@/app/lib/auth/session";

// POST /api/users/first-admin
// İlk admin kullanıcıyı oluşturur (eğer veritabanında hiç admin kullanıcı yoksa)
export async function POST(req: NextRequest) {
  try {
    // Mevcut oturum açmış kullanıcıyı kontrol et
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Veritabanında admin kullanıcı sayısını kontrol et
    const adminCount = await prisma.user.count({
      where: {
        role: "ADMIN",
      },
    });

    // Eğer zaten admin kullanıcı varsa, işlemi reddet
    if (adminCount > 0) {
      return NextResponse.json(
        { error: "Admin user already exists. Contact an administrator to grant admin privileges." },
        { status: 403 }
      );
    }

    // İstek gövdesinden kullanıcı email'ini al
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Kullanıcıyı email ile bul
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Kullanıcıyı admin olarak güncelle
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
      success: true,
      message: "First admin user created successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error creating first admin:", error);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
} 