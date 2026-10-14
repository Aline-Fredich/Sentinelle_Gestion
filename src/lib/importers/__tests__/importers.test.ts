import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseExcelCsv, parseTrelloJson } from '../externalImporters.ts';

describe('SENTINEL GESTION — Moteur d’Importation Multi-Sources (Phase 9)', () => {
  describe('1. Importateur Excel / CSV', () => {
    it('parse un CSV avec séparateur point-virgule et entêtes françaises', () => {
      const csv = `Titre;Description;Statut;Priorite;Echeance;Heures
"Audit de sécurité TLS 1.3";"Validation des clés";"in_progress";"high";"2026-10-25";"4"
"Mise à jour Next.js";"Passage à Next 16";"done";"urgent";"2026-10-18";"8"`;

      const res = parseExcelCsv(csv, 'prj-test');
      assert.equal(res.success, true);
      assert.equal(res.tasks.length, 2);
      assert.equal(res.tasks[0].title, 'Audit de sécurité TLS 1.3');
      assert.equal(res.tasks[0].status, 'in_progress');
      assert.equal(res.tasks[0].priority, 'high');
      assert.equal(res.tasks[0].estimateMinutes, 240); // 4h * 60
      assert.equal(res.tasks[1].status, 'done');
      assert.equal(res.tasks[1].priority, 'urgent');
      assert.equal(res.tasks[1].estimateMinutes, 480); // 8h * 60
    });

    it('gère les séparateurs virgules et l’échappement de guillemets', () => {
      const csv = `Title,Description,Status,Priority
"Tâche avec, virgule","Description ""complexe""",todo,low`;

      const res = parseExcelCsv(csv, 'prj-test');
      assert.equal(res.success, true);
      assert.equal(res.tasks.length, 1);
      assert.equal(res.tasks[0].title, 'Tâche avec, virgule');
      assert.equal(res.tasks[0].description, 'Description "complexe"');
      assert.equal(res.tasks[0].priority, 'low');
    });

    it('retourne une erreur claire si le fichier est vide', () => {
      const res = parseExcelCsv('', 'prj-test');
      assert.equal(res.success, false);
      assert.ok(res.errors.length > 0);
    });
  });

  describe('2. Importateur Trello JSON', () => {
    it('convertit les listes en phases et les cartes en tâches', () => {
      const trelloBoard = JSON.stringify({
        name: 'Mon Projet Trello',
        lists: [
          { id: 'l1', name: 'Sprint Backlog' },
          { id: 'l2', name: 'Terminé' }
        ],
        cards: [
          { name: 'Carte 1', desc: 'Détails carte 1', idList: 'l1', due: '2026-10-30T12:00:00Z', labels: [{ name: 'Sécurité' }] },
          { name: 'Carte 2', desc: 'Détails carte 2', idList: 'l2', closed: true }
        ]
      });

      const res = parseTrelloJson(trelloBoard, 'prj-trello');
      assert.equal(res.success, true);
      assert.equal(res.phases.length, 2);
      assert.equal(res.phases[0].name, 'Sprint Backlog');
      assert.equal(res.tasks.length, 2);
      assert.equal(res.tasks[0].title, 'Carte 1');
      assert.equal(res.tasks[0].dueDate, '2026-10-30');
      assert.equal(res.tasks[0].labels.includes('Sécurité'), true);
      assert.equal(res.tasks[1].status, 'done');
    });
  });
});
