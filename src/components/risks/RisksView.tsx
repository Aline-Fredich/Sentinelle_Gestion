'use client';

import React, { useState, useMemo } from 'react';
import { 
  AlertTriangle, ShieldAlert, Plus, Trash2, 
  CheckCircle2, ArrowRight, ShieldCheck, Activity
} from 'lucide-react';
import { useSentinel } from '@/lib/store';
import { ProjectRisk, RiskSeverity } from '@/types/sentinel';

export function RisksView() {
  const { 
    risks, createRisk, updateRiskStatus, deleteRisk, 
    activeProjectId, currentProject, users, currentUser, projects 
  } = useSentinel();

  const [showAddModal, setShowAddModal] = useState(false);
  const [riskTitle, setRiskTitle] = useState('');
  const [riskDesc, setRiskDesc] = useState('');
  const [riskProb, setRiskProb] = useState<number>(3);
  const [riskImpact, setRiskImpact] = useState<number>(3);
  const [riskOwnerId, setRiskOwnerId] = useState<string>(currentUser.id);
  const [riskMitigation, setRiskMitigation] = useState('');

  const [severityFilter, setSeverityFilter] = useState<RiskSeverity | 'all'>('all');

  const projectRisks = useMemo(() => {
    let list = activeProjectId === 'all'
      ? risks
      : risks.filter(r => r.projectId === activeProjectId);

    if (severityFilter !== 'all') {
      list = list.filter(r => r.severity === severityFilter);
    }
    return list;
  }, [risks, activeProjectId, severityFilter]);

  const criticalCount = projectRisks.filter(r => r.severity === 'critical' || r.severity === 'high').length;
  const mitigatingCount = projectRisks.filter(r => r.status === 'mitigating').length;
  const closedCount = projectRisks.filter(r => r.status === 'closed').length;

  const calculateSeverity = (prob: number, impact: number): RiskSeverity => {
    const score = prob * impact;
    if (score >= 16) return 'critical';
    if (score >= 10) return 'high';
    if (score >= 5) return 'medium';
    return 'low';
  };

  const handleCreateRisk = (e: React.FormEvent) => {
    e.preventDefault();
    if (!riskTitle.trim()) return;

    const fallbackProjectId = projects[0]?.id || 'prj-1';
    const targetProj = activeProjectId === 'all' ? fallbackProjectId : activeProjectId;
    const severity = calculateSeverity(riskProb, riskImpact);

    createRisk({
      projectId: targetProj,
      title: riskTitle.trim(),
      description: riskDesc,
      probability: riskProb as ProjectRisk['probability'],
      impact: riskImpact as ProjectRisk['impact'],
      severity,
      status: 'identified',
      ownerId: riskOwnerId,
      mitigationPlan: riskMitigation,
    });

    setShowAddModal(false);
    setRiskTitle('');
    setRiskDesc('');
    setRiskMitigation('');
  };

  return (
    <div className="space-y-6">
      {/* En-tête du module Risques */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-red-50 dark:bg-red-950/50 flex items-center justify-center text-[#FF1E27] shadow-sm">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Gestion des Risques & Matrice de Criticité
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Anticipez les points de blocage, évaluez probabilité/impact et pilotez les plans de mitigation
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#0066FF] hover:bg-blue-600 rounded-xl shadow-md shadow-blue-500/20 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Identifier un risque</span>
        </button>
      </div>

      {/* KPI de criticité avec filtrage interactif */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <button
          onClick={() => setSeverityFilter('all')}
          className={`p-5 rounded-2xl bg-white dark:bg-[#0F172A] border text-left transition shadow-sm ${
            severityFilter === 'all' ? 'border-[#0066FF] ring-2 ring-blue-500/20' : 'border-slate-200 dark:border-slate-800'
          }`}
        >
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Risques Déclarés</span>
          <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
            {risks.length}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Cliquez pour voir tout</span>
        </button>

        <button
          onClick={() => setSeverityFilter(severityFilter === 'critical' ? 'all' : 'critical')}
          className={`p-5 rounded-2xl bg-white dark:bg-[#0F172A] border text-left transition shadow-sm ${
            severityFilter === 'critical' ? 'border-red-500 ring-2 ring-red-500/20' : 'border-slate-200 dark:border-slate-800'
          }`}
        >
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Risques Critiques</span>
          <div className="mt-2 text-2xl font-black text-[#FF1E27]">
            {criticalCount}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Filtrer les plus urgents</span>
        </button>

        <button
          onClick={() => setSeverityFilter(severityFilter === 'high' ? 'all' : 'high')}
          className={`p-5 rounded-2xl bg-white dark:bg-[#0F172A] border text-left transition shadow-sm ${
            severityFilter === 'high' ? 'border-amber-500 ring-2 ring-amber-500/20' : 'border-slate-200 dark:border-slate-800'
          }`}
        >
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Risques Élevés</span>
          <div className="mt-2 text-2xl font-black text-amber-500">
            {risks.filter(r => r.severity === 'high').length}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Filtrer criticité haute</span>
        </button>

        <button
          onClick={() => setSeverityFilter(severityFilter === 'low' ? 'all' : 'low')}
          className={`p-5 rounded-2xl bg-white dark:bg-[#0F172A] border text-left transition shadow-sm ${
            severityFilter === 'low' ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-slate-200 dark:border-slate-800'
          }`}
        >
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Risques Modérés / Faibles</span>
          <div className="mt-2 text-2xl font-black text-emerald-600">
            {closedCount}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Filtrer sous contrôle</span>
        </button>
      </div>

      {/* Matrice 5x5 Heatmap & Liste des Risques */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Colonne gauche : Matrice 5x5 visuelle */}
        <div className="p-5 bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#FF1E27]" />
            Matrice 5×5 (Impact × Probabilité)
          </h3>

          <div className="space-y-1 pt-2">
            {/* Grille 5x5 simplifiée */}
            <div className="grid grid-cols-5 gap-1.5 text-center text-[10px] font-bold">
              {[5, 4, 3, 2, 1].map(imp => (
                <React.Fragment key={imp}>
                  {[1, 2, 3, 4, 5].map(prob => {
                    const score = imp * prob;
                    const matchingRisks = projectRisks.filter(r => r.impact === imp && r.probability === prob);
                    const bgClass = 
                      score >= 16 ? 'bg-red-500 text-white' :
                      score >= 10 ? 'bg-amber-500 text-white' :
                      score >= 5 ? 'bg-yellow-400 text-slate-900' :
                      'bg-emerald-400 text-slate-900';

                    return (
                      <div
                        key={`${imp}-${prob}`}
                        title={`Impact ${imp} / Probabilité ${prob} (${matchingRisks.length} risque(s))`}
                        className={`h-11 rounded-lg flex flex-col items-center justify-center transition-all ${bgClass} ${
                          matchingRisks.length > 0 ? 'ring-2 ring-blue-500 shadow-md font-black scale-105' : 'opacity-60'
                        }`}
                      >
                        <span>{matchingRisks.length > 0 ? `${matchingRisks.length}R` : score}</span>
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 font-semibold">
              <span>Faible (1)</span>
              <span>Impact ➔</span>
              <span>Critique (5)</span>
            </div>
          </div>
        </div>

        {/* Colonne droite : Liste détaillée des risques */}
        <div className="lg:col-span-2 bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Plan de Mitigation des Risques
            </h3>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {projectRisks.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                Aucun risque déclaré pour ce périmètre.
              </div>
            ) : (
              projectRisks.map(r => {
                const owner = users.find(u => u.id === r.ownerId);
                const severityBadges: Record<RiskSeverity, string> = {
                  critical: 'bg-red-100 text-[#FF1E27] font-black',
                  high: 'bg-amber-100 text-amber-800 font-bold',
                  medium: 'bg-yellow-100 text-yellow-800 font-semibold',
                  low: 'bg-emerald-100 text-emerald-800',
                };

                return (
                  <div key={r.id} className="p-4 space-y-2 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] uppercase tracking-wider ${severityBadges[r.severity]}`}>
                            {r.severity}
                          </span>
                          <span className="text-xs font-semibold text-slate-500">
                            P: {r.probability}/5 • I: {r.impact}/5
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                          {r.title}
                        </h4>
                      </div>

                      <div className="flex items-center gap-2">
                        <select
                          value={r.status}
                          onChange={(e) => updateRiskStatus(r.id, e.target.value as ProjectRisk['status'])}
                          className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 border-0"
                        >
                          <option value="identified">Identifié</option>
                          <option value="mitigating">En mitigation</option>
                          <option value="materialized">Matérialisé</option>
                          <option value="closed">Clôturé / Neutre</option>
                        </select>

                        <button
                          onClick={() => deleteRisk(r.id)}
                          className="p-1.5 text-slate-400 hover:text-[#FF1E27] rounded-lg transition"
                          title="Supprimer le risque"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      {r.description}
                    </p>

                    {r.mitigationPlan && (
                      <div className="p-2.5 rounded-xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900 text-xs text-blue-900 dark:text-blue-300">
                        🛡️ <strong>Plan de mitigation :</strong> {r.mitigationPlan}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Modale d'ajout de risque */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#0F172A] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
              Identifier un nouveau risque
            </h3>
            <form onSubmit={handleCreateRisk} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Intitulé du risque
                </label>
                <input
                  type="text"
                  required
                  value={riskTitle}
                  onChange={(e) => setRiskTitle(e.target.value)}
                  placeholder="Ex : Retard d'approbation réglementaire"
                  className="w-full px-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Description du scénario
                </label>
                <textarea
                  rows={2}
                  value={riskDesc}
                  onChange={(e) => setRiskDesc(e.target.value)}
                  placeholder="Détails du risque..."
                  className="w-full px-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Probabilité (1 à 5)
                  </label>
                  <select
                    value={riskProb}
                    onChange={(e) => setRiskProb(parseInt(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value={1}>1 — Très rare</option>
                    <option value={2}>2 — Faible</option>
                    <option value={3}>3 — Moyenne</option>
                    <option value={4}>4 — Élevée</option>
                    <option value={5}>5 — Presque certaine</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Impact (1 à 5)
                  </label>
                  <select
                    value={riskImpact}
                    onChange={(e) => setRiskImpact(parseInt(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value={1}>1 — Négligeable</option>
                    <option value={2}>2 — Mineur</option>
                    <option value={3}>3 — Modéré</option>
                    <option value={4}>4 — Majeur</option>
                    <option value={5}>5 — Critique</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Plan d'atténuation / mitigation
                </label>
                <textarea
                  rows={2}
                  value={riskMitigation}
                  onChange={(e) => setRiskMitigation(e.target.value)}
                  placeholder="Que fait-on pour réduire ou éliminer ce risque ?"
                  className="w-full px-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-[#0066FF] hover:bg-blue-600 rounded-xl shadow-md"
                >
                  Enregistrer le risque
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
