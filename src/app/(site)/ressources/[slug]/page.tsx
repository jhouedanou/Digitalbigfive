import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import DownloadForm from "@/components/resources/DownloadForm";
import { FileText, Clock, BarChart3, Calendar } from "lucide-react";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function FreeResourcePage({ params }: PageProps) {
  const { slug } = await params;

  const resource = await prisma.resource.findUnique({
    where: { slug, type: "free", status: "published" },
  });

  if (!resource) notFound();

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

        {/* Right: Download form (sticky) */}
        <div className="lg:col-span-2">
          <div className="sticky top-24">
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold mb-4">
                Télécharger cette ressource
              </h2>
              <p className="text-sm text-gray-500 mb-6">
                Remplissez le formulaire pour recevoir la ressource par email.
              </p>
              <DownloadForm resourceId={resource.id} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
