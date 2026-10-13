'use client';

import React, { useState } from 'react';
import { X, Upload, CheckCircle2, Info } from 'lucide-react';
import { useSentinel } from '@/lib/store';
import { Task, TaskPriority, TaskStatus } from '@/types/sentinel';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ImportModal({ isOpen, onClose }: ImportModalProps) {
  const { importTasksFromCSV } = useSentinel();
  const [csvText, setCsvText] = useState(
`Titre;Description;Statut;Priorite;Echeance;Heures
"Audit de robustesse du pare-feu";"Vérification des règles entrantes";"todo";"high";"2026-10-25";"8"
"Mise à jour des certificats TLS";"Renouvellement des clés et tests SSL";"in_progress";"urgent";"2026-10-18";"4"
"Documentation d’intégration API";"Rédaction du guide pour les partenaires";"todo";"medium";"2026-11-02";"6"`
  );

  const [previewTasks, setPreviewTasks] = useState<Partial<Task>[]>([]);
  const [importReport, setImportReport] = useState<{ imported: number; errors: string[] } | null>(null);

  if (!isOpen) return null;

  // Découpage robuste d'une ligne CSV respectant les guillemets
  const splitCsvLine = (line: string, sep: string): string[] => {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++; // Sauter le guillemet échappé
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === sep && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    return values;
  };

  const parseCsv = () => {
    const rawLines = csvText.trim().split(/\r?\n/).filter(l => l.trim().length > 0);
    if (rawLines.length < 2) return;

    const firstLine = rawLines[0];
    const sep = firstLine.includes(';') ? ';' : ',';

    const headerCols = splitCsvLine(firstLine, sep).map(h => 
      h.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9_]/g, '')
    );

    // Recherche d'index par nom de colonne
    const titleIdx = headerCols.findIndex(h => h.includes('titre') || h.includes('title') || h.includes('task'));
    const descIdx = headerCols.findIndex(h => h.includes('desc'));
    const statusIdx = headerCols.findIndex(h => h.includes('statut') || h.includes('status'));
    const priorityIdx = headerCols.findIndex(h => h.includes('priorit') || h.includes('priority'));
    const dueIdx = headerCols.findIndex(h => h.includes('echeance') || h.includes('due'));
    const startIdx = headerCols.findIndex(h => h.includes('debut') || h.includes('start'));
    const hoursIdx = headerCols.findIndex(h => h.includes('heure') || h.includes('hour') || h.includes('estimate'));

    const parsed: Partial<Task>[] = [];

    for (let i = 1; i < rawLines.length; i++) {
      const cols = splitCsvLine(rawLines[i], sep);
      if (cols.length === 0 || (cols.length === 1 && !cols[0])) continue;

      let title = '';
      let description = '';
      let status: TaskStatus = 'todo';
      let priority: TaskPriority = 'medium';
      let dueDate: string | undefined;
      let startDate: string | undefined;
      let estimateMinutes = 120;

      if (titleIdx >= 0) {
        title = cols[titleIdx] || '';
        description = descIdx >= 0 ? cols[descIdx] || '' : '';
        const rawStatus = (statusIdx >= 0 ? cols[statusIdx] : 'todo').toLowerCase();
        if (['todo', 'in_progress', 'in_review', 'done'].includes(rawStatus)) {
          status = rawStatus as TaskStatus;
        }
        const rawPriority = (priorityIdx >= 0 ? cols[priorityIdx] : 'medium').toLowerCase();
        if (['urgent', 'high', 'medium', 'low'].includes(rawPriority)) {
          priority = rawPriority as TaskPriority;
        }
        dueDate = dueIdx >= 0 && cols[dueIdx] ? cols[dueIdx] : undefined;
        startDate = startIdx >= 0 && cols[startIdx] ? cols[startIdx] : undefined;
        if (hoursIdx >= 0 && cols[hoursIdx]) {
          const parsedHours = parseFloat(cols[hoursIdx]);
          if (!isNaN(parsedHours) && parsedHours > 0) {
            estimateMinutes = Math.round(parsedHours * 60);
          }
        }
      } else {
        // Fallback positionnel : si 8 colonnes (avec ID en tête)
        const offset = cols.length >= 8 ? 1 : 0;
        title = cols[offset] || '';
        description = cols[offset + 1] || '';
        const rawStatus = (cols[offset + 2] || 'todo').toLowerCase();
        if (['todo', 'in_progress', 'in_review', 'done'].includes(rawStatus)) {
          status = rawStatus as TaskStatus;
        }
        const rawPriority = (cols[offset + 3] || 'medium').toLowerCase();
        if (['urgent', 'high', 'medium', 'low'].includes(rawPriority)) {
          priority = rawPriority as TaskPriority;
        }
        if (cols.length >= 8) {
          startDate = cols[offset + 4] || undefined;
          dueDate = cols[offset + 5] || undefined;
          const parsedH = parseFloat(cols[offset + 6]);
          if (!isNaN(parsedH) && parsedH > 0) estimateMinutes = Math.round(parsedH * 60);
        } else {
          dueDate = cols[offset + 4] || undefined;
          const parsedH = parseFloat(cols[offset + 5]);
          if (!isNaN(parsedH) && parsedH > 0) estimateMinutes = Math.round(parsedH * 60);
        }
      }

      if (title.trim()) {
        parsed.push({
          title: title.trim(),
          description,
          status,
          priority,
          startDate,
          dueDate,
          estimateMinutes,
        });
      }
    }

    setPreviewTasks(parsed);
  };

  const handleExecuteImport = () => {
    if (previewTasks.length === 0) parseCsv();
    const result = importTasksFromCSV(previewTasks);
    setImportReport(result);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="import-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in"
    >
      <div className="bg-white dark:bg-[#0F172A] rounded-2xl p-6 max-w-xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-[#0066FF]">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h3 id="import-modal-title" className="text-sm font-bold text-slate-900 dark:text-white">
                Assistant d’importation CSV
              </h3>
              <p className="text-xs text-slate-500">
                Prévisualisez et validez les tâches avant insertion en base
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {importReport ? (
          <div className="py-6 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              {importReport.imported} tâche(s) importée(s) avec succès !
            </h4>
            {importReport.errors.length > 0 && (
              <div className="text-left p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 text-xs space-y-1">
                <span className="font-bold block">Avertissements ({importReport.errors.length}) :</span>
                {importReport.errors.map((err, i) => (
                  <p key={i}>• {err}</p>
                ))}
              </div>
            )}
            <button
              onClick={onClose}
              className="mt-4 px-6 py-2 bg-[#0066FF] hover:bg-blue-600 text-white text-xs font-semibold rounded-xl"
            >
              Fermer l’assistant
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 text-blue-900 dark:text-blue-200 text-xs flex items-start gap-2">
              <Info className="w-4 h-4 text-[#0066FF] flex-shrink-0 mt-0.5" />
              <span>
                Format attendu : <code>Titre;Description;Statut;Priorite;Echeance;Heures</code>.<br />
                Compatible avec les exports de SENTINEL GESTION et tableurs (Excel, Calc).
              </span>
            </div>

            {/* Saisie ou collage CSV */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Données CSV (séparateur point-virgule ou virgule)
              </label>
              <textarea
                rows={5}
                value={csvText}
                onChange={(e) => {
                  setCsvText(e.target.value);
                  setPreviewTasks([]);
                }}
                className="w-full p-3 font-mono text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>

            {/* Prévisualisation */}
            {previewTasks.length > 0 ? (
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Prévisualisation validée ({previewTasks.length} lignes)
                </span>
                <div className="max-h-44 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {previewTasks.map((t, idx) => (
                    <div key={idx} className="p-2.5 flex items-center justify-between">
                      <div className="min-w-0 pr-2">
                        <span className="font-semibold text-slate-900 dark:text-white block truncate">
                          {t.title}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          Échéance : {t.dueDate || 'Non définie'} • Priorité : {t.priority}
                        </span>
                      </div>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {t.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={parseCsv}
                className="w-full py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl transition"
              >
                Générer la prévisualisation des lignes
              </button>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleExecuteImport}
                disabled={previewTasks.length === 0 && !csvText.trim()}
                className="px-5 py-2 text-xs font-bold text-white bg-[#0066FF] hover:bg-blue-600 rounded-xl shadow-md transition disabled:opacity-50"
              >
                Confirmer l’importation
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
