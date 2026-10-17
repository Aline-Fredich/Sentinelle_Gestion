'use client';

import React, { useState, useEffect } from 'react';
import { X, Layers, Calendar, Clock, DollarSign, User, Shield, CheckCircle2 } from 'lucide-react';
import { useSentinel } from '@/lib/store';
import { Project, ProjectPriority, ProjectStatus } from '@/types/sentinel';

interface EditProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
}

export function EditProjectModal({ isOpen, onClose, project }: EditProjectModalProps) {
  const { updateProject, users, addNotification } = useSentinel();

  const [name, setName] = useState('');
  const [reference, setReference] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<ProjectStatus>('active');
  const [priority, setPriority] = useState<ProjectPriority>('high');
  const [startDate, setStartDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [leadUserId, setLeadUserId] = useState('');
  const [allocatedHours, setAllocatedHours] = useState<number>(100);
  const [budget, setBudget] = useState<number>(25000);

  useEffect(() => {
    if (project) {
      setName(project.name || '');
      setReference(project.reference || '');
      setDescription(project.description || '');
      setStatus(project.status || 'active');
      setPriority(project.priority || 'medium');
      setStartDate(project.startDate || '');
      setDueDate(project.dueDate || '');
      setLeadUserId(project.leadUserId || users[0]?.id || '');
      setAllocatedHours(project.allocatedHours || 120);
      setBudget(project.budget || 30000);
    }
  }, [project, users]);

  if (!isOpen || !project) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    updateProject(project.id, {
      name: name.trim(),
      reference: reference.trim(),
      description: description.trim(),
      status,
      priority,
      startDate,
      dueDate,
      leadUserId,
      allocatedHours: Number(allocatedHours) || 0,
      budget: Number(budget) || 0,
    });

    addNotification('Projet mis à jour', `Les modifications pour « ${name} » ont été enregistrées avec succès.`, 'project');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-2xl bg-white dark:bg-[#1C1C1E] rounded-3xl border border-black/10 dark:border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.18)] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* En-tête macOS Apple */}
        <div className="px-6 py-4 border-b border-black/5 dark:border-white/10 flex items-center justify-between bg-[#F5F5F7]/80 dark:bg-[#2C2C2E]/60 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#FF5F56] border border-[#E0443E]" />
              <span className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-[#DEA123]" />
              <span className="w-3 h-3 rounded-full bg-[#27C93F] border border-[#1AAB29]" />
            </div>
            <div className="h-4 w-[1px] bg-black/10 dark:bg-white/10 mx-1" />
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#0071E3] dark:text-[#2997FF]" />
              <h2 className="text-sm font-semibold tracking-tight text-slate-900 dark:text-white">
                Éditer le Projet • {project.reference}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/10 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Nom & Référence */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Nom du Projet
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                className="apple-input w-full"
                placeholder="Ex : Refonte Plateforme Digitale"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Référence
              </label>
              <input
                type="text"
                value={reference}
                onChange={e => setReference(e.target.value)}
                className="apple-input w-full font-mono text-xs uppercase"
                placeholder="PRJ-SNT-01"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Description & Objectifs Stratégiques
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="apple-input w-full resize-none text-xs"
              placeholder="Décrivez les attendus clés, le contexte et la finalité du projet..."
            />
          </div>

          {/* Statut, Priorité & Administrateur Responsable */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Statut
              </label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as ProjectStatus)}
                className="apple-input w-full text-xs font-medium"
              >
                <option value="active">🟢 En cours / Actif</option>
                <option value="draft">🟡 Brouillon / Cadrage</option>
                <option value="on_hold">🟠 En pause / Suspendu</option>
                <option value="completed">🔵 Clôturé / Terminé</option>
                <option value="archived">⚪ Archivé</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Priorité
              </label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as ProjectPriority)}
                className="apple-input w-full text-xs font-medium"
              >
                <option value="urgent">🔴 Critique / Urgent</option>
                <option value="high">🟠 Haute</option>
                <option value="medium">🟡 Moyenne</option>
                <option value="low">🟢 Faible</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Admin Responsable
              </label>
              <select
                value={leadUserId}
                onChange={e => setLeadUserId(e.target.value)}
                className="apple-input w-full text-xs font-medium"
              >
                {users.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.jobTitle})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Calendrier : Dates Début et Fin */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#0071E3]" />
                Date de Lancement
              </label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="apple-input w-full text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#FF3B30]" />
                Échéance Prévue
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="apple-input w-full text-xs"
              />
            </div>
          </div>

          {/* Temps alloué & Budget du projet */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-black/5 dark:border-white/10">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#0071E3]" />
                Temps Alloué Dédié au Projet (Heures)
              </label>
              <input
                type="number"
                min="1"
                step="5"
                value={allocatedHours}
                onChange={e => setAllocatedHours(Number(e.target.value))}
                className="apple-input w-full text-xs"
                placeholder="Ex : 160h"
              />
              <p className="text-[11px] text-slate-400">
                Plafond d'heures pour le suivi du temps et alertes de dépassement.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-[#34C759]" />
                Budget Financier Alloué (€)
              </label>
              <input
                type="number"
                min="0"
                step="1000"
                value={budget}
                onChange={e => setBudget(Number(e.target.value))}
                className="apple-input w-full text-xs"
                placeholder="Ex : 45000"
              />
              <p className="text-[11px] text-slate-400">
                Enveloppe budgétaire globale allouée à ce projet.
              </p>
            </div>
          </div>

          {/* Formule actuelle du projet */}
          <div className="p-3.5 rounded-2xl bg-[#F5F5F7] dark:bg-[#2C2C2E]/60 border border-black/5 dark:border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Shield className="w-4 h-4 text-[#0071E3] dark:text-[#2997FF]" />
              <div>
                <div className="text-xs font-semibold text-slate-900 dark:text-white">
                  Niveau de formule : <span className="uppercase text-[#0071E3] dark:text-[#2997FF]">{project.tier || 'Standard'}</span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Le niveau (Standard, Pro, Premium) est administré par le Super Administrateur.
                </div>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#0071E3]/10 text-[#0071E3] dark:text-[#2997FF]">
              {(project.tier || 'Standard').toUpperCase()}
            </span>
          </div>

          {/* Boutons d'action */}
          <div className="pt-4 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="apple-btn-secondary text-xs"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="apple-btn-primary text-xs"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Enregistrer les modifications</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
