import { test, expect } from '@playwright/test';

test.describe('SENTINEL GESTION — Modules Métier & Sécurité Avancée (Phase 11)', () => {

  test('Module 1: Budgets & Dépenses — Métriques financières et alertes de dépassement', async ({ page }) => {
    await page.goto('/');
    // Clic sur Finances & Budget dans la barre latérale
    await page.click('button:has-text("Finances & Budget")');
    await expect(page.locator('text=Suivi Financier & Budgets')).toBeVisible();
    await expect(page.locator('text=Budget alloué')).toBeVisible();
    await expect(page.locator('text=Dépenses engagées')).toBeVisible();
    await expect(page.locator('text=Main d’œuvre')).toBeVisible();

    // Vérifier la présence du tableau des dépenses récentes
    await expect(page.locator('text=Historique des Dépenses')).toBeVisible();
    await expect(page.locator('button:has-text("Nouvelle dépense")')).toBeVisible();
  });

  test('Module 2: Suivi du Temps — Feuille de temps et calcul des coûts', async ({ page }) => {
    await page.goto('/');
    await page.click('button:has-text("Suivi du Temps")');
    await expect(page.locator('text=Suivi du Temps de Travail')).toBeVisible();
    await expect(page.locator('text=Total semaine')).toBeVisible();
    await expect(page.locator('text=Chronomètre en direct')).toBeVisible();
    await expect(page.locator('text=Feuille de Temps Récente')).toBeVisible();

    // Vérifier le bouton de saisie manuelle
    await expect(page.locator('button:has-text("Saisie manuelle")')).toBeVisible();
  });

  test('Module 3: Sprints Agile — Backlog, Story Points et Graphique Burndown', async ({ page }) => {
    await page.goto('/');
    await page.click('button:has-text("Sprints Agile")');
    await expect(page.locator('text=Gestion des Sprints Agile')).toBeVisible();
    await expect(page.locator('text=Graphique Burndown')).toBeVisible();
    await expect(page.locator('text=Vélocité de l’équipe')).toBeVisible();
    await expect(page.locator('text=Points d’effort restants')).toBeVisible();

    // Vérification de la présence de la courbe vectorielle SVG
    const burndownSvg = page.locator('svg[viewBox="0 0 600 240"]');
    await expect(burndownSvg).toBeVisible();
  });

  test('Module 4: Wiki & Documentation — Base de connaissances et recherche', async ({ page }) => {
    await page.goto('/');
    await page.click('button:has-text("Wiki & Docs")');
    await expect(page.locator('text=Base de Connaissances & Wiki')).toBeVisible();
    await expect(page.locator('text=Articles du Projet')).toBeVisible();

    // Champ de recherche d'articles
    const searchInput = page.locator('input[placeholder*="Rechercher"]');
    await expect(searchInput).toBeVisible();

    // Bouton de rédaction
    await expect(page.locator('button:has-text("Nouvel article")')).toBeVisible();
  });

  test('Module 5: Gestion des Risques — Matrice 5x5 et plans d’atténuation', async ({ page }) => {
    await page.goto('/');
    await page.click('button:has-text("Gestion des Risques")');
    await expect(page.locator('text=Matrice de Criticité')).toBeVisible();
    await expect(page.locator('text=Risques critiques')).toBeVisible();
    await expect(page.locator('text=Registre & Plans d’Atténuation')).toBeVisible();

    // Vérifier le bouton de déclaration de risque
    await expect(page.locator('button:has-text("Déclarer un risque")')).toBeVisible();
  });

  test('Module 6: Sécurité & RGPD — Modale, Audit Trail et Portabilité des Données', async ({ page }) => {
    await page.goto('/');

    // Clic sur l'icône de sécurité dans la barre supérieure
    const securityBtn = page.locator('button[title*="Sécurité, Journal d\'Audit & Conformité RGPD"]');
    await expect(securityBtn).toBeVisible();
    await securityBtn.click();

    // Vérification de l'ouverture de la boîte de dialogue
    await expect(page.locator('text=Sécurité & Conformité RGPD')).toBeVisible();
    await expect(page.locator('text=Journal d’audit infalsifiable')).toBeVisible();

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
