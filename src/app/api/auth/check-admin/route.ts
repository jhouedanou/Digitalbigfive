import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ isAdmin: false }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { role: true },
    });

    return NextResponse.json({
      isAdmin: user?.role === "admin",
    });
  } catch (error) {
    console.error("Check admin error:", error);
    return NextResponse.json({ isAdmin: false }, { status: 500 });
  }
}
