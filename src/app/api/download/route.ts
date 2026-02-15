import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sendDownloadEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { firstName, lastName, email, organization, jobTitle, gdprConsent, resourceId } = body;

    if (!firstName || !lastName || !email || !resourceId) {
      return NextResponse.json(
        { error: "Champs obligatoires manquants" },
        { status: 400 }
      );
    }

    const resource = await prisma.resource.findUnique({
      where: { id: resourceId, type: "free", status: "published" },
    });

    if (!resource) {
      return NextResponse.json(
        { error: "Ressource introuvable" },
        { status: 404 }
      );
    }

    // Upsert contact
    let contact = await prisma.contact.findFirst({ where: { email } });
    if (!contact) {
      contact = await prisma.contact.create({
        data: {
          firstName,
          lastName,
          email,
          organization: organization || null,
          jobTitle: jobTitle || null,
          gdprConsent: gdprConsent || false,
        },
      });
    }

    // Create download token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48h

    await prisma.download.create({
      data: {
        contactId: contact.id,
        resourceId: resource.id,
        token,
        expiresAt,
      },
    });

    const downloadUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/download/${token}`;

    // Send email
    try {
      await sendDownloadEmail({
        to: email,
        firstName,
        resourceTitle: resource.title,
        downloadUrl,
      });
    } catch (emailError) {
      console.error("Email send error:", emailError);
      // Still return success - the download link was created
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Download error:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue" },
      { status: 500 }
    );
  }
}
