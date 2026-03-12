"use client";

import { useEffect } from "react";

interface ServiceWorkerProviderProps {
  children: React.ReactNode;
}

export function ServiceWorkerProvider({ children }: ServiceWorkerProviderProps) {
  useEffect(() => {
    // PWA et app desktop désactivées — Chariow fait office de CMS.
    // Désenregistrer tout ancien Service Worker pour libérer le navigateur.
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          registration.unregister();
          console.log("[PWA] Service Worker désenregistré");
        }
      });
    }
  }, []);

  return <>{children}</>;
}
