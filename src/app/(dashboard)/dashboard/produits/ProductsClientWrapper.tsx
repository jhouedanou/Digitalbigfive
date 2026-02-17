"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Download,
  Check,
  Loader2,
  WifiOff,
  BookOpen,
  BookMarked,
  Search,
} from "lucide-react";
import { useOfflineDownload } from "@/hooks/useOfflineSync";
import { isPDFAvailableOffline } from "@/lib/offline-storage";
import DownloadAppButton from "@/components/pwa/DownloadAppButton";

interface Product {
  id: string;
  resourceId: string;
  title: string;
  coverImage: string | null;
  category: string;
  pageCount: number | null;
  purchaseDate: string;
}

interface ProductsClientWrapperProps {
  products: Product[];
}

export default function ProductsClientWrapper({
  products,
}: ProductsClientWrapperProps) {
  const [offlineStatus, setOfflineStatus] = useState<Record<string, boolean>>(
    {}
  );
  const [downloadingIds, setDownloadingIds] = useState<Record<string, number>>(
    {}
  );
  const [isOnline, setIsOnline] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const { downloadForOffline } = useOfflineDownload();

  // Check which products are available offline
  useEffect(() => {
    const checkOfflineStatus = async () => {
      const statuses: Record<string, boolean> = {};
      for (const product of products) {
        statuses[product.resourceId] = await isPDFAvailableOffline(
          product.resourceId
        );
      }
      setOfflineStatus(statuses);
    };

    checkOfflineStatus();

    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [products]);

  const handleDownloadOffline = async (resourceId: string) => {
    if (downloadingIds[resourceId] !== undefined) return;

    setDownloadingIds((prev) => ({ ...prev, [resourceId]: 0 }));

    const result = await downloadForOffline(resourceId, (progress) => {
      setDownloadingIds((prev) => ({ ...prev, [resourceId]: progress }));
    });

    if (result.success) {
      setOfflineStatus((prev) => ({ ...prev, [resourceId]: true }));
    } else {
      alert(`Erreur: ${result.error}`);
    }

    setDownloadingIds((prev) => {
      const newState = { ...prev };
      delete newState[resourceId];
      return newState;
    });
  };

  // Filter & group
  const filteredProducts = products.filter((p) =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const categories = [...new Set(filteredProducts.map((p) => p.category))];

  return (
    <div className="-mx-4 sm:-mx-6 lg:-mx-8 -my-8 min-h-screen bg-[#1c1c1e]">
      {/* ═══ Top bar ═══ */}
      <div className="sticky top-0 z-20 bg-[#1c1c1e]/95 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <BookOpen className="w-6 h-6 text-[#FF9F0A]" />
              <h1 className="text-xl font-bold text-white">Mes produits</h1>
              {products.length > 0 && (
                <span className="text-sm text-gray-500">
                  {products.length} livre{products.length > 1 ? "s" : ""}
                </span>
              )}
            </div>

            {/* Search */}
            {products.length > 0 && (
              <div className="relative max-w-xs flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher..."
                  className="w-full pl-9 pr-4 py-2 bg-white/10 border border-white/10 rounded-xl text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF9F0A]/50"
                />
              </div>
            )}

            {/* Download / Install App button */}
            <DownloadAppButton variant="compact" />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Download App banner */}
        <div className="mb-6">
          <DownloadAppButton variant="banner" />
        </div>

        {products.length === 0 ? (
          /* ═══ Empty state ═══ */
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-[#FF9F0A]/20 to-[#FF6B00]/20 rounded-3xl flex items-center justify-center mb-6">
              <BookMarked className="w-12 h-12 text-[#FF9F0A]" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Aucun produit acheté
            </h2>
            <p className="text-gray-500 mb-8 max-w-md">
              Vos livres achetés apparaîtront ici. Découvrez nos ressources pour
              commencer votre collection.
            </p>
            <Link
              href="/?access=paid"
              className="px-6 py-3 bg-[#FF9F0A] text-black font-semibold rounded-xl hover:bg-[#FFB340] transition"
            >
              Découvrir les produits
            </Link>
          </div>
        ) : (
          /* ═══ Book shelves ═══ */
          <div className="space-y-10">
            {searchQuery ? (
              <ProductShelf
                title={`Résultats (${filteredProducts.length})`}
                products={filteredProducts}
                offlineStatus={offlineStatus}
                downloadingIds={downloadingIds}
                isOnline={isOnline}
                onDownload={handleDownloadOffline}
              />
            ) : (
              <>
                {/* Récents */}
                {products.length > 0 && (
                  <ProductShelf
                    title="Récents"
                    products={products.slice(0, 8)}
                    offlineStatus={offlineStatus}
                    downloadingIds={downloadingIds}
                    isOnline={isOnline}
                    onDownload={handleDownloadOffline}
                  />
                )}

                {/* Par catégorie */}
                {categories.map((category) => (
                  <ProductShelf
                    key={category}
                    title={category}
                    products={filteredProducts.filter(
                      (p) => p.category === category
                    )}
                    offlineStatus={offlineStatus}
                    downloadingIds={downloadingIds}
                    isOnline={isOnline}
                    onDownload={handleDownloadOffline}
                  />
                ))}
              </>
            )}
          </div>
        )}
      </div>

      {/* ═══ iBooks shelf styling ═══ */}
      <style jsx global>{`
        .book-cover-product {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          transform-style: preserve-3d;
        }
        .book-cover-product:hover {
          transform: scale(1.05) translateY(-8px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5),
            0 0 0 1px rgba(255, 255, 255, 0.1);
        }
        .book-spine-product {
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 4px;
          background: linear-gradient(
            to right,
            rgba(0, 0, 0, 0.3),
            rgba(0, 0, 0, 0.1),
            rgba(255, 255, 255, 0.05)
          );
          border-radius: 2px 0 0 2px;
          z-index: 2;
        }
        .shelf-wood-product {
          background: linear-gradient(
            180deg,
            #5c3d2e 0%,
            #8b6914 8%,
            #a0824a 12%,
            #7a5a30 18%,
            #6b4423 30%,
            #5c3d2e 100%
          );
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4),
            inset 0 1px 0 rgba(255, 255, 255, 0.1),
            inset 0 -2px 4px rgba(0, 0, 0, 0.2);
        }
      `}</style>
    </div>
  );
}

/* ═══ Product Shelf ═══ */
function ProductShelf({
  title,
  products,
  offlineStatus,
  downloadingIds,
  isOnline,
  onDownload,
}: {
  title: string;
  products: Product[];
  offlineStatus: Record<string, boolean>;
  downloadingIds: Record<string, number>;
  isOnline: boolean;
  onDownload: (resourceId: string) => void;
}) {
  if (products.length === 0) return null;

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-300 mb-4 px-1">
        {title}
      </h2>

      {/* Books row */}
      <div className="relative">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-5 gap-y-2 pb-1">
          {products.map((product) => (
            <ProductBookCard
              key={product.id}
              product={product}
              isAvailableOffline={offlineStatus[product.resourceId] || false}
              isDownloading={downloadingIds[product.resourceId] !== undefined}
              downloadProgress={downloadingIds[product.resourceId] || 0}
              isOnline={isOnline}
              onDownload={() => onDownload(product.resourceId)}
            />
          ))}
        </div>

        {/* Wooden shelf */}
        <div className="shelf-wood-product h-3 rounded-sm -mt-1 relative z-0" />
        <div className="h-2 bg-gradient-to-b from-black/20 to-transparent" />
      </div>
    </div>
  );
}

/* ═══ Product Book Card ═══ */
function ProductBookCard({
  product,
  isAvailableOffline,
  isDownloading,
  downloadProgress,
  isOnline,
  onDownload,
}: {
  product: Product;
  isAvailableOffline: boolean;
  isDownloading: boolean;
  downloadProgress: number;
  isOnline: boolean;
  onDownload: () => void;
}) {
  return (
    <div className="group flex flex-col items-center">
      {/* Book cover with 3D effect */}
      <Link
        href={`/dashboard/reader/${product.resourceId}`}
        className="book-cover-product relative rounded-sm overflow-hidden shadow-lg cursor-pointer w-[140px] h-[200px] block"
      >
        {/* Spine effect */}
        <div className="book-spine-product" />

        {/* Cover image */}
        {product.coverImage ? (
          <Image
            src={product.coverImage}
            alt={product.title}
            fill
            className="object-cover"
            sizes="140px"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#80368D] to-[#29358B] flex flex-col items-center justify-center p-3 text-center">
            <BookOpen className="w-8 h-8 text-white/60 mb-2" />
            <span className="text-white/90 text-xs font-medium leading-tight line-clamp-3">
              {product.title}
            </span>
          </div>
        )}

        {/* Glossy reflection overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/20 pointer-events-none" />

        {/* Page edge effect */}
        <div className="absolute right-0 top-0 bottom-0 w-[3px] bg-gradient-to-l from-gray-300/30 to-transparent" />

        {/* Offline badge */}
        {isAvailableOffline && (
          <div className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 bg-green-500/90 text-white text-[10px] rounded-full backdrop-blur-sm">
            <Check size={10} />
            Offline
          </div>
        )}

        {/* Download progress overlay */}
        {isDownloading && (
          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-6 h-6 text-[#FF9F0A] animate-spin" />
            <span className="text-white text-xs font-medium">
              {downloadProgress}%
            </span>
            <div className="w-20 h-1 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#FF9F0A] transition-all"
                style={{ width: `${downloadProgress}%` }}
              />
            </div>
          </div>
        )}
      </Link>

      {/* Title */}
      <div className="mt-2 w-[140px] text-center px-1">
        <p className="text-white text-xs font-medium line-clamp-2 leading-tight group-hover:text-[#FF9F0A] transition-colors">
          {product.title}
        </p>
        {product.pageCount && (
          <p className="text-gray-600 text-[10px] mt-0.5">
            {product.pageCount} pages
          </p>
        )}
      </div>

      {/* Action buttons — visible on hover */}
      <div className="mt-1.5 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <Link
          href={`/dashboard/reader/${product.resourceId}`}
          className="flex items-center gap-1 px-2.5 py-1 bg-[#FF9F0A] text-black text-[10px] font-semibold rounded-lg hover:bg-[#FFB340] transition"
        >
          <BookOpen size={10} />
          Lire
        </Link>

        {!isAvailableOffline && !isDownloading && isOnline && (
          <button
            onClick={(e) => {
              e.preventDefault();
              onDownload();
            }}
            className="flex items-center gap-1 px-2.5 py-1 bg-white/10 text-white text-[10px] font-medium rounded-lg hover:bg-white/20 transition"
            title="Télécharger pour lecture hors-ligne"
            aria-label="Télécharger hors-ligne"
          >
            <Download size={10} />
            Offline
          </button>
        )}

        {!isOnline && !isAvailableOffline && (
          <span className="flex items-center gap-1 px-2 py-1 text-gray-500 text-[10px]">
            <WifiOff size={10} />
          </span>
        )}
      </div>
    </div>
  );
}

