"use client";

import { useEffect, useCallback, useRef } from "react";
import {
  getAllPDFMetadata,
  revokePDF,
  cleanupExpiredPDFs,
  getPDF,
} from "@/lib/offline-storage";
import { base64ToArrayBuffer } from "@/lib/crypto";

interface UseOfflineSyncOptions {
  onSyncComplete?: () => void;
  onAccessRevoked?: (resourceId: string) => void;
  onError?: (error: Error) => void;
}

export function useOfflineSync(options: UseOfflineSyncOptions = {}) {
  const { onSyncComplete, onAccessRevoked, onError } = options;
  const isInitialized = useRef(false);

  // Sync with server when coming back online
  const syncWithServer = useCallback(async () => {
    try {
      const metadata = await getAllPDFMetadata();
      const resourceIds = metadata.map((m) => m.id);

      if (resourceIds.length === 0) return;

      const response = await fetch("/api/pdf/prepare-offline", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resourceIds }),
      });

      if (!response.ok) {
        throw new Error("Sync failed");
      }

      const { valid, revoked } = await response.json();

      // Revoke access to removed resources
      for (const resourceId of revoked) {
        await revokePDF(resourceId);
        onAccessRevoked?.(resourceId);
      }

      // Cleanup expired PDFs
      await cleanupExpiredPDFs();

      onSyncComplete?.();
    } catch (error) {
      onError?.(error as Error);
    }
  }, [onSyncComplete, onAccessRevoked, onError]);

  // Handle service worker messages
  const handleServiceWorkerMessage = useCallback(
    async (event: MessageEvent) => {
      const { type, resourceId } = event.data;

      switch (type) {
        case "GET_OFFLINE_PDF":
          // Service worker requesting PDF data
          try {
            const result = await getPDF(resourceId);

            if (event.ports[0]) {
              if (!result) {
                event.ports[0].postMessage({
                  type: "PDF_DATA",
                  data: null,
                });
              } else if (result.isExpired) {
                event.ports[0].postMessage({
                  type: "PDF_DATA",
                  expired: true,
                });
              } else {
                event.ports[0].postMessage({
                  type: "PDF_DATA",
                  data: result.data,
                  watermark: result.watermarkData,
                });
              }
            }
          } catch (error) {
            if (event.ports[0]) {
              event.ports[0].postMessage({
                type: "PDF_DATA",
                error: (error as Error).message,
              });
            }
          }
          break;

        case "CHECK_EXPIRATIONS":
          // Cleanup expired PDFs
          await cleanupExpiredPDFs();
          break;

        case "SYNC_START":
          // Server requested sync
          await syncWithServer();
          break;

        case "ACCESS_REVOKED":
          // Server revoked access
          await revokePDF(resourceId);
          onAccessRevoked?.(resourceId);
          break;

        case "CACHE_CLEARED":
          // Cache was cleared
          console.log("Cache cleared");
          break;
      }
    },
    [syncWithServer, onAccessRevoked]
  );

  // Initialize
  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    // Listen for service worker messages
    navigator.serviceWorker?.addEventListener("message", handleServiceWorkerMessage);

    // Sync when coming back online
    const handleOnline = () => {
      console.log("Back online, syncing...");
      syncWithServer();
    };

    window.addEventListener("online", handleOnline);

    // Initial cleanup
    cleanupExpiredPDFs();

    // Periodic cleanup (every hour)
    const cleanupInterval = setInterval(
      () => {
        cleanupExpiredPDFs();
      },
      60 * 60 * 1000
    );

    return () => {
      navigator.serviceWorker?.removeEventListener(
        "message",
        handleServiceWorkerMessage
      );
      window.removeEventListener("online", handleOnline);
      clearInterval(cleanupInterval);
    };
  }, [handleServiceWorkerMessage, syncWithServer]);

  // Manual sync trigger
  const triggerSync = useCallback(() => {
    if (navigator.onLine) {
      syncWithServer();
    }
  }, [syncWithServer]);

  return {
    triggerSync,
    isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
  };
}

// Hook for download to offline
export function useOfflineDownload() {
  const downloadForOffline = useCallback(
    async (
      resourceId: string,
      onProgress?: (progress: number) => void
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        onProgress?.(10);

        const response = await fetch("/api/pdf/prepare-offline", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ resourceId }),
        });

        onProgress?.(50);

        if (!response.ok) {
          const data = await response.json();
          return { success: false, error: data.error };
        }

        const data = await response.json();
        onProgress?.(70);

        // Convert base64 to ArrayBuffer
        const pdfBuffer = base64ToArrayBuffer(data.pdf);

        // Import storage function dynamically to avoid SSR issues
        const { storePDF } = await import("@/lib/offline-storage");

        await storePDF(
          resourceId,
          pdfBuffer,
          data.token,
          data.watermarkData,
          data.title
        );

        onProgress?.(100);

        return { success: true };
      } catch (error) {
        console.error("Download error:", error);
        return {
          success: false,
          error: (error as Error).message,
        };
      }
    },
    []
  );

  return { downloadForOffline };
}
