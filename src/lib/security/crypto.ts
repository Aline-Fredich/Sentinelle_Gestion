/**
 * SENTINEL GESTION — Module Cryptographique Côté Client (Web Crypto API)
 * Chiffrement symétrique AES-GCM 256 bits, dérivation de clé PBKDF2-SHA256,
 * et fonctions de hachage sécurisé SHA-256.
 *
 * Conforme aux recommandations ANSSI & RGPD pour la protection des données au repos.
 */

export interface EncryptedPayload {
  version: number;
  cipherText: string; // Base64
  iv: string;         // Base64 (12 octets pour AES-GCM)
  salt: string;       // Base64 (16 octets pour PBKDF2)
}

/**
 * Encode un ArrayBuffer en chaîne Base64 compatible navigateur et Node.js.
 */
export function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(bytes).toString('base64');
  }
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Décode une chaîne Base64 en Uint8Array.
 */
export function base64ToBuffer(base64: string): Uint8Array {
  if (typeof Buffer !== 'undefined') {
    return new Uint8Array(Buffer.from(base64, 'base64'));
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Dérive une clé cryptographique AES-GCM 256 bits à partir d'un mot de passe ou d'une phrase secrète
 * en utilisant PBKDF2 avec 100 000 itérations de SHA-256.
 */
export async function deriveKeyFromPassphrase(
  passphrase: string,
  salt: Uint8Array
): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const rawKeyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations: 100_000,
      hash: 'SHA-256',
    },
    rawKeyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Chiffre un texte clair avec AES-GCM 256 bits.
 * Génère un sel aléatoire de 16 octets et un vecteur d'initialisation (IV) de 12 octets uniques.
 */
export async function encryptSensitiveText(
  plainText: string,
  passphrase: string
): Promise<EncryptedPayload> {
  const enc = new TextEncoder();
  const data = enc.encode(plainText);

  // 1. Sel cryptographique aléatoire pour la dérivation
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await deriveKeyFromPassphrase(passphrase, salt);

  // 2. Vecteur d'initialisation (IV) aléatoire de 12 octets
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // 3. Chiffrement authentifié AES-GCM
  const cipherBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
    key,
    data
  );

  return {
    version: 1,
    cipherText: bufferToBase64(cipherBuffer),
    iv: bufferToBase64(iv),
    salt: bufferToBase64(salt),
  };
}

/**
 * Déchiffre une charge chiffrée AES-GCM avec le mot de passe adéquat.
 */
export async function decryptSensitiveText(
  payload: EncryptedPayload,
  passphrase: string
): Promise<string> {
  const salt = base64ToBuffer(payload.salt);
  const iv = base64ToBuffer(payload.iv);
  const cipherBytes = base64ToBuffer(payload.cipherText);

  const key = await deriveKeyFromPassphrase(passphrase, salt);

  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
    key,
    cipherBytes as BufferSource
  );

  const dec = new TextDecoder();
  return dec.decode(decryptedBuffer);
}

/**
 * Calcule une empreinte cryptographique SHA-256 hexadécimale (pour les hashs d'audit et les vérifications).
 */
export async function calculateSha256(data: string): Promise<string> {
  const enc = new TextEncoder();
  const buffer = await crypto.subtle.digest('SHA-256', enc.encode(data));
  const hashArray = Array.from(new Uint8Array(buffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
