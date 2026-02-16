"use client";

import { useState } from "react";
import { Download, Check, Loader2, WifiOff } from "lucide-react";
import { useOfflineDownload } from "@/hooks/useOfflineSync";
import { isPDFAvailableOffline } from "@/lib/offline-storage";

interface DownloadOfflineButtonProps {
  resourceId: string;
  resourceTitle: string;
  className?: string;
}

export default function DownloadOfflineButton({
  resourceId,
  resourceTitle,
  className = "",
}: DownloadOfflineButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { downloadForOffline } = useOfflineDownload();

  // Check if already downloaded on mount
  useState(() => {
    isPDFAvailableOffline(resourceId).then(setIsDownloaded);
  });

  const handleDownload = async () => {
    if (isDownloading || isDownloaded) return;

    setIsDownloading(true);
    setError(null);
    setProgress(0);

    const result = await downloadForOffline(resourceId, setProgress);

    setIsDownloading(false);

    if (result.success) {
      setIsDownloaded(true);
    } else {
      setError(result.error || "Erreur de téléchargement");
    }
  };

  if (!navigator.onLine) {
    return (
      <button
        disabled
        className={`flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-400 rounded-lg cursor-not-allowed ${className}`}
      >
        <WifiOff size={16} />
        <span>Hors ligne</span>
      </button>
    );
  }

  if (isDownloaded) {
    return (
      <button
        disabled
        className={`flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg ${className}`}
      >
        <Check size={16} />
        <span>Disponible offline</span>
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={handleDownload}
        disabled={isDownloading}
        className={`flex items-center gap-2 px-4 py-2 bg-[#80368D] text-white rounded-lg hover:bg-[#6a2d75] disabled:opacity-70 transition-all ${className}`}
      >
        {isDownloading ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            <span>{progress}%</span>
          </>
        ) : (
          <>
            <Download size={16} />
            <span>Télécharger offline</span>
          </>
        )}
      </button>

      {isDownloading && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/30 rounded-full overflow-hidden">
          <div
            className="h-full bg-white transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {error && (
        <p className="absolute top-full left-0 mt-1 text-xs text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}
