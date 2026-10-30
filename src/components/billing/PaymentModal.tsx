'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, ShieldCheck, Smartphone, CheckCircle2, AlertCircle, 
  Loader2, ArrowRight, Download, Receipt, PhoneCall
} from 'lucide-react';
import { useSentinel } from '@/lib/store';
import { SubscriptionPlan, PaymentTransaction } from '@/types/sentinel';
import { formatCurrency } from '@/lib/currencyUtils';
import { 
  validateMtnCongoNumber, 
  initiateMtnMomoPayment, 
  confirmPaymentTransaction 
} from '@/lib/payments/mtnMomo';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetPlan: SubscriptionPlan | null;
  billingCycle: 'monthly' | 'yearly';
}

export function PaymentModal({ isOpen, onClose, targetPlan, billingCycle }: PaymentModalProps) {
  const { upgradePlan, currentUser, addNotification } = useSentinel();

  const [step, setStep] = useState<'input' | 'ussd_pending' | 'success'>('input');
  const [phoneNumber, setPhoneNumber] = useState('066001234');
  const [phoneError, setPhoneError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTransaction, setActiveTransaction] = useState<PaymentTransaction | null>(null);
  const [countdown, setCountdown] = useState(60);

  useEffect(() => {
    if (isOpen) {
      setStep('input');
      setPhoneError('');
      setIsLoading(false);
      setCountdown(60);
    }
  }, [isOpen]);

  // Compte à rebours pour la simulation USSD
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 'ussd_pending' && countdown > 0) {
      timer = setTimeout(() => setCountdown(prev => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [step, countdown]);

  if (!isOpen || !targetPlan) return null;

  // Calcul du montant selon le cycle
  const finalAmount = billingCycle === 'yearly' && targetPlan.priceMonth > 0
    ? Math.round(targetPlan.priceMonth * 12 * 0.8) // 2 mois offerts
    : targetPlan.priceMonth;

  const handleInitiate = async (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneError('');

    const validation = validateMtnCongoNumber(phoneNumber);
    if (!validation.isValid) {
      setPhoneError(validation.errorMessage || 'Numéro MTN Congo invalide.');
      return;
    }

    setIsLoading(true);

    try {
      const tx = await initiateMtnMomoPayment({
        planCode: targetPlan.code,
        planName: targetPlan.name,
        amount: finalAmount,
        billingCycle,
        phoneNumber,
        payerName: currentUser.name,
      });

      setActiveTransaction(tx);
      setStep('ussd_pending');
      setCountdown(45);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Impossible d’initialiser le paiement.';
      setPhoneError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSimulateApproval = () => {
    if (!activeTransaction) return;

    try {
      const confirmed = confirmPaymentTransaction(activeTransaction.id);
      setActiveTransaction(confirmed);

      // Application effective du plan dans le store de Sentinelle
      upgradePlan(targetPlan.code);

      addNotification(
        'Paiement confirmé',
        `Votre forfait ${targetPlan.name} est maintenant actif ! Réf : ${confirmed.reference}.`,
        'system'
      );

      setStep('success');
    } catch (err: unknown) {
      console.error('Erreur confirmation paiement:', err);
    }
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal modal--sm max-w-lg"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* En-tête de la modale */}
        <div className="flex items-center justify-between pb-3 border-b border-[#242424] mb-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red shadow-[var(--glow-sm)]" />
            <h2 className="modal-title mb-0">
              PAIEMENT MOBILE MONEY • CONGO (+242)
            </h2>
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-sm p-1"
            aria-label="Fermer"
          >
            <X className="w-4 h-4 text-white/70" />
          </button>
        </div>

        {/* Corps */}
        <div className="space-y-4">
          {/* Étape 1 : Formulaire de paiement */}
          {step === 'input' && (
            <form onSubmit={handleInitiate} className="space-y-4">
              {/* Opérateur sélectionné */}
              <div className="card-inner flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-[6px] border border-red bg-red/10 text-white font-mono font-bold flex items-center justify-center text-xs">
                    MOMO
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-2 uppercase tracking-wide">
                      <span>MTN Mobile Money Congo</span>
                      <span className="badge badge--ok text-[9px] py-0 px-1">
                        DIRECT
                      </span>
                    </div>
                    <div className="text-micro text-white/45">
                      Règlement instantané en Francs CFA CEMAC (XAF)
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="badge badge--ok text-[10px]">
                    <ShieldCheck className="w-3 h-3 mr-1" />
                    256-BIT SSL
                  </span>
                </div>
              </div>

              {/* Récapitulatif Commande */}
              <div className="card-inner space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/45 uppercase tracking-wider font-bold text-micro">Forfait sélectionné :</span>
                  <span className="font-bold text-white uppercase">{targetPlan.name}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/45 uppercase tracking-wider font-bold text-micro">Période :</span>
                  <span className="font-bold text-white">
                    {billingCycle === 'yearly' ? 'ANNUELLE (-20%)' : 'MENSUELLE'}
                  </span>
                </div>
                <div className="pt-2 border-t border-[#242424] flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-white">Total à régler :</span>
                  <span className="text-lg font-mono font-bold text-red">
                    {formatCurrency(finalAmount, 'XAF')}
                  </span>
                </div>
              </div>

              {/* Saisie Numéro Téléphone MTN */}
              <div className="form-group mb-0">
                <label className="form-label flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-red" />
                    Numéro de téléphone MTN Mobile Money
                  </span>
                  <span className="tag-mono text-white/45">Congo (+242)</span>
                </label>
                <div className="input-group">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-red pointer-events-none">
                    +242
                  </span>
                  <input
                    type="tel"
                    required
                    value={phoneNumber}
                    onChange={e => {
                      setPhoneNumber(e.target.value);
                      setPhoneError('');
                    }}
                    placeholder="06 600 00 00"
                    className="form-input pl-14 font-mono font-bold"
                  />
                </div>
                {phoneError ? (
                  <p className="form-error">
                    <AlertCircle className="w-3.5 h-3.5 text-red" />
                    <span>{phoneError}</span>
                  </p>
                ) : (
                  <p className="form-hint">
                    Numéro débutant par 06 (064, 065, 066, 068, 069).
                  </p>
                )}
              </div>

              {/* Bouton de validation */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn btn-primary btn-block"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>CONNEXION AU RÉSEAU MTN CONGO...</span>
                    </>
                  ) : (
                    <>
                      <span>PAYER {formatCurrency(finalAmount, 'XAF')} VIA MOMO</span>
                      <ArrowRight className="w-4 h-4 text-white" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Étape 2 : En attente de validation USSD */}
          {step === 'ussd_pending' && activeTransaction && (
            <div className="space-y-4 text-center py-2">
              <div className="w-14 h-14 rounded-[8px] border-2 border-red bg-red/10 flex items-center justify-center mx-auto text-red shadow-[0_0_16px_rgba(255,0,0,0.4)] animate-pulse">
                <PhoneCall className="w-7 h-7 text-red" />
              </div>

              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  AUTORISATION REQUISE SUR VOTRE TÉLÉPHONE
                </h3>
                <p className="text-xs text-white/70 max-w-sm mx-auto">
                  Une invite de validation MTN a été envoyée au{' '}
                  <span className="font-mono font-bold text-white">
                    {activeTransaction.phoneNumber}
                  </span>
                  . Composez votre code secret PIN pour débiter{' '}
                  <span className="font-mono font-bold text-red">
                    {formatCurrency(finalAmount, 'XAF')}
                  </span>
                  .
                </p>
              </div>

              <div className="card-inner text-xs space-y-1.5 text-left font-mono">
                <div className="flex justify-between">
                  <span className="text-white/45">RÉFÉRENCE :</span>
                  <span className="text-white font-bold">
                    {activeTransaction.reference}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/45">TEMPS RESTANT :</span>
                  <span className="text-red font-bold">
                    {countdown} SECONDES
                  </span>
                </div>
              </div>

              {/* Bouton de confirmation interactif (Bac à sable / Validation) */}
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={handleSimulateApproval}
                  className="btn btn-primary btn-block"
                >
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>SIMULER LA CONFIRMATION DU PIN (VALIDATION MOMO)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStep('input')}
                  className="btn btn-ghost btn-sm"
                >
                  MODIFIER LE NUMÉRO DE TÉLÉPHONE
                </button>
              </div>
            </div>
          )}

          {/* Étape 3 : Paiement réussi & Reçu */}
          {step === 'success' && activeTransaction && (
            <div className="space-y-4 text-center py-2">
              <div className="w-14 h-14 rounded-[8px] border-2 border-white bg-white/10 flex items-center justify-center mx-auto text-white">
                <CheckCircle2 className="w-7 h-7 text-white" />
              </div>

              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  PAIEMENT MTN MOBILE MONEY VALIDÉ !
                </h3>
                <p className="text-xs text-white/70">
                  Votre espace SENTINELLE DE GESTION est maintenant à jour avec le forfait{' '}
                  <span className="font-bold text-red">{targetPlan.name}</span>.
                </p>
              </div>

              {/* Reçu officiel imprimable */}
              <div className="card-inner text-left space-y-2 font-mono text-[11px]">
                <div className="flex items-center justify-between border-b border-[#242424] pb-2">
                  <div className="flex items-center gap-1.5 font-bold text-white">
                    <Receipt className="w-3.5 h-3.5 text-red" />
                    <span>REÇU OFFICIEL DE FACTURATION</span>
                  </div>
                  <span className="badge badge--ok">PAYÉ</span>
                </div>

                <div className="space-y-1 text-white/70">
                  <div className="flex justify-between">
                    <span>N° DE REÇU :</span>
                    <span className="font-bold text-white">{activeTransaction.receiptNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>RÉF. MTN CONGO :</span>
                    <span className="font-bold text-white">{activeTransaction.reference}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>DATE & HEURE :</span>
                    <span>{new Date().toLocaleString('fr-CG')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>SOUSCRIPTEUR :</span>
                    <span className="text-white">{currentUser.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>DÉBITEUR :</span>
                    <span className="text-white">{activeTransaction.phoneNumber}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#242424] flex justify-between font-bold text-xs text-white">
                  <span>TOTAL RÉGLÉ :</span>
                  <span className="text-red">
                    {formatCurrency(finalAmount, 'XAF')}
                  </span>
                </div>
              </div>

              {/* Actions finales */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={handlePrintReceipt}
                  className="btn btn-secondary flex-1"
                >
                  <Download className="w-4 h-4 text-red" />
                  <span>IMPRIMER LE REÇU</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="btn btn-primary flex-1"
                >
                  <span>TERMINER</span>
                </button>
              </div>
            </div>
          )}

          {/* Pied de page de sécurité */}
          <div className="pt-2 text-center border-t border-[#242424]">
            <span className="text-micro text-white/45 flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3 h-3 text-red" />
              Transactions auditées • Idempotence garantie & Chiffrement de bout en bout
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
