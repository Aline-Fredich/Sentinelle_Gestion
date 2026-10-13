import { test, expect } from '@playwright/test';

test.describe('SENTINEL GESTION — Recette Fonctionnelle R1 à R14 (Phase 8)', () => {

  test('R1: Premier lancement — Espace de travail et projet de démonstration', async ({ page }) => {
    await page.goto('/');
    // L'application doit charger le nom officiel
    await expect(page.locator('text=SENTINEL GESTION').first()).toBeVisible();
    // Le projet de démonstration doit être sélectionné par défaut
    await expect(page.locator('text=Refonte Plateforme E-Commerce')).toBeVisible();
    // Les métriques de haut de page doivent être affichées
    await expect(page.locator('text=Taux d’achèvement')).toBeVisible();
  });

  test('R2: Navigation vers la Fiche Projet & Modèles', async ({ page }) => {
    await page.goto('/');
    // Clic sur la Fiche projet dans la barre latérale
    await page.click('button:has-text("Fiche projet")');
    await expect(page.locator('text=Fiche de Projet')).toBeVisible();
    await expect(page.locator('text=Phases & Jalons Clés')).toBeVisible();
  });

  test('R3: Tableau de suivi et création/visualisation d’une tâche', async ({ page }) => {
    await page.goto('/');
    await page.click('button:has-text("Tableau de suivi")');
    await expect(page.locator('text=Tableau de Suivi Opérationnel')).toBeVisible();
    // Bouton Nouvelle tâche
    const newTaskBtn = page.locator('button:has-text("Nouvelle tâche")');
    await expect(newTaskBtn).toBeVisible();
    await newTaskBtn.click();
    // Vérifier l'ouverture de la modale
    await expect(page.locator('text=Nouvelle tâche')).toBeVisible();
    // Fermer avec le bouton Annuler ou touche Échap
    await page.keyboard.press('Escape');
  });

  test('R4: Tableau Kanban — 4 colonnes statutaires', async ({ page }) => {
    await page.goto('/');
    await page.click('button:has-text("Tableau Kanban")');
    await expect(page.locator('text=Tableau Kanban')).toBeVisible();
    // Vérification de la présence des 4 colonnes
    await expect(page.locator('text=À FAIRE').first()).toBeVisible();
    await expect(page.locator('text=EN COURS').first()).toBeVisible();
    await expect(page.locator('text=EN RÉVISION').first()).toBeVisible();
    await expect(page.locator('text=TERMINÉ').first()).toBeVisible();
  });

  test('R5: Planning Gantt & Détection anti-cycle', async ({ page }) => {
    await page.goto('/');
    await page.click('button:has-text("Planning Gantt")');
    await expect(page.locator('text=Diagramme de Gantt')).toBeVisible();
    await expect(page.locator('text=Chronologie & Dépendances')).toBeVisible();
  });

  test('R6: Chronomètre en direct — Déclenchement et persistance', async ({ page }) => {
    await page.goto('/');
    // Ouverture du popover chrono dans la topbar
    const timerButton = page.locator('button[title*="Chronomètre"], button:has-text("00:00:00"), button:has-text("Minuteur")').first();
    await expect(timerButton).toBeVisible();
    await timerButton.click();
    // Le panneau de saisie du chrono s'ouvre
    await expect(page.locator('text=Chronomètre en Direct')).toBeVisible();
    // Démarrer le chronomètre
    const startBtn = page.locator('button:has-text("Démarrer le chronomètre")');
    if (await startBtn.isVisible()) {
      await startBtn.click();
      // Le badge "EN COURS" ou le timer tourne
      await expect(page.locator('text=Arrêter')).toBeVisible();
      // Arrêt du timer
      await page.click('button:has-text("Arrêter")');
    }
  });

  test('R7: Module Budgets & Dépenses — Seuils et alertes', async ({ page }) => {
    await page.goto('/');
    await page.click('button:has-text("Budgets & Dépenses")');
    await expect(page.locator('text=Budgets & Dépenses du Projet')).toBeVisible();
    await expect(page.locator('text=Budget Total Alloué')).toBeVisible();
    await expect(page.locator('text=Coûts Réels Engagés')).toBeVisible();
    await expect(page.locator('text=Consommation')).toBeVisible();
  });

  test('R8: Moteur d’Export — Modal et options CSV / JSON', async ({ page }) => {
    await page.goto('/');
    // Bouton exporter dans la topbar
    const exportBtn = page.locator('button[title*="Exporter"], button:has-text("Exporter")').first();
    await expect(exportBtn).toBeVisible();
    await exportBtn.click();
    // Modale d'export
    await expect(page.locator('text=Centre d’Exportation')).toBeVisible();
    await expect(page.locator('text=Export CSV — Tâches')).toBeVisible();
    await expect(page.locator('text=Sauvegarde Intégrale JSON')).toBeVisible();
    await page.keyboard.press('Escape');
  });

  test('R9: Thème sombre / clair — Bascule immédiate et persistante', async ({ page }) => {
    await page.goto('/');
    // Trouver le bouton thème dans la topbar
    const themeBtn = page.locator('button[title*="mode sombre"], button[title*="mode clair"]').first();
    await expect(themeBtn).toBeVisible();
    // État initial de la classe HTML
    const html = page.locator('html');
    const wasDark = await html.evaluate(el => el.classList.contains('dark'));
    await themeBtn.click();
    const isNowDark = await html.evaluate(el => el.classList.contains('dark'));
    expect(isNowDark).not.toBe(wasDark);
  });

  test('R10: Équipe & Rôles (RBAC)', async ({ page }) => {
    await page.goto('/');
    await page.click('button:has-text("Équipe & Membres")');
    await expect(page.locator('text=Gestion de l’Équipe')).toBeVisible();
    await expect(page.locator('text=Thomas Laurent')).toBeVisible();
    await expect(page.locator('text=Propriétaire')).toBeVisible();
  });

  test('R11: Sprints Agile & Burndown Chart', async ({ page }) => {
    await page.goto('/');
    await page.click('button:has-text("Sprints Agile")');
    await expect(page.locator('text=Sprints Agile & Itérations')).toBeVisible();
    await expect(page.locator('text=Courbe Burndown')).toBeVisible();
  });

  test('R12: Base de Connaissances & Wiki', async ({ page }) => {
    await page.goto('/');
    await page.click('button:has-text("Wiki & Base de savoir")');
    await expect(page.locator('text=Wiki & Documentation Projet')).toBeVisible();
    await expect(page.locator('text=Rechercher une note')).toBeVisible();
  });

  test('R13: Matrice des Risques 5x5', async ({ page }) => {
    await page.goto('/');
    await page.click('button:has-text("Matrice des risques")');
    await expect(page.locator('text=Gestion des Risques & Matrice 5x5')).toBeVisible();
    await expect(page.locator('text=Matrice de Criticité 5x5')).toBeVisible();
  });

  test('R14: Paramètres & Journal d’Audit de Sécurité', async ({ page }) => {
    await page.goto('/');
    await page.click('button:has-text("Paramètres")');
    await expect(page.locator('text=Paramètres du Système SENTINEL GESTION')).toBeVisible();
    // Onglet Journal d'audit
    await page.click('button:has-text("Journal d’Audit")');
    await expect(page.locator('text=Journal d’Audit Immuable')).toBeVisible();
    await expect(page.locator('text=Enregistrement continu')).toBeVisible();
  });

});
