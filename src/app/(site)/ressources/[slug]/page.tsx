import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import DirectDownloadButton from "@/components/resources/DirectDownloadButton";
import ProductRecommendations from "@/components/upsell/ProductRecommendations";
import { FileText, Clock, BarChart3, Calendar, CheckCircle } from "lucide-react";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function FreeResourcePage({ params }: PageProps) {
  const { slug } = await params;

  const resource = await prisma.resource.findUnique({
    where: { slug, type: "free", status: "published" },
  });

  if (!resource) notFound();

  // Fetch recommended paid products (inline query to avoid client/server boundary issues)
  const selectFields = {
    id: true, slug: true, title: true, shortDescription: true,
    coverImage: true, price: true, originalPrice: true, currency: true,
    category: true, level: true, resourceType: true,
  };
  let recommendedProducts = await prisma.resource.findMany({
    where: { type: "paid", status: "published", category: resource.category, id: { not: resource.id } },
    select: selectFields,
    orderBy: { createdAt: "desc" },
    take: 2,
  });
  if (recommendedProducts.length < 2) {
    const more = await prisma.resource.findMany({
      where: { type: "paid", status: "published", category: { not: resource.category }, id: { notIn: [resource.id, ...recommendedProducts.map(p => p.id)] } },
      select: selectFields,
      orderBy: { createdAt: "desc" },
      take: 2 - recommendedProducts.length,
    });
    recommendedProducts = [...recommendedProducts, ...more];
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
        {/* Left: Content */}
        <div className="lg:col-span-3">
          <div className="mb-4 flex gap-2">
            <span className="badge-free">Gratuit</span>
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
              {resource.category}
            </span>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {resource.title}
          </h1>

          <p className="text-gray-600 mb-6">{resource.shortDescription}</p>

          {/* Metadata */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <FileText size={16} />
              <span>{resource.resourceType}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <BarChart3 size={16} />
              <span>{resource.level}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Clock size={16} />
              <span>{resource.estimatedTime || resource.format}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Calendar size={16} />
              <span>{formatDate(resource.updatedAt)}</span>
            </div>
          </div>

          {/* Cover image / Preview */}
          <div className="mb-8 rounded-xl overflow-hidden border border-gray-200">
            <img
              src={resource.coverImage || "/placeholder.svg"}
              alt={resource.title}
              className="w-full object-cover"
            />
          </div>

          {/* Long description */}
          <div className="prose prose-gray max-w-none">
            <h2 className="text-xl font-semibold mb-4">Description</h2>
            <div
              dangerouslySetInnerHTML={{ __html: resource.longDescription }}
            />
          </div>
        </div>

        {/* Right: Download button (sticky) */}
        <div className="lg:col-span-2">
          <div className="sticky top-24">
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  Ressource gratuite
                </h2>
                <p className="text-sm text-gray-500">
                  Remplissez le formulaire pour télécharger
                </p>
              </div>

              <DirectDownloadButton 
                resourceId={resource.id} 
                resourceTitle={resource.title}
                resourceCategory={resource.category}
              />

              {/* Features */}
              <div className="mt-6 space-y-3">
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span>Téléchargement instantané</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span>Format PDF haute qualité</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span>Accès rapide et gratuit</span>
                </div>
              </div>

              {/* File info */}
              {(resource.fileSize || resource.pageCount) && (
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <div className="flex justify-between text-sm">
                    {resource.fileSize && (
                      <span className="text-gray-500">Taille : {resource.fileSize}</span>
                    )}
                    {resource.pageCount && (
                      <span className="text-gray-500">{resource.pageCount} pages</span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Upsell - Compact variant in sidebar */}
            {recommendedProducts.length > 0 && (
              <div className="mt-6">
                <ProductRecommendations
                  products={recommendedProducts}
                  variant="compact"
                  maxProducts={2}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
