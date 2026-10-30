'use client';

import React, { useState, useMemo } from 'react';
import { 
  DollarSign, TrendingUp, TrendingDown, Plus, 
  Trash2, PieChart, Receipt, Clock
} from 'lucide-react';
import { useSentinel } from '@/lib/store';
import { ProjectExpense } from '@/types/sentinel';
import { calculateProjectFinances } from '@/domain/finances';
import { formatCurrency } from '@/lib/currencyUtils';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';

export function FinanceView() {
  const { 
    currentProject, activeProjectId, projects, 
    expenses, addExpense, deleteExpense, budgets, updateBudget,
    timeEntries, users, currentUser, workspace
  } = useSentinel();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Formulaire d'ajout
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState<ProjectExpense['category']>('software');
  const [expenseStatus, setExpenseStatus] = useState<ProjectExpense['status']>('paid');
  const [targetBudgetInput, setTargetBudgetInput] = useState('');

  const fallbackProjectId = projects[0]?.id || 'prj-1';
  const targetProjectId = activeProjectId === 'all' ? fallbackProjectId : activeProjectId;
  const defaultRate = workspace.defaultHourlyRate || 15000;
  const currency = workspace.currency || 'FCFA';

  const currentBudgetObj = useMemo(() => {
    return budgets.find(b => b.projectId === targetProjectId) || {
      projectId: targetProjectId,
      targetBudget: 30000000,
      currency,
    };
  }, [budgets, targetProjectId, currency]);

  const projectTimeEntries = useMemo(() => {
    return activeProjectId === 'all'
      ? timeEntries
      : timeEntries.filter(t => t.projectId === activeProjectId);
  }, [timeEntries, activeProjectId]);

  const totalLaborHours = (projectTimeEntries.reduce((sum, t) => sum + t.durationMinutes, 0) / 60).toFixed(1);

  // Filtrer les dépenses du projet actif
  const projectExpenses = useMemo(() => {
    let list = activeProjectId === 'all' 
      ? expenses 
      : expenses.filter(e => e.projectId === activeProjectId);

    if (categoryFilter !== 'all') {
      list = list.filter(e => e.category === categoryFilter);
    }
    return list;
  }, [expenses, activeProjectId, categoryFilter]);

  const financeSummary = useMemo(() => {
    return calculateProjectFinances(
      currentBudgetObj,
      projectExpenses,
      projectTimeEntries,
      users,
      defaultRate
    );
  }, [currentBudgetObj, projectExpenses, projectTimeEntries, users, defaultRate]);

  const projectBudget = financeSummary.targetBudget;
  const totalLaborCost = financeSummary.laborCost;
  const totalSpent = financeSummary.totalCommittedCost;
  const remainingBudget = Math.max(0, financeSummary.remainingBudget);
  const isOverBudget = financeSummary.isOverBudget;
  const overrunAmount = isOverBudget ? Math.abs(financeSummary.remainingBudget) : 0;
  const consumptionPercentage = financeSummary.consumptionRate;

  // Répartition par catégorie
  const categoryTotals = useMemo(() => {
    const cats: Record<string, number> = {
      labor: totalLaborCost,
    };
    projectExpenses.forEach(e => {
      cats[e.category] = (cats[e.category] || 0) + e.amount;
    });
    return cats;
  }, [projectExpenses, totalLaborCost]);

  const categoryLabels: Record<string, string> = {
    labor: 'Main d’œuvre',
    software: 'Logiciels & SaaS',
    hardware: 'Matériel & Serveurs',
    consulting: 'Prestations & Audit',
    marketing: 'Communication',
    other: 'Autre',
  };

  const handleAddExpense = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!expenseTitle.trim() || !expenseAmount) return;

    addExpense({
      projectId: targetProjectId,
      title: expenseTitle,
      amount: parseFloat(expenseAmount),
      category: expenseCategory,
      status: expenseStatus,
      date: new Date().toISOString().split('T')[0],
      createdBy: currentUser.name,
    });

    setExpenseTitle('');
    setExpenseAmount('');
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* En-tête du module Finance - Bloc Hero */}
      <div className="panel panel--hero flex flex-wrap items-center justify-between gap-4 border border-[var(--border)] bg-[var(--surface)] p-6 rounded-[var(--r-md)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[var(--r-sm)] border border-[var(--brand)]/40 bg-[var(--brand)]/10 flex items-center justify-center text-[var(--brand)]">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--brand)] shadow-[var(--glow-sm)]" />
              <h1 className="text-base font-bold text-[var(--text)] uppercase tracking-wider">
                GESTION BUDGÉTAIRE & RENTABILITÉ
              </h1>
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              {activeProjectId === 'all' ? 'Dépenses globales de l’espace' : `Budget du projet : ${currentProject?.name || 'Projet actif'}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setTargetBudgetInput(projectBudget.toString());
              setShowBudgetModal(true);
            }}
          >
            AJUSTER LE BUDGET CIBLE
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowAddModal(true)}
            icon={<Plus className="w-4 h-4" />}
          >
            AJOUTER UNE DÉPENSE
          </Button>
        </div>
      </div>

      {/* Bannière d'Alerte de Dépassement Budgétaire */}
      {isOverBudget ? (
        <div className="alert alert--error flex items-center justify-between gap-4 p-4 rounded-[var(--r-sm)] border border-[var(--button-danger-bg)] bg-[var(--button-danger-bg)]/10 text-[var(--text)]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-[var(--r-xs)] bg-[var(--button-danger-bg)] text-white flex items-center justify-center flex-none">
              <TrendingDown className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-[var(--button-danger-bg)] uppercase tracking-wider">
                ALERTE CRITIQUE : DÉPASSEMENT DU BUDGET DE {formatCurrency(overrunAmount, currency)} !
              </h4>
              <p className="text-micro text-[var(--text-muted)] mt-0.5">
                Le total des engagements ({formatCurrency(totalSpent, currency)}) excède l'enveloppe allouée ({formatCurrency(projectBudget, currency)}).
              </p>
            </div>
          </div>
          <Button
            variant="danger"
            size="sm"
            onClick={() => setShowBudgetModal(true)}
          >
            RÉÉVALUER LE BUDGET
          </Button>
        </div>
      ) : consumptionPercentage >= 80 ? (
        <div className="alert flex items-center justify-between gap-4 p-4 rounded-[var(--r-sm)] border border-[var(--brand)] bg-[var(--surface-2)] text-[var(--text)]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-[var(--r-xs)] border border-[var(--brand)]/30 bg-[var(--brand)]/15 text-[var(--brand)] flex items-center justify-center flex-none">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-[var(--text)] uppercase tracking-wider">
                SEUIL DE VIGILANCE : {consumptionPercentage}% DU BUDGET CONSOMMÉ
              </h4>
              <p className="text-micro text-[var(--text-muted)] mt-0.5">
                Il reste seulement {formatCurrency(remainingBudget, currency)} de marge avant d'atteindre le plafond prévisionnel.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {/* Cartes KPI Financières */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="panel kpi p-4 rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--surface)]">
          <div className="kpi-head flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Devis Cible Alloué</span>
            <div className="w-7 h-7 rounded-[var(--r-xs)] border border-[var(--border)] bg-[var(--surface-2)] flex items-center justify-center text-[var(--brand)]">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold font-mono text-[var(--text)]">
            {formatCurrency(projectBudget, currency)}
          </div>
          <span className="text-[11px] text-[var(--text-muted)] block mt-1">Enveloppe budgétaire prévisionnelle</span>
        </div>

        <div className="panel kpi p-4 rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--surface)]">
          <div className="kpi-head flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Dépenses Totales Engagées</span>
            <div className="w-7 h-7 rounded-[var(--r-xs)] border border-[var(--border)] bg-[var(--surface-2)] flex items-center justify-center text-[var(--brand)]">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-xl font-bold font-mono ${isOverBudget ? 'text-[var(--button-danger-bg)]' : 'text-[var(--text)]'}`}>
            {formatCurrency(totalSpent, currency)}
          </div>
          <div className="w-full bg-[var(--surface-2)] h-1.5 rounded-full overflow-hidden border border-[var(--border)] mt-2">
            <div 
              className={`h-full transition-all duration-300 ${isOverBudget ? 'bg-[var(--button-danger-bg)]' : 'bg-[var(--brand)]'}`} 
              style={{ width: `${Math.min(100, consumptionPercentage)}%` }} 
            />
          </div>
          <span className="text-[11px] font-mono text-[var(--text-muted)] block mt-1">{consumptionPercentage}% de l'enveloppe consommée</span>
        </div>

        <div className="panel kpi p-4 rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--surface)]">
          <div className="kpi-head flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Coût Main d'Œuvre</span>
            <div className="w-7 h-7 rounded-[var(--r-xs)] border border-[var(--border)] bg-[var(--surface-2)] flex items-center justify-center text-[var(--brand)]">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold font-mono text-[var(--text)]">
            {formatCurrency(totalLaborCost, currency)}
          </div>
          <span className="text-[11px] text-[var(--text-muted)] block mt-1">{totalLaborHours} h déclarées • Taux {formatCurrency(defaultRate, currency)}/h</span>
        </div>

        <div className="panel kpi p-4 rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--surface)]">
          <div className="kpi-head flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Solde Disponible</span>
            <div className="w-7 h-7 rounded-[var(--r-xs)] border border-[var(--border)] bg-[var(--surface-2)] flex items-center justify-center text-[var(--brand)]">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-xl font-bold font-mono ${isOverBudget ? 'text-[var(--button-danger-bg)]' : 'text-[var(--text)]'}`}>
            {isOverBudget ? `-${formatCurrency(overrunAmount, currency)}` : formatCurrency(remainingBudget, currency)}
          </div>
          <span className={`text-[11px] block mt-1 ${isOverBudget ? 'text-[var(--button-danger-bg)] font-bold' : 'text-[var(--text-muted)]'}`}>
            {isOverBudget ? 'Déficit budgétaire constaté' : 'Marge financière restante'}
          </span>
        </div>
      </div>

      {/* Ventilation par catégorie & Tableau des dépenses */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Colonne gauche : Répartition par catégorie */}
        <div className="panel space-y-4 border border-[var(--border)] bg-[var(--surface)] p-5 rounded-[var(--r-md)]">
          <h3 className="panel-title mb-0 flex items-center gap-2 text-xs font-bold text-[var(--text)] uppercase tracking-wider">
            <PieChart className="w-4 h-4 text-[var(--brand)]" />
            RÉPARTITION PAR POSTE
          </h3>

          <div className="space-y-3 pt-2">
            {Object.entries(categoryTotals).length === 0 ? (
              <p className="text-xs text-[var(--text-muted)] py-6 text-center">Aucune dépense enregistrée</p>
            ) : (
              Object.entries(categoryTotals).map(([cat, amount]) => {
                const pct = totalSpent > 0 ? Math.round((amount / totalSpent) * 100) : 0;
                return (
                  <div key={cat} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[var(--text-muted)] font-semibold">{categoryLabels[cat] || cat}</span>
                      <span className="font-mono font-bold text-[var(--text)]">{amount.toLocaleString('fr-FR')} {currency} ({pct}%)</span>
                    </div>
                    <div className="w-full bg-[var(--surface-2)] h-1.5 rounded-full overflow-hidden border border-[var(--border)]">
                      <div className="h-full bg-[var(--brand)] transition-all duration-300" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Colonne droite : Grande table des dépenses */}
        <div className="lg:col-span-2 panel space-y-4 border border-[var(--border)] bg-[var(--surface)] p-5 rounded-[var(--r-md)]">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
            <h3 className="panel-title mb-0 flex items-center gap-2 text-xs font-bold text-[var(--text)] uppercase tracking-wider">
              <Receipt className="w-4 h-4 text-[var(--brand)]" />
              JOURNAL DES ENGAGEMENTS FINANCIERS
            </h3>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="form-select w-auto py-1 px-2.5 text-xs rounded border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)]"
            >
              <option value="all">Toutes catégories</option>
              <option value="labor">Main d'œuvre</option>
              <option value="software">Logiciels</option>
              <option value="hardware">Matériel</option>
              <option value="consulting">Prestations</option>
            </select>
          </div>

          <div className="table-wrap border border-[var(--border)] rounded-[var(--r-sm)]">
            <table className="table w-full">
              <thead>
                <tr>
                  <th>DATE</th>
                  <th>LIBELLÉ DE LA DÉPENSE</th>
                  <th>POSTE</th>
                  <th>STATUT</th>
                  <th>MONTANT</th>
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {projectExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="table-empty py-10 text-center text-xs text-[var(--text-muted)]">
                      Aucune dépense enregistrée pour ce périmètre.
                    </td>
                  </tr>
                ) : (
                  projectExpenses.map(exp => (
                    <tr key={exp.id}>
                      <td className="font-mono text-xs text-[var(--text-muted)] text-left">{exp.date}</td>
                      <td className="font-semibold text-[var(--text)] text-left">
                        {exp.title}
                        <span className="block text-[11px] font-normal text-[var(--text-muted)] mt-0.5">Saisi par {exp.createdBy}</span>
                      </td>
                      <td className="text-center">
                        <Badge 
                          variant="default" 
                          size="xs" 
                          label={categoryLabels[exp.category] || exp.category} 
                        />
                      </td>
                      <td className="text-center">
                        <Badge 
                          variant={exp.status === 'paid' ? 'success' : 'warning'} 
                          size="xs" 
                          label={exp.status === 'paid' ? 'PAYÉ' : 'PLANIFIÉ'} 
                        />
                      </td>
                      <td className={`font-mono font-bold text-center ${exp.amount === 0 ? 'cell-zero' : 'text-[var(--text)]'}`}>
                        {formatCurrency(exp.amount, currency)}
                      </td>
                      <td className="text-right">
                        <Button
                          variant="ghost"
                          size="xs"
                          icon={<Trash2 className="w-3.5 h-3.5 text-[var(--button-danger-bg)]" />}
                          onClick={() => deleteExpense(exp.id)}
                          title="Supprimer la dépense"
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modale d'ajout de dépense conforme Phase 4 */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="ENREGISTRER UNE DÉPENSE"
        subtitle="Imputez un coût réel sur l'enveloppe budgétaire du projet"
        icon={<Receipt className="w-4 h-4 text-[var(--brand)]" />}
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
              onClick={() => handleAddExpense()}
            >
              ENREGISTRER
            </Button>
          </div>
        }
      >
        <form onSubmit={handleAddExpense} className="space-y-4">
          <Input
            label="Libellé du coût"
            required
            value={expenseTitle}
            onChange={(e) => setExpenseTitle(e.target.value)}
            placeholder="Ex : Licences cloud, Sous-traitant..."
          />

          <Input
            label={`Montant en Francs CFA (${currency})`}
            type="number"
            step="0.01"
            required
            value={expenseAmount}
            onChange={(e) => setExpenseAmount(e.target.value)}
            placeholder="Ex : 1200000"
            className="font-mono font-bold"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Poste / Catégorie"
              value={expenseCategory}
              onChange={(e) => setExpenseCategory(e.target.value as ProjectExpense['category'])}
            >
              <option value="labor">Main d'œuvre</option>
              <option value="software">Logiciels & SaaS</option>
              <option value="hardware">Matériel</option>
              <option value="consulting">Prestations</option>
              <option value="marketing">Communication</option>
            </Select>

            <Select
              label="Statut du paiement"
              value={expenseStatus}
              onChange={(e) => setExpenseStatus(e.target.value as ProjectExpense['status'])}
            >
              <option value="paid">Payé</option>
              <option value="planned">Planifié / Prévu</option>
              <option value="pending">En attente facture</option>
            </Select>
          </div>
        </form>
      </Modal>

      {/* Modale d'ajustement du budget cible conforme Phase 4 */}
      <Modal
        isOpen={showBudgetModal}
        onClose={() => setShowBudgetModal(false)}
        title="DÉFINIR L'ENVELOPPE BUDGÉTAIRE"
        subtitle="Ajustez le plafond de dépenses prévisionnel alloué pour ce projet"
        icon={<DollarSign className="w-4 h-4 text-[var(--brand)]" />}
        footer={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowBudgetModal(false)}
            >
              ANNULER
            </Button>
            <Button
              variant="primary"
              size="sm"
              data-testid="btn-validate-budget"
              onClick={() => {
                const parsed = parseFloat(targetBudgetInput);
                if (!isNaN(parsed) && parsed > 0) {
                  updateBudget(targetProjectId, parsed);
                  setShowBudgetModal(false);
                }
              }}
            >
              VALIDER
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            label={`Plafond cible en Francs CFA (${currency})`}
            type="number"
            data-testid="input-target-budget"
            value={targetBudgetInput}
            onChange={(e) => setTargetBudgetInput(e.target.value)}
            className="font-mono font-bold text-base"
          />
        </div>
      </Modal>
    </div>
  );
}
