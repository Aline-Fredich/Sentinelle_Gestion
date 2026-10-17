'use client';

import React, { useState, useEffect } from 'react';
import { X, Calendar, User, Tag, Clock, CheckSquare, Plus, Trash2 } from 'lucide-react';
import { Task, TaskPriority, TaskStatus, ChecklistItem } from '@/types/sentinel';
import { useSentinel } from '@/lib/store';
import { getTodayDateString } from '@/lib/dateUtils';
import { ConfirmDialog } from '@/components/dialogs/ConfirmDialog';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskToEdit?: Task | null;
  defaultStatus?: TaskStatus;
}

export function TaskModal({
  isOpen,
  onClose,
  taskToEdit,
  defaultStatus = 'todo',
}: TaskModalProps) {
  const { 
    projects, phases, users, activeProjectId, 
    createTask, updateTask, deleteTask 
  } = useSentinel();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState(activeProjectId !== 'all' ? activeProjectId : (projects[0]?.id || ''));
  const [phaseId, setPhaseId] = useState<string>('');
  const [status, setStatus] = useState<TaskStatus>(defaultStatus);
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [assigneeId, setAssigneeId] = useState<string>('');
  const [startDate, setStartDate] = useState(getTodayDateString());
  const [dueDate, setDueDate] = useState('');
  const [estimateHours, setEstimateHours] = useState('4');
  const [labelsInput, setLabelsInput] = useState('');
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [newChecklistText, setNewChecklistText] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Initialisation lors de l'ouverture
  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title);
      setDescription(taskToEdit.description || '');
      setProjectId(taskToEdit.projectId);
      setPhaseId(taskToEdit.phaseId || '');
      setStatus(taskToEdit.status);
      setPriority(taskToEdit.priority);
      setAssigneeId(taskToEdit.assigneeId || '');
      setStartDate(taskToEdit.startDate || getTodayDateString());
      setDueDate(taskToEdit.dueDate || '');
      setEstimateHours(String((taskToEdit.estimateMinutes || 60) / 60));
      setLabelsInput(taskToEdit.labels ? taskToEdit.labels.join(', ') : '');
      setChecklist(taskToEdit.checklist || []);
    } else {
      setTitle('');
      setDescription('');
      setProjectId(activeProjectId !== 'all' ? activeProjectId : (projects[0]?.id || ''));
      setPhaseId('');
      setStatus(defaultStatus);
      setPriority('medium');
      setAssigneeId(users[0]?.id || '');
      setStartDate(getTodayDateString());
      setDueDate('');
      setEstimateHours('4');
      setLabelsInput('');
      setChecklist([]);
    }
    setErrorMsg('');
  }, [isOpen, taskToEdit, defaultStatus, activeProjectId, projects, users]);

  if (!isOpen) return null;

  const projectPhases = phases.filter(p => p.projectId === projectId);

  const handleAddChecklistItem = () => {
    if (!newChecklistText.trim()) return;
    setChecklist(prev => [
      ...prev,
      {
        id: `chk-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        title: newChecklistText.trim(),
        isCompleted: false,
      }
    ]);
    setNewChecklistText('');
  };

  const handleToggleChecklist = (id: string) => {
    setChecklist(prev => prev.map(c => c.id === id ? { ...c, isCompleted: !c.isCompleted } : c));
  };

  const handleRemoveChecklist = (id: string) => {
    setChecklist(prev => prev.filter(c => c.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Le titre de la tâche est obligatoire.');
      return;
    }
    if (!projectId) {
      setErrorMsg('Veuillez sélectionner un projet.');
      return;
    }

    const labels = labelsInput
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const parsedHours = parseFloat(estimateHours) || 1;
    const estimateMinutes = Math.round(parsedHours * 60);

    if (taskToEdit) {
      updateTask(taskToEdit.id, {
        title: title.trim(),
        description: description.trim(),
        projectId,
        phaseId: phaseId || undefined,
        status,
        priority,
        assigneeId: assigneeId || undefined,
        startDate: startDate || undefined,
        dueDate: dueDate || undefined,
        estimateMinutes,
        labels,
        checklist,
      });
    } else {
      createTask({
        title: title.trim(),
        description: description.trim(),
        projectId,
        phaseId: phaseId || undefined,
        status,
        priority,
        assigneeId: assigneeId || undefined,
        startDate: startDate || undefined,
        dueDate: dueDate || undefined,
        estimateMinutes,
        labels,
        checklist,
      });
    }

    onClose();
  };

  const handleConfirmDelete = () => {
    if (taskToEdit) {
      deleteTask(taskToEdit.id);
      setShowDeleteConfirm(false);
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-hidden">
        {/* En-tête */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              {taskToEdit ? 'Modifier la tâche' : 'Nouvelle tâche'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Renseignez les paramètres et l’échéance pour le suivi de projet
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 text-xs rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-800 font-medium">
              {errorMsg}
            </div>
          )}

          {/* Titre */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Titre de la tâche <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              data-testid="input-task-title"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Refonte du module d'authentification..."
              className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0066FF] text-slate-900 dark:text-white placeholder:text-slate-400"
            />
          </div>

          {/* Projet et Phase */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Projet associé <span className="text-rose-500">*</span>
              </label>
              <select
                value={projectId}
                onChange={(e) => {
                  setProjectId(e.target.value);
                  setPhaseId('');
                }}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0066FF] text-slate-900 dark:text-white"
              >
                {projects.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Phase du projet (optionnel)
              </label>
              <select
                value={phaseId}
                onChange={(e) => setPhaseId(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0066FF] text-slate-900 dark:text-white"
              >
                <option value="">Aucune phase particulière</option>
                {projectPhases.map(ph => (
                  <option key={ph.id} value={ph.id}>
                    Phase {ph.order} : {ph.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Statut & Priorité */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Statut initial
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0066FF] text-slate-900 dark:text-white"
              >
                <option value="todo">À faire</option>
                <option value="in_progress">En cours</option>
                <option value="in_review">En revue</option>
                <option value="done">Terminé</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Priorité
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0066FF] text-slate-900 dark:text-white"
              >
                <option value="urgent">🔴 Urgente</option>
                <option value="high">🟠 Haute</option>
                <option value="medium">🟡 Moyenne</option>
                <option value="low">🟢 Basse</option>
              </select>
            </div>
          </div>

          {/* Responsable & Estimation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Intervenant assigné
              </label>
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0066FF] text-slate-900 dark:text-white"
              >
                <option value="">Non assigné</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.jobTitle})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Charge estimée (heures)
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={estimateHours}
                  onChange={(e) => setEstimateHours(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0066FF] text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Dates de début et fin */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Date de début
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0066FF] text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Échéance limite (Fin)
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0066FF] text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Étiquettes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Étiquettes (séparées par une virgule)
            </label>
            <input
              type="text"
              value={labelsInput}
              onChange={(e) => setLabelsInput(e.target.value)}
              placeholder="Ex: Frontend, Sécurité, Sprint-1, Prioritaire"
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0066FF] text-slate-900 dark:text-white placeholder:text-slate-400"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Description & Critères de succès
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Précisez le contexte, les livrables attendus et les consignes..."
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0066FF] text-slate-900 dark:text-white placeholder:text-slate-400"
            />
          </div>

          {/* Checklist / Liste de contrôle */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Liste de contrôle (Checklist d’avancement)
            </label>
            <div className="space-y-1.5 mb-2">
              {checklist.map((item) => (
                <div 
                  key={item.id} 
                  className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800"
                >
                  <input
                    type="checkbox"
                    checked={item.isCompleted}
                    onChange={() => handleToggleChecklist(item.id)}
                    className="w-4 h-4 rounded text-[#0066FF] focus:ring-blue-500"
                  />
                  <span className={`text-xs flex-1 ${item.isCompleted ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-200'}`}>
                    {item.title}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveChecklist(item.id)}
                    className="text-slate-400 hover:text-rose-500"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newChecklistText}
                onChange={(e) => setNewChecklistText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddChecklistItem();
                  }
                }}
                placeholder="Ajouter un sous-objectif à cocher..."
                className="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066FF] text-slate-900 dark:text-white"
              />
              <button
                type="button"
                onClick={handleAddChecklistItem}
                className="px-3 py-1.5 text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition"
              >
                Ajouter
              </button>
            </div>
          </div>
        </form>

        {/* Pied de modal */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 flex items-center justify-between">
          <div>
            {taskToEdit && (
              <button
                type="button"
                data-testid="btn-task-delete"
                onClick={() => setShowDeleteConfirm(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Supprimer
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition"
            >
              Annuler
            </button>
            <button
              type="button"
              data-testid="btn-task-submit"
              onClick={handleSubmit}
              className="px-5 py-2 text-xs font-semibold text-white bg-[#0066FF] hover:bg-blue-700 rounded-xl shadow-md transition"
            >
              {taskToEdit ? 'Enregistrer les modifications' : 'Créer la tâche'}
            </button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Supprimer la tâche"
        message={`Voulez-vous vraiment supprimer définitivement la tâche "${taskToEdit?.title || ''}" ? Cette action est irréversible.`}
        confirmLabel="Oui, supprimer"
        cancelLabel="Annuler"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
}
