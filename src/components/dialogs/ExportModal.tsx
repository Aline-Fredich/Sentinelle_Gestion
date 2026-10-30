'use client';

import React, { useState } from 'react';
import { X, Download, FileSpreadsheet, FileCode, Printer, CheckCircle2, Clock, DollarSign } from 'lucide-react';
import { useSentinel } from '@/lib/store';
import { useTheme } from '@/context/ThemeContext';

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
  const { themeData } = useTheme();
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
      `"${workspace.currency || 'FCFA'}"`,
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
      urgent: 'Critique / Urgente',
      high: 'Haute',
      medium: 'Moyenne',
      low: 'Faible',
    };

    const rowsHtml = filteredTasks.map(t => `
      <tr>
        <td style="padding: 10px 14px; border-bottom: 1px solid #242424; font-family: 'JetBrains Mono', monospace; font-size: 11px;">${t.id}</td>
        <td style="padding: 10px 14px; border-bottom: 1px solid #242424; font-weight: 600;">${t.title}</td>
        <td style="padding: 10px 14px; border-bottom: 1px solid #242424; text-align: center;">${statusLabels[t.status] || t.status}</td>
        <td style="padding: 10px 14px; border-bottom: 1px solid #242424; text-align: center;">${priorityLabels[t.priority] || t.priority}</td>
        <td style="padding: 10px 14px; border-bottom: 1px solid #242424; text-align: center; font-family: 'JetBrains Mono', monospace;">${t.dueDate || '-'}</td>
        <td style="padding: 10px 14px; border-bottom: 1px solid #242424; text-align: right; font-family: 'JetBrains Mono', monospace; font-weight: 700;">${Math.round((t.estimateMinutes || 0) / 60)} h</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="utf-8">
        <title>Rapport - ${currentProject?.name || workspace.name}</title>
        <style>
          @page { size: A4; margin: 14mm; }
          body { font-family: 'Chakra Petch', system-ui, sans-serif; padding: 24px; color: #000; background: #FFF; }
          h1 { font-size: 18px; font-weight: 800; margin-bottom: 4px; text-transform: uppercase; }
          .header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 24px; border-bottom: 2px solid ${themeData.colors.primary}; padding-bottom: 12px; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          th { text-align: center; padding: 10px 14px; background: ${themeData.colors.primary} !important; color: #FFFFFF !important; text-transform: uppercase; font-size: 10px; letter-spacing: 0.06em; font-weight: 700; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          th:first-child { text-align: left; }
          th:last-child { text-align: right; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1>SENTINEL GESTION — ${currentProject?.name || workspace.name}</h1>
            <p style="margin: 0; font-size: 11px; color: #444; font-family: 'JetBrains Mono', monospace;">Généré le ${new Date().toLocaleDateString('fr-FR')}</p>
          </div>
          <div style="text-align: right; font-size: 11px; font-family: 'JetBrains Mono', monospace;">
            <strong>${filteredTasks.length} TÂCHE(S)</strong>
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
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal max-w-lg w-full"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between pb-3 border-b border-[var(--line)] mb-4">
          <div className="flex items-center gap-2.5">
            <Download className="w-5 h-5 text-[var(--red)]" />
            <div>
              <h3 className="modal-title mb-0">
                EXPORTER & SAUVEGARDER
              </h3>
              <p className="text-xs text-[var(--white-70)]">
                Centre d’Exportation — Formats compatibles Excel, PDF et sauvegarde complète
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="btn btn-ghost btn-icon btn-sm"
            aria-label="Fermer la modale"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {downloadSuccess ? (
          <div className="py-8 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-white mx-auto border-2 border-[var(--red)] rounded-full p-2 bg-[var(--red-tint)]" />
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">
              {exportMessage}
            </h4>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-[var(--white-70)] uppercase tracking-wider font-bold">
              Sélectionnez le format d’export souhaité :
            </p>

            {/* CSV Tâches */}
            <button
              onClick={handleExportTasksCSV}
              className="flex items-center gap-3 w-full p-3 rounded-[var(--r-sm)] bg-black border border-[var(--line)] hover:border-[var(--red-soft)] hover:bg-[var(--red-tint)] text-left transition group"
            >
              <div className="p-2 rounded-[var(--r-xs)] border border-[var(--red-soft)] text-[var(--red)] flex-none">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <span className="block text-xs font-bold text-white uppercase tracking-wider">
                  Exporter les Tâches (CSV) — Excel ({filteredTasks.length} tâches)
                </span>
                <span className="block text-[11px] text-[var(--white-45)]">
                  Format standard UTF-8 séparateur point-virgule
                </span>
              </div>
            </button>

            {/* CSV Pointages */}
            <button
              onClick={handleExportTimesheetCSV}
              className="flex items-center gap-3 w-full p-3 rounded-[var(--r-sm)] bg-black border border-[var(--line)] hover:border-[var(--red-soft)] hover:bg-[var(--red-tint)] text-left transition group"
            >
              <div className="p-2 rounded-[var(--r-xs)] border border-[var(--red-soft)] text-[var(--red)] flex-none">
                <Clock className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <span className="block text-xs font-bold text-white uppercase tracking-wider">
                  Feuilles de temps — CSV ({timeEntries.length} sessions)
                </span>
                <span className="block text-[11px] text-[var(--white-45)]">
                  Détail des heures pointées par collaborateur
                </span>
              </div>
            </button>

            {/* CSV Finances */}
            <button
              onClick={handleExportExpensesCSV}
              className="flex items-center gap-3 w-full p-3 rounded-[var(--r-sm)] bg-black border border-[var(--line)] hover:border-[var(--red-soft)] hover:bg-[var(--red-tint)] text-left transition group"
            >
              <div className="p-2 rounded-[var(--r-xs)] border border-[var(--red-soft)] text-[var(--red)] flex-none">
                <DollarSign className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <span className="block text-xs font-bold text-white uppercase tracking-wider">
                  Dépenses & Budget — CSV ({expenses.length} dépenses)
                </span>
                <span className="block text-[11px] text-[var(--white-45)]">
                  Imputations directes, catégories et règlements
                </span>
              </div>
            </button>

            {/* Rapport imprimable */}
            <button
              onClick={handleExportPrintPDF}
              className="flex items-center gap-3 w-full p-3 rounded-[var(--r-sm)] bg-black border border-[var(--line)] hover:border-[var(--red-soft)] hover:bg-[var(--red-tint)] text-left transition group"
            >
              <div className="p-2 rounded-[var(--r-xs)] border border-[var(--red-soft)] text-[var(--red)] flex-none">
                <Printer className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <span className="block text-xs font-bold text-white uppercase tracking-wider">
                  Rapport imprimable / Export PDF
                </span>
                <span className="block text-[11px] text-[var(--white-45)]">
                  Mise en page épurée conforme Section 13 (en-tête rouge plein)
                </span>
              </div>
            </button>

            {/* Sauvegarde JSON */}
            <button
              onClick={handleExportFullJSON}
              className="flex items-center gap-3 w-full p-3 rounded-[var(--r-sm)] bg-black border border-[var(--red-soft)] hover:border-[var(--red)] hover:bg-[var(--red-tint)] text-left transition group"
            >
              <div className="p-2 rounded-[var(--r-xs)] border border-[var(--red)] text-[var(--red)] flex-none">
                <FileCode className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <span className="block text-xs font-bold text-white uppercase tracking-wider">
                  Sauvegarde intégrale JSON (Toutes entités)
                </span>
                <span className="block text-[11px] text-[var(--white-45)]">
                  Sauvegarde complète : Projets, Tâches, Finances, Sprints, Risques
                </span>
              </div>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
