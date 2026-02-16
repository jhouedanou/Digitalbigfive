/**
 * Big Five Reader - Service Worker
 * Handles offline PDF caching, request interception, and expiration management
 */

const CACHE_NAME = "bigfive-reader-v1";
const STATIC_CACHE = "bigfive-static-v1";
const PDF_CACHE = "bigfive-pdfs-v1";

// Resources to cache on install
const STATIC_ASSETS = [
  "/",
  "/dashboard/reader",
  "/manifest.json",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
];

// Install event - cache static assets
self.addEventListener("install", (event) => {
  console.log("[SW] Installing Service Worker...");

  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log("[SW] Caching static assets");
      return cache.addAll(STATIC_ASSETS);
    })
  );

  // Activate immediately
  self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener("activate", (event) => {
  console.log("[SW] Activating Service Worker...");

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (
            cache !== CACHE_NAME &&
            cache !== STATIC_CACHE &&
            cache !== PDF_CACHE
          ) {
            console.log("[SW] Deleting old cache:", cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );

  // Take control of all pages immediately
  self.clients.claim();
});

// Fetch event - intercept requests
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle PDF requests specially
  if (url.pathname.startsWith("/api/pdf/") || url.pathname.includes(".pdf")) {
    event.respondWith(handlePDFRequest(request));
    return;
  }

  // Handle API requests - network first
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(handleAPIRequest(request));
    return;
  }

  // Handle static assets - cache first
  event.respondWith(handleStaticRequest(request));
});

// Handle PDF requests with offline support
async function handlePDFRequest(request) {
  const isOnline = navigator.onLine;

  if (isOnline) {
    try {
      // Online: fetch from network, validate, and cache
      const response = await fetch(request);

      if (response.ok) {
        const cache = await caches.open(PDF_CACHE);
        cache.put(request, response.clone());

        // Notify IndexedDB to store encrypted version
        const clients = await self.clients.matchAll();
        clients.forEach((client) => {
          client.postMessage({
            type: "PDF_FETCHED",
            url: request.url,
          });
        });
      }

      return response;
    } catch (error) {
      console.log("[SW] Network failed, trying cache:", error);
      return handleOfflinePDF(request);
    }
  } else {
    // Offline: serve from IndexedDB via client
    return handleOfflinePDF(request);
  }
}

// Handle offline PDF request
async function handleOfflinePDF(request) {
  const url = new URL(request.url);

  // Extract resource ID from URL
  const pathParts = url.pathname.split("/");
  const resourceId = pathParts[pathParts.length - 1];

  // Request decrypted PDF from client
  const clients = await self.clients.matchAll();

  if (clients.length > 0) {
    // Create a message channel for response
    return new Promise((resolve) => {
      const messageChannel = new MessageChannel();

      messageChannel.port1.onmessage = (event) => {
        if (event.data.type === "PDF_DATA") {
          if (event.data.expired) {
            resolve(
              new Response(
                JSON.stringify({
                  error: "PDF expiré",
                  message:
                    "Ce document a expiré. Reconnectez-vous pour le télécharger à nouveau.",
                }),
                {
                  status: 410,
                  headers: { "Content-Type": "application/json" },
                }
              )
            );
          } else if (event.data.data) {
            resolve(
              new Response(event.data.data, {
                headers: {
                  "Content-Type": "application/pdf",
                  "X-Offline": "true",
                  "X-Watermark-User": event.data.watermark?.userEmail || "",
                },
              })
            );
          } else {
            resolve(
              new Response(
                JSON.stringify({
                  error: "PDF non disponible",
                  message: "Ce document n'est pas disponible hors ligne.",
                }),
                {
                  status: 404,
                  headers: { "Content-Type": "application/json" },
                }
              )
            );
          }
        }
      };

      clients[0].postMessage(
        {
          type: "GET_OFFLINE_PDF",
          resourceId,
        },
        [messageChannel.port2]
      );

      // Timeout after 5 seconds
      setTimeout(() => {
        resolve(
          new Response(
            JSON.stringify({
              error: "Timeout",
              message: "Impossible de récupérer le PDF",
            }),
            {
              status: 504,
              headers: { "Content-Type": "application/json" },
            }
          )
        );
      }, 5000);
    });
  }

  // No clients available
  return new Response(
    JSON.stringify({
      error: "Service indisponible",
      message: "Veuillez ouvrir l'application pour accéder aux PDFs",
    }),
    {
      status: 503,
      headers: { "Content-Type": "application/json" },
    }
  );
}

// Handle API requests - network first
async function handleAPIRequest(request) {
  try {
    const response = await fetch(request);
    return response;
  } catch (error) {
    console.log("[SW] API request failed offline:", request.url);

    // Return offline status for certain endpoints
    const url = new URL(request.url);

    if (url.pathname.includes("/api/pdf/verify-access")) {
      // Verify access offline - check local expiration
      return new Response(
        JSON.stringify({
          offline: true,
          message: "Vérification hors ligne",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        error: "Hors ligne",
        offline: true,
      }),
      {
        status: 503,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

// Handle static requests - cache first
async function handleStaticRequest(request) {
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const response = await fetch(request);

    // Cache successful responses
    if (response.ok && request.method === "GET") {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    console.log("[SW] Static request failed:", request.url);

    // Return offline page for navigation requests
    if (request.mode === "navigate") {
      const offlineResponse = await caches.match("/dashboard/reader");
      if (offlineResponse) {
        return offlineResponse;
      }
    }

    return new Response("Hors ligne", {
      status: 503,
      headers: { "Content-Type": "text/plain" },
    });
  }
}

// Message handler for communication with client
self.addEventListener("message", (event) => {
  const { type, data } = event.data;

  switch (type) {
    case "SKIP_WAITING":
      self.skipWaiting();
      break;

    case "CLEANUP_EXPIRED":
      // Trigger cache cleanup
      cleanupExpiredCache();
      break;

    case "CLEAR_ALL_CACHE":
      clearAllCache();
      break;

    case "SYNC_PDFS":
      // Re-verify all cached PDFs when back online
      syncPDFsOnline(data?.userId);
      break;
  }
});

// Clean up expired PDFs from cache
async function cleanupExpiredCache() {
  console.log("[SW] Cleaning up expired PDFs...");

  const cache = await caches.open(PDF_CACHE);
  const keys = await cache.keys();

  // Notify client to check expirations
  const clients = await self.clients.matchAll();
  clients.forEach((client) => {
    client.postMessage({
      type: "CHECK_EXPIRATIONS",
      cachedPDFs: keys.map((k) => new URL(k.url).pathname),
    });
  });
}

// Clear all caches (logout)
async function clearAllCache() {
  console.log("[SW] Clearing all caches...");

  await caches.delete(PDF_CACHE);

  const clients = await self.clients.matchAll();
  clients.forEach((client) => {
    client.postMessage({
      type: "CACHE_CLEARED",
    });
  });
}

// Sync PDFs when back online
async function syncPDFsOnline(userId) {
  console.log("[SW] Syncing PDFs online...");

  const clients = await self.clients.matchAll();

  // Notify client to verify access rights
  clients.forEach((client) => {
    client.postMessage({
      type: "SYNC_START",
      userId,
    });
  });
}

// Background sync for when connection is restored
self.addEventListener("sync", (event) => {
  console.log("[SW] Background sync triggered:", event.tag);

  if (event.tag === "sync-pdfs") {
    event.waitUntil(syncPDFsOnline());
  }
});

// Push notifications (optional)
self.addEventListener("push", (event) => {
  if (event.data) {
    const data = event.data.json();

    if (data.type === "REVOKE_ACCESS") {
      // Server revoked access to a PDF
      event.waitUntil(
        (async () => {
          const clients = await self.clients.matchAll();
          clients.forEach((client) => {
            client.postMessage({
              type: "ACCESS_REVOKED",
              resourceId: data.resourceId,
            });
          });
        })()
      );
    }
  }
});

console.log("[SW] Service Worker loaded");
