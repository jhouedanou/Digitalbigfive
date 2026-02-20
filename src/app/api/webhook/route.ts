import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyIpnSignature, verifyIpnSha256 } from "@/lib/paytech";
import { sendOrderConfirmation, sendAdminNewOrderNotification, sendProductAccessEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      type_event,
      ref_command,
      item_price,
      token,
      api_key_sha256,
      api_secret_sha256,
      hmac_compute,
    } = body;

    if (!type_event || !ref_command) {
      return NextResponse.json(
        { error: "Données de notification manquantes" },
        { status: 400 }
      );
    }

    // Verify IPN authenticity using HMAC (preferred) or SHA256 fallback
    let isValid = false;

    if (hmac_compute) {
      isValid = verifyIpnSignature(item_price, ref_command, hmac_compute);
    }

    if (!isValid && api_key_sha256 && api_secret_sha256) {
      isValid = verifyIpnSha256(api_key_sha256, api_secret_sha256);
    }

    if (!isValid) {
      console.error("[PayTech IPN] Signature invalide pour ref_command:", ref_command);
      return NextResponse.json(
        { error: "Signature invalide" },
        { status: 401 }
      );
    }

    // Find the order by ref_command (which is the order ID)
    const order = await prisma.order.findUnique({
      where: { id: ref_command },
    });

    if (!order) {
      console.warn(`Order not found for PayTech ref_command: ${ref_command}`);
      return NextResponse.json({ received: true });
    }

    switch (type_event) {
      case "sale_complete": {
        const updatedOrder = await prisma.order.update({
          where: { id: order.id },
          data: {
            status: "paid",
            paytechPaymentRef: token || ref_command,
          },
          include: {
            user: true,
            resource: true,
          },
        });

        // Utiliser after() pour que les emails soient envoyés APRÈS la réponse HTTP
        // sans être tués par l'arrêt de la fonction serverless Vercel
        after(async () => {
          try {
            // Email confirmation client
            await sendOrderConfirmation({
              to: updatedOrder.user.email,
              firstName: updatedOrder.user.firstName,
              resourceTitle: updatedOrder.resource.title,
              amount: updatedOrder.amount,
              currency: updatedOrder.currency,
              orderId: updatedOrder.id,
              dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/produits`,
            });
            console.log("[Webhook] ✅ Email confirmation achat envoyé à", updatedOrder.user.email);
          } catch (err: any) {
            console.error("[Webhook] ❌ Échec confirmation achat:", err?.message || err);
          }

          try {
            // Email accès produit
            await sendProductAccessEmail({
              to: updatedOrder.user.email,
              firstName: updatedOrder.user.firstName,
              resourceTitle: updatedOrder.resource.title,
              dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/produits`,
            });
            console.log("[Webhook] ✅ Email accès produit envoyé à", updatedOrder.user.email);
          } catch (err: any) {
            console.error("[Webhook] ❌ Échec accès produit:", err?.message || err);
          }

          try {
            // Notification admin
            await sendAdminNewOrderNotification({
              customerName: `${updatedOrder.user.firstName} ${updatedOrder.user.lastName}`,
              customerEmail: updatedOrder.user.email,
              resourceTitle: updatedOrder.resource.title,
              amount: updatedOrder.amount,
              currency: updatedOrder.currency,
              orderId: updatedOrder.id,
            });
            console.log("[Webhook] ✅ Notification admin envoyée");
          } catch (err: any) {
            console.error("[Webhook] ❌ Échec notif admin:", err?.message || err);
          }
        });

        break;
      }

      case "sale_canceled": {
        await prisma.order.update({
          where: { id: order.id },
          data: {
            status: "cancelled",
            paytechPaymentRef: token || ref_command,
          },
        });
        break;
      }

      default:
        console.log(`Unhandled PayTech event: ${type_event}`);
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
