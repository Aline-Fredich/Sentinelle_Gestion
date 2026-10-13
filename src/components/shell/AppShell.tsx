'use client';

import React, { useState } from 'react';
import { useSentinel } from '@/lib/store';
import { Sidebar } from '@/components/shell/Sidebar';
import { Topbar } from '@/components/shell/Topbar';
import { OverviewDashboard } from '@/components/dashboard/OverviewDashboard';
import { ProjectSheet } from '@/components/projects/ProjectSheet';
import { TrackingBoard } from '@/components/tracking/TrackingBoard';
import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import { GanttChart } from '@/components/planning/GanttChart';
import { CalendarView } from '@/components/calendar/CalendarView';
import { DocumentsView } from '@/components/documents/DocumentsView';
import { TeamView } from '@/components/team/TeamView';
import { SettingsView } from '@/components/settings/SettingsView';
import { ProjectForumView } from '@/components/forum/ProjectForumView';
import { BillingView } from '@/components/billing/BillingView';
import { FinanceView } from '@/components/finance/FinanceView';
import { TimeTrackingView } from '@/components/timetracking/TimeTrackingView';
import { SprintsView } from '@/components/sprints/SprintsView';
import { WikiView } from '@/components/wiki/WikiView';
import { RisksView } from '@/components/risks/RisksView';

import { TaskModal } from '@/components/dialogs/TaskModal';
import { IconPickerModal } from '@/components/icons/IconPickerModal';
import { ShareModal } from '@/components/dialogs/ShareModal';
import { ExportModal } from '@/components/dialogs/ExportModal';
import { ImportModal } from '@/components/dialogs/ImportModal';
import { Task, TaskStatus } from '@/types/sentinel';

interface AppShellProps {
  children?: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { activeView, updateProject, updatePhase } = useSentinel();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Gestion des modales globales
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [defaultTaskStatus, setDefaultTaskStatus] = useState<TaskStatus>('todo');

  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);
  const [iconTargetId, setIconTargetId] = useState<string | null>(null);

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const handleOpenNewTaskModal = (task?: Task, defaultStatus?: TaskStatus) => {
    if (task) {
      setTaskToEdit(task);
    } else {
      setTaskToEdit(null);
      setDefaultTaskStatus(defaultStatus || 'todo');
    }
    setIsTaskModalOpen(true);
  };

  const handleOpenIconPicker = (targetId: string) => {
    setIconTargetId(targetId);
    setIsIconPickerOpen(true);
  };

  const handleSelectIcon = (iconKey?: string) => {
    if (!iconTargetId) return;
    if (iconTargetId.startsWith('prj-')) {
      updateProject(iconTargetId, { iconKey: iconKey || 'shield' });
    } else if (iconTargetId.startsWith('phase-')) {
      updatePhase(iconTargetId, { iconKey: iconKey || 'layers' });
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 font-sans antialiased text-slate-900 dark:text-slate-100">
      {/* Barre latérale */}
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
      />

      {/* Contenu principal */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Barre supérieure */}
        <Topbar
          onOpenNewTaskModal={() => handleOpenNewTaskModal()}
          onOpenShareModal={() => setIsShareModalOpen(true)}
          onOpenExportModal={() => setIsExportModalOpen(true)}
          onOpenImportModal={() => setIsImportModalOpen(true)}
        />

        {/* Corps de la page */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-[1600px] mx-auto">
            {children ? (
              children
            ) : (
              <>
                {activeView === 'overview' && (
                  <OverviewDashboard onOpenTaskModal={handleOpenNewTaskModal} />
                )}
                {activeView === 'project_sheet' && (
                  <ProjectSheet
                    onOpenTaskModal={handleOpenNewTaskModal}
                    onOpenIconPicker={handleOpenIconPicker}
                    onOpenShareModal={() => setIsShareModalOpen(true)}
                    onOpenExportModal={() => setIsExportModalOpen(true)}
                    onOpenImportModal={() => setIsImportModalOpen(true)}
                  />
                )}
                {activeView === 'tracking' && (
                  <TrackingBoard onOpenTaskModal={handleOpenNewTaskModal} />
                )}
                {activeView === 'kanban' && (
                  <KanbanBoard onOpenTaskModal={handleOpenNewTaskModal} />
                )}
                {activeView === 'sprints' && <SprintsView />}
                {activeView === 'gantt' && (
                  <GanttChart
                    onOpenTaskModal={handleOpenNewTaskModal}
                    onOpenIconPicker={handleOpenIconPicker}
                  />
                )}
                {activeView === 'calendar' && (
                  <CalendarView onOpenTaskModal={handleOpenNewTaskModal} />
                )}
                {activeView === 'finance' && <FinanceView />}
                {activeView === 'timetracking' && <TimeTrackingView />}
                {activeView === 'risks' && <RisksView />}
                {activeView === 'wiki' && <WikiView />}
                {activeView === 'forum' && <ProjectForumView />}
                {activeView === 'documents' && <DocumentsView />}
                {activeView === 'team' && (
                  <TeamView onOpenTaskModal={handleOpenNewTaskModal} />
                )}
                {activeView === 'billing' && <BillingView />}
                {activeView === 'settings' && <SettingsView />}
              </>
            )}
          </div>
        </main>
      </div>

      {/* Boîtes de dialogue modales globales */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        taskToEdit={taskToEdit}
        defaultStatus={defaultTaskStatus}
      />

      <IconPickerModal
        isOpen={isIconPickerOpen}
        onClose={() => setIsIconPickerOpen(false)}
        onSelectIcon={handleSelectIcon}
      />

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
      />

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />

      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      />
    </div>
  );
}
