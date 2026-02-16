/**
 * PDF Security Module
 * 
 * Ce module gère la sécurité complète du système de lecture PDF :
 * - Chiffrement/déchiffrement AES-256
 * - Génération et validation de tokens JWT
 * - Gestion des sessions de lecture
 * - Logging des accès
 */

import crypto from "crypto";
import { prisma } from "./prisma";

// ─── Configuration ──────────────────────────────────────────

const PDF_SECRET = process.env.PDF_SECRET || process.env.NEXTAUTH_SECRET || "fallback-secret-key";
const ENCRYPTION_KEY = crypto.scryptSync(PDF_SECRET, "salt", 32); // AES-256 key
const IV_LENGTH = 16;

// Session configuration
export const SESSION_CONFIG = {
  TTL: 30 * 60 * 1000,           // 30 minutes
  TOKEN_ROTATION: 15 * 60 * 1000, // 15 minutes
  MAX_IDLE: 10 * 60 * 1000,       // 10 minutes d'inactivité max
  MAX_CONCURRENT: 1,              // 1 session par utilisateur/ressource
};

// ─── Chiffrement AES-256 ────────────────────────────────────

/**
 * Chiffre des données avec AES-256-CBC
 */
export function encryptData(data: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv("aes-256-cbc", ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(data, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
}

/**
 * Déchiffre des données AES-256-CBC
 */
export function decryptData(encryptedData: string): string {
  const [ivHex, encrypted] = encryptedData.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const decipher = crypto.createDecipheriv("aes-256-cbc", ENCRYPTION_KEY, iv);
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

/**
 * Chiffre un buffer PDF
 */
export function encryptPDF(pdfBuffer: Buffer): Buffer {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv("aes-256-cbc", ENCRYPTION_KEY, iv);
  const encrypted = Buffer.concat([cipher.update(pdfBuffer), cipher.final()]);
  return Buffer.concat([iv, encrypted]);
}

/**
 * Déchiffre un buffer PDF
 */
export function decryptPDF(encryptedBuffer: Buffer): Buffer {
  const iv = encryptedBuffer.subarray(0, IV_LENGTH);
  const encrypted = encryptedBuffer.subarray(IV_LENGTH);
  const decipher = crypto.createDecipheriv("aes-256-cbc", ENCRYPTION_KEY, iv);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]);
}

// ─── Token JWT simplifié ────────────────────────────────────

interface TokenPayload {
  userId: string;
  resourceId: string;
  sessionId: string;
  issuedAt: number;
  expiresAt: number;
  rotationCount: number;
}

/**
 * Génère un token de session sécurisé
 */
export function generateViewerToken(
  userId: string,
  resourceId: string,
  sessionId: string,
  rotationCount: number = 0
): string {
  const now = Date.now();
  const payload: TokenPayload = {
    userId,
    resourceId,
    sessionId,
    issuedAt: now,
    expiresAt: now + SESSION_CONFIG.TTL,
    rotationCount,
  };

  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", PDF_SECRET)
    .update(payloadB64)
    .digest("hex");

  return `${payloadB64}.${signature}`;
}

/**
 * Valide un token de session et retourne le payload
 */
export function verifyViewerToken(token: string): TokenPayload | null {
  try {
    const [payloadB64, signature] = token.split(".");
    if (!payloadB64 || !signature) return null;

    const expectedSignature = crypto
      .createHmac("sha256", PDF_SECRET)
      .update(payloadB64)
      .digest("hex");

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return null;
    }

    const payload: TokenPayload = JSON.parse(
      Buffer.from(payloadB64, "base64url").toString()
    );

    // Vérifier l'expiration
    if (Date.now() > payload.expiresAt) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

/**
 * Vérifie si un token doit être renouvelé
 */
export function shouldRotateToken(token: string): boolean {
  const payload = verifyViewerToken(token);
  if (!payload) return false;
  
  const elapsed = Date.now() - payload.issuedAt;
  return elapsed > SESSION_CONFIG.TOKEN_ROTATION;
}

// ─── Gestion des sessions ───────────────────────────────────

/**
 * Crée une nouvelle session de lecture
 */
export async function createViewerSession(
  userId: string,
  resourceId: string,
  ipAddress?: string,
  userAgent?: string,
  totalPages?: number
): Promise<{ sessionId: string; token: string }> {
  // Invalider les sessions existantes (1 seule session autorisée)
  await prisma.viewerSession.updateMany({
    where: {
      userId,
      resourceId,
      isActive: true,
    },
    data: {
      isActive: false,
    },
  });

  // Créer la nouvelle session
  const session = await prisma.viewerSession.create({
    data: {
      userId,
      resourceId,
      sessionToken: crypto.randomBytes(32).toString("hex"),
      ipAddress,
      userAgent,
      expiresAt: new Date(Date.now() + SESSION_CONFIG.TTL),
      totalPages: totalPages || 0,
    },
  });

  // Logger l'ouverture
  await logAccess(userId, resourceId, session.id, "open", undefined, ipAddress, userAgent);

  const token = generateViewerToken(userId, resourceId, session.id);
  return { sessionId: session.id, token };
}

/**
 * Valide et met à jour une session de lecture
 */
export async function validateSession(
  sessionId: string,
  userId: string,
  resourceId: string
): Promise<boolean> {
  console.log("[validateSession] Checking:", { sessionId, userId, resourceId });
  
  const session = await prisma.viewerSession.findFirst({
    where: {
      id: sessionId,
      userId,
      resourceId,
      isActive: true,
      expiresAt: {
        gt: new Date(),
      },
    },
  });

  console.log("[validateSession] Session found:", !!session);

  if (!session) return false;

  // Vérifier l'inactivité
  const idle = Date.now() - session.lastActiveAt.getTime();
  if (idle > SESSION_CONFIG.MAX_IDLE) {
    await prisma.viewerSession.update({
      where: { id: sessionId },
      data: { isActive: false },
    });
    await logAccess(userId, resourceId, sessionId, "expired");
    return false;
  }

  // Mettre à jour le timestamp d'activité
  await prisma.viewerSession.update({
    where: { id: sessionId },
    data: {
      lastActiveAt: new Date(),
      duration: Math.floor((Date.now() - session.startedAt.getTime()) / 1000),
    },
  });

  return true;
}

/**
 * Enregistre une vue de page
 */
export async function recordPageView(
  sessionId: string,
  userId: string,
  resourceId: string,
  pageNumber: number
): Promise<void> {
  await prisma.viewerSession.update({
    where: { id: sessionId },
    data: {
      lastActiveAt: new Date(),
      pagesViewed: {
        increment: 1,
      },
    },
  });

  await logAccess(userId, resourceId, sessionId, "page_view", pageNumber);
}

/**
 * Ferme une session de lecture
 */
export async function closeSession(
  sessionId: string,
  userId: string,
  resourceId: string
): Promise<void> {
  const session = await prisma.viewerSession.findUnique({
    where: { id: sessionId },
  });

  if (session) {
    await prisma.viewerSession.update({
      where: { id: sessionId },
      data: {
        isActive: false,
        duration: Math.floor((Date.now() - session.startedAt.getTime()) / 1000),
      },
    });

    await logAccess(userId, resourceId, sessionId, "close");
  }
}

/**
 * Renouvelle un token de session
 */
export async function rotateToken(
  oldToken: string
): Promise<string | null> {
  const payload = verifyViewerToken(oldToken);
  if (!payload) return null;

  const isValid = await validateSession(
    payload.sessionId,
    payload.userId,
    payload.resourceId
  );

  if (!isValid) return null;

  return generateViewerToken(
    payload.userId,
    payload.resourceId,
    payload.sessionId,
    payload.rotationCount + 1
  );
}

// ─── Logging des accès ──────────────────────────────────────

/**
 * Enregistre un accès dans les logs
 */
export async function logAccess(
  userId: string,
  resourceId: string,
  sessionId?: string,
  action: "open" | "page_view" | "close" | "expired" | "blocked" = "open",
  pageNumber?: number,
  ipAddress?: string,
  userAgent?: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  await prisma.pDFAccessLog.create({
    data: {
      userId,
      resourceId,
      sessionId,
      action,
      pageNumber,
      ipAddress,
      userAgent,
      metadata: metadata ? JSON.stringify(metadata) : null,
    },
  });
}

/**
 * Récupère les statistiques d'accès pour une ressource
 */
export async function getAccessStats(resourceId: string) {
  const [totalSessions, totalViews, avgDuration] = await Promise.all([
    prisma.viewerSession.count({ where: { resourceId } }),
    prisma.pDFAccessLog.count({ where: { resourceId, action: "page_view" } }),
    prisma.viewerSession.aggregate({
      where: { resourceId },
      _avg: { duration: true },
    }),
  ]);

  return {
    totalSessions,
    totalViews,
    avgDuration: avgDuration._avg.duration || 0,
  };
}

// ─── Watermarking ───────────────────────────────────────────

/**
 * Génère les données de watermark pour un utilisateur
 */
export function generateWatermarkData(
  userEmail: string,
  userName: string,
  resourceId: string
): string {
  const timestamp = new Date().toISOString();
  const hash = crypto
    .createHash("sha256")
    .update(`${userEmail}:${resourceId}:${timestamp}`)
    .digest("hex")
    .slice(0, 8);

  return JSON.stringify({
    email: userEmail,
    name: userName,
    timestamp,
    hash,
    licence: `BF-${hash.toUpperCase()}`,
  });
}

// ─── Vérification des droits ────────────────────────────────

/**
 * Vérifie si un utilisateur a accès à une ressource
 */
export async function checkAccess(
  userId: string,
  resourceId: string
): Promise<{ hasAccess: boolean; reason?: string }> {
  // Vérifier si admin
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (user?.role === "admin") {
    return { hasAccess: true };
  }

  // Vérifier si achat validé
  const order = await prisma.order.findFirst({
    where: {
      userId,
      resourceId,
      status: "paid",
    },
  });

  if (order) {
    return { hasAccess: true };
  }

  return { hasAccess: false, reason: "Achat requis pour accéder à ce document." };
}
