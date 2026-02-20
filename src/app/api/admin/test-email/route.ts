import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { testEmailSetup } from "@/lib/email";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    // Vérifier que l'utilisateur est admin
    const session = await auth();
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const testRecipient = body?.email || undefined;

    const result = await testEmailSetup(testRecipient);

    return NextResponse.json({
      success: result.gmailApi.working || result.smtp.working,
      timestamp: new Date().toISOString(),
      diagnostic: result,
      recommendations: getRecommendations(result),
    });
  } catch (error: any) {
    console.error("[test-email] Erreur:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Erreur interne",
        stack: process.env.NODE_ENV === "development" ? error?.stack : undefined,
      },
      { status: 500 }
    );
  }
}

function getRecommendations(result: Awaited<ReturnType<typeof testEmailSetup>>): string[] {
  const recs: string[] = [];

  if (!result.gmailApi.configured) {
    recs.push(
      "⚠️ Gmail API non configuré : définissez GMAIL_SERVICE_ACCOUNT_EMAIL, GMAIL_PRIVATE_KEY et GMAIL_USER dans les variables d'environnement Vercel."
    );
  } else if (!result.gmailApi.working) {
    if (result.gmailApi.error?.includes("Delegation denied") || result.gmailApi.error?.includes("unauthorized_client")) {
      recs.push(
        "🔴 La délégation à l'échelle du domaine n'est pas configurée. Allez dans Google Workspace Admin > Sécurité > Contrôles API > Délégation à l'échelle du domaine, et ajoutez le Client ID du compte de service avec le scope : https://www.googleapis.com/auth/gmail.send"
      );
    } else if (result.gmailApi.error?.includes("invalid_grant")) {
      recs.push(
        "🔴 La clé privée du compte de service est invalide ou a expiré. Régénérez une nouvelle clé JSON dans Google Cloud Console."
      );
    } else if (result.gmailApi.error?.includes("invalid_scope")) {
      recs.push(
        "🔴 Le scope Gmail n'est pas autorisé. Vérifiez que le scope https://www.googleapis.com/auth/gmail.send est autorisé dans la délégation à l'échelle du domaine."
      );
    } else {
      recs.push(
        `🔴 Gmail API erreur : ${result.gmailApi.error}. Vérifiez la configuration du compte de service et la délégation de domaine.`
      );
    }
  }

  if (!result.smtp.configured) {
    recs.push(
      "💡 Configurez un SMTP de fallback (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD) avec un vrai service comme Gmail App Password, SendGrid ou Brevo."
    );
  } else if (result.smtp.configured && !result.smtp.working) {
    recs.push(
      `🟡 SMTP configuré mais non fonctionnel : ${result.smtp.error}. Vérifiez vos identifiants SMTP.`
    );
  }

  if (result.envVars.GMAIL_PRIVATE_KEY_FORMAT === "INVALIDE") {
    recs.push(
      "🔴 Le format de GMAIL_PRIVATE_KEY est invalide. La valeur doit commencer par '-----BEGIN PRIVATE KEY-----'. Sur Vercel, assurez-vous de coller la clé complète avec les \\n entre chaque ligne."
    );
  }

  if (result.gmailApi.working) {
    recs.push("✅ Gmail API fonctionne correctement !");
  }
  if (result.smtp.working) {
    recs.push("✅ SMTP fallback fonctionne correctement !");
  }

  if (!result.gmailApi.working && !result.smtp.working) {
    recs.push(
      "🚨 AUCUN transport email ne fonctionne ! Les emails ne seront PAS envoyés. Configurez au moins un transport fonctionnel."
    );
    recs.push(
      "💡 Solution rapide : créez un App Password Gmail (https://myaccount.google.com/apppasswords) et configurez SMTP_HOST=smtp.gmail.com, SMTP_PORT=587, SMTP_USER=votre-email@gmail.com, SMTP_PASSWORD=le-mot-de-passe-app"
    );
  }

  return recs;
}
