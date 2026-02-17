import { NextRequest, NextResponse } from "next/server";
import { authFromRequest } from "@/lib/auth-bearer";
import { prisma } from "@/lib/prisma";
import { createClient } from "@supabase/supabase-js";
import { checkAccess } from "@/lib/pdf-security";

// Supabase admin client for file access
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/pdf/[id]
 * 
 * Endpoint simplifié de streaming PDF.
 * Supporte cookies (web) et Bearer token (Electron).
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // ─── Authentification via cookies OU Bearer token ────
    const session = await authFromRequest(req);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentification requise" },
        { status: 401 }
      );
    }

    const { id: resourceId } = await params;

    // ─── Vérification des droits d'accès ──────────────────────
    const access = await checkAccess(session.user.id, resourceId);
    if (!access.hasAccess) {
      return NextResponse.json(
        { error: access.reason || "Accès refusé" },
        { status: 403 }
      );
    }

    // ─── Récupérer la ressource ───────────────────────────────
    const resource = await prisma.resource.findUnique({
      where: { id: resourceId },
    });

    if (!resource) {
      return NextResponse.json(
        { error: "Ressource introuvable" },
        { status: 404 }
      );
    }

    // ─── Lire le fichier PDF depuis Supabase Storage ──────────
    if (!resource.filePath) {
      return NextResponse.json(
        { error: "Chemin du fichier non défini" },
        { status: 404 }
      );
    }

    // Clean file path - remove leading slash if present
    let cleanPath = resource.filePath.startsWith("/")
      ? resource.filePath.slice(1)
      : resource.filePath;
    
    // Remove "uploads/" prefix since we're already accessing the "uploads" bucket
    if (cleanPath.startsWith("uploads/")) {
      cleanPath = cleanPath.slice(8);
    }

    const { data: fileData, error: downloadError } = await supabaseAdmin.storage
      .from("uploads")
      .download(cleanPath);

    if (downloadError || !fileData) {
      console.error("PDF download error:", downloadError);
      return NextResponse.json(
        { error: "Fichier introuvable sur le serveur" },
        { status: 404 }
      );
    }

    const fileBuffer = Buffer.from(await fileData.arrayBuffer());

    // ─── Retourner le PDF avec headers de sécurité ────────────
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Length": fileBuffer.length.toString(),
        "Content-Disposition": "inline; filename=document.pdf",
        "Cache-Control": "no-store, no-cache, must-revalidate, private, max-age=0",
        "Pragma": "no-cache",
        "Expires": "0",
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "SAMEORIGIN",
        "X-XSS-Protection": "1; mode=block",
        "Content-Security-Policy": "default-src 'self'; script-src 'none'; object-src 'none';",
        "Accept-Ranges": "none",
      },
    });
  } catch (error) {
    console.error("PDF streaming error:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
