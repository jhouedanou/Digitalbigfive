import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { sendOrderConfirmation } from "@/lib/email";
import { sendCAPIEvent } from "@/lib/meta-tracking";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const resourceId = session.metadata?.resourceId;
    const userId = session.metadata?.userId;

    if (resourceId && userId) {
      // Update order status
      const order = await prisma.order.findFirst({
        where: { stripeSessionId: session.id },
      });

      if (order) {
        await prisma.order.update({
          where: { id: order.id },
          data: {
            status: "paid",
            stripePaymentId: session.payment_intent as string,
          },
        });
      }

      // Get user and resource for email
      const user = await prisma.user.findUnique({ where: { id: userId } });
      const resource = await prisma.resource.findUnique({
        where: { id: resourceId },
      });

      if (user && resource) {
        // Send confirmation email
        try {
          await sendOrderConfirmation({
            to: user.email,
            firstName: user.firstName,
            resourceTitle: resource.title,
            amount: resource.price || 0,
            currency: resource.currency,
            dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
          });
        } catch (emailError) {
          console.error("Order confirmation email error:", emailError);
        }

        // Send CAPI Purchase event
        const eventId = crypto.randomUUID();
        await sendCAPIEvent({
          eventName: "Purchase",
          eventId,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          sourceUrl: `${process.env.NEXT_PUBLIC_APP_URL}/produits/${resource.slug}`,
          customData: {
            value: resource.price,
            currency: resource.currency.toUpperCase(),
            content_ids: [resource.sku || resource.id],
            content_type: "product",
          },
        });
      }
    }
  }

  return NextResponse.json({ received: true });
}
