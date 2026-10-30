import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  BADGE_CONFIGS,
  getStatusBadgeVariant,
  getPriorityBadgeVariant,
  type BadgeVariant,
} from '../../components/ui/badgeTokens.ts';
import { THEMES } from '../theme.ts';

describe('SENTINEL GESTION — Phase 3 : Tableaux Clairs & Badges à Pastille Colorée', () => {
  it('1. Exhaustivité des configurations de badges (bordure + pastille)', () => {
    const variants: BadgeVariant[] = [
      'todo', 'in_progress', 'in_review', 'done',
      'urgent', 'high', 'medium', 'low',
      'success', 'warning', 'danger', 'info', 'default',
    ];

    for (const v of variants) {
      const config = BADGE_CONFIGS[v];
      assert.ok(config, `La configuration pour le badge ${v} doit exister`);
      assert.ok(config.dotColor, `Le badge ${v} doit avoir une pastille colorée dotColor`);
      assert.ok(config.borderColor, `Le badge ${v} doit avoir une bordure borderColor`);
      assert.ok(config.textColor, `Le badge ${v} doit avoir une couleur de texte lisible`);
      assert.ok(config.label, `Le badge ${v} doit posséder un libellé textuel`);
    }
  });

  it('2. Mappeur de statut de tâche vers badge à pastille', () => {
    assert.equal(getStatusBadgeVariant('todo'), 'todo');
    assert.equal(getStatusBadgeVariant('in_progress'), 'in_progress');
    assert.equal(getStatusBadgeVariant('in_review'), 'in_review');
    assert.equal(getStatusBadgeVariant('done'), 'done');
  });

  it('3. Mappeur de priorité de tâche vers badge à pastille', () => {
    assert.equal(getPriorityBadgeVariant('urgent'), 'urgent');
    assert.equal(getPriorityBadgeVariant('high'), 'high');
    assert.equal(getPriorityBadgeVariant('medium'), 'medium');
    assert.equal(getPriorityBadgeVariant('low'), 'low');
  });

  it('4. Cohérence des jetons de surface et survol de tableau dans les 4 thèmes', () => {
    for (const [themeId, def] of Object.entries(THEMES)) {
      assert.ok(def.colors.surface, `Le thème ${themeId} doit avoir une couleur de surface`);
      assert.ok(def.colors.surface2, `Le thème ${themeId} doit avoir une surface-2 pour en-têtes`);
      assert.ok(def.colors.border, `Le thème ${themeId} doit avoir une bordure de délimitation`);
    }
  });
});
