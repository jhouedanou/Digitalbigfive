"use client";

import { useState } from "react";
import {
  Download,
  Apple,
  Monitor,
  Smartphone,
  Laptop,
  Check,
  ExternalLink,
  Shield,
  Wifi,
  BookOpen,
  Cloud,
  RefreshCw,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";

// Platform icons (inline SVGs for better control)
function WindowsIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.9-1.801" />
    </svg>
  );
}

function LinuxIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M12.504 0c-.155 0-.315.008-.48.021-4.226.333-3.105 4.807-3.17 6.298-.076 1.092-.3 1.953-1.05 3.02-.885 1.051-2.127 2.75-2.716 4.521-.278.832-.41 1.684-.287 2.489a.424.424 0 00-.11.135c-.26.268-.45.6-.663.839-.199.199-.485.267-.797.4-.313.136-.658.269-.864.68-.09.189-.136.394-.132.602 0 .199.027.4.055.536.058.399.116.728.04.97-.249.68-.28 1.145-.106 1.484.174.334.535.47.94.601.81.2 1.91.135 2.774.6.926.466 1.866.67 2.616.47.526-.116.97-.464 1.208-.946.587-.003 1.23-.269 2.26-.334.699-.058 1.574.267 2.577.2.025.134.063.198.114.333l.003.003c.391.778 1.113 1.132 1.884 1.071.771-.06 1.592-.536 2.257-1.306.631-.765 1.683-1.084 2.378-1.503.348-.199.629-.469.649-.853.023-.4-.2-.811-.714-1.376v-.097l-.003-.003c-.17-.2-.25-.535-.338-.926-.085-.401-.182-.786-.492-1.046h-.003c-.059-.054-.123-.067-.188-.135a.357.357 0 00-.19-.064c.431-1.278.264-2.55-.173-3.694-.533-1.41-1.465-2.638-2.175-3.483-.796-1.005-1.576-1.957-1.56-3.368.026-2.152.236-6.133-3.544-6.139zm.529 3.405h.013c.213 0 .396.062.584.198.19.135.33.332.438.533.105.259.158.459.166.724 0-.02.006-.04.006-.06v.105a.086.086 0 01-.004-.021l-.004-.024a1.807 1.807 0 01-.15.706.953.953 0 01-.213.335.71.71 0 00-.088-.042c-.104-.045-.198-.064-.284-.133a1.312 1.312 0 00-.22-.066c.05-.06.146-.133.183-.198.053-.128.082-.264.088-.402v-.02a1.21 1.21 0 00-.061-.4c-.045-.134-.101-.2-.183-.333-.084-.066-.167-.132-.267-.132h-.016c-.093 0-.176.03-.262.132a.8.8 0 00-.205.334 1.18 1.18 0 00-.09.468v.018c.003.2.065.403.149.536.079.131.183.232.293.334a.694.694 0 00-.159.063c-.104.037-.215.169-.273.301-.07.135-.143.2-.261.334-.213.023-.444.067-.692.093-.37.03-.76-.03-1.105-.198l.032-.033a2.2 2.2 0 01-.238-.334c-.09-.133-.154-.267-.166-.4-.012-.135-.012-.267.018-.334.018-.134.1-.267.149-.4.052-.132.076-.267.031-.4-.023-.133-.1-.2-.213-.267-.107-.067-.228-.067-.336-.067-.128 0-.242.067-.303.134-.062.065-.097.132-.15.197a1.03 1.03 0 00-.09.468c-.009.2.033.4.126.533.09.133.208.267.333.4-.147.067-.286.134-.45.2l-.005-.005a1.74 1.74 0 01-.32-.4 2.08 2.08 0 01-.18-.599c-.022-.2 0-.402.077-.535.07-.135.197-.267.35-.4.15-.134.348-.268.564-.401.19-.134.35-.267.444-.535a.612.612 0 00-.044-.535c-.062-.134-.17-.267-.309-.4a1.84 1.84 0 00-.412-.267c-.134-.067-.28-.1-.408-.067-.018.003-.034.009-.051.012-.07-.003-.141-.003-.213-.003z" />
    </svg>
  );
}

function AndroidIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-.9997s.4483-.9993.9993-.9993c.5511 0 .9993.4483.9993.9993.0001.5511-.4482.9997-.9993.9997m-11.046 0c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4483.9993.9993 0 .5511-.4483.9997-.9993.9997m11.4045-6.02l1.9973-3.4592a.416.416 0 00-.1521-.5676.416.416 0 00-.5676.1521l-2.0223 3.503C15.5902 8.2439 13.8533 7.8508 12 7.8508s-3.5902.3931-5.1367 1.0989L4.841 5.4467a.4161.4161 0 00-.5677-.1521.4157.4157 0 00-.1521.5676l1.9973 3.4592C2.6889 11.1867.3432 14.6589 0 18.761h24c-.3435-4.1021-2.6892-7.5743-6.1185-9.4396" />
    </svg>
  );
}

interface PlatformApp {
  id: string;
  name: string;
  platform: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  downloadUrl?: string;
  status: "available" | "coming-soon" | "beta" | "pwa";
  version?: string;
  size?: string;
  requirements?: string;
}

const APP_VERSION = "1.0.1";
const GITHUB_REPO = "jhouedanou/Digitalbigfive";
const GITHUB_RELEASES_BASE = `https://github.com/${GITHUB_REPO}/releases/latest/download`;

const PLATFORMS: PlatformApp[] = [
  {
    id: "ios",
    name: "iOS",
    platform: "iPhone & iPad",
    icon: Apple,
    description: "Installez l'application web progressive (PWA) directement depuis Safari. Appuyez sur Partager puis 'Sur l'écran d'accueil' pour une expérience native avec lecture hors ligne.",
    downloadUrl: "/library",
    status: "pwa",
    version: APP_VERSION,
    size: "Légère",
    requirements: "iOS 14.0+ avec Safari",
  },
  {
    id: "android",
    name: "Android",
    platform: "Smartphones & Tablettes",
    icon: AndroidIcon,
    description: "Installez l'application web progressive (PWA) depuis Chrome. Appuyez sur le menu ⋮ puis 'Installer l'application' pour une expérience native avec mode hors ligne.",
    downloadUrl: "/library",
    status: "pwa",
    version: APP_VERSION,
    size: "Légère",
    requirements: "Android 8.0+ avec Chrome",
  },
  {
    id: "macos",
    name: "macOS",
    platform: "Mac",
    icon: Apple,
    description: "Application native pour Mac avec intégration système et Touch Bar",
    downloadUrl: `${GITHUB_RELEASES_BASE}/Big.Five.Digital-${APP_VERSION}-arm64.dmg`,
    status: "available",
    version: APP_VERSION,
    size: "217 MB",
    requirements: "macOS 12.0 (Monterey) ou ultérieur",
  },
  {
    id: "windows",
    name: "Windows",
    platform: "PC",
    icon: WindowsIcon,
    description: "Application Windows avec support du mode tablette et stylet",
    downloadUrl: `${GITHUB_RELEASES_BASE}/Big.Five.Digital.Setup.${APP_VERSION}.exe`,
    status: "available",
    version: APP_VERSION,
    size: "168 MB",
    requirements: "Windows 10/11 (64-bit)",
  },
  {
    id: "linux",
    name: "Linux",
    platform: "Ubuntu, Fedora, Debian...",
    icon: LinuxIcon,
    description: "Application AppImage compatible avec toutes les distributions",
    downloadUrl: `${GITHUB_RELEASES_BASE}/Big.Five.Digital-${APP_VERSION}.AppImage`,
    status: "available",
    version: APP_VERSION,
    size: "284 MB",
    requirements: "Ubuntu 20.04+, Fedora 35+, ou équivalent",
  },
];

const FEATURES = [
  {
    icon: Wifi,
    title: "Lecture hors ligne",
    description: "Téléchargez vos livres et lisez-les sans connexion internet",
  },
  {
    icon: Cloud,
    title: "Synchronisation cloud",
    description: "Votre progression et vos marque-pages synchronisés sur tous vos appareils",
  },
  {
    icon: BookOpen,
    title: "Interface Apple Books",
    description: "Une expérience de lecture premium inspirée des meilleures applications",
  },
  {
    icon: Shield,
    title: "Sécurisé",
    description: "Vos livres sont protégés et liés à votre compte personnel",
  },
];

export default function AppsDownloadPage() {
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [notifyEmail, setNotifyEmail] = useState("");
  const [notifySubmitted, setNotifySubmitted] = useState<string | null>(null);

  async function handleNotifySubmit(platformId: string) {
    if (!notifyEmail) return;

    // In production, this would call an API to store the email
    console.log(`Notify ${notifyEmail} for ${platformId}`);
    setNotifySubmitted(platformId);
    setNotifyEmail("");

    // Reset after delay
    setTimeout(() => {
      setNotifySubmitted(null);
      setSelectedPlatform(null);
    }, 3000);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-pink-500/20 blur-3xl" />
        
        <div className="relative max-w-6xl mx-auto px-4 py-16 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-sm mb-6">
            <RefreshCw className="w-4 h-4 text-orange-400" />
            Applications bientôt disponibles
          </div>

          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-orange-400 to-pink-500 bg-clip-text text-transparent">
            Votre bibliothèque, partout
          </h1>

          <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-8">
            Téléchargez nos applications natives pour lire vos livres sur tous vos appareils, 
            même hors connexion.
          </p>

          {/* Device Illustration */}
          <div className="flex justify-center items-end gap-4 mb-12">
            <div className="w-16 h-24 bg-gradient-to-b from-gray-700 to-gray-800 rounded-lg shadow-xl flex items-center justify-center">
              <Smartphone className="w-8 h-8 text-gray-400" />
            </div>
            <div className="w-32 h-40 bg-gradient-to-b from-gray-700 to-gray-800 rounded-xl shadow-xl flex items-center justify-center">
              <Monitor className="w-12 h-12 text-gray-400" />
            </div>
            <div className="w-24 h-32 bg-gradient-to-b from-gray-700 to-gray-800 rounded-lg shadow-xl flex items-center justify-center">
              <Laptop className="w-10 h-10 text-gray-400" />
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 mb-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {FEATURES.map((feature, index) => (
            <div
              key={index}
              className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center hover:bg-white/10 transition"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500/20 to-pink-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                <feature.icon className="w-6 h-6 text-orange-400" />
              </div>
              <h3 className="font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-400">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Platforms */}
      <section className="max-w-4xl mx-auto px-4">
        <h2 className="text-2xl font-bold text-center mb-8">
          Choisissez votre plateforme
        </h2>

        <div className="space-y-4">
          {PLATFORMS.map((platform) => (
            <div
              key={platform.id}
              className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden"
            >
              <div
                className="flex items-center gap-4 p-6 cursor-pointer hover:bg-white/5 transition"
                onClick={() =>
                  setSelectedPlatform(
                    selectedPlatform === platform.id ? null : platform.id
                  )
                }
              >
                {/* Icon */}
                <div className="w-14 h-14 bg-gradient-to-br from-white/10 to-white/5 rounded-xl flex items-center justify-center flex-shrink-0">
                  <platform.icon className="w-8 h-8" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{platform.name}</h3>
                    {platform.status === "coming-soon" && (
                      <span className="text-xs px-2 py-0.5 bg-orange-500/20 text-orange-400 rounded-full">
                        Bientôt
                      </span>
                    )}
                    {platform.status === "beta" && (
                      <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full">
                        Bêta
                      </span>
                    )}
                    {platform.status === "pwa" && (
                      <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full">
                        PWA
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-400">{platform.platform}</p>
                </div>

                {/* Action */}
                <div className="flex items-center gap-3">
                  {platform.status === "available" ? (
                    <a
                      href={platform.downloadUrl}
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-pink-500 rounded-lg font-medium hover:opacity-90 transition"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Download className="w-4 h-4" />
                      Télécharger
                    </a>
                  ) : platform.status === "pwa" ? (
                    <Link
                      href="/library"
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg font-medium hover:opacity-90 transition"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="w-4 h-4" />
                      Installer
                    </Link>
                  ) : (
                    <ChevronRight
                      className={`w-5 h-5 text-gray-400 transition-transform ${
                        selectedPlatform === platform.id ? "rotate-90" : ""
                      }`}
                    />
                  )}
                </div>
              </div>

              {/* Expanded Content */}
              {selectedPlatform === platform.id && (
                <div className="px-6 pb-6 border-t border-white/10 pt-4">
                  <p className="text-gray-300 mb-4">{platform.description}</p>

                  <div className="grid grid-cols-3 gap-4 mb-6 text-sm">
                    {platform.version && (
                      <div>
                        <p className="text-gray-500">Version</p>
                        <p className="font-medium">{platform.version}</p>
                      </div>
                    )}
                    {platform.size && (
                      <div>
                        <p className="text-gray-500">Taille</p>
                        <p className="font-medium">{platform.size}</p>
                      </div>
                    )}
                    {platform.requirements && (
                      <div>
                        <p className="text-gray-500">Configuration</p>
                        <p className="font-medium">{platform.requirements}</p>
                      </div>
                    )}
                  </div>

                  {platform.status === "pwa" ? (
                    <div className="space-y-4">
                      <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                        <h4 className="font-medium text-sm mb-2 text-green-400">📱 Comment installer :</h4>
                        {platform.id === "ios" ? (
                          <ol className="text-sm text-gray-400 space-y-1 list-decimal list-inside">
                            <li>Ouvrez la bibliothèque dans <strong className="text-white">Safari</strong></li>
                            <li>Appuyez sur l&apos;icône <strong className="text-white">Partager</strong> (↑)</li>
                            <li>Sélectionnez <strong className="text-white">&quot;Sur l&apos;écran d&apos;accueil&quot;</strong></li>
                            <li>Confirmez en appuyant sur <strong className="text-white">Ajouter</strong></li>
                          </ol>
                        ) : (
                          <ol className="text-sm text-gray-400 space-y-1 list-decimal list-inside">
                            <li>Ouvrez la bibliothèque dans <strong className="text-white">Chrome</strong></li>
                            <li>Appuyez sur le menu <strong className="text-white">⋮</strong> (trois points)</li>
                            <li>Sélectionnez <strong className="text-white">&quot;Installer l&apos;application&quot;</strong></li>
                            <li>Confirmez l&apos;installation</li>
                          </ol>
                        )}
                      </div>
                      <Link
                        href="/library"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl font-medium hover:opacity-90 transition"
                      >
                        <ExternalLink className="w-5 h-5" />
                        Ouvrir la bibliothèque
                      </Link>
                    </div>
                  ) : platform.status === "coming-soon" ? (
                    notifySubmitted === platform.id ? (
                      <div className="flex items-center gap-2 text-green-400">
                        <Check className="w-5 h-5" />
                        Vous serez notifié lors de la sortie !
                      </div>
                    ) : (
                      <div className="flex gap-3">
                        <input
                          type="email"
                          placeholder="votre@email.com"
                          value={notifyEmail}
                          onChange={(e) => setNotifyEmail(e.target.value)}
                          className="flex-1 bg-white/10 border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                        />
                        <button
                          onClick={() => handleNotifySubmit(platform.id)}
                          disabled={!notifyEmail}
                          className="px-6 py-2 bg-gradient-to-r from-orange-500 to-pink-500 rounded-lg font-medium hover:opacity-90 transition disabled:opacity-50"
                        >
                          Me notifier
                        </button>
                      </div>
                    )
                  ) : (
                    <a
                      href={platform.downloadUrl}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-pink-500 rounded-xl font-medium hover:opacity-90 transition"
                    >
                      <Download className="w-5 h-5" />
                      Télécharger pour {platform.name}
                    </a>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Web App Fallback */}
      <section className="max-w-4xl mx-auto px-4 mt-12">
        <div className="bg-gradient-to-r from-orange-500/10 to-pink-500/10 border border-orange-500/20 rounded-2xl p-8 text-center">
          <h3 className="text-xl font-semibold mb-3">
            Pas envie d'installer une app ?
          </h3>
          <p className="text-gray-400 mb-6">
            Utilisez notre application web progressive directement dans votre navigateur.
            Elle fonctionne aussi hors ligne !
          </p>
          <Link
            href="/library"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 rounded-xl font-medium hover:bg-white/20 transition"
          >
            <BookOpen className="w-5 h-5" />
            Ouvrir la bibliothèque web
            <ExternalLink className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-4xl mx-auto px-4 mt-16">
        <h2 className="text-2xl font-bold text-center mb-8">
          Questions fréquentes
        </h2>

        <div className="space-y-4">
          <details className="group bg-white/5 border border-white/10 rounded-xl">
            <summary className="flex items-center justify-between p-6 cursor-pointer">
              <span className="font-medium">
                Mes livres seront-ils synchronisés automatiquement ?
              </span>
              <ChevronRight className="w-5 h-5 text-gray-400 transition-transform group-open:rotate-90" />
            </summary>
            <div className="px-6 pb-6 text-gray-400">
              Oui ! Dès que vous achetez un livre, il apparaît automatiquement dans 
              votre bibliothèque sur tous vos appareils connectés. Votre progression 
              de lecture et vos marque-pages sont également synchronisés.
            </div>
          </details>

          <details className="group bg-white/5 border border-white/10 rounded-xl">
            <summary className="flex items-center justify-between p-6 cursor-pointer">
              <span className="font-medium">
                Comment fonctionne le mode hors ligne ?
              </span>
              <ChevronRight className="w-5 h-5 text-gray-400 transition-transform group-open:rotate-90" />
            </summary>
            <div className="px-6 pb-6 text-gray-400">
              Une fois un livre téléchargé, il est stocké de manière sécurisée sur 
              votre appareil. Vous pouvez le lire sans aucune connexion internet. 
              Les fichiers sont chiffrés et liés à votre compte pour garantir leur sécurité.
            </div>
          </details>

          <details className="group bg-white/5 border border-white/10 rounded-xl">
            <summary className="flex items-center justify-between p-6 cursor-pointer">
              <span className="font-medium">
                Sur combien d'appareils puis-je lire ?
              </span>
              <ChevronRight className="w-5 h-5 text-gray-400 transition-transform group-open:rotate-90" />
            </summary>
            <div className="px-6 pb-6 text-gray-400">
              Vous pouvez installer l'application sur un nombre illimité d'appareils 
              et lire vos livres partout. Cependant, pour des raisons de sécurité, 
              seuls 3 appareils peuvent stocker des livres hors ligne simultanément.
            </div>
          </details>

          <details className="group bg-white/5 border border-white/10 rounded-xl">
            <summary className="flex items-center justify-between p-6 cursor-pointer">
              <span className="font-medium">
                L'application est-elle gratuite ?
              </span>
              <ChevronRight className="w-5 h-5 text-gray-400 transition-transform group-open:rotate-90" />
            </summary>
            <div className="px-6 pb-6 text-gray-400">
              Oui, l'application est entièrement gratuite. Elle vous permet simplement 
              d'accéder aux livres que vous avez achetés de manière plus confortable.
            </div>
          </details>
        </div>
      </section>
    </div>
  );
}
