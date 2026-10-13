'use client';

import React, { useState, useMemo } from 'react';
import { 
  DollarSign, TrendingUp, TrendingDown, Plus, 
  Trash2, Filter, PieChart, Receipt, ArrowUpRight, CheckCircle2, Clock
} from 'lucide-react';
import { useSentinel } from '@/lib/store';
import { ProjectExpense } from '@/types/sentinel';
import { calculateProjectFinances } from '@/domain/finances';

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
  const defaultRate = workspace.defaultHourlyRate || 75;
  const currency = workspace.currency || '€';

  const currentBudgetObj = useMemo(() => {
    return budgets.find(b => b.projectId === targetProjectId) || {
      projectId: targetProjectId,
      targetBudget: 30000,
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

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
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
    <div className="space-y-6">
      {/* En-tête du module Finance */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 shadow-sm">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Gestion Budgétaire & Rentabilité
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {activeProjectId === 'all' ? 'Dépenses globales de l’espace' : `Budget du projet : ${currentProject?.name || 'Projet actif'}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setTargetBudgetInput(projectBudget.toString());
              setShowBudgetModal(true);
            }}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl transition"
          >
            Ajuster le budget cible
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#0066FF] hover:bg-blue-600 rounded-xl shadow-md shadow-blue-500/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Ajouter une dépense</span>
          </button>
        </div>
      </div>

      {/* Bannière d'Alerte de Dépassement Budgétaire */}
      {isOverBudget ? (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-800 text-red-900 dark:text-red-200 flex items-center justify-between gap-4 shadow-sm animate-pulse">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-600 text-white rounded-xl">
              <TrendingDown className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-red-700 dark:text-red-300">
                Alerte Critique : Dépassement du Budget de {overrunAmount.toLocaleString('fr-FR')} € !
              </h4>
              <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">
                Le total des engagements ({totalSpent.toLocaleString('fr-FR')} €) excède l'enveloppe allouée ({projectBudget.toLocaleString('fr-FR')} €). Ajustez le devis cible ou limitez les dépenses non essentielles.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowBudgetModal(true)}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-md transition whitespace-nowrap"
          >
            Réévaluer le budget
          </button>
        </div>
      ) : consumptionPercentage >= 80 ? (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 flex items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500 text-white rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-800 dark:text-amber-300">
                Seuil de Vigilance : {consumptionPercentage}% du budget consommé
              </h4>
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                Il reste seulement {remainingBudget.toLocaleString('fr-FR')} € de marge avant d'atteindre le plafond prévisionnel.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {/* Cartes KPI Financières */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Devis Cible Alloué</span>
          <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
            {projectBudget.toLocaleString('fr-FR')} €
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Enveloppe budgétaire prévisionnelle</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Dépenses Totales Engagées</span>
          <div className={`mt-2 text-2xl font-black ${isOverBudget ? 'text-[#FF1E27]' : 'text-[#0066FF]'}`}>
            {totalSpent.toLocaleString('fr-FR')} €
          </div>
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  isOverBudget ? 'bg-[#FF1E27]' : consumptionPercentage > 85 ? 'bg-amber-500' : 'bg-[#0066FF]'
                }`}
                style={{ width: `${consumptionPercentage}%` }}
              />
            </div>
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{consumptionPercentage}%</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Coût Main d'Œuvre (Temps)</span>
          <div className="mt-2 text-2xl font-black text-blue-600 dark:text-blue-400">
            {Math.round(totalLaborCost).toLocaleString('fr-FR')} {currency}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">{totalLaborHours} h déclarées • Taux moyen {defaultRate} {currency}/h</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Solde Disponible</span>
          <div className={`mt-2 text-2xl font-black ${isOverBudget ? 'text-[#FF1E27]' : remainingBudget < 5000 ? 'text-amber-500' : 'text-emerald-600'}`}>
            {isOverBudget ? `-${overrunAmount.toLocaleString('fr-FR')} €` : `${remainingBudget.toLocaleString('fr-FR')} €`}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {isOverBudget ? 'Déficit budgétaire constaté' : 'Marge financière restante'}
          </span>
        </div>
      </div>

      {/* Ventilation par catégorie & Tableau des dépenses */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Colonne gauche : Répartition par catégorie */}
        <div className="p-5 bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <PieChart className="w-4 h-4 text-[#0066FF]" />
            Répartition par Poste
          </h3>

          <div className="space-y-3 pt-2">
            {Object.entries(categoryTotals).length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">Aucune dépense enregistrée</p>
            ) : (
              Object.entries(categoryTotals).map(([cat, amount]) => {
                const pct = totalSpent > 0 ? Math.round((amount / totalSpent) * 100) : 0;
                return (
                  <div key={cat} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-medium">
                      <span className="text-slate-700 dark:text-slate-300">{categoryLabels[cat] || cat}</span>
                      <span className="font-bold text-slate-900 dark:text-white">{amount.toLocaleString('fr-FR')} € ({pct}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-[#0066FF] h-full rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Colonne droite : Grande table des dépenses */}
        <div className="lg:col-span-2 bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-900/40">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Receipt className="w-4 h-4 text-emerald-600" />
              Journal des Engagements Financiers
            </h3>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
            >
              <option value="all">Toutes catégories</option>
              <option value="labor">Main d'œuvre</option>
              <option value="software">Logiciels</option>
              <option value="hardware">Matériel</option>
              <option value="consulting">Prestations</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Libellé de la dépense</th>
                  <th className="py-3 px-4">Poste</th>
                  <th className="py-3 px-4">Statut</th>
                  <th className="py-3 px-4 text-right">Montant</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {projectExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                      Aucune dépense enregistrée pour ce périmètre.
                    </td>
                  </tr>
                ) : (
                  projectExpenses.map(exp => (
                    <tr key={exp.id} className="hover:bg-blue-50/20 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 text-xs text-slate-500">{exp.date}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                        {exp.title}
                        <span className="block text-[11px] font-normal text-slate-400">Saisi par {exp.createdBy}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {categoryLabels[exp.category] || exp.category}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          exp.status === 'paid' 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {exp.status === 'paid' ? 'Payé' : 'Planifié'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-white">
                        {exp.amount.toLocaleString('fr-FR')} €
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => deleteExpense(exp.id)}
                          className="p-1.5 text-slate-400 hover:text-[#FF1E27] rounded-lg transition"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modale d'ajout de dépense */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#0F172A] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
              Enregistrer une dépense
            </h3>
            <form onSubmit={handleAddExpense} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Libellé du coût
                </label>
                <input
                  type="text"
                  required
                  value={expenseTitle}
                  onChange={(e) => setExpenseTitle(e.target.value)}
                  placeholder="Ex : Licences cloud, Sous-traitant..."
                  className="w-full px-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Montant en euros (€)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  placeholder="Ex : 1200"
                  className="w-full px-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Poste / Catégorie
                  </label>
                  <select
                    value={expenseCategory}
                    onChange={(e) => setExpenseCategory(e.target.value as ProjectExpense['category'])}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="labor">Main d'œuvre</option>
                    <option value="software">Logiciels & SaaS</option>
                    <option value="hardware">Matériel</option>
                    <option value="consulting">Prestations</option>
                    <option value="marketing">Communication</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Statut du paiement
                  </label>
                  <select
                    value={expenseStatus}
                    onChange={(e) => setExpenseStatus(e.target.value as ProjectExpense['status'])}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="paid">Payé</option>
                    <option value="planned">Planifié / Prévu</option>
                    <option value="pending">En attente facture</option>
                  </select>
                </div>
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
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modale d'ajustement du budget cible */}
      {showBudgetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#0F172A] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-sm w-full p-6 animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-3">
              Définir l'enveloppe budgétaire
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Ajustez le plafond de dépenses prévisionnel alloué pour ce projet.
            </p>
            <div className="space-y-4">
              <input
                type="number"
                value={targetBudgetInput}
                onChange={(e) => setTargetBudgetInput(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowBudgetModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600"
                >
                  Annuler
                </button>
                <button
                  onClick={() => {
                    const parsed = parseFloat(targetBudgetInput);
                    if (!isNaN(parsed) && parsed > 0) {
                      updateBudget(targetProjectId, parsed);
                      setShowBudgetModal(false);
                    }
                  }}
                  className="px-4 py-2 text-xs font-bold text-white bg-[#0066FF] rounded-xl shadow-md"
                >
                  Valider
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
