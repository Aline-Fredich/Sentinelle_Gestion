# SENTINEL GESTION — Rapport d'Audit, Modernisation & Nouveaux Modules

**Date :** 12 octobre 2026  
**Document de référence :** `docs/RAPPORT_AUDIT_ET_MODULES_SENTINEL_GESTION.md`  
**Identité officielle :** **SENTINEL GESTION** (d'après l'emblème et le logo officiel fourni)  
**Logo source :** `public/sentinel-logo.jpg`  
**Objectif :** Transformer le prototype existant en une plateforme de gestion de projet d'envergure professionnelle, humaine, ultra-fluide, ergonomique, débarrassée des clichés « générés par IA », avec typographie agrandie, tableaux d'exception et nouveaux modules métiers.

---

## 1. Synthèse de l'Écoute & Directives Utilisateur

L'enregistrement audio et l'image de marque fournis fixent des axes prioritaires clairs et sans ambiguïté :

1. **Nom et Identité Visuelle Officielle :**
   - Le nom officiel affiché est **SENTINEL GESTION** (typographie bleue électrique / cobalt avec tirets rouges de l'emblème).
   - Intégration du logo haute résolution (bouclier tridimensionnel, ruban infini avec icônes de collaborateurs et courbe de progression ascendante).
   - Palette de couleurs harmonisée :
     - **Bleu Cobalt / Électrique :** `#0066FF` / `#00B4D8` (énergie, fluidité, technologie).
     - **Rouge Dynamique / Crimson :** `#FF1E27` / `#EF4444` (alertes, échéances, accents forts).
     - **Arrière-plans & Surfaces :** Contraste haute précision (Dark Slate Exécutif `#0B132B` / `#0F172A` et Light Pro `#F8FAFC` / `#FFFFFF`).

2. **Refonte Typographique & Lisibilité (« Les écrits sont trop petits ») :**
   - Agrandissement substantiel des corps de texte (remplacement des micro-textes 11-12px par du 14-16px lisible avec interlignage confortable).
   - Titres de sections nets et contrastés (18px à 28px).
   - Choix de graisses de polices renforçant la clarté visuelle sans fatigue oculaire.

3. **Excellence des Tableaux (« Les tables soient vraiment très bonnes ») :**
   - Espacement généreux des lignes (`py-3.5` à `py-4.5`).
   - En-têtes fixes, colonnes redimensionnables ou réordonnables.
   - Tri multi-critères, recherche en temps réel, filtres instantanés par statut, priorité et membre.
   - Actions directes en ligne (changement de statut en 1 clic, assignation, menu d'options contextuel).

4. **Suppression du Rendu « Fait par IA » :**
   - Élimination des dégradés artificiels omniprésents et des composants purement décoratifs non fonctionnels.
   - Adoption des standards des meilleurs logiciels du marché (Linear, Notion, Monday, GitHub Projects) : composants denses mais aérés, bordures subtiles au pixel près, micro-animations discrètes (120ms), feedback tactile immédiat.

5. **Polyvalence Totale (« Toutes les possibilités de faire : toute forme de projet ») :**
   - Gestion de projets agiles (Scrum, Kanban, Sprints).
   - Gestion de projets traditionnels / linéaires (Gantt, phases, dépendances, jalons).
   - Suivi opérationnel continu (tâches récurrentes, tickets, maintenance).
   - Nouveaux modules indispensables : Budgets & Dépenses, Suivi du temps (Time Tracking), Wiki & Base documentaire, Gestion des Risques, Automatisations.

---

## 2. Audit Critique de l'Existant

### 2.1 Points Forts Actuels
* Structure modulaire Next.js 16 (App Router) + React 19 + TypeScript sans erreur de compilation.
* Vues existantes fonctionnelles : Tableau de bord, Fiche projet, Tableau de suivi, Kanban, Gantt, Calendrier, Documents, Équipe, Forum, Abonnements.
* Synchronisation en temps réel via le store partagé (`store.tsx`) avec persistance `localStorage`.
* Modales pour les tâches, les invitations et le retrait de membres avec réattribution automatique.

### 2.2 Faiblesses & Défauts Constatés
| Domaine | Problème identifié | Impact utilisateur | Correction préconisée |
|---|---|---|---|
| **Typographie** | Tailles de police 11-12px trop compactes dans la barre latérale, les tableaux et les modales | Fatigue visuelle, lecture difficile sur écrans haute densité | Rehausser l'échelle typographique de base à 14-16px, padding augmenté |
| **Identité** | Variations résiduelles de nommage et absence du logo officiel | Manque de cohérence de marque | Déployer `SENTINEL GESTION` et le logo `public/sentinel-logo.jpg` partout |
| **Palette UI** | Palette précédente beige/bordeaux sans lien avec le logo bleu/rouge | Rendu visuel terne ou artificiel | Intégrer les couleurs officielles : Cobalt `#0066FF`, Cyan `#00D2FF`, Rouge `#FF1E27` |
| **Tables de suivi** | Lignes serrées, absence de filtres combinés rapides et de pagination | Sensation de tableau brut ou généré automatiquement | Refondre `TrackingBoard` avec densité variable, recherche instantanée, actions groupées |
| **Couverture métier** | Pas de gestion financière, pas de chronomètre de temps, pas de wiki riche | L'utilisateur doit jongler avec d'autres outils (Excel, Notion) | Intégrer 5 nouveaux modules complets |

---

## 3. Nouveaux Modules à Déployer

Pour répondre au besoin d'un outil universel où l'équipe peut « travailler parfaitement en bonne ambiance », voici les 5 nouveaux modules majeurs intégrés :

### Module 1 : Budget, Dépenses & Facturation (`finance`)
* **Objectif :** Maîtriser la rentabilité de chaque projet en temps réel.
* **Fonctionnalités :**
  - Définition du budget initial par projet (devis alloué).
  - Suivi des dépenses engagées par catégorie (Main d'œuvre, Sous-traitance, Logiciels, Matériel).
  - Calcul automatique du taux de consommation du budget et marge restante.
  - Alerte visuelle de dépassement budgétaire.
  - Export du bilan financier en CSV / PDF.

### Module 2 : Suivi du Temps & Feuilles de Temps (`time_tracking`)
* **Objectif :** Savoir exactement combien d'heures sont investies par tâche et par collaborateur.
* **Fonctionnalités :**
  - **Chronomètre en direct (Play / Pause)** intégré dans la barre supérieure et sur chaque fiche de tâche.
  - Saisie manuelle d'heures travaillées avec description de l'activité.
  - Feuille de temps hebdomadaire (Timesheet) avec récapitulatif par membre de l'équipe.
  - Taux horaire par défaut pour valorisation automatique des coûts de main d'œuvre.

### Module 3 : Sprints & Méthodologie Agile (`sprints`)
* **Objectif :** Piloter des itérations courtes (1 à 4 semaines) pour les équipes tech et produit.
* **Fonctionnalités :**
  - Création de Sprints avec date de début, date de fin et objectif du sprint.
  - Gestion du Backlog : glisser-déposer des tâches du backlog vers le sprint actif.
  - Story Points (estimation de l'effort : 1, 2, 3, 5, 8, 13).
  - Graphique Burndown dynamique (Courbe idéale vs Réalisé au fil des jours).

### Module 4 : Wiki & Base de Connaissances Collaborative (`wiki`)
* **Objectif :** Centraliser la documentation, les comptes-rendus de réunion et les spécifications.
* **Fonctionnalités :**
  - Arborescence de pages par projet avec icônes personnalisables.
  - Éditeur de contenu riche (titres, listes à puces, blocs de code, alertes, citations).
  - Modèles de documents pré-remplis : Spécification de projet, Compte-rendu de réunion, Guide d'onboarding.
  - Historique des modifications et recherche plein texte instantanée.

### Module 5 : Gestion des Risques & Matrice de Criticité (`risks`)
* **Objectif :** Anticiper les blocages avant qu'ils ne mettent en péril les livrables.
* **Fonctionnalités :**
  - Matrice visuelle 5x5 (Probabilité × Impact = Niveau de criticité).
  - Fiche de risque avec propriétaire désigné et plan de contingence/mitigation.
  - Statuts du risque : Identifié, Sous contrôle, Matérialisé, Clôturé.

---

## 4. Plan de Refonte Ergonomique & Graphique

### 4.1 Thème Visuel « Sentinel Cyber-Executive »
* **Logo :** Affichage de l'emblème haute définition en haut de la barre latérale et sur l'écran d'accueil avec effet de halo discret.
* **Navigation :**
  - Sidebar élargie et réorganisée par groupes logiques :
    - *Vue d'ensemble :* Tableau de bord, Fiche projet.
    - *Planification :* Tableau de suivi, Kanban, Sprints Agile, Gantt, Calendrier.
    - *Gestion & Finance :* Budgets & Dépenses, Suivi du temps (Chronomètre).
    - *Collaboration :* Wiki & Notes, Forum du projet, Documents, Équipe.
    - *Organisation :* Abonnement & Quotas, Paramètres.
* **Typographie augmentée :**
  - Titres principaux : `text-2xl` à `text-3xl` (24px à 30px) semi-bold.
  - Sous-titres et en-têtes : `text-base` à `text-lg` (16px à 18px).
  - Textes courants et cellules de tables : `text-sm` (14px) avec hauteur de ligne équilibrée (`leading-relaxed`).
  - Badges et métadonnées secondaires : `text-xs font-semibold` (12px) sur fonds colorés doux et très contrastés.

### 4.2 Tables de Données Modernisées
* **Hauteur de ligne confortable :** `h-14` pour chaque ligne de tableau.
* **Indicateurs de tri visuels :** Flèches haut/bas au clic sur les en-têtes.
* **Filtres contextuels :** Barre d'outils avec recherche en direct, sélecteur rapide de statut et filtre par responsable.
* **Actions en 1 clic :** Menu contextuel fluide et modification de statut directe sans ouvrir la modale.

---

## 5. Calendrier d'Exécution Immédiate

1. **Phase 1 : Identité & Assets :**
   - Activer `SENTINEL GESTION` comme nom produit unique.
   - Intégrer le logo `sentinel-logo.jpg` dans `Sidebar.tsx`, `Topbar.tsx` et `layout.tsx`.
   - Ajuster la charte globale (`globals.css`) avec les nuances Cobalt (`#0066FF`), Cyan (`#00D2FF`) et Crimson (`#FF1E27`).

2. **Phase 2 : Typographie & Échelle de lecture :**
   - Agrandir les polices dans la barre latérale, les cartes, les formulaires et les tableaux.

3. **Phase 3 : Refonte des Tableaux (`TrackingBoard.tsx`) :**
   - Transformer la table de suivi en une interface spacieuse, fluide et moderne.

4. **Phase 4 : Intégration des Nouveaux Modules :**
   - Module Budgets & Dépenses (`src/components/finance/FinanceView.tsx`).
   - Module Suivi du Temps (`src/components/timetracking/TimeTrackingView.tsx`) avec chronomètre interactif.
   - Module Sprints Agile (`src/components/sprints/SprintsView.tsx`).
   - Module Wiki & Connaissances (`src/components/wiki/WikiView.tsx`).
   - Module Gestion des Risques (`src/components/risks/RisksView.tsx`).

5. **Phase 5 : Compilation & Validation :**
   - Vérification de type TypeScript complète (`tsc --noEmit`).
   - Build de production Next.js 16 et validation du rendu.
