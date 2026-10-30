'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Clock, Plus, Trash2, CheckSquare } from 'lucide-react';
import { Task, TaskPriority, TaskStatus, ChecklistItem } from '@/types/sentinel';
import { useSentinel } from '@/lib/store';
import { getTodayDateString } from '@/lib/dateUtils';
import { ConfirmDialog } from '@/components/dialogs/ConfirmDialog';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';

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
  const [isSubmitting, setIsSubmitting] = useState(false);

  // État initial pour la détection des modifications non enregistrées
  const [initialSnapshot, setInitialSnapshot] = useState('');

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

      setInitialSnapshot(JSON.stringify({
        title: taskToEdit.title,
        description: taskToEdit.description || '',
        projectId: taskToEdit.projectId,
        phaseId: taskToEdit.phaseId || '',
        status: taskToEdit.status,
        priority: taskToEdit.priority,
        assigneeId: taskToEdit.assigneeId || '',
        estimateHours: String((taskToEdit.estimateMinutes || 60) / 60),
      }));
    } else {
      const defaultPrjId = activeProjectId !== 'all' ? activeProjectId : (projects[0]?.id || '');
      setTitle('');
      setDescription('');
      setProjectId(defaultPrjId);
      setPhaseId('');
      setStatus(defaultStatus);
      setPriority('medium');
      setAssigneeId(users[0]?.id || '');
      setStartDate(getTodayDateString());
      setDueDate('');
      setEstimateHours('4');
      setLabelsInput('');
      setChecklist([]);

      setInitialSnapshot(JSON.stringify({
        title: '',
        description: '',
        projectId: defaultPrjId,
        phaseId: '',
        status: defaultStatus,
        priority: 'medium',
        assigneeId: users[0]?.id || '',
        estimateHours: '4',
      }));
    }
    setErrorMsg('');
    setIsSubmitting(false);
  }, [isOpen, taskToEdit, defaultStatus, activeProjectId, projects, users]);

  // Détection des modifications
  const isDirty = useMemo(() => {
    if (!isOpen) return false;
    const current = JSON.stringify({
      title,
      description,
      projectId,
      phaseId,
      status,
      priority,
      assigneeId,
      estimateHours,
    });
    return current !== initialSnapshot;
  }, [isOpen, initialSnapshot, title, description, projectId, phaseId, status, priority, assigneeId, estimateHours]);

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

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Le titre de la tâche est obligatoire.');
      return;
    }
    if (!projectId) {
      setErrorMsg('Veuillez sélectionner un projet.');
      return;
    }

    setIsSubmitting(true);

    const labels = labelsInput
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const parsedHours = parseFloat(estimateHours) || 1;
    const estimateMinutes = Math.round(parsedHours * 60);

    try {
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
    } catch {
      setErrorMsg('Une erreur inattendue est survenue.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = () => {
    if (taskToEdit) {
      deleteTask(taskToEdit.id);
      setShowDeleteConfirm(false);
      onClose();
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        variant="drawer"
        hasUnsavedChanges={isDirty}
        title={taskToEdit ? 'Modifier la tâche' : 'Nouvelle tâche'}
        subtitle="Renseignez les paramètres et l’échéance pour le suivi de projet"
        icon={<CheckSquare className="w-4 h-4 text-[var(--brand)]" />}
        footer={
          <div className="w-full flex items-center justify-between">
            <div>
              {taskToEdit && (
                <Button
                  variant="danger"
                  size="sm"
                  data-testid="btn-task-delete"
                  onClick={() => setShowDeleteConfirm(true)}
                  icon={<Trash2 className="w-3.5 h-3.5" />}
                >
                  SUPPRIMER
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={onClose}
              >
                ANNULER
              </Button>
              <Button
                variant="primary"
                size="sm"
                data-testid="btn-task-submit"
                loading={isSubmitting}
                onClick={() => handleSubmit()}
              >
                {taskToEdit ? 'ENREGISTRER' : 'CRÉER LA TÂCHE'}
              </Button>
            </div>
          </div>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMsg && (
            <div className="alert alert--error text-xs font-bold p-3 rounded-[var(--r-sm)]">
              {errorMsg}
            </div>
          )}

          {/* Titre */}
          <Input
            label="Titre de la tâche"
            required
            data-testid="input-task-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Refonte du module d'authentification..."
            error={!title.trim() && errorMsg ? 'Le titre est requis' : undefined}
          />

          {/* Projet et Phase */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Projet associé"
              required
              value={projectId}
              onChange={(e) => {
                setProjectId(e.target.value);
                setPhaseId('');
              }}
            >
              {projects.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>

            <Select
              label="Phase du projet (optionnel)"
              value={phaseId}
              onChange={(e) => setPhaseId(e.target.value)}
            >
              <option value="">Aucune phase particulière</option>
              {projectPhases.map(ph => (
                <option key={ph.id} value={ph.id}>
                  Phase {ph.order} : {ph.name}
                </option>
              ))}
            </Select>
          </div>

          {/* Statut & Priorité */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Statut initial"
              value={status}
              onChange={(e) => setStatus(e.target.value as TaskStatus)}
            >
              <option value="todo">À FAIRE</option>
              <option value="in_progress">EN COURS</option>
              <option value="in_review">EN REVUE</option>
              <option value="done">TERMINÉ</option>
            </Select>

            <Select
              label="Priorité"
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
            >
              <option value="urgent">URGENTE</option>
              <option value="high">HAUTE</option>
              <option value="medium">MOYENNE</option>
              <option value="low">BASSE</option>
            </Select>
          </div>

          {/* Responsable & Estimation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Intervenant assigné"
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
            >
              <option value="">Non assigné</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.jobTitle})
                </option>
              ))}
            </Select>

            <Input
              label="Charge estimée (heures)"
              type="number"
              min="0.5"
              step="0.5"
              value={estimateHours}
              onChange={(e) => setEstimateHours(e.target.value)}
              leftIcon={<Clock className="w-4 h-4 text-[var(--brand)]" />}
              className="font-mono font-bold"
            />
          </div>

          {/* Dates de début et fin */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Date de début"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="font-mono"
            />

            <Input
              label="Échéance limite (Fin)"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="font-mono"
            />
          </div>

          {/* Étiquettes */}
          <Input
            label="Étiquettes (séparées par une virgule)"
            value={labelsInput}
            onChange={(e) => setLabelsInput(e.target.value)}
            placeholder="Ex: Frontend, Sécurité, Sprint-1, Prioritaire"
          />

          {/* Description */}
          <Textarea
            label="Description & Critères de succès"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Précisez le contexte, les livrables attendus et les consignes..."
          />

          {/* Checklist / Liste de contrôle */}
          <div className="space-y-2 pt-2 border-t border-[var(--border)]">
            <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text)] block">
              Liste de contrôle (Checklist d’avancement)
            </label>
            <div className="space-y-1.5 mb-2">
              {checklist.map((item) => (
                <div 
                  key={item.id} 
                  className="flex items-center gap-2 p-2 rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--surface-2)]"
                >
                  <input
                    type="checkbox"
                    checked={item.isCompleted}
                    onChange={() => handleToggleChecklist(item.id)}
                    className="w-4 h-4 rounded border-[var(--border)] text-[var(--brand)] cursor-pointer"
                  />
                  <span className={`text-xs flex-1 ${item.isCompleted ? 'line-through text-[var(--text-muted)]' : 'text-[var(--text)]'}`}>
                    {item.title}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveChecklist(item.id)}
                    className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--button-danger-bg)] transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
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
                className="form-input flex-1 text-xs"
              />
              <Button
                variant="secondary"
                size="sm"
                onClick={handleAddChecklistItem}
                icon={<Plus className="w-3.5 h-3.5" />}
              >
                AJOUTER
              </Button>
            </div>
          </div>
        </form>
      </Modal>

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
    </>
  );
}
