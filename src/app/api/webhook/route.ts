import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyWebhookSignature } from "@/lib/moneroo";

export async function POST(request: NextRequest) {
  try {
    const payload = await request.text();
    const signature = request.headers.get("x-moneroo-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Signature manquante" },
        { status: 401 }
      );
    }

    // Verify webhook signature
    const isValid = verifyWebhookSignature(payload, signature);
    if (!isValid) {
      return NextResponse.json(
        { error: "Signature invalide" },
        { status: 401 }
      );
    }

    const event = JSON.parse(payload);
    const eventType = event.type || event.event;
    const paymentData = event.data;

    if (!paymentData?.id) {
      return NextResponse.json(
        { error: "Données de paiement manquantes" },
        { status: 400 }
      );
    }

    // Find the order by Moneroo transaction ID
    const order = await prisma.order.findFirst({
      where: { monerooTransactionId: paymentData.id },
    });

    if (!order) {
      console.warn(`Order not found for Moneroo transaction: ${paymentData.id}`);
      return NextResponse.json({ received: true });
    }

    switch (eventType) {
      case "payment.success": {
        await prisma.order.update({
          where: { id: order.id },
          data: {
            status: "paid",
            monerooPaymentId: paymentData.id,
          },
        });
        break;
      }

      case "payment.failed": {
        await prisma.order.update({
          where: { id: order.id },
          data: {
            status: "failed",
            monerooPaymentId: paymentData.id,
          },
        });
        break;
      }

      case "payment.cancelled": {
        await prisma.order.update({
          where: { id: order.id },
          data: {
            status: "cancelled",
            monerooPaymentId: paymentData.id,
          },
        });
        break;
      }

      default:
        console.log(`Unhandled Moneroo event: ${eventType}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Erreur webhook" },
      { status: 500 }
    );
  }
}
