import { test, expect } from '@playwright/test';

test.describe('SENTINEL GESTION — Modules Métier & Sécurité Avancée (Phase 11)', () => {

  test('Module 1: Budgets & Dépenses — Métriques financières et alertes de dépassement', async ({ page }) => {
    await page.goto('/');
    // Clic sur Budgets & Dépenses dans la barre latérale via data-testid
    await page.locator('[data-testid="nav-finance"]').click();
    await expect(page.locator('text=/gestion budgétaire/i').first()).toBeVisible();
    await expect(page.locator('text=/devis cible alloué/i').first()).toBeVisible();

    // Vérifier la présence du bouton d'ajout de dépense
    await expect(page.getByRole('button', { name: /ajouter une dépense/i })).toBeVisible();
  });

  test('Module 2: Suivi du Temps — Feuille de temps et calcul des coûts', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-testid="nav-timetracking"]').click();
    await expect(page.locator('text=/suivi du temps/i').first()).toBeVisible();
    await expect(page.locator('text=/chronomètre en direct/i').first()).toBeVisible();

    // Vérifier le bouton de démarrage du chronomètre
    await expect(page.getByRole('button', { name: /démarrer le chronomètre/i })).toBeVisible();
  });

  test('Module 3: Sprints Agile — Backlog, Story Points et Graphique Burndown', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-testid="nav-sprints"]').click();
    await expect(page.locator('text=/sprints/i').first()).toBeVisible();

    // Vérification de la présence de la courbe vectorielle SVG Burndown
    const burndownSvg = page.locator('svg[viewBox="0 0 600 120"]');
    await expect(burndownSvg).toBeVisible();
  });

  test('Module 4: Wiki & Documentation — Base de connaissances et recherche', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-testid="nav-wiki"]').click();
    await expect(page.locator('text=/wiki/i').first()).toBeVisible();

    // Champ de recherche d'articles
    const searchInput = page.locator('input[placeholder*="Rechercher"]');
    await expect(searchInput).toBeVisible();

    // Bouton de création
    await expect(page.getByRole('button', { name: /nouvelle page/i })).toBeVisible();
  });

  test('Module 5: Gestion des Risques — Matrice 5x5 et plans d’atténuation', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-testid="nav-risks"]').click();
    await expect(page.locator('main').getByRole('heading', { name: /gestion des risques/i }).first()).toBeVisible();

    // Vérifier le bouton d'identification de risque
    await expect(page.getByRole('button', { name: /identifier un risque/i })).toBeVisible();
  });

  test('Module 6: Sécurité & RGPD — Modale, Audit Trail et Portabilité des Données', async ({ page }) => {
    await page.goto('/');

    // Ouvrir le menu Outils
    const toolsBtn = page.locator('[data-testid="btn-tools-menu"]');
    await expect(toolsBtn).toBeVisible();
    await toolsBtn.click();

    // Clic sur l'icône de sécurité dans le menu déroulant
    const securityBtn = page.locator('[data-testid="btn-security-modal"]');
    await expect(securityBtn).toBeVisible();
    await securityBtn.click();

    // Vérification de l'ouverture de la boîte de dialogue
    await expect(page.locator('text=/sécurité & conformité/i').first()).toBeVisible();
    await expect(page.locator('text=/chaîne de traçabilité/i').first()).toBeVisible();

    // Test de vérification cryptographique
    const verifyBtn = page.getByRole('button', { name: /vérifier l’intégrité/i });
    await expect(verifyBtn).toBeVisible();
    await verifyBtn.click();
    await expect(page.locator('text=/intégrité mathématique certifiée/i').first()).toBeVisible();

    // Changement d'onglet vers Portabilité RGPD (Art. 20)
    await page.getByRole('button', { name: /portabilité/i }).click();
    await expect(page.locator('text=/export structuré/i').first()).toBeVisible();
    await expect(page.getByRole('button', { name: /télécharger l’archive/i })).toBeVisible();

    // Changement d'onglet vers Droit à l'oubli (Art. 17)
    await page.getByRole('button', { name: /droit à l’oubli/i }).click();
    await expect(page.locator('text=/droit à l’effacement/i').first()).toBeVisible();

    // Fermeture de la modale
    await page.keyboard.press('Escape');
  });

  test('Module 7: Mode Hors-Ligne & Badge Réseau', async ({ page }) => {
    await page.goto('/');
    // Le badge d'état de synchronisation doit être affiché dans la Topbar
    const syncBadge = page.locator('text=/en ligne/i').first();
    await expect(syncBadge).toBeVisible();
  });
});
