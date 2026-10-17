import { test, expect } from '@playwright/test';

test.describe('SENTINEL GESTION — Modules Métier & Sécurité Avancée (Phase 11)', () => {

  test('Module 1: Budgets & Dépenses — Métriques financières et alertes de dépassement', async ({ page }) => {
    await page.goto('/');
    // Clic sur Budgets & Dépenses dans la barre latérale via data-testid
    await page.locator('[data-testid="nav-finance"]').click();
    await expect(page.locator('text=Gestion Budgétaire & Rentabilité')).toBeVisible();
    await expect(page.locator('text=Devis Cible Alloué')).toBeVisible();
    await expect(page.locator('text=Dépenses Totales Engagées')).toBeVisible();

    // Vérifier la présence du bouton d'ajout de dépense
    await expect(page.locator('button:has-text("Ajouter une dépense")')).toBeVisible();
  });

  test('Module 2: Suivi du Temps — Feuille de temps et calcul des coûts', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-testid="nav-timetracking"]').click();
    await expect(page.locator('text=Suivi du Temps & Feuilles de Temps')).toBeVisible();
    await expect(page.locator('text=Chronomètre en Direct')).toBeVisible();

    // Vérifier le bouton d'enregistrement manuel
    await expect(page.locator('button:has-text("Enregistrer la session")')).toBeVisible();
  });

  test('Module 3: Sprints Agile — Backlog, Story Points et Graphique Burndown', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-testid="nav-sprints"]').click();
    await expect(page.locator('text=Gestion des Sprints & Méthodologie Agile')).toBeVisible();
    await expect(page.locator('text=Courbe Burndown')).toBeVisible();

    // Vérification de la présence de la courbe vectorielle SVG Burndown
    const burndownSvg = page.locator('svg[viewBox="0 0 600 240"]');
    await expect(burndownSvg).toBeVisible();
  });

  test('Module 4: Wiki & Documentation — Base de connaissances et recherche', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-testid="nav-wiki"]').click();
    await expect(page.locator('text=Wiki & Base de Connaissances')).toBeVisible();

    // Champ de recherche d'articles
    const searchInput = page.locator('input[placeholder*="Rechercher"]');
    await expect(searchInput).toBeVisible();

    // Bouton de création
    await expect(page.locator('button:has-text("Nouvelle page")')).toBeVisible();
  });

  test('Module 5: Gestion des Risques — Matrice 5x5 et plans d’atténuation', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-testid="nav-risks"]').click();
    await expect(page.locator('text=Gestion des Risques & Matrice de Criticité')).toBeVisible();
    await expect(page.locator('text=Total Risques Déclarés')).toBeVisible();

    // Vérifier le bouton d'identification de risque
    await expect(page.locator('button:has-text("Identifier un risque")')).toBeVisible();
  });

  test('Module 6: Sécurité & RGPD — Modale, Audit Trail et Portabilité des Données', async ({ page }) => {
    await page.goto('/');

    // Clic sur l'icône de sécurité dans la barre supérieure via testid
    const securityBtn = page.locator('[data-testid="btn-security-modal"]');
    await expect(securityBtn).toBeVisible();
    await securityBtn.click();

    // Vérification de l'ouverture de la boîte de dialogue
    await expect(page.locator('text=Sécurité & Conformité RGPD')).toBeVisible();
    await expect(page.locator('text=Chaîne Cryptographique')).toBeVisible();

    // Test de vérification cryptographique
    const verifyBtn = page.locator('button:has-text("Vérifier l’intégrité")');
    await expect(verifyBtn).toBeVisible();
    await verifyBtn.click();
    await expect(page.locator('text=Intégrité mathématique certifiée à 100%')).toBeVisible();

    // Changement d'onglet vers Portabilité RGPD (Art. 20)
    await page.click('button:has-text("Portabilité RGPD (Art. 20)")');
    await expect(page.locator('text=Export structuré de vos données personnelles')).toBeVisible();
    await expect(page.locator('button:has-text("Télécharger l’archive JSON")')).toBeVisible();

    // Changement d'onglet vers Droit à l'oubli (Art. 17)
    await page.click('button:has-text("Droit à l’oubli (Art. 17)")');
    await expect(page.locator('text=Droit à l’effacement & Anonymisation irréversible')).toBeVisible();
    await expect(page.locator('input[placeholder*="ANONYMISER"]')).toBeVisible();

    // Fermeture de la modale
    await page.keyboard.press('Escape');
  });

  test('Module 7: Mode Hors-Ligne & Badge Réseau', async ({ page }) => {
    await page.goto('/');
    // Le badge d'état de synchronisation doit être affiché dans la Topbar
    const syncBadge = page.locator('text=En ligne');
    await expect(syncBadge).toBeVisible();
  });
});
