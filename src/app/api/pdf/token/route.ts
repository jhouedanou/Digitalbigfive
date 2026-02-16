import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  createViewerSession,
  checkAccess,
  logAccess,
} from "@/lib/pdf-security";
import { headers } from "next/headers";

/**
 * POST /api/pdf/token
 * 
 * Génère un token de session sécurisé pour la lecture de PDF.
 * - Vérifie les droits d'accès (achat ou admin)
 * - Crée une session avec TTL de 30 min
 * - Log l'accès pour audit
 */
export async function POST(req: NextRequest) {
  try {
    // ─── Authentification ─────────────────────────────────────
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentification requise" },
        { status: 401 }
      );
    }

    // ─── Validation de la requête ─────────────────────────────
    const body = await req.json();
    const { resourceId } = body;

    if (!resourceId) {
      return NextResponse.json(
        { error: "Resource ID manquant" },
        { status: 400 }
      );
    }

    // ─── Vérification des droits ──────────────────────────────
    const access = await checkAccess(session.user.id, resourceId);
    if (!access.hasAccess) {
      await logAccess(session.user.id, resourceId, undefined, "blocked", undefined, undefined, undefined, {
        reason: access.reason,
      });
      return NextResponse.json(
        { error: access.reason || "Accès refusé" },
        { status: 403 }
      );
    }

    // ─── Récupérer les infos de la ressource ──────────────────
    const resource = await prisma.resource.findUnique({
      where: { id: resourceId },
    });

    if (!resource) {
      return NextResponse.json(
        { error: "Ressource introuvable" },
        { status: 404 }
      );
    }

    // ─── Créer la session de lecture ──────────────────────────
    const headersList = await headers();
    const ipAddress = headersList.get("x-forwarded-for") || 
                      headersList.get("x-real-ip") || 
                      "unknown";
    const userAgent = headersList.get("user-agent") || "unknown";

    const { sessionId, token } = await createViewerSession(
      session.user.id,
      resourceId,
      ipAddress,
      userAgent,
      resource.pageCount || 0
    );

    // ─── Réponse avec token et infos ──────────────────────────
    return NextResponse.json({
      token,
      sessionId,
      expiresIn: 30 * 60, // 30 minutes en secondes
      resource: {
        id: resource.id,
        title: resource.title,
        pageCount: resource.pageCount,
        enableWatermark: resource.enableWatermark,
      },
    });
  } catch (error) {
    console.error("Token generation error:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

