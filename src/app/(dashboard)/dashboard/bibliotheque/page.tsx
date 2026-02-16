"use client";

import { useState, useEffect } from "react";
import { BookOpen, Download, Smartphone, Check, ArrowRight, Wifi, WifiOff, Cloud } from "lucide-react";
import { getAllPDFMetadata, cleanupExpiredPDFs, getStorageInfo } from "@/lib/offline-storage";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallLibraryPage() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [storageInfo, setStorageInfo] = useState({ totalPDFs: 0, totalSize: 0, availableSpace: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check online status
    setIsOnline(navigator.onLine);
    window.addEventListener("online", () => setIsOnline(true));
    window.addEventListener("offline", () => setIsOnline(false));

    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    // Listen for install prompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    // Load storage info
    loadData();

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      await cleanupExpiredPDFs();
      const info = await getStorageInfo();
      setStorageInfo(info);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleInstall() {
    if (!deferredPrompt) {
      // Fallback for browsers that don't support install prompt
      window.open("/library", "_blank");
      return;
    }

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === "accepted") {
      setIsInstalled(true);
    }
    
    setDeferredPrompt(null);
  }

  function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  const features = [
    {
      icon: WifiOff,
      title: "Lecture hors ligne",
      description: "Lisez vos PDFs sans connexion internet",
    },
    {
      icon: Smartphone,
      title: "Application native",
      description: "Ajoutez l'app à votre écran d'accueil",
    },
    {
      icon: BookOpen,
      title: "Interface iBooks",
      description: "Une bibliothèque élégante pour vos livres",
    },
    {
      icon: Cloud,
      title: "Synchronisation auto",
      description: "Vos achats se synchronisent automatiquement",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#80368D] to-[#29358B] rounded-2xl shadow-lg mb-6">
            <BookOpen className="w-10 h-10" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Ma Bibliothèque
          </h1>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            Installez l'application pour lire vos PDFs hors ligne, comme sur iBooks
          </p>
        </div>

        {/* Status card */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">État de votre bibliothèque</h3>
            <span className={`flex items-center gap-1 text-sm ${isOnline ? "text-green-400" : "text-orange-400"}`}>
              {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
              {isOnline ? "En ligne" : "Hors ligne"}
            </span>
          </div>
          
          {loading ? (
            <div className="animate-pulse space-y-2">
              <div className="h-4 bg-white/10 rounded w-1/2"></div>
              <div className="h-4 bg-white/10 rounded w-1/3"></div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
              <div className="bg-white/5 rounded-xl p-4">
                <p className="text-2xl font-bold text-[#80368D]">{storageInfo.totalPDFs}</p>
                <p className="text-sm text-gray-400">Livres téléchargés</p>
              </div>
              <div className="bg-white/5 rounded-xl p-4">
                <p className="text-2xl font-bold">{formatSize(storageInfo.totalSize)}</p>
                <p className="text-sm text-gray-400">Stockage utilisé</p>
              </div>
              <div className="bg-white/5 rounded-xl p-4 col-span-2 md:col-span-1">
                <p className="text-2xl font-bold text-green-400">{formatSize(storageInfo.availableSpace)}</p>
                <p className="text-sm text-gray-400">Espace disponible</p>
              </div>
            </div>
          )}
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="flex items-start gap-4 bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition"
            >
              <div className="w-10 h-10 bg-[#80368D]/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <feature.icon className="w-5 h-5 text-[#80368D]" />
              </div>
              <div>
                <h4 className="font-medium mb-1">{feature.title}</h4>
                <p className="text-sm text-gray-400">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Install button */}
        <div className="text-center space-y-4">
          {isInstalled ? (
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-green-500/20 text-green-400 rounded-xl">
              <Check className="w-5 h-5" />
              Application installée
            </div>
          ) : (
            <button
              onClick={handleInstall}
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[#80368D] to-[#29358B] rounded-xl font-semibold text-lg hover:opacity-90 transition shadow-lg"
            >
              <Download className="w-5 h-5" />
              Installer l'application
            </button>
          )}

          <div>
            <a
              href="/library"
              className="inline-flex items-center gap-2 text-[#80368D] hover:underline"
            >
              Ouvrir la bibliothèque dans le navigateur
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-12 bg-white/5 border border-white/10 rounded-2xl p-6">
          <h3 className="font-semibold mb-4">Comment ça marche ?</h3>
          <ol className="space-y-4 text-gray-300">
            <li className="flex gap-3">
              <span className="w-6 h-6 bg-[#80368D] rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">1</span>
              <span>Installez l'application "Ma Bibliothèque" sur votre appareil</span>
            </li>
            <li className="flex gap-3">
              <span className="w-6 h-6 bg-[#80368D] rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">2</span>
              <span>Connectez-vous une première fois pour synchroniser vos achats</span>
            </li>
            <li className="flex gap-3">
              <span className="w-6 h-6 bg-[#80368D] rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">3</span>
              <span>Vos PDFs sont téléchargés et disponibles même sans internet</span>
            </li>
            <li className="flex gap-3">
              <span className="w-6 h-6 bg-[#80368D] rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">4</span>
              <span>Lisez vos livres n'importe où, n'importe quand !</span>
            </li>
          </ol>
        </div>

        {/* iOS instructions */}
        <div className="mt-6 bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-sm">
          <p className="font-medium text-blue-400 mb-2">📱 Sur iPhone/iPad :</p>
          <p className="text-gray-300">
            Ouvrez <a href="/library" className="text-blue-400 underline">la bibliothèque</a> dans Safari, 
            puis appuyez sur le bouton Partager et sélectionnez "Sur l'écran d'accueil".
          </p>
        </div>
      </div>
    </div>
  );
}
