import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendDownloadEmail } from "@/lib/email";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const { resourceId, firstName, lastName, email, phone, organization, gdprConsent } = await request.json();

    if (!resourceId) {
      return NextResponse.json(
        { error: "ID de ressource manquant" },
        { status: 400 }
      );
    }

    if (!firstName || !lastName || !email) {
      return NextResponse.json(
        { error: "Prénom, nom et email sont obligatoires" },
        { status: 400 }
      );
    }

    if (!gdprConsent) {
      return NextResponse.json(
        { error: "Le consentement RGPD est obligatoire" },
        { status: 400 }
      );
    }

    // Vérifier que la ressource existe et est gratuite
    const resource = await prisma.resource.findUnique({
      where: { id: resourceId },
      select: {
        id: true,
        type: true,
        status: true,
        filePath: true,
        title: true,
      },
    });

    if (!resource) {
      return NextResponse.json(
        { error: "Ressource introuvable" },
        { status: 404 }
      );
    }

    if (resource.type !== "free") {
      return NextResponse.json(
        { error: "Cette ressource n'est pas gratuite" },
        { status: 403 }
      );
    }

    if (resource.status !== "published") {
      return NextResponse.json(
        { error: "Cette ressource n'est pas disponible" },
        { status: 403 }
      );
    }

    // Générer un token de téléchargement temporaire (valide 1 heure)
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 heure

    // Upsert contact par email (créer si nouveau, mettre à jour si existant)
    const contact = await prisma.contact.upsert({
      where: { email },
      create: {
        firstName,
        lastName,
        email,
        phone: phone || null,
        organization: organization || null,
        gdprConsent: true,
      },
      update: {
        firstName,
        lastName,
        phone: phone || undefined, // ne met à jour que si fourni
        organization: organization || undefined,
      },
    });

    // Créer l'enregistrement de téléchargement
    await prisma.download.create({
      data: {
        contactId: contact.id,
        resourceId: resource.id,
        token,
        expiresAt,
      },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://digitalbigfive.vercel.app";
    const downloadUrl = `${appUrl}/api/download/${token}`;

    // Envoyer l'email avec le lien de téléchargement via after() pour Vercel
    after(async () => {
      try {
        await sendDownloadEmail({
          to: email,
          firstName,
          resourceTitle: resource.title,
          downloadUrl,
        });
        console.log("[Download] \u2705 Email t\u00e9l\u00e9chargement envoy\u00e9 \u00e0", email);
      } catch (err: any) {
        console.error("[Download] \u274c \u00c9chec envoi lien t\u00e9l\u00e9chargement:", err?.message || err);
      }
    });

    return NextResponse.json({
      downloadUrl,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error) {
    console.error("Direct download error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la préparation du téléchargement" },
      { status: 500 }
    );
  }
}
