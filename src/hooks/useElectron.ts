"use client";

import { useState, useEffect } from "react";

/**
 * Détecte si l'application tourne dans Electron et expose l'API
 */
export function useElectron() {
  const [isElectron, setIsElectron] = useState(false);
  const [appVersion, setAppVersion] = useState<string | null>(null);
  const [platform, setPlatform] = useState<string | null>(null);

  useEffect(() => {
    const api = window.electronAPI;
    if (!api) return;

    setIsElectron(true);

    api.getVersion().then(setAppVersion).catch(() => {});
    api.getPlatform().then(setPlatform).catch(() => {});
  }, []);

  return {
    isElectron,
    appVersion,
    platform,
    api: isElectron ? window.electronAPI : null,
  };
}
