# SENTINEL GESTION — Dictionnaire de Données & Répertoire des Entités

Ce document constitue la référence exhaustive de l'ensemble des structures de données TypeScript, contraintes d'intégrité et relations utilisées dans **SENTINEL GESTION**.

---

## 1. Entités Fondamentales

### 1.1 `Workspace` (Espace de Travail)
| Champ | Type | Nullable | Description / Valeurs Autorisées |
| :--- | :--- | :---: | :--- |
| `id` | `string` | Non | Identifiant unique (ex: `ws-sentinel-01`). |
| `name` | `string` | Non | Nom officiel de l'organisation ou de l'entreprise. |
| `slug` | `string` | Non | Identifiant d'URL unique en minuscules (ex: `sentinel-corp`). |
| `ownerId` | `string` | Non | Référence à l'identifiant du propriétaire créateur (`User.id`). |
| `createdAt` | `string` | Non | Horodatage ISO-8601 de création. |
| `updatedAt` | `string` | Non | Horodatage ISO-8601 de dernière mise à jour. |

### 1.2 `User` (Collaborateur & Acteur Métier)
| Champ | Type | Nullable | Description / Valeurs Autorisées |
| :--- | :--- | :---: | :--- |
| `id` | `string` | Non | Identifiant unique (ex: `u-1`). |
| `name` | `string` | Non | Nom et prénom complets. |
| `email` | `string` | Non | Adresse électronique unique. |
| `role` | `WorkspaceRole` | Non | Rôle : `'owner'` \| `'admin'` \| `'project_manager'` \| `'member'` \| `'viewer'`. |
| `avatar` | `string` | Non | Data URI vectoriel SVG généré localement (`createLocalAvatarSvg`). |
| `jobTitle` | `string` | Non | Intitulé de poste ou métier (ex: *Architecte Logiciel*, *Chef de Chantier*). |
| `weeklyCapacityMinutes` | `number` | Non | Capacité hebdomadaire en minutes (ex: `2100` min = 35 heures). |
| `hourlyRate` | `number` | Oui | Taux horaire de main d'œuvre en €/h (ex: `75`). Non renseigné après anonymisation RGPD. |

---

## 2. Entités de Gestion de Projet

### 2.1 `Project` (Projet)
| Champ | Type | Nullable | Description / Valeurs Autorisées |
| :--- | :--- | :---: | :--- |
| `id` | `string` | Non | Identifiant unique (ex: `prj-1`). |
| `workspaceId` | `string` | Non | Référence à l'espace de travail parent. |
| `name` | `string` | Non | Titre complet du projet. |
| `reference` | `string` | Non | Code de référence unique (ex: `PRJ-ECOM-01`). |
| `description` | `string` | Non | Cadrage textuel du projet. |
| `status` | `ProjectStatus` | Non | Statut : `'draft'` \| `'active'` \| `'on_hold'` \| `'completed'` \| `'archived'`. |
| `priority` | `TaskPriority` | Non | Priorité : `'urgent'` \| `'high'` \| `'medium'` \| `'low'`. |
| `iconKey` | `string` | Non | Clé d'icône Lucide du registre (`iconRegistry.tsx`). |
| `colorKey` | `string` | Non | Thème chromatique de la charte graphique Sentinel. |
| `startDate` | `string` | Non | Date de démarrage planifiée (`YYYY-MM-DD`). |
| `dueDate` | `string` | Non | Échéance de livraison programmée (`YYYY-MM-DD`). |
| `leadUserId` | `string` | Non | Responsable principal du projet (`User.id`). |
| `memberIds` | `string[]` | Non | Tableau des identifiants des équipiers affectés. |
| `tags` | `string[]` | Non | Étiquettes catégorielles. |

### 2.2 `ProjectPhase` (Phase ou Lot de Chantier)
| Champ | Type | Nullable | Description |
| :--- | :--- | :---: | :--- |
| `id` | `string` | Non | Identifiant unique (ex: `phase-1`). |
| `projectId` | `string` | Non | Référence au projet parent. |
| `name` | `string` | Non | Intitulé du lot (ex: *Phase 1 : Cadrage & Spécifications*). |
| `description` | `string` | Non | Objectifs attendus de la phase. |
| `order` | `number` | Non | Index d'ordonnancement séquentiel (0, 1, 2...). |
| `startDate` | `string` | Non | Date de début de phase (`YYYY-MM-DD`). |
| `endDate` | `string` | Non | Date de fin de phase (`YYYY-MM-DD`). |

### 2.3 `Task` (Tâche Opérationnelle)
| Champ | Type | Nullable | Description |
| :--- | :--- | :---: | :--- |
| `id` | `string` | Non | Identifiant unique (ex: `tsk-101`). |
| `workspaceId` | `string` | Non | Espace de travail parent. |
| `projectId` | `string` | Non | Projet parent. |
| `phaseId` | `string` | Oui | Phase d'appartenance optionnelle. |
| `title` | `string` | Non | Intitulé clair de l'action. |
| `description` | `string` | Non | Description détaillée avec support Markdown. |
| `status` | `TaskStatus` | Non | Statut : `'todo'` \| `'in_progress'` \| `'in_review'` \| `'done'`. |
| `priority` | `TaskPriority` | Non | Priorité : `'urgent'` \| `'high'` \| `'medium'` \| `'low'`. |
| `assigneeId` | `string` | Oui | Responsable assigné principal (`User.id`). |
| `startDate` | `string` | Oui | Date de début (`YYYY-MM-DD`). |
| `dueDate` | `string` | Oui | Date limite de livraison (`YYYY-MM-DD`). |
| `estimateMinutes` | `number` | Non | Estimation de charge en minutes (ex: `240` pour 4h). |
| `actualMinutes` | `number` | Oui | Temps réel cumulé via feuilles de temps. |
| `storyPoints` | `number` | Oui | Estimation Agile (Fibonacci : 1, 2, 3, 5, 8, 13). |
| `labels` | `string[]` | Non | Étiquettes d'organisation. |
| `order` | `number` | Non | Index de positionnement Kanban / Tableau. |

### 2.4 `TaskDependency` (Dépendance Chronologique)
| Champ | Type | Nullable | Description |
| :--- | :--- | :---: | :--- |
| `id` | `string` | Non | Identifiant de la liaison. |
| `projectId` | `string` | Non | Projet parent. |
| `predecessorTaskId` | `string` | Non | Identifiant de la tâche conditionnante ($A$). |
| `successorTaskId` | `string` | Non | Identifiant de la tâche dépendante ($B$). |
| `dependencyType` | `string` | Non | `'finish_to_start'` (Fin à Début canonique). |
| `lagMinutes` | `number` | Oui | Décalage optionnel en minutes. |

---

## 3. Modules P2 : Finances, Temps, Sprints, Documentation & Risques

### 3.1 `ProjectBudget` & `ProjectExpense` (Finances)
- `ProjectBudget` : `id`, `projectId`, `targetBudget` (Montant prévisionnel en €), `currency` (`'EUR'`).
- `ProjectExpense` : `id`, `projectId`, `title`, `amount` (Montant en €), `category` (`'contractor'`, `'software'`, `'travel'`, `'hardware'`, `'other'`), `date`, `status` (`'planned'`, `'committed'`, `'paid'`).

### 3.2 `TimeEntry` & `ActiveTimer` (Suivi du Temps)
- `TimeEntry` : `id`, `projectId`, `taskId` (optionnel), `userId`, `userName`, `description`, `durationMinutes` (Durée en min), `date` (`YYYY-MM-DD`), `hourlyRate`, `createdAt`.
- `ActiveTimer` : `projectId`, `taskId`, `startedAt` (horodatage ISO), `description`.

### 3.3 `Sprint` (Méthodologie Agile)
- `Sprint` : `id`, `projectId`, `name`, `goal`, `startDate`, `endDate`, `status` (`'planning'`, `'active'`, `'completed'`), `totalStoryPoints`, `completedStoryPoints`.

### 3.4 `WikiPage` (Base de Connaissances)
- `WikiPage` : `id`, `projectId`, `title`, `slug`, `category`, `content` (Markdown), `authorName`, `updatedAt`, `tags`.

### 3.5 `ProjectRisk` (Gestion des Risques)
- `ProjectRisk` : `id`, `projectId`, `title`, `description`, `probability` (1 à 5), `impact` (1 à 5), `severity` (1 à 25 = $P \times I$), `mitigationPlan`, `status` (`'identified'`, `'mitigated'`, `'occurred'`, `'closed'`).

---

## 4. Sécurité & Grand Livre d'Audit

### 4.1 `AuditEntry` (Événement Scellé Infalsifiable)
| Champ | Type | Description |
| :--- | :--- | :--- |
| `id` | `string` | Identifiant d'audit unique (`audit-{timestamp}-{random}`). |
| `sequenceNumber` | `number` | Numéro d'ordre absolu croissant ($1, 2, 3...$). |
| `timestamp` | `string` | Horodatage ISO-8601 exact de l'opération. |
| `userId` | `string` | Identifiant de l'auteur de l'action. |
| `userName` | `string` | Nom de l'acteur au moment des faits. |
| `action` | `AuditActionType` | Type d'action (`project_created`, `budget_updated`, `task_deleted`, `gdpr_anonymization`...). |
| `entityType` | `string` | Type d'entité concernée (`project`, `task`, `budget`, `user`, `security`). |
| `entityId` | `string` | Identifiant de l'entité ciblée. |
| `details` | `Record<string, unknown>` | Paramètres et valeurs de mutation au format JSON déterministe canonique. |
| `previousHash` | `string` | Hachage SHA-256 du bloc précédent ($H_{i-1}$) ou `0000...0000` pour le bloc Genesis. |
| `hash` | `string` | Empreinte SHA-256 calculée scellant le bloc ($H_i$). |
