"use client";

import { useState } from "react";
import { Download, X, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

interface DownloadPromptProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    id: string;
    title: string;
    coverImage?: string;
  };
  onDownloadComplete: () => void;
}

export default function DownloadPrompt({
  isOpen,
  onClose,
  product,
  onDownloadComplete,
}: DownloadPromptProps) {
  const [status, setStatus] = useState<"idle" | "downloading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  if (!isOpen) return null;

  async function handleDownload() {
    setStatus("downloading");
    setErrorMessage("");

    try {
      const res = await fetch(`/api/library/sync`);
      if (!res.ok) throw new Error("Impossible de récupérer les informations de la bibliothèque");

      const data = await res.json();
      const item = data.products?.find(
        (p: { id: string; downloadUrl?: string }) => p.id === product.id
      );

      const downloadUrl = item?.downloadUrl || `/api/download/direct`;

      // Tenter le téléchargement du fichier
      let fileRes: Response;

      if (item?.downloadUrl) {
        fileRes = await fetch(item.downloadUrl);
      } else {
        // Fallback: essayer de télécharger directement via l'ID du produit
        fileRes = await fetch(`/api/pdf/${product.id}?platform=web`);
      }

      if (!fileRes.ok) {
        throw new Error("Le fichier n'est pas disponible pour le moment");
      }

      const blob = await fileRes.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `${product.title}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);

      setStatus("success");
      setTimeout(() => {
        onDownloadComplete();
        setStatus("idle");
      }, 2000);
    } catch (err: unknown) {
      setStatus("error");
      setErrorMessage(
        err instanceof Error ? err.message : "Erreur lors du téléchargement"
      );
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-2">
          <h3 className="text-lg font-semibold text-gray-900">
            Télécharger votre livre
          </h3>
          <button
            onClick={() => {
              onClose();
              setStatus("idle");
              setErrorMessage("");
            }}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 pb-6">
          {/* Product info */}
          <div className="flex items-center gap-4 my-4 p-3 bg-gray-50 rounded-xl">
            {product.coverImage && (
              <img
                src={product.coverImage}
                alt={product.title}
                className="w-16 h-20 object-cover rounded-lg shadow-sm"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate">
                {product.title}
              </p>
              <p className="text-sm text-gray-500 mt-1">Format PDF</p>
            </div>
          </div>

          {/* Status messages */}
          {status === "success" && (
            <div className="flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-lg mb-4">
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm">Téléchargement réussi !</p>
            </div>
          )}

          {status === "error" && (
            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg mb-4">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm">
                {errorMessage || "Erreur lors du téléchargement"}
              </p>
            </div>
          )}

          {/* Download button */}
          <button
            onClick={handleDownload}
            disabled={status === "downloading" || status === "success"}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {status === "downloading" ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Téléchargement en cours...
              </>
            ) : status === "success" ? (
              <>
                <CheckCircle className="w-5 h-5" />
                Téléchargé !
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                Télécharger le PDF
              </>
            )}
          </button>

          {/* Skip link */}
          <button
            onClick={() => {
              onClose();
              setStatus("idle");
            }}
            className="w-full text-center text-sm text-gray-500 hover:text-gray-700 mt-3 transition-colors"
          >
            Plus tard
          </button>
        </div>
      </div>
    </div>
  );
}
