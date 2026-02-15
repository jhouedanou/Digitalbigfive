import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createCheckoutSession } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { slug } = body;

    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ requiresAuth: true });
    }

    const resource = await prisma.resource.findUnique({
      where: { slug, type: "paid", status: "published" },
    });

    if (!resource || !resource.price) {
      return NextResponse.json(
        { error: "Produit introuvable" },
        { status: 404 }
      );
    }

    // Check if already purchased
    const existingOrder = await prisma.order.findFirst({
      where: {
        userId: session.user.id,
        resourceId: resource.id,
        status: "paid",
      },
    });

    if (existingOrder) {
      return NextResponse.json({
        url: "/dashboard/produits",
        alreadyPurchased: true,
      });
    }

    const checkoutSession = await createCheckoutSession({
      resourceId: resource.id,
      resourceTitle: resource.title,
      price: resource.price,
      customerEmail: session.user.email,
      userId: session.user.id,
    });

    // Create pending order
    await prisma.order.create({
      data: {
        userId: session.user.id,
        resourceId: resource.id,
        amount: resource.price,
        currency: resource.currency,
        stripeSessionId: checkoutSession.id,
        status: "pending",
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création du paiement" },
      { status: 500 }
    );
  }
}
