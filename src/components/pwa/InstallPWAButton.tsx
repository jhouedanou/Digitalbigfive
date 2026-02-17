"use client";

import { useState, useEffect, useCallback } from "react";
import { Download, Monitor, Smartphone, X, Laptop, Apple, Chrome } from "lucide-react";

/**
 * Détecte la plateforme de l'utilisateur
 */
function detectPlatform(): "ios" | "android" | "windows" | "mac" | "linux" | "unknown" {
  if (typeof window === "undefined") return "unknown";
  const ua = navigator.userAgent.toLowerCase();
  const platform = (navigator as any).userAgentData?.platform?.toLowerCase() || navigator.platform?.toLowerCase() || "";
  
  if (/iphone|ipad|ipod/.test(ua)) return "ios";
  if (/android/.test(ua)) return "android";
  if (/win/.test(platform)) return "windows";
  if (/mac/.test(platform) && !/iphone|ipad/.test(ua)) return "mac";
  if (/linux/.test(platform)) return "linux";
  return "unknown";
}

/**
 * Vérifie si l'app est déjà en mode standalone (installée)
 */
function isAppInstalled(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: window-controls-overlay)").matches ||
    (window.navigator as any).standalone === true
  );
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/**
 * Composant Bouton d'installation PWA
 * Détecte automatiquement la plateforme et propose l'installation appropriée.
 * 
 * Sur Chrome/Edge (Windows, Linux, Mac, Android) : utilise beforeinstallprompt
 * Sur Safari/iOS : affiche les instructions manuelles
 */
export default function InstallPWAButton({ variant = "banner" }: { variant?: "banner" | "button" | "mini" }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [platform, setPlatform] = useState<ReturnType<typeof detectPlatform>>("unknown");
  const [installed, setInstalled] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    setPlatform(detectPlatform());
    setInstalled(isAppInstalled());

    // Check if user previously dismissed
    const wasDismissed = sessionStorage.getItem("pwa-install-dismissed");
    if (wasDismissed) setDismissed(true);

    // Listen for the install prompt event
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    // Listen for successful install
    const handleAppInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstall = useCallback(async () => {
    if (platform === "ios") {
      setShowIOSGuide(true);
      return;
    }

    if (!deferredPrompt) return;

    setInstalling(true);
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setInstalled(true);
      }
      setDeferredPrompt(null);
    } catch (err) {
      console.error("Install error:", err);
    } finally {
      setInstalling(false);
    }
  }, [deferredPrompt, platform]);

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem("pwa-install-dismissed", "true");
  };

  // Don't show if already installed or dismissed
  if (installed || dismissed) return null;

  // Don't show if no prompt available and not iOS (can't install)
  if (!deferredPrompt && platform !== "ios") return null;

  const platformLabel = {
    ios: "iPhone/iPad",
    android: "Android",
    windows: "Windows",
    mac: "Mac",
    linux: "Linux",
    unknown: "votre appareil",
  }[platform];

  const PlatformIcon = {
    ios: Smartphone,
    android: Smartphone,
    windows: Monitor,
    mac: Laptop,
    linux: Monitor,
    unknown: Download,
  }[platform];

  // ═══ iOS Guide Modal ═══
  if (showIOSGuide) {
    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="bg-[#2c2c2e] rounded-t-2xl sm:rounded-2xl w-full max-w-md mx-auto p-6 animate-slide-up">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-bold text-white">Installer sur {platformLabel}</h3>
            <button onClick={() => setShowIOSGuide(false)} className="p-1 rounded-full hover:bg-white/10">
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-[#FF9F0A]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-[#FF9F0A] font-bold text-sm">1</span>
              </div>
              <div>
                <p className="text-white text-sm font-medium">Appuyez sur le bouton Partager</p>
                <p className="text-gray-400 text-xs mt-0.5">L&apos;icône <span className="inline-block">⬆</span> en bas de Safari</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-[#FF9F0A]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-[#FF9F0A] font-bold text-sm">2</span>
              </div>
              <div>
                <p className="text-white text-sm font-medium">Faites défiler et appuyez sur</p>
                <p className="text-gray-400 text-xs mt-0.5">&quot;Sur l&apos;écran d&apos;accueil&quot; <span className="inline-block">➕</span></p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-[#FF9F0A]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-[#FF9F0A] font-bold text-sm">3</span>
              </div>
              <div>
                <p className="text-white text-sm font-medium">Confirmez en appuyant sur &quot;Ajouter&quot;</p>
                <p className="text-gray-400 text-xs mt-0.5">L&apos;app Big Five apparaîtra sur votre écran d&apos;accueil</p>
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowIOSGuide(false)}
            className="w-full mt-6 py-3 bg-[#FF9F0A] text-black font-semibold rounded-xl hover:bg-[#FFB340] transition"
          >
            Compris !
          </button>
        </div>

        <style jsx>{`
          @keyframes slideUp {
            from { transform: translateY(100%); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
          .animate-slide-up {
            animation: slideUp 0.3s ease-out;
          }
        `}</style>
      </div>
    );
  }

  // ═══ Mini variant (just an icon button) ═══
  if (variant === "mini") {
    return (
      <button
        onClick={handleInstall}
        className="flex items-center gap-2 px-3 py-2 bg-[#FF9F0A]/20 hover:bg-[#FF9F0A]/30 text-[#FF9F0A] rounded-lg transition text-xs font-medium border border-[#FF9F0A]/30"
        title={`Installer sur ${platformLabel}`}
      >
        <Download className="w-4 h-4" />
        <span>Installer</span>
      </button>
    );
  }

  // ═══ Button variant ═══
  if (variant === "button") {
    return (
      <button
        onClick={handleInstall}
        disabled={installing}
        className="flex items-center gap-3 px-5 py-3 bg-gradient-to-r from-[#80368D] to-[#29358B] hover:from-[#9040A0] hover:to-[#3545A0] text-white font-semibold rounded-xl transition-all shadow-lg shadow-purple-900/30 disabled:opacity-70"
      >
        {installing ? (
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <PlatformIcon className="w-5 h-5" />
        )}
        <span>Installer l&apos;app pour {platformLabel}</span>
      </button>
    );
  }

  // ═══ Banner variant (default) ═══
  return (
    <div className="relative bg-gradient-to-r from-[#80368D]/30 to-[#29358B]/30 border border-white/10 rounded-2xl p-4 backdrop-blur-sm">
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 p-1 rounded-full hover:bg-white/10 transition"
      >
        <X className="w-4 h-4 text-gray-500" />
      </button>

      <div className="flex items-center gap-4">
        {/* App icon */}
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#80368D] to-[#29358B] flex items-center justify-center flex-shrink-0 shadow-lg">
          <svg viewBox="0 0 512 512" className="w-9 h-9">
            <g transform="translate(100, 80)">
              <rect x="40" y="60" width="220" height="280" rx="8" fill="white" opacity="0.9"/>
              <circle cx="260" cy="280" r="50" fill="#29358B"/>
              <path d="M235 280 l15 15 l30 -30" stroke="white" strokeWidth="8" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            </g>
          </svg>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-white font-semibold text-sm">Installer Big Five</h3>
          <p className="text-gray-400 text-xs mt-0.5 line-clamp-1">
            Accédez à vos livres directement depuis votre {platformLabel}
          </p>
        </div>

        <button
          onClick={handleInstall}
          disabled={installing}
          className="px-4 py-2 bg-[#FF9F0A] hover:bg-[#FFB340] text-black text-sm font-semibold rounded-xl transition flex-shrink-0 disabled:opacity-70"
        >
          {installing ? (
            <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
          ) : (
            "Installer"
          )}
        </button>
      </div>
    </div>
  );
}
