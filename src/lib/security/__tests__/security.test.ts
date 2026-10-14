import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  encryptSensitiveText,
  decryptSensitiveText,
  calculateSha256,
} from '../crypto.ts';
import {
  escapeHtml,
  stripHtml,
  sanitizeUrl,
  sanitizeInputString,
  sanitizeRichText,
} from '../sanitizer.ts';
import {
  createAuditEntry,
  verifyAuditTrailIntegrity,
  type AuditEntry,
  GENESIS_HASH,
} from '../auditTrail.ts';
import {
  hasPermission,
  createSession,
  isSessionValid,
  SESSION_CONFIG,
} from '../session.ts';
import {
  exportUserPersonalData,
  anonymizeUserData,
} from '../gdpr.ts';
import type { User, Task, TimeEntry, ActivityEvent } from '../../../types/sentinel.ts';

describe('SENTINEL GESTION — Module Sécurité & Conformité (Phase 10)', () => {
  describe('1. Cryptographie Web Crypto API (AES-GCM 256 bits & SHA-256)', () => {
    it('chiffre et déchiffre fidèlement un texte confidentiel avec la bonne clé', async () => {
      const secret = 'Budget prévisionnel confidentiel : 145 000 € HT — Négociation en cours';
      const passphrase = 'Clef-Secrète-Sentinel-Forte-2026!';

      const payload = await encryptSensitiveText(secret, passphrase);
      assert.ok(payload.cipherText.length > 0);
      assert.ok(payload.iv.length > 0);
      assert.ok(payload.salt.length > 0);

      const decrypted = await decryptSensitiveText(payload, passphrase);
      assert.equal(decrypted, secret);
    });

    it('rejette le déchiffrement si la clé secrète est erronée', async () => {
      const secret = 'Document stratégique top-secret';
      const payload = await encryptSensitiveText(secret, 'bonne-clef-1234');

      await assert.rejects(
        async () => {
          await decryptSensitiveText(payload, 'mauvaise-clef-9999');
        },
        /operation failed|tag mismatch|decrypt/i
      );
    });

    it('calcule une empreinte SHA-256 déterministe', async () => {
      const hash1 = await calculateSha256('sentinel-audit-test');
      const hash2 = await calculateSha256('sentinel-audit-test');
      assert.equal(hash1, hash2);
      assert.equal(hash1.length, 64);
    });
  });

  describe('2. Assainissement des Entrées & Prévention XSS', () => {
    it('échappe les balises et caractères spéciaux dangereux', () => {
      const dangerous = '<script>alert("XSS")</script>&"\'';
      const escaped = escapeHtml(dangerous);
      assert.ok(!escaped.includes('<script>'));
      assert.ok(escaped.includes('&lt;script&gt;'));
      assert.ok(escaped.includes('&amp;'));
      assert.ok(escaped.includes('&quot;'));
    });

    it('supprime toutes les balises HTML brutes', () => {
      const raw = '<p>Texte <strong>important</strong> avec <a href="#">lien</a></p>';
      assert.equal(stripHtml(raw), 'Texte important avec lien');
    });

    it('valide et neutralise les protocoles d’URL malveillants', () => {
      assert.equal(sanitizeUrl('javascript:alert(document.cookie)'), '');
      assert.equal(sanitizeUrl('data:text/html,<script>evil()</script>'), '');
      assert.equal(sanitizeUrl('https://sentinel.gestion.fr/projets'), 'https://sentinel.gestion.fr/projets');
      assert.equal(sanitizeUrl('/projets/prj-01'), '/projets/prj-01');
    });

    it('neutralise les vecteurs XSS inline dans le texte enrichi', () => {
      const payload = '<p>Rapport normal</p><img src="x" onerror="alert(1)" /><script>evil()</script>';
      const cleaned = sanitizeRichText(payload);
      assert.ok(!cleaned.includes('<script>'));
      assert.ok(!cleaned.includes('onerror'));
      assert.ok(cleaned.includes('Rapport normal'));
    });
  });

  describe('3. Journal d’Audit Infalsifiable (Chaîne Cryptographique)', () => {
    it('construit une chaîne liée où chaque bloc référence le hachage du précédent', async () => {
      const trail: AuditEntry[] = [];

      const b1 = await createAuditEntry({
        userId: 'u-1',
        userName: 'Alexandre Martin',
        action: 'user_login',
        entityType: 'user',
        entityId: 'u-1',
      }, trail);
      trail.push(b1);

      assert.equal(b1.previousHash, GENESIS_HASH);

      const b2 = await createAuditEntry({
        userId: 'u-1',
        userName: 'Alexandre Martin',
        action: 'project_created',
        entityType: 'project',
        entityId: 'prj-101',
      }, trail);
      trail.push(b2);

      assert.equal(b2.previousHash, b1.hash);

      const verification = await verifyAuditTrailIntegrity(trail);
      assert.equal(verification.isValid, true);
      assert.equal(verification.totalEntries, 2);
    });

    it('détecte immédiatement toute altération malveillante rétroactive', async () => {
      const trail: AuditEntry[] = [];
      const b1 = await createAuditEntry({
        userId: 'u-1',
        userName: 'Alexandre Martin',
        action: 'budget_updated',
        entityType: 'budget',
        entityId: 'b-1',
        details: { amount: 50000 },
      }, trail);
      trail.push(b1);

      const b2 = await createAuditEntry({
        userId: 'u-1',
        userName: 'Alexandre Martin',
        action: 'task_created',
        entityType: 'task',
        entityId: 'tsk-1',
      }, trail);
      trail.push(b2);

      // Falsification malveillante du montant dans b1 sans recalcul
      (b1.details as { amount: number }).amount = 999999;

      const verification = await verifyAuditTrailIntegrity(trail);
      assert.equal(verification.isValid, false);
      assert.equal(verification.brokenIndex, 0);
      assert.ok(verification.reason?.includes('Altération détectée'));
    });
  });

  describe('4. RBAC & Gestion des Sessions', () => {
    it('respecte strictement la matrice de droits par rôle', () => {
      assert.equal(hasPermission('owner', 'workspace:manage'), true);
      assert.equal(hasPermission('admin', 'project:delete'), true);
      assert.equal(hasPermission('project_manager', 'budget:edit'), true);
      assert.equal(hasPermission('project_manager', 'project:delete'), false);
      assert.equal(hasPermission('member', 'task:create'), true);
      assert.equal(hasPermission('member', 'budget:edit'), false);
      assert.equal(hasPermission('viewer', 'task:create'), false);
      assert.equal(hasPermission('viewer', 'gdpr:export'), true);
    });

    it('invalide une session expirée ou inactive', () => {
      const validSession = createSession('u-1', 'admin');
      assert.equal(isSessionValid(validSession), true);

      // Session inactive depuis plus de 8 heures
      const inactiveSession = {
        ...validSession,
        lastActivityAt: Date.now() - (SESSION_CONFIG.INACTIVITY_TIMEOUT_MS + 1000),
      };
      assert.equal(isSessionValid(inactiveSession), false);

      // Session avec jeton absolu expiré
      const expiredSession = {
        ...validSession,
        expiresAt: Date.now() - 1000,
      };
      assert.equal(isSessionValid(expiredSession), false);
    });
  });

  describe('5. Conformité RGPD (Portabilité & Droit à l’Oubli)', () => {
    const mockUsers: User[] = [
      {
        id: 'u-rgpd',
        name: 'Jean Dupont',
        email: 'jean.dupont@entreprise.fr',
        role: 'member',
        avatar: '',
        jobTitle: 'Consultant',
        weeklyCapacityMinutes: 2100,
        hourlyRate: 70,
      },
    ];

    const mockTasks: Task[] = [
      {
        id: 't-1',
        workspaceId: 'ws-1',
        projectId: 'prj-1',
        title: 'Tâche Jean',
        description: '',
        status: 'in_progress',
        priority: 'high',
        assigneeId: 'u-rgpd',
        estimateMinutes: 120,
        labels: [],
        checklist: [],
        order: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    const mockTimeEntries: TimeEntry[] = [
      {
        id: 'time-1',
        projectId: 'prj-1',
        taskId: 't-1',
        userId: 'u-rgpd',
        userName: 'Jean Dupont',
        durationMinutes: 180,
        date: '2026-10-10',
        description: 'Session de dev',
        createdAt: new Date().toISOString(),
      },
    ];

    const mockActivities: ActivityEvent[] = [
      {
        id: 'act-1',
        workspaceId: 'ws-1',
        userId: 'u-rgpd',
        userName: 'Jean Dupont',
        userAvatar: '',
        actionType: 'task_created',
        description: 'A créé la tâche',
        createdAt: new Date().toISOString(),
      },
    ];

    it('exporte les données au format JSON conforme à l’Article 20', () => {
      const exported = exportUserPersonalData('u-rgpd', {
        users: mockUsers,
        tasks: mockTasks,
        timeEntries: mockTimeEntries,
        activities: mockActivities,
      });

      assert.ok(exported !== null);
      assert.equal(exported.userProfile.name, 'Jean Dupont');
      assert.equal(exported.assignedTasks.length, 1);
      assert.equal(exported.timeLogs.length, 1);
      assert.equal(exported.metadata.rgpdArticle, 'Article 20 — Droit à la portabilité des données');
    });

    it('anonymise de façon irréversible l’identité selon l’Article 17', () => {
      const { updatedUsers, anonymizationResult } = anonymizeUserData('u-rgpd', {
        users: mockUsers,
        tasks: mockTasks,
        timeEntries: mockTimeEntries,
      });

      assert.equal(anonymizationResult.success, true);
      assert.equal(anonymizationResult.affectedTasksCount, 1);
      assert.equal(anonymizationResult.affectedTimeLogsCount, 1);

      const anonymizedUser = updatedUsers.find(u => u.id === 'u-rgpd');
      assert.ok(anonymizedUser !== undefined);
      assert.ok(anonymizedUser.name.startsWith('Collaborateur Anonymisé'));
      assert.ok(anonymizedUser.email.endsWith('@rgpd.sentinel.local'));
      assert.equal(anonymizedUser.hourlyRate, undefined);
    });
  });
});
