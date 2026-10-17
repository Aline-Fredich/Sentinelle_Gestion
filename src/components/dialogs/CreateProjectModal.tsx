'use client';

import React, { useState } from 'react';
import { X, FolderPlus, Layers, Shield, Sparkles, CheckCircle2 } from 'lucide-react';
import { useSentinel } from '@/lib/store';
import { ProjectPriority } from '@/types/sentinel';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PROJECT_TEMPLATES = [
  {
    id: 'scrum',
    name: 'Refonte Web & Digital (Scrum Agile)',
    description: 'Cycle itératif en sprints de 2 semaines, cérémonies agiles et burn-down chart.',
    iconKey: 'zap',
    terminology: { task: 'User Story', phase: 'Sprint', milestone: 'Release' },
    defaultPhases: ['Sprint 1 : Cadrage & Architecture', 'Sprint 2 : Développement Core', 'Sprint 3 : Recette & Mise en prod'],
    budget: 45000,
  },
  {
    id: 'chantier',
    name: 'Chantier & Travaux BTP',
    description: 'Planification séquentielle par corps d’état, jalons de sécurité et conformité.',
    iconKey: 'layers',
    terminology: { task: 'Lot de travaux', phase: 'Phase chantier', milestone: 'Réception' },
    defaultPhases: ['Gros œuvre & Fondations', 'Second œuvre & Réseaux', 'Finitions & Livraison'],
    budget: 120000,
  },
  {
    id: 'audit',
    name: 'Audit de Sécurité & RLS Supabase',
    description: 'Cartographie des risques, tests d’intrusion et certification RGPD/ISO 27001.',
    iconKey: 'shield',
    terminology: { task: 'Point de contrôle', phase: 'Domaine d’audit', milestone: 'Rapport' },
    defaultPhases: ['Cartographie des vulnérabilités', 'Revue de code & RLS', 'Rapport de conformité'],
    budget: 25000,
  },
  {
    id: 'marketing',
    name: 'Campagne Marketing & Lancement Produit',
    description: 'Création de contenu, acquisition multicanale et relations presse.',
    iconKey: 'calendar',
    terminology: { task: 'Livrable', phase: 'Vague marketing', milestone: 'Lancement' },
    defaultPhases: ['Branding & Stratégie', 'Production des assets', 'Diffusion & Analyse'],
    budget: 35000,
  },
  {
    id: 'recrutement',
    name: 'Recrutement & Onboarding RH',
    description: 'Pipeline de sourcing, entretiens techniques et intégration des nouveaux talents.',
    iconKey: 'users',
    terminology: { task: 'Candidat', phase: 'Étape de recrutement', milestone: 'Embauche' },
    defaultPhases: ['Sourcing & Présélection', 'Entretiens & Évaluations', 'Promesse & Intégration'],
    budget: 15000,
  },
];

export function CreateProjectModal({ isOpen, onClose }: CreateProjectModalProps) {
  const { createProject, createPhase, updateBudget, setActiveProjectId, currentUser } = useSentinel();

  const [selectedTemplateId, setSelectedTemplateId] = useState('scrum');
  const [name, setName] = useState('Nouveau Projet Numérique');
  const [description, setDescription] = useState('Projet initialisé depuis le modèle standard Sentinel.');
  const [priority, setPriority] = useState<ProjectPriority>('high');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const selectedTemplate = PROJECT_TEMPLATES.find(t => t.id === selectedTemplateId) || PROJECT_TEMPLATES[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Le nom du projet est obligatoire.');
      return;
    }

    const ref = `PRJ-${Math.floor(100 + Math.random() * 900)}`;
    const todayStr = new Date().toISOString().split('T')[0];
    const dueDateStr = new Date(Date.now() + 90 * 24 * 3600 * 1000).toISOString().split('T')[0];

    const result = createProject({
      name: name.trim(),
      reference: ref,
      description: description.trim(),
      status: 'active',
      priority,
      leadUserId: currentUser.id,
      startDate: todayStr,
      dueDate: dueDateStr,
      iconKey: selectedTemplate.iconKey,
      colorKey: '#0066FF',
      memberIds: [currentUser.id],
      tags: ['Initialisé'],
    });

    if (!result.success || !result.project) {
      setErrorMsg(result.error || 'Erreur lors de la création du projet.');
      return;
    }

    const newPrj = result.project;

    // Création des phases par défaut du modèle
    selectedTemplate.defaultPhases.forEach((phaseName, idx) => {
      createPhase({
        projectId: newPrj.id,
        name: phaseName,
        description: '',
        order: idx + 1,
        startDate: todayStr,
        endDate: dueDateStr,
        colorKey: idx === 0 ? '#0066FF' : idx === 1 ? '#D69A24' : '#23845B',
      });
    });

    // Enveloppe budgétaire du modèle
    updateBudget(newPrj.id, selectedTemplate.budget);

    // Bascule automatique vers le nouveau projet
    setActiveProjectId(newPrj.id);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-project-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in"
    >
      <div className="bg-white dark:bg-[#0F172A] rounded-2xl p-6 max-w-xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 dark:bg-blue-950/60 text-[#0066FF] rounded-xl">
              <FolderPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 id="create-project-title" className="text-base font-bold text-slate-900 dark:text-white">
                Créer un projet à partir d'un modèle
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Initialisez les phases, budgets et terminologie adaptés à votre métier
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Fermer la boîte de dialogue"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 text-xs bg-red-50 text-red-600 border border-red-200 rounded-xl">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Sélectionnez un modèle de projet
            </label>
            <div className="grid grid-cols-1 gap-2.5 max-h-48 overflow-y-auto pr-1">
              {PROJECT_TEMPLATES.map(tpl => {
                const isSelected = selectedTemplateId === tpl.id;
                return (
                  <button
                    key={tpl.id}
                    type="button"
                    data-testid={`template-option-${tpl.id}`}
                    onClick={() => {
                      setSelectedTemplateId(tpl.id);
                      setName(`Nouveau Projet — ${tpl.name.split('(')[0].trim()}`);
                    }}
                    className={`p-3 rounded-xl border text-left transition flex items-start justify-between gap-3 ${
                      isSelected
                        ? 'border-[#0066FF] bg-blue-50/50 dark:bg-blue-950/30 ring-2 ring-blue-500/20'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span>{tpl.name}</span>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-[#0066FF]" />}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {tpl.description}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5 text-[10px] font-mono text-slate-400">
                        <span>Vocabulaire : {tpl.terminology.task} / {tpl.terminology.phase}</span>
                        <span>•</span>
                        <span>Budget estimé : {tpl.budget.toLocaleString('fr-FR')} €</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Nom du projet <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              data-testid="input-new-project-name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-[#0066FF] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Description opérationnelle
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-[#0066FF] focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
            >
              Annuler
            </button>
            <button
              type="submit"
              data-testid="btn-submit-new-project"
              className="px-5 py-2 text-xs font-bold text-white bg-[#0066FF] hover:bg-blue-600 active:bg-blue-700 rounded-xl shadow-md shadow-blue-500/20 transition flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Créer le projet</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
