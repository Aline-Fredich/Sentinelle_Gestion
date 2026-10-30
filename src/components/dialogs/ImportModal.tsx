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
      className="modal-overlay"
      onClick={onClose}
    >
      <div 
        className="modal max-w-xl w-full"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-[var(--line)] mb-4">
          <div className="flex items-center gap-2.5">
            <Upload className="w-5 h-5 text-[var(--red)]" />
            <div>
              <h3 id="import-modal-title" className="modal-title mb-0">
                CENTRE D’IMPORTATION MULTI-SOURCES
              </h3>
              <p className="text-xs text-[var(--white-70)]">
                Importez vos données depuis Excel, Trello, Asana ou Notion
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            aria-label="Fermer" 
            className="btn btn-ghost btn-icon btn-sm"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {importReport ? (
          <div className="py-6 text-center space-y-4">
            <CheckCircle2 className="w-12 h-12 text-white mx-auto border-2 border-[var(--red)] rounded-full p-2 bg-[var(--red-tint)]" />
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">
              {importReport.imported} TÂCHE(S) IMPORTÉE(S) AVEC SUCCÈS !
            </h4>
            {importReport.errors.length > 0 && (
              <div className="text-left p-3 rounded-[var(--r-xs)] bg-[var(--red-tint)] border border-[var(--red-soft)] text-xs space-y-1">
                <span className="font-bold text-[var(--red)] block uppercase tracking-wider">Avertissements ({importReport.errors.length}) :</span>
                {importReport.errors.map((err, i) => (
                  <p key={i} className="text-[var(--white-70)]">• {err}</p>
                ))}
              </div>
            )}
            <button
              onClick={onClose}
              className="btn btn-primary"
            >
              FERMER L’ASSISTANT
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Sélecteur de source */}
            <div className="form-group mb-0">
              <label className="form-label">
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
                      className={`p-2.5 rounded-[var(--r-xs)] border text-center transition flex flex-col items-center gap-1.5 ${
                        isSelected 
                          ? 'border-[var(--red)] bg-[var(--red-tint)] text-white shadow-[var(--glow-sm)]' 
                          : 'border-[var(--line)] bg-black text-[var(--white-70)] hover:border-[var(--line-strong)]'
                      }`}
                    >
                      <Icon className="w-4 h-4 text-[var(--red)]" />
                      <span className="text-[11px] font-bold uppercase tracking-wider">{src.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="alert flex items-start gap-2">
              <Info className="w-4 h-4 text-[var(--red)] flex-none mt-0.5" />
              <span className="text-xs text-[var(--white-70)]">
                {sourceType === 'excel_csv' && 'Format : Titre;Description;Statut;Priorite;Echeance;Heures (virgule ou point-virgule acceptés).'}
                {sourceType === 'trello_json' && 'Collez le contenu du fichier exporté depuis Menu Trello > Plus > Imprimer et exporter > Exporter en JSON.'}
                {sourceType === 'asana_csv' && 'Collez le contenu de l’export CSV Asana généré depuis les options du projet.'}
                {sourceType === 'notion_csv' && 'Collez le contenu de l’export CSV de votre base de données de tâches Notion.'}
              </span>
            </div>

            {/* Saisie ou collage */}
            <div className="form-group mb-0">
              <label className="form-label">
                Contenu brut à importer
              </label>
              <textarea
                rows={5}
                value={rawText}
                onChange={(e) => {
                  setRawText(e.target.value);
                  setPreviewTasks([]);
                }}
                className="form-textarea font-mono text-xs"
              />
            </div>

            {/* Prévisualisation */}
            {previewTasks.length > 0 ? (
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-white block">
                  Prévisualisation validée ({previewTasks.length} tâches prêtes)
                </span>
                <div className="max-h-44 overflow-y-auto border border-[var(--line)] rounded-[var(--r-xs)] divide-y divide-[var(--line)] text-xs">
                  {previewTasks.map((t, idx) => (
                    <div key={idx} className="p-2.5 flex items-center justify-between bg-black">
                      <div className="min-w-0 pr-2">
                        <span className="font-bold text-white block truncate">
                          {t.title}
                        </span>
                        <span className="text-[11px] text-[var(--white-45)] font-mono">
                          Échéance : {t.dueDate || 'Non définie'} • Priorité : {t.priority?.toUpperCase()}
                        </span>
                      </div>
                      <span className="badge text-[10px] uppercase font-mono">
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
                className="btn btn-secondary w-full"
              >
                GÉNÉRER LA PRÉVISUALISATION
              </button>
            )}

            <div className="modal-actions">
              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary"
              >
                ANNULER
              </button>
              <button
                type="button"
                onClick={handleExecuteImport}
                disabled={previewTasks.length === 0 && !rawText.trim()}
                className="btn btn-primary"
              >
                CONFIRMER L’IMPORTATION
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
