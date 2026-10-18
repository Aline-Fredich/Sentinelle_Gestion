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
});
