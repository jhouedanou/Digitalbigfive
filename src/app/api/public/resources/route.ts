import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const PAGE_SIZE = 6;

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  const skip = parseInt(searchParams.get("skip") || "0", 10);
  const take = parseInt(searchParams.get("take") || String(PAGE_SIZE), 10);

  const where: Record<string, unknown> = { status: "published" };

  const access = searchParams.get("access");
  if (access === "free") where.type = "free";
  if (access === "paid") where.type = "paid";

  const category = searchParams.get("category");
  if (category) where.category = category;

  const resourceType = searchParams.get("resourceType");
  if (resourceType) where.resourceType = resourceType;

  const level = searchParams.get("level");
  if (level) where.level = level;

  const format = searchParams.get("format");
  if (format) where.format = format;

  const [resources, total] = await Promise.all([
    prisma.resource.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: Math.min(take, 50),
      select: {
        id: true,
        slug: true,
        title: true,
        shortDescription: true,
        coverImage: true,
        type: true,
        category: true,
        level: true,
        resourceType: true,
        price: true,
        originalPrice: true,
        currency: true,
      },
    }),
    prisma.resource.count({ where }),
  ]);

  return NextResponse.json({
    resources,
    total,
    hasMore: skip + resources.length < total,
  });
}
