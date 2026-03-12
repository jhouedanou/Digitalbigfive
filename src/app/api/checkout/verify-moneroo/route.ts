import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyMonerooTransaction } from "@/lib/moneroo";

export async function GET(request: NextRequest) {
  try {
    const paymentId = request.nextUrl.searchParams.get("paymentId");

    if (!paymentId) {
      return NextResponse.json(
        { error: "paymentId manquant" },
        { status: 400 }
      );
    }

    console.log("[Verify Moneroo] Vérification pour orderId:", paymentId);

    // Le paymentId dans l'URL est notre orderId (passé dans returnUrl)
    const order = await prisma.order.findUnique({
      where: { id: paymentId },
      include: {
        resource: {
          select: { id: true, title: true, coverImage: true },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ status: "not_found" });
    }

    const orderData = {
      orderId: order.id,
      productId: order.resource.id,
      productTitle: order.resource.title,
      coverImage: order.resource.coverImage,
      amount: order.amount,
      currency: order.currency,
      date: order.createdAt.toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    // Si déjà payé en DB (webhook reçu), retourner success immédiatement
    if (order.status === "paid") {
      return NextResponse.json({ status: "success", order: orderData });
    }

    if (order.status === "failed") {
      return NextResponse.json({ status: "failed", order: orderData });
    }

    // Sinon, vérifier auprès de Moneroo si on a un monerooPaymentId
    if (order.monerooPaymentId) {
      try {
        const verification = await verifyMonerooTransaction(order.monerooPaymentId);
        console.log("[Verify Moneroo] Statut Moneroo:", verification.status);

        if (verification.status === "success" && order.status !== "paid") {
          // Mettre à jour la commande
          await prisma.order.update({
            where: { id: order.id },
            data: { status: "paid" },
          });
          return NextResponse.json({ status: "success", order: orderData });
        }

        if (verification.status === "failed") {
          await prisma.order.update({
            where: { id: order.id },
            data: { status: "failed" },
          });
          return NextResponse.json({ status: "failed", order: orderData });
        }

        // pending
        return NextResponse.json({ status: "pending", order: orderData });
      } catch (monerooError) {
        console.error("[Verify Moneroo] Erreur API:", monerooError);
        return NextResponse.json({ status: "pending", order: orderData });
      }
    }

    // Pas encore de monerooPaymentId → pending
    return NextResponse.json({ status: "pending", order: orderData });
  } catch (error) {
    console.error("[Verify Moneroo] Error:", error);
    return NextResponse.json({ status: "pending" }, { status: 200 });
  }
}
