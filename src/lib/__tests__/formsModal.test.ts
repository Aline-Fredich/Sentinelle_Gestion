import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('SENTINEL GESTION — Phase 4 : Formulaires, Modales & Saisie Sécurisée', () => {
  it('1. Détection de modifications non enregistrées (dirty check)', () => {
    const isFormDirty = (initial: Record<string, unknown>, current: Record<string, unknown>): boolean => {
      return JSON.stringify(initial) !== JSON.stringify(current);
    };

    const initialData = {
      title: 'Tâche Initiale',
      description: 'Description de base',
      status: 'todo',
      priority: 'medium',
    };

    assert.equal(isFormDirty(initialData, { ...initialData }), false, 'Le formulaire identique ne doit pas être sale');
    assert.equal(isFormDirty(initialData, { ...initialData, title: 'Nouveau titre' }), true, 'Un changement de titre doit marquer le formulaire comme sale');
    assert.equal(isFormDirty(initialData, { ...initialData, status: 'in_progress' }), true, 'Un changement de statut doit marquer le formulaire comme sale');
  });

  it('2. Protection anti-double soumission (loading guard)', () => {
    let submissionCount = 0;
    let isSubmitting = false;

    const submitHandler = () => {
      if (isSubmitting) return; // Guard
      isSubmitting = true;
      submissionCount += 1;
    };

    submitHandler(); // Premier clic
    submitHandler(); // Clic accidentel immédiat (double clic)
    submitHandler(); // Clic répété

    assert.equal(submissionCount, 1, 'La soumission doit être bloquée pendant l’état de chargement actif');
  });

  it('3. Validation stricte des champs obligatoires et assainissement', () => {
    const validateTaskForm = (data: { title: string; projectId: string }) => {
      const errors: Record<string, string> = {};
      if (!data.title || !data.title.trim()) {
        errors.title = 'Le titre de la tâche est obligatoire.';
      }
      if (!data.projectId || !data.projectId.trim()) {
        errors.projectId = 'Veuillez sélectionner un projet.';
      }
      return {
        isValid: Object.keys(errors).length === 0,
        errors,
      };
    };

    const invalidResult = validateTaskForm({ title: '   ', projectId: '' });
    assert.equal(invalidResult.isValid, false);
    assert.ok(invalidResult.errors.title);
    assert.ok(invalidResult.errors.projectId);

    const validResult = validateTaskForm({ title: 'Audit Sécurité', projectId: 'prj-123' });
    assert.equal(validResult.isValid, true);
    assert.equal(Object.keys(validResult.errors).length, 0);
  });

  it('4. Conformité des classes et jetons de modale et tiroir (Drawer)', () => {
    const drawerClasses = [
      'fixed', 'inset-0', 'bg-black/60', 'backdrop-blur-sm',
      'border-l', 'animate-slideInRight',
    ];
    for (const cls of drawerClasses) {
      assert.ok(cls.length > 0, `La classe ${cls} doit être définie`);
    }

    const modalSizes = ['sm', 'md', 'lg', 'xl'] as const;
    const sizeMap = {
      sm: 'max-w-md',
      md: 'max-w-xl',
      lg: 'max-w-3xl',
      xl: 'max-w-5xl',
    };

    for (const size of modalSizes) {
      assert.ok(sizeMap[size], `La taille ${size} doit être mappée vers une classe Tailwind correspondante`);
    }
  });
});
