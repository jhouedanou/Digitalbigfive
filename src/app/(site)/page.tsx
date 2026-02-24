import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import FilterBar from "@/components/resources/FilterBar";
import ResourceGrid from "@/components/resources/ResourceGrid";
import DownloadAppButton from "@/components/pwa/DownloadAppButton";

const PAGE_SIZE = 6;

interface PageProps {
  searchParams: Promise<{
    access?: string;
    category?: string;
    resourceType?: string;
    level?: string;
    format?: string;
  }>;
}

export default async function LibraryPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const where: Record<string, unknown> = { status: "published" };

  if (params.access === "free") where.type = "free";
  if (params.access === "paid") where.type = "paid";
  if (params.category) where.category = params.category;
  if (params.resourceType) where.resourceType = params.resourceType;
  if (params.level) where.level = params.level;
  if (params.format) where.format = params.format;

  const [resources, total] = await Promise.all([
    prisma.resource.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
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

  // Build filter query string for client-side "load more" requests
  const filterParts: string[] = [];
  if (params.access) filterParts.push(`access=${encodeURIComponent(params.access)}`);
  if (params.category) filterParts.push(`category=${encodeURIComponent(params.category)}`);
  if (params.resourceType) filterParts.push(`resourceType=${encodeURIComponent(params.resourceType)}`);
  if (params.level) filterParts.push(`level=${encodeURIComponent(params.level)}`);
  if (params.format) filterParts.push(`format=${encodeURIComponent(params.format)}`);
  const filterParams = filterParts.join("&");

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero / Introduction */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-black text-[#29358B] mb-4">
          Ressources & Produits Digitaux
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Découvrez nos ressources gratuites pour booster votre marketing et nos
          produits premium pour passer au niveau supérieur.
        </p>
      </div>

      {/* Filters */}
      <div className="mb-8">
        <Suspense fallback={<div className="h-10" />}>
          <FilterBar />
        </Suspense>
      </div>

      {/* Resource Grid with Load More */}
      <ResourceGrid
        initialResources={resources}
        total={total}
        initialHasMore={resources.length < total}
        filterParams={filterParams}
      />

      {/* Download App Section — before footer */}
      <div className="mt-16 mb-4">
        <DownloadAppButton variant="full" />
      </div>
    </div>
  );
}
