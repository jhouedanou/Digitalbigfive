import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  verifyViewerToken,
  recordPageView,
  closeSession,
} from "@/lib/pdf-security";

/**
 * POST /api/pdf/activity
 * 
 * Enregistre l'activité de lecture (pages vues, fermeture).
 * Appelé par le client lors de la navigation dans le PDF.
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

    const { token, action, pageNumber } = await req.json();

    if (!token) {
      return NextResponse.json(
        { error: "Token manquant" },
        { status: 400 }
      );
    }

    // Vérifier le token
    const payload = verifyViewerToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: "Token invalide" },
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

    // Traiter l'action
    switch (action) {
      case "page_view":
        if (typeof pageNumber === "number") {
          await recordPageView(
            payload.sessionId,
            session.user.id,
            payload.resourceId,
            pageNumber
          );
        }
        break;

      case "close":
        await closeSession(
          payload.sessionId,
          session.user.id,
          payload.resourceId
        );
        break;

      default:
        // Heartbeat - juste valider la session
        break;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Activity tracking error:", error);
    return NextResponse.json(
      { error: "Erreur interne" },
      { status: 500 }
    );
  }
}
