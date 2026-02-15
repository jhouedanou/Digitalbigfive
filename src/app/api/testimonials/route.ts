import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Client submits a testimonial
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { resourceId, rating, text } = body;

    if (!resourceId || !rating || !text) {
      return NextResponse.json(
        { error: "Champs obligatoires manquants" },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "La note doit être entre 1 et 5" },
        { status: 400 }
      );
    }

    if (text.length > 200) {
      return NextResponse.json(
        { error: "Le témoignage ne doit pas dépasser 200 caractères" },
        { status: 400 }
      );
    }

    // Verify user purchased this product
    const order = await prisma.order.findFirst({
      where: {
        userId: session.user.id,
        resourceId,
        status: "paid",
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Vous devez avoir acheté ce produit pour laisser un avis" },
        { status: 403 }
      );
    }

    // Check for existing testimonial
    const existing = await prisma.testimonial.findUnique({
      where: {
        resourceId_userId: {
          resourceId,
          userId: session.user.id,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Vous avez déjà laissé un avis pour ce produit" },
        { status: 409 }
      );
    }

    const testimonial = await prisma.testimonial.create({
      data: {
        resourceId,
        userId: session.user.id,
        rating,
        text,
        status: "pending",
      },
    });

    return NextResponse.json(testimonial, { status: 201 });
  } catch (error) {
    console.error("Testimonial error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la soumission" },
      { status: 500 }
    );
  }
}

// Admin gets all testimonials
export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const testimonials = await prisma.testimonial.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { firstName: true, lastName: true, email: true } },
      resource: { select: { title: true } },
    },
  });

  return NextResponse.json(testimonials);
}
