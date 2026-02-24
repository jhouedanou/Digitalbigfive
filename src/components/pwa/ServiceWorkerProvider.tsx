"use client";

import { useEffect } from "react";

interface ServiceWorkerProviderProps {
  children: React.ReactNode;
}

export function ServiceWorkerProvider({ children }: ServiceWorkerProviderProps) {
  useEffect(() => {
    // PWA désactivée — remplacée par l'app Electron.
    // Désenregistrer tout ancien Service Worker pour libérer le navigateur.
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          registration.unregister();
          console.log("[PWA] Service Worker désenregistré");
        }
      });
    }

    // Initialize session key (toujours nécessaire pour le lecteur PDF)
    import("@/lib/crypto").then(({ initializeSession }) => {
      initializeSession();
    });
  }, []);

  return <>{children}</>;
}
