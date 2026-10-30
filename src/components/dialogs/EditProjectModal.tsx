'use client';

import React, { useState, useEffect } from 'react';
import { X, Layers, Calendar, Clock, DollarSign, Shield, CheckCircle2 } from 'lucide-react';
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
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal max-w-2xl"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* En-tête Modale */}
        <div className="flex items-center justify-between pb-4 border-b border-[var(--line)] mb-5">
          <div className="flex items-center gap-2.5">
            <Layers className="w-5 h-5 text-[var(--red)]" />
            <h2 className="modal-title mb-0">
              ÉDITER LE PROJET • <span className="font-mono text-[var(--red)]">{project.reference}</span>
            </h2>
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-icon btn-sm"
            aria-label="Fermer la modale"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nom & Référence */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 form-group mb-0">
              <label className="form-label">
                Nom du Projet <span className="req">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                className="form-input"
                placeholder="Ex : Refonte Plateforme Digitale"
              />
            </div>
            <div className="form-group mb-0">
              <label className="form-label">
                Référence
              </label>
              <input
                type="text"
                value={reference}
                onChange={e => setReference(e.target.value)}
                className="form-input font-mono uppercase"
                placeholder="PRJ-SNT-01"
              />
            </div>
          </div>

          {/* Description */}
          <div className="form-group mb-0">
            <label className="form-label">
              Description & Objectifs Stratégiques
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="form-textarea"
              placeholder="Décrivez les attendus clés, le contexte et la finalité du projet..."
            />
          </div>

          {/* Statut, Priorité & Administrateur Responsable */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="form-group mb-0">
              <label className="form-label">
                Statut
              </label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as ProjectStatus)}
                className="form-select font-mono"
              >
                <option value="active">ACTIF / EN COURS</option>
                <option value="draft">BROUILLON / CADRAGE</option>
                <option value="on_hold">SUSPENDU / EN PAUSE</option>
                <option value="completed">CLÔTURÉ / TERMINÉ</option>
                <option value="archived">ARCHIVÉ</option>
              </select>
            </div>

            <div className="form-group mb-0">
              <label className="form-label">
                Priorité
              </label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as ProjectPriority)}
                className="form-select font-mono"
              >
                <option value="urgent">CRITIQUE / URGENT</option>
                <option value="high">HAUTE</option>
                <option value="medium">MOYENNE</option>
                <option value="low">FAIBLE</option>
              </select>
            </div>

            <div className="form-group mb-0">
              <label className="form-label">
                Admin Responsable
              </label>
              <select
                value={leadUserId}
                onChange={e => setLeadUserId(e.target.value)}
                className="form-select"
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
            <div className="form-group mb-0">
              <label className="form-label flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[var(--red)]" />
                Date de Lancement
              </label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="form-input font-mono"
              />
            </div>

            <div className="form-group mb-0">
              <label className="form-label flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[var(--red)]" />
                Échéance Prévue
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="form-input font-mono"
              />
            </div>
          </div>

          {/* Temps alloué & Budget du projet */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[var(--line)]">
            <div className="form-group mb-0">
              <label className="form-label flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[var(--red)]" />
                Temps Alloué (Heures)
              </label>
              <input
                type="number"
                min="1"
                step="5"
                value={allocatedHours}
                onChange={e => setAllocatedHours(Number(e.target.value))}
                className="form-input font-mono"
                placeholder="Ex : 160"
              />
              <p className="form-hint">
                Plafond d'heures pour suivi et alertes.
              </p>
            </div>

            <div className="form-group mb-0">
              <label className="form-label flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-[var(--red)]" />
                Budget Alloué (FCFA)
              </label>
              <input
                type="number"
                min="0"
                step="1000"
                value={budget}
                onChange={e => setBudget(Number(e.target.value))}
                className="form-input font-mono"
                placeholder="Ex : 45000000"
              />
              <p className="form-hint">
                Enveloppe budgétaire globale du projet.
              </p>
            </div>
          </div>

          {/* Formule actuelle du projet */}
          <div className="card-inner flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Shield className="w-4 h-4 text-[var(--red)]" />
              <div>
                <div className="text-xs font-bold text-white uppercase">
                  Niveau de formule : <span className="text-[var(--red)] font-mono">{(project.tier || 'Standard').toUpperCase()}</span>
                </div>
                <div className="text-[11px] text-[var(--white-45)]">
                  Le niveau (Standard, Pro, Premium) est gouverné par le Super Administrateur.
                </div>
              </div>
            </div>
            <span className="badge badge-role font-mono">
              {(project.tier || 'Standard').toUpperCase()}
            </span>
          </div>

          {/* Boutons d'action */}
          <div className="modal-actions">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
            >
              ANNULER
            </button>
            <button
              type="submit"
              className="btn btn-primary"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>ENREGISTRER</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
