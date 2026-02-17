"use client";

import { useState, useEffect } from "react";
import {
  Download,
  X,
  BookOpen,
  Smartphone,
  Check,
  Cloud,
  Wifi,
} from "lucide-react";

interface DownloadPromptProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    id: string;
    title: string;
    coverImage?: string;
  };
  onDownloadComplete?: () => void;
}

export default function DownloadPrompt({
  isOpen,
  onClose,
  product,
  onDownloadComplete,
}: DownloadPromptProps) {
  const [status, setStatus] = useState<
    "ready" | "downloading" | "complete" | "error"
  >("ready");
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (isOpen && status === "ready") {
      // Auto-start download after a brief delay
      const timer = setTimeout(() => {
        handleDownload();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  async function handleDownload() {
    setStatus("downloading");
    setProgress(0);
    setErrorMessage("");

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + Math.random() * 15;
        });
      }, 200);

      // Call the offline preparation API
      const response = await fetch("/api/pdf/prepare-offline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resourceId: product.id }),
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Échec du téléchargement");
      }

      setProgress(100);
      setStatus("complete");

      // Notify parent
      if (onDownloadComplete) {
        setTimeout(onDownloadComplete, 1500);
      }
    } catch (error) {
      console.error("Download error:", error);
      setStatus("error");
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Une erreur est survenue lors du téléchargement"
      );
    }
  }

  function handleRetry() {
    setStatus("ready");
    handleDownload();
  }

  function handleOpenLibrary() {
    window.location.href = "/dashboard/bibliotheque";
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={status === "complete" ? onClose : undefined}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-md mx-4 bg-gradient-to-b from-[#2c2c2e] to-[#1c1c1e] rounded-3xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="relative p-6 text-center border-b border-white/10">
          {status !== "downloading" && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          <div className="flex justify-center mb-4">
            {status === "complete" ? (
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center animate-scale-in">
                <Check className="w-8 h-8 text-white" />
              </div>
            ) : status === "error" ? (
              <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center">
                <X className="w-8 h-8 text-white" />
              </div>
            ) : (
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                {status === "downloading" ? (
                  <div className="w-8 h-8 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Download className="w-8 h-8 text-white" />
                )}
              </div>
            )}
          </div>

          <h2 className="text-xl font-bold text-white mb-1">
            {status === "complete"
              ? "Téléchargement terminé !"
              : status === "error"
              ? "Erreur de téléchargement"
              : status === "downloading"
              ? "Téléchargement en cours..."
              : "Préparez votre lecture"}
          </h2>
          <p className="text-gray-400 text-sm">
            {status === "complete"
              ? "Votre livre est prêt à être lu, même hors connexion"
              : status === "error"
              ? errorMessage
              : status === "downloading"
              ? "Veuillez patienter..."
              : "Téléchargez votre livre pour le lire hors connexion"}
          </p>
        </div>

        {/* Book Preview */}
        <div className="p-6">
          <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl">
            {/* Cover */}
            <div className="w-20 h-28 rounded-lg overflow-hidden shadow-lg flex-shrink-0">
              {product.coverImage ? (
                <img
                  src={product.coverImage}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-orange-600 to-pink-600 flex items-center justify-center">
                  <BookOpen className="w-8 h-8 text-white/50" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-white truncate mb-1">
                {product.title}
              </h3>
              <p className="text-sm text-gray-400 mb-3">Digital Big Five</p>

              {/* Progress Bar */}
              {status === "downloading" && (
                <div className="space-y-1">
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-orange-500 to-pink-500 transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    {Math.round(progress)}%
                  </p>
                </div>
              )}

              {status === "complete" && (
                <div className="flex items-center gap-1 text-sm text-green-400">
                  <Check className="w-4 h-4" />
                  Disponible hors ligne
                </div>
              )}
            </div>
          </div>

          {/* Features (only show before download) */}
          {status === "ready" && (
            <div className="mt-4 grid grid-cols-3 gap-2">
              <div className="flex flex-col items-center gap-1 p-3 bg-white/5 rounded-xl">
                <Wifi className="w-5 h-5 text-orange-400" />
                <span className="text-xs text-gray-400 text-center">
                  Hors ligne
                </span>
              </div>
              <div className="flex flex-col items-center gap-1 p-3 bg-white/5 rounded-xl">
                <Cloud className="w-5 h-5 text-blue-400" />
                <span className="text-xs text-gray-400 text-center">
                  Synchronisé
                </span>
              </div>
              <div className="flex flex-col items-center gap-1 p-3 bg-white/5 rounded-xl">
                <Smartphone className="w-5 h-5 text-green-400" />
                <span className="text-xs text-gray-400 text-center">
                  Multi-appareils
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-6 pt-0 space-y-3">
          {status === "complete" ? (
            <>
              <button
                onClick={handleOpenLibrary}
                className="w-full py-4 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold rounded-xl hover:opacity-90 transition flex items-center justify-center gap-2"
              >
                <BookOpen className="w-5 h-5" />
                Ouvrir ma bibliothèque
              </button>
              <button
                onClick={onClose}
                className="w-full py-3 text-gray-400 hover:text-white transition"
              >
                Continuer mes achats
              </button>
            </>
          ) : status === "error" ? (
            <>
              <button
                onClick={handleRetry}
                className="w-full py-4 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold rounded-xl hover:opacity-90 transition"
              >
                Réessayer
              </button>
              <button
                onClick={onClose}
                className="w-full py-3 text-gray-400 hover:text-white transition"
              >
                Annuler
              </button>
            </>
          ) : status === "downloading" ? (
            <div className="text-center text-sm text-gray-500">
              Ne fermez pas cette fenêtre...
            </div>
          ) : null}
        </div>
      </div>

      <style jsx>{`
        @keyframes scale-in {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-scale-in {
          animation: scale-in 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

/**
 * Hook to trigger download prompt after purchase
 */
export function useDownloadPrompt() {
  const [isOpen, setIsOpen] = useState(false);
  const [product, setProduct] = useState<{
    id: string;
    title: string;
    coverImage?: string;
  } | null>(null);

  function showPrompt(productData: {
    id: string;
    title: string;
    coverImage?: string;
  }) {
    setProduct(productData);
    setIsOpen(true);
  }

  function hidePrompt() {
    setIsOpen(false);
    setProduct(null);
  }

  return {
    isOpen,
    product,
    showPrompt,
    hidePrompt,
  };
}
