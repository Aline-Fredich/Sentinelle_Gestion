'use client';

import React, { useState } from 'react';
import { 
  CreditCard, Check, Shield, AlertCircle, ArrowUpRight, 
  Sparkles, Layers, Users, HardDrive, CheckCircle2 
} from 'lucide-react';
import { useSentinel } from '@/lib/store';

export function BillingView() {
  const { subscription, plans, quotas, upgradePlan } = useSentinel();
  const [selectedBillingCycle, setSelectedBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const currentPlan = plans.find(p => p.code === subscription.planCode) || plans[0];

  return (
    <div className="space-y-7 max-w-5xl mx-auto">
      {/* En-tête */}
      <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-[#E4E7EC] dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#C83B42] dark:text-rose-400 mb-1 uppercase tracking-wider">
            <CreditCard className="w-3.5 h-3.5" />
            Monétisation & Quotas
          </div>
          <h1 className="text-xl font-bold text-[#202733] dark:text-white">
            Abonnement & Consommation des ressources
          </h1>
          <p className="text-xs text-[#667085] dark:text-slate-400 mt-1">
            Gérez vos forfaits en toute transparence. Les quotas sont appliqués de manière prédictive.
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

      {/* État actuel de consommation des quotas (Section 11.3) */}
      <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-[#E4E7EC] dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-[#E4E7EC] dark:border-slate-800 pb-3">
          <div>
            <h2 className="text-sm font-bold text-[#202733] dark:text-white">
              Votre offre active : <span className="text-[#C83B42] font-black">{currentPlan.name}</span>
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

      {/* Grille des offres (Section 11.1) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map(plan => {
          const isCurrent = subscription.planCode === plan.code;
          const displayPrice = selectedBillingCycle === 'yearly' && plan.priceMonth > 0 
            ? Math.round(plan.priceMonth * 0.8) 
            : plan.priceMonth;

          return (
            <div
              key={plan.id}
              className={`p-6 rounded-2xl bg-white dark:bg-slate-900 border flex flex-col justify-between transition relative ${
                plan.isPopular
                  ? 'border-[#C83B42] shadow-lg ring-1 ring-[#C83B42]'
                  : 'border-[#E4E7EC] dark:border-slate-800 shadow-sm'
              }`}
            >
              {plan.isPopular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-bold bg-[#C83B42] text-white shadow-sm uppercase tracking-wider">
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
                  <span className="text-3xl font-black text-[#202733] dark:text-white">
                    {displayPrice} {plan.currency}
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
                    onClick={() => upgradePlan(plan.code)}
                    className={`w-full py-2.5 text-xs font-semibold rounded-xl transition shadow-sm ${
                      plan.isPopular
                        ? 'bg-[#C83B42] hover:bg-[#b03037] text-white'
                        : 'bg-[#202733] hover:bg-slate-800 text-white dark:bg-slate-800 dark:hover:bg-slate-700'
                    }`}
                  >
                    Choisir l’offre {plan.name}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
