import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createClient } from "@supabase/supabase-js";
import {
  verifyViewerToken,
  validateSession,
  logAccess,
} from "@/lib/pdf-security";
import { headers } from "next/headers";

// Supabase admin client for file access
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/pdf/[id]
 * 
 * Endpoint de streaming sécurisé pour les PDFs.
 * - Vérifie le token JWT de session
 * - Valide les droits d'accès
 * - Log les accès pour audit
 * - Headers de sécurité stricts
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const headersList = await headers();
  const ipAddress = headersList.get("x-forwarded-for") || "unknown";
  const userAgent = headersList.get("user-agent") || "unknown";

  try {
    // ─── Authentification ─────────────────────────────────────
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentification requise" },
        { status: 401 }
      );
    }

    const { id: resourceId } = await params;

    // ─── Vérification du token de session ─────────────────────
    const viewerToken = req.nextUrl.searchParams.get("token");
    if (!viewerToken) {
      await logAccess(session.user.id, resourceId, undefined, "blocked", undefined, ipAddress, userAgent, {
        reason: "Token manquant",
      });
      return NextResponse.json(
        { error: "Token de session manquant" },
        { status: 401 }
      );
    }

    const payload = verifyViewerToken(viewerToken);
    console.log("[pdf/id] Token payload:", payload);
    
    if (!payload) {
      await logAccess(session.user.id, resourceId, undefined, "blocked", undefined, ipAddress, userAgent, {
        reason: "Token invalide ou expiré",
      });
      return NextResponse.json(
        { error: "Token de visualisation invalide ou expiré. Veuillez rouvrir le document." },
        { status: 403 }
      );
    }

    // ─── Vérifier que le token appartient à cet utilisateur ───
    console.log("[pdf/id] Comparing user:", { tokenUser: payload.userId, sessionUser: session.user.id });
    console.log("[pdf/id] Comparing resource:", { tokenResource: payload.resourceId, requestResource: resourceId });
    
    if (payload.userId !== session.user.id || payload.resourceId !== resourceId) {
      await logAccess(session.user.id, resourceId, undefined, "blocked", undefined, ipAddress, userAgent, {
        reason: "Token ne correspond pas",
      });
      return NextResponse.json(
        { error: "Token non autorisé pour cette ressource" },
        { status: 403 }
      );
    }

    // ─── Valider la session ───────────────────────────────────
    console.log("[pdf/id] Validating session:", payload.sessionId);
    
    const isValidSession = await validateSession(
      payload.sessionId,
      session.user.id,
      resourceId
    );

    console.log("[pdf/id] Session valid:", isValidSession);

    if (!isValidSession) {
      return NextResponse.json(
        { error: "Session expirée. Veuillez rouvrir le document." },
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
        // Empêcher le téléchargement direct
        "Content-Disposition": "inline; filename=document.pdf",
        // Empêcher le cache
        "Cache-Control": "no-store, no-cache, must-revalidate, private, max-age=0",
        "Pragma": "no-cache",
        "Expires": "0",
        // Sécurité du contenu
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "SAMEORIGIN",
        "X-XSS-Protection": "1; mode=block",
        // CSP strict
        "Content-Security-Policy": "default-src 'self'; script-src 'none'; object-src 'none';",
        // Empêcher les requêtes de range (téléchargement partiel)
        "Accept-Ranges": "none",
        // Headers personnalisés pour le tracking
        "X-Session-Id": payload.sessionId,
        "X-Resource-Id": resourceId,
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
