import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";
import crypto from "crypto";

// Generate a secure viewer token for a user + resource combination
function verifyViewerToken(token: string, userId: string, resourceId: string): boolean {
  const secret = process.env.NEXTAUTH_SECRET || "fallback-secret";
  // Token format: timestamp.signature
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  
  const [timestamp, signature] = parts;
  const ts = parseInt(timestamp, 10);
  
  // Token expires after 2 hours
  if (Date.now() - ts > 2 * 60 * 60 * 1000) return false;
  
  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${userId}:${resourceId}:${timestamp}`)
    .digest("hex");
  
  return crypto.timingSafeEqual(
    Buffer.from(signature, "hex"),
    Buffer.from(expected, "hex")
  );
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id: resourceId } = await params;

  // Verify viewer token from query params (prevents URL sharing)
  const viewerToken = req.nextUrl.searchParams.get("token");
  if (!viewerToken || !verifyViewerToken(viewerToken, session.user.id, resourceId)) {
    return NextResponse.json(
      { error: "Token de visualisation invalide ou expiré. Veuillez rouvrir le document." },
      { status: 403 }
    );
  }

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
    return NextResponse.json({ error: "Accès refusé — achat requis" }, { status: 403 });
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
      // Prevent download, caching, and sharing
      "Content-Disposition": "inline; filename=document.pdf",
      "Cache-Control": "no-store, no-cache, must-revalidate, private",
      "Pragma": "no-cache",
      "Expires": "0",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "SAMEORIGIN",
      "Content-Security-Policy": "default-src 'self'",
      // Prevent range requests (partial downloads)
      "Accept-Ranges": "none",
    },
  });
}
