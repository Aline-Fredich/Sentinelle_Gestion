'use client';

import React, { useState } from 'react';
import { 
  CreditCard, Check, Shield, AlertCircle, ArrowUpRight, 
  Sparkles, Layers, Users, HardDrive, CheckCircle2, Receipt, Download, Smartphone
} from 'lucide-react';
import { useSentinel } from '@/lib/store';
import { SubscriptionPlan, PaymentTransaction } from '@/types/sentinel';
import { formatCurrency } from '@/lib/currencyUtils';
import { PaymentModal } from './PaymentModal';
import { getSavedTransactions } from '@/lib/payments/mtnMomo';

export function BillingView() {
  const { subscription, plans, quotas, upgradePlan } = useSentinel();
  const [selectedBillingCycle, setSelectedBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  // Modale de paiement MTN MoMo
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [targetPlanToPay, setTargetPlanToPay] = useState<SubscriptionPlan | null>(null);

  const currentPlan = plans.find(p => p.code === subscription.planCode) || plans[0];
  const transactions = getSavedTransactions();

  const handleSelectPlan = (plan: SubscriptionPlan) => {
    if (plan.priceMonth === 0) {
      upgradePlan(plan.code);
    } else {
      setTargetPlanToPay(plan);
      setIsPaymentModalOpen(true);
    }
  };

  return (
    <div className="space-y-7 max-w-5xl mx-auto pb-12">
      {/* En-tête */}
      <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-[#E4E7EC] dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#0071E3] dark:text-[#2997FF] mb-1 uppercase tracking-wider">
            <CreditCard className="w-3.5 h-3.5" />
            Monétisation & Forfaits CEMAC (Congo)
          </div>
          <h1 className="text-xl font-bold text-[#202733] dark:text-white">
            Abonnement & Consommation des ressources
          </h1>
          <p className="text-xs text-[#667085] dark:text-slate-400 mt-1">
            Gérez vos forfaits en toute transparence. Règlement direct par MTN Mobile Money en Francs CFA (XAF).
          </p>
        </div>

        <div className="flex items-center gap-2 bg-[#F6F7F9] dark:bg-slate-800 p-1 rounded-xl border border-[#E4E7EC] dark:border-slate-700 text-xs font-semibold">
          <button
            onClick={() => setSelectedBillingCycle('monthly')}
            className={`px-3 py-1.5 rounded-lg transition ${
              selectedBillingCycle === 'monthly'
                ? 'bg-white dark:bg-slate-900 text-[#202733] dark:text-white shadow-sm'
                : 'text-[#667085]'
            }`}
          >
            Mensuel
          </button>
          <button
            onClick={() => setSelectedBillingCycle('yearly')}
            className={`px-3 py-1.5 rounded-lg transition ${
              selectedBillingCycle === 'yearly'
                ? 'bg-white dark:bg-slate-900 text-[#202733] dark:text-white shadow-sm'
                : 'text-[#667085]'
            }`}
          >
            Annuel (-20%)
          </button>
        </div>
      </div>

      {/* État actuel de consommation des quotas */}
      <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-[#E4E7EC] dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-[#E4E7EC] dark:border-slate-800 pb-3">
          <div>
            <h2 className="text-sm font-bold text-[#202733] dark:text-white">
              Votre offre active : <span className="text-[#0071E3] dark:text-[#2997FF] font-black">{currentPlan.name}</span>
            </h2>
            <p className="text-xs text-[#667085]">
              Renouvellement automatique le 12 novembre 2026 • Statut : Actif
            </p>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-[#23845B] dark:bg-emerald-950/40">
            Abonnement valide
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          {/* Quota Projets */}
          <div className="p-4 rounded-xl bg-[#F6F7F9] dark:bg-slate-800/50 border border-[#E4E7EC] dark:border-slate-800 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[#667085] flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-blue-500" />
                Projets actifs
              </span>
              <span className="font-bold text-[#202733] dark:text-white">
                {quotas.activeProjects.used} / {quotas.activeProjects.max}
              </span>
            </div>
            <div className="w-full bg-[#EEF1F4] dark:bg-slate-700 h-2 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#3478C8] rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.round((quotas.activeProjects.used / quotas.activeProjects.max) * 100))}%` }}
              />
            </div>
          </div>

          {/* Quota Membres */}
          <div className="p-4 rounded-xl bg-[#F6F7F9] dark:bg-slate-800/50 border border-[#E4E7EC] dark:border-slate-800 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[#667085] flex items-center gap-1.5">
                <Users className="w-4 h-4 text-emerald-500" />
                Membres d’équipe
              </span>
              <span className="font-bold text-[#202733] dark:text-white">
                {quotas.members.used} / {quotas.members.max}
              </span>
            </div>
            <div className="w-full bg-[#EEF1F4] dark:bg-slate-700 h-2 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#23845B] rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.round((quotas.members.used / quotas.members.max) * 100))}%` }}
              />
            </div>
          </div>

          {/* Quota Stockage */}
          <div className="p-4 rounded-xl bg-[#F6F7F9] dark:bg-slate-800/50 border border-[#E4E7EC] dark:border-slate-800 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[#667085] flex items-center gap-1.5">
                <HardDrive className="w-4 h-4 text-amber-500" />
                Stockage documents
              </span>
              <span className="font-bold text-[#202733] dark:text-white">
                {quotas.storage.usedMb} Mo / {quotas.storage.maxMb >= 1000 ? `${Math.round(quotas.storage.maxMb / 1024)} Go` : `${quotas.storage.maxMb} Mo`}
              </span>
            </div>
            <div className="w-full bg-[#EEF1F4] dark:bg-slate-700 h-2 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#D69A24] rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.round((quotas.storage.usedMb / quotas.storage.maxMb) * 100))}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Grille des offres en FCFA */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map(plan => {
          const isCurrent = subscription.planCode === plan.code;
          const displayPrice = selectedBillingCycle === 'yearly' && plan.priceMonth > 0 
            ? Math.round(plan.priceMonth * 0.8) 
            : plan.priceMonth;

          return (
            <div
              key={plan.id}
              className={`p-6 rounded-3xl bg-white dark:bg-slate-900 border flex flex-col justify-between transition relative shadow-sm ${
                plan.isPopular
                  ? 'border-[#0071E3] dark:border-[#2997FF] shadow-lg ring-1 ring-[#0071E3]'
                  : 'border-[#E4E7EC] dark:border-slate-800'
              }`}
            >
              {plan.isPopular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-bold bg-[#0071E3] text-white shadow-sm uppercase tracking-wider">
                  Recommandé
                </span>
              )}

              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-bold text-[#202733] dark:text-white">
                    {plan.name}
                  </h3>
                  <p className="text-xs text-[#667085] mt-1">
                    {plan.tagline}
                  </p>
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-[#202733] dark:text-white">
                    {formatCurrency(displayPrice, 'XAF')}
                  </span>
                  <span className="text-xs text-[#667085]">
                    / mois {selectedBillingCycle === 'yearly' && plan.priceMonth > 0 ? '(facturé annuellement)' : ''}
                  </span>
                </div>

                <div className="space-y-2 pt-2 border-t border-[#E4E7EC] dark:border-slate-800 text-xs">
                  {plan.features.map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-[#202733] dark:text-slate-300">
                      <Check className="w-4 h-4 text-[#23845B] flex-shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-6">
                {isCurrent ? (
                  <button
                    disabled
                    className="w-full py-2.5 text-xs font-semibold rounded-xl bg-[#F6F7F9] dark:bg-slate-800 text-[#667085] border border-[#E4E7EC] dark:border-slate-700 cursor-default"
                  >
                    Offre actuellement active
                  </button>
                ) : (
                  <button
                    onClick={() => handleSelectPlan(plan)}
                    className={`w-full py-2.5 text-xs font-bold rounded-xl transition shadow-sm flex items-center justify-center gap-1.5 ${
                      plan.isPopular
                        ? 'bg-[#0071E3] hover:bg-[#005bb5] text-white'
                        : 'bg-[#202733] hover:bg-slate-800 text-white dark:bg-slate-800 dark:hover:bg-slate-700'
                    }`}
                  >
                    <span>Choisir {plan.name}</span>
                    {plan.priceMonth > 0 && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] bg-[#FFCC00] text-black font-extrabold uppercase ml-1">
                        MoMo
                      </span>
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Historique des Factures & Reçus Mobile Money */}
      <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-[#E4E7EC] dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-[#E4E7EC] dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-[#0071E3] dark:text-[#2997FF]" />
            <h3 className="text-sm font-bold text-[#202733] dark:text-white">
              Historique des Factures & Règlements MTN Congo
            </h3>
          </div>
          <span className="text-xs text-[#667085]">
            Devise officielle : XAF (FCFA CEMAC)
          </span>
        </div>

        {transactions.length === 0 ? (
          <div className="py-6 text-center space-y-1 text-xs text-[#667085]">
            <p>Aucune transaction Mobile Money enregistrée pour le moment.</p>
            <p className="text-[11px] text-slate-400">
              Vos prochains reçus MTN Congo apparaîtront automatiquement ici avec option d'impression.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#E4E7EC] dark:divide-slate-800 text-xs">
            {transactions.map(tx => (
              <div key={tx.id} className="py-3 flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>{tx.planName}</span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-[#FFCC00] text-black">
                      MTN
                    </span>
                    <span className="text-slate-400 font-mono text-[11px]">{tx.reference}</span>
                  </div>
                  <div className="text-[11px] text-[#667085]">
                    {new Date(tx.createdAt).toLocaleDateString('fr-CG')} à {new Date(tx.createdAt).toLocaleTimeString('fr-CG')} • {tx.phoneNumber}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className="font-black text-slate-900 dark:text-white">
                    {formatCurrency(tx.amount, 'XAF')}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-[#23845B] dark:bg-emerald-950/40">
                    Payé
                  </span>
                  <button
                    onClick={() => window.print()}
                    className="p-1.5 rounded-lg border border-black/5 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10 text-slate-500"
                    title="Imprimer le reçu"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modale de paiement MTN MoMo */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        targetPlan={targetPlanToPay}
        billingCycle={selectedBillingCycle}
      />
    </div>
  );
}

