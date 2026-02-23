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

    console.log("[Verify] Vérification pour token:", token);

    // Chercher la commande en DB — d'abord par paytechToken, sinon par ID (ref_command)
    let order = await prisma.order.findFirst({
      where: { paytechToken: token },
      include: {
        resource: {
          select: { id: true, title: true, coverImage: true },
        },
      },
    });

    // Fallback: le token est peut-être l'ID de commande (ref_command)
    if (!order) {
      order = await prisma.order.findFirst({
        where: { id: token },
        include: {
          resource: {
            select: { id: true, title: true, coverImage: true },
          },
        },
      });
    }

    console.log("[Verify] Commande trouvée:", order?.id, "statut:", order?.status);

    // Si la commande est déjà payée en DB (webhook IPN reçu), retourner success immédiatement
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

    // Sinon, interroger PayTech en temps réel pour avoir le statut
    try {
      const payment = await verifyPayment(token);
      console.log("[Verify] Réponse PayTech:", JSON.stringify(payment));
      const isSuccess = payment.success === 1;

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

      return NextResponse.json({
        status: isSuccess ? "success" : "pending",
        order: orderData,
      });
    } catch (paytechError) {
      console.error("[Verify] Erreur API PayTech:", paytechError);
      // Si l'API PayTech échoue, retourner pending (le webhook IPN mettra à jour plus tard)
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
      return NextResponse.json({ status: "pending", order: orderData });
    }
  } catch (error) {
    console.error("Payment verify error:", error);
    return NextResponse.json(
      { status: "pending" },
      { status: 200 }
    );
  }
}
