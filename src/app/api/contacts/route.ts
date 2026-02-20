import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendContactConfirmationEmail, sendAdminNewContactNotification } from "@/lib/email";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const contacts = await prisma.contact.findMany({
    where: { NOT: { email: { contains: "@download.local" } } },
    orderBy: { createdAt: "desc" },
    include: {
      downloads: {
        include: { resource: { select: { title: true } } },
      },
    },
  });

  return NextResponse.json(contacts);
}

// ─── Formulaire de contact (POST) ────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { firstName, lastName, email, phone, message, organization, jobTitle } = body;

    if (!firstName || !lastName || !email || !message) {
      return NextResponse.json(
        { error: "Prénom, nom, email et message sont obligatoires" },
        { status: 400 }
      );
    }

    // Sauvegarder le contact en base
    await prisma.contact.upsert({
      where: { email },
      create: {
        firstName,
        lastName,
        email,
        phone: phone || null,
        organization: organization || null,
        jobTitle: jobTitle || null,
        gdprConsent: true,
      },
      update: {
        firstName,
        lastName,
        phone: phone || undefined,
      },
    });

    // Envoyer les emails via after() pour garantir l'envoi sur Vercel
    after(async () => {
      try {
        await sendContactConfirmationEmail({
          to: email,
          firstName,
          message,
        });
        console.log("[Contact] \u2705 Confirmation email envoy\u00e9 \u00e0", email);
      } catch (err: any) {
        console.error("[Contact] \u274c \u00c9chec confirmation contact:", err?.message || err);
      }

      try {
        await sendAdminNewContactNotification({
          contactName: `${firstName} ${lastName}`,
          contactEmail: email,
          message,
        });
        console.log("[Contact] \u2705 Notification admin envoy\u00e9e");
      } catch (err: any) {
        console.error("[Contact] \u274c \u00c9chec notif admin contact:", err?.message || err);
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'envoi du message" },
      { status: 500 }
    );
  }
}
