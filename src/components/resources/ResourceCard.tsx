import Link from "next/link";
import { formatPrice, getDriveImageUrl } from "@/lib/utils";

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
  priceFormatted?: string | null;
  originalPriceFormatted?: string | null;
  priceOff?: string | null;
  externalUrl?: string;
  source?: "db" | "chariow";
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
  priceFormatted,
  originalPriceFormatted,
  priceOff,
  source = "db",
}: ResourceCardProps) {
  const isFree = type === "free";

  // Tous les produits (Chariow) → /produits/slug
  const href = `/produits/${slug}`;

  // Chariow images are direct URLs, DB images may be Google Drive
  const imageUrl =
    source === "chariow"
      ? coverImage || "/placeholder.svg"
      : getDriveImageUrl(coverImage);

  const displayPrice =
    priceFormatted || (price ? formatPrice(price, currency) : null);
  const displayOriginalPrice =
    originalPriceFormatted ||
    (originalPrice ? formatPrice(originalPrice, currency) : null);

  return (
    <Link href={href} className="group block">
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden transition-shadow hover:shadow-lg">
        <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute top-3 left-3">
            {isFree ? (
              <span className="badge-free">Gratuit</span>
            ) : displayPrice ? (
              <span className="badge-paid">{displayPrice}</span>
            ) : (
              <span className="badge-paid">Payant</span>
            )}
          </div>
          {priceOff && (
            <div className="absolute top-3 right-3">
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                -{priceOff}
              </span>
            </div>
          )}
        </div>
        <div className="p-4">
          <div className="flex gap-2 mb-2">
            {category && (
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                {category}
              </span>
            )}
            {level && (
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                {level}
              </span>
            )}
          </div>
          <h3 className="font-semibold text-gray-900 group-hover:text-[#80368D] transition-colors line-clamp-2">
            {title}
          </h3>
          <p className="text-sm text-gray-500 mt-1 line-clamp-2">
            {shortDescription}
          </p>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs text-gray-400">{resourceType}</span>
            <span className="text-sm font-medium text-[#29358B] group-hover:underline">
              {isFree ? "Télécharger" : "Voir le produit"} →
            </span>
          </div>
          {!isFree && displayPrice && (
            <div className="mt-1 flex items-center gap-2">
              {displayOriginalPrice &&
                originalPrice &&
                originalPrice > (price || 0) && (
                  <span className="text-sm line-through text-gray-400">
                    {displayOriginalPrice}
                  </span>
                )}
              <span className="text-sm font-bold text-[#80368D]">
                {displayPrice}
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
