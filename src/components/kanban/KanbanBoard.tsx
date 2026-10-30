'use client';

import React, { useState } from 'react';
import { 
  Plus, AlertTriangle, CheckSquare, Calendar, 
  ChevronLeft, ChevronRight, GripVertical 
} from 'lucide-react';
import {
  DndContext,
  DragOverlay,
  useSensors,
  useSensor,
  PointerSensor,
  KeyboardSensor,
  closestCorners,
  type DragStartEvent,
  type DragEndEvent,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { useSentinel } from '@/lib/store';
import { Task, TaskStatus, User, ProjectPhase } from '@/types/sentinel';
import { formatDayMonthFrench, isDateOverdue } from '@/lib/dateUtils';
import { Badge } from '@/components/ui/Badge';
import { getPriorityBadgeVariant } from '@/components/ui/badgeTokens';
import { Button } from '@/components/ui/Button';

interface KanbanBoardProps {
  onOpenTaskModal: (task?: Task, defaultStatus?: TaskStatus) => void;
}

const COLUMNS: Array<{ status: TaskStatus; label: string }> = [
  { status: 'todo', label: 'À FAIRE' },
  { status: 'in_progress', label: 'EN COURS' },
  { status: 'in_review', label: 'EN REVUE' },
  { status: 'done', label: 'TERMINÉ' },
];

/**
 * Carte de tâche individuelle avec support Drag & Drop (@dnd-kit)
 */
function SortableKanbanCard({
  task,
  users,
  phases,
  onOpenTaskModal,
  moveTaskStatus,
  currentStatus,
}: {
  task: Task;
  users: User[];
  phases: ProjectPhase[];
  onOpenTaskModal: (task: Task) => void;
  moveTaskStatus: (taskId: string, newStatus: TaskStatus) => void;
  currentStatus: TaskStatus;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: { task, currentStatus },
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
  };

  const assignee = users.find(u => u.id === task.assigneeId);
  const isLate = isDateOverdue(task.dueDate, task.status);
  const phase = phases.find(p => p.id === task.phaseId);
  const checklistTotal = task.checklist ? task.checklist.length : 0;
  const checklistDone = task.checklist ? task.checklist.filter(c => c.isCompleted).length : 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-testid={`kanban-card-${task.id}`}
      onClick={() => onOpenTaskModal(task)}
      className={[
        'card-inner group cursor-pointer transition-all duration-150 space-y-2 p-3 rounded-[var(--r-sm)] select-none',
        'bg-[var(--surface-2)] border border-[var(--border)] hover:border-[var(--brand)] hover:shadow-md relative',
        isLate ? 'border-l-4 border-l-[var(--button-danger-bg)]' : phase?.colorKey ? 'border-l-4' : '',
      ].filter(Boolean).join(' ')}
    >
      {/* En-tête : Poignée de glisser-déposer + Priorité + Phase + Boutons de déplacement rapide */}
      <div className="flex items-center justify-between gap-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Poignée de drag */}
          <button
            type="button"
            {...attributes}
            {...listeners}
            onClick={(e) => e.stopPropagation()}
            className="cursor-grab active:cursor-grabbing p-0.5 -ml-1 text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
            title="Glisser pour changer de colonne"
            aria-label={`Glisser la tâche ${task.title}`}
          >
            <GripVertical className="w-3.5 h-3.5" />
          </button>

          <Badge variant={getPriorityBadgeVariant(task.priority)} size="sm">
            {task.priority.toUpperCase()}
          </Badge>
          {phase && (
            <span 
              className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-[var(--border)] text-[var(--text-muted)] truncate max-w-[120px]"
              title={phase.name}
            >
              {phase.name}
            </span>
          )}
        </div>

        {/* Boutons fléchés conservés pour accessibilité et tests Playwright existants */}
        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
          {currentStatus !== 'todo' && (
            <button
              type="button"
              data-testid={`move-prev-${task.id}`}
              title="Déplacer vers la colonne précédente"
              onClick={(e) => {
                e.stopPropagation();
                const prevStatus: Record<TaskStatus, TaskStatus> = {
                  in_progress: 'todo',
                  in_review: 'in_progress',
                  done: 'in_review',
                  todo: 'todo',
                };
                moveTaskStatus(task.id, prevStatus[task.status]);
              }}
              className="p-1 rounded border border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] hover:border-[var(--brand)] hover:text-[var(--text)] transition-colors"
            >
              <ChevronLeft className="w-3 h-3" />
            </button>
          )}
          {currentStatus !== 'done' && (
            <button
              type="button"
              data-testid={`move-next-${task.id}`}
              title="Déplacer vers la colonne suivante"
              onClick={(e) => {
                e.stopPropagation();
                const nextStatus: Record<TaskStatus, TaskStatus> = {
                  todo: 'in_progress',
                  in_progress: 'in_review',
                  done: 'done',
                  in_review: 'done',
                };
                moveTaskStatus(task.id, nextStatus[task.status]);
              }}
              className="p-1 rounded border border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] hover:border-[var(--brand)] hover:text-[var(--text)] transition-colors"
            >
              <ChevronRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Titre de la tâche */}
      <h4 className="text-xs font-semibold text-[var(--text)] line-clamp-2">
        {task.title}
      </h4>

      {/* Avancement checklist si sous-objectifs présents */}
      {checklistTotal > 0 && (
        <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)] font-mono">
          <CheckSquare className="w-3 h-3 text-[var(--brand)]" />
          <span>
            {checklistDone}/{checklistTotal} sous-objectifs
          </span>
        </div>
      )}

      {/* Pied de carte : Échéance + Assigné */}
      <div className="flex items-center justify-between pt-2 border-t border-[var(--border)] text-[11px] text-[var(--text-muted)]">
        <div className="flex items-center gap-1 font-mono">
          <Calendar className="w-3 h-3 text-[var(--brand)]" />
          <span className={isLate ? 'text-[var(--button-danger-bg)] font-bold flex items-center gap-1' : ''}>
            {task.dueDate ? formatDayMonthFrench(task.dueDate) : 'Sans date'}
            {isLate && <AlertTriangle className="w-3 h-3 text-[var(--button-danger-bg)] inline" />}
          </span>
        </div>
        {assignee && (
          <span 
            className="w-5 h-5 rounded-[var(--r-xs)] border border-[var(--border-strong)] bg-[var(--surface-raised)] text-[var(--text)] font-mono text-[10px] font-bold flex items-center justify-center shadow-xs"
            title={`${assignee.name} (${assignee.jobTitle})`}
          >
            {assignee.name.charAt(0)}
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Colonne Droppable Kanban
 */
function KanbanColumn({
  status,
  label,
  tasks,
  users,
  phases,
  onOpenTaskModal,
  moveTaskStatus,
}: {
  status: TaskStatus;
  label: string;
  tasks: Task[];
  users: User[];
  phases: ProjectPhase[];
  onOpenTaskModal: (task?: Task, defaultStatus?: TaskStatus) => void;
  moveTaskStatus: (taskId: string, newStatus: TaskStatus) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
    data: { status },
  });

  return (
    <div
      ref={setNodeRef}
      data-testid={`kanban-col-${status}`}
      className={[
        'panel flex flex-col p-3.5 min-h-[580px] border rounded-[var(--r-md)] shadow-sm transition-colors duration-200',
        isOver
          ? 'border-[var(--brand)] bg-[var(--surface-raised)] ring-2 ring-[var(--brand)]/20'
          : 'border-[var(--border)] bg-[var(--surface)]',
      ].join(' ')}
    >
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-bold text-[var(--text)] uppercase tracking-wider">
            {label}
          </h3>
          <Badge variant={status === 'done' ? 'success' : 'default'} size="sm">
            {tasks.length}
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="p-1 h-7 w-7 min-w-0"
          onClick={() => onOpenTaskModal(undefined, status)}
          title="Ajouter dans cette colonne"
          icon={<Plus className="w-3.5 h-3.5 text-[var(--brand)]" />}
        />
      </div>

      <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[720px] pr-0.5 min-h-[140px]">
          {tasks.length === 0 ? (
            <div className="h-28 border border-dashed border-[var(--border)] rounded-[var(--r-sm)] flex items-center justify-center text-xs text-[var(--text-muted)] italic">
              Déposez des tâches ici
            </div>
          ) : (
            tasks.map(task => (
              <SortableKanbanCard
                key={task.id}
                task={task}
                users={users}
                phases={phases}
                onOpenTaskModal={onOpenTaskModal}
                moveTaskStatus={moveTaskStatus}
                currentStatus={status}
              />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  );
}

export function KanbanBoard({ onOpenTaskModal }: KanbanBoardProps) {
  const { filteredTasks, moveTaskStatus, users, phases } = useSentinel();
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  // Configuration des capteurs tactiles et souris avec tolérance de déplacement
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Déclenche le drag après 5px pour préserver le clic d'ouverture
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const task = filteredTasks.find(t => t.id === event.active.id);
    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const taskId = String(active.id);
    const targetStatus = over.data?.current?.status as TaskStatus | undefined;

    // Si on a survolé directement la colonne
    if (targetStatus && COLUMNS.some(c => c.status === targetStatus)) {
      moveTaskStatus(taskId, targetStatus);
      return;
    }

    // Si on a survolé une tâche au sein d'une colonne
    const overTask = filteredTasks.find(t => t.id === over.id);
    if (overTask && overTask.status) {
      moveTaskStatus(taskId, overTask.status);
    }
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-12">
      {/* En-tête du tableau Kanban */}
      <div className="panel flex items-center justify-between border border-[var(--border)] bg-[var(--surface)] p-4 rounded-[var(--r-md)]">
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-[var(--brand)] shadow-[var(--glow-sm)]" />
          <div>
            <h2 className="text-sm font-bold text-[var(--text)] uppercase tracking-wider">
              TABLEAU KANBAN COMPLET
            </h2>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Gestion tactile et réactive des flux par étapes avec glisser-déposer
            </p>
          </div>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => onOpenTaskModal(undefined, 'todo')}
          icon={<Plus className="w-4 h-4" />}
        >
          NOUVELLE TÂCHE
        </Button>
      </div>

      {/* DndContext & Grille des 4 colonnes Kanban */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
          {COLUMNS.map(col => {
            const colTasks = filteredTasks.filter(t => t.status === col.status);
            return (
              <KanbanColumn
                key={col.status}
                status={col.status}
                label={col.label}
                tasks={colTasks}
                users={users}
                phases={phases}
                onOpenTaskModal={onOpenTaskModal}
                moveTaskStatus={moveTaskStatus}
              />
            );
          })}
        </div>

        {/* Overlay visuel lors du glissement */}
        <DragOverlay>
          {activeTask ? (
            <div className="card-inner p-3 rounded-[var(--r-sm)] bg-[var(--surface-raised)] border-2 border-[var(--brand)] shadow-2xl opacity-90 scale-105 pointer-events-none">
              <Badge variant={getPriorityBadgeVariant(activeTask.priority)} size="sm">
                {activeTask.priority.toUpperCase()}
              </Badge>
              <h4 className="text-xs font-semibold text-[var(--text)] mt-1.5 line-clamp-2">
                {activeTask.title}
              </h4>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
