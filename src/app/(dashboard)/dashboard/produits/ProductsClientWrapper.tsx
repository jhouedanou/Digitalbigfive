"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Download, Check, Loader2, WifiOff, BookOpen } from "lucide-react";
import { useOfflineDownload } from "@/hooks/useOfflineSync";
import { isPDFAvailableOffline } from "@/lib/offline-storage";

interface Product {
  id: string;
  resourceId: string;
  title: string;
  coverImage: string | null;
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

    // Check online status
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map((product) => {
        const isAvailableOffline = offlineStatus[product.resourceId];
        const isDownloading = downloadingIds[product.resourceId] !== undefined;
        const downloadProgress = downloadingIds[product.resourceId] || 0;

        return (
          <div
            key={product.id}
            className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow"
          >
            {/* Cover image */}
            <div className="aspect-[4/3] bg-gray-100 relative">
              <img
                src={product.coverImage || "/placeholder.svg"}
                alt={product.title}
                className="w-full h-full object-cover"
              />

              {/* Offline badge */}
              {isAvailableOffline && (
                <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 bg-green-500 text-white text-xs rounded-full">
                  <Check size={12} />
                  Offline
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">
                {product.title}
              </h3>
              <p className="text-xs text-gray-500 mb-4">
                Acheté le {formatDate(product.purchaseDate)}
              </p>

              {/* Actions */}
              <div className="flex flex-col gap-2">
                {/* Read button */}
                <Link
                  href={`/dashboard/reader/${product.resourceId}`}
                  className="flex items-center justify-center gap-2 w-full bg-[#80368D] text-white py-2.5 rounded-lg text-sm font-medium hover:bg-[#6a2d76] transition-colors"
                >
                  <BookOpen size={16} />
                  Lire
                </Link>

                {/* Download offline button */}
                {!isOnline ? (
                  <button
                    disabled
                    className="flex items-center justify-center gap-2 w-full bg-gray-100 text-gray-400 py-2 rounded-lg text-sm cursor-not-allowed"
                  >
                    <WifiOff size={14} />
                    Hors ligne
                  </button>
                ) : isAvailableOffline ? (
                  <div className="flex items-center justify-center gap-2 text-green-600 text-sm py-2">
                    <Check size={14} />
                    Disponible offline
                  </div>
                ) : isDownloading ? (
                  <div className="relative">
                    <button
                      disabled
                      className="flex items-center justify-center gap-2 w-full bg-gray-100 text-gray-600 py-2 rounded-lg text-sm"
                    >
                      <Loader2 size={14} className="animate-spin" />
                      {downloadProgress}%
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#80368D] transition-all"
                        style={{ width: `${downloadProgress}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => handleDownloadOffline(product.resourceId)}
                    className="flex items-center justify-center gap-2 w-full bg-gray-100 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-200 transition-colors"
                  >
                    <Download size={14} />
                    Télécharger offline
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
