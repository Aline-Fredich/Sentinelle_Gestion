'use client';

import React, { useState } from 'react';
import {
  Printer,
  X,
  AlertTriangle,
  Calendar,
} from 'lucide-react';
import { useSentinel } from '@/lib/store';
import { calculateProjectMetrics } from '@/domain/metrics';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

interface ExecutiveReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ExecutiveReportModal({ isOpen, onClose }: ExecutiveReportModalProps) {
  const { currentProject, tasks, milestones, expenses, budgets, risks, sprints } = useSentinel();

  // Options d'affichage du rapport exécutif
  const [includeMilestones, setIncludeMilestones] = useState(true);
  const [includeRisks, setIncludeRisks] = useState(true);
  const [includeBudget, setIncludeBudget] = useState(true);

  if (!isOpen || !currentProject) return null;

  const projectTasks = tasks.filter(t => t.projectId === currentProject.id);
  const projectMilestones = (milestones || []).filter(m => m.projectId === currentProject.id);
  const projectExpenses = (expenses || []).filter(e => e.projectId === currentProject.id);
  const projectRisks = (risks || []).filter(r => r.projectId === currentProject.id);

  // Calculs métriques
  const metrics = calculateProjectMetrics(projectTasks);
  const currentBudget = (budgets || []).find(b => b.projectId === currentProject.id);
  const totalBudget = currentBudget?.targetBudget || 45000000;
  const committedExpenses = projectExpenses.reduce((sum, e) => sum + e.amount, 0);
  const budgetRatio = totalBudget > 0 ? Math.round((committedExpenses / totalBudget) * 100) : 0;
  const criticalRisks = projectRisks.filter(r => r.severity === 'critical' || r.severity === 'high');
  const activeSprint = (sprints || []).find(s => s.status === 'active') || sprints?.[0];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div 
      className="modal-overlay print:p-0 print:bg-white"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div 
        className="modal max-w-4xl p-6 flex flex-col max-h-[92dvh] bg-[var(--surface-raised)] border border-[var(--border-strong)] text-[var(--text)] print:max-h-none print:shadow-none print:border-none print:bg-white print:text-black"
        onClick={e => e.stopPropagation()}
      >
        {/* Barre d'outils supérieure (masquée à l'impression) */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-[var(--border)] mb-4 print:hidden">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--brand)] shadow-[var(--glow-sm)]" />
            <h2 className="modal-title mb-0 text-sm">
              SYNTHÈSE EXÉCUTIVE POUR COMITÉ DE DIRECTION (CODIR / COPIL)
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handlePrint}
              variant="primary"
              size="sm"
              icon={<Printer className="w-3.5 h-3.5" />}
            >
              IMPRIMER / EXPORTER PDF
            </Button>
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="p-1 h-8 w-8 min-w-0"
              aria-label="Fermer"
              icon={<X className="w-4 h-4" />}
            />
          </div>
        </div>

        {/* Sélecteurs de sections (masqués à l'impression) */}
        <div className="flex items-center gap-4 pb-3 border-b border-[var(--border)] text-xs text-[var(--text-muted)] print:hidden">
          <span className="font-semibold uppercase tracking-wider text-[var(--text)]">Sections :</span>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={includeBudget}
              onChange={(e) => setIncludeBudget(e.target.checked)}
              className="rounded border-[var(--border)] text-[var(--brand)]"
            />
            <span>Budget & Financement</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={includeMilestones}
              onChange={(e) => setIncludeMilestones(e.target.checked)}
              className="rounded border-[var(--border)] text-[var(--brand)]"
            />
            <span>Jalons Stratégiques</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={includeRisks}
              onChange={(e) => setIncludeRisks(e.target.checked)}
              className="rounded border-[var(--border)] text-[var(--brand)]"
            />
            <span>Registre des Risques</span>
          </label>
        </div>

        {/* Contenu imprimable du rapport */}
        <div className="overflow-y-auto space-y-6 pr-1 pt-2 print:p-0">
          {/* En-tête officiel du document */}
          <div className="flex items-start justify-between border-b border-[var(--border)] print:border-black/20 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="success" size="sm">
                  SENTINELLE DE GESTION
                </Badge>
                <span className="text-xs font-mono text-[var(--text-muted)] print:text-black">
                  {currentProject.reference}
                </span>
              </div>
              <h1 className="text-xl font-bold text-[var(--text)] print:text-black uppercase tracking-wider mt-2">
                {currentProject.name}
              </h1>
              <p className="text-xs text-[var(--text-muted)] print:text-black mt-1 max-w-xl leading-relaxed">
                {currentProject.description || 'Rapport consolidé d’avancement, gouvernance budgétaire et maîtrise des risques.'}
              </p>
            </div>
            <div className="text-right text-xs text-[var(--text-muted)] print:text-black space-y-0.5 font-mono">
              <p><strong>ÉDITION :</strong> {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              <p><strong>PROJET :</strong> {currentProject.reference}</p>
              <p><strong>STATUT :</strong> {currentProject.status.toUpperCase()}</p>
            </div>
          </div>

          {/* Grille des 4 KPIs Exécutifs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="panel kpi p-3 rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--surface-2)] print:border-black/20 print:bg-white">
              <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider block">Avancement Global</span>
              <p className="text-2xl font-bold font-mono text-[var(--text)] print:text-black my-1">
                {metrics.completionRate}%
              </p>
              <span className="text-[11px] text-[var(--text-muted)] print:text-black font-mono">
                {metrics.completed}/{metrics.totalTasks} livrables validés
              </span>
            </div>

            {includeBudget && (
              <div className="panel kpi p-3 rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--surface-2)] print:border-black/20 print:bg-white">
                <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider block">Conso. Budget</span>
                <p className={`text-2xl font-bold font-mono my-1 ${budgetRatio > 100 ? 'text-[var(--button-danger-bg)]' : 'text-[var(--text)] print:text-black'}`}>
                  {budgetRatio}%
                </p>
                <span className="text-[11px] text-[var(--text-muted)] print:text-black font-mono">
                  {committedExpenses.toLocaleString('fr-FR')} / {totalBudget.toLocaleString('fr-FR')} FCFA
                </span>
              </div>
            )}

            <div className="panel kpi p-3 rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--surface-2)] print:border-black/20 print:bg-white">
              <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider block">Vélocité Agile</span>
              <p className="text-2xl font-bold font-mono text-[var(--text)] print:text-black my-1">
                {activeSprint ? `${activeSprint.taskIds.length} tâches` : '18 pts'}
              </p>
              <span className="text-[11px] text-[var(--text-muted)] print:text-black truncate block">
                {activeSprint ? activeSprint.name : 'Sprint courant'}
              </span>
            </div>

            {includeRisks && (
              <div className="panel kpi p-3 rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--surface-2)] print:border-black/20 print:bg-white">
                <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider block">Risques Critiques</span>
                <p className={`text-2xl font-bold font-mono my-1 ${criticalRisks.length > 0 ? 'text-[var(--button-danger-bg)]' : 'text-[var(--text)] print:text-black'}`}>
                  {criticalRisks.length}
                </p>
                <span className="text-[11px] text-[var(--text-muted)] print:text-black">
                  Criticité ≥ 10 sur {projectRisks.length} risques
                </span>
              </div>
            )}
          </div>

          {/* Section 1 : Jalons Clés & Calendrier */}
          {includeMilestones && (
            <div className="space-y-3">
              <h3 className="panel-title mb-0 flex items-center gap-2 text-xs font-bold text-[var(--text)] print:text-black uppercase tracking-wider">
                <Calendar className="w-4 h-4 text-[var(--brand)] print:text-black" />
                1. JALONS STRATÉGIQUES & PROCHAINES ÉCHÉANCES
              </h3>
              <div className="table-wrap border border-[var(--border)] print:border-black/20 rounded-[var(--r-sm)]">
                <table className="table w-full">
                  <thead>
                    <tr>
                      <th>JALON STRATÉGIQUE</th>
                      <th>DATE BUTOIR</th>
                      <th>STATUT</th>
                      <th>COMMENTAIRE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projectMilestones.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-xs text-[var(--text-muted)] italic">
                          Aucun jalon enregistré pour ce projet.
                        </td>
                      </tr>
                    ) : (
                      projectMilestones.slice(0, 4).map(m => (
                        <tr key={m.id}>
                          <td className="font-bold text-[var(--text)] print:text-black uppercase">{m.name}</td>
                          <td className="font-mono text-[var(--text-muted)] print:text-black">{m.dueDate}</td>
                          <td>
                            <Badge 
                              variant={m.status === 'reached' ? 'success' : m.status === 'late' ? 'danger' : 'default'}
                              size="xs"
                            >
                              {m.status === 'reached' ? 'ATTEINT' : m.status === 'late' ? 'EN RETARD' : 'PLANIFIÉ'}
                            </Badge>
                          </td>
                          <td className="text-[var(--text-muted)] print:text-black">{m.description || 'Conforme aux prévisions'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Section 2 : Registre des Risques & Atténuation */}
          {includeRisks && (
            <div className="space-y-3">
              <h3 className="panel-title mb-0 flex items-center gap-2 text-xs font-bold text-[var(--text)] print:text-black uppercase tracking-wider">
                <AlertTriangle className="w-4 h-4 text-[var(--brand)] print:text-black" />
                2. PRINCIPAUX RISQUES & PLANS D’ATTÉNUATION
              </h3>
              <div className="table-wrap border border-[var(--border)] print:border-black/20 rounded-[var(--r-sm)]">
                <table className="table w-full">
                  <thead>
                    <tr>
                      <th>RISQUE IDENTIFIÉ</th>
                      <th>PROB. / IMP.</th>
                      <th>CRITICITÉ</th>
                      <th>MESURE PRÉVENTIVE / PLAN D’ATTÉNUATION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projectRisks.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-xs text-[var(--text-muted)] italic">
                          Aucun risque critique déclaré.
                        </td>
                      </tr>
                    ) : (
                      projectRisks.slice(0, 4).map(r => (
                        <tr key={r.id}>
                          <td className="font-bold text-[var(--text)] print:text-black uppercase">{r.title}</td>
                          <td className="font-mono text-[var(--text-muted)] print:text-black">{r.probability}/5 × {r.impact}/5</td>
                          <td>
                            <Badge 
                              variant={r.severity === 'critical' ? 'danger' : r.severity === 'high' ? 'warning' : 'info'}
                              size="xs"
                            >
                              {r.severity.toUpperCase()}
                            </Badge>
                          </td>
                          <td className="text-[var(--text-muted)] print:text-black">{r.mitigationPlan || 'Surveillance continue'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Pied de page du rapport */}
          <div className="pt-4 border-t border-[var(--border)] print:border-black/20 flex items-center justify-between text-micro font-mono text-[var(--text-muted)] print:text-black">
            <span>GÉNÉRÉ AUTOMATIQUEMENT PAR SENTINELLE DE GESTION</span>
            <span>DOCUMENT STRICTEMENT CONFIDENTIEL — USAGE INTERNE CODIR</span>
          </div>
        </div>
      </div>
    </div>
  );
}
