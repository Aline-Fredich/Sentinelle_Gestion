# SENTINEL DE GESTION
## Étude comparative, cahier des charges et architecture technique complète
**Version :** 1.0 — **Date :** 11 octobre 2026  
**Nature du document :** plan de conception de produit, architecture et feuille de route de réalisation  
**Nom du produit :** Sentinel de gestion  
**Positionnement :** plateforme de gestion de projets, de tâches, de documents, de délais, de tickets, de collaboration et de publication vers des services externes.

---

## 1. Résumé exécutif

**Sentinel de gestion** doit permettre à une personne ou à une équipe de créer un projet, de lui associer un espace de travail complet et de suivre son avancement jusqu'à sa livraison ou sa publication.

L'idée centrale est la suivante :

1. L'utilisateur se connecte.
2. Il crée un projet à partir d'un formulaire ou d'un modèle.
3. La plateforme prépare automatiquement son espace : tableau de bord, tâches, tickets, étiquettes, documents, calendrier, membres, liens et paramètres.
4. Il planifie les dates, attribue les responsabilités et suit les tâches.
5. Il collabore avec d'autres personnes : commentaires, pièces jointes, notifications et historique.
6. Il connecte des services externes tels que GitHub, puis éventuellement Notion, Evernote, Google Drive ou d'autres outils.
7. Il publie ou synchronise les éléments choisis, selon les capacités et autorisations de chaque service.
8. Il consulte un tableau de bord qui montre les délais, les tâches en retard, les risques, la progression et les prochaines étapes.

Le produit ne doit pas essayer de copier intégralement vingt plateformes dès la première version. Il doit retenir les pratiques les plus utiles, construire un noyau fiable, puis étendre les fonctionnalités à partir des retours réels.

### Vision du produit

> Un espace de travail unique pour transformer une idée en projet organisé, planifié, documenté, collaboratif et livrable.

### Principes directeurs

- **Clarté :** l'utilisateur comprend immédiatement ce qu'il doit faire.
- **Un projet = un espace structuré :** tâches, tickets, documents, dates et liens sont reliés.
- **Une donnée, plusieurs vues :** la même tâche apparaît dans la liste, le Kanban, le calendrier et le tableau de bord sans être dupliquée.
- **Collaboration maîtrisée :** chaque membre n'accède qu'aux espaces et actions autorisés.
- **Intégrations explicites :** l'utilisateur sait ce qui sera publié, synchronisé ou seulement lié.
- **Sécurité dès la conception :** autorisations côté serveur, séparation des espaces clients, journal d'audit et secrets protégés.
- **Construction progressive :** livrer d'abord une version utile, puis ajouter les fonctions avancées.

---

## 2. Étude comparative de 20 plateformes de gestion de projets

### Méthode et limites

Cette étude est une **analyse documentaire du positionnement et des fonctions publiquement présentées** par les outils. Elle sert à repérer des modèles de produit et des fonctions récurrentes ; elle ne prétend pas être un test pratique complet de chaque abonnement. Les fonctionnalités exactes, limites et tarifs changent selon les offres et les dates. Avant d'implémenter une intégration, vérifier les API, permissions, quotas et conditions officielles en vigueur.

### Les 20 outils examinés

| N° | Outil | Modèle / point fort observé | Idées à retenir pour Sentinel de gestion | Risque à éviter |
|---:|---|---|---|---|
| 1 | Asana | Projets structurés, objectifs, tâches assignées, plusieurs vues et rapports | Un projet peut avoir liste, tableau, calendrier, chronologie et indicateurs | Ne pas rendre la configuration obligatoire trop complexe |
| 2 | Trello | Kanban simple basé sur tableaux, listes et cartes ; automatisations | Tickets visuels, étiquettes, dates limites, règles automatiques simples | Un Kanban seul ne suffit pas aux projets complexes |
| 3 | Jira Software | Tickets, workflows configurables et suivi de développement | Statuts personnalisables, priorité, type de ticket, liens entre tickets et historique | Ne pas imposer d'emblée un workflow trop lourd |
| 4 | monday.com | Gestion visuelle, tableaux personnalisables, dépendances, jalons et tableaux de bord | Champs personnalisés, dépendances, vues de synthèse et modèles | Les personnalisations peuvent créer une interface confuse |
| 5 | ClickUp | Positionnement tout-en-un : tâches, documents, objectifs, suivi du temps et dashboards | Réunir tâches, notes, documents et rapports dans un même espace | Trop de modules dès le lancement augmente la complexité |
| 6 | Linear | Flux de travail rapide pour équipes produit/ingénierie, cycles et issues | Recherche rapide, raccourcis, tickets reliés au travail de développement | Un modèle trop orienté développeurs exclurait d'autres projets |
| 7 | Notion | Documents, bases de données, wiki et pages de projet | Notes riches, documents structurés et liens vers les éléments du projet | Les documents ne remplacent pas un moteur de planification robuste |
| 8 | Basecamp | Communication d'équipe, listes de tâches, fichiers et calendrier | Regrouper discussions, tâches et fichiers par projet | Éviter d'éparpiller les échanges dans trop d'écrans |
| 9 | Wrike | Gestion de portefeuilles, planification, tableaux de bord et validation de contenu | Rapports transversaux, circuits de validation et vue multi-projets | Les fonctions d'entreprise ne sont pas nécessaires au MVP |
| 10 | Smartsheet | Grilles, dépendances, jalons, Gantt, rapports et automatisations | Tableaux configurables et rapports calculés depuis les données réelles | Ne pas concevoir toute l'expérience comme un tableur |
| 11 | Microsoft Project | Planification, dépendances, dates et chemin critique | Dépendances de tâches et calcul cohérent des échéances | Le Gantt avancé est coûteux à construire ; le reporter |
| 12 | Zoho Projects | Tâches, jalons, feuilles de temps et problèmes | Jalons, suivi du temps et gestion de problèmes | Ne pas mélanger suivi du temps et estimation sans distinction |
| 13 | Teamwork.com | Gestion de projets d'équipe et de clients, tâches et suivi du temps | Rôles client/membre, heures enregistrées et rapports de travail | Prévoir des autorisations précises pour les clients externes |
| 14 | Airtable | Données structurées, vues, interfaces et automatisations | Champs flexibles, filtres, vues enregistrées et petits workflows | Éviter de transformer la configuration en langage technique |
| 15 | Coda | Documents combinés à des tables, vues, boutons et automatisations | Pages de projet avec tableaux liés et actions contextuelles | Garder une structure de données compréhensible et exportable |
| 16 | MeisterTask | Gestion visuelle des tâches et flux Kanban | Interface d'entrée simple et progression par colonnes | Une vue visuelle doit être accompagnée d'une vraie recherche |
| 17 | ProofHub | Tâches, discussions, fichiers et collaboration | Centraliser commentaires, fichiers et validations | Définir des limites de taille, de stockage et de partage |
| 18 | Hive | Tâches, vues, tableaux de bord et intégrations de travail | Une page d'accueil adaptée au rôle et à l'équipe | Ne pas faire dépendre les fonctions centrales d'intégrations tierces |
| 19 | Shortcut | Gestion de travail pour équipes produit, stories et itérations | Relations entre tâches, cycles de travail et livraisons | Les cycles Scrum doivent rester facultatifs |
| 20 | OpenProject | Gestion de projets avec planification, Gantt et approche open source | Étudier les possibilités d'auto-hébergement et de planification structurée | Le self-hosting augmente les besoins d'exploitation et de maintenance |

### Synthèse : fonctions qui reviennent le plus souvent

Les fonctionnalités suivantes constituent le socle le plus pertinent :

1. Création de projets et modèles.
2. Tâches, sous-tâches, responsables, priorités et échéances.
3. Tickets/éléments de travail avec types, statuts, étiquettes et commentaires.
4. Plusieurs vues synchronisées : liste, Kanban, calendrier et, plus tard, Gantt.
5. Tableau de bord et rapports.
6. Documents, notes, fichiers et liens externes.
7. Membres, rôles et partage.
8. Notifications et historique.
9. Recherche, filtres et vues enregistrées.
10. Automatisations simples.
11. Intégration au dépôt de code et aux outils documentaires.
12. Export et possibilité de récupérer les données.
13. Modèles réutilisables.
14. Mesure des délais et signalement des retards.
15. Sécurité, permissions et audit.

### Différenciation recommandée

Sentinel de gestion peut se différencier en mettant l'accent sur :

- **Création guidée de projet :** l'utilisateur choisit le type de projet, le modèle, les dates et les membres ; la plateforme prépare l'espace.
- **Documents reliés aux tâches :** une spécification Markdown peut être reliée à des tickets, à des versions et à des livrables.
- **Publication contrôlée :** choisir précisément ce qui part vers GitHub ou un outil documentaire.
- **Vue de projet lisible :** échéance, progression, blocages, décisions, tâches prioritaires et livrables.
- **Traçabilité :** historique de qui a modifié quoi, quand et dans quel projet.
- **Approche modulaire :** la plateforme convient aux projets informatiques, études, contenus, activités professionnelles et projets personnels.

---

## 3. Périmètre fonctionnel

### 3.1 Fonctions du MVP — première version utile

Le MVP doit permettre de gérer un projet réel du début à la fin sans dépendre d'un autre logiciel pour les opérations quotidiennes.

**A. Comptes et espaces de travail**
- Inscription, connexion, déconnexion et réinitialisation du mot de passe.
- Profil utilisateur.
- Création d'un espace personnel ou d'équipe.
- Invitation de membres.
- Rôles et permissions par espace et par projet.

**B. Création de projet**
- Nom, description, type, responsable, dates de début et de fin.
- Statut : brouillon, actif, en pause, terminé, archivé.
- Priorité et couleur/icône.
- Modèle de projet facultatif.
- Liste de membres et rôle de chaque membre.
- Liens externes et dépôt GitHub facultatifs.

**C. Tâches et tickets**
- Créer, modifier, archiver et supprimer selon les permissions.
- Titre, description Markdown, type, statut, priorité, étiquettes, responsable, dates et estimation.
- Sous-tâches et relations simples entre tâches.
- Commentaires et pièces jointes.
- Historique des changements.
- Recherche et filtres.
- Affichage en liste et Kanban.

**D. Tableau de bord du projet**
- Progression calculée à partir des tâches.
- Tâches terminées, ouvertes, en retard et bloquées.
- Échéance et jours restants.
- Activité récente.
- Prochaines échéances.
- Répartition par statut, priorité et responsable.
- Liens et documents importants.

**E. Documents et liens**
- Notes et documents Markdown simples.
- Pièces jointes.
- Références vers des URL externes.
- Épinglage des documents importants.
- Export Markdown/JSON/CSV pour les données compatibles.

**F. Collaboration**
- Invitations par e-mail ou lien d'invitation à durée limitée.
- Commentaires, mentions et notifications.
- Centre de notifications.
- Historique d'activité.

**G. Intégration initiale**
- Connexion à GitHub via un mécanisme d'autorisation officiel.
- Associer un dépôt, afficher les liens vers issues, pull requests et commits.
- Publier une tâche vers GitHub seulement après confirmation explicite.
- Enregistrer le résultat de l'opération et les erreurs.

### 3.2 Version 1.1 — après validation du MVP

- Vue calendrier.
- Dépendances entre tâches.
- Jalons.
- Modèles personnalisables.
- Vues enregistrées et filtres avancés.
- Notifications configurables.
- Automatisations simples, par exemple : « quand le statut devient Terminé, enregistrer la date de fin ».
- Synchronisation GitHub plus complète via webhooks.
- Import de tâches depuis CSV.
- Export de projet complet.

### 3.3 Version 2 — fonctions avancées

- Diagramme de Gantt et chemin critique.
- Portefeuille de projets.
- Suivi du temps et budgets.
- Permissions plus fines et partage externe.
- Intégration à Notion et étude d'une intégration Evernote selon les API actuellement disponibles.
- Connecteurs pour Google Drive, Slack, e-mail ou autres services selon la demande.
- Automatisations avec règles et journal d'exécution.
- API publique et webhooks sortants.
- Assistant IA facultatif : résumer un projet, proposer un plan de tâches, détecter les retards et rédiger des comptes rendus. Toute action externe doit être validée par une personne.

**À ne pas développer au départ :** application mobile native, éditeur collaboratif en temps réel complexe, moteur d'automatisation généraliste, facturation SaaS complète, Gantt avancé, intégration de dix services en même temps. Ces éléments peuvent être coûteux et détourner l'effort du besoin essentiel.

---

## 4. Parcours utilisateur principal

### Parcours A — créer un projet

1. L'utilisateur clique sur **Nouveau projet**.
2. Il choisit **Projet vide** ou un modèle : développement logiciel, étude, lancement de produit, contenu, projet personnel.
3. Il renseigne le nom, la description, le responsable, la priorité et les dates.
4. Il choisit les membres et les permissions.
5. Il ajoute éventuellement des étiquettes, un dépôt GitHub ou des liens.
6. Il valide la création.
7. Le système crée les enregistrements nécessaires et ouvre le tableau de bord.
8. Un guide initial propose de créer les premières tâches ou d'importer un fichier.

### Parcours B — travailler sur une tâche

1. Ouvrir le projet.
2. Créer une tâche ou un ticket.
3. Définir type, priorité, statut, étiquettes, responsable et échéance.
4. Ajouter la description, les critères d'acceptation, des commentaires et des fichiers.
5. Déplacer la tâche dans le Kanban ou modifier son statut.
6. Le système vérifie les permissions, enregistre la modification, crée un événement d'activité et envoie les notifications nécessaires.
7. Le tableau de bord recalcule les indicateurs concernés.

### Parcours C — publier vers GitHub

1. L'utilisateur connecte son compte ou son organisation GitHub.
2. Il choisit un dépôt autorisé.
3. Il ouvre une tâche et clique sur **Publier vers GitHub**.
4. L'interface présente les données qui seront transmises.
5. L'utilisateur confirme.
6. Le serveur appelle l'API GitHub avec un jeton protégé.
7. La plateforme enregistre l'identifiant distant, l'URL, la date et le résultat.
8. En cas d'échec, l'interface explique le problème et permet de réessayer sans créer volontairement de doublon.

**Règle importante :** un lien vers une page externe, une publication ponctuelle et une synchronisation bidirectionnelle sont trois fonctions différentes. L'interface doit les distinguer clairement.

---

## 5. Architecture technique recommandée

### 5.1 Stack proposée

| Couche | Choix recommandé | Raison |
|---|---|---|
| Langage | TypeScript | Types partagés, maintenance et détection d'erreurs |
| Frontend | Next.js avec App Router et React | Application web structurée, rendu serveur possible et routes API |
| UI | Tailwind CSS + composants accessibles de type shadcn/ui | Interface cohérente, adaptable et rapide à construire |
| Formulaires et validation | React Hook Form + Zod | Validation côté interface et réutilisation des schémas |
| Base de données | PostgreSQL via Supabase | Relations solides entre espaces, projets, tâches et membres |
| Authentification | Supabase Auth | Gestion de comptes et de sessions sans réinventer l'authentification |
| Autorisation des données | PostgreSQL RLS + contrôles serveur | Défense en profondeur par espace/projet |
| Fichiers | Supabase Storage, avec règles d'accès privées | Documents et pièces jointes protégés |
| Fonctions serveur | Route Handlers / Server Actions Next.js et Supabase Edge Functions si utile | Logique serveur et connecteurs protégés |
| Recherche initiale | PostgreSQL full-text search | Éviter un service de recherche séparé au départ |
| Tâches asynchrones | File de travail/cron compatible avec l'hébergement retenu | Webhooks, synchronisations, rappels et réessais |
| Tests | Vitest, Testing Library et Playwright | Tests unitaires, composants et parcours réels |
| Qualité | ESLint, Prettier, TypeScript strict | Code uniforme et contrôlable |
| Dépôt | GitHub | Historique, issues, pull requests et revue de code |
| Déploiement | Vercel pour l'application web | Déploiements de prévisualisation et production |
| Observabilité | Journaux structurés + suivi d'erreurs adapté au budget | Diagnostiquer les problèmes sans exposer les secrets |

**Pourquoi cette stack ?** Elle permet de construire une application web moderne avec un coût initial contenu, tout en gardant une base relationnelle adaptée aux permissions et aux relations entre objets. Les services précis doivent être vérifiés au moment du déploiement : limites, tarifs, régions, sauvegardes et compatibilité avec les tâches asynchrones.

### 5.2 Vue logique de l'architecture

```text
Navigateur
   |
   v
Interface Next.js / React
   |
   v
Couche serveur (Server Actions / Route Handlers)
   |             \
   |              \--> Connecteurs externes
   |                    |--> GitHub API + Webhooks
   |                    |--> Notion API (phase ultérieure)
   |                    |--> Evernote/autres services, après validation API
   |
   v
Couche d'accès aux données (Data Access Layer)
   |
   +--> Authentification et autorisation
   |
   +--> PostgreSQL / Supabase (RLS)
   |
   +--> Stockage privé des fichiers
   |
   +--> Journal d'audit / événements
   |
   v
Tâches asynchrones
   |--> rappels d'échéance
   |--> traitement des webhooks
   |--> synchronisations et réessais
   |--> e-mails/notifications
```

### 5.3 Organisation du code

Commencer avec un **monolithe modulaire** plutôt que des microservices. Un seul dépôt et une application bien séparée par domaines sont plus simples à développer, tester et déployer au début.

```text
sentinel-de-gestion/
├── docs/
│   ├── VISION.md
│   ├── SPECIFICATIONS_FONCTIONNELLES.md
│   ├── ARCHITECTURE.md
│   ├── MODELE_DE_DONNEES.md
│   ├── SECURITE.md
│   ├── API.md
│   ├── INTEGRATIONS.md
│   ├── TESTS.md
│   └── ROADMAP.md
├── public/
├── src/
│   ├── app/
│   │   ├── (public)/
│   │   ├── (auth)/
│   │   ├── (workspace)/
│   │   └── api/
│   ├── components/
│   │   ├── ui/
│   │   ├── layout/
│   │   ├── projects/
│   │   ├── tasks/
│   │   └── dashboards/
│   ├── features/
│   │   ├── auth/
│   │   ├── workspaces/
│   │   ├── projects/
│   │   ├── tasks/
│   │   ├── labels/
│   │   ├── documents/
│   │   ├── comments/
│   │   ├── notifications/
│   │   ├── integrations/
│   │   └── audit/
│   ├── lib/
│   │   ├── auth/
│   │   ├── db/
│   │   ├── permissions/
│   │   ├── validation/
│   │   ├── logging/
│   │   └── utils/
│   └── types/
├── supabase/
│   ├── migrations/
│   ├── seed.sql
│   └── tests/
├── e2e/
├── .env.example
├── package.json
└── README.md
```

Ne pas créer tous ces dossiers vides dès le premier jour : les ajouter quand les domaines correspondants sont réellement implémentés.

---

## 6. Modèle de données initial

La base doit utiliser des identifiants stables, des clés étrangères, des dates normalisées et des contraintes. Les tables métier principales doivent comporter un `workspace_id` lorsque cela est pertinent pour isoler les données de chaque espace.

### 6.1 Entités principales

| Table | Champs essentiels | Rôle |
|---|---|---|
| `profiles` | `id`, `display_name`, `avatar_url`, `created_at` | Profil lié au compte Auth |
| `workspaces` | `id`, `name`, `slug`, `owner_id`, `created_at` | Espace personnel ou d'équipe |
| `workspace_members` | `workspace_id`, `user_id`, `role`, `joined_at` | Membres et rôles dans l'espace |
| `projects` | `id`, `workspace_id`, `name`, `description`, `status`, `priority`, `owner_id`, `start_date`, `due_date`, `created_at` | Projet |
| `project_members` | `project_id`, `user_id`, `role` | Accès spécifique à un projet |
| `tasks` | `id`, `workspace_id`, `project_id`, `parent_task_id`, `title`, `description`, `status`, `priority`, `assignee_id`, `created_by`, `start_date`, `due_date`, `completed_at`, `estimate_minutes`, `created_at`, `updated_at` | Tâches et sous-tâches |
| `task_labels` | `task_id`, `label_id` | Relation plusieurs-à-plusieurs |
| `labels` | `id`, `workspace_id`, `name`, `color` | Étiquettes |
| `task_dependencies` | `task_id`, `depends_on_task_id`, `dependency_type` | Relations de dépendance |
| `comments` | `id`, `task_id`, `author_id`, `body`, `created_at`, `updated_at` | Discussions sur une tâche |
| `documents` | `id`, `workspace_id`, `project_id`, `title`, `body_markdown`, `created_by`, `updated_at` | Notes et documents |
| `attachments` | `id`, `workspace_id`, `project_id`, `task_id`, `storage_path`, `file_name`, `mime_type`, `size_bytes`, `uploaded_by` | Métadonnées de fichiers privés |
| `project_links` | `id`, `project_id`, `label`, `url`, `category`, `created_by` | Liens externes |
| `activity_events` | `id`, `workspace_id`, `project_id`, `actor_id`, `entity_type`, `entity_id`, `action`, `metadata`, `created_at` | Historique lisible |
| `notifications` | `id`, `user_id`, `type`, `payload`, `read_at`, `created_at` | Notifications internes |
| `integrations` | `id`, `workspace_id`, `provider`, `external_account_id`, `scopes`, `status`, `created_at` | Connexions externes |
| `integration_secrets` | `integration_id`, `encrypted_token` ou référence sécurisée | Secrets, jamais exposés au navigateur |
| `external_mappings` | `id`, `integration_id`, `local_entity_type`, `local_entity_id`, `external_id`, `external_url`, `sync_state`, `last_synced_at` | Correspondance entre objet local et distant |
| `webhook_events` | `id`, `provider`, `external_event_id`, `received_at`, `processed_at`, `status`, `error_summary` | Idempotence et suivi des webhooks |
| `audit_logs` | `id`, `workspace_id`, `actor_id`, `action`, `target_type`, `target_id`, `created_at`, `request_id` | Journal de sécurité et d'administration |

Les jetons OAuth ne doivent pas être enregistrés dans des champs lisibles par les clients. Selon le fournisseur et l'infrastructure, utiliser un coffre de secrets ou un stockage serveur chiffré avec une gestion appropriée des clés. Si le modèle de permissions du fournisseur le permet, demander uniquement les scopes nécessaires.

### 6.2 Règles de modélisation

- Les tables de jointure utilisent des clés uniques, par exemple `(workspace_id, user_id)`.
- `parent_task_id` permet les sous-tâches ; limiter la profondeur au début ou définir une règle claire.
- Les dates d'échéance sont distinctes des dates de réalisation.
- Le statut d'une tâche est une valeur contrôlée, pas un texte libre arbitraire.
- Les étiquettes peuvent être personnalisées par espace.
- Les suppressions de projets doivent être confirmées et, de préférence, passer d'abord par une archive.
- Les événements d'activité ne doivent pas stocker de secrets ni de données sensibles inutiles.
- Les fichiers sont stockés dans un bucket privé ; la base conserve leur chemin et leurs métadonnées.
- Les opérations de synchronisation doivent être idempotentes afin qu'un webhook reçu deux fois ne crée pas deux éléments.
- Ajouter les index correspondant aux requêtes fréquentes : `workspace_id`, `project_id`, `status`, `assignee_id`, `due_date`, `updated_at`.

### 6.3 Calcul des indicateurs

Définir les règles avant de construire les graphiques :

- **Progression :** tâches terminées / tâches non archivées, avec règle documentée pour les sous-tâches.
- **En retard :** tâche non terminée dont la date limite est antérieure à la date actuelle dans le fuseau de l'espace.
- **Bloquée :** tâche dont le statut est bloqué ou qui dépend d'une tâche non terminée, selon la règle retenue.
- **Jours restants :** date limite moins date actuelle ; afficher « en retard de N jours » si le résultat est négatif.
- **Santé du projet :** commencer par des indicateurs explicites et vérifiables. Ne pas afficher une note « IA » opaque sans expliquer les critères.

---

## 7. Permissions et sécurité

La sécurité doit être intégrée dès les premières migrations, pas ajoutée après la création des écrans.

### 7.1 Rôles de départ

| Rôle | Autorisations générales |
|---|---|
| Propriétaire de l'espace | Gérer l'espace, les membres, les paramètres et tous les projets de cet espace |
| Administrateur d'espace | Gérer les projets et membres selon les limites accordées par le propriétaire |
| Responsable de projet | Gérer les paramètres et membres de ses projets, tâches et documents autorisés |
| Membre | Consulter et modifier les éléments selon les permissions du projet |
| Observateur | Lecture seule sur les projets auxquels il est explicitement invité |

Éviter de coder les autorisations uniquement dans les composants visuels. Chaque opération serveur doit vérifier l'identité, l'appartenance à l'espace et le droit d'effectuer l'action.

### 7.2 Contrôles obligatoires

1. Activer et tester les politiques **Row Level Security (RLS)** sur toutes les tables exposées.
2. Tester les scénarios avec deux espaces distincts : un utilisateur de l'espace A ne doit pas pouvoir lire les données de l'espace B.
3. Vérifier les permissions dans chaque Server Action, Route Handler et fonction d'intégration.
4. Ne jamais placer une clé `service_role`, un secret OAuth ou une clé privée dans le code frontend.
5. Stocker les secrets dans les variables d'environnement ou un coffre adapté, séparés entre développement, prévisualisation et production.
6. Valider toutes les entrées côté serveur avec des schémas.
7. Limiter les tentatives de connexion et les opérations sensibles ; appliquer une protection anti-abus adaptée.
8. Contrôler les fichiers : taille, type, nom, autorisation d'accès et URL signée à durée limitée si nécessaire.
9. Protéger les endpoints de webhook par vérification de signature, déduplication et limitation de débit.
10. Prévoir la révocation des intégrations et la suppression sécurisée des jetons.
11. Journaliser les actions sensibles sans écrire les secrets dans les logs.
12. Prévoir sauvegardes, restauration et procédure de réponse à incident.
13. Utiliser HTTPS en production et des politiques de cookies/session adaptées.
14. Définir une politique de conservation et de suppression des données.

### 7.3 Tests de sécurité minimum avant la mise en ligne

- Utilisateur non connecté : accès refusé aux routes privées.
- Membre A tente d'ouvrir l'identifiant d'un projet B : refus.
- Observateur tente de modifier une tâche : refus.
- Utilisateur retiré d'un espace : son accès est révoqué.
- Fichier privé consulté sans permission : refus.
- Webhook dupliqué : aucun doublon créé.
- Jeton GitHub révoqué : intégration signalée comme déconnectée.
- Données d'un espace supprimé : comportement conforme à la politique de conservation.
- Aucun secret dans le bundle frontend, les commits Git ou les logs.

---

## 8. Intégrations externes : GitHub, Notion, Evernote et autres

### 8.1 Concevoir une couche d'intégration commune

Créer une interface de connecteur au lieu de disperser la logique GitHub dans tous les composants :

```ts
interface ProjectConnector {
  connect(): Promise<void>;
  testConnection(): Promise<{ ok: boolean; message?: string }>;
  publishTask(input: PublishTaskInput): Promise<ExternalObjectRef>;
  getObject(externalId: string): Promise<ExternalObjectRef | null>;
  disconnect(): Promise<void>;
}
```

Ceci est un contrat conceptuel à adapter aux API réelles. Tous les fournisseurs n'offrent pas les mêmes capacités ; les méthodes non prises en charge doivent retourner un état clair plutôt que simuler une réussite.

### 8.2 GitHub — première intégration recommandée

Fonctions par étapes :

1. Authentifier le compte et demander le minimum de permissions.
2. Laisser l'utilisateur sélectionner une organisation et un dépôt autorisé.
3. Enregistrer les références externes et les liens.
4. Publier une tâche sous forme d'issue GitHub après confirmation.
5. Enregistrer la correspondance entre la tâche locale et l'issue distante.
6. Recevoir les webhooks utiles, vérifier leur signature et leur identifiant.
7. Mettre à jour les données locales autorisées sans écraser silencieusement les changements.
8. Présenter un journal de synchronisation et un bouton de reconnexion.

**Décision produit :** commencer par une publication à sens unique et une association de liens. La synchronisation bidirectionnelle vient ensuite, avec des règles de conflit clairement définies.

### 8.3 Notion et Evernote

- **Notion :** la documentation officielle présente une API et des connexions GitHub. Cela en fait un candidat plausible pour publier ou relier des pages et bases de données, selon les permissions accordées et les capacités de l'API.
- **Evernote :** ne pas promettre une synchronisation complète avant d'avoir vérifié la disponibilité actuelle de l'API, le modèle d'authentification, les limites et les opérations autorisées pour les comptes ciblés. Au MVP, permettre d'enregistrer un lien Evernote comme lien externe.
- **Autres services :** Google Drive, Slack ou e-mail peuvent être ajoutés selon les besoins constatés, pas seulement parce qu'ils existent.

### 8.4 Règles de synchronisation

- Afficher clairement : « lien externe », « publier », « importer » ou « synchroniser ».
- Demander confirmation avant une action qui crée ou modifie du contenu externe.
- Enregistrer la source de vérité pour chaque champ synchronisé.
- Définir comment gérer les suppressions, les conflits et les objets distants supprimés.
- Prévoir des tentatives répétées avec temporisation progressive.
- Éviter les boucles de webhooks.
- Ne jamais considérer un retour HTTP de succès comme une preuve suffisante si la réponse ne contient pas l'objet attendu.
- Montrer la date de dernière synchronisation et les erreurs compréhensibles.

---

## 9. Interface et expérience utilisateur

### 9.1 Structure de navigation proposée

- **Accueil / Mes projets**
- **Mes tâches**
- **Mes notifications**
- **Espace de travail**
  - Vue d'ensemble
  - Projets
  - Membres
  - Modèles
  - Intégrations
  - Paramètres
- **Dans un projet**
  - Vue d'ensemble
  - Tâches
  - Kanban
  - Calendrier (version ultérieure)
  - Documents
  - Activité
  - Membres et paramètres

### 9.2 Écran de création de projet

Formulaire en étapes courtes :

**Étape 1 — Informations**
- Nom du projet (obligatoire)
- Description
- Type de projet
- Modèle facultatif

**Étape 2 — Planification**
- Date de début
- Date limite
- Priorité
- Responsable

**Étape 3 — Collaboration**
- Membres
- Rôles
- Visibilité

**Étape 4 — Connexions**
- Dépôt GitHub facultatif
- Liens externes
- Documents de référence

**Étape 5 — Confirmation**
- Résumé du projet
- Options activées
- Bouton « Créer le projet »

Ne pas forcer l'utilisateur à remplir les champs facultatifs. Après création, proposer une liste de prochaines actions.

### 9.3 Tableau de bord du projet

Ordre conseillé :

1. Nom, statut, responsable, priorité et échéance.
2. Indicateur de progression et nombre de tâches ouvertes.
3. Bandeau des retards ou blocages.
4. Prochaines échéances.
5. Graphique de répartition par statut.
6. Activité récente.
7. Documents et liens épinglés.
8. Membres et charge de travail simplifiée.

Les indicateurs doivent être cliquables pour ouvrir la liste des éléments concernés. Les couleurs ne doivent pas être le seul moyen de comprendre un statut ; ajouter un texte ou une icône accessible.

### 9.4 Exigences d'interface

- Responsive sur ordinateur, tablette et téléphone.
- États de chargement, erreur, vide et succès explicites.
- Recherche globale.
- Raccourcis simples pour créer une tâche.
- Confirmation pour suppression et publication externe.
- Accessibilité clavier et contrastes suffisants.
- Fuseau horaire clairement défini pour les échéances.
- Interface en français au lancement, avec possibilité de préparer l'internationalisation.

---

## 10. API et contrats applicatifs

Même si l'application commence comme un monolithe, les opérations doivent avoir des responsabilités claires.

### 10.1 Groupes d'opérations

| Domaine | Opérations conceptuelles |
|---|---|
| Auth | connexion, déconnexion, profil, récupération de compte |
| Workspaces | créer, consulter, modifier, inviter, retirer un membre |
| Projects | créer, consulter, modifier, archiver, restaurer |
| Tasks | créer, modifier, déplacer, assigner, terminer, archiver |
| Labels | créer, modifier, associer et retirer |
| Comments | ajouter, modifier selon règles, supprimer selon permissions |
| Documents | créer, modifier, exporter, attacher à un projet |
| Attachments | téléverser, consulter avec autorisation, supprimer |
| Notifications | lister, marquer comme lue, préférences |
| Integrations | connecter, tester, publier, synchroniser, révoquer |
| Reports | obtenir les statistiques d'un espace ou projet |
| Audit | consulter l'historique selon rôle |

### 10.2 Convention de conception

- Valider les entrées et les permissions avant toute mutation.
- Utiliser des codes d'erreur cohérents : non authentifié, interdit, introuvable, conflit, validation invalide, limitation atteinte, erreur externe.
- Ne pas exposer directement des erreurs SQL ou des secrets au navigateur.
- Paginer les listes et limiter la taille des requêtes.
- Ajouter des clés d'idempotence aux opérations externes qui peuvent être répétées.
- Versionner les endpoints publics lorsqu'une API publique sera réellement nécessaire.
- Documenter les opérations dans `docs/API.md`.

---

## 11. Tableaux de bord, délais et indicateurs

### 11.1 Indicateurs du projet

- Nombre total de tâches actives.
- Nombre terminé / ouvert / bloqué / en retard.
- Progression en pourcentage selon une règle définie.
- Prochaine échéance.
- Tâches sans responsable.
- Tâches sans date limite.
- Activité récente.
- Dernière synchronisation des services externes.
- Liste des risques et décisions signalés par l'équipe.

### 11.2 Gestion des délais

- Une date limite doit être stockée de manière cohérente et affichée selon le fuseau horaire configuré.
- Les rappels sont configurables par l'utilisateur ou l'espace.
- Un changement de date doit apparaître dans l'historique.
- Les tâches récurrentes peuvent être ajoutées après validation du modèle simple.
- Les dépendances et reports de dates doivent être visibles ; ne pas recalculer silencieusement les dates d'autres tâches.
- Les notifications de retard ne doivent pas être envoyées en boucle.

### 11.3 Règle de progression

Pour le MVP, utiliser une formule facile à expliquer :

`progression = nombre de tâches actives terminées / nombre total de tâches actives × 100`

Préciser comment les tâches parentes et sous-tâches sont comptées pour éviter de gonfler artificiellement le résultat. Si aucune tâche n'existe, afficher « Aucune tâche » plutôt que 0 %.

---

## 12. Plan de réalisation par phases

Les durées ci-dessous sont des estimations pour une personne qui travaille régulièrement sur le projet. Elles varient selon le niveau d'expérience, les imprévus et le temps disponible. Le calendrier doit être recalibré après le prototype.

### Phase 0 — cadrage (3 à 5 jours)
- Confirmer le public initial : usage personnel, petites équipes ou organisations.
- Définir le problème prioritaire et les scénarios principaux.
- Établir la liste MVP / plus tard.
- Dessiner les écrans essentiels.
- Écrire les critères d'acceptation.
- Livrables : `VISION.md`, `SPECIFICATIONS_FONCTIONNELLES.md`, premiers wireframes.

**Critère de sortie :** un utilisateur peut décrire comment créer un projet, créer une tâche et inviter un membre sans ambiguïté.

### Phase 1 — fondations techniques (4 à 7 jours)
- Créer le dépôt GitHub.
- Initialiser Next.js, TypeScript strict et Tailwind.
- Configurer les environnements local, prévisualisation et production.
- Créer le projet Supabase.
- Configurer les migrations de base.
- Ajouter lint, formatage et tests.
- Livrables : application vide déployée, README, `.env.example`, pipeline de vérification.

**Critère de sortie :** chaque pull request passe les contrôles automatiques et une prévisualisation est disponible.

### Phase 2 — authentification et espaces (4 à 7 jours)
- Inscription, connexion et récupération de compte.
- Profil utilisateur.
- Création d'espace.
- Invitations et rôles.
- RLS et tests d'isolation.
- Livrables : comptes et espaces sécurisés.

**Critère de sortie :** deux espaces de test ne peuvent pas lire les données l'un de l'autre.

### Phase 3 — projets et tableau de bord initial (5 à 8 jours)
- Création, modification et archivage de projets.
- Liste des projets.
- Tableau de bord d'un projet.
- Membres de projet.
- Liens externes.
- Livrables : création d'un espace de projet complet.

**Critère de sortie :** un utilisateur crée un projet et le retrouve après reconnexion.

### Phase 4 — tâches, tickets et étiquettes (7 à 12 jours)
- CRUD tâches.
- Statuts, priorité, responsables, dates et étiquettes.
- Sous-tâches.
- Vue liste et Kanban.
- Commentaires et historique.
- Filtres et recherche.
- Livrables : gestion quotidienne des tâches.

**Critère de sortie :** les modifications se reflètent correctement dans les différentes vues.

### Phase 5 — documents et collaboration (5 à 8 jours)
- Notes Markdown.
- Pièces jointes privées.
- Notifications internes.
- Mentions et activité.
- Export simple.
- Livrables : documents et collaboration de base.

**Critère de sortie :** un membre autorisé peut retrouver les décisions, fichiers et discussions du projet.

### Phase 6 — GitHub (5 à 10 jours)
- Créer et configurer l'application GitHub selon le flux d'autorisation retenu.
- Connecter un dépôt.
- Publier une tâche comme issue.
- Enregistrer la correspondance externe.
- Ajouter gestion d'erreur, déconnexion et audit.
- Ajouter les webhooks seulement après stabilisation de la publication.
- Livrables : première intégration réelle.

**Critère de sortie :** aucune publication ne s'effectue sans permission et les erreurs peuvent être diagnostiquées.

### Phase 7 — tests, sécurité et expérience (5 à 8 jours)
- Tests unitaires et de composants.
- Tests de bout en bout des scénarios principaux.
- Tests RLS et rôles.
- Test de chargement, accessibilité et responsive.
- Vérification des journaux, secrets et sauvegardes.
- Corriger les défauts prioritaires.
- Livrables : version candidate.

**Critère de sortie :** les scénarios essentiels sont testés et aucun défaut critique connu ne bloque la mise en ligne.

### Phase 8 — bêta privée et amélioration (2 à 4 semaines)
- Inviter quelques utilisateurs.
- Observer les points de friction.
- Recueillir les demandes.
- Mesurer la fréquence des erreurs et le temps nécessaire pour créer un projet.
- Prioriser les améliorations sur la base de l'usage.
- Livrables : rapport bêta et feuille de route mise à jour.

### Phase 9 — extensions
Ajouter une fonctionnalité à la fois : calendrier, dépendances, modèles avancés, Gantt, suivi du temps, Notion, puis autres intégrations selon la demande.

### Ordre de priorité produit

- **P0 — indispensable :** Auth, espaces, permissions, projets, tâches, dates, Kanban/liste, tableau de bord, sauvegarde, tests.
- **P1 — utile après le MVP :** commentaires, documents, fichiers, notifications, recherche avancée, GitHub.
- **P2 — croissance :** calendrier, dépendances, modèles, automatisations, intégration Notion.
- **P3 — avancé :** Gantt, portefeuilles, suivi du temps, IA, API publique, intégration d'autres services.

---

## 13. Stratégie de tests et critères d'acceptation

### 13.1 Tests à automatiser

- **Unitaires :** calcul de progression, retard, permissions et validation.
- **Composants :** formulaire de projet, formulaire de tâche, filtres et états d'erreur.
- **Intégration :** opérations de base de données, policies RLS, pièces jointes.
- **E2E :** inscription, création d'espace, création de projet, ajout de tâche, invitation, changement de statut.
- **Intégrations :** publication GitHub, échec d'autorisation, jeton révoqué, webhook dupliqué.
- **Régression :** vérifier qu'une modification n'abîme pas une fonction existante.

### 13.2 Scénario E2E de référence

1. Un utilisateur A crée un compte et un espace.
2. Il crée un projet avec une échéance.
3. Il crée trois tâches, dont une avec une date limite dépassée dans un environnement de test contrôlé.
4. Il attribue une tâche à un membre B.
5. B se connecte et voit seulement les projets autorisés.
6. B change le statut d'une tâche.
7. Le tableau de bord reflète le changement.
8. L'historique enregistre l'action.
9. Un utilisateur C d'un autre espace tente d'accéder au projet : accès refusé.
10. A publie une tâche vers un dépôt GitHub autorisé et voit le lien distant.

### 13.3 Definition of Done

Une fonctionnalité est considérée terminée lorsque :
- son comportement est documenté ;
- ses validations et permissions serveur sont présentes ;
- ses états de chargement, vide, succès et erreur sont traités ;
- les tests pertinents passent ;
- les migrations sont versionnées ;
- aucun secret n'est commité ;
- l'interface est utilisable au clavier et sur mobile ;
- une prévisualisation a été vérifiée.

---

## 14. Git, GitHub et processus de développement

### Branches

- `main` : version stable déployée en production.
- `feature/nom-court` : nouvelle fonctionnalité.
- `fix/nom-court` : correction.
- `docs/nom-court` : documentation.

### Cycle de travail

1. Créer une issue décrivant le besoin.
2. Définir des critères d'acceptation.
3. Créer une branche.
4. Implémenter une petite partie cohérente.
5. Ajouter ou mettre à jour les tests.
6. Ouvrir une pull request.
7. Vérifier les contrôles automatiques et la prévisualisation.
8. Relire les changements et les migrations.
9. Fusionner seulement si les contrôles passent.
10. Vérifier le déploiement et surveiller les erreurs.

### Automatisations CI recommandées

À chaque pull request :
- installation verrouillée des dépendances ;
- lint ;
- vérification TypeScript ;
- tests unitaires ;
- build ;
- contrôle de secrets ;
- tests de migrations pertinents.

Ne pas intégrer de clés de production dans les tests. Prévoir des données de test synthétiques et des environnements séparés.

---

## 15. Déploiement, sauvegardes et exploitation

### Environnements

- **Local :** développement sur la machine.
- **Preview :** chaque branche ou pull request peut être testée sans affecter la production.
- **Production :** version stable destinée aux utilisateurs.

Chaque environnement doit avoir ses propres variables et secrets. Un changement de variable d'environnement peut nécessiter un nouveau déploiement pour être appliqué.

### Liste de contrôle avant mise en ligne

- Domaine et HTTPS configurés.
- Variables d'environnement définies dans l'environnement approprié.
- RLS activé et testé.
- Pas de secrets dans le dépôt ni le bundle navigateur.
- Migrations appliquées et vérifiées.
- Sauvegarde et procédure de restauration testées.
- Limites de téléversement configurées.
- Logs et suivi d'erreurs actifs.
- Politique de confidentialité et conditions d'utilisation préparées si la plateforme accueille des utilisateurs externes.
- Compte propriétaire et procédure de récupération protégés.
- Procédure de désactivation d'une intégration compromise documentée.

### Exploitation courante

- Examiner les erreurs de production.
- Surveiller les échecs de tâches asynchrones et de synchronisation.
- Vérifier l'état des sauvegardes.
- Mettre à jour les dépendances.
- Tester périodiquement la restauration.
- Réviser les rôles et intégrations.
- Supprimer les données de test qui ne doivent pas rester en production.

---

## 16. Budget et choix économiques

Le coût dépend du trafic, du stockage, des limites des plans, des e-mails, des fonctions asynchrones et des intégrations. Ne pas promettre que l'ensemble sera gratuit à long terme.

### Approche économique recommandée

1. Construire le MVP avec les offres de développement disponibles et les limites gratuites, si elles conviennent.
2. Garder une base de données unique et une application modulaire.
3. Éviter les services payants distincts avant d'en avoir besoin.
4. Utiliser PostgreSQL pour la recherche initiale et les indicateurs.
5. Mesurer le stockage et le volume des fichiers.
6. Mettre en place des alertes de consommation si le fournisseur le permet.
7. Vérifier les tarifs actuels avant d'ouvrir la plateforme à un grand nombre d'utilisateurs.
8. Prévoir un coût de sauvegarde, d'e-mail transactionnel et de suivi d'erreurs.

---

## 17. Risques du projet et mesures de réduction

| Risque | Conséquence | Mesure |
|---|---|---|
| Trop de fonctionnalités dès le départ | Retard, bugs et interface complexe | Protéger le périmètre MVP |
| Mauvaise isolation des espaces | Fuite de données | RLS, contrôles serveur et tests multi-espaces |
| Synchronisation externe ambiguë | Doublons ou pertes de données | Source de vérité, idempotence et journal |
| API d'un fournisseur modifiée ou limitée | Intégration en panne | Connecteurs isolés, tests et messages d'erreur |
| Secrets exposés | Compromission de comptes | Secrets serveur, rotation et vérification automatique |
| Indicateurs trompeurs | Mauvaises décisions | Formules documentées et données vérifiables |
| Trop de notifications | Les utilisateurs les ignorent | Préférences, regroupement et limites |
| Projet abandonné avant livraison | Investissement perdu | Incréments courts et démos régulières |
| Dépendance à un hébergeur | Coût ou migration difficile | Export de données, migrations versionnées et architecture standard |
| Documents et fichiers non maîtrisés | Coût, fuite ou perte | Limites, permissions, sauvegarde et règles de conservation |

---

## 18. Décisions à prendre avant le développement

Les propositions de ce document sont un point de départ. Les décisions suivantes doivent être confirmées au cadrage :

1. **Public initial :** usage personnel, petites équipes, ou organisations ?
2. **Modèle de partage :** les projets sont-ils privés par défaut ? Peut-on créer des liens publics en lecture seule ?
3. **Publication :** GitHub est-il le premier connecteur obligatoire, ou un simple lien suffit-il au lancement ?
4. **Documents :** Markdown seulement au MVP, ou éditeur riche dès le début ?
5. **Langue :** français seul au lancement, ou internationalisation immédiate ?
6. **Hébergement :** service hébergé uniquement ou besoin futur d'auto-hébergement ?
7. **Stockage :** quels types et quelles tailles de fichiers faut-il accepter ?
8. **Notifications :** notifications dans l'application seulement ou e-mail dès le MVP ?
9. **Tarification :** projet personnel gratuit, usage d'équipe ou futur modèle SaaS ?
10. **IA :** hors MVP ou assistant de planification à une phase ultérieure ?

Ne pas bloquer la réalisation sur des fonctionnalités futures. Choisir les options minimales nécessaires pour lancer le premier flux complet.

---

## 19. Plan de travail concret pour commencer

### Première semaine

**Jour 1**
- Relire ce document.
- Définir le public initial et les trois parcours les plus importants.
- Écrire la liste des fonctionnalités MVP.

**Jour 2**
- Dessiner les écrans : connexion, accueil, création de projet, tableau de bord, tâches.
- Décrire les états vides et les erreurs.

**Jour 3**
- Créer le dépôt GitHub et le projet Next.js.
- Configurer TypeScript, Tailwind et les contrôles de qualité.

**Jour 4**
- Créer le projet Supabase.
- Définir les premières migrations : profils, espaces et membres.
- Préparer les tests de permissions.

**Jour 5**
- Construire l'authentification et l'accueil.
- Déployer une prévisualisation.

**Jour 6**
- Implémenter création et affichage d'un espace de travail.

**Jour 7**
- Démontrer le parcours : connexion → espace → création de projet.
- Corriger les problèmes avant de passer aux tâches.

### Ordre technique à respecter

1. Dépôt et environnements.
2. Authentification.
3. Modèle de données et permissions.
4. Espaces et membres.
5. Projets.
6. Tâches et tickets.
7. Tableau de bord calculé depuis la base.
8. Documents, commentaires et fichiers.
9. Notifications.
10. GitHub.
11. Tests de sécurité et bêta.
12. Extensions.

**Règle de progression :** ne pas construire un tableau de bord rempli de chiffres fictifs. Les indicateurs doivent venir des données réellement créées et être vérifiables.

---

## 20. Sources et ressources documentaires

Les pages suivantes ont servi de base à l'étude des fonctionnalités et aux recommandations d'architecture. Les sites commerciaux décrivent leur propre produit ; leurs descriptions doivent être croisées avec la documentation technique avant une décision d'implémentation.

### Comparaison générale des outils
- Dupple, comparaison de logiciels de gestion 2026 : https://dupple.com/learn/best-software-management-tools
- Digital Lab, comparaison d'outils de gestion de projets 2026 : https://digitallab247.com/blog/best-project-management-tools/
- SaaS Radar, guide de gestion de projets 2026 : https://www.saasradar.fr/en/blog/project-management-software-complete-guide-2026
- TopickZ, liste comparative de plateformes de gestion de projets : https://topickz.com/list/best-project-management/

### Documentation officielle des produits
1. Asana — fonctions de gestion de projets : https://asana.com/features
2. Trello — automatisations : https://support.atlassian.com/trello/docs/automation-overview/
3. Jira — site produit : https://www.atlassian.com/software/jira
4. monday.com — fonctions de gestion de projets : https://monday.com/projects/product-features
5. ClickUp — site produit : https://clickup.com/
6. Linear — site produit : https://linear.app/
7. Notion — connecter GitHub : https://www.notion.com/help/github
8. Basecamp — site produit : https://basecamp.com/
9. Wrike — site produit : https://www.wrike.com/
10. Smartsheet — gestion de projets : https://www.smartsheet.com/solutions/project-management
11. Microsoft Project — aide sur les dépendances et le calendrier : https://support.microsoft.com/en-us/project/build-your-project
12. Zoho Projects — site produit : https://www.zoho.com/projects/
13. Teamwork.com — guide de démarrage : https://support.teamwork.com/projects/getting-started/get-started-with-teamwork
14. Airtable — gestion de projets : https://www.airtable.com/solutions/project-management
15. Coda — documentation des tables : https://help.coda.io/hc/articles/39555768266893
16. MeisterTask — site produit : https://www.meistertask.com/
17. ProofHub — site produit : https://www.proofhub.com/
18. Hive — site produit : https://hive.com/
19. Shortcut — site produit : https://shortcut.com/
20. OpenProject — site produit : https://www.openproject.org/

### Architecture, sécurité et intégrations
- Next.js — guide officiel d'authentification et d'autorisation : https://nextjs.org/docs/app/guides/authentication
- Next.js — sécurité des Server Functions : https://nextjs.org/docs/app/api-reference/directives/use-server
- GitHub — intégrations et webhooks : https://docs.github.com/en/integrations/concepts/about-integrations
- GitHub — webhooks d'applications : https://docs.github.com/en/rest/apps/webhooks
- GitHub — autorisations OAuth : https://docs.github.com/en/rest/apps/oauth-applications
- Notion — créer des intégrations API : https://www.notion.com/help/create-integrations-with-the-notion-api
- Notion — synchroniser des données d'autres outils : https://www.notion.com/help/sync-data-from-other-tools
- Vercel — environnements de déploiement : https://vercel.com/docs/deployments/environments
- Vercel — variables d'environnement : https://vercel.com/docs/environment-variables

### À vérifier avant d'implémenter
- Documentation Supabase actuelle : Auth, RLS, Storage, migrations et Edge Functions.
- Documentation actuelle des API Evernote et des conditions d'accès disponibles.
- Scopes OAuth, quotas, politiques de stockage et tarifs de chaque fournisseur.
- Exigences légales et de protection des données correspondant aux utilisateurs visés.

---

## Conclusion

La meilleure stratégie pour **Sentinel de gestion** consiste à construire d'abord un noyau fiable : espaces, projets, tâches/tickets, dates, étiquettes, tableau de bord, documents, collaboration et permissions. GitHub vient ensuite comme première intégration externe, avec une publication contrôlée. Notion, Evernote, Gantt avancé, automatisations et IA doivent être ajoutés lorsque le MVP est stable et que les besoins sont confirmés.

Le succès ne dépendra pas du nombre de fonctions affichées, mais de la capacité du logiciel à rendre un projet compréhensible, à faire ressortir les prochaines actions, à protéger les données et à faciliter la livraison du travail.
