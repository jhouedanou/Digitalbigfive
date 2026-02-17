import { prisma } from "@/lib/prisma";

export async function getRecommendedProducts(
  currentCategory?: string,
  excludeId?: string,
  limit: number = 3
) {
  const where: Record<string, unknown> = {
    type: "paid",
    status: "published",
  };

  if (excludeId) {
    where.id = { not: excludeId };
  }

  // Prioritize same category, then get others
  let products = await prisma.resource.findMany({
    where: currentCategory ? { ...where, category: currentCategory } : where,
    select: {
      id: true,
      slug: true,
      title: true,
      shortDescription: true,
      coverImage: true,
      price: true,
      originalPrice: true,
      currency: true,
      category: true,
      level: true,
      resourceType: true,
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  // If not enough products from same category, get more from other categories
  if (products.length < limit && currentCategory) {
    const moreProducts = await prisma.resource.findMany({
      where: {
        ...where,
        category: { not: currentCategory },
        id: { notIn: products.map((p) => p.id) },
      },
      select: {
        id: true,
        slug: true,
        title: true,
        shortDescription: true,
        coverImage: true,
        price: true,
        originalPrice: true,
        currency: true,
        category: true,
        level: true,
        resourceType: true,
      },
      orderBy: { createdAt: "desc" },
      take: limit - products.length,
    });
    products = [...products, ...moreProducts];
  }

  return products;
}
