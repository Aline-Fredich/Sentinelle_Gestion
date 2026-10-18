'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, ShieldCheck, Smartphone, CheckCircle2, AlertCircle, 
  Loader2, ArrowRight, Download, Receipt, PhoneCall, Sparkles, Building2
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
    } catch (err: any) {
      setPhoneError(err.message || 'Impossible d’initialiser le paiement.');
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
    } catch (err: any) {
      console.error(err);
    }
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-white dark:bg-[#1C1C1E] rounded-3xl border border-black/10 dark:border-white/10 shadow-[0_24px_70px_rgba(0,0,0,0.25)] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* En-tête macOS Apple */}
        <div className="px-6 py-4 border-b border-black/5 dark:border-white/10 flex items-center justify-between bg-[#F5F5F7]/90 dark:bg-[#2C2C2E]/60 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#FF5F56] border border-[#E0443E]" />
              <span className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-[#DEA123]" />
              <span className="w-3 h-3 rounded-full bg-[#27C93F] border border-[#1AAB29]" />
            </div>
            <div className="h-4 w-[1px] bg-black/10 dark:bg-white/10 mx-1" />
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Paiement Mobile Money • Congo (+242)
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/10 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Corps */}
        <div className="p-6 space-y-6">
          {/* Étape 1 : Formulaire de paiement */}
          {step === 'input' && (
            <form onSubmit={handleInitiate} className="space-y-5">
              {/* Opérateur sélectionné */}
              <div className="p-4 rounded-2xl bg-[#FFCC00]/15 dark:bg-[#FFCC00]/10 border border-[#FFCC00]/40 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-[#FFCC00] text-black font-black flex items-center justify-center text-sm shadow-sm">
                    MTN
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span>MTN Mobile Money Congo</span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-[#FFCC00] text-black">
                        Direct
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600 dark:text-slate-400">
                      Règlement instantané en Francs CFA CEMAC (XAF)
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-extrabold text-[#34C759] flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    256-bit SSL
                  </span>
                </div>
              </div>

              {/* Récapitulatif Commande */}
              <div className="p-4 rounded-2xl bg-[#F5F5F7] dark:bg-[#2C2C2E] border border-black/5 dark:border-white/10 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400">Forfait sélectionné :</span>
                  <span className="font-bold text-slate-900 dark:text-white">{targetPlan.name}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400">Période de facturation :</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {billingCycle === 'yearly' ? 'Annuelle (avec remise -20%)' : 'Mensuelle'}
                  </span>
                </div>
                <div className="pt-2 border-t border-black/5 dark:border-white/10 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">Montant total TTC :</span>
                  <span className="text-lg font-black text-[#0071E3] dark:text-[#2997FF]">
                    {formatCurrency(finalAmount, 'XAF')}
                  </span>
                </div>
              </div>

              {/* Saisie Numéro Téléphone MTN */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-[#0071E3]" />
                    Numéro de téléphone MTN Mobile Money
                  </span>
                  <span className="text-[11px] text-slate-400">Congo (+242)</span>
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">
                    +242
                  </div>
                  <input
                    type="tel"
                    required
                    value={phoneNumber}
                    onChange={e => {
                      setPhoneNumber(e.target.value);
                      setPhoneError('');
                    }}
                    placeholder="06 600 00 00"
                    className="apple-input w-full pl-16 text-sm font-semibold tracking-wider"
                  />
                </div>
                {phoneError && (
                  <p className="text-[11px] text-red-500 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3 h-3" />
                    {phoneError}
                  </p>
                )}
                <p className="text-[11px] text-slate-400">
                  Composez un numéro commençant par 06 (064, 065, 066, 068, 069).
                </p>
              </div>

              {/* Bouton de validation */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="apple-btn-primary w-full py-3 text-xs font-bold flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Connexion au réseau MTN Congo...</span>
                    </>
                  ) : (
                    <>
                      <span>Payer {formatCurrency(finalAmount, 'XAF')} via MTN MoMo</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Étape 2 : En attente de validation USSD */}
          {step === 'ussd_pending' && activeTransaction && (
            <div className="space-y-6 text-center py-2">
              <div className="w-16 h-16 rounded-full bg-[#FFCC00]/20 border-2 border-[#FFCC00] flex items-center justify-center mx-auto text-[#DEA123] animate-pulse">
                <PhoneCall className="w-8 h-8" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Autorisation requise sur votre téléphone
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  Une invite de validation MTN a été envoyée au{' '}
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {activeTransaction.phoneNumber}
                  </span>
                  . Composez le code PIN pour autoriser le paiement de{' '}
                  <span className="font-bold text-[#0071E3] dark:text-[#2997FF]">
                    {formatCurrency(finalAmount, 'XAF')}
                  </span>
                  .
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#F5F5F7] dark:bg-[#2C2C2E] border border-black/5 dark:border-white/10 text-xs space-y-1 text-left">
                <div className="flex justify-between">
                  <span className="text-slate-400">Référence transaction :</span>
                  <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                    {activeTransaction.reference}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Temps restant :</span>
                  <span className="font-bold text-amber-600 dark:text-amber-400">
                    {countdown} secondes
                  </span>
                </div>
              </div>

              {/* Bouton de confirmation interactif (Bac à sable / Validation) */}
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={handleSimulateApproval}
                  className="apple-btn-primary w-full py-3 text-xs font-bold flex items-center justify-center gap-2 bg-[#34C759] hover:bg-[#2EB04E] text-white"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirmer la saisie du code PIN (Validation MoMo)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStep('input')}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                >
                  Modifier le numéro de téléphone
                </button>
              </div>
            </div>
          )}

          {/* Étape 3 : Paiement réussi & Reçu */}
          {step === 'success' && activeTransaction && (
            <div className="space-y-6 text-center py-2 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-full bg-[#34C759]/15 border-2 border-[#34C759] flex items-center justify-center mx-auto text-[#34C759]">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Paiement MTN Mobile Money Validé !
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Votre espace SENTINEL GESTION a été mis à niveau avec succès vers l’offre{' '}
                  <span className="font-bold text-[#0071E3] dark:text-[#2997FF]">{targetPlan.name}</span>.
                </p>
              </div>

              {/* Reçu officiel imprimable */}
              <div className="p-5 rounded-2xl bg-[#F5F5F7] dark:bg-[#2C2C2E] border border-black/5 dark:border-white/10 text-left space-y-3 font-mono text-[11px]">
                <div className="flex items-center justify-between border-b border-black/5 dark:border-white/10 pb-2">
                  <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                    <Receipt className="w-3.5 h-3.5 text-[#0071E3]" />
                    <span>REÇU OFFICIEL DE FACTURATION</span>
                  </div>
                  <span className="text-[#34C759] font-bold">PAYÉ</span>
                </div>

                <div className="space-y-1 text-slate-600 dark:text-slate-300">
                  <div className="flex justify-between">
                    <span>N° de Reçu :</span>
                    <span className="font-bold">{activeTransaction.receiptNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Réf. MTN Congo :</span>
                    <span className="font-bold">{activeTransaction.reference}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Date & Heure :</span>
                    <span>{new Date().toLocaleString('fr-CG')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Souscripteur :</span>
                    <span>{currentUser.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Téléphone débiteur :</span>
                    <span>{activeTransaction.phoneNumber}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-black/5 dark:border-white/10 flex justify-between font-bold text-xs text-slate-900 dark:text-white">
                  <span>Total Réglé :</span>
                  <span className="text-[#0071E3] dark:text-[#2997FF]">
                    {formatCurrency(finalAmount, 'XAF')}
                  </span>
                </div>
              </div>

              {/* Actions finales */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handlePrintReceipt}
                  className="apple-btn-secondary flex-1 py-2.5 text-xs font-semibold flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Imprimer le reçu</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="apple-btn-primary flex-1 py-2.5 text-xs font-bold"
                >
                  Accéder à mes projets
                </button>
              </div>
            </div>
          )}

          {/* Pied de page de sécurité */}
          <div className="pt-2 text-center border-t border-black/5 dark:border-white/10">
            <span className="text-[11px] text-slate-400 flex items-center justify-center gap-1">
              <ShieldCheck className="w-3 h-3 text-[#34C759]" />
              Transactions auditées • Idempotence garantie & Chiffrement de bout en bout
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
