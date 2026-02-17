import { NextRequest, NextResponse } from "next/server";
import { authFromRequest } from "@/lib/auth-bearer";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/profile/books
 * 
 * Retourne les livres achetés par l'utilisateur connecté.
 * Supporte cookies (web) et Bearer token (Electron).
 */
export async function GET(req: NextRequest) {
  const session = await authFromRequest(req);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const orders = await prisma.order.findMany({
    where: { userId: session.user.id, status: "paid" },
    include: {
      resource: {
        select: {
          id: true,
          title: true,
          coverImage: true,
          shortDescription: true,
          category: true,
          pageCount: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const books = orders.map((order) => ({
    id: order.resource.id,
    title: order.resource.title,
    coverImage: order.resource.coverImage,
    shortDescription: order.resource.shortDescription,
    category: order.resource.category,
    pageCount: order.resource.pageCount,
    purchasedAt: order.createdAt.toISOString(),
  }));

  return NextResponse.json({ books });
}
