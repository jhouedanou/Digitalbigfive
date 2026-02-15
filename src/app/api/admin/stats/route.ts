import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalRevenue,
    monthlyOrders,
    totalOrders,
    totalContacts,
    topProducts,
    topResources,
    pendingTestimonials,
  ] = await Promise.all([
    // Total revenue
    prisma.order.aggregate({
      where: { status: "paid" },
      _sum: { amount: true },
    }),
    // Monthly orders
    prisma.order.count({
      where: { status: "paid", createdAt: { gte: startOfMonth } },
    }),
    // Total orders
    prisma.order.count({ where: { status: "paid" } }),
    // Total contacts
    prisma.contact.count(),
    // Top 5 products by sales
    prisma.resource.findMany({
      where: { type: "paid" },
      include: { _count: { select: { orders: { where: { status: "paid" } } } } },
      orderBy: { orders: { _count: "desc" } },
      take: 5,
    }),
    // Top 5 free resources by downloads
    prisma.resource.findMany({
      where: { type: "free" },
      include: { _count: { select: { downloads: true } } },
      orderBy: { downloads: { _count: "desc" } },
      take: 5,
    }),
    // Pending testimonials count
    prisma.testimonial.count({ where: { status: "pending" } }),
  ]);

  return NextResponse.json({
    totalRevenue: totalRevenue._sum.amount || 0,
    monthlyOrders,
    totalOrders,
    totalContacts,
    pendingTestimonials,
    topProducts: topProducts.map((p) => ({
      id: p.id,
      title: p.title,
      sales: p._count.orders,
    })),
    topResources: topResources.map((r) => ({
      id: r.id,
      title: r.title,
      downloads: r._count.downloads,
    })),
  });
}
