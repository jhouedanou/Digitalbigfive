"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Download,
  Monitor,
  Smartphone,
  X,
  Laptop,
  Apple,
  Chrome,
  ExternalLink,
  ChevronDown,
  AlertTriangle,
} from "lucide-react";

// ═══════════════════════════════════════════════
// Configuration des téléchargements
// ═══════════════════════════════════════════════
const APP_VERSION = "1.0.1";
const GITHUB_REPO = "jhouedanou/Digitalbigfive";
const GITHUB_RELEASES_BASE = `https://github.com/${GITHUB_REPO}/releases/latest/download`;

const DOWNLOAD_URLS = {
  windows: `${GITHUB_RELEASES_BASE}/Big.Five.Digital.Setup.${APP_VERSION}.exe`,
  mac_arm64: `${GITHUB_RELEASES_BASE}/Big.Five.Digital-${APP_VERSION}-arm64.dmg`,
  mac_x64: `${GITHUB_RELEASES_BASE}/Big.Five.Digital-${APP_VERSION}.dmg`,
  linux_appimage: `${GITHUB_RELEASES_BASE}/Big.Five.Digital-${APP_VERSION}.AppImage`,
  linux_deb: `${GITHUB_RELEASES_BASE}/digitalbigfive_${APP_VERSION}_amd64.deb`,
} as const;

type Platform = "ios" | "android" | "windows" | "mac" | "linux" | "unknown";

// ═══════════════════════════════════════════════
// Détection de plateforme
// ═══════════════════════════════════════════════
function detectPlatform(): Platform {
  if (typeof window === "undefined") return "unknown";
  const ua = navigator.userAgent.toLowerCase();
  const platform =
    (navigator as any).userAgentData?.platform?.toLowerCase() ||
    navigator.platform?.toLowerCase() ||
    "";

  if (/iphone|ipad|ipod/.test(ua)) return "ios";
  if (/android/.test(ua)) return "android";
  if (/win/.test(platform)) return "windows";
  if (/mac/.test(platform) && !/iphone|ipad/.test(ua)) return "mac";
  if (/linux/.test(platform)) return "linux";
  return "unknown";
}

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

// ═══════════════════════════════════════════════
// Infos par plateforme
// ═══════════════════════════════════════════════
const PLATFORM_INFO: Record<
  Platform,
  {
    label: string;
    icon: typeof Monitor;
    downloadLabel: string;
    description: string;
  }
> = {
  windows: {
    label: "Windows",
    icon: Monitor,
    downloadLabel: "Télécharger pour Windows",
    description: "Windows 10/11 — Installeur .exe",
  },
  mac: {
    label: "macOS",
    icon: Laptop,
    downloadLabel: "Télécharger pour Mac",
    description: "macOS 12+ — Fichier .dmg",
  },
  linux: {
    label: "Linux",
    icon: Monitor,
    downloadLabel: "Télécharger pour Linux",
    description: "Ubuntu/Debian — AppImage ou .deb",
  },
  ios: {
    label: "iPhone/iPad",
    icon: Smartphone,
    downloadLabel: "Installer l'app",
    description: "Ajoutez Big Five à votre écran d'accueil",
  },
  android: {
    label: "Android",
    icon: Smartphone,
    downloadLabel: "Installer l'app",
    description: "Ajoutez Big Five à votre écran d'accueil",
  },
  unknown: {
    label: "votre appareil",
    icon: Download,
    downloadLabel: "Télécharger",
    description: "Choisissez votre plateforme",
  },
};

// ═══════════════════════════════════════════════
// Composant principal
// ═══════════════════════════════════════════════
export default function DownloadAppButton({
  variant = "banner",
}: {
  variant?: "banner" | "full" | "compact";
}) {
  const [platform, setPlatform] = useState<Platform>("unknown");
  const [installed, setInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [showAllPlatforms, setShowAllPlatforms] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [installing, setInstalling] = useState(false);

  const isDesktop = ["windows", "mac", "linux"].includes(platform);
  const isMobile = ["ios", "android"].includes(platform);
  const info = PLATFORM_INFO[platform];

  useEffect(() => {
    setPlatform(detectPlatform());
    setInstalled(isAppInstalled());

    const wasDismissed = sessionStorage.getItem("download-app-dismissed");
    if (wasDismissed) setDismissed(true);

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

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

  // ─── Action principale ───
  const handleAction = useCallback(async () => {
    // Desktop → télécharger l'app Electron
    if (platform === "windows") {
      window.open(DOWNLOAD_URLS.windows, "_blank");
      return;
    }
    if (platform === "mac") {
      // Detect Apple Silicon vs Intel
      const isAppleSilicon = typeof navigator !== "undefined" && 
        (/arm/i.test(navigator.platform) || (navigator as any).userAgentData?.architecture === "arm");
      window.open(isAppleSilicon ? DOWNLOAD_URLS.mac_arm64 : DOWNLOAD_URLS.mac_x64, "_blank");
      return;
    }
    if (platform === "linux") {
      window.open(DOWNLOAD_URLS.linux_appimage, "_blank");
      return;
    }

    // iOS → guide manuel
    if (platform === "ios") {
      setShowIOSGuide(true);
      return;
    }

    // Android / autres → PWA prompt
    if (deferredPrompt) {
      setInstalling(true);
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === "accepted") setInstalled(true);
        setDeferredPrompt(null);
      } catch (err) {
        console.error("Install error:", err);
      } finally {
        setInstalling(false);
      }
    }
  }, [platform, deferredPrompt]);

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem("download-app-dismissed", "true");
  };

  // Ne pas afficher si déjà installé ou fermé
  if (installed || dismissed) return null;

  // Sur mobile sans prompt PWA et pas iOS, ne rien afficher
  if (isMobile && !deferredPrompt && platform !== "ios") return null;

  // ═══════════════════════════════════════════════
  // Modal guide iOS
  // ═══════════════════════════════════════════════
  if (showIOSGuide) {
    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="bg-[#2c2c2e] rounded-t-2xl sm:rounded-2xl w-full max-w-md mx-auto p-6 animate-slide-up">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-bold text-white">
              Installer sur iPhone/iPad
            </h3>
            <button
              onClick={() => setShowIOSGuide(false)}
              className="p-1 rounded-full hover:bg-white/10"
              title="Fermer"
              aria-label="Fermer le guide"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          <div className="space-y-4">
            {[
              {
                step: "1",
                title: 'Appuyez sur le bouton Partager',
                desc: "L'icône ⬆ en bas de Safari",
              },
              {
                step: "2",
                title: 'Faites défiler et appuyez sur',
                desc: '"Sur l\'écran d\'accueil" ➕',
              },
              {
                step: "3",
                title: 'Confirmez en appuyant sur "Ajouter"',
                desc: "L'app apparaîtra sur votre écran d'accueil",
              },
            ].map(({ step, title, desc }) => (
              <div key={step} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[#FF9F0A]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-[#FF9F0A] font-bold text-sm">
                    {step}
                  </span>
                </div>
                <div>
                  <p className="text-white text-sm font-medium">{title}</p>
                  <p className="text-gray-400 text-xs mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
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
            from {
              transform: translateY(100%);
              opacity: 0;
            }
            to {
              transform: translateY(0);
              opacity: 1;
            }
          }
          .animate-slide-up {
            animation: slideUp 0.3s ease-out;
          }
        `}</style>
      </div>
    );
  }

  const PlatformIcon = info.icon;

  // ═══════════════════════════════════════════════
  // Variante FULL — Section complète avec toutes les plateformes
  // ═══════════════════════════════════════════════
  if (variant === "full") {
    return (
      <div className="relative overflow-hidden rounded-3xl border border-gray-200/80 bg-gradient-to-br from-[#f8f7ff] via-white to-[#f0eef9] p-8 sm:p-10 shadow-sm">
        {/* Decorative background circles */}
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-[#29358B]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-[#80368D]/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-center gap-5 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#80368D] to-[#29358B] flex items-center justify-center flex-shrink-0 shadow-md">
              <svg viewBox="0 0 512 512" className="w-8 h-8">
                <g transform="translate(100, 80)">
                  <rect
                    x="40"
                    y="60"
                    width="220"
                    height="280"
                    rx="8"
                    fill="white"
                    opacity="0.9"
                  />
                  <circle cx="260" cy="280" r="50" fill="#29358B" />
                  <path
                    d="M235 280 l15 15 l30 -30"
                    stroke="white"
                    strokeWidth="8"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </g>
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Télécharger Big Five Digital
              </h2>
              <p className="text-gray-500 text-sm mt-0.5">
                Accédez à vos livres hors-ligne depuis votre{" "}
                {isDesktop ? "ordinateur" : "appareil"}
              </p>
            </div>
          </div>

          {/* Bouton principal */}
          <div className="mb-5">
            <button
              onClick={handleAction}
              disabled={installing}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-[#80368D] to-[#29358B] hover:from-[#9040A0] hover:to-[#3545A0] text-white font-semibold rounded-2xl transition-all shadow-md hover:shadow-lg disabled:opacity-70"
            >
              {installing ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <PlatformIcon className="w-5 h-5" />
              )}
              <span>{info.downloadLabel}</span>
              {isDesktop && <ExternalLink className="w-4 h-4 ml-1 opacity-60" />}
            </button>
            <p className="text-center text-gray-400 text-xs mt-2.5">
              {info.description}
            </p>
          </div>

          {/* Avertissement app non signée */}
          {isDesktop && (
            <div className="flex items-start gap-3 p-3.5 bg-amber-50 border border-amber-200/60 rounded-xl mb-5">
              <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-amber-700">
                <p className="font-medium mb-1">
                  Un avertissement de sécurité apparaîtra à l&apos;installation
                </p>
                <p className="text-amber-600">
                  {platform === "windows"
                    ? "Windows SmartScreen : cliquez « Informations complémentaires » puis « Exécuter quand même »."
                    : platform === "mac"
                    ? "macOS : allez dans Réglages Système → Confidentialité et sécurité → « Ouvrir quand même »."
                    : "L'application n'est pas encore signée. Autorisez-la manuellement après le téléchargement."}
                </p>
              </div>
            </div>
          )}

          {/* Autres plateformes */}
          {isDesktop && (
            <>
              <button
                onClick={() => setShowAllPlatforms(!showAllPlatforms)}
                className="w-full flex items-center justify-center gap-2 text-gray-400 hover:text-gray-600 text-sm py-2 transition"
              >
                <span>Autres plateformes</span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${showAllPlatforms ? "rotate-180" : ""}`}
                />
              </button>

              {showAllPlatforms && (
                <div className="mt-3 space-y-2 border-t border-gray-200/80 pt-4">
                  {platform !== "windows" && (
                    <a
                      href={DOWNLOAD_URLS.windows}
                      className="flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 border border-gray-200/60 rounded-2xl transition group"
                    >
                      <Monitor className="w-5 h-5 text-gray-400 group-hover:text-gray-700" />
                      <div className="flex-1">
                        <span className="text-gray-800 text-sm font-medium">
                          Windows
                        </span>
                        <span className="text-gray-400 text-xs ml-2">
                          .exe — Windows 10/11
                        </span>
                      </div>
                      <Download className="w-4 h-4 text-gray-400" />
                    </a>
                  )}

                  {platform !== "mac" && (
                    <a
                      href={DOWNLOAD_URLS.mac_arm64}
                      className="flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 border border-gray-200/60 rounded-2xl transition group"
                    >
                      <Laptop className="w-5 h-5 text-gray-400 group-hover:text-gray-700" />
                      <div className="flex-1">
                        <span className="text-gray-800 text-sm font-medium">
                          macOS
                        </span>
                        <span className="text-gray-400 text-xs ml-2">
                          .dmg — Apple Silicon (M1/M2/M3)
                        </span>
                      </div>
                      <Download className="w-4 h-4 text-gray-400" />
                    </a>
                  )}

                  {platform !== "mac" && (
                    <a
                      href={DOWNLOAD_URLS.mac_x64}
                      className="flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 border border-gray-200/60 rounded-2xl transition group"
                    >
                      <Laptop className="w-5 h-5 text-gray-400 group-hover:text-gray-700" />
                      <div className="flex-1">
                        <span className="text-gray-800 text-sm font-medium">
                          macOS
                        </span>
                        <span className="text-gray-400 text-xs ml-2">
                          .dmg — Intel
                        </span>
                      </div>
                      <Download className="w-4 h-4 text-gray-400" />
                    </a>
                  )}

                  {platform !== "linux" && (
                    <a
                      href={DOWNLOAD_URLS.linux_appimage}
                      className="flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 border border-gray-200/60 rounded-2xl transition group"
                    >
                      <Monitor className="w-5 h-5 text-gray-400 group-hover:text-gray-700" />
                      <div className="flex-1">
                        <span className="text-gray-800 text-sm font-medium">
                          Linux
                        </span>
                        <span className="text-gray-400 text-xs ml-2">
                          .AppImage — Universel
                        </span>
                      </div>
                      <Download className="w-4 h-4 text-gray-400" />
                    </a>
                  )}

                  {platform === "linux" && (
                    <a
                      href={DOWNLOAD_URLS.linux_deb}
                      className="flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 border border-gray-200/60 rounded-2xl transition group"
                    >
                      <Monitor className="w-5 h-5 text-gray-400 group-hover:text-gray-700" />
                      <div className="flex-1">
                        <span className="text-gray-800 text-sm font-medium">
                          Linux .deb
                        </span>
                        <span className="text-gray-400 text-xs ml-2">
                          Ubuntu / Debian
                        </span>
                      </div>
                      <Download className="w-4 h-4 text-gray-400" />
                    </a>
                  )}
                </div>
              )}
            </>
          )}

          {/* Lien PWA alternatif pour desktop */}
          {isDesktop && deferredPrompt && (
            <div className="mt-4 pt-4 border-t border-gray-200/80 text-center">
              <button
                onClick={async () => {
                  if (deferredPrompt) {
                    await deferredPrompt.prompt();
                    const { outcome } = await deferredPrompt.userChoice;
                    if (outcome === "accepted") setInstalled(true);
                    setDeferredPrompt(null);
                  }
                }}
                className="text-gray-400 hover:text-[#80368D] text-sm transition inline-flex items-center gap-1"
              >
                <Chrome className="w-4 h-4" />
                <span>
                  Ou installer en tant qu&apos;app web (PWA)
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════
  // Variante COMPACT — Petit bouton inline
  // ═══════════════════════════════════════════════
  if (variant === "compact") {
    return (
      <button
        onClick={handleAction}
        disabled={installing}
        className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#80368D] to-[#29358B] hover:from-[#9040A0] hover:to-[#3545A0] text-white text-sm font-semibold rounded-xl transition-all shadow-md disabled:opacity-70"
      >
        {installing ? (
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : isDesktop ? (
          <Download className="w-4 h-4" />
        ) : (
          <PlatformIcon className="w-4 h-4" />
        )}
        <span>
          {isDesktop
            ? `Télécharger (${info.label})`
            : info.downloadLabel}
        </span>
      </button>
    );
  }

  // ═══════════════════════════════════════════════
  // Variante BANNER (défaut) — Bannière discrète
  // ═══════════════════════════════════════════════
  return (
    <div className="relative bg-gradient-to-r from-[#80368D]/20 to-[#29358B]/20 border border-white/10 rounded-2xl p-4 backdrop-blur-sm">
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 p-1 rounded-full hover:bg-white/10 transition"
        title="Fermer"
        aria-label="Fermer la bannière"
      >
        <X className="w-4 h-4 text-gray-500" />
      </button>

      <div className="flex items-center gap-4">
        {/* App icon */}
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#80368D] to-[#29358B] flex items-center justify-center flex-shrink-0 shadow-lg">
          <svg viewBox="0 0 512 512" className="w-9 h-9">
            <g transform="translate(100, 80)">
              <rect
                x="40"
                y="60"
                width="220"
                height="280"
                rx="8"
                fill="white"
                opacity="0.9"
              />
              <circle cx="260" cy="280" r="50" fill="#29358B" />
              <path
                d="M235 280 l15 15 l30 -30"
                stroke="white"
                strokeWidth="8"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
          </svg>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-white font-semibold text-sm">
            {isDesktop
              ? "📥 Téléchargez l'app Big Five"
              : "📱 Installez Big Five"}
          </h3>
          <p className="text-gray-400 text-xs mt-0.5 line-clamp-2">
            {isDesktop
              ? `Lisez vos livres hors-ligne sur ${info.label}`
              : `Accédez à vos livres depuis votre ${info.label}`}
          </p>
        </div>

        <button
          onClick={handleAction}
          disabled={installing}
          className="px-4 py-2 bg-[#FF9F0A] hover:bg-[#FFB340] text-black text-sm font-semibold rounded-xl transition flex-shrink-0 disabled:opacity-70"
        >
          {installing ? (
            <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
          ) : isDesktop ? (
            "Télécharger"
          ) : (
            "Installer"
          )}
        </button>
      </div>
    </div>
  );
}
