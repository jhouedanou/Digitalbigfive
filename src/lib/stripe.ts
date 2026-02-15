import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-01-28.clover",
});

export async function createCheckoutSession({
  resourceId,
  resourceTitle,
  price,
  customerEmail,
  userId,
}: {
  resourceId: string;
  resourceTitle: string;
  price: number;
  customerEmail: string;
  userId?: string;
}) {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    customer_email: customerEmail,
    line_items: [
      {
        price_data: {
          currency: "eur",
          product_data: {
            name: resourceTitle,
          },
          unit_amount: Math.round(price * 100),
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/achat/succes?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/produits/${resourceId}`,
    metadata: {
      resourceId,
      userId: userId || "",
    },
  });

  return session;
}
