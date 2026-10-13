'use client';

import React, { useState } from 'react';
import { X, Download, FileSpreadsheet, FileCode, Printer, CheckCircle2, Clock, DollarSign } from 'lucide-react';
import { useSentinel } from '@/lib/store';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ExportModal({ isOpen, onClose }: ExportModalProps) {
  const { 
    filteredTasks, currentProject, workspace,
    projects, phases, tasks, dependencies, milestones,
    expenses, budgets, timeEntries, sprints, wikiPages, risks, users
  } = useSentinel();
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [exportMessage, setExportMessage] = useState('Export téléchargé avec succès !');

  if (!isOpen) return null;

  const triggerDownload = (content: string, filename: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setDownloadSuccess(true);
    setTimeout(() => {
      setDownloadSuccess(false);
      onClose();
    }, 1500);
  };

  const handleExportTasksCSV = () => {
    setExportMessage('Tableau des tâches exporté en CSV !');
    const headers = ['ID', 'Titre', 'Description', 'Statut', 'Priorite', 'Date_Debut', 'Echeance', 'Heures_Estimees'];
    const rows = filteredTasks.map(t => [
      `"${t.id}"`,
      `"${t.title.replace(/"/g, '""')}"`,
      `"${(t.description || '').replace(/"/g, '""')}"`,
      `"${t.status}"`,
      `"${t.priority}"`,
      `"${t.startDate || ''}"`,
      `"${t.dueDate || ''}"`,
      `"${(t.estimateMinutes || 0) / 60}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    triggerDownload(csvContent, `sentinel_taches_${currentProject ? currentProject.reference : 'export'}.csv`, 'text/csv;charset=utf-8;');
  };

  const handleExportTimesheetCSV = () => {
    setExportMessage('Feuilles de temps exportées en CSV !');
    const headers = ['ID', 'Collaborateur', 'Tache_ID', 'Description', 'Heures', 'Date', 'Taux_Horaire'];
    const rows = timeEntries.map(e => [
      `"${e.id}"`,
      `"${e.userName.replace(/"/g, '""')}"`,
      `"${e.taskId || ''}"`,
      `"${e.description.replace(/"/g, '""')}"`,
      `"${(e.durationMinutes / 60).toFixed(2)}"`,
      `"${e.date}"`,
      `"${e.hourlyRate || workspace.defaultHourlyRate || 75}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    triggerDownload(csvContent, `sentinel_feuilles_de_temps_${Date.now()}.csv`, 'text/csv;charset=utf-8;');
  };

  const handleExportExpensesCSV = () => {
    setExportMessage('Dépenses et budget exportés en CSV !');
    const headers = ['ID', 'Projet_ID', 'Intitule', 'Categorie', 'Montant', 'Devise', 'Statut', 'Date', 'Auteur'];
    const rows = expenses.map(e => [
      `"${e.id}"`,
      `"${e.projectId}"`,
      `"${e.title.replace(/"/g, '""')}"`,
      `"${e.category}"`,
      `"${e.amount}"`,
      `"${workspace.currency || '€'}"`,
      `"${e.status}"`,
      `"${e.date}"`,
      `"${e.createdBy}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    triggerDownload(csvContent, `sentinel_depenses_finances_${Date.now()}.csv`, 'text/csv;charset=utf-8;');
  };

  const handleExportFullJSON = () => {
    setExportMessage('Sauvegarde complète du système exportée en JSON !');
    const backupData = {
      meta: {
        platform: 'SENTINEL GESTION',
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
      },
      workspace,
      currentProject,
      projects,
      phases,
      tasks,
      dependencies,
      milestones,
      expenses,
      budgets,
      timeEntries,
      sprints,
      wikiPages,
      risks,
      users,
    };

    const content = JSON.stringify(backupData, null, 2);
    triggerDownload(content, `sentinel_sauvegarde_complete_${Date.now()}.json`, 'application/json;charset=utf-8;');
  };

  const handleExportPrintPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const statusLabels: Record<string, string> = {
      todo: 'À faire',
      in_progress: 'En cours',
      in_review: 'En revue',
      done: 'Terminé',
    };

    const priorityLabels: Record<string, string> = {
      urgent: 'Urgente',
      high: 'Haute',
      medium: 'Moyenne',
      low: 'Basse',
    };

    const rowsHtml = filteredTasks.map(t => `
      <tr>
        <td style="padding: 8px 12px; border-bottom: 1px solid #E2E8F0; font-family: monospace; font-size: 11px;">${t.id}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #E2E8F0; font-weight: 600;">${t.title}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #E2E8F0;">${statusLabels[t.status] || t.status}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #E2E8F0;">${priorityLabels[t.priority] || t.priority}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #E2E8F0;">${t.dueDate || '-'}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #E2E8F0; text-align: right;">${Math.round((t.estimateMinutes || 0) / 60)} h</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="utf-8">
        <title>Rapport - ${currentProject?.name || workspace.name}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 32px; color: #0F172A; }
          h1 { font-size: 20px; font-weight: 800; margin-bottom: 4px; }
          .header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 24px; border-bottom: 2px solid #0066FF; padding-bottom: 16px; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          th { text-align: left; padding: 8px 12px; background: #F8FAFC; border-bottom: 2px solid #CBD5E1; color: #475569; text-transform: uppercase; font-size: 10px; letter-spacing: 0.05em; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1>SENTINEL GESTION — ${currentProject?.name || workspace.name}</h1>
            <p style="margin: 0; font-size: 12px; color: #64748B;">Généré le ${new Date().toLocaleDateString('fr-FR')}</p>
          </div>
          <div style="text-align: right; font-size: 12px; color: #64748B;">
            <strong>${filteredTasks.length} tâche(s)</strong>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Titre de la tâche</th>
              <th>Statut</th>
              <th>Priorité</th>
              <th>Échéance</th>
              <th style="text-align: right;">Estimé</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-[#0F172A] rounded-2xl p-6 max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-[#0066FF]">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Exporter & Sauvegarder
              </h3>
              <p className="text-xs text-slate-500">
                Formats compatibles Excel, PDF et sauvegarde complète
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {downloadSuccess ? (
          <div className="py-8 text-center space-y-2">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              {exportMessage}
            </h4>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Sélectionnez le format d’export souhaité pour vos données :
            </p>

            {/* CSV Tâches */}
            <button
              onClick={handleExportTasksCSV}
              className="flex items-center gap-3 w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-[#0066FF] hover:bg-blue-50/30 dark:hover:bg-blue-950/20 text-left transition group"
            >
              <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <span className="block text-xs font-bold text-slate-900 dark:text-white group-hover:text-[#0066FF]">
                  Tâches — CSV Excel ({filteredTasks.length} tâches)
                </span>
                <span className="block text-[11px] text-slate-400">
                  Format standard UTF-8 séparateur point-virgule
                </span>
              </div>
            </button>

            {/* CSV Pointages */}
            <button
              onClick={handleExportTimesheetCSV}
              className="flex items-center gap-3 w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-[#0066FF] hover:bg-blue-50/30 dark:hover:bg-blue-950/20 text-left transition group"
            >
              <div className="p-2 rounded-lg bg-cyan-100 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300">
                <Clock className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <span className="block text-xs font-bold text-slate-900 dark:text-white group-hover:text-[#0066FF]">
                  Feuilles de temps — CSV ({timeEntries.length} sessions)
                </span>
                <span className="block text-[11px] text-slate-400">
                  Détail des heures pointées par collaborateur
                </span>
              </div>
            </button>

            {/* CSV Finances */}
            <button
              onClick={handleExportExpensesCSV}
              className="flex items-center gap-3 w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-[#0066FF] hover:bg-blue-50/30 dark:hover:bg-blue-950/20 text-left transition group"
            >
              <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
                <DollarSign className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <span className="block text-xs font-bold text-slate-900 dark:text-white group-hover:text-[#0066FF]">
                  Dépenses & Budget — CSV ({expenses.length} dépenses)
                </span>
                <span className="block text-[11px] text-slate-400">
                  Imputations directes, catégories et règlements
                </span>
              </div>
            </button>

            {/* Rapport imprimable */}
            <button
              onClick={handleExportPrintPDF}
              className="flex items-center gap-3 w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-[#0066FF] hover:bg-blue-50/30 dark:hover:bg-blue-950/20 text-left transition group"
            >
              <div className="p-2 rounded-lg bg-rose-100 dark:bg-rose-950/60 text-[#FF1E27]">
                <Printer className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <span className="block text-xs font-bold text-slate-900 dark:text-white group-hover:text-[#0066FF]">
                  Rapport imprimable / Export PDF
                </span>
                <span className="block text-[11px] text-slate-400">
                  Mise en page épurée prête pour impression immédiate
                </span>
              </div>
            </button>

            {/* Sauvegarde JSON */}
            <button
              onClick={handleExportFullJSON}
              className="flex items-center gap-3 w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-[#0066FF] hover:bg-blue-50/30 dark:hover:bg-blue-950/20 text-left transition group bg-slate-50/50 dark:bg-slate-900/40"
            >
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-[#0066FF]">
                <FileCode className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <span className="block text-xs font-bold text-slate-900 dark:text-white group-hover:text-[#0066FF]">
                  Sauvegarde intégrale JSON (Toutes entités)
                </span>
                <span className="block text-[11px] text-slate-400">
                  Sauvegarde complète : Projets, Tâches, Finances, Wikis, Sprints, Risques
                </span>
              </div>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
