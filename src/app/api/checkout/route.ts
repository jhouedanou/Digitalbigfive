import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { initializePayment } from "@/lib/moneroo";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Vous devez être connecté pour effectuer un achat." },
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

    // Check if user already purchased this product
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

    // Create a pending order
    const order = await prisma.order.create({
      data: {
        userId: session.user.id,
        resourceId: resource.id,
        amount: resource.price,
        currency: resource.currency,
        status: "pending",
      },
    });

    // Get user details for Moneroo
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Initialize Moneroo payment
    const payment = await initializePayment({
      amount: resource.price,
      currency: resource.currency,
      description: resource.title,
      customerEmail: user?.email || session.user.email || "",
      customerFirstName: user?.firstName || "Client",
      customerLastName: user?.lastName || "",
      metadata: {
        orderId: order.id,
        resourceId: resource.id,
        userId: session.user.id,
      },
      returnUrl: `${appUrl}/achat/succes`,
    });

    // Store the Moneroo transaction ID
    await prisma.order.update({
      where: { id: order.id },
      data: { monerooTransactionId: payment.data.id },
    });

    return NextResponse.json({
      checkout_url: payment.data.checkout_url,
      orderId: order.id,
    });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'initialisation du paiement." },
      { status: 500 }
    );
  }
}
