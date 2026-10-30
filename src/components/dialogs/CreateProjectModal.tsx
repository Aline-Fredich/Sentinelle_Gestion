'use client';

import React, { useState } from 'react';
import { FolderPlus, Sparkles, CheckCircle2 } from 'lucide-react';
import { useSentinel } from '@/lib/store';
import { useTheme } from '@/context/ThemeContext';
import { ProjectPriority } from '@/types/sentinel';
import { formatCurrency } from '@/lib/currencyUtils';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';

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
    budget: 30000000, // 30M FCFA
  },
  {
    id: 'chantier',
    name: 'Chantier & Travaux BTP',
    description: 'Planification séquentielle par corps d’état, jalons de sécurité et conformité.',
    iconKey: 'layers',
    terminology: { task: 'Lot de travaux', phase: 'Phase chantier', milestone: 'Réception' },
    defaultPhases: ['Gros œuvre & Fondations', 'Second œuvre & Réseaux', 'Finitions & Livraison'],
    budget: 75000000, // 75M FCFA
  },
  {
    id: 'audit',
    name: 'Audit de Sécurité & RLS Supabase',
    description: 'Cartographie des risques, tests d’intrusion et certification RGPD/ISO 27001.',
    iconKey: 'shield',
    terminology: { task: 'Point de contrôle', phase: 'Domaine d’audit', milestone: 'Rapport' },
    defaultPhases: ['Cartographie des vulnérabilités', 'Revue de code & RLS', 'Rapport de conformité'],
    budget: 15000000, // 15M FCFA
  },
  {
    id: 'marketing',
    name: 'Campagne Marketing & Lancement Produit',
    description: 'Création de contenu, acquisition multicanale et relations presse.',
    iconKey: 'calendar',
    terminology: { task: 'Livrable', phase: 'Vague marketing', milestone: 'Lancement' },
    defaultPhases: ['Branding & Stratégie', 'Production des assets', 'Diffusion & Analyse'],
    budget: 20000000, // 20M FCFA
  },
  {
    id: 'recrutement',
    name: 'Recrutement & Onboarding RH',
    description: 'Pipeline de sourcing, entretiens techniques et intégration des nouveaux talents.',
    iconKey: 'users',
    terminology: { task: 'Candidat', phase: 'Étape de recrutement', milestone: 'Embauche' },
    defaultPhases: ['Sourcing & Présélection', 'Entretiens & Évaluations', 'Promesse & Intégration'],
    budget: 10000000, // 10M FCFA
  },
];

export function CreateProjectModal({ isOpen, onClose }: CreateProjectModalProps) {
  const { createProject, createPhase, updateBudget, setActiveProjectId, currentUser } = useSentinel();
  const { themeData } = useTheme();

  const [selectedTemplateId, setSelectedTemplateId] = useState('scrum');
  const [name, setName] = useState('Nouveau Projet Numérique');
  const [description, setDescription] = useState('Projet initialisé depuis le modèle standard Sentinel.');
  const [priority] = useState<ProjectPriority>('high');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const selectedTemplate = PROJECT_TEMPLATES.find(t => t.id === selectedTemplateId) || PROJECT_TEMPLATES[0];

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Le nom du projet est obligatoire.');
      return;
    }

    setIsSubmitting(true);

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
      colorKey: themeData.colors.primary,
      memberIds: [currentUser.id],
      tags: ['Initialisé'],
    });

    if (!result.success || !result.project) {
      setErrorMsg(result.error || 'Erreur lors de la création du projet.');
      setIsSubmitting(false);
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
        colorKey: idx === 0 ? themeData.colors.primary : idx === 1 ? '#FFFFFF' : '#17D0FA',
      });
    });

    // Enveloppe budgétaire du modèle
    updateBudget(newPrj.id, selectedTemplate.budget);

    // Bascule automatique vers le nouveau projet
    setActiveProjectId(newPrj.id);
    setIsSubmitting(false);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      variant="modal"
      size="md"
      title="CRÉER UN PROJET À PARTIR D'UN MODÈLE"
      subtitle="Initialisez les phases, budgets et terminologie adaptés à votre métier"
      icon={<FolderPlus className="w-4 h-4 text-[var(--brand)]" />}
      footer={
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={onClose}>
            ANNULER
          </Button>
          <Button
            variant="primary"
            size="sm"
            data-testid="btn-submit-new-project"
            loading={isSubmitting}
            onClick={() => handleSubmit()}
            icon={<Sparkles className="w-4 h-4" />}
          >
            CRÉER LE PROJET
          </Button>
        </div>
      }
    >
      {errorMsg && (
        <div className="alert alert--error text-xs font-bold p-3 rounded-[var(--r-sm)] mb-3">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text)] block mb-2">
            Sélectionnez un modèle de projet
          </label>
          <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1">
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
                  className={`p-3 rounded-[var(--r-sm)] border text-left transition flex items-start justify-between gap-3 ${
                    isSelected
                      ? 'border-[var(--brand)] bg-[var(--surface-2)] shadow-[var(--glow-sm)]'
                      : 'border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-strong)]'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold text-[var(--text)] uppercase tracking-wider flex items-center gap-2">
                      <span>{tpl.name}</span>
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-[var(--brand)]" />}
                    </div>
                    <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                      {tpl.description}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 text-[11px] font-mono text-[var(--text-muted)]">
                      <span>Vocabulaire : {tpl.terminology.task} / {tpl.terminology.phase}</span>
                      <span>•</span>
                      <span>Budget : {formatCurrency(tpl.budget)}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <Input
          label="Nom du projet"
          required
          data-testid="input-new-project-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <Textarea
          label="Description opérationnelle"
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </form>
    </Modal>
  );
}
