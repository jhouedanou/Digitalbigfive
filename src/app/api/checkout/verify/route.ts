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

    // Verify payment status with PayTech
    const payment = await verifyPayment(token);

    // Determine status from PayTech response
    const isSuccess = payment.success === 1;
    const paymentStatus = isSuccess ? "success" : "pending";

    // Update order if found
    const order = await prisma.order.findFirst({
      where: { paytechToken: token },
    });

    if (order && isSuccess && order.status !== "paid") {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: "paid",
          paytechPaymentRef: token,
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
