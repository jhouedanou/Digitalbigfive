import { NextRequest, NextResponse, after } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { sendWelcomeEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { firstName, lastName, email, password, organization, jobTitle, phone } = body;

    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json(
        { error: "Tous les champs obligatoires doivent être remplis" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Le mot de passe doit contenir au moins 8 caractères" },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "Un compte existe déjà avec cet email" },
        { status: 409 }
      );
    }

    const hashedPassword = await hash(password, 12);

    await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        password: hashedPassword,
        organization: organization || null,
        jobTitle: jobTitle || null,
        phone: phone || null,
      },
    });

    // Envoi email de bienvenue via after() pour garantir l'envoi sur Vercel
    after(async () => {
      try {
        await sendWelcomeEmail({ to: email, firstName });
        console.log("[Register] ✅ Email bienvenue envoyé à", email);
      } catch (err: any) {
        console.error("[Register] ❌ Échec envoi bienvenue:", err?.message || err);
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'inscription" },
      { status: 500 }
    );
  }
}
