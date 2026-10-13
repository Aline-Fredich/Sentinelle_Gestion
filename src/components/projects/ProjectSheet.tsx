'use client';

import React, { useState } from 'react';
import { 
  Folder, Calendar, Users, Flag, ExternalLink, 
  Share2, Download, Upload, CheckCircle2, Clock, 
  Layers, BarChart2, FolderKanban, FileText, Plus, Shield, Edit3 
} from 'lucide-react';
import { useSentinel } from '@/lib/store';
import { renderSentinelIcon } from '@/lib/iconRegistry';
import { formatShortDateFrench } from '@/lib/dateUtils';
import { GanttChart } from '@/components/planning/GanttChart';
import { TrackingBoard } from '@/components/tracking/TrackingBoard';
import { Task } from '@/types/sentinel';

interface ProjectSheetProps {
  onOpenTaskModal: (task?: Task) => void;
  onOpenIconPicker: (targetId: string) => void;
  onOpenShareModal: () => void;
  onOpenExportModal: () => void;
  onOpenImportModal: () => void;
}

export function ProjectSheet({
  onOpenTaskModal,
  onOpenIconPicker,
  onOpenShareModal,
  onOpenExportModal,
  onOpenImportModal,
}: ProjectSheetProps) {
  const { currentProject, metrics, milestones, users, documents } = useSentinel();
  const [internalTab, setInternalTab] = useState<'sheet' | 'planning' | 'tracking' | 'kanban' | 'docs'>('sheet');

  if (!currentProject) {
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
        <Folder className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
          Veuillez sélectionner un projet spécifique
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          La fiche projet nécessite un périmètre ciblé pour afficher les jalons et objectifs détaillés.
        </p>
      </div>
    );
  }

  const projectMilestones = milestones.filter(m => m.projectId === currentProject.id);
  const projectDocs = documents.filter(d => d.projectId === currentProject.id);
  const leadUser = users.find(u => u.id === currentProject.leadUserId);

  return (
    <div className="space-y-6">
      {/* 1. En-tête de la Fiche Projet */}
      <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            {/* Icône du projet avec bouton de personnalisation */}
            <button
              onClick={() => onOpenIconPicker(currentProject.id)}
              className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-[#0066FF] dark:text-cyan-400 flex items-center justify-center border border-blue-200 dark:border-blue-800 shadow-sm hover:scale-105 transition"
              title="Cliquer pour changer l'icône du projet"
            >
              {renderSentinelIcon(currentProject.iconKey, 'w-7 h-7')}
            </button>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#0066FF] dark:text-cyan-400">
                  {currentProject.reference}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  {currentProject.status === 'active' ? 'Actif' : currentProject.status}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                  Priorité {currentProject.priority}
                </span>
              </div>

              <h2 className="text-xl font-black text-slate-900 dark:text-white mt-1">
                {currentProject.name}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
                {currentProject.description}
              </p>
            </div>
          </div>

          {/* Boutons d'actions du projet (Partager, Exporter, Importer) */}
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenShareModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Partager</span>
            </button>
            <button
              onClick={onOpenExportModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exporter</span>
            </button>
            <button
              onClick={onOpenImportModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Importer</span>
            </button>
          </div>
        </div>

        {/* Méta-données & Barre d'avancement réelle */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div>
            <span className="text-slate-400 block text-[11px]">Responsable du projet</span>
            <span className="font-semibold text-slate-900 dark:text-white">
              {leadUser?.name || 'Non désigné'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Période cible</span>
            <span className="font-semibold text-slate-900 dark:text-white">
              {formatShortDateFrench(currentProject.startDate)} → {formatShortDateFrench(currentProject.dueDate)}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-xs">Avancement global</span>
            <span className="font-semibold text-[#0066FF] dark:text-cyan-400">
              {metrics.completionRate}% achevé
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-xs">Liaison GitHub</span>
            {currentProject.githubRepoUrl ? (
              <a
                href={currentProject.githubRepoUrl}
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-[#0066FF] dark:text-cyan-400 hover:underline flex items-center gap-1"
              >
                <span>Dépôt officiel</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            ) : (
              <span className="text-slate-400 italic">Aucun dépôt relié</span>
            )}
          </div>
        </div>
      </div>

      {/* 2. Onglets de la fiche projet (Section 32.1) */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setInternalTab('sheet')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition ${
            internalTab === 'sheet'
              ? 'bg-[#0066FF] text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Fiche projet</span>
        </button>
        <button
          onClick={() => setInternalTab('planning')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition ${
            internalTab === 'planning'
              ? 'bg-[#0066FF] text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Planning Gantt</span>
        </button>
        <button
          onClick={() => setInternalTab('tracking')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition ${
            internalTab === 'tracking'
              ? 'bg-[#0066FF] text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <BarChart2 className="w-4 h-4" />
          <span>Tableau de suivi</span>
        </button>
      </div>

      {/* 3. Contenu de l'onglet actif */}
      {internalTab === 'sheet' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Jalons de livraison (2 colonnes) */}
          <div className="lg:col-span-2 p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Jalons majeurs du projet
                </h3>
                <p className="text-xs text-slate-500">
                  Points de contrôle et dates d’évaluation de la livraison
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {projectMilestones.map(mls => (
                <div
                  key={mls.id}
                  className="flex items-start justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800"
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-xl mt-0.5 ${
                      mls.status === 'reached' 
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' 
                        : 'bg-blue-50 text-[#0066FF] dark:bg-blue-950/60 dark:text-cyan-400'
                    }`}>
                      <Flag className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        {mls.name}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {mls.description}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="block text-xs font-semibold text-slate-900 dark:text-white">
                      {formatShortDateFrench(mls.dueDate)}
                    </span>
                    <span className={`inline-block mt-0.5 px-2 py-0.5 text-xs font-bold rounded-full ${
                      mls.status === 'reached'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                    }`}>
                      {mls.status === 'reached' ? 'Atteint' : 'Planifié'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Intervenants & Documents associés */}
          <div className="space-y-6">
            {/* Équipe du projet */}
            <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Intervenants du projet ({currentProject.memberIds.length})
              </h3>
              <div className="space-y-2">
                {currentProject.memberIds.map(memId => {
                  const u = users.find(user => user.id === memId);
                  if (!u) return null;
                  return (
                    <div key={u.id} className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={u.avatar}
                        alt={u.name}
                        className="w-7 h-7 rounded-full object-cover"
                      />
                      <div className="min-w-0 flex-1 text-xs">
                        <span className="font-semibold text-slate-900 dark:text-white block truncate">
                          {u.name}
                        </span>
                        <span className="text-[10px] text-slate-400 block truncate">
                          {u.jobTitle}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Documents liés */}
            <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Documents & Spécifications ({projectDocs.length})
              </h3>
              <div className="space-y-2">
                {projectDocs.map(doc => (
                  <div key={doc.id} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs">
                    <span className="font-semibold text-slate-900 dark:text-white block truncate">
                      {doc.title}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      Rédigé par {doc.authorName}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {internalTab === 'planning' && (
        <GanttChart 
          onOpenTaskModal={onOpenTaskModal} 
          onOpenIconPicker={onOpenIconPicker} 
        />
      )}

      {internalTab === 'tracking' && (
        <TrackingBoard onOpenTaskModal={onOpenTaskModal} />
      )}
    </div>
  );
}
