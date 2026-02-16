"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  WifiOff,
  Wifi,
  Trash2,
  RefreshCw,
  BookOpen,
  Clock,
  HardDrive,
} from "lucide-react";
import { useOfflineSync } from "@/hooks/useOfflineSync";
import {
  getAllPDFMetadata,
  deletePDF,
  getStorageInfo,
  type PDFMetadata,
} from "@/lib/offline-storage";

export default function OfflineLibraryClient() {
  const router = useRouter();

  const [availableOffline, setAvailableOffline] = useState<PDFMetadata[]>([]);
  const [storageInfo, setStorageInfo] = useState<{
    totalPDFs: number;
    totalSize: number;
    availableSpace: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const { triggerSync, isOnline } = useOfflineSync({
    onAccessRevoked: () => {
      loadOfflineData();
    },
    onSyncComplete: () => {
      loadOfflineData();
    },
  });

  const loadOfflineData = async () => {
    try {
      const metadata = await getAllPDFMetadata();
      setAvailableOffline(metadata.filter((m) => !m.isExpired));

      const info = await getStorageInfo();
      setStorageInfo(info);
    } catch (error) {
      console.error("Error loading offline data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOfflineData();
  }, []);

  const handleDeleteOffline = async (id: string, title: string) => {
    if (confirm(`Supprimer "${title}" de votre bibliothèque hors ligne ?`)) {
      await deletePDF(id);
      loadOfflineData();
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} o`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
    return `${(bytes / 1024 / 1024).toFixed(1)} Mo`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#80368D] mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/dashboard/produits")}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Bibliothèque hors ligne
              </h1>
              <p className="text-sm text-gray-500">
                Consultez vos PDFs sans connexion Internet
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Connection status */}
            <div
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm ${
                isOnline
                  ? "bg-green-100 text-green-700"
                  : "bg-orange-100 text-orange-700"
              }`}
            >
              {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
              {isOnline ? "En ligne" : "Hors ligne"}
            </div>

            {isOnline && (
              <button
                onClick={triggerSync}
                className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
                title="Synchroniser"
              >
                <RefreshCw size={18} />
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 sm:p-8">
        {/* Storage info */}
        {storageInfo && (
          <div className="bg-white rounded-xl p-4 mb-6 flex items-center gap-4">
            <HardDrive className="text-[#80368D]" size={24} />
            <div className="flex-1">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">
                  {storageInfo.totalPDFs} document
                  {storageInfo.totalPDFs > 1 ? "s" : ""} téléchargé
                  {storageInfo.totalPDFs > 1 ? "s" : ""}
                </span>
                <span className="text-gray-500">
                  {formatSize(storageInfo.totalSize)} utilisé
                </span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#80368D]"
                  style={{
                    width: `${Math.min(100, (storageInfo.totalSize / storageInfo.availableSpace) * 100)}%`,
                  }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {formatSize(storageInfo.availableSpace)} disponible
              </p>
            </div>
          </div>
        )}

        {/* Empty state */}
        {availableOffline.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <WifiOff className="w-10 h-10 text-gray-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
              Aucun document disponible hors ligne
            </h2>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              Téléchargez vos documents depuis &quot;Mes produits&quot; pour les
              consulter sans connexion Internet pendant 30 jours.
            </p>
            <button
              onClick={() => router.push("/dashboard/produits")}
              className="px-6 py-3 bg-[#80368D] text-white rounded-xl hover:bg-[#6a2d75] font-medium"
            >
              Voir mes produits
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {availableOffline.map((pdf) => {
              const daysRemaining = Math.ceil(
                (pdf.expiresAt - Date.now()) / (24 * 60 * 60 * 1000)
              );
              const isExpiringSoon = daysRemaining <= 3;

              return (
                <div
                  key={pdf.id}
                  className="bg-white rounded-xl p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4 hover:shadow-md transition-shadow"
                >
                  {/* Icon */}
                  <div className="hidden sm:flex w-12 h-12 bg-[#f3e8f5] rounded-lg items-center justify-center flex-shrink-0">
                    <BookOpen className="text-[#80368D]" size={24} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 truncate">
                      {pdf.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-gray-500">
                      <span>{formatSize(pdf.fileSize)}</span>
                      <span>•</span>
                      <span
                        className={`flex items-center gap-1 ${
                          isExpiringSoon ? "text-red-500" : ""
                        }`}
                      >
                        <Clock size={12} />
                        {daysRemaining > 0
                          ? `${daysRemaining} jour${daysRemaining > 1 ? "s" : ""} restant${daysRemaining > 1 ? "s" : ""}`
                          : "Expiré"}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 sm:gap-3">
                    <button
                      onClick={() => router.push(`/dashboard/reader/${pdf.id}`)}
                      className="flex-1 sm:flex-none px-4 py-2.5 bg-[#80368D] text-white rounded-lg hover:bg-[#6a2d75] font-medium text-sm"
                    >
                      Lire
                    </button>

                    <button
                      onClick={() => handleDeleteOffline(pdf.id, pdf.title)}
                      className="p-2.5 text-red-500 hover:bg-red-50 rounded-lg"
                      title="Supprimer du stockage hors ligne"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Info section */}
        <div className="mt-8 bg-blue-50 rounded-xl p-6">
          <h3 className="font-semibold text-blue-900 mb-3">
            À propos de la lecture hors ligne
          </h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-0.5">•</span>
              Les documents sont disponibles pendant 30 jours après téléchargement
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-0.5">•</span>
              Ils sont chiffrés et sécurisés sur votre appareil
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-0.5">•</span>
              Un watermark personnalisé protège votre achat
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-0.5">•</span>
              Reconnectez-vous régulièrement pour renouveler l&apos;accès
            </li>
          </ul>
        </div>
      </main>
    </div>
  );
}
