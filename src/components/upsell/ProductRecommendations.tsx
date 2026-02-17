"use client";

import Link from "next/link";
import { Sparkles, ArrowRight, Star, BookOpen, TrendingUp } from "lucide-react";

interface RecommendedProduct {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  coverImage: string | null;
  price: number | null;
  originalPrice?: number | null;
  currency: string;
  category: string;
  level: string;
  resourceType: string;
}

interface ProductRecommendationsProps {
  products: RecommendedProduct[];
  currentResourceCategory?: string;
  title?: string;
  subtitle?: string;
  variant?: "compact" | "full" | "horizontal";
  maxProducts?: number;
}

export default function ProductRecommendations({
  products,
  title = "Allez plus loin avec nos formations premium",
  subtitle = "Ces ressources payantes vous permettront de maîtriser complètement le sujet",
  variant = "full",
  maxProducts = 3,
}: ProductRecommendationsProps) {
  const displayedProducts = products.slice(0, maxProducts);

  if (displayedProducts.length === 0) {
    return null;
  }

  const formatPrice = (price: number, currency: string = "XOF") => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const calculateDiscount = (price: number, originalPrice: number) => {
    return Math.round(((originalPrice - price) / originalPrice) * 100);
  };

  if (variant === "compact") {
    return (
      <div className="bg-gradient-to-br from-[#80368D]/5 via-white to-[#29358B]/5 rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-gradient-to-br from-[#80368D] to-[#29358B] rounded-lg flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <h3 className="font-semibold text-gray-900">Formations recommandées</h3>
        </div>

        <div className="space-y-3">
          {displayedProducts.map((product) => (
            <Link
              key={product.id}
              href={`/produits/${product.slug}`}
              className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100 hover:border-[#80368D]/30 hover:shadow-sm transition-all group"
            >
              <img
                src={product.coverImage || "/placeholder.svg"}
                alt={product.title}
                className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-900 text-sm truncate group-hover:text-[#80368D] transition-colors">
                  {product.title}
                </h4>
                <p className="text-xs text-gray-500">{product.category}</p>
              </div>
              <div className="flex flex-col items-end">
                <span className="font-bold text-[#80368D] text-sm">
                  {formatPrice(product.price || 0, product.currency)}
                </span>
                {product.originalPrice && product.price && product.originalPrice > product.price && (
                  <span className="text-xs text-gray-400 line-through">
                    {formatPrice(product.originalPrice, product.currency)}
                  </span>
                )}
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-[#80368D] transition-colors" />
            </Link>
          ))}
        </div>

        <Link
          href="/?access=paid"
          className="flex items-center justify-center gap-2 mt-4 text-sm text-[#80368D] hover:text-[#29358B] font-medium transition-colors"
        >
          Voir tous les produits premium
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  if (variant === "horizontal") {
    return (
      <div className="bg-gradient-to-r from-[#80368D] to-[#29358B] rounded-2xl p-6 md:p-8 text-white">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-yellow-300" />
              <span className="text-sm font-medium text-white/80">Recommandation</span>
            </div>
            <h3 className="text-xl md:text-2xl font-bold mb-2">
              {displayedProducts[0]?.title}
            </h3>
            <p className="text-white/80 text-sm mb-4 line-clamp-2">
              {displayedProducts[0]?.shortDescription}
            </p>
            <div className="flex items-center gap-4">
              <span className="text-2xl font-bold">
                {formatPrice(displayedProducts[0]?.price || 0, displayedProducts[0]?.currency)}
              </span>
              {displayedProducts[0]?.originalPrice && displayedProducts[0]?.price && displayedProducts[0].originalPrice > displayedProducts[0].price && (
                <>
                  <span className="text-white/60 line-through">
                    {formatPrice(displayedProducts[0].originalPrice, displayedProducts[0].currency)}
                  </span>
                  <span className="bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full">
                    -{calculateDiscount(displayedProducts[0].price, displayedProducts[0].originalPrice)}%
                  </span>
                </>
              )}
            </div>
          </div>
          <div className="flex-shrink-0">
            <Link
              href={`/produits/${displayedProducts[0]?.slug}`}
              className="inline-flex items-center gap-2 bg-white text-[#80368D] px-6 py-3 rounded-xl font-semibold hover:bg-gray-100 transition-colors"
            >
              Découvrir
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Full variant (default)
  return (
    <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-200 p-6 md:p-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-[#80368D]/10 to-[#29358B]/10 text-[#80368D] px-4 py-2 rounded-full text-sm font-medium mb-4">
          <TrendingUp className="w-4 h-4" />
          <span>Formations populaires</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
        <p className="text-gray-600">{subtitle}</p>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayedProducts.map((product, index) => (
          <Link
            key={product.id}
            href={`/produits/${product.slug}`}
            className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg hover:border-[#80368D]/30 transition-all"
          >
            {/* Image */}
            <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
              <img
                src={product.coverImage || "/placeholder.svg"}
                alt={product.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              {/* Discount Badge */}
              {product.originalPrice && product.price && product.originalPrice > product.price && (
                <div className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                  -{calculateDiscount(product.price, product.originalPrice)}%
                </div>
              )}
              {/* Popular Badge */}
              {index === 0 && (
                <div className="absolute top-3 right-3 bg-gradient-to-r from-[#80368D] to-[#29358B] text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                  <Star className="w-3 h-3 fill-current" />
                  Populaire
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-5">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs bg-[#80368D]/10 text-[#80368D] px-2 py-0.5 rounded-full">
                  {product.category}
                </span>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                  {product.level}
                </span>
              </div>

              <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-[#80368D] transition-colors">
                {product.title}
              </h3>

              <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                {product.shortDescription}
              </p>

              {/* Price */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold text-[#80368D]">
                    {formatPrice(product.price || 0, product.currency)}
                  </span>
                  {product.originalPrice && product.price && product.originalPrice > product.price && (
                    <span className="text-sm text-gray-400 line-through">
                      {formatPrice(product.originalPrice, product.currency)}
                    </span>
                  )}
                </div>
                <div className="w-10 h-10 bg-[#80368D]/10 rounded-full flex items-center justify-center group-hover:bg-[#80368D] transition-colors">
                  <ArrowRight className="w-5 h-5 text-[#80368D] group-hover:text-white transition-colors" />
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* CTA */}
      <div className="text-center mt-8">
        <Link
          href="/?access=paid"
          className="inline-flex items-center gap-2 bg-gradient-to-r from-[#80368D] to-[#29358B] text-white px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity"
        >
          <BookOpen className="w-5 h-5" />
          Explorer toutes les formations
          <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    </div>
  );
}

// Server component to fetch recommendations
export async function getRecommendedProducts(
  currentCategory?: string,
  excludeId?: string,
  limit: number = 3
) {
  const { prisma } = await import("@/lib/prisma");

  const where: Record<string, unknown> = {
    type: "paid",
    status: "published",
  };

  if (excludeId) {
    where.id = { not: excludeId };
  }

  // Prioritize same category, then get others
  let products = await prisma.resource.findMany({
    where: currentCategory ? { ...where, category: currentCategory } : where,
    select: {
      id: true,
      slug: true,
      title: true,
      shortDescription: true,
      coverImage: true,
      price: true,
      originalPrice: true,
      currency: true,
      category: true,
      level: true,
      resourceType: true,
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  // If not enough products from same category, get more from other categories
  if (products.length < limit && currentCategory) {
    const moreProducts = await prisma.resource.findMany({
      where: {
        ...where,
        category: { not: currentCategory },
        id: { notIn: products.map((p) => p.id) },
      },
      select: {
        id: true,
        slug: true,
        title: true,
        shortDescription: true,
        coverImage: true,
        price: true,
        originalPrice: true,
        currency: true,
        category: true,
        level: true,
        resourceType: true,
      },
      orderBy: { createdAt: "desc" },
      take: limit - products.length,
    });
    products = [...products, ...moreProducts];
  }

  return products;
}
