'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { useSentinel } from '@/lib/store';
import { Sidebar } from '@/components/shell/Sidebar';
import { Topbar } from '@/components/shell/Topbar';
import { ViewLoadingSkeleton } from '@/components/shell/ViewLoadingSkeleton';
import { Task, TaskStatus } from '@/types/sentinel';

// Chargement différé à la demande (Lot 2 : Réduction drastique du bundle initial et optimisation LCP/INP)
const OverviewDashboard = dynamic(() => import('@/components/dashboard/OverviewDashboard').then(mod => mod.OverviewDashboard), {
  loading: () => <ViewLoadingSkeleton />,
});
const ProjectSheet = dynamic(() => import('@/components/projects/ProjectSheet').then(mod => mod.ProjectSheet), {
  loading: () => <ViewLoadingSkeleton />,
});
const TrackingBoard = dynamic(() => import('@/components/tracking/TrackingBoard').then(mod => mod.TrackingBoard), {
  loading: () => <ViewLoadingSkeleton />,
});
const KanbanBoard = dynamic(() => import('@/components/kanban/KanbanBoard').then(mod => mod.KanbanBoard), {
  loading: () => <ViewLoadingSkeleton />,
});
const GanttChart = dynamic(() => import('@/components/planning/GanttChart').then(mod => mod.GanttChart), {
  loading: () => <ViewLoadingSkeleton />,
});
const CalendarView = dynamic(() => import('@/components/calendar/CalendarView').then(mod => mod.CalendarView), {
  loading: () => <ViewLoadingSkeleton />,
});
const DocumentsView = dynamic(() => import('@/components/documents/DocumentsView').then(mod => mod.DocumentsView), {
  loading: () => <ViewLoadingSkeleton />,
});
const TeamView = dynamic(() => import('@/components/team/TeamView').then(mod => mod.TeamView), {
  loading: () => <ViewLoadingSkeleton />,
});
const SettingsView = dynamic(() => import('@/components/settings/SettingsView').then(mod => mod.SettingsView), {
  loading: () => <ViewLoadingSkeleton />,
});
const ProjectForumView = dynamic(() => import('@/components/forum/ProjectForumView').then(mod => mod.ProjectForumView), {
  loading: () => <ViewLoadingSkeleton />,
});
const BillingView = dynamic(() => import('@/components/billing/BillingView').then(mod => mod.BillingView), {
  loading: () => <ViewLoadingSkeleton />,
});
const FinanceView = dynamic(() => import('@/components/finance/FinanceView').then(mod => mod.FinanceView), {
  loading: () => <ViewLoadingSkeleton />,
});
const TimeTrackingView = dynamic(() => import('@/components/timetracking/TimeTrackingView').then(mod => mod.TimeTrackingView), {
  loading: () => <ViewLoadingSkeleton />,
});
const SprintsView = dynamic(() => import('@/components/sprints/SprintsView').then(mod => mod.SprintsView), {
  loading: () => <ViewLoadingSkeleton />,
});
const WikiView = dynamic(() => import('@/components/wiki/WikiView').then(mod => mod.WikiView), {
  loading: () => <ViewLoadingSkeleton />,
});
const RisksView = dynamic(() => import('@/components/risks/RisksView').then(mod => mod.RisksView), {
  loading: () => <ViewLoadingSkeleton />,
});
const SuperAdminDashboard = dynamic(() => import('@/components/superadmin/SuperAdminDashboard').then(mod => mod.SuperAdminDashboard), {
  loading: () => <ViewLoadingSkeleton />,
});

// Boîtes de dialogue modales chargées uniquement à la demande
const TaskModal = dynamic(() => import('@/components/dialogs/TaskModal').then(mod => mod.TaskModal));
const IconPickerModal = dynamic(() => import('@/components/icons/IconPickerModal').then(mod => mod.IconPickerModal));
const ShareModal = dynamic(() => import('@/components/dialogs/ShareModal').then(mod => mod.ShareModal));
const ExportModal = dynamic(() => import('@/components/dialogs/ExportModal').then(mod => mod.ExportModal));
const ImportModal = dynamic(() => import('@/components/dialogs/ImportModal').then(mod => mod.ImportModal));
const SecurityGdprModal = dynamic(() => import('@/components/settings/SecurityGdprModal').then(mod => mod.SecurityGdprModal));
const ExecutiveReportModal = dynamic(() => import('@/components/reports/ExecutiveReportModal').then(mod => mod.ExecutiveReportModal));
const CreateProjectModal = dynamic(() => import('@/components/dialogs/CreateProjectModal').then(mod => mod.CreateProjectModal));
const AuthModal = dynamic(() => import('@/components/auth/AuthModal').then(mod => mod.AuthModal));

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
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

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
    <div className="flex h-screen overflow-hidden bg-[#F5F5F7] dark:bg-[#000000] font-sans antialiased text-slate-900 dark:text-[#F5F5F7]">
      {/* Barre latérale Apple */}
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
      />

      {/* Contenu principal */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Barre supérieure Apple */}
        <Topbar
          onOpenNewTaskModal={() => handleOpenNewTaskModal()}
          onOpenShareModal={() => setIsShareModalOpen(true)}
          onOpenExportModal={() => setIsExportModalOpen(true)}
          onOpenImportModal={() => setIsImportModalOpen(true)}
          onOpenSecurityModal={() => setIsSecurityModalOpen(true)}
          onOpenReportModal={() => setIsReportModalOpen(true)}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
        />

        {/* Corps de la page */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-[1600px] mx-auto">
            {children ? (
              children
            ) : (
              <>
                {activeView === 'overview' && (
                  <OverviewDashboard 
                    onOpenTaskModal={handleOpenNewTaskModal} 
                    onOpenCreateProjectModal={() => setIsCreateProjectOpen(true)}
                  />
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
                {activeView === 'super_admin' && <SuperAdminDashboard />}
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

      <SecurityGdprModal
        isOpen={isSecurityModalOpen}
        onClose={() => setIsSecurityModalOpen(false)}
      />

      <ExecutiveReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
      />

      <CreateProjectModal
        isOpen={isCreateProjectOpen}
        onClose={() => setIsCreateProjectOpen(false)}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
}
