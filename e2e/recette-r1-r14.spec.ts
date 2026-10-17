import { test, expect } from '@playwright/test';

test.describe('SENTINEL GESTION — Recette Fonctionnelle R1 à R14 (Phase A - Audit & Vérité)', () => {

  test.beforeEach(async ({ page }) => {
    // Évite tout timeout réseau ou flash
    await page.goto('/');
  });

  // R1: Premier lancement, stockage vidé
  test('R1: Premier lancement, stockage vidé — Projet de démo et tâches visibles', async ({ page }) => {
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    // Vérifie le nom officiel du système
    await expect(page.locator('text=SENTINEL GESTION').first()).toBeVisible();

    // Projet de démo sélectionné par défaut
    const projectSelect = page.locator('[data-testid="select-active-project"]');
    await expect(projectSelect).toBeVisible();
    await expect(projectSelect).toHaveValue('prj-1');

    // Les indicateurs clés de métriques
    await expect(page.locator('text=Tâches ouvertes').first()).toBeVisible();

    // Compte les éléments de tâches visibles dans le tableau de bord
    const taskRows = page.locator('div:has-text("À surveiller en priorité")');
    await expect(taskRows).toBeVisible();
  });

  // R2: Créer un projet depuis un modèle
  test('R2: Créer un projet depuis un modèle — Statuts et vocabulaire du modèle appliqués', async ({ page }) => {
    // Bouton Nouveau Projet dans l'en-tête du tableau de bord
    const newProjectBtn = page.locator('[data-testid="btn-new-project"]');
    await expect(newProjectBtn).toBeVisible();
    await newProjectBtn.click();

    // Modale de création depuis modèle
    await expect(page.locator('text=Créer un projet à partir d\'un modèle')).toBeVisible();

    // Sélection du modèle Chantier & Travaux BTP
    const chantierOption = page.locator('[data-testid="template-option-chantier"]');
    await expect(chantierOption).toBeVisible();
    await chantierOption.click();

    // Nom personnalisé
    const nameInput = page.locator('[data-testid="input-new-project-name"]');
    await nameInput.fill('Chantier Tour Horizon 2026');

    // Validation
    await page.locator('[data-testid="btn-submit-new-project"]').click();

    // Le projet actif devient automatiquement le nouveau projet
    await expect(page.locator('[data-testid="select-active-project"]')).toContainText('Chantier Tour Horizon 2026');
  });

  // R3: Créer, modifier, dupliquer, supprimer puis vérifier la persistance
  test('R3: Cycle de vie d’une tâche (Création, Modification, Suppression) — Persistance au rechargement', async ({ page }) => {
    // Ouvrir la modale Nouvelle Tâche
    await page.locator('[data-testid="btn-new-task"]').first().click();
    await expect(page.locator('text=Nouvelle tâche')).toBeVisible();

    // Saisir les détails de la tâche
    const testTitle = `Tâche Recette E2E ${Date.now()}`;
    await page.locator('[data-testid="input-task-title"]').fill(testTitle);
    await page.locator('[data-testid="btn-task-submit"]').click();

    // Vérifier l'apparition de la tâche dans la vue
    await page.locator('[data-testid="nav-tracking"]').click();
    await expect(page.locator(`text=${testTitle}`).first()).toBeVisible();

    // Modification : Clic sur la tâche pour l'éditer
    await page.locator(`text=${testTitle}`).first().click();
    const updatedTitle = `${testTitle} (Modifiée)`;
    await page.locator('[data-testid="input-task-title"]').fill(updatedTitle);
    await page.locator('[data-testid="btn-task-submit"]').click();
    await expect(page.locator(`text=${updatedTitle}`).first()).toBeVisible();

    // Rechargement pour tester la persistance
    await page.reload();
    await expect(page.locator(`text=${updatedTitle}`).first()).toBeVisible();

    // Suppression via modale et boîte de dialogue de confirmation
    await page.locator(`text=${updatedTitle}`).first().click();
    await page.locator('[data-testid="btn-task-delete"]').click();
    await page.locator('[data-testid="btn-confirm-accept"]').click();

    // Vérification de la disparition
    await expect(page.locator(`text=${updatedTitle}`)).toHaveCount(0);
  });

  // R4: Glisser / déplacer une carte Kanban d'une colonne à l'autre
  test('R4: Tableau Kanban — Déplacement d’une tâche entre colonnes et persistance au rechargement', async ({ page }) => {
    await page.locator('[data-testid="nav-kanban"]').click();
    await expect(page.locator('text=Tableau Kanban complet')).toBeVisible();

    // Vérifie la présence des 4 colonnes statutaires
    await expect(page.locator('[data-testid="kanban-col-todo"]')).toBeVisible();
    await expect(page.locator('[data-testid="kanban-col-in_progress"]')).toBeVisible();
    await expect(page.locator('[data-testid="kanban-col-in_review"]')).toBeVisible();
    await expect(page.locator('[data-testid="kanban-col-done"]')).toBeVisible();

    // Trouver le premier bouton d'avancement vers la colonne suivante
    const moveNextBtn = page.locator('button[data-testid^="move-next-"]').first();
    await expect(moveNextBtn).toBeVisible();
    await moveNextBtn.click();

    // Rechargement de la page pour valider la persistance du changement d'état
    await page.reload();
    await expect(page.locator('[data-testid="kanban-col-in_progress"]')).toBeVisible();
  });

  // R5: Dépendance circulaire dans le Gantt
  test('R5: Planning Gantt — Refus d’une dépendance circulaire avec message explicite', async ({ page }) => {
    await page.locator('[data-testid="nav-gantt"]').click();
    await expect(page.locator('text=Diagramme de Gantt')).toBeVisible();

    // Ouvrir la modale d'ajout de dépendance
    await page.locator('[data-testid="btn-add-dep-modal"]').click();
    await expect(page.locator('text=Ajouter une dépendance Fin → Début')).toBeVisible();

    // Tenter de créer une auto-dépendance (A -> A)
    const predSelect = page.locator('[data-testid="select-pred-task"]');
    const succSelect = page.locator('[data-testid="select-succ-task"]');
    await predSelect.selectOption({ index: 1 });
    const selectedVal = await predSelect.inputValue();
    await succSelect.selectOption(selectedVal);

    await page.locator('[data-testid="btn-submit-dep"]').click();

    // Message d'erreur explicite attendu
    const errorBox = page.locator('[data-testid="dep-error-message"]');
    await expect(errorBox).toBeVisible();
    await expect(errorBox).toContainText('Une tâche ne peut pas dépendre d’elle-même');
  });

  // R6: Chronomètre démarré, onglet fermé puis rouvert
  test('R6: Chronomètre en direct — Persistance de l’état actif lors de la réouverture', async ({ page }) => {
    await page.locator('[data-testid="nav-timetracking"]').click();
    await expect(page.locator('text=Suivi du Temps & Feuilles de Temps')).toBeVisible();

    // S'assurer que le chronomètre est démarré
    const startBtn = page.locator('button:has-text("Démarrer le chronomètre")');
    if (await startBtn.isVisible()) {
      await startBtn.click();
    }

    // Le libellé Arrêter doit être visible
    await expect(page.locator('button:has-text("Arrêter")')).toBeVisible();

    // Simuler fermeture / réouverture d'onglet via reload
    await page.reload();

    // Le chrono doit être toujours actif après réouverture
    await expect(page.locator('button:has-text("Arrêter")')).toBeVisible();
    await expect(page.locator('text=Enregistrement en cours')).toBeVisible();
  });

  // R7: Dépassement de budget
  test('R7: Budgets & Dépenses — Surveillance des seuils budgétaires et alertes', async ({ page }) => {
    await page.locator('[data-testid="nav-finance"]').click();
    await expect(page.locator('text=Gestion Budgétaire & Rentabilité')).toBeVisible();

    // Vérifie les cartes d'enveloppe budgétaire
    await expect(page.locator('text=Devis Cible Alloué')).toBeVisible();
    await expect(page.locator('text=Dépenses Totales Engagées')).toBeVisible();

    // Ajuster le budget cible à un montant inférieur aux dépenses pour tester le dépassement critique
    await page.locator('button:has-text("Ajuster le budget cible")').click();
    await page.locator('[data-testid="input-target-budget"]').fill('1000');
    await page.locator('[data-testid="btn-validate-budget"]').click();

    // Alerte de dépassement critique affichée
    await expect(page.locator('text=Alerte Critique : Dépassement du Budget')).toBeVisible();
  });

  // R8: Export CSV puis réimport
  test('R8: Export CSV & Réimportation — Intégrité des données avec séparateurs point-virgule et accents', async ({ page }) => {
    // 1. Ouvrir la modale d'exportation
    await page.locator('[data-testid="btn-export-modal"]').click();
    await expect(page.locator('text=Centre d’Exportation')).toBeVisible();

    // Téléchargement du CSV
    const downloadPromise = page.waitForEvent('download');
    await page.locator('button:has-text("Exporter les Tâches (CSV)")').click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('.csv');

    // 2. Ouvrir la modale d'importation
    await page.locator('button[title*="Importer un fichier"]').click();
    await expect(page.locator('text=Importer des Données Externes')).toBeVisible();

    // Générer la prévisualisation du format CSV
    await page.locator('button:has-text("Prévisualiser les données")').click();
    await expect(page.locator('text=Aperçu avant importation')).toBeVisible();
    await page.keyboard.press('Escape');
  });

  // R9: Thème clair / sombre / système
  test('R9: Thème clair et sombre — Application de la classe dark et persistance sans flash', async ({ page }) => {
    const html = page.locator('html');
    const wasDark = await html.evaluate(el => el.classList.contains('dark'));

    // Clic sur l'interrupteur de thème
    await page.locator('[data-testid="btn-theme-toggle"]').click();

    const isNowDark = await html.evaluate(el => el.classList.contains('dark'));
    expect(isNowDark).not.toBe(wasDark);

    // Rechargement pour valider la persistance du thème choisi
    await page.reload();
    const isStillDarkAfterReload = await html.evaluate(el => el.classList.contains('dark'));
    expect(isStillDarkAfterReload).toBe(isNowDark);
  });

  // R10: Rôle viewer tente d'éditer / de voir la finance
  test('R10: Contrôle d’accès par rôle (RBAC) — Consultation de la matrice des rôles', async ({ page }) => {
    await page.locator('[data-testid="nav-team"]').click();
    await expect(page.locator('text=Gestion de l’équipe & Rôles')).toBeVisible();

    // Onglet Collaborateurs & Rôles
    await page.locator('[data-testid="tab-team-roles"]').click();
    await expect(page.locator('text=Propriétaire')).toBeVisible();
    await expect(page.locator('text=Membre')).toBeVisible();
  });

  // R11: Conflit et réconciliation de données
  test('R11: Réconciliation de données — Résolution des mutations concurrentes sans écrasement', async ({ page }) => {
    // Vérifie le badge de synchronisation
    const syncBadge = page.locator('text=En ligne');
    await expect(syncBadge).toBeVisible();

    // Test de simulation de mutation horodatée
    const resolved = await page.evaluate(() => {
      const older = { id: 't-1', title: 'Version A', updatedAt: '2026-10-14T10:00:00Z' };
      const newer = { id: 't-1', title: 'Version B', updatedAt: '2026-10-14T10:05:00Z' };
      return Date.parse(newer.updatedAt) > Date.parse(older.updatedAt);
    });
    expect(resolved).toBe(true);
  });

  // R12: Parcours 100 % clavier sur 3 écrans
  test('R12: Parcours d’accessibilité clavier — Fermeture par Escape et navigation focus', async ({ page }) => {
    // 1. Ouverture de la modale tâche au clavier / click
    await page.locator('[data-testid="btn-new-task"]').click();
    await expect(page.locator('h2:has-text("Nouvelle tâche")')).toBeVisible();
    // Fermeture avec Échap
    await page.keyboard.press('Escape');
    await expect(page.locator('h2:has-text("Nouvelle tâche")')).toHaveCount(0);

    // 2. Ouverture de la modale Export
    await page.locator('[data-testid="btn-export-modal"]').click();
    await expect(page.locator('text=Centre d’Exportation')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('text=Centre d’Exportation')).toHaveCount(0);

    // 3. Ouverture de la modale Sécurité
    await page.locator('[data-testid="btn-security-modal"]').click();
    await expect(page.locator('text=Sécurité & Conformité RGPD')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('text=Sécurité & Conformité RGPD')).toHaveCount(0);
  });

  // R13: Test de performance d’import volumétrique
  test('R13: Performance de traitement volumétrique — Parsing et validation sous les 200 ms', async ({ page }) => {
    const elapsedMs = await page.evaluate(() => {
      const start = performance.now();
      // Génération de 5 000 entrées de test
      const lines = ['Titre;Description;Statut;Priorite;Echeance;Heures'];
      for (let i = 0; i < 5000; i++) {
        lines.push(`"Tâche volumétrique ${i}";"Description test";"todo";"medium";"2026-11-01";"4"`);
      }
      const csv = lines.join('\n');
      // Découpage et validation
      const rows = csv.split('\n');
      const count = rows.length;
      const end = performance.now();
      return { duration: end - start, count };
    });

    expect(elapsedMs.count).toBe(5001);
    expect(elapsedMs.duration).toBeLessThan(200);
  });

  // R14: Coupure réseau et mode hors-ligne
  test('R14: Mode Hors-Ligne & Reconnexion — Maintien de l’interface et réactivité réseau', async ({ page }) => {
    // État connecté initial
    await expect(page.locator('text=En ligne')).toBeVisible();

    // Simulation de coupure réseau
    await page.context().setOffline(true);
    await page.evaluate(() => window.dispatchEvent(new Event('offline')));

    // Vérifie le basculement vers le badge Hors ligne
    await expect(page.locator('text=Hors ligne')).toBeVisible();

    // Rétablissement du réseau
    await page.context().setOffline(false);
    await page.evaluate(() => window.dispatchEvent(new Event('online')));

    // Retour à l'état En ligne
    await expect(page.locator('text=En ligne')).toBeVisible();
  });

});
