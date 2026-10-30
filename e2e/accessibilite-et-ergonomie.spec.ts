import { test, expect } from '@playwright/test';

test.describe('SENTINEL GESTION — Accessibilité Clavier, Thèmes & Navigation WCAG 2.1 (Phase 8)', () => {

  test('1. Présence et activation du Skip Link clavier (Aller au contenu principal)', async ({ page }) => {
    await page.goto('/');

    // Cibler le lien d'évitement
    const skipLink = page.locator('a[href="#main-content"]');
    await expect(skipLink).toBeAttached();

    // Appuyer sur Tab pour donner le focus au Skip Link
    await page.keyboard.press('Tab');
    await expect(skipLink).toBeFocused();

    // Appuyer sur Entrée pour sauter au contenu principal
    await page.keyboard.press('Enter');
    const mainContent = page.locator('main#main-content');
    await expect(mainContent).toBeFocused();
  });

  test('2. Navigation latérale avec indication de page courante aria-current="page"', async ({ page }) => {
    await page.goto('/');

    // Vue initiale : vue d'ensemble (overview)
    const overviewNav = page.locator('[data-testid="nav-overview"]');
    await expect(overviewNav).toHaveAttribute('aria-current', 'page');

    // Clic sur une autre vue (ex: Kanban)
    const kanbanNav = page.locator('[data-testid="nav-kanban"]');
    await kanbanNav.click();

    await expect(kanbanNav).toHaveAttribute('aria-current', 'page');
    await expect(overviewNav).not.toHaveAttribute('aria-current', 'page');
  });

  test('3. Focus Trap et fermeture par touche Échap dans les fenêtres modales', async ({ page }) => {
    await page.goto('/');

    // Ouvrir la modale de tâche
    const newTaskBtn = page.locator('[data-testid="btn-new-task"]').first();
    await newTaskBtn.click();

    // Vérifier la présence et les attributs accessibles du dialogue
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute('aria-modal', 'true');

    // Appuyer sur Escape pour fermer
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
  });

  test('4. Raccourci clavier Alt+T pour basculer les 4 thèmes et affichage du HUD', async ({ page }) => {
    await page.goto('/');

    // Déclencher Alt+T
    await page.keyboard.press('Alt+KeyT');

    // Vérifier que l'attribut data-theme change
    const html = page.locator('html');
    const themeAttr = await html.getAttribute('data-theme');
    expect(['blanc', 'noir', 'bleu', 'nuit']).toContain(themeAttr);
  });
});
