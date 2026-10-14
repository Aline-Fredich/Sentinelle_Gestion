'use client';

import React from 'react';
import {
  FileText,
  Printer,
  X,
  TrendingUp,
  AlertTriangle,
  Calendar,
  DollarSign,
  CheckCircle2,
  ShieldAlert,
} from 'lucide-react';
import { useSentinel } from '@/lib/store';
import { calculateProjectMetrics } from '@/domain/metrics';

interface ExecutiveReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ExecutiveReportModal({ isOpen, onClose }: ExecutiveReportModalProps) {
  const { currentProject, tasks, phases, milestones, expenses, budgets, risks, sprints } = useSentinel();

  if (!isOpen || !currentProject) return null;

  const projectTasks = tasks.filter(t => t.projectId === currentProject.id);
  const projectPhases = phases.filter(p => p.projectId === currentProject.id);
  const projectMilestones = (milestones || []).filter(m => m.projectId === currentProject.id);
  const projectExpenses = (expenses || []).filter(e => e.projectId === currentProject.id);
  const projectRisks = (risks || []).filter(r => r.projectId === currentProject.id);

  // Calculs métriques
  const metrics = calculateProjectMetrics(projectTasks);
  const currentBudget = (budgets || []).find(b => b.projectId === currentProject.id);
  const totalBudget = currentBudget?.targetBudget || 45000;
  const committedExpenses = projectExpenses.reduce((sum, e) => sum + e.amount, 0);
  const budgetRatio = Math.round((committedExpenses / totalBudget) * 100);
  const criticalRisks = projectRisks.filter(r => r.severity === 'critical' || r.severity === 'high');
  const activeSprint = (sprints || []).find(s => s.status === 'active') || sprints?.[0];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm print:p-0 print:bg-white animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] print:max-h-none print:shadow-none print:border-none print:bg-white print:text-black">
        {/* Barre d'outils supérieure (masquée à l'impression) */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/80 print:hidden">
          <div className="flex items-center gap-2 text-slate-100 font-semibold text-sm">
            <FileText className="w-4 h-4 text-indigo-400" />
            <span>Synthèse Exécutive pour Comité de Direction (CoDir / Copil)</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              type="button"
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg shadow-sm transition flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimer / Exporter PDF</span>
            </button>
            <button
              onClick={onClose}
              type="button"
              className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Contenu imprimable du rapport */}
        <div className="p-8 overflow-y-auto space-y-6 text-slate-100 print:text-black print:p-0">
          {/* En-tête officiel du document */}
          <div className="flex items-start justify-between border-b border-slate-800 print:border-slate-300 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-[#0066FF] text-white tracking-wider uppercase">
                  SENTINEL GESTION
                </span>
                <span className="text-xs font-semibold text-slate-400 print:text-slate-600">
                  {currentProject.reference}
                </span>
              </div>
              <h1 className="text-2xl font-bold text-slate-100 print:text-slate-900 mt-2">
                {currentProject.name}
              </h1>
              <p className="text-xs text-slate-400 print:text-slate-600 mt-1 max-w-xl">
                {currentProject.description || 'Rapport consolidé d’avancement, gouvernance budgétaire et maîtrise des risques.'}
              </p>
            </div>
            <div className="text-right text-xs text-slate-400 print:text-slate-600 space-y-0.5">
              <p><strong className="text-slate-200 print:text-slate-800">Édition :</strong> {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              <p><strong className="text-slate-200 print:text-slate-800">Responsable :</strong> Alexandre Martin</p>
              <p><strong className="text-slate-200 print:text-slate-800">Statut :</strong> En production</p>
            </div>
          </div>

          {/* Grille des 4 KPIs Exécutifs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-950/60 print:bg-slate-50 border border-slate-800 print:border-slate-200">
              <div className="flex items-center justify-between text-xs text-slate-400 print:text-slate-600">
                <span>Avancement</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <p className="text-2xl font-bold text-emerald-400 print:text-emerald-700 mt-1">
                {metrics.completionRate}%
              </p>
              <span className="text-[10px] text-slate-500">
                {metrics.completed}/{metrics.totalTasks} livrables achevés
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/60 print:bg-slate-50 border border-slate-800 print:border-slate-200">
              <div className="flex items-center justify-between text-xs text-slate-400 print:text-slate-600">
                <span>Conso. Budget</span>
                <DollarSign className="w-3.5 h-3.5 text-indigo-400" />
              </div>
              <p className={`text-2xl font-bold mt-1 ${budgetRatio > 100 ? 'text-red-400' : 'text-indigo-400 print:text-indigo-700'}`}>
                {budgetRatio}%
              </p>
              <span className="text-[10px] text-slate-500">
                {committedExpenses.toLocaleString('fr-FR')} € / {totalBudget.toLocaleString('fr-FR')} €
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/60 print:bg-slate-50 border border-slate-800 print:border-slate-200">
              <div className="flex items-center justify-between text-xs text-slate-400 print:text-slate-600">
                <span>Vélocité Agile</span>
                <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <p className="text-2xl font-bold text-cyan-400 print:text-cyan-700 mt-1">
                {activeSprint ? `${activeSprint.taskIds.length} tâches` : '18 pts'}
              </p>
              <span className="text-[10px] text-slate-500">
                {activeSprint ? activeSprint.name : 'Sprint d’itération'}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/60 print:bg-slate-50 border border-slate-800 print:border-slate-200">
              <div className="flex items-center justify-between text-xs text-slate-400 print:text-slate-600">
                <span>Risques Majeurs</span>
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <p className="text-2xl font-bold text-amber-400 print:text-amber-700 mt-1">
                {criticalRisks.length}
              </p>
              <span className="text-[10px] text-slate-500">
                Criticité $\ge 15$ sur {projectRisks.length} risques
              </span>
            </div>
          </div>

          {/* Section 1 : Jalons Clés & Calendrier */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-200 print:text-slate-900 flex items-center gap-1.5 uppercase tracking-wide">
              <Calendar className="w-4 h-4 text-indigo-400" />
              1. Jalons Clés & Prochaines Échéances
            </h3>
            <div className="rounded-xl border border-slate-800 print:border-slate-300 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 print:bg-slate-100 text-slate-400 print:text-slate-700 border-b border-slate-800 print:border-slate-300">
                  <tr>
                    <th className="p-2.5 font-semibold">Jalon Stratégique</th>
                    <th className="p-2.5 font-semibold">Date Butoir</th>
                    <th className="p-2.5 font-semibold">Statut</th>
                    <th className="p-2.5 font-semibold">Commentaire</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 print:divide-slate-200">
                  {projectMilestones.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-3 text-center text-slate-500">Aucun jalon enregistré pour ce projet.</td>
                    </tr>
                  ) : (
                    projectMilestones.slice(0, 4).map(m => (
                      <tr key={m.id} className="hover:bg-slate-800/30">
                        <td className="p-2.5 font-medium text-slate-200 print:text-slate-900">{m.name}</td>
                        <td className="p-2.5 text-slate-400 print:text-slate-700">{m.dueDate}</td>
                        <td className="p-2.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            m.status === 'reached'
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : m.status === 'late'
                              ? 'bg-red-500/10 text-red-400'
                              : 'bg-blue-500/10 text-blue-400'
                          }`}>
                            {m.status === 'reached' ? 'Atteint' : m.status === 'late' ? 'En retard' : 'Planifié'}
                          </span>
                        </td>
                        <td className="p-2.5 text-slate-400 print:text-slate-600">{m.description || 'Conforme aux prévisions'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 2 : Registre des Risques & Atténuation */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-200 print:text-slate-900 flex items-center gap-1.5 uppercase tracking-wide">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              2. Principaux Risques & Plans d’Atténuation
            </h3>
            <div className="rounded-xl border border-slate-800 print:border-slate-300 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 print:bg-slate-100 text-slate-400 print:text-slate-700 border-b border-slate-800 print:border-slate-300">
                  <tr>
                    <th className="p-2.5 font-semibold">Risque Identifié</th>
                    <th className="p-2.5 font-semibold text-center">Prob. / Imp.</th>
                    <th className="p-2.5 font-semibold text-center">Criticité</th>
                    <th className="p-2.5 font-semibold">Mesure Préventive / Plan d’Atténuation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 print:divide-slate-200">
                  {projectRisks.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-3 text-center text-slate-500">Aucun risque critique déclaré.</td>
                    </tr>
                  ) : (
                    projectRisks.slice(0, 3).map(r => (
                      <tr key={r.id} className="hover:bg-slate-800/30">
                        <td className="p-2.5 font-medium text-slate-200 print:text-slate-900">{r.title}</td>
                        <td className="p-2.5 text-center text-slate-400 print:text-slate-700">{r.probability}/5 × {r.impact}/5</td>
                        <td className="p-2.5 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            r.severity === 'critical'
                              ? 'bg-red-500/20 text-red-400 print:text-red-700'
                              : r.severity === 'high'
                              ? 'bg-amber-500/20 text-amber-400 print:text-amber-700'
                              : 'bg-emerald-500/20 text-emerald-400 print:text-emerald-700'
                          }`}>
                            {r.severity === 'critical' ? 'Critique' : r.severity === 'high' ? 'Élevé' : r.severity === 'medium' ? 'Moyen' : 'Faible'}
                          </span>
                        </td>
                        <td className="p-2.5 text-slate-400 print:text-slate-700">{r.mitigationPlan}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pied de page du rapport */}
          <div className="pt-4 border-t border-slate-800 print:border-slate-300 flex items-center justify-between text-[11px] text-slate-500 print:text-slate-600">
            <span>Généré automatiquement par SENTINEL GESTION v1.0.0</span>
            <span>Document strictement confidentiel — Usage interne CoDir</span>
          </div>
        </div>
      </div>
    </div>
  );
}
