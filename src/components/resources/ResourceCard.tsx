import Link from "next/link";
import { formatPrice } from "@/lib/utils";

interface ResourceCardProps {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  coverImage: string;
  type: string;
  category: string;
  level: string;
  resourceType: string;
  price?: number | null;
  originalPrice?: number | null;
  currency?: string;
}

export default function ResourceCard({
  slug,
  title,
  shortDescription,
  coverImage,
  type,
  category,
  level,
  resourceType,
  price,
  originalPrice,
  currency = "XOF",
}: ResourceCardProps) {
  const isFree = type === "free";
  const href = isFree ? `/ressources/${slug}` : `/produits/${slug}`;

  return (
    <Link href={href} className="group block">
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden transition-shadow hover:shadow-lg">
        <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
          <img
            src={coverImage || "/placeholder.svg"}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute top-3 left-3">
            {isFree ? (
              <span className="badge-free">Gratuit</span>
            ) : (
              <span className="badge-paid">
                {formatPrice(price || 0, currency)}
              </span>
            )}
          </div>
        </div>
        <div className="p-4">
          <div className="flex gap-2 mb-2">
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
              {category}
            </span>
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
              {level}
            </span>
          </div>
          <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
            {title}
          </h3>
          <p className="text-sm text-gray-500 mt-1 line-clamp-2">
            {shortDescription}
          </p>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs text-gray-400">{resourceType}</span>
            <span className="text-sm font-medium text-blue-600 group-hover:underline">
              {isFree ? "Télécharger" : "Voir le produit"} →
            </span>
          </div>
          {!isFree && originalPrice && originalPrice > (price || 0) && (
            <div className="mt-1 flex items-center gap-2">
              <span className="text-sm line-through text-gray-400">
                {formatPrice(originalPrice, currency)}
              </span>
              <span className="text-sm font-bold text-green-600">
                {formatPrice(price || 0, currency)}
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
