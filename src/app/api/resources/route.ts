import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const status = searchParams.get("status");

  const where: Record<string, string> = {};
  if (type) where.type = type;
  if (status) where.status = status;

  const resources = await prisma.resource.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { orders: true, downloads: true, testimonials: true },
      },
    },
  });

  return NextResponse.json(resources);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const slug = slugify(body.title);

    // Check slug uniqueness
    const existing = await prisma.resource.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json(
        { error: "Une ressource avec ce titre existe déjà" },
        { status: 409 }
      );
    }

    const resource = await prisma.resource.create({
      data: {
        title: body.title,
        slug,
        shortDescription: body.shortDescription,
        longDescription: body.longDescription,
        type: body.type,
        category: body.category,
        resourceType: body.resourceType,
        level: body.level,
        format: body.format,
        coverImage: body.coverImage || "",
        previewImages: body.previewImages || null,
        filePath: body.filePath || "",
        fileSize: body.fileSize || null,
        pageCount: body.pageCount || null,
        estimatedTime: body.estimatedTime || null,
        status: body.status || "draft",
        price: body.price || null,
        originalPrice: body.originalPrice || null,
        currency: body.currency || "EUR",
        sku: body.sku || null,
        allowDownload: body.allowDownload || false,
        enableWatermark: body.enableWatermark ?? true,
      },
    });

    // Create FAQs if provided
    if (body.faqs && Array.isArray(body.faqs) && body.faqs.length > 0) {
      await prisma.fAQ.createMany({
        data: body.faqs.map(
          (faq: { question: string; answer: string; sortOrder?: number }, index: number) => ({
            resourceId: resource.id,
            question: faq.question,
            answer: faq.answer,
            sortOrder: faq.sortOrder ?? index,
          })
        ),
      });
    }

    // Return resource with FAQs
    const result = await prisma.resource.findUnique({
      where: { id: resource.id },
      include: { faqs: { orderBy: { sortOrder: "asc" } } },
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Resource creation error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création" },
      { status: 500 }
    );
  }
}
