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
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* En-tête / Bloc Hero */}
      <div className="panel panel--hero flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-red uppercase tracking-wider mb-1">
            <CreditCard className="w-4 h-4 text-red" />
            <span>MONÉTISATION & FORFAITS CEMAC (CONGO)</span>
          </div>
          <h1 className="text-lg font-bold text-white tracking-wide">
            ABONNEMENT & CONSOMMATION DES RESSOURCES
          </h1>
          <p className="text-xs text-white/70 mt-1">
            Gérez vos forfaits en toute transparence. Règlement direct par MTN Mobile Money en Francs CFA (XAF).
          </p>
        </div>

        <div className="tabs">
          <button
            onClick={() => setSelectedBillingCycle('monthly')}
            aria-selected={selectedBillingCycle === 'monthly'}
            className="tab"
          >
            MENSUEL
          </button>
          <button
            onClick={() => setSelectedBillingCycle('yearly')}
            aria-selected={selectedBillingCycle === 'yearly'}
            className="tab"
          >
            ANNUEL (-20%)
          </button>
        </div>
      </div>

      {/* État actuel de consommation des quotas */}
      <div className="panel space-y-4">
        <div className="flex items-center justify-between border-b border-[#242424] pb-3">
          <div>
            <h2 className="panel-title mb-0">
              VOTRE OFFRE ACTIVE : <span className="text-red font-bold">{currentPlan.name}</span>
            </h2>
            <p className="text-xs text-white/45 mt-1">
              Renouvellement automatique le 12 novembre 2026 • Statut : Actif
            </p>
          </div>
          <span className="badge badge--ok">
            ABONNEMENT VALIDE
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          {/* Quota Projets */}
          <div className="card-inner space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-white/70 flex items-center gap-2">
                <Layers className="w-4 h-4 text-red" />
                Projets actifs
              </span>
              <span className="text-sm font-mono font-bold text-white">
                {quotas.activeProjects.used} / {quotas.activeProjects.max}
              </span>
            </div>
            <div className="progress">
              <span style={{ width: `${Math.min(100, Math.round((quotas.activeProjects.used / quotas.activeProjects.max) * 100))}%` }} />
            </div>
          </div>

          {/* Quota Membres */}
          <div className="card-inner space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-white/70 flex items-center gap-2">
                <Users className="w-4 h-4 text-red" />
                Membres d’équipe
              </span>
              <span className="text-sm font-mono font-bold text-white">
                {quotas.members.used} / {quotas.members.max}
              </span>
            </div>
            <div className="progress">
              <span style={{ width: `${Math.min(100, Math.round((quotas.members.used / quotas.members.max) * 100))}%` }} />
            </div>
          </div>

          {/* Quota Stockage */}
          <div className="card-inner space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-white/70 flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-red" />
                Stockage documents
              </span>
              <span className="text-sm font-mono font-bold text-white">
                {quotas.storage.usedMb} Mo / {quotas.storage.maxMb >= 1000 ? `${Math.round(quotas.storage.maxMb / 1024)} Go` : `${quotas.storage.maxMb} Mo`}
              </span>
            </div>
            <div className="progress">
              <span style={{ width: `${Math.min(100, Math.round((quotas.storage.usedMb / quotas.storage.maxMb) * 100))}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Grille des offres en FCFA */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map(plan => {
          const isCurrent = subscription.planCode === plan.code;
          const displayPrice = selectedBillingCycle === 'yearly' && plan.priceMonth > 0 
            ? Math.round(plan.priceMonth * 0.8) 
            : plan.priceMonth;

          return (
            <div
              key={plan.id}
              className={`panel flex flex-col justify-between relative transition ${
                plan.isPopular
                  ? 'border-red shadow-[0_0_22px_rgba(255,0,0,0.35)]'
                  : 'border-[#242424]'
              }`}
            >
              {plan.isPopular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-[4px] text-[10px] font-bold bg-red text-white uppercase tracking-wider border border-red">
                  RECOMMANDÉ
                </span>
              )}

              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wide">
                    {plan.name}
                  </h3>
                  <p className="text-xs text-white/45 mt-1">
                    {plan.tagline}
                  </p>
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-mono font-bold text-white">
                    {formatCurrency(displayPrice, 'XAF')}
                  </span>
                  <span className="text-xs text-white/45">
                    / mois {selectedBillingCycle === 'yearly' && plan.priceMonth > 0 ? '(facturé annuellement)' : ''}
                  </span>
                </div>

                <div className="space-y-2 pt-3 border-t border-[#242424] text-xs">
                  {plan.features.map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-white/70">
                      <Check className="w-4 h-4 text-red flex-shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-6">
                {isCurrent ? (
                  <button
                    disabled
                    className="btn btn-secondary btn-block opacity-45 cursor-not-allowed"
                  >
                    OFFRE ACTUELLEMENT ACTIVE
                  </button>
                ) : (
                  <button
                    onClick={() => handleSelectPlan(plan)}
                    className={plan.isPopular ? 'btn btn-primary btn-block' : 'btn btn-secondary btn-block'}
                  >
                    <span>CHOISIR {plan.name}</span>
                    {plan.priceMonth > 0 && (
                      <span className="badge badge--ok text-[9px] py-0 px-1 ml-1">
                        MOMO
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
      <div className="panel space-y-4">
        <div className="flex items-center justify-between border-b border-[#242424] pb-3">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-red" />
            <h3 className="panel-title mb-0">
              HISTORIQUE DES FACTURES & RÈGLEMENTS MTN CONGO
            </h3>
          </div>
          <span className="tag-mono text-white/45">
            DEVISE : XAF (FCFA CEMAC)
          </span>
        </div>

        {transactions.length === 0 ? (
          <div className="empty py-8">
            <Receipt className="w-8 h-8 text-red" />
            <div className="text-sm font-bold text-white uppercase tracking-wider">
              AUCUNE TRANSACTION MOBILE MONEY
            </div>
            <p className="text-xs text-white/45">
              Vos prochains reçus MTN Congo apparaîtront automatiquement ici avec option d'impression.
            </p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>FORFAIT</th>
                  <th>OPÉRATEUR</th>
                  <th>RÉFÉRENCE</th>
                  <th>DATE & HEURE</th>
                  <th>NUMÉRO</th>
                  <th>MONTANT</th>
                  <th>STATUT</th>
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(tx => (
                  <tr key={tx.id}>
                    <td className="font-bold text-white">{tx.planName}</td>
                    <td>
                      <span className="badge badge--ok">MTN MOMO</span>
                    </td>
                    <td className="font-mono text-white/70">{tx.reference}</td>
                    <td className="font-mono text-white/70">
                      {new Date(tx.createdAt).toLocaleDateString('fr-CG')} à {new Date(tx.createdAt).toLocaleTimeString('fr-CG')}
                    </td>
                    <td className="font-mono text-white">{tx.phoneNumber}</td>
                    <td className="font-mono font-bold text-white">
                      {formatCurrency(tx.amount, 'XAF')}
                    </td>
                    <td>
                      <span className="badge badge--ok">PAYÉ</span>
                    </td>
                    <td>
                      <button
                        onClick={() => window.print()}
                        className="btn btn-secondary btn-sm"
                        title="Imprimer le reçu"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>REÇU</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
