import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;

  const resource = await prisma.resource.findUnique({
    where: { id },
    include: {
      faqs: { orderBy: { sortOrder: "asc" } },
      testimonials: {
        include: { user: { select: { firstName: true, lastName: true, email: true } } },
      },
      _count: { select: { orders: true, downloads: true } },
    },
  });

  if (!resource) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }

  return NextResponse.json(resource);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await req.json();

    const updateData: Record<string, unknown> = {};
    const allowedFields = [
      "title", "shortDescription", "longDescription", "type", "category",
      "resourceType", "level", "format", "coverImage", "previewImages",
      "filePath", "fileSize", "pageCount", "estimatedTime", "status",
      "price", "originalPrice", "currency", "sku", "allowDownload", "enableWatermark",
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    if (body.title) {
      updateData.slug = slugify(body.title);
    }

    const resource = await prisma.resource.update({
      where: { id },
      data: updateData,
    });

    // Handle FAQs if provided
    if (body.faqs !== undefined && Array.isArray(body.faqs)) {
      // Delete existing FAQs
      await prisma.fAQ.deleteMany({ where: { resourceId: id } });

      // Create new FAQs
      if (body.faqs.length > 0) {
        await prisma.fAQ.createMany({
          data: body.faqs.map(
            (faq: { question: string; answer: string; sortOrder?: number }, index: number) => ({
              resourceId: id,
              question: faq.question,
              answer: faq.answer,
              sortOrder: faq.sortOrder ?? index,
            })
          ),
        });
      }
    }

    // Return resource with FAQs
    const updated = await prisma.resource.findUnique({
      where: { id },
      include: { faqs: { orderBy: { sortOrder: "asc" } } },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Resource update error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;

  await prisma.resource.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
