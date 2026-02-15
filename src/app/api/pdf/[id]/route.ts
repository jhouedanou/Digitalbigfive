import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id: resourceId } = await params;

  // Verify user has purchased this product
  const order = await prisma.order.findFirst({
    where: {
      userId: session.user.id,
      resourceId,
      status: "paid",
    },
  });

  // Allow admin access too
  const isAdmin = session.user.role === "admin";

  if (!order && !isAdmin) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const resource = await prisma.resource.findUnique({
    where: { id: resourceId },
  });

  if (!resource) {
    return NextResponse.json(
      { error: "Ressource introuvable" },
      { status: 404 }
    );
  }

  const filePath = path.join(process.cwd(), "public", resource.filePath);

  if (!fs.existsSync(filePath)) {
    return NextResponse.json(
      { error: "Fichier introuvable" },
      { status: 404 }
    );
  }

  const fileBuffer = fs.readFileSync(filePath);

  return new NextResponse(fileBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Cache-Control": "no-store",
      "Content-Disposition": "inline",
    },
  });
}
