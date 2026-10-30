'use client';

import React, { useState, useMemo } from 'react';
import { 
  ShieldAlert, Plus, Trash2, 
  ShieldCheck, Activity
} from 'lucide-react';
import { useSentinel } from '@/lib/store';
import { ProjectRisk, RiskSeverity } from '@/types/sentinel';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';

export function RisksView() {
  const { 
    risks, createRisk, updateRiskStatus, deleteRisk, 
    activeProjectId, currentUser, projects 
  } = useSentinel();

  const [showAddModal, setShowAddModal] = useState(false);
  const [riskTitle, setRiskTitle] = useState('');
  const [riskDesc, setRiskDesc] = useState('');
  const [riskProb, setRiskProb] = useState<number>(3);
  const [riskImpact, setRiskImpact] = useState<number>(3);
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
  const closedCount = projectRisks.filter(r => r.status === 'closed').length;

  const calculateSeverity = (prob: number, impact: number): RiskSeverity => {
    const score = prob * impact;
    if (score >= 16) return 'critical';
    if (score >= 10) return 'high';
    if (score >= 5) return 'medium';
    return 'low';
  };

  const getSeverityBadgeVariant = (sev: RiskSeverity) => {
    switch (sev) {
      case 'critical': return 'danger';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const handleCreateRisk = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
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
      ownerId: currentUser.id,
      mitigationPlan: riskMitigation,
    });

    setShowAddModal(false);
    setRiskTitle('');
    setRiskDesc('');
    setRiskMitigation('');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* En-tête du module Risques */}
      <div className="panel flex flex-wrap items-center justify-between gap-4 border border-[var(--border)] bg-[var(--surface)] p-5 rounded-[var(--r-md)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[var(--r-sm)] border border-[var(--brand)]/40 bg-[var(--brand)]/10 flex items-center justify-center text-[var(--brand)]">
            <ShieldAlert className="w-5 h-5 text-[var(--brand)]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[var(--brand)] shadow-[var(--glow-sm)]" />
              <h1 className="text-base font-bold text-[var(--text)] uppercase tracking-wider">
                GESTION DES RISQUES & MATRICE DE CRITICITÉ
              </h1>
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Anticipez les points de blocage, évaluez probabilité/impact et pilotez les plans de mitigation
            </p>
          </div>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setShowAddModal(true)}
          icon={<Plus className="w-4 h-4" />}
        >
          IDENTIFIER UN RISQUE
        </Button>
      </div>

      {/* KPI de criticité avec filtrage interactif */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <button
          type="button"
          onClick={() => setSeverityFilter('all')}
          className={`panel kpi text-left cursor-pointer transition p-4 rounded-[var(--r-sm)] bg-[var(--surface)] border ${
            severityFilter === 'all' ? 'border-[var(--brand)] shadow-[0_0_12px_rgba(255,0,0,0.25)]' : 'border-[var(--border)] hover:border-[var(--border-strong)]'
          }`}
        >
          <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider block">Total Risques Déclarés</span>
          <div className="text-2xl font-bold font-mono text-[var(--text)] my-1">
            {risks.length}
          </div>
          <span className="text-[11px] text-[var(--text-muted)]">Tous les risques déclarés</span>
        </button>

        <button
          type="button"
          onClick={() => setSeverityFilter(severityFilter === 'critical' ? 'all' : 'critical')}
          className={`panel kpi text-left cursor-pointer transition p-4 rounded-[var(--r-sm)] bg-[var(--surface)] border ${
            severityFilter === 'critical' ? 'border-[var(--button-danger-bg)] shadow-[0_0_12px_rgba(255,0,0,0.35)]' : 'border-[var(--border)] hover:border-[var(--border-strong)]'
          }`}
        >
          <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider block">Risques Critiques</span>
          <div className="text-2xl font-bold font-mono text-[var(--button-danger-bg)] my-1">
            {criticalCount}
          </div>
          <span className="text-[11px] text-[var(--button-danger-bg)] font-semibold">Filtrer les plus urgents</span>
        </button>

        <button
          type="button"
          onClick={() => setSeverityFilter(severityFilter === 'high' ? 'all' : 'high')}
          className={`panel kpi text-left cursor-pointer transition p-4 rounded-[var(--r-sm)] bg-[var(--surface)] border ${
            severityFilter === 'high' ? 'border-[var(--brand)] shadow-[0_0_12px_rgba(255,0,0,0.25)]' : 'border-[var(--border)] hover:border-[var(--border-strong)]'
          }`}
        >
          <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider block">Risques Élevés</span>
          <div className="text-2xl font-bold font-mono text-[var(--text)] my-1">
            {risks.filter(r => r.severity === 'high').length}
          </div>
          <span className="text-[11px] text-[var(--text-muted)]">Filtrer criticité haute</span>
        </button>

        <button
          type="button"
          onClick={() => setSeverityFilter(severityFilter === 'low' ? 'all' : 'low')}
          className={`panel kpi text-left cursor-pointer transition p-4 rounded-[var(--r-sm)] bg-[var(--surface)] border ${
            severityFilter === 'low' ? 'border-[var(--brand)] shadow-[0_0_12px_rgba(255,0,0,0.25)]' : 'border-[var(--border)] hover:border-[var(--border-strong)]'
          }`}
        >
          <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider block">Sous Contrôle / Clôturés</span>
          <div className="text-2xl font-bold font-mono text-[var(--text)] my-1">
            {closedCount}
          </div>
          <span className="text-[11px] text-[var(--text-muted)]">Filtrer sous contrôle</span>
        </button>
      </div>

      {/* Matrice 5x5 Heatmap & Liste des Risques */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Colonne gauche : Matrice 5x5 visuelle */}
        <div className="panel space-y-4 border border-[var(--border)] bg-[var(--surface)] p-5 rounded-[var(--r-md)]">
          <h3 className="panel-title mb-0 flex items-center gap-2 text-xs font-bold text-[var(--text)] uppercase tracking-wider">
            <Activity className="w-4 h-4 text-[var(--brand)]" />
            MATRICE 5×5 (INTENSITÉ DE CRITICITÉ)
          </h3>

          <div className="space-y-1 pt-2">
            <div className="grid grid-cols-5 gap-1 text-center font-mono text-[10px]">
              {[5, 4, 3, 2, 1].map(imp => (
                <React.Fragment key={imp}>
                  {[1, 2, 3, 4, 5].map(prob => {
                    const score = imp * prob;
                    const matchingRisks = projectRisks.filter(r => r.impact === imp && r.probability === prob);
                    
                    const bgStyle = 
                      score >= 16 ? { background: 'var(--button-danger-bg)', color: '#FFFFFF', border: '1px solid var(--button-danger-bg)' } :
                      score >= 10 ? { background: 'rgba(255, 60, 60, 0.45)', color: 'var(--text)', border: '1px solid rgba(255, 60, 60, 0.6)' } :
                      score >= 5 ? { background: 'var(--surface-2)', color: 'var(--text)', border: '1px solid var(--border)' } :
                      { background: 'var(--surface)', color: 'var(--text-muted)', border: '1px solid var(--border)' };

                    return (
                      <div
                        key={`${imp}-${prob}`}
                        title={`Impact ${imp} / Probabilité ${prob} (${matchingRisks.length} risque(s))` }
                        style={bgStyle}
                        className={`h-11 rounded-[var(--r-xs)] flex flex-col items-center justify-center transition-all ${
                          matchingRisks.length > 0 ? 'ring-2 ring-[var(--brand)] font-bold shadow-xs' : ''
                        }`}
                      >
                        <span>{matchingRisks.length > 0 ? `${matchingRisks.length}R` : score}</span>
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>

            <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] pt-2 uppercase tracking-wider font-mono">
              <span>Faible (1)</span>
              <span>Impact ➔</span>
              <span>Critique (5)</span>
            </div>
          </div>
        </div>

        {/* Colonne droite : Liste détaillée des risques */}
        <div className="lg:col-span-2 panel space-y-4 border border-[var(--border)] bg-[var(--surface)] p-5 rounded-[var(--r-md)]">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
            <h3 className="panel-title mb-0 flex items-center gap-2 text-xs font-bold text-[var(--text)] uppercase tracking-wider">
              <ShieldAlert className="w-4 h-4 text-[var(--brand)]" />
              PLAN DE MITIGATION DES RISQUES
            </h3>
          </div>

          <div className="space-y-3">
            {projectRisks.length === 0 ? (
              <div className="empty py-12 flex flex-col items-center justify-center text-center">
                <ShieldCheck className="w-8 h-8 text-[var(--text-muted)] mb-2" />
                <p className="text-sm font-bold text-[var(--text)] uppercase tracking-wider">AUCUN RISQUE DÉCLARÉ</p>
                <p className="text-xs text-[var(--text-muted)] mt-1">Tous les périmètres sont sous contrôle ou aucun risque filtré.</p>
              </div>
            ) : (
              projectRisks.map(r => {
                return (
                  <div key={r.id} className="card-inner space-y-2.5 p-4 rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--surface-2)]">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant={getSeverityBadgeVariant(r.severity)} size="sm">
                            {r.severity.toUpperCase()}
                          </Badge>
                          <span className="text-[11px] font-mono text-[var(--text-muted)]">
                            P: {r.probability}/5 • I: {r.impact}/5
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-[var(--text)] uppercase tracking-wide mt-1.5">
                          {r.title}
                        </h4>
                      </div>

                      <div className="flex items-center gap-2">
                        <select
                          value={r.status}
                          onChange={(e) => updateRiskStatus(r.id, e.target.value as ProjectRisk['status'])}
                          className="form-select py-1 px-2.5 text-xs w-auto uppercase font-bold rounded-[var(--r-xs)] border border-[var(--border)] bg-[var(--surface)] text-[var(--text)]"
                        >
                          <option value="identified">IDENTIFIÉ</option>
                          <option value="mitigating">EN MITIGATION</option>
                          <option value="materialized">MATÉRIALISÉ</option>
                          <option value="closed">CLÔTURÉ / NEUTRE</option>
                        </select>

                        <button
                          type="button"
                          onClick={() => deleteRisk(r.id)}
                          className="p-1.5 rounded text-[var(--text-muted)] hover:text-[var(--button-danger-bg)] transition-colors"
                          title="Supprimer le risque"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                      {r.description}
                    </p>

                    {r.mitigationPlan && (
                      <div className="p-2.5 rounded-[var(--r-xs)] bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--text)]">
                        <strong className="text-[var(--brand)] uppercase mr-1">Plan de mitigation :</strong> {r.mitigationPlan}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Modale d'ajout de risque conforme Phase 4 */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="IDENTIFIER UN RISQUE"
        subtitle="Évaluez la criticité et formulez un plan d'action préventif"
        icon={<ShieldAlert className="w-4 h-4 text-[var(--brand)]" />}
        footer={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowAddModal(false)}
            >
              ANNULER
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleCreateRisk()}
            >
              ENREGISTRER LE RISQUE
            </Button>
          </div>
        }
      >
        <form onSubmit={handleCreateRisk} className="space-y-4">
          <Input
            label="Intitulé du risque"
            required
            value={riskTitle}
            onChange={(e) => setRiskTitle(e.target.value)}
            placeholder="Ex : Retard d'approbation réglementaire"
          />

          <Textarea
            label="Description du scénario"
            rows={2}
            value={riskDesc}
            onChange={(e) => setRiskDesc(e.target.value)}
            placeholder="Détails du risque..."
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Probabilité (1 à 5)"
              value={riskProb}
              onChange={(e) => setRiskProb(parseInt(e.target.value))}
            >
              <option value={1}>1 — TRÈS RARE</option>
              <option value={2}>2 — FAIBLE</option>
              <option value={3}>3 — MOYENNE</option>
              <option value={4}>4 — ÉLEVÉE</option>
              <option value={5}>5 — PRESQUE CERTAINE</option>
            </Select>

            <Select
              label="Impact (1 à 5)"
              value={riskImpact}
              onChange={(e) => setRiskImpact(parseInt(e.target.value))}
            >
              <option value={1}>1 — NÉGLIGEABLE</option>
              <option value={2}>2 — MINEUR</option>
              <option value={3}>3 — MODÉRÉ</option>
              <option value={4}>4 — MAJEUR</option>
              <option value={5}>5 — CRITIQUE</option>
            </Select>
          </div>

          <Textarea
            label="Plan d'atténuation / mitigation"
            rows={2}
            value={riskMitigation}
            onChange={(e) => setRiskMitigation(e.target.value)}
            placeholder="Que fait-on pour réduire ou éliminer ce risque ?"
          />
        </form>
      </Modal>
    </div>
  );
}
