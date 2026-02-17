import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import ResourceCard from "@/components/resources/ResourceCard";
import FilterBar from "@/components/resources/FilterBar";
import DownloadAppButton from "@/components/pwa/DownloadAppButton";

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

  const resources = await prisma.resource.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

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

      {/* Download App Section */}
      <div className="mb-10">
        <DownloadAppButton variant="full" />
      </div>

      {/* Filters */}
      <div className="mb-8">
        <Suspense fallback={<div className="h-10" />}>
          <FilterBar />
        </Suspense>
      </div>

      {/* Results count */}
      <div className="mb-6 text-sm text-gray-500">
        {resources.length} résultat{resources.length !== 1 ? "s" : ""}
      </div>

      {/* Resource Grid */}
      {resources.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {resources.map((resource) => (
            <ResourceCard
              key={resource.id}
              id={resource.id}
              slug={resource.slug}
              title={resource.title}
              shortDescription={resource.shortDescription}
              coverImage={resource.coverImage}
              type={resource.type}
              category={resource.category}
              level={resource.level}
              resourceType={resource.resourceType}
              price={resource.price}
              originalPrice={resource.originalPrice}
              currency={resource.currency}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-gray-500 text-lg">
            Aucune ressource ne correspond à vos critères.
          </p>
          <p className="text-gray-400 mt-2">
            Essayez de modifier vos filtres pour voir plus de résultats.
          </p>
        </div>
      )}
    </div>
  );
}
