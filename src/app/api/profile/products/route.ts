import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const orders = await prisma.order.findMany({
    where: { userId: session.user.id, status: "paid" },
    include: {
      resource: { select: { id: true, title: true } },
    },
  });

  const testimonials = await prisma.testimonial.findMany({
    where: { userId: session.user.id },
    select: { resourceId: true },
  });

  const reviewedIds = new Set(testimonials.map((t) => t.resourceId));

  const products = orders.map((o) => ({
    id: o.resource.id,
    title: o.resource.title,
    hasTestimonial: reviewedIds.has(o.resource.id),
  }));

  return NextResponse.json(products);
}
