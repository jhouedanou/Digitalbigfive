import { Suspense } from "react";
import { getAllChariowResources } from "@/lib/chariow";
import FilterBar from "@/components/resources/FilterBar";
import ResourceGrid from "@/components/resources/ResourceGrid";
import DownloadAppButton from "@/components/pwa/DownloadAppButton";

const PAGE_SIZE = 6;

interface PageProps {
  searchParams: Promise<{
    access?: string;
    category?: string;
    resourceType?: string;
  }>;
}

export default async function LibraryPage({ searchParams }: PageProps) {
  const params = await searchParams;

  let resources = await fetchChariowResources();

  // Filtres
  if (params.access === "free") {
    resources = resources.filter((r) => r.type === "free");
  } else if (params.access === "paid") {
    resources = resources.filter((r) => r.type === "paid");
  }
  if (params.category) {
    resources = resources.filter((r) => r.category === params.category);
  }
  if (params.resourceType) {
    resources = resources.filter((r) => r.resourceType === params.resourceType);
  }

  const total = resources.length;

  // Build filter query string
  const filterParts: string[] = [];
  if (params.access)
    filterParts.push(`access=${encodeURIComponent(params.access)}`);
  if (params.category)
    filterParts.push(`category=${encodeURIComponent(params.category)}`);
  if (params.resourceType)
    filterParts.push(
      `resourceType=${encodeURIComponent(params.resourceType)}`
    );
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

      {/* Resource Grid */}
      <ResourceGrid
        initialResources={resources.slice(0, PAGE_SIZE)}
        total={total}
        initialHasMore={resources.length > PAGE_SIZE}
        filterParams={filterParams}
      />

      {/* Download App Section */}
      <div className="mt-16 mb-4">
        <DownloadAppButton variant="full" />
      </div>
    </div>
  );
}

async function fetchChariowResources() {
  try {
    return await getAllChariowResources();
  } catch (error) {
    console.error("Failed to fetch Chariow products:", error);
    return [];
  }
}
