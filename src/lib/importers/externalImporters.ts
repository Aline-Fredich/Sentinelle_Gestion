/**
 * SENTINEL GESTION — Moteur d'Importation Multi-Sources
 * Permet d'importer directement des projets et tâches depuis Excel, Trello, Asana et Notion.
 */

import type { Task, ProjectPhase, TaskStatus, TaskPriority } from '../../types/sentinel.ts';
import { generateId } from '../idUtils.ts';

export type ExternalSourceType = 'excel_csv' | 'trello_json' | 'asana_csv' | 'notion_csv';

export interface ImportResult {
  success: boolean;
  tasks: Task[];
  phases: ProjectPhase[];
  warnings: string[];
  errors: string[];
}

/**
 * Nettoie et normalise les valeurs de cellules CSV (guillemets, encodage).
 */
function cleanCsvValue(val: string): string {
  if (!val) return '';
  let cleaned = val.trim();
  if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
    cleaned = cleaned.slice(1, -1).replace(/""/g, '"');
  }
  return cleaned.trim();
}

/**
 * Convertit un statut texte libre en TaskStatus strict.
 */
function mapStatus(raw: string): TaskStatus {
  const s = raw.toLowerCase().trim();
  if (s.includes('done') || s.includes('termin') || s.includes('fini') || s.includes('complété')) return 'done';
  if (s.includes('review') || s.includes('revue') || s.includes('valid')) return 'in_review';
  if (s.includes('progress') || s.includes('cours') || s.includes('doing')) return 'in_progress';
  return 'todo';
}

/**
 * Convertit une priorité texte libre en TaskPriority stricte.
 */
function mapPriority(raw: string): TaskPriority {
  const p = raw.toLowerCase().trim();
  if (p.includes('urg') || p.includes('critique') || p === 'p1' || p.includes('haute')) return 'urgent';
  if (p.includes('haut') || p.includes('high') || p === 'p2') return 'high';
  if (p.includes('bas') || p.includes('low') || p === 'p4' || p.includes('faible')) return 'low';
  return 'medium';
}

/**
 * Découpe une ligne CSV en tenant compte des guillemets et du séparateur.
 */
function splitCsvLine(line: string, sep: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === sep && !inQuotes) {
      values.push(cleanCsvValue(current));
      current = '';
    } else {
      current += char;
    }
  }
  values.push(cleanCsvValue(current));
  return values;
}

/**
 * 1. Importateur Excel / CSV standardisé (détection automatique de séparateur virgule ou point-virgule)
 */
export function parseExcelCsv(content: string, projectId: string): ImportResult {
  const result: ImportResult = { success: false, tasks: [], phases: [], warnings: [], errors: [] };
  const lines = content.replace(/^\uFEFF/, '').split(/\r?\n/).filter(line => line.trim() !== '');
  
  if (lines.length < 2) {
    result.errors.push('Le fichier CSV est vide ou ne contient pas d’en-tête.');
    return result;
  }

  // Détection du séparateur
  const firstLine = lines[0];
  const separator = (firstLine.match(/;/g) || []).length > (firstLine.match(/,/g) || []).length ? ';' : ',';

  const headers = splitCsvLine(firstLine, separator).map(h => cleanCsvValue(h).toLowerCase());
  const titleIdx = headers.findIndex(h => h.includes('titre') || h.includes('title') || h.includes('tache') || h.includes('nom'));

  if (titleIdx === -1) {
    result.errors.push('Colonne de titre ou nom introuvable dans le fichier CSV.');
    return result;
  }

  const descIdx = headers.findIndex(h => h.includes('desc') || h.includes('detail') || h.includes('note'));
  const statusIdx = headers.findIndex(h => h.includes('statut') || h.includes('status') || h.includes('etat'));
  const priorityIdx = headers.findIndex(h => h.includes('priorit') || h.includes('priority'));
  const dueDateIdx = headers.findIndex(h => h.includes('echeance') || h.includes('due') || h.includes('date'));
  const estimateIdx = headers.findIndex(h => h.includes('est') || h.includes('temps') || h.includes('duree') || h.includes('heure') || h.includes('hour'));

  for (let i = 1; i < lines.length; i++) {
    const cols = splitCsvLine(lines[i], separator);
    const title = cols[titleIdx];
    if (!title) continue;

    const estimateVal = estimateIdx !== -1 ? parseFloat(cols[estimateIdx]) || 1 : 1;
    // Si l'estimation est inférieure à 10, on suppose des heures -> conversion en minutes
    const estimateMinutes = estimateVal <= 10 ? Math.round(estimateVal * 60) : Math.round(estimateVal);

    result.tasks.push({
      id: generateId('tsk'),
      workspaceId: 'ws-sentinel-01',
      projectId,
      title,
      description: descIdx !== -1 ? cols[descIdx] || '' : '',
      status: statusIdx !== -1 ? mapStatus(cols[statusIdx]) : 'todo',
      priority: priorityIdx !== -1 ? mapPriority(cols[priorityIdx]) : 'medium',
      dueDate: dueDateIdx !== -1 && cols[dueDateIdx].match(/^\d{4}-\d{2}-\d{2}$/) ? cols[dueDateIdx] : undefined,
      estimateMinutes,
      labels: ['Import Excel'],
      checklist: [],
      order: i - 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  result.success = result.tasks.length > 0;
  return result;
}

/**
 * 2. Importateur Trello (Export JSON complet de tableau)
 */
export function parseTrelloJson(jsonContent: string, projectId: string): ImportResult {
  const result: ImportResult = { success: false, tasks: [], phases: [], warnings: [], errors: [] };

  try {
    const board = JSON.parse(jsonContent);

    // Dictionnaires des listes Trello
    const listsMap = new Map<string, string>();
    if (Array.isArray(board.lists)) {
      board.lists.forEach((list: { id: string; name: string }, idx: number) => {
        listsMap.set(list.id, list.name);
        result.phases.push({
          id: generateId('ph'),
          projectId,
          name: list.name,
          description: `Liste importée de Trello (${list.name})`,
          order: idx,
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
        });
      });
    }

    if (Array.isArray(board.cards)) {
      board.cards.forEach((card: {
        name?: string;
        desc?: string;
        due?: string;
        closed?: boolean;
        idList?: string;
        labels?: Array<{ name?: string }>;
      }, idx: number) => {
        if (!card.name) return;

        const listName = card.idList ? listsMap.get(card.idList) || '' : '';
        const status = card.closed ? 'done' : mapStatus(listName);

        result.tasks.push({
          id: generateId('tsk'),
          workspaceId: 'ws-sentinel-01',
          projectId,
          title: card.name,
          description: card.desc || '',
          status,
          priority: 'medium',
          dueDate: card.due ? card.due.split('T')[0] : undefined,
          estimateMinutes: 60,
          labels: card.labels ? card.labels.map(l => l.name || '').filter(Boolean) : ['Trello'],
          checklist: [],
          order: idx,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      });
    }

    result.success = result.tasks.length > 0;
  } catch (err) {
    result.errors.push(`Format JSON Trello invalide: ${(err as Error).message}`);
  }

  return result;
}

/**
 * 3. Importateur Asana (Export CSV standard)
 */
export function parseAsanaCsv(content: string, projectId: string): ImportResult {
  return parseExcelCsv(content, projectId);
}

/**
 * 4. Importateur Notion (Export CSV de base de données de tâches)
 */
export function parseNotionCsv(content: string, projectId: string): ImportResult {
  return parseExcelCsv(content, projectId);
}
