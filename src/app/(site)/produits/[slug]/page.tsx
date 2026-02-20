import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { formatPrice, formatDate } from "@/lib/utils";
import BuyButton from "@/components/products/BuyButton";
import FAQSection from "@/components/products/FAQSection";
import TestimonialSection from "@/components/products/TestimonialSection";
import {
  ShieldCheck,
  Zap,
  RefreshCw,
  FileText,
  BarChart3,
  Calendar,
} from "lucide-react";
import Link from "next/link";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const resource = await prisma.resource.findUnique({
    where: { slug, type: "paid", status: "published" },
    select: {
      title: true,
      shortDescription: true,
      coverImage: true,
      price: true,
      originalPrice: true,
      currency: true,
      category: true,
    },
  });

  if (!resource) {
    return { title: "Produit introuvable" };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://digitalbigfive.vercel.app";
  const priceText = resource.price
    ? `${resource.price.toLocaleString("fr-FR")} ${resource.currency}`
    : "";
  const description = resource.shortDescription || `Découvrez ${resource.title} sur Digital Big Five.`;

  return {
    title: `${resource.title} | Digital Big Five`,
    description,
    openGraph: {
      title: resource.title,
      description: priceText ? `${priceText} — ${description}` : description,
      url: `${appUrl}/produits/${slug}`,
      siteName: "Digital Big Five",
      images: resource.coverImage
        ? [
            {
              url: resource.coverImage,
              width: 1200,
              height: 630,
              alt: resource.title,
            },
          ]
        : [],
      locale: "fr_FR",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: resource.title,
      description: priceText ? `${priceText} — ${description}` : description,
      images: resource.coverImage ? [resource.coverImage] : [],
    },
    other: {
      "product:price:amount": resource.price?.toString() || "",
      "product:price:currency": resource.currency,
      ...(resource.originalPrice && resource.originalPrice > (resource.price || 0)
        ? { "product:original_price:amount": resource.originalPrice.toString() }
        : {}),
    },
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;

  const resource = await prisma.resource.findUnique({
    where: { slug, type: "paid", status: "published" },
    include: {
      faqs: { orderBy: { sortOrder: "asc" } },
      testimonials: {
        where: { status: "approved" },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              jobTitle: true,
              organization: true,
              profileImage: true,
            },
          },
        },
      },
    },
  });

  if (!resource) notFound();

  const avgRating =
    resource.testimonials.length > 0
      ? resource.testimonials.reduce((acc, t) => acc + t.rating, 0) /
        resource.testimonials.length
      : 0;

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

              <p className="text-lg text-gray-600 mb-6">
                {resource.shortDescription}
              </p>

              {/* Price */}
              <div className="flex items-baseline gap-3 mb-6">
                <span className="text-4xl font-bold text-gray-900">
                  {formatPrice(resource.price || 0, resource.currency)}
                </span>
                {resource.originalPrice &&
                  resource.originalPrice > (resource.price || 0) && (
                    <span className="text-xl line-through text-gray-400">
                      {formatPrice(resource.originalPrice, resource.currency)}
                    </span>
                  )}
              </div>

              {/* CTA */}
              <BuyButton resourceSlug={resource.slug} className="w-full sm:w-auto" />

              {/* Trust badges */}
              <div className="flex flex-wrap gap-4 mt-6 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <ShieldCheck size={16} className="text-green-600" />
                  Paiement sécurisé
                </div>
                <div className="flex items-center gap-1">
                  <Zap size={16} className="text-yellow-500" />
                  Accès immédiat
                </div>
                <div className="flex items-center gap-1">
                  <RefreshCw size={16} className="text-[#80368D]" />
                  Garantie 30 jours
                </div>
              </div>

              {avgRating > 0 && (
                <div className="mt-4 text-sm text-gray-500">
                  {avgRating.toFixed(1)}/5 ({resource.testimonials.length} avis)
                </div>
              )}
            </div>

            {/* Product image */}
            <div className="rounded-xl overflow-hidden border border-gray-200 shadow-lg">
              <img
                src={resource.coverImage || "/placeholder.svg"}
                alt={resource.title}
                className="w-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Description Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Description détaillée
            </h2>
            <div
              className="prose prose-gray max-w-none"
              dangerouslySetInnerHTML={{ __html: resource.longDescription }}
            />

            {/* Metadata */}
            <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-4 p-6 bg-gray-50 rounded-xl">
              <div>
                <p className="text-xs text-gray-500 uppercase">Type</p>
                <p className="text-sm font-medium">{resource.resourceType}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Format</p>
                <p className="text-sm font-medium">{resource.format}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Niveau</p>
                <p className="text-sm font-medium">{resource.level}</p>
              </div>
              {resource.pageCount && (
                <div>
                  <p className="text-xs text-gray-500 uppercase">Pages</p>
                  <p className="text-sm font-medium">{resource.pageCount}</p>
                </div>
              )}
              {resource.fileSize && (
                <div>
                  <p className="text-xs text-gray-500 uppercase">Taille</p>
                  <p className="text-sm font-medium">{resource.fileSize}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-gray-500 uppercase">Mis à jour</p>
                <p className="text-sm font-medium">
                  {formatDate(resource.updatedAt)}
                </p>
              </div>
            </div>
          </div>

          {/* Sidebar CTA */}
          <div>
            <div className="sticky top-24 bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <div className="text-3xl font-bold text-gray-900 mb-2">
                {formatPrice(resource.price || 0, resource.currency)}
              </div>
              {resource.originalPrice &&
                resource.originalPrice > (resource.price || 0) && (
                  <p className="text-sm line-through text-gray-400 mb-4">
                    {formatPrice(resource.originalPrice, resource.currency)}
                  </p>
                )}
              <BuyButton resourceSlug={resource.slug} className="w-full" />
              <ul className="mt-4 space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <ShieldCheck size={14} className="text-green-600" />
                  Paiement sécurisé SSL
                </li>
                <li className="flex items-center gap-2">
                  <Zap size={14} className="text-yellow-500" />
                  Accès immédiat après achat
                </li>
                <li className="flex items-center gap-2">
                  <RefreshCw size={14} className="text-[#80368D]" />
                  Garantie remboursement 30j
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      {resource.testimonials.length > 0 && (
        <section className="bg-gray-50 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <TestimonialSection testimonials={resource.testimonials} />
            <div className="mt-8 text-center">
              <BuyButton resourceSlug={resource.slug} />
            </div>
          </div>
        </section>
      )}

      {/* FAQ */}
      {resource.faqs.length > 0 && (
        <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <FAQSection faqs={resource.faqs} />
        </section>
      )}

      {/* Final CTA */}
      <section className="bg-[#80368D] text-white py-16">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">{resource.title}</h2>
          <p className="text-purple-100 mb-8">{resource.shortDescription}</p>
          <BuyButton
            resourceSlug={resource.slug}
            className="!bg-white !text-[#80368D] hover:!bg-gray-100"
          />
        </div>
      </section>
    </div>
  );
}
