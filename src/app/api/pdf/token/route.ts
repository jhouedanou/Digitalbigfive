import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { resourceId } = await req.json();
  if (!resourceId) {
    return NextResponse.json({ error: "Resource ID manquant" }, { status: 400 });
  }

  // Verify user has purchased this resource (or is admin)
  const order = await prisma.order.findFirst({
    where: {
      userId: session.user.id,
      resourceId,
      status: "paid",
    },
  });

  const isAdmin = session.user.role === "admin";

  if (!order && !isAdmin) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  // Generate a signed token valid for 2 hours
  const secret = process.env.NEXTAUTH_SECRET || "fallback-secret";
  const timestamp = Date.now().toString();
  const signature = crypto
    .createHmac("sha256", secret)
    .update(`${session.user.id}:${resourceId}:${timestamp}`)
    .digest("hex");

  const token = `${timestamp}.${signature}`;

  return NextResponse.json({ token });
}
