/**
 * Crypto utilities for secure offline PDF storage
 * Uses Web Crypto API for AES-256-GCM encryption
 */

// Configuration
const ENCRYPTION_ALGORITHM = "AES-GCM";
const KEY_LENGTH = 256;
const IV_LENGTH = 12; // 96 bits for GCM
const SALT_LENGTH = 16;
const ITERATIONS = 100000;

/**
 * Generate a cryptographically secure random key
 */
export async function generateKey(): Promise<CryptoKey> {
  return await crypto.subtle.generateKey(
    { name: ENCRYPTION_ALGORITHM, length: KEY_LENGTH },
    true, // extractable
    ["encrypt", "decrypt"]
  );
}

/**
 * Derive a key from a password using PBKDF2
 */
export async function deriveKeyFromPassword(
  password: string,
  salt: Uint8Array
): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits", "deriveKey"]
  );

  return await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt.buffer as ArrayBuffer,
      iterations: ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: ENCRYPTION_ALGORITHM, length: KEY_LENGTH },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Export a CryptoKey to base64 string for session storage
 */
export async function exportKey(key: CryptoKey): Promise<string> {
  const exported = await crypto.subtle.exportKey("raw", key);
  return arrayBufferToBase64(exported);
}

/**
 * Import a CryptoKey from base64 string
 */
export async function importKey(base64Key: string): Promise<CryptoKey> {
  const keyBuffer = base64ToArrayBuffer(base64Key);
  return await crypto.subtle.importKey(
    "raw",
    keyBuffer,
    { name: ENCRYPTION_ALGORITHM, length: KEY_LENGTH },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypt data with AES-256-GCM
 * Returns: IV (12 bytes) + encrypted data + auth tag
 */
export async function encrypt(
  data: ArrayBuffer,
  key: CryptoKey
): Promise<ArrayBuffer> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

  const encrypted = await crypto.subtle.encrypt(
    { name: ENCRYPTION_ALGORITHM, iv },
    key,
    data
  );

  // Combine IV + encrypted data
  const result = new Uint8Array(iv.length + encrypted.byteLength);
  result.set(iv);
  result.set(new Uint8Array(encrypted), iv.length);

  return result.buffer;
}

/**
 * Decrypt data with AES-256-GCM
 */
export async function decrypt(
  encryptedData: ArrayBuffer,
  key: CryptoKey
): Promise<ArrayBuffer> {
  const dataArray = new Uint8Array(encryptedData);

  // Extract IV and ciphertext
  const iv = dataArray.slice(0, IV_LENGTH);
  const ciphertext = dataArray.slice(IV_LENGTH);

  return await crypto.subtle.decrypt(
    { name: ENCRYPTION_ALGORITHM, iv },
    key,
    ciphertext
  );
}

/**
 * Create a signed expiration token
 * This prevents tampering with expiration dates
 */
export async function createSignedToken(
  userId: string,
  resourceId: string,
  expirationDays: number,
  secretKey: string
): Promise<SignedToken> {
  const now = Date.now();
  const expiresAt = now + expirationDays * 24 * 60 * 60 * 1000;

  const payload = {
    userId,
    resourceId,
    issuedAt: now,
    expiresAt,
  };

  const payloadString = JSON.stringify(payload);
  const signature = await computeHMAC(payloadString, secretKey);

  return {
    ...payload,
    signature,
  };
}

/**
 * Verify a signed token
 */
export async function verifySignedToken(
  token: SignedToken,
  secretKey: string
): Promise<boolean> {
  const { signature, ...payload } = token;
  const payloadString = JSON.stringify(payload);
  const expectedSignature = await computeHMAC(payloadString, secretKey);

  // Timing-safe comparison
  if (signature.length !== expectedSignature.length) return false;

  let result = 0;
  for (let i = 0; i < signature.length; i++) {
    result |= signature.charCodeAt(i) ^ expectedSignature.charCodeAt(i);
  }

  return result === 0 && token.expiresAt > Date.now();
}

/**
 * Compute HMAC-SHA256
 */
async function computeHMAC(
  message: string,
  secret: string
): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(message);

  const key = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign("HMAC", key, messageData);
  return arrayBufferToBase64(signature);
}

/**
 * Generate a checksum for data integrity
 */
export async function generateChecksum(data: ArrayBuffer): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-256", data);
  return arrayBufferToBase64(hash);
}

/**
 * Verify data checksum
 */
export async function verifyChecksum(
  data: ArrayBuffer,
  expectedChecksum: string
): Promise<boolean> {
  const actualChecksum = await generateChecksum(data);
  return actualChecksum === expectedChecksum;
}

// Utility functions
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

export function generateSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
}

// Types
export interface SignedToken {
  userId: string;
  resourceId: string;
  issuedAt: number;
  expiresAt: number;
  signature: string;
}

export interface EncryptedPDFPackage {
  encryptedData: ArrayBuffer;
  checksum: string;
  token: SignedToken;
  watermarkData: WatermarkData;
}

export interface WatermarkData {
  userId: string;
  userEmail: string;
  purchaseDate: string;
  resourceTitle: string;
}

// Session key management (cleared on browser close)
const SESSION_KEY_NAME = "pdf_session_key";

export function storeSessionKey(keyBase64: string): void {
  if (typeof sessionStorage !== "undefined") {
    sessionStorage.setItem(SESSION_KEY_NAME, keyBase64);
  }
}

export function getSessionKey(): string | null {
  if (typeof sessionStorage !== "undefined") {
    return sessionStorage.getItem(SESSION_KEY_NAME);
  }
  return null;
}

export function clearSessionKey(): void {
  if (typeof sessionStorage !== "undefined") {
    sessionStorage.removeItem(SESSION_KEY_NAME);
  }
}

/**
 * Initialize encryption for a session
 * Call this when user logs in
 */
export async function initializeSession(): Promise<string> {
  const key = await generateKey();
  const exportedKey = await exportKey(key);
  storeSessionKey(exportedKey);
  return exportedKey;
}

/**
 * Get or create session key
 */
export async function getOrCreateSessionKey(): Promise<CryptoKey> {
  let keyBase64 = getSessionKey();

  if (!keyBase64) {
    keyBase64 = await initializeSession();
  }

  return await importKey(keyBase64);
}
