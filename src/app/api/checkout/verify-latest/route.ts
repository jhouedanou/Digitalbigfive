import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { status: "error", error: "Non connecté" },
        { status: 401 }
      );
    }

    // Récupérer la dernière commande de l'utilisateur
    const latestOrder = await prisma.order.findFirst({
      where: { userId: session.user.id },
      include: {
        resource: { 
          select: { 
            id: true,
            title: true,
            coverImage: true,
          } 
        },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!latestOrder) {
      return NextResponse.json({ status: "not_found" });
    }

    // Si la commande est encore pending, vérifier si elle devrait être payée
    // (simulation pour les tests - en production le webhook PayTech mettra à jour)
    let orderStatus = latestOrder.status;

    return NextResponse.json({
      status: orderStatus === "paid" ? "success" : orderStatus,
      order: {
        orderId: latestOrder.id,
        productId: latestOrder.resource.id,
        productTitle: latestOrder.resource.title,
        coverImage: latestOrder.resource.coverImage,
        amount: latestOrder.amount,
        currency: latestOrder.currency,
        date: latestOrder.createdAt.toLocaleDateString("fr-FR", {
          day: "numeric",
          month: "long",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    });
  } catch (error) {
    console.error("Verify latest error:", error);
    return NextResponse.json(
      { status: "error" },
      { status: 500 }
    );
  }
}
