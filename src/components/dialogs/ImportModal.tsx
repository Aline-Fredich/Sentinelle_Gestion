'use client';

import React, { useState } from 'react';
import { X, Upload, CheckCircle2, Info, FileSpreadsheet, Layers, CheckSquare, Sparkles } from 'lucide-react';
import { useSentinel } from '@/lib/store';
import { Task } from '@/types/sentinel';
import { parseExcelCsv, parseTrelloJson, parseAsanaCsv, parseNotionCsv, ExternalSourceType } from '@/lib/importers/externalImporters';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TEMPLATES: Record<ExternalSourceType, string> = {
  excel_csv: `Titre;Description;Statut;Priorite;Echeance;Heures
"Audit de sécurité TLS 1.3";"Vérification des certificats et des suites cryptographiques";"todo";"high";"2026-10-25";"8"
"Mise à jour des dépendances";"Audit npm et suppression des vulnérabilités";"in_progress";"urgent";"2026-10-18";"4"
"Documentation API Partenaires";"Rédaction des spécifications OpenAPI";"todo";"medium";"2026-11-02";"6"`,

  trello_json: `{"name":"Tableau Démo","lists":[{"id":"l1","name":"À faire"},{"id":"l2","name":"En cours"}],"cards":[{"name":"Tâche importée de Trello","desc":"Détail de la carte","idList":"l1","due":"2026-10-30T10:00:00Z","labels":[{"name":"Priorité Haute"}]}]}`,

  asana_csv: `Task ID,Created At,Completed At,Last Modified,Name,Section/Column,Assignee,Due Date,Tags,Notes,Projects
1,2026-10-01,,,Rédaction charte éditoriale,À faire,Thomas,2026-10-28,Contenu,Guide du ton et de la voix,SENTINEL GESTION`,

  notion_csv: `Name,Status,Date,Tags,Priority,Notes
Mise en place de l'onboarding,In Progress,2026-10-22,UX,High,Intégrer le sélecteur de mode`
};

export function ImportModal({ isOpen, onClose }: ImportModalProps) {
  const { importTasksFromCSV, activeProjectId, projects } = useSentinel();
  const [sourceType, setSourceType] = useState<ExternalSourceType>('excel_csv');
  const [rawText, setRawText] = useState(TEMPLATES.excel_csv);
  const [previewTasks, setPreviewTasks] = useState<Partial<Task>[]>([]);
  const [importReport, setImportReport] = useState<{ imported: number; errors: string[] } | null>(null);

  if (!isOpen) return null;

  const handleSourceChange = (newSource: ExternalSourceType) => {
    setSourceType(newSource);
    setRawText(TEMPLATES[newSource]);
    setPreviewTasks([]);
  };

  const handleGeneratePreview = () => {
    const targetProj = activeProjectId === 'all' ? (projects[0]?.id || 'prj-1') : activeProjectId;
    let res;
    if (sourceType === 'excel_csv') {
      res = parseExcelCsv(rawText, targetProj);
    } else if (sourceType === 'trello_json') {
      res = parseTrelloJson(rawText, targetProj);
    } else if (sourceType === 'asana_csv') {
      res = parseAsanaCsv(rawText, targetProj);
    } else {
      res = parseNotionCsv(rawText, targetProj);
    }

    if (res.success && res.tasks.length > 0) {
      setPreviewTasks(res.tasks);
    } else {
      alert(res.errors.join('\n') || 'Aucune tâche valide trouvée.');
    }
  };

  const handleExecuteImport = () => {
    if (previewTasks.length === 0) {
      handleGeneratePreview();
    }
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
                Centre d’Importation Multi-Sources
              </h3>
              <p className="text-xs text-slate-500">
                Importez vos données depuis Excel, Trello, Asana ou Notion
              </p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Fermer" className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
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
            {/* Sélecteur de source */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Format de la source d’origine
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'excel_csv', label: 'Excel / CSV', icon: FileSpreadsheet },
                  { id: 'trello_json', label: 'Trello JSON', icon: Layers },
                  { id: 'asana_csv', label: 'Asana CSV', icon: CheckSquare },
                  { id: 'notion_csv', label: 'Notion CSV', icon: Sparkles },
                ].map(src => {
                  const Icon = src.icon;
                  const isSelected = sourceType === src.id;
                  return (
                    <button
                      key={src.id}
                      type="button"
                      onClick={() => handleSourceChange(src.id as ExternalSourceType)}
                      className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center gap-1.5 ${
                        isSelected 
                          ? 'border-[#0066FF] bg-blue-50/70 dark:bg-blue-950/50 text-[#0066FF] font-bold ring-1 ring-[#0066FF]' 
                          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-[11px]">{src.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 text-blue-900 dark:text-blue-200 text-xs flex items-start gap-2">
              <Info className="w-4 h-4 text-[#0066FF] flex-shrink-0 mt-0.5" />
              <span>
                {sourceType === 'excel_csv' && 'Format : Titre;Description;Statut;Priorite;Echeance;Heures (virgule ou point-virgule acceptés).'}
                {sourceType === 'trello_json' && 'Collez le contenu du fichier exporté depuis Menu Trello > Plus > Imprimer et exporter > Exporter en JSON.'}
                {sourceType === 'asana_csv' && 'Collez le contenu de l’export CSV Asana généré depuis les options du projet.'}
                {sourceType === 'notion_csv' && 'Collez le contenu de l’export CSV de votre base de données de tâches Notion.'}
              </span>
            </div>

            {/* Saisie ou collage */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Contenu à importer
              </label>
              <textarea
                rows={5}
                value={rawText}
                onChange={(e) => {
                  setRawText(e.target.value);
                  setPreviewTasks([]);
                }}
                className="w-full p-3 font-mono text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>

            {/* Prévisualisation */}
            {previewTasks.length > 0 ? (
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Prévisualisation validée ({previewTasks.length} tâches prêtes à être créées)
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
                onClick={handleGeneratePreview}
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
                disabled={previewTasks.length === 0 && !rawText.trim()}
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
