/**
 * SENTINEL GESTION - Passerelle de Paiement Mobile Money MTN Congo-Brazzaville
 * Opérateur : MTN Congo (+242)
 * Devise officielle : FCFA CEMAC (Code ISO : XAF)
 * Support de l'idempotence des transactions et validation stricte des numéros.
 */

import type { PaymentTransaction } from '../../types/sentinel.ts';
import { formatCurrency } from '../currencyUtils.ts';

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

export function processMtnMomoWebhook(
  payload: MtnWebhookPayload,
  idempotencyKey?: string
): { success: boolean; alreadyProcessed: boolean; message: string; transaction?: PaymentTransaction } {
  const key = idempotencyKey || payload.reference || payload.transactionId;

  if (processedTransactionIds.has(key)) {
    return {
      success: true,
      alreadyProcessed: true,
      message: `Transaction ${key} déjà traitée précédemment (idempotence respectée).`,
    };
  }

  // Enregistrement comme traitée
  processedTransactionIds.add(key);

  const existing = transactionsStore.get(payload.transactionId);
  if (existing) {
    existing.status = payload.status === 'SUCCESSFUL' ? 'successful' : payload.status === 'FAILED' ? 'failed' : 'pending';
    existing.completedAt = new Date().toISOString();
    transactionsStore.set(payload.transactionId, existing);
    return {
      success: true,
      alreadyProcessed: false,
      message: `Transaction ${existing.reference} mise à jour avec succès : ${existing.status}.`,
      transaction: existing,
    };
  }

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
