import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { initializeMonerooPayment } from "@/lib/moneroo";
import { sendCAPIEvent } from "@/lib/meta-tracking";

export async function POST(request: NextRequest) {
  try {
    console.log("[Moneroo Checkout] === START ===");
    
    const session = await auth();
    console.log("[Moneroo Checkout] Session:", session?.user?.id || "null");
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Vous devez être connecté pour effectuer un achat." },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Votre session est invalide. Veuillez vous reconnecter." },
        { status: 401 }
      );
    }

    const { slug } = await request.json();
    if (!slug) {
      return NextResponse.json(
        { error: "Slug du produit manquant." },
        { status: 400 }
      );
    }

    const resource = await prisma.resource.findUnique({
      where: { slug },
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

    // Vérifier si l'utilisateur a déjà acheté ce produit
    const existingOrder = await prisma.order.findFirst({
      where: {
        userId: session.user.id,
        resourceId: resource.id,
        status: "paid",
      },
    });

    if (existingOrder) {
      return NextResponse.json(
        { error: "Vous avez déjà acheté ce produit." },
        { status: 400 }
      );
    }

    // Créer une commande en attente
    console.log("[Moneroo Checkout] Creating order for user:", user.id, "resource:", resource.id);
    const order = await prisma.order.create({
      data: {
        userId: user.id,
        resourceId: resource.id,
        amount: resource.price,
        currency: resource.currency,
        status: "pending",
        paymentProvider: "moneroo",
      },
    });
    console.log("[Moneroo Checkout] Order created:", order.id);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Initialiser le paiement Moneroo
    console.log("[Moneroo Checkout] Initializing Moneroo payment...");
    const payment = await initializeMonerooPayment({
      amount: resource.price,
      currency: resource.currency,
      description: `${resource.title} - Big Five`,
      customerEmail: user.email,
      customerFirstName: user.firstName,
      customerLastName: user.lastName,
      metadata: {
        orderId: order.id,
        resourceId: resource.id,
        userId: user.id,
      },
      returnUrl: `${appUrl}/achat/succes?paymentId=${order.id}&provider=moneroo`,
    });

    // Stocker l'ID de paiement Moneroo
    console.log("[Moneroo Checkout] Storing moneroo payment ID:", payment.id);
    await prisma.order.update({
      where: { id: order.id },
      data: { monerooPaymentId: payment.id },
    });

    // CAPI : InitiateCheckout
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
               request.headers.get("x-real-ip") || undefined;
    const userAgent = request.headers.get("user-agent") || undefined;
    sendCAPIEvent({
      eventName: "InitiateCheckout",
      eventId: `checkout_${order.id}`,
      email: user.email,
      firstName: user.firstName || undefined,
      lastName: user.lastName || undefined,
      ip,
      userAgent,
      sourceUrl: `${appUrl}/produits/${resource.slug}`,
      customData: {
        value: resource.price,
        currency: resource.currency || "XOF",
        content_ids: [resource.slug],
        num_items: 1,
      },
    }).catch(() => {/* CAPI non-bloquant */});

    return NextResponse.json({
      checkout_url: payment.checkout_url,
      orderId: order.id,
    });
  } catch (error: any) {
    console.error("[Moneroo Checkout] Error:", error);
    console.error("[Moneroo Checkout] Stack:", error?.stack);
    console.error("[Moneroo Checkout] Message:", error?.message);

    if (error?.monerooError) {
      return NextResponse.json(
        { error: `Erreur Moneroo: ${error.message}` },
        { status: error.status || 500 }
      );
    }

    return NextResponse.json(
      { error: error?.message || "Erreur lors de l'initialisation du paiement." },
      { status: 500 }
    );
  }
}
