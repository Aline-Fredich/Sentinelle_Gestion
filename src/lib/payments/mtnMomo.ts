/**
 * SENTINEL GESTION - Passerelle de Paiement Mobile Money MTN Congo-Brazzaville
 * Opérateur : MTN Congo (+242)
 * Devise officielle : FCFA CEMAC (Code ISO : XAF)
 * Support de l'idempotence des transactions et validation stricte des numéros.
 */

import type { PaymentTransaction } from '../../types/sentinel.ts';
import { formatCurrency } from '../currencyUtils.ts';
import { isSupabaseConfigured, createClient } from '../supabase/client.ts';

// Registre mémoire pour garantir l'idempotence des webhooks et paiements
const processedTransactionIds = new Set<string>();
const transactionsStore = new Map<string, PaymentTransaction>();

/**
 * Valide et normalise un numéro de téléphone mobile MTN République du Congo.
 * Les plages autorisées pour MTN Congo commencent généralement par 06 (064, 065, 066, 068, 069).
 */
export function validateMtnCongoNumber(rawNumber: string): {
  isValid: boolean;
  normalized: string;
  formatted: string;
  errorMessage?: string;
} {
  // Nettoyage de tous les espaces, tirets et parenthèses
  let clean = rawNumber.replace(/[\s\-\(\)\.]/g, '');

  // Suppression du préfixe international éventuel
  if (clean.startsWith('+242')) {
    clean = clean.substring(4);
  } else if (clean.startsWith('00242')) {
    clean = clean.substring(5);
  } else if (clean.startsWith('242')) {
    clean = clean.substring(3);
  }

  // Si le numéro a 9 chiffres et commence par 06, ou 8 chiffres commençant par 6
  if (clean.startsWith('0')) {
    clean = clean.substring(1);
  }

  // À ce stade, clean doit comporter 8 chiffres et commencer par 6 (ex: 66012345 ou 69012345)
  if (!/^6[4-9]\d{6}$/.test(clean)) {
    return {
      isValid: false,
      normalized: '',
      formatted: rawNumber,
      errorMessage: 'Veuillez saisir un numéro MTN Congo valide (ex: 06 600 00 00 ou 06 900 00 00).',
    };
  }

  const normalized = `2420${clean}`;
  const formatted = `+242 0${clean.substring(0, 1)} ${clean.substring(1, 4)} ${clean.substring(4, 6)} ${clean.substring(6, 8)}`;

  return {
    isValid: true,
    normalized,
    formatted,
  };
}

/**
 * Génère une référence de paiement MTN Congo unique et horodatée.
 */
export function generateTransactionReference(): string {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `MTN-CG-${dateStr}-${randomSuffix}`;
}

export interface InitiatePaymentParams {
  planCode: 'discovery' | 'premium' | 'team';
  planName: string;
  amount: number;
  billingCycle: 'monthly' | 'yearly';
  phoneNumber: string;
  payerName?: string;
}

/**
 * Initialise une transaction de paiement MTN Mobile Money (Request To Pay)
 */
export async function initiateMtnMomoPayment(params: InitiatePaymentParams): Promise<PaymentTransaction> {
  const phoneValidation = validateMtnCongoNumber(params.phoneNumber);
  if (!phoneValidation.isValid) {
    throw new Error(phoneValidation.errorMessage || 'Numéro MTN Congo invalide.');
  }

  const reference = generateTransactionReference();
  const id = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const receiptNumber = `REC-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

  const transaction: PaymentTransaction = {
    id,
    reference,
    amount: params.amount,
    currency: 'XAF',
    operator: 'mtn_congo',
    phoneNumber: phoneValidation.formatted,
    planCode: params.planCode,
    planName: params.planName,
    billingCycle: params.billingCycle,
    status: 'pending',
    externalReference: `MOMO-REQ-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
    createdAt: new Date().toISOString(),
    payerName: params.payerName || 'Client Sentinelle',
    receiptNumber,
  };

  transactionsStore.set(transaction.id, transaction);
  return transaction;
}

/**
 * Confirme et valide une transaction (simulation ou réception USSD)
 */
export function confirmPaymentTransaction(transactionId: string): PaymentTransaction {
  const transaction = transactionsStore.get(transactionId);
  if (!transaction) {
    throw new Error('Transaction introuvable.');
  }

  const updated: PaymentTransaction = {
    ...transaction,
    status: 'successful',
    completedAt: new Date().toISOString(),
  };

  transactionsStore.set(transactionId, updated);
  processedTransactionIds.add(transaction.reference);
  return updated;
}

/**
 * Traitement sécurisé et idempotent du Webhook MTN Mobile Money.
 * Prévient les attaques par rejeu et les doubles écritures.
 */
export interface MtnWebhookPayload {
  transactionId: string;
  reference: string;
  status: 'SUCCESSFUL' | 'FAILED' | 'PENDING';
  amount: number;
  currency: string;
  financialTransactionId?: string;
}

/**
 * Calcule la signature HMAC-SHA256 hexadécimale d'un corps de requête (Web Crypto API universelle).
 */
export async function calculateHmacSha256(data: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, enc.encode(data));
  const hashArray = Array.from(new Uint8Array(signature));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Vérifie la signature cryptographique du Webhook MTN MoMo en temps constant.
 */
export async function verifyMtnWebhookSignature(
  rawBody: string,
  signatureHeader: string | null | undefined,
  secret: string
): Promise<boolean> {
  if (!signatureHeader || !secret) return false;
  const cleanSig = signatureHeader.replace(/^sha256=/i, '').replace(/^Bearer\s+/i, '').trim().toLowerCase();
  const expectedHex = await calculateHmacSha256(rawBody, secret);

  if (cleanSig.length !== expectedHex.length) return false;
  let result = 0;
  for (let i = 0; i < cleanSig.length; i++) {
    result |= cleanSig.charCodeAt(i) ^ expectedHex.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Enregistre manuellement une transaction dans le registre mémoire.
 */
export function recordPendingTransaction(tx: PaymentTransaction): void {
  transactionsStore.set(tx.id, tx);
}

/**
 * Enregistre ou met à jour une transaction dans la persistance distante PostgreSQL (Supabase)
 * garantissant l'idempotence même après redémarrage Serverless.
 */
export async function persistPaymentEventToDatabase(event: {
  reference: string;
  transactionId?: string;
  phone?: string;
  amount: number;
  currency: string;
  status: string;
  payload?: Record<string, unknown>;
}): Promise<void> {
  if (typeof window === 'undefined' && isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      await supabase.from('payment_events').upsert({
        reference: event.reference,
        transaction_id: event.transactionId || null,
        phone: event.phone || '',
        amount: event.amount,
        currency: event.currency || 'XAF',
        status: event.status,
        provider: 'MTN_MOMO',
        payload: event.payload || {},
        processed_at: new Date().toISOString(),
      }, { onConflict: 'reference' });
    } catch (err) {
      console.warn('Persistance événement de paiement différée:', err);
    }
  }
}

/**
 * Vérifie l'idempotence d'un événement de paiement dans PostgreSQL.
 */
export async function isPaymentEventProcessedInDatabase(reference: string): Promise<boolean> {
  if (typeof window === 'undefined' && isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('payment_events')
        .select('reference, status')
        .eq('reference', reference)
        .maybeSingle();

      if (!error && data && data.status === 'SUCCESSFUL') {
        return true;
      }
    } catch {
      return false;
    }
  }
  return false;
}

export function processMtnMomoWebhook(
  payload: MtnWebhookPayload,
  idempotencyKey?: string,
  options?: { strictRegistry?: boolean }
): { success: boolean; alreadyProcessed: boolean; message: string; transaction?: PaymentTransaction } {
  const key = idempotencyKey || payload.reference || payload.transactionId;

  // 1. Vérification d'idempotence mémoire
  if (processedTransactionIds.has(key)) {
    return {
      success: true,
      alreadyProcessed: true,
      message: `Transaction ${key} déjà traitée précédemment (idempotence respectée).`,
    };
  }

  const existing = transactionsStore.get(payload.transactionId);

  // 2. Traitement d'une transaction existante
  if (existing) {
    // Vérification de cohérence du montant et de la devise
    if (payload.amount !== undefined && Number(payload.amount) !== existing.amount) {
      return {
        success: false,
        alreadyProcessed: false,
        message: `Incohérence de montant détectée : attendu ${existing.amount}, reçu ${payload.amount}. Transaction rejetée.`,
        transaction: existing,
      };
    }

    if (payload.currency && payload.currency !== existing.currency) {
      return {
        success: false,
        alreadyProcessed: false,
        message: `Incohérence de devise détectée : attendu ${existing.currency}, reçu ${payload.currency}. Transaction rejetée.`,
        transaction: existing,
      };
    }

    // Enregistrement comme traitée pour idempotence
    processedTransactionIds.add(key);

    existing.status = payload.status === 'SUCCESSFUL' ? 'successful' : payload.status === 'FAILED' ? 'failed' : 'pending';
    existing.completedAt = new Date().toISOString();
    if (payload.financialTransactionId) {
      existing.externalReference = payload.financialTransactionId;
    }
    transactionsStore.set(payload.transactionId, existing);

    // Persistance asynchrone dans PostgreSQL
    persistPaymentEventToDatabase({
      reference: existing.reference,
      transactionId: existing.id,
      phone: existing.phoneNumber,
      amount: existing.amount,
      currency: existing.currency,
      status: payload.status,
      payload: { ...payload },
    }).catch(err => console.warn('Erreur persistance Postgres:', err));

    return {
      success: true,
      alreadyProcessed: false,
      message: `Transaction ${existing.reference} mise à jour avec succès : ${existing.status}.`,
      transaction: existing,
    };
  }

  // 3. Cas d'une transaction inconnue du registre
  if (options?.strictRegistry) {
    return {
      success: false,
      alreadyProcessed: false,
      message: `Transaction ${payload.transactionId} inconnue du registre. Notification rejetée.`,
    };
  }

  // Enregistrement tolérant (mode test ou initialisation souple)
  processedTransactionIds.add(key);

  persistPaymentEventToDatabase({
    reference: key,
    transactionId: payload.transactionId,
    amount: payload.amount,
    currency: payload.currency,
    status: payload.status,
    payload: { ...payload },
  }).catch(err => console.warn('Erreur persistance Postgres:', err));

  return {
    success: true,
    alreadyProcessed: false,
    message: `Paiement enregistré avec la référence ${key}.`,
  };
}

/**
 * Récupère toutes les transactions enregistrées
 */
export function getSavedTransactions(): PaymentTransaction[] {
  return Array.from(transactionsStore.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}
