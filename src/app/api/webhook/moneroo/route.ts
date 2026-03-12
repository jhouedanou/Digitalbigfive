import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyMonerooWebhookSignature, verifyMonerooTransaction } from "@/lib/moneroo";
import { sendOrderConfirmation, sendAdminNewOrderNotification, sendProductAccessEmail } from "@/lib/email";
import { sendCAPIEvent } from "@/lib/meta-tracking";

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-moneroo-signature") || "";

    // Vérifier la signature du webhook
    if (!verifyMonerooWebhookSignature(rawBody, signature)) {
      console.error("[Moneroo Webhook] Signature invalide");
      return NextResponse.json({ error: "Signature invalide" }, { status: 403 });
    }

    const body = JSON.parse(rawBody);
    const { event, data } = body;

    console.log("[Moneroo Webhook] Event:", event, "Payment ID:", data?.id);

    if (!event || !data?.id) {
      return NextResponse.json(
        { error: "Données de notification manquantes" },
        { status: 400 }
      );
    }

    // Trouver la commande par monerooPaymentId
    const order = await prisma.order.findFirst({
      where: { monerooPaymentId: data.id },
    });

    if (!order) {
      console.warn(`[Moneroo Webhook] Order not found for payment ID: ${data.id}`);
      // Répondre 200 pour que Moneroo ne retente pas
      return NextResponse.json({ received: true });
    }

    // Toujours re-vérifier le statut via l'API (bonne pratique Moneroo)
    let verifiedStatus: string;
    try {
      const verification = await verifyMonerooTransaction(data.id);
      verifiedStatus = verification.status;
      console.log("[Moneroo Webhook] Verified status:", verifiedStatus);
    } catch (err) {
      console.error("[Moneroo Webhook] Verification failed, using webhook data:", err);
      verifiedStatus = data.status;
    }

    switch (event) {
      case "payment.success": {
        if (verifiedStatus !== "success") {
          console.warn(`[Moneroo Webhook] Webhook says success but verify says: ${verifiedStatus}`);
          return NextResponse.json({ received: true });
        }

        // Éviter les doubles traitements
        if (order.status === "paid") {
          console.log("[Moneroo Webhook] Order already paid, skipping:", order.id);
          return NextResponse.json({ received: true });
        }

        const updatedOrder = await prisma.order.update({
          where: { id: order.id },
          data: {
            status: "paid",
            monerooPaymentId: data.id,
          },
          include: {
            user: true,
            resource: true,
          },
        });

        // Envoyer emails et CAPI après la réponse HTTP
        after(async () => {
          // CAPI : Purchase
          try {
            const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
                       request.headers.get("x-real-ip") || undefined;
            const userAgent = request.headers.get("user-agent") || undefined;
            await sendCAPIEvent({
              eventName: "Purchase",
              eventId: `purchase_${updatedOrder.id}`,
              email: updatedOrder.user.email,
              firstName: updatedOrder.user.firstName || undefined,
              lastName: updatedOrder.user.lastName || undefined,
              ip,
              userAgent,
              sourceUrl: `${process.env.NEXT_PUBLIC_APP_URL}/achat/succes`,
              customData: {
                value: updatedOrder.amount,
                currency: updatedOrder.currency || "XOF",
                content_ids: [updatedOrder.resource.slug],
                content_type: "product",
                order_id: updatedOrder.id,
              },
            });
            console.log("[Moneroo Webhook] ✅ CAPI Purchase envoyé pour commande", updatedOrder.id);
          } catch (err: any) {
            console.error("[Moneroo Webhook] ❌ CAPI Purchase échoué:", err?.message || err);
          }

          try {
            await sendOrderConfirmation({
              to: updatedOrder.user.email,
              firstName: updatedOrder.user.firstName,
              resourceTitle: updatedOrder.resource.title,
              amount: updatedOrder.amount,
              currency: updatedOrder.currency,
              orderId: updatedOrder.id,
              dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/produits`,
            });
            console.log("[Moneroo Webhook] ✅ Email confirmation envoyé à", updatedOrder.user.email);
          } catch (err: any) {
            console.error("[Moneroo Webhook] ❌ Échec email confirmation:", err?.message || err);
          }

          try {
            await sendProductAccessEmail({
              to: updatedOrder.user.email,
              firstName: updatedOrder.user.firstName,
              resourceTitle: updatedOrder.resource.title,
              dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/produits`,
            });
            console.log("[Moneroo Webhook] ✅ Email accès produit envoyé");
          } catch (err: any) {
            console.error("[Moneroo Webhook] ❌ Échec email accès:", err?.message || err);
          }

          try {
            await sendAdminNewOrderNotification({
              customerName: `${updatedOrder.user.firstName} ${updatedOrder.user.lastName}`,
              customerEmail: updatedOrder.user.email,
              resourceTitle: updatedOrder.resource.title,
              amount: updatedOrder.amount,
              currency: updatedOrder.currency,
              orderId: updatedOrder.id,
            });
            console.log("[Moneroo Webhook] ✅ Notification admin envoyée");
          } catch (err: any) {
            console.error("[Moneroo Webhook] ❌ Échec notif admin:", err?.message || err);
          }
        });

        break;
      }

      case "payment.failed": {
        if (order.status !== "paid") {
          await prisma.order.update({
            where: { id: order.id },
            data: { status: "failed" },
          });
        }
        break;
      }

      default:
        console.log(`[Moneroo Webhook] Unhandled event: ${event}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[Moneroo Webhook] Error:", error);
    return NextResponse.json(
      { error: "Erreur webhook" },
      { status: 500 }
    );
  }
}
