import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  variantClasses,
  sizeClasses,
  iconSizes,
  type ButtonVariant,
  type ButtonSize,
} from '../../components/ui/buttonTokens.ts';

describe('SENTINEL GESTION — Phase 2 : Composant Button & Hiérarchie d’Actions', () => {
  it('1. Exhaustivité des 5 variantes sémantiques', () => {
    const expectedVariants: ButtonVariant[] = ['primary', 'secondary', 'outline', 'ghost', 'danger'];
    for (const v of expectedVariants) {
      assert.ok(variantClasses[v], `La variante ${v} doit être définie`);
    }
  });

  it('2. Variante primaire reliée aux jetons de thème (--button-primary-bg & text)', () => {
    const primary = variantClasses.primary;
    assert.match(primary, /--button-primary-bg/, 'Le bouton primaire doit exploiter --button-primary-bg');
    assert.match(primary, /--button-primary-text/, 'Le bouton primaire doit exploiter --button-primary-text');
  });

  it('3. Variante secondaire reliée aux surfaces et bordures sémantiques', () => {
    const secondary = variantClasses.secondary;
    assert.match(secondary, /--surface-2/, 'Le bouton secondaire doit utiliser --surface-2');
    assert.match(secondary, /--border/, 'Le bouton secondaire doit utiliser --border');
    assert.match(secondary, /--text/, 'Le bouton secondaire doit utiliser --text');
  });

  it('4. Variante danger reliée aux jetons de danger contrastés', () => {
    const danger = variantClasses.danger;
    assert.match(danger, /--button-danger-bg/, 'Le bouton danger doit utiliser --button-danger-bg');
    assert.match(danger, /--button-danger-text/, 'Le bouton danger doit utiliser --button-danger-text');
  });

  it('5. Tailles et proportions ergonomiques (xs, sm, md, lg)', () => {
    const expectedSizes: ButtonSize[] = ['xs', 'sm', 'md', 'lg'];
    for (const s of expectedSizes) {
      assert.ok(sizeClasses[s], `La taille ${s} doit être définie`);
      assert.ok(iconSizes[s], `La taille d’icône pour ${s} doit être définie`);
    }

    assert.match(sizeClasses.xs, /h-7/, 'xs doit mesurer 28px de hauteur');
    assert.match(sizeClasses.sm, /h-8/, 'sm doit mesurer 32px de hauteur');
    assert.match(sizeClasses.md, /h-9/, 'md doit mesurer 36px de hauteur');
    assert.match(sizeClasses.lg, /h-11/, 'lg doit mesurer 44px de hauteur');
  });
});
