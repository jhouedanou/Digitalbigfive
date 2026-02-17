import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import ProductsClientWrapper from "./ProductsClientWrapper";

export default async function MyProductsPage() {
  const session = await auth();
  if (!session?.user) return null;

  const orders = await prisma.order.findMany({
    where: { userId: session.user.id, status: "paid" },
    include: { resource: true },
    orderBy: { createdAt: "desc" },
  });

  const productsData = orders.map((order) => ({
    id: order.id,
    resourceId: order.resource.id,
    title: order.resource.title,
    coverImage: order.resource.coverImage,
    category: order.resource.category,
    pageCount: order.resource.pageCount,
    purchaseDate: order.createdAt.toISOString(),
  }));

  return <ProductsClientWrapper products={productsData} />;
}
