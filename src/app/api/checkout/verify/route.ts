import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPayment } from "@/lib/paytech";

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { error: "token manquant" },
        { status: 400 }
      );
    }

    // Chercher la commande en DB par token (mise à jour par le webhook IPN)
    const order = await prisma.order.findFirst({
      where: { paytechToken: token },
      include: {
        resource: {
          select: { id: true, title: true, coverImage: true },
        },
      },
    });

    // Si la commande est déjà payée en DB (webhook IPN reçu), retourner success
    if (order?.status === "paid") {
      return NextResponse.json({
        status: "success",
        order: {
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
        },
      });
    }

    // Sinon, vérifier en temps réel auprès de PayTech
    const payment = await verifyPayment(token);
    const isSuccess = payment.success === 1;
    const paymentStatus = isSuccess ? "success" : "pending";

    if (order && isSuccess && order.status !== "paid") {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: "paid",
          paytechPaymentRef: token,
        },
      });
    }

    const orderData = order
      ? {
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
        }
      : null;

    return NextResponse.json({ status: paymentStatus, order: orderData });
  } catch (error) {
    console.error("Payment verify error:", error);
    return NextResponse.json(
      { status: "pending" },
      { status: 200 }
    );
  }
}
