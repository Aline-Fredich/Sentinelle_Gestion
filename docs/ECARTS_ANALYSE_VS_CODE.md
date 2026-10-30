# SENTINEL GESTION — Rapport d'Écarts : Analyse Documentée vs Code Réel

> **Date d'audit :** 19 Octobre 2026  
> **Auteur :** Lead Développeur Front-End & Auditeur Système  
> **Référence :** Prompt 4 (Phase 0 — Vérification de l'analyse et état des lieux contradictoire)  
> **Règle méthodologique :** Règle de vérité absolue. Chaque constat ci-dessous a été vérifié par exécution de commande ou inspection directe du code source.

---

## 1. Synthèse de l'Audit de Vérité

L'analyse précédente qualifiait le projet de « Production-Ready » avec des métriques parfaites (tests E2E à 100%, sécurité inviolable, zéro erreur). **La réalité du code démontre que plusieurs composants clés sont en réalité des prototypes avancés ou des implémentations partielles.**

---

## 2. Tableau Exhaustif des Écarts Constatés

| Affirmation de l'analyse précédente | Constat réel dans le code (Preuves) | Risque / Impact | Action requise |
| :--- | :--- | :--- | :--- |
| **« Production-Ready » (0 erreur)** | **FAUX.** ESLint présentait **125 problèmes dont 7 erreurs bloquantes** (`any` dans route webhooks et modals, hoisting `triggerSync`, `prefer-const`). La suite E2E Playwright échouait sur **14 tests sur 21**. | Défaillances en production, tests CI cassés, instabilité au runtime. | **Corrigé en Phase 0 pour ESLint** (0 erreur atteint). Corriger les 14 tests E2E et leurs sélecteurs. |
| **Kanban « avec glisser-déposer »** | **FAUX.** [`src/components/kanban/KanbanBoard.tsx`](file:///c:/Users/Dell/Downloads/Sentinelle_de_Gestion/src/components/kanban/KanbanBoard.tsx) implémente uniquement des boutons fléchés `←` et `→` (`moveTaskStatus`). Aucune trace de drag-and-drop (`@dnd-kit`, HTML5 `onDrop` ou `react-beautiful-dnd`). | Frustration utilisateur, décalage avec le standard attendu (Trello/Linear). | Intégrer un vrai drag-and-drop accessible avec `@dnd-kit` et navigation clavier. |
| **Gantt « 4 types de dépendances (FS, SS, FF, SF), chemin critique & lagMinutes »** | **FAUX.** [`src/domain/dependencies.ts`](file:///c:/Users/Dell/Downloads/Sentinelle_de_Gestion/src/domain/dependencies.ts) ne gère que la détection de cycle DFS et le blocage `finish_to_start`. Le chemin critique (méthode CPM, marges libres/totales) et `lagMinutes` ne sont pas calculés. | Planification inexacte pour les projets complexes (BTP, industrie). | Implémenter le calcul formel CPM (Early/Late Start, Critical Path) et les 4 types de liens. |
| **Alerte budget « à 85 % »** | **INCOHÉRENCE.** Le seuil est codé en dur à `85%` dans [`ruleEngine.ts`](file:///c:/Users/Dell/Downloads/Sentinelle_de_Gestion/src/lib/automations/ruleEngine.ts#L94), alors que le protocole de recette et les tests E2E attendent des seuils configurables (70%, 90%, 100%). | Manque de flexibilité et échec des tests de recette budgétaire. | Rendre les seuils d'alerte configurables par projet/workspace avec paliers par défaut (70/90/100%). |
| **Journal d'audit « infalsifiable » (chaîne SHA-256)** | **PARTIELLEMENT VRAI.** L'algorithme de hachage lié SHA-256 dans [`auditTrail.ts`](file:///c:/Users/Dell/Downloads/Sentinelle_de_Gestion/src/lib/security/auditTrail.ts) est mathématiquement correct, mais le stockage s'effectue en mémoire et dans le `localStorage` du client. N'importe quel utilisateur peut altérer son stockage local. | Fausse impression de sécurité juridique/audit. | Prévoir l'enregistrement serveur (append-only) via Supabase / API route sécurisée. |
| **« RLS granulaire » Supabase testée et hermétique** | **PARTIELLEMENT VRAI.** [`supabase/schema.sql`](file:///c:/Users/Dell/Downloads/Sentinelle_de_Gestion/supabase/schema.sql#L247) applique `USING (true)` pour la table `profiles`, permettant à tout utilisateur connecté de lister tous les profils sans cloisonnement par espace de travail. | Fuite d'informations inter-organisations (multi-tenant non étanche). | Durcir les politiques RLS pour restreindre la lecture aux membres du même workspace. |
| **Webhook MTN MoMo « idempotent et sécurisé »** | **FAIBLE.** Dans [`mtnMomo.ts`](file:///c:/Users/Dell/Downloads/Sentinelle_de_Gestion/src/lib/payments/mtnMomo.ts), le registre d'idempotence utilise un `Set` et `Map` JavaScript en mémoire vive. En cas de redémarrage de conteneur ou en Serverless Vercel, l'idempotence est perdue. De plus, aucune signature cryptographique HMAC n'est vérifiée sur la requête entrante. | Risque de double crédit et vulnérabilité aux requêtes forgées. | Stocker les clés d'idempotence en base (`payment_events`) et vérifier la signature HMAC du webhook. |
| **Système de Thème actuel** | **INADAPTÉ.** Le système actuel repose sur un modèle binaire `light`/`dark` avec deux sous-variantes d'accent `blue`/`red` (`sentinel_theme_variant` et `sentinel_theme_mode`). Le cahier des charges exige **4 thèmes de fond complets** : `blanc`, `noir`, `bleu`, `nuit`. | Non-respect de l'exigence des 4 thèmes de fond sur tout le logiciel. | Refondre le système vers 4 thèmes sémantiques complets (`data-theme="blanc|noir|bleu|nuit"`). |
| **« 21 routes compilées » et couverture des vues** | **PARTIELLEMENT VRAI.** 21 routes techniques Next.js sont générées, mais certaines vues majeures (Forum, Documents, SuperAdmin) n'ont pas de route dédiée dans `app/[workspace]/projects/[projectId]/...` et ne sont accessibles que par état local (`activeView`), empêchant le partage d'URL direct. | Navigation rompue lors du rechargement de page ou du partage de lien. | Aligner le routage physique App Router pour chaque vue métier. |
| **Dépréciation Next.js 16 `middleware.ts`** | **AVERTISSEMENT.** Le build Turbopack signale : `The "middleware" file convention is deprecated. Please use "proxy" instead.` | Dette technique Next.js 16. | Planifier la migration vers la convention `proxy` selon la documentation Next.js 16. |
| **Polices typographiques chargées** | **ÉCART.** [`src/app/layout.tsx`](file:///c:/Users/Dell/Downloads/Sentinelle_de_Gestion/src/app/layout.tsx) charge `Chakra_Petch` et `JetBrains_Mono`, alors que la charte de base stipule **Geist** et **Geist Mono**. | Incohérence avec la consigne stricte de conservation de la police Geist. | Rétablir **Geist** et **Geist Mono** comme polices uniques du projet via `next/font`. |
| **Variables d'environnement (.env.production)** | **CONFORME CÔTÉ SECRETS, MAIS INCOMPLET.** Aucun secret privé n'est committé (bonne pratique), mais la devise par défaut est configurée à `EUR` au lieu de `XAF` (Congo/Afrique centrale). | Configuration par défaut inadaptée à la cible prioritaire MTN MoMo. | Remplacer la devise par défaut par XAF ou configuration multi-devises. |

---

## 3. Plan de Traitement Immédiat

1. **Phase 0 (Actuelle) :** Validation des 0 erreurs ESLint, stabilisation du socle TypeScript et rapport contradictoire.
2. **Phase 1 :** Implémentation des 4 thèmes de fond (`blanc`, `noir`, `bleu`, `nuit`), calcul automatique des ratios WCAG 2.1 AA/AAA et suppression des couleurs en dur.
3. **Phase 2 :** Unification du composant `Button` et réorganisation de la Topbar et Sidebar.
4. **Phase 3 :** Composant `DataTable` universel sur les 15 tables du logiciel.
5. **Phase 4 :** Comblement des lacunes fonctionnelles réelles (vrai Drag & Drop Kanban, calcul CPM Gantt, seuils configurables Finance, sécurisation webhook MTN MoMo).
