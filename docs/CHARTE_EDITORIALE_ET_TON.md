# SENTINEL GESTION — Charte Éditoriale, Vocabulaire et Ton de Marque

**Date :** 14 octobre 2026  
**Document :** `docs/CHARTE_EDITORIALE_ET_TON.md`  
**Public concerné :** Équipes produit, designers, développeurs et rédacteurs de contenu.

---

## 1. Principes Fondamentaux de la Voix SENTINEL GESTION

SENTINEL GESTION s’adresse à des décideurs, des directeurs de projet, des ingénieurs et des collaborateurs d'équipe exigeants. La voix de l'application repose sur quatre piliers :

1. **Le Vouvoiement Respectueux et Professionnel :**  
   L'application s'exprime toujours à la deuxième personne du pluriel (*« Vous pouvez planifier votre sprint »*, *« Votre budget est respecté »*). Le tutoiement est formellement proscrit.
2. **La Clarté sans Jargon :**  
   Les messages sont conçus pour être compris instantanément par un profil non technique. Aucun code d'erreur brut (ex: `Error 500`, `null pointer`, `SQL constraint`) ne doit apparaître sans explication humaine.
3. **L'Orientation vers l'Action :**  
   Tout message d'information ou d'erreur propose immédiatement la solution ou le bouton permettant de débloquer la situation.
4. **L'Élégance de la Typographie Française :**  
   Usage rigoureux des guillemets français (`« »`), des espaces insécables avant les ponctuations doubles (` :`, ` ?`, ` !`, ` ;`), et conservation des accents sur les majuscules (`É`, `À`, `È`, `Î`).

---

## 2. Lexique Canonique Obligatoire (Tableau de Correspondance)

| Terme Canonique (À Utiliser) | Termes Bannis ou Anglophones (À Éviter) | Justification & Contexte |
|---|---|---|
| **Espace de travail** | Workspace, Tenant | Entité d'organisation regroupant l'ensemble des équipes. |
| **Projet** | Dossier, Initiative, Board | Conteneur principal des livrables et de l'équipe. |
| **Phase** | Step, Étape, Stage | Découpage chronologique structuré d'un projet. |
| **Tâche** | Ticket, Item, Carte, Task | Unité de travail élémentaire assignable avec durée et statut. |
| **Jalon** | Milestone, Point de passage | Date charnière clé marquant la fin d'une phase ou une livraison. |
| **Échéance** | Deadline, Due date, Terme | Date limite impérative d'achèvement d'une tâche. |
| **Collaborateur / Membre** | User, Utilisateur, Profil | Personne physique participant à la réalisation des projets. |
| **Suivi du temps / Pointage** | Time tracking, Chrono, Log | Mesure du temps réellement passé sur une tâche. |
| **Budget & Dépenses** | Financials, Spend, Cash | Registre prévisionnel et engagé des coûts du projet. |
| **Sprints & Backlog** | Iterations, Pile de tâches | Termes admis pour les projets en méthodologie Scrum. |
| **Base de connaissances** | Knowledge base, Docspace | Espace Wiki de documentation centralisée par projet. |
| **Matrice de criticité** | Risk matrix, Tableau de risques | Outil d'évaluation croisée de probabilité et d'impact (1 à 5). |

---

## 3. Directives pour les Messages d'Erreur et d'Avertissement

* **Formule type :** `[Constat factuel simple] + [Raison claire] + [Action recommandée]`.
* **Exemple négatif :** `Erreur : cycle détecté dans le DAG des dépendances (ID: dep-404)`.
* **Exemple conforme SENTINEL GESTION :**  
  *« Liaison impossible : une boucle temporelle a été détectée. Une tâche ne peut pas précéder un élément dont elle dépend déjà. Veuillez ajuster l’ordre de vos liaisons dans le diagramme de Gantt. »*

---

## 4. Règles de Nommage dans le Code et les Données

* Toutes les interfaces utilisateur, infobulles, libellés de boutons et exports doivent respecter à 100 % ce lexique.
* Les constantes de labels affichés à l'écran sont centralisées dans [`src/lib/content/humanizedMessages.ts`](file:///c:/Users/Dell/Downloads/Sentinelle_de_Gestion/src/lib/content/humanizedMessages.ts).
