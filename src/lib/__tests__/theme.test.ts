import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  THEMES,
  THEME_ORDER,
  DEFAULT_THEME,
  THEME_STORAGE_KEY,
  isValidThemeId,
  isValidThemePreference,
  resolveTheme,
  getNextTheme,
  applyTheme,
} from '../theme.ts';

/**
 * Calculateur de luminance relative selon la recommandation W3C WCAG 2.1
 * https://www.w3.org/WAI/GL/wiki/Relative_luminance
 */
function getLuminance(hexColor: string): number {
  const hex = hexColor.replace('#', '').trim();
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const toLinear = (c: number) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

  const rLinear = toLinear(r);
  const gLinear = toLinear(g);
  const bLinear = toLinear(b);

  return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
}

/**
 * Calculateur de ratio de contraste (L1 + 0.05) / (L2 + 0.05)
 */
function getContrastRatio(hex1: string, hex2: string): number {
  const lum1 = getLuminance(hex1);
  const lum2 = getLuminance(hex2);
  const brighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (brighter + 0.05) / (darker + 0.05);
}

describe('SENTINEL GESTION — Phase 1 : Système des 4 Thèmes de Fond & Ratios WCAG 2.1', () => {
  it('1. Présence et intégrité des 4 thèmes officiels (Blanc, Noir, Bleu, Bleu de nuit)', () => {
    assert.deepEqual(THEME_ORDER, ['blanc', 'noir', 'bleu', 'nuit']);
    for (const themeId of THEME_ORDER) {
      const theme = THEMES[themeId];
      assert.ok(theme, `Le thème ${themeId} doit être défini`);
      assert.equal(theme.id, themeId);
      assert.ok(theme.label, `Le thème ${themeId} doit avoir un libellé visible`);
      assert.ok(theme.colors.bg, `Le thème ${themeId} doit avoir une couleur de fond`);
      assert.ok(theme.colors.text, `Le thème ${themeId} doit avoir une couleur de texte`);
    }
  });

  describe('2. Vérification mathématique des contrastes WCAG 2.1 (>= 4.5:1 texte, >= 3:1 contrôles)', () => {
    it('Thème Blanc — Ratios conformes WCAG AA / AAA', () => {
      const blanc = THEMES.blanc.colors;
      
      // Texte principal sur fond blanc (Attendu >= 7:1 AAA)
      const textRatio = getContrastRatio(blanc.text, blanc.bg);
      assert.ok(textRatio >= 7.0, `Texte principal ${blanc.text} sur ${blanc.bg} : ratio ${textRatio.toFixed(2)} doit être >= 7:1 (AAA)`);

      // Texte atténué sur surface-2 (#F1F5F9) (Attendu >= 4.5:1 AA)
      const mutedRatio = getContrastRatio(blanc.textMuted, blanc.surface2);
      assert.ok(mutedRatio >= 4.5, `Texte secondaire ${blanc.textMuted} sur ${blanc.surface2} : ratio ${mutedRatio.toFixed(2)} doit être >= 4.5:1 (AA)`);

      // Bordure de contrôle sur fond (Attendu >= 3.0:1)
      const borderRatio = getContrastRatio(blanc.borderStrong, blanc.bg);
      assert.ok(borderRatio >= 3.0, `Bordure forte ${blanc.borderStrong} sur ${blanc.bg} : ratio ${borderRatio.toFixed(2)} doit être >= 3.0:1 (WCAG 1.4.11)`);

      // Bouton primaire (#0066FF / blanc)
      const btnPrimaryRatio = getContrastRatio(blanc.buttonPrimaryText, blanc.buttonPrimaryBg);
      assert.ok(btnPrimaryRatio >= 4.5, `Bouton primaire ratio ${btnPrimaryRatio.toFixed(2)} doit être >= 4.5:1 (AA)`);

      // Bouton danger (#D91C24 / blanc)
      const btnDangerRatio = getContrastRatio(blanc.buttonDangerText, blanc.buttonDangerBg);
      assert.ok(btnDangerRatio >= 4.5, `Bouton danger ratio ${btnDangerRatio.toFixed(2)} doit être >= 4.5:1 (AA)`);
    });

    it('Thème Noir — Ratios conformes WCAG AA / AAA', () => {
      const noir = THEMES.noir.colors;

      // Texte clair sur noir profond (Attendu >= 7:1 AAA)
      const textRatio = getContrastRatio(noir.text, noir.bg);
      assert.ok(textRatio >= 7.0, `Texte principal sur noir OLED : ratio ${textRatio.toFixed(2)} doit être >= 7:1 (AAA)`);

      // Texte atténué sur surface-2 (Attendu >= 4.5:1 AA)
      const mutedRatio = getContrastRatio(noir.textMuted, noir.surface2);
      assert.ok(mutedRatio >= 4.5, `Texte secondaire sur surface : ratio ${mutedRatio.toFixed(2)} doit être >= 4.5:1 (AA)`);

      // Marque (#4D94FF sur noir)
      const brandRatio = getContrastRatio(noir.brand, noir.bg);
      assert.ok(brandRatio >= 4.5, `Marque ${noir.brand} sur ${noir.bg} : ratio ${brandRatio.toFixed(2)} doit être >= 4.5:1 (AA)`);
    });

    it('Thème Bleu (Cobalt) — Ratios conformes et bouton inversé', () => {
      const bleu = THEMES.bleu.colors;

      // Texte blanc sur fond cobalt (#0A3FA8) (Attendu >= 7:1 AAA)
      const textRatio = getContrastRatio(bleu.text, bleu.bg);
      assert.ok(textRatio >= 7.0, `Texte blanc sur fond cobalt : ratio ${textRatio.toFixed(2)} doit être >= 7:1 (AAA)`);

      // Texte atténué (#C7D7F5 sur surface #1250C8) (Attendu >= 4.5:1 AA)
      const mutedRatio = getContrastRatio(bleu.textMuted, bleu.surface);
      assert.ok(mutedRatio >= 4.5, `Texte atténué sur surface cobalt : ratio ${mutedRatio.toFixed(2)} doit être >= 4.5:1 (AA)`);

      // Bouton primaire inversé : Texte cobalt (#0A3FA8) sur fond blanc (#FFFFFF)
      const btnInvertedRatio = getContrastRatio(bleu.buttonPrimaryText, bleu.buttonPrimaryBg);
      assert.ok(btnInvertedRatio >= 7.0, `Bouton primaire inversé sur thème Bleu : ratio ${btnInvertedRatio.toFixed(2)} doit être >= 7:1 (AAA)`);

      // Accent Cyan (#00D2FF sur fond cobalt)
      const accentRatio = getContrastRatio(bleu.accent, bleu.bg);
      assert.ok(accentRatio >= 4.5, `Accent cyan sur cobalt : ratio ${accentRatio.toFixed(2)} doit être >= 4.5:1 (AA)`);
    });

    it('Thème Bleu de nuit (Marine #0B132B) — Ratios conformes WCAG AA / AAA', () => {
      const nuit = THEMES.nuit.colors;

      // Texte sur marine (Attendu >= 7:1 AAA)
      const textRatio = getContrastRatio(nuit.text, nuit.bg);
      assert.ok(textRatio >= 7.0, `Texte principal sur marine : ratio ${textRatio.toFixed(2)} doit être >= 7:1 (AAA)`);

      // Texte atténué sur surface (#111D4A) (Attendu >= 4.5:1 AA)
      const mutedRatio = getContrastRatio(nuit.textMuted, nuit.surface);
      assert.ok(mutedRatio >= 4.5, `Texte atténué sur surface marine : ratio ${mutedRatio.toFixed(2)} doit être >= 4.5:1 (AA)`);

      // Marque (#4D94FF sur marine)
      const brandRatio = getContrastRatio(nuit.brand, nuit.bg);
      assert.ok(brandRatio >= 4.5, `Marque sur marine : ratio ${brandRatio.toFixed(2)} doit être >= 4.5:1 (AA)`);
    });
  });

  it('3. Cycle séquentiel Alt+T (Blanc -> Noir -> Bleu -> Bleu de nuit -> Blanc)', () => {
    assert.equal(getNextTheme('blanc'), 'noir');
    assert.equal(getNextTheme('noir'), 'bleu');
    assert.equal(getNextTheme('bleu'), 'nuit');
    assert.equal(getNextTheme('nuit'), 'blanc');
  });

  it('4. Validation des identifiants et préférences (y compris auto)', () => {
    assert.equal(isValidThemeId('blanc'), true);
    assert.equal(isValidThemeId('noir'), true);
    assert.equal(isValidThemeId('bleu'), true);
    assert.equal(isValidThemeId('nuit'), true);
    assert.equal(isValidThemeId('rouge'), false);
    assert.equal(isValidThemeId('dark'), false);

    assert.equal(isValidThemePreference('auto'), true);
    assert.equal(isValidThemePreference('blanc'), true);
    assert.equal(isValidThemePreference('invalid'), false);

    assert.equal(resolveTheme('blanc'), 'blanc');
    assert.equal(resolveTheme('noir'), 'noir');
    assert.equal(resolveTheme('bleu'), 'bleu');
    assert.equal(resolveTheme('nuit'), 'nuit');
    assert.equal(resolveTheme('auto'), DEFAULT_THEME);
  });

  it('5. Clé de stockage dédiée pour les 4 thèmes', () => {
    assert.equal(THEME_STORAGE_KEY, 'sentinel_theme');
    assert.equal(DEFAULT_THEME, 'nuit');
  });

  it('6. applyTheme fonctionne de manière robuste et sans plantage en SSR (sans DOM)', () => {
    assert.doesNotThrow(() => {
      applyTheme('blanc');
      applyTheme('noir');
      applyTheme('bleu');
      applyTheme('nuit');
      applyTheme('auto');
    });
  });
});
