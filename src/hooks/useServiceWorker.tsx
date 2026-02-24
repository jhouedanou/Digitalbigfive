"use client";

/**
 * PWA désactivée — remplacée par l'app Electron.
 * Ce hook est conservé pour compatibilité mais ne fait plus rien.
 */
export function useServiceWorker() {
  return {
    isInstalled: false,
    isInstallable: false,
    installApp: async () => false,
    updateServiceWorker: () => {},
    swRegistration: null,
  };
}

// Component stub — ne rend rien
export function InstallPWAButton() {
  return null;
}
