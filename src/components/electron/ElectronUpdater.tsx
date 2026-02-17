"use client";

import { useState, useEffect } from "react";
import { Download, RefreshCw, X } from "lucide-react";

export default function ElectronUpdater() {
  const [updateInfo, setUpdateInfo] = useState<{
    status: "available" | "downloaded";
    version: string;
  } | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const api = window.electronAPI;
    if (!api) return;

    const cleanupAvailable = api.onUpdateAvailable((info) => {
      setUpdateInfo({ status: "available", version: info.version });
      setDismissed(false);
    });

    const cleanupDownloaded = api.onUpdateDownloaded((info) => {
      setUpdateInfo({ status: "downloaded", version: info.version });
      setDismissed(false);
    });

    return () => {
      cleanupAvailable();
      cleanupDownloaded();
    };
  }, []);

  if (!updateInfo || dismissed) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm animate-in slide-in-from-bottom-4">
      <div className="bg-[#1e1e2e] border border-white/10 rounded-xl p-4 shadow-2xl">
        <button
          onClick={() => setDismissed(true)}
          className="absolute top-2 right-2 p-1 rounded-full hover:bg-white/10 transition"
        >
          <X className="w-4 h-4 text-gray-400" />
        </button>

        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FF9F0A]/20 flex items-center justify-center flex-shrink-0">
            {updateInfo.status === "downloaded" ? (
              <RefreshCw className="w-5 h-5 text-[#FF9F0A]" />
            ) : (
              <Download className="w-5 h-5 text-[#FF9F0A]" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="text-white font-semibold text-sm">
              {updateInfo.status === "downloaded"
                ? "Mise à jour prête"
                : "Mise à jour disponible"}
            </h4>
            <p className="text-gray-400 text-xs mt-0.5">
              Version {updateInfo.version}
              {updateInfo.status === "downloaded"
                ? " — Redémarrez pour installer"
                : " — Téléchargement en cours..."}
            </p>

            {updateInfo.status === "downloaded" && (
              <button
                onClick={() => window.electronAPI?.installUpdate()}
                className="mt-2 px-4 py-1.5 bg-[#FF9F0A] hover:bg-[#FFB340] text-black text-xs font-semibold rounded-lg transition"
              >
                Redémarrer et installer
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
