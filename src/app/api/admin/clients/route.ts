import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const clients = await prisma.user.findMany({
    where: { role: "client" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      organization: true,
      createdAt: true,
      _count: { select: { orders: { where: { status: "paid" } } } },
      orders: {
        where: { status: "paid" },
        select: { amount: true },
      },
    },
  });

  return NextResponse.json(
    clients.map((c) => ({
      id: c.id,
      firstName: c.firstName,
      lastName: c.lastName,
      email: c.email,
      organization: c.organization,
      createdAt: c.createdAt,
      orderCount: c._count.orders,
      totalSpent: c.orders.reduce((sum, o) => sum + o.amount, 0),
    }))
  );
}
