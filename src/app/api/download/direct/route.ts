import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const { resourceId, firstName, lastName, email, phone, gdprConsent } = await request.json();

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
        gdprConsent: true,
      },
      update: {
        firstName,
        lastName,
        phone: phone || undefined, // ne met à jour que si fourni
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

    return NextResponse.json({
      downloadUrl: `${appUrl}/api/download/${token}`,
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
