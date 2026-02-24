import { NextRequest, NextResponse, after } from "next/server";
import { hash } from "bcryptjs";
import { createClient } from "@supabase/supabase-js";
import { prisma } from "@/lib/prisma";
import { initializePayment } from "@/lib/paytech";
import { sendWelcomeEmail } from "@/lib/email";
import { sendCAPIEvent } from "@/lib/meta-tracking";

// Client Supabase Admin (service role) pour créer les comptes Auth côté serveur
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

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

    // Create user account in Prisma DB
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

    // Créer le compte Supabase Auth pour que l'utilisateur puisse se connecter après paiement
    const supabaseAdmin = getSupabaseAdmin();
    const { error: supabaseAuthError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Confirmer l'email automatiquement (pas besoin de vérification)
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
      },
    });

    if (supabaseAuthError) {
      // Si le compte Supabase existe déjà (cas rare), on continue quand même
      console.warn("[RegisterAndCheckout] Supabase Auth warning:", supabaseAuthError.message);
    }

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

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
               req.headers.get("x-real-ip") || undefined;
    const userAgent = req.headers.get("user-agent") || undefined;

    // Send welcome email + CAPI events asynchronously
    after(async () => {
      try {
        await sendWelcomeEmail({ to: email, firstName });
        console.log("[RegisterAndCheckout] ✅ Email bienvenue envoyé à", email);
      } catch (err: any) {
        console.error("[RegisterAndCheckout] ❌ Échec envoi bienvenue:", err?.message || err);
      }

      // CAPI : CompleteRegistration
      try {
        await sendCAPIEvent({
          eventName: "CompleteRegistration",
          eventId: `registration_${user.id}`,
          email,
          firstName,
          lastName,
          ip,
          userAgent,
          sourceUrl: `${appUrl}/inscription`,
          customData: { status: true },
        });
        console.log("[RegisterAndCheckout] ✅ CAPI CompleteRegistration envoyé");
      } catch (err: any) {
        console.error("[RegisterAndCheckout] ❌ CAPI CompleteRegistration échoué:", err?.message || err);
      }

      // CAPI : InitiateCheckout
      try {
        await sendCAPIEvent({
          eventName: "InitiateCheckout",
          eventId: `checkout_${order.id}`,
          email,
          firstName,
          lastName,
          ip,
          userAgent,
          sourceUrl: `${appUrl}/produits/${resourceSlug}`,
          customData: {
            value: resource.price,
            currency: resource.currency || "XOF",
            content_ids: [resource.slug],
            num_items: 1,
          },
        });
        console.log("[RegisterAndCheckout] ✅ CAPI InitiateCheckout envoyé");
      } catch (err: any) {
        console.error("[RegisterAndCheckout] ❌ CAPI InitiateCheckout échoué:", err?.message || err);
      }
    });

    return NextResponse.json({
      success: true,
      checkout_url: payment.redirect_url,
      orderId: order.id,
      userEmail: email, // Retourner l'email pour auto-remplissage de la connexion après paiement
      isNewUser: true,
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
