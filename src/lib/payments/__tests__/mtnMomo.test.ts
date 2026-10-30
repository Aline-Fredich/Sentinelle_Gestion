import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { 
  validateMtnCongoNumber, 
  generateTransactionReference, 
  initiateMtnMomoPayment, 
  confirmPaymentTransaction, 
  processMtnMomoWebhook 
} from '../mtnMomo.ts';

describe('Lot 4 — Passerelle Paiements Mobile Money MTN Congo-Brazzaville', () => {
  it('1. Valide fidèlement les numéros de téléphone MTN Congo (+242 06...)', () => {
    // Numéro valide 8 chiffres commençant par 6
    const res1 = validateMtnCongoNumber('066001234');
    assert.equal(res1.isValid, true);
    assert.equal(res1.normalized, '242066001234');
    assert.equal(res1.formatted, '+242 06 600 12 34');

    // Numéro avec indicatif international +242
    const res2 = validateMtnCongoNumber('+242 06 900 55 66');
    assert.equal(res2.isValid, true);
    assert.equal(res2.normalized, '242069005566');

    // Numéro invalide (trop court ou mauvais opérateur)
    const resInvalid = validateMtnCongoNumber('055001234'); // 05 = Airtel, non MTN
    assert.equal(resInvalid.isValid, false);
    assert.ok(resInvalid.errorMessage?.includes('MTN Congo valide'));
  });

  it('2. Génère une référence conforme MTN-CG-YYYYMMDD-XXXX', () => {
    const ref = generateTransactionReference();
    assert.match(ref, /^MTN-CG-\d{8}-\d{4}$/);
  });

  it('3. Initialise et confirme une transaction MTN MoMo en FCFA (XAF)', async () => {
    const tx = await initiateMtnMomoPayment({
      planCode: 'premium',
      planName: 'Pro Premium',
      amount: 15000,
      billingCycle: 'monthly',
      phoneNumber: '06 600 99 88',
      payerName: 'Aline Fredich',
    });

    assert.equal(tx.amount, 15000);
    assert.equal(tx.currency, 'XAF');
    assert.equal(tx.operator, 'mtn_congo');
    assert.equal(tx.status, 'pending');
    assert.ok(tx.reference.startsWith('MTN-CG-'));

    // Confirmation
    const confirmed = confirmPaymentTransaction(tx.id);
    assert.equal(confirmed.status, 'successful');
    assert.ok(confirmed.completedAt !== undefined);
  });

  it('4. Assure l’idempotence stricte des webhooks MTN pour empêcher les doublons', () => {
    const payload = {
      transactionId: 'test_tx_unique_998',
      reference: 'MTN-CG-20261018-8888',
      status: 'SUCCESSFUL' as const,
      amount: 45000,
      currency: 'XAF',
    };

    // Premier appel : doit être traité
    const firstCall = processMtnMomoWebhook(payload, 'idem_key_777');
    assert.equal(firstCall.success, true);
    assert.equal(firstCall.alreadyProcessed, false);

    // Deuxième appel avec la même clé idempotente : doit être ignoré comme doublon
    const secondCall = processMtnMomoWebhook(payload, 'idem_key_777');
    assert.equal(secondCall.success, true);
    assert.equal(secondCall.alreadyProcessed, true);
    assert.ok(secondCall.message.includes('déjà traitée'));
  });

  it('5. Valide fidèlement la signature HMAC-SHA256 du webhook et bloque les falsifications', async () => {
    const { calculateHmacSha256, verifyMtnWebhookSignature } = await import('../mtnMomo.ts');
    const secret = 'cle_secrete_mtn_2026_test';
    const body = JSON.stringify({ transactionId: 'tx_123', amount: 15000, currency: 'XAF' });

    // Signature valide calculée
    const validSig = await calculateHmacSha256(body, secret);
    const isValid = await verifyMtnWebhookSignature(body, validSig, secret);
    assert.equal(isValid, true);

    // Signature avec préfixe 'sha256='
    const isValidPrefixed = await verifyMtnWebhookSignature(body, `sha256=${validSig}`, secret);
    assert.equal(isValidPrefixed, true);

    // Signature falsifiée ou erronée
    const isInvalid = await verifyMtnWebhookSignature(body, '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef', secret);
    assert.equal(isInvalid, false);

    // Signature absente
    const isMissing = await verifyMtnWebhookSignature(body, null, secret);
    assert.equal(isMissing, false);
  });

  it('6. Rejette les incohérences de montant/devise et les transactions non enregistrées en mode strict', async () => {
    const tx = await initiateMtnMomoPayment({
      planCode: 'team',
      planName: 'Team Pack',
      amount: 50000,
      billingCycle: 'yearly',
      phoneNumber: '06 600 11 22',
      payerName: 'Direction',
    });

    // Incohérence de montant
    const alteredPayload = {
      transactionId: tx.id,
      reference: tx.reference,
      status: 'SUCCESSFUL' as const,
      amount: 5000, // Altéré ! Attendu : 50000
      currency: 'XAF',
    };
    const alteredResult = processMtnMomoWebhook(alteredPayload, undefined, { strictRegistry: true });
    assert.equal(alteredResult.success, false);
    assert.ok(alteredResult.message.includes('Incohérence de montant'));

    // Transaction inconnue en mode strict
    const unknownPayload = {
      transactionId: 'tx_totalement_inconnue_999',
      reference: 'MTN-CG-UNKNOWN-999',
      status: 'SUCCESSFUL' as const,
      amount: 10000,
      currency: 'XAF',
    };
    const unknownResult = processMtnMomoWebhook(unknownPayload, undefined, { strictRegistry: true });
    assert.equal(unknownResult.success, false);
    assert.ok(unknownResult.message.includes('inconnue du registre'));
  });
});

