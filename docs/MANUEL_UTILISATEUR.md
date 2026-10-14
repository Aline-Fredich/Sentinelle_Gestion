# SENTINEL GESTION — Manuel Utilisateur Universel

Bienvenue dans le manuel d'utilisation officiel de **SENTINEL GESTION**, la plateforme intégrée de gouvernance et de pilotage de projets « Toute Forme de Projet » (Agile, Cycle en V, BTP, R&D, Conseil, Marketing).

---

## Sommaire
1. [Prise en Main & Raccourcis Clavier](#1-prise-en-main--raccourcis-clavier)
2. [Guide par Rôle Métier](#2-guide-par-rôle-métier)
   - [2.1 Propriétaire & Administrateur (Owner / Admin)](#21-propriétaire--administrateur-owner--admin)
   - [2.2 Chef de Projet (Project Manager)](#22-chef-de-projet-project-manager)
   - [2.3 Membre d'Équipe & Contributeur (Member)](#23-membre-déquipe--contributeur-member)
   - [2.4 Observateur & Client Partenaire (Viewer)](#24-observateur--client-partenaire-viewer)
3. [Exploration des 17 Vues Opérationnelles](#3-exploration-des-17-vues-opérationnelles)
4. [Gestion Hors-Ligne & Synchronisation](#4-gestion-hors-ligne--synchronisation)
5. [Sécurité, Grand Livre d'Audit & Droits RGPD](#5-sécurité-grand-livre-daudit--droits-rgpd)

---

## 1. Prise en Main & Raccourcis Clavier

### Navigation et Ergonomie
- **Barre latérale rétractable** : Permet de basculer instantanément entre l'ensemble des modules du projet.
- **Barre supérieure (Topbar)** : Regroupe les actions transversales : recherche globale, filtres multicritères, déclenchement du chronomètre en direct, badge de connectivité, notifications et console de sécurité.
- **Palette Visuelle** : Dégradés officiels Bleu Cobalt (`#0066FF`), Cyan (`#00D2FF`) et Rouge Sentinelle (`#FF1E27`).

### Raccourcis Clavier Recommandés
| Raccourci | Action |
| :--- | :--- |
| `Échap` / `Escape` | Fermer toute boîte de dialogue, popover ou panneau latéral. |
| `Tab` / `Shift + Tab` | Parcourir séquentiellement les champs et boutons interactifs (Focus contrasté RGAA). |
| `Entrée` / `Enter` | Valider un formulaire ou ouvrir l'élément sélectionné. |

---

## 2. Guide par Rôle Métier

### 2.1 Propriétaire & Administrateur (Owner / Admin)
- **Gestion de l'Espace de Travail** : Configuration du nom, de la devise canonique (€ EUR par défaut) et des paramètres globaux.
- **Gouvernance des Membres** : Invitation par e-mail, attribution des rôles (`owner`, `admin`, `project_manager`, `member`, `viewer`), paramétrage des taux horaires et des capacités hebdomadaires (35h standard).
- **Contrôle d'Intégrité Cryptographique** : Accès à la console Sécurité & RGPD pour vérifier la chaîne d'audit SHA-256 et garantir l'absence totale de falsification des données financières ou d'ordonnancement.
- **Sauvegardes et Imports** : Exportation globale en JSON/CSV et réimportation depuis des sources externes (Excel, Trello, Asana, Notion).

### 2.2 Chef de Projet (Project Manager)
- **Fiche de Projet & Modèles** : Choix parmi les 5 modèles préconfigurés (Développement Logiciel, Campagne Marketing, Déploiement BTP, Audit de Conformité, R&D).
- **Diagramme de Gantt & Dépendances** : Ordonnancement temporel, liaison des tâches avec détection automatique des dépendances cycliques (algorithme DFS).
- **Finances & Dépenses** : Définition du devis prévisionnel, ventilation par catégories (Sous-traitance, Licences, Déplacements, Matériel), suivi des coûts de main d'œuvre calculés au temps passé et alertes de dépassement budgétaire.
- **Sprints Agile** : Organisation des itérations (1 à 4 semaines), attribution des Story Points selon la suite de Fibonacci (1, 2, 3, 5, 8, 13) et analyse de la courbe de Burndown vectorielle.
- **Matrice des Risques 5x5** : Identification préventive des menaces, calcul automatique de la criticité ($P \times I$) et formalisation des plans d'atténuation.

### 2.3 Membre d'Équipe & Contributeur (Member)
- **Tableau de Suivi & Kanban** : Déplacement fluide des tâches par glisser-déposer (*À Faire* $\rightarrow$ *En Cours* $\rightarrow$ *En Révision* $\rightarrow$ *Terminé*).
- **Chronomètre en Direct & Feuilles de Temps** : Lancement d'un clic sur la tâche active, décompte en arrière-plan et récapitulatif hebdomadaire automatique.
- **Wiki & Documentation** : Rédaction des spécifications et comptes-rendus de réunion avec formatage Markdown enrichi.
- **Forum d'Équipe** : Échanges contextuels par fil de discussion sur les problématiques de chantier.

### 2.4 Observateur & Client Partenaire (Viewer)
- **Tableau de Bord Exécutif** : Vue synthétique en lecture seule sur le taux d'achèvement, le respect des jalons clés et la santé financière globale.
- **Transparence & Portabilité** : Téléchargement d'un export RGPD de ses données en un clic.

---

## 3. Exploration des 17 Vues Opérationnelles

| N° | Vue | Description & Fonctionnalités Clés |
| :---: | :--- | :--- |
| **1** | **Tableau de Bord (Vue d'ensemble)** | Métriques d'avancement, jalons imminents, budget global et bannière d'accueil onboarding. |
| **2** | **Fiche de Projet** | Métadonnées projet, responsables, phases séquentielles, documents de cadrage et modèles. |
| **3** | **Tableau de Suivi Opérationnel** | Liste détaillée des tâches, filtres par responsable/statut/priorité, édition rapide. |
| **4** | **Tableau Kanban** | 4 colonnes statutaires (*À faire*, *En cours*, *En révision*, *Terminé*), étiquettes et badges. |
| **5** | **Planning Gantt** | Chronologie vectorielle, glissement des dates, liens de dépendance avec contrôle anti-cycle. |
| **6** | **Calendrier** | Vue mensuelle et hebdomadaire des livrables et échéances de l'équipe. |
| **7** | **Finances & Budget** | Suivi du devis alloué, calcul automatique de la main d'œuvre horaire, alertes de surcoût. |
| **8** | **Suivi du Temps (Time Tracking)** | Minuteur en temps réel, saisie manuelle rétroactive, total hebdomadaire par personne. |
| **9** | **Sprints Agile** | Backlog d'itération, points d'effort (Fibonacci), courbe Burndown idéale vs réelle. |
| **10** | **Wiki & Documentation** | Base de connaissances collaborative par projet, moteur de recherche d'articles. |
| **11** | **Gestion des Risques** | Matrice 5x5 probabilité/impact, scoring de criticité (1 à 25), registre des mesures. |
| **12** | **Forum & Discussions** | Fil d'échange d'équipe, commentaires, résolution collaborative d'anomalies. |
| **13** | **Documents & Fichiers** | Référentiel documentaire, versions, catégorisation par types de pièces. |
| **14** | **Équipe & Charge de Travail** | Vue collaborateurs, détection automatique des surcharges au-delà de 35h/semaine. |
| **15** | **Facturation & Honoraires** | Suivi commercial, bons de commande, règlements clients et TVA. |
| **16** | **Paramètres de l'Espace** | Préférences, devise, personnalisation d'apparence clair/sombre, intégrations. |
| **17** | **Sécurité & Portabilité RGPD** | Vérification d'intégrité SHA-256, téléchargement JSON Art. 20, droit à l'oubli Art. 17. |

---

## 4. Gestion Hors-Ligne & Synchronisation

1. **Fonctionnement Sans Connexion** : Toutes les modifications (création de tâche, saisie d'heures, note wiki) sont enregistrées localement dans IndexedDB.
2. **Indicateur de Statut** : La barre supérieure affiche un badge Ambre (*« Hors ligne (X en attente) »*).
3. **Réconciliation Automatique** : Dès le rétablissement de la liaison Internet, la file de mutations est rejouée avec la stratégie *Last-Write-Wins* sans perte de données.

---

## 5. Sécurité, Grand Livre d'Audit & Droits RGPD

- **Chiffrement Côté Client** : Vos documents confidentiels et notes privées sont chiffrés en `AES-GCM 256 bits` via la Web Crypto API native de votre navigateur.
- **Journal Infalsifiable** : Chaque action est scellée avec le hachage du bloc précédent. En cliquant sur *« Vérifier l'intégrité »*, le système recalcule l'empreinte de chaque bloc pour certifier l'absence d'altération.
- **Droit à la Portabilité (Art. 20)** : Téléchargez instantanément l'archive JSON structurée de l'ensemble de vos données.
- **Droit à l'Oubli (Art. 17)** : En saisissant `ANONYMISER`, vos données nominatives sont définitivement purgées et converties sous le statut neutre de collaborateur anonymisé.
