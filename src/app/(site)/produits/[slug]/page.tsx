import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getChariowProductBySlug, mapChariowToResource } from "@/lib/chariow";
import ChariowWidget from "@/components/products/ChariowWidget";
import {
  ShieldCheck,
  Zap,
  RefreshCw,
} from "lucide-react";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getChariowProductBySlug(slug);

  if (!product) {
    return { title: "Produit introuvable" };
  }

  const resource = mapChariowToResource(product);
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://digitalbigfive.vercel.app";

  return {
    title: `${resource.title} | Digital Big Five`,
    description: resource.shortDescription,
    openGraph: {
      title: resource.title,
      description: `${resource.priceFormatted} — ${resource.shortDescription}`,
      url: `${appUrl}/produits/${slug}`,
      siteName: "Digital Big Five",
      images: resource.coverImage
        ? [{ url: resource.coverImage, width: 1200, height: 630, alt: resource.title }]
        : [],
      locale: "fr_FR",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: resource.title,
      description: `${resource.priceFormatted} — ${resource.shortDescription}`,
      images: resource.coverImage ? [resource.coverImage] : [],
    },
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await getChariowProductBySlug(slug);

  if (!product) notFound();

  const resource = mapChariowToResource(product);
  const isFree = resource.type === "free";

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex gap-2 mb-4">
                <span className="text-xs bg-[#D0E4F2] text-[#80368D] px-2 py-0.5 rounded-full">
                  {resource.category}
                </span>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                  {resource.resourceType}
                </span>
              </div>

              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                {resource.title}
              </h1>

              <p className="text-lg text-gray-600 mb-2 line-clamp-3">
                {resource.shortDescription}
              </p>
              <a
                href="#description"
                className="inline-block text-sm font-medium text-[#80368D] hover:underline mb-6"
              >
                En savoir plus &darr;
              </a>

              {/* Price */}
              <div className="flex items-baseline gap-3 mb-6">
                <span className="text-4xl font-bold text-gray-900">
                  {resource.priceFormatted}
                </span>
                {resource.originalPriceFormatted && (
                  <span className="text-xl line-through text-gray-400">
                    {resource.originalPriceFormatted}
                  </span>
                )}
                {resource.priceOff && (
                  <span className="bg-red-500 text-white text-sm font-bold px-2 py-1 rounded-full">
                    -{resource.priceOff}
                  </span>
                )}
              </div>

              {/* Chariow Snap Widget */}
           

              {/* Trust badges */}
              <div className="flex flex-wrap gap-4 mt-6 text-sm text-gray-500">
                {!isFree && (
                  <div className="flex items-center gap-1">
                    <ShieldCheck size={16} className="text-green-600" />
                    Paiement sécurisé
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Zap size={16} className="text-yellow-500" />
                  Accès immédiat
                </div>
                {!isFree && (
                  <div className="flex items-center gap-1">
                    <RefreshCw size={16} className="text-[#80368D]" />
                    Garantie 30 jours
                  </div>
                )}
              </div>
            </div>

            {/* Product image */}
            <div className="rounded-xl overflow-hidden border border-gray-200 shadow-lg">
              <img
                src={resource.coverImage}
                alt={resource.title}
                className="w-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Description Section */}
      <section id="description" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 scroll-mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-20 gap-10">
          <div className="lg:col-span-11">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Description détaillée
            </h2>
            <div
              className="prose prose-gray max-w-none"
              dangerouslySetInnerHTML={{ __html: resource.description }}
            />
          </div>

          {/* Sidebar CTA */}
          <div className="lg:col-span-9">
            <div className="top-24 bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              {/* Snap Widget in sidebar */}
              <ChariowWidget
                productId={resource.chariowProductId}
                storeDomain={resource.storeDomain}
                ctaText={isFree ? "Télécharger gratuitement" : "Acheter maintenant"}
                primaryColor="#80368D"
                compact
              />

              <ul className="mt-4 space-y-2 text-sm text-gray-600">
                {!isFree && (
                  <li className="flex items-center gap-2">
                    <ShieldCheck size={14} className="text-green-600" />
                    Paiement sécurisé SSL
                  </li>
                )}
                <li className="flex items-center gap-2">
                  <Zap size={14} className="text-yellow-500" />
                  {isFree ? "Téléchargement instantané" : "Accès immédiat après achat"}
                </li>
                {!isFree && (
                  <li className="flex items-center gap-2">
                    <RefreshCw size={14} className="text-[#80368D]" />
                    Garantie remboursement 30j
                  </li>
                )}
              </ul>

              {product.quantity.remaining.value < product.quantity.total && (
                <div className="mt-4 p-3 bg-orange-50 rounded-lg">
                  <p className="text-sm text-orange-700 font-medium">
                    Plus que {product.quantity.remaining.value} exemplaire{product.quantity.remaining.value > 1 ? "s" : ""} disponible{product.quantity.remaining.value > 1 ? "s" : ""}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-[#80368D] text-white py-16">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">{resource.title}</h2>
          <p className="text-purple-100 mb-8">{resource.shortDescription}</p>
          <ChariowWidget
            productId={resource.chariowProductId}
            storeDomain={resource.storeDomain}
            ctaText={isFree ? "Télécharger gratuitement" : "Acheter maintenant"}
            primaryColor="#FFFFFF"
            backgroundColor="#80368D"
            compact
          />
        </div>
      </section>
    </div>
  );
}
