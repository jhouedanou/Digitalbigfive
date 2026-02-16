import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  rotateToken,
  verifyViewerToken,
  validateSession,
} from "@/lib/pdf-security";

/**
 * POST /api/pdf/refresh
 * 
 * Renouvelle le token de session avant expiration.
 * Appelé automatiquement par le client toutes les 15 minutes.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentification requise" },
        { status: 401 }
      );
    }

    const { token } = await req.json();
    if (!token) {
      return NextResponse.json(
        { error: "Token manquant" },
        { status: 400 }
      );
    }

    // Vérifier le token actuel
    const payload = verifyViewerToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: "Token invalide ou expiré" },
        { status: 403 }
      );
    }

    // Vérifier que le token appartient à cet utilisateur
    if (payload.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Token non autorisé" },
        { status: 403 }
      );
    }

    // Valider la session
    const isValid = await validateSession(
      payload.sessionId,
      session.user.id,
      payload.resourceId
    );

    if (!isValid) {
      return NextResponse.json(
        { error: "Session expirée" },
        { status: 403 }
      );
    }

    // Générer un nouveau token
    const newToken = await rotateToken(token);
    if (!newToken) {
      return NextResponse.json(
        { error: "Impossible de renouveler le token" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      token: newToken,
      expiresIn: 30 * 60, // 30 minutes
    });
  } catch (error) {
    console.error("Token refresh error:", error);
    return NextResponse.json(
      { error: "Erreur interne" },
      { status: 500 }
    );
  }
}
