import { NextRequest, NextResponse, after } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { initializePayment } from "@/lib/paytech";
import { sendWelcomeEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      firstName,
      lastName,
      email,
      password,
      phone,
      organization,
      jobTitle,
      resourceSlug,
    } = body;

    // Validation
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

    if (!resourceSlug) {
      return NextResponse.json(
        { error: "Produit manquant" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        {
          error: "Un compte existe déjà avec cet email. Veuillez vous connecter.",
          code: "EMAIL_EXISTS",
        },
        { status: 409 }
      );
    }

    // Find the resource
    const resource = await prisma.resource.findUnique({
      where: { slug: resourceSlug },
    });

    if (!resource || resource.type !== "paid" || resource.status !== "published") {
      return NextResponse.json(
        { error: "Produit introuvable ou indisponible." },
        { status: 404 }
      );
    }

    if (!resource.price) {
      return NextResponse.json(
        { error: "Ce produit n'a pas de prix défini." },
        { status: 400 }
      );
    }

    // Create user account
    const hashedPassword = await hash(password, 12);
    const user = await prisma.user.create({
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

    // Create a pending order
    const order = await prisma.order.create({
      data: {
        userId: user.id,
        resourceId: resource.id,
        amount: resource.price,
        currency: resource.currency,
        status: "pending",
      },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Initialize PayTech payment
    const payment = await initializePayment({
      amount: resource.price,
      currency: resource.currency,
      description: resource.title,
      customerEmail: user.email,
      customerFirstName: user.firstName,
      customerLastName: user.lastName,
      metadata: {
        orderId: order.id,
        resourceId: resource.id,
        userId: user.id,
      },
      refCommand: order.id,
      returnUrl: `${appUrl}/achat/succes`,
      cancelUrl: `${appUrl}/achat/annule`,
      ipnUrl: `${appUrl}/api/webhook`,
    });

    // Store the PayTech token
    await prisma.order.update({
      where: { id: order.id },
      data: { paytechToken: payment.token },
    });

    // Send welcome email asynchronously
    after(async () => {
      try {
        await sendWelcomeEmail({ to: email, firstName });
        console.log("[RegisterAndCheckout] ✅ Email bienvenue envoyé à", email);
      } catch (err: any) {
        console.error("[RegisterAndCheckout] ❌ Échec envoi bienvenue:", err?.message || err);
      }
    });

    return NextResponse.json({
      success: true,
      checkout_url: payment.redirect_url,
      orderId: order.id,
    });
  } catch (error: any) {
    console.error("Register and checkout error:", error?.message || error);

    if (error?.paytechError) {
      return NextResponse.json(
        { error: `Erreur PayTech: ${error.message}` },
        { status: error.status || 500 }
      );
    }

    return NextResponse.json(
      { error: "Erreur lors de l'inscription et du paiement." },
      { status: 500 }
    );
  }
}
