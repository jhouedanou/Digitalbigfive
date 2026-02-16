import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPayment } from "@/lib/moneroo";

export async function GET(request: NextRequest) {
  try {
    const paymentId = request.nextUrl.searchParams.get("paymentId");

    if (!paymentId) {
      return NextResponse.json(
        { error: "paymentId manquant" },
        { status: 400 }
      );
    }

    // Verify payment with Moneroo
    const payment = await verifyPayment(paymentId);
    const paymentStatus = payment.data.status;

    // Update order if found
    const order = await prisma.order.findFirst({
      where: { monerooTransactionId: paymentId },
    });

    if (order && paymentStatus === "success" && order.status !== "paid") {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: "paid",
          monerooPaymentId: paymentId,
        },
      });
    }

    return NextResponse.json({ status: paymentStatus });
  } catch (error) {
    console.error("Payment verify error:", error);
    return NextResponse.json(
      { status: "pending" },
      { status: 200 }
    );
  }
}
