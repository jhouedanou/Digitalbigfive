/**
 * IndexedDB manager for secure offline PDF storage
 * Handles encrypted PDFs with automatic expiration
 */

import {
  encrypt,
  decrypt,
  getOrCreateSessionKey,
  generateChecksum,
  verifyChecksum,
  type SignedToken,
  type WatermarkData,
  type EncryptedPDFPackage,
} from "./crypto";

const DB_NAME = "bigfive_offline_pdfs";
const DB_VERSION = 1;
const STORE_NAME = "encrypted_pdfs";
const META_STORE = "pdf_metadata";
const LOG_STORE = "offline_logs";

// Types
export interface StoredPDF {
  id: string; // resourceId
  encryptedData: ArrayBuffer;
  checksum: string;
  token: SignedToken;
  watermarkData: WatermarkData;
  downloadedAt: number;
  lastAccessedAt: number;
  fileSize: number;
}

export interface PDFMetadata {
  id: string;
  title: string;
  expiresAt: number;
  userId: string;
  downloadedAt: number;
  fileSize: number;
  isExpired: boolean;
}

export interface OfflineLog {
  id: string;
  timestamp: number;
  event: "download" | "access" | "expired" | "sync" | "revoked" | "error";
  resourceId: string;
  details?: string;
}

// Database singleton
let db: IDBDatabase | null = null;

/**
 * Initialize IndexedDB
 */
export async function initDB(): Promise<IDBDatabase> {
  if (db) return db;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error("Impossible d'ouvrir IndexedDB"));
    };

    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;

      // Main store for encrypted PDFs
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const store = database.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("expiresAt", "token.expiresAt");
        store.createIndex("userId", "token.userId");
      }

      // Metadata store for quick lookups
      if (!database.objectStoreNames.contains(META_STORE)) {
        const metaStore = database.createObjectStore(META_STORE, {
          keyPath: "id",
        });
        metaStore.createIndex("expiresAt", "expiresAt");
        metaStore.createIndex("userId", "userId");
      }

      // Logs store for audit trail
      if (!database.objectStoreNames.contains(LOG_STORE)) {
        const logStore = database.createObjectStore(LOG_STORE, {
          keyPath: "id",
        });
        logStore.createIndex("timestamp", "timestamp");
        logStore.createIndex("resourceId", "resourceId");
      }
    };
  });
}

/**
 * Store an encrypted PDF
 */
export async function storePDF(
  resourceId: string,
  pdfData: ArrayBuffer,
  token: SignedToken,
  watermarkData: WatermarkData,
  title: string
): Promise<void> {
  const database = await initDB();
  const sessionKey = await getOrCreateSessionKey();

  // Encrypt the PDF data
  const encryptedData = await encrypt(pdfData, sessionKey);
  const checksum = await generateChecksum(pdfData);

  const storedPDF: StoredPDF = {
    id: resourceId,
    encryptedData,
    checksum,
    token,
    watermarkData,
    downloadedAt: Date.now(),
    lastAccessedAt: Date.now(),
    fileSize: pdfData.byteLength,
  };

  const metadata: PDFMetadata = {
    id: resourceId,
    title,
    expiresAt: token.expiresAt,
    userId: token.userId,
    downloadedAt: Date.now(),
    fileSize: pdfData.byteLength,
    isExpired: false,
  };

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(
      [STORE_NAME, META_STORE, LOG_STORE],
      "readwrite"
    );

    transaction.onerror = () => {
      reject(new Error("Erreur lors du stockage du PDF"));
    };

    transaction.oncomplete = () => {
      resolve();
    };

    // Store encrypted PDF
    transaction.objectStore(STORE_NAME).put(storedPDF);

    // Store metadata
    transaction.objectStore(META_STORE).put(metadata);

    // Log the download
    const log: OfflineLog = {
      id: `${resourceId}_${Date.now()}`,
      timestamp: Date.now(),
      event: "download",
      resourceId,
      details: `PDF téléchargé pour lecture offline: ${title}`,
    };
    transaction.objectStore(LOG_STORE).add(log);
  });
}

/**
 * Retrieve and decrypt a PDF
 */
export async function getPDF(resourceId: string): Promise<{
  data: ArrayBuffer;
  watermarkData: WatermarkData;
  isExpired: boolean;
} | null> {
  const database = await initDB();

  return new Promise(async (resolve, reject) => {
    const transaction = database.transaction(
      [STORE_NAME, LOG_STORE],
      "readwrite"
    );
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(resourceId);

    request.onerror = () => {
      reject(new Error("Erreur lors de la récupération du PDF"));
    };

    request.onsuccess = async () => {
      const storedPDF: StoredPDF | undefined = request.result;

      if (!storedPDF) {
        resolve(null);
        return;
      }

      // Check expiration
      const now = Date.now();
      const isExpired = storedPDF.token.expiresAt < now;

      if (isExpired) {
        // Log expiration and delete
        const log: OfflineLog = {
          id: `${resourceId}_${Date.now()}`,
          timestamp: now,
          event: "expired",
          resourceId,
          details: "PDF expiré - accès refusé",
        };
        transaction.objectStore(LOG_STORE).add(log);

        // Delete expired PDF
        await deletePDF(resourceId);

        resolve({
          data: new ArrayBuffer(0),
          watermarkData: storedPDF.watermarkData,
          isExpired: true,
        });
        return;
      }

      try {
        const sessionKey = await getOrCreateSessionKey();
        const decryptedData = await decrypt(storedPDF.encryptedData, sessionKey);

        // Verify integrity
        const isValid = await verifyChecksum(decryptedData, storedPDF.checksum);
        if (!isValid) {
          throw new Error("Intégrité du fichier compromise");
        }

        // Update last accessed
        storedPDF.lastAccessedAt = now;
        store.put(storedPDF);

        // Log access
        const log: OfflineLog = {
          id: `${resourceId}_${Date.now()}`,
          timestamp: now,
          event: "access",
          resourceId,
          details: "PDF accédé en mode offline",
        };
        transaction.objectStore(LOG_STORE).add(log);

        resolve({
          data: decryptedData,
          watermarkData: storedPDF.watermarkData,
          isExpired: false,
        });
      } catch (error) {
        // Log error
        const log: OfflineLog = {
          id: `${resourceId}_${Date.now()}`,
          timestamp: now,
          event: "error",
          resourceId,
          details: `Erreur déchiffrement: ${error}`,
        };
        transaction.objectStore(LOG_STORE).add(log);

        reject(error);
      }
    };
  });
}

/**
 * Delete a PDF from storage
 */
export async function deletePDF(resourceId: string): Promise<void> {
  const database = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(
      [STORE_NAME, META_STORE],
      "readwrite"
    );

    transaction.onerror = () => {
      reject(new Error("Erreur lors de la suppression"));
    };

    transaction.oncomplete = () => {
      resolve();
    };

    transaction.objectStore(STORE_NAME).delete(resourceId);
    transaction.objectStore(META_STORE).delete(resourceId);
  });
}

/**
 * Get all stored PDFs metadata
 */
export async function getAllPDFMetadata(): Promise<PDFMetadata[]> {
  const database = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(META_STORE, "readonly");
    const store = transaction.objectStore(META_STORE);
    const request = store.getAll();

    request.onerror = () => {
      reject(new Error("Erreur lors de la récupération des métadonnées"));
    };

    request.onsuccess = () => {
      const metadata: PDFMetadata[] = request.result || [];
      const now = Date.now();

      // Mark expired items
      const updatedMetadata = metadata.map((m) => ({
        ...m,
        isExpired: m.expiresAt < now,
      }));

      resolve(updatedMetadata);
    };
  });
}

/**
 * Check if a PDF is available offline
 */
export async function isPDFAvailableOffline(
  resourceId: string
): Promise<boolean> {
  const metadata = await getAllPDFMetadata();
  const pdf = metadata.find((m) => m.id === resourceId);
  return pdf !== null && pdf !== undefined && !pdf.isExpired;
}

/**
 * Clean up expired PDFs
 * Should be called periodically
 */
export async function cleanupExpiredPDFs(): Promise<number> {
  const database = await initDB();
  const now = Date.now();
  let deletedCount = 0;

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(
      [STORE_NAME, META_STORE, LOG_STORE],
      "readwrite"
    );
    const store = transaction.objectStore(STORE_NAME);
    const metaStore = transaction.objectStore(META_STORE);
    const logStore = transaction.objectStore(LOG_STORE);
    const index = store.index("expiresAt");

    // Get all expired PDFs
    const range = IDBKeyRange.upperBound(now);
    const request = index.openCursor(range);

    request.onerror = () => {
      reject(new Error("Erreur lors du nettoyage"));
    };

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;

      if (cursor) {
        const storedPDF: StoredPDF = cursor.value;

        // Log expiration
        const log: OfflineLog = {
          id: `${storedPDF.id}_cleanup_${Date.now()}`,
          timestamp: now,
          event: "expired",
          resourceId: storedPDF.id,
          details: "PDF expiré et supprimé automatiquement",
        };
        logStore.add(log);

        // Delete from both stores
        store.delete(storedPDF.id);
        metaStore.delete(storedPDF.id);
        deletedCount++;

        cursor.continue();
      }
    };

    transaction.oncomplete = () => {
      resolve(deletedCount);
    };
  });
}

/**
 * Revoke access to a specific PDF
 * Called when server indicates access has been revoked
 */
export async function revokePDF(resourceId: string): Promise<void> {
  const database = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(
      [STORE_NAME, META_STORE, LOG_STORE],
      "readwrite"
    );

    transaction.onerror = () => {
      reject(new Error("Erreur lors de la révocation"));
    };

    transaction.oncomplete = () => {
      resolve();
    };

    // Log revocation
    const log: OfflineLog = {
      id: `${resourceId}_revoked_${Date.now()}`,
      timestamp: Date.now(),
      event: "revoked",
      resourceId,
      details: "Accès révoqué par le serveur",
    };
    transaction.objectStore(LOG_STORE).add(log);

    // Delete from stores
    transaction.objectStore(STORE_NAME).delete(resourceId);
    transaction.objectStore(META_STORE).delete(resourceId);
  });
}

/**
 * Clear all stored PDFs (logout)
 */
export async function clearAllPDFs(): Promise<void> {
  const database = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(
      [STORE_NAME, META_STORE],
      "readwrite"
    );

    transaction.onerror = () => {
      reject(new Error("Erreur lors du nettoyage"));
    };

    transaction.oncomplete = () => {
      resolve();
    };

    transaction.objectStore(STORE_NAME).clear();
    transaction.objectStore(META_STORE).clear();
  });
}

/**
 * Get offline logs for audit
 */
export async function getOfflineLogs(
  limit: number = 100
): Promise<OfflineLog[]> {
  const database = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(LOG_STORE, "readonly");
    const store = transaction.objectStore(LOG_STORE);
    const index = store.index("timestamp");
    const logs: OfflineLog[] = [];

    const request = index.openCursor(null, "prev"); // Most recent first

    request.onerror = () => {
      reject(new Error("Erreur lors de la récupération des logs"));
    };

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;

      if (cursor && logs.length < limit) {
        logs.push(cursor.value);
        cursor.continue();
      } else {
        resolve(logs);
      }
    };
  });
}

/**
 * Get storage usage info
 */
export async function getStorageInfo(): Promise<{
  totalPDFs: number;
  totalSize: number;
  availableSpace: number;
}> {
  const metadata = await getAllPDFMetadata();
  const totalSize = metadata.reduce((sum, m) => sum + m.fileSize, 0);

  let availableSpace = 0;
  if (navigator.storage && navigator.storage.estimate) {
    const estimate = await navigator.storage.estimate();
    availableSpace = (estimate.quota || 0) - (estimate.usage || 0);
  }

  return {
    totalPDFs: metadata.filter((m) => !m.isExpired).length,
    totalSize,
    availableSpace,
  };
}
