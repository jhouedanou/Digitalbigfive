import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export function formatPrice(amount: number, currency = "XOF"): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

/**
 * Extrait l'ID d'un fichier Google Drive à partir de différents formats d'URL.
 * Gère : drive.google.com, drive.usercontent.google.com, lh3.googleusercontent.com
 */
export function extractDriveFileId(url: string): string | null {
  if (!url) return null;
  // Format: https://drive.google.com/file/d/FILE_ID/...
  let match = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (match) return match[1];
  // Format: https://drive.google.com/open?id=FILE_ID
  match = url.match(/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/);
  if (match) return match[1];
  // Format: https://drive.google.com/uc?id=FILE_ID
  match = url.match(/drive\.google\.com\/uc\?.*id=([a-zA-Z0-9_-]+)/);
  if (match) return match[1];
  // Format: https://drive.google.com/thumbnail?id=FILE_ID
  match = url.match(/drive\.google\.com\/thumbnail\?.*id=([a-zA-Z0-9_-]+)/);
  if (match) return match[1];
  // Format: https://drive.usercontent.google.com/download?id=FILE_ID
  match = url.match(/drive\.usercontent\.google\.com\/download\?.*id=([a-zA-Z0-9_-]+)/);
  if (match) return match[1];
  // Format: https://drive.usercontent.google.com/u/0/uc?id=FILE_ID
  match = url.match(/drive\.usercontent\.google\.com\/.*[?&]id=([a-zA-Z0-9_-]+)/);
  if (match) return match[1];
  // Format: https://lh3.googleusercontent.com/d/FILE_ID
  match = url.match(/lh3\.googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/);
  if (match) return match[1];
  return null;
}

/**
 * Convertit une URL (potentiellement Google Drive) en URL affichable dans un <img>.
 * Les liens Drive sont convertis en URL thumbnail publique.
 */
export function getDriveImageUrl(url: string | null | undefined): string {
  if (!url) return "/placeholder.svg";
  const driveId = extractDriveFileId(url);
  if (driveId) {
    return `https://lh3.googleusercontent.com/d/${driveId}=w800`;
  }
  return url;
}
