# SENTINEL GESTION — Guide Pratique d'Importation des Données

Ce guide détaille les étapes simples pour migrer vos projets et vos tâches existantes depuis votre outil actuel vers **SENTINEL GESTION**.

---

## 1. Import depuis Excel ou un Tableur (CSV)

### Format Recommandé
Votre fichier (CSV UTF-8, séparateur point-virgule `;` ou virgule `,`) doit contenir une ligne d'en-tête :
```csv
Titre;Description;Statut;Priorite;Echeance;Heures
"Finaliser le cahier des charges";"Spécifications des API et des flux";"todo";"high";"2026-10-30";"6"
"Audit de sécurité TLS 1.3";"Validation des suites cryptographiques";"in_progress";"urgent";"2026-10-25";"4"
```

### Étapes d'importation :
1. Dans la barre supérieure de SENTINEL GESTION, cliquez sur **Importer**.
2. Sélectionnez **Excel / CSV**.
3. Collez vos lignes ou ouvrez votre fichier CSV dans un éditeur pour copier son contenu.
4. Cliquez sur **Générer la prévisualisation des lignes** pour vérifier l'interprétation des colonnes.
5. Cliquez sur **Confirmer l'importation**.

---

## 2. Import depuis Trello (Export JSON)

1. Ouvrez votre tableau Trello.
2. Cliquez sur **Afficher le menu** > **Plus** > **Imprimer et exporter** > **Exporter au format JSON**.
3. Ouvrez le fichier téléchargé avec un éditeur de texte (Bloc-notes, VS Code).
4. Dans SENTINEL GESTION, cliquez sur **Importer** > onglet **Trello JSON**.
5. Collez l'intégralité du texte JSON et validez :
   - Les listes Trello sont automatiquement converties en **phases de projet**.
   - Les cartes deviennent des **tâches** avec descriptions, dates d'échéance et labels préservés.

---

## 3. Import depuis Asana (Export CSV)

1. Dans votre projet Asana, cliquez sur le menu déroulant à côté du nom du projet.
2. Choisissez **Exporter / Imprimer** > **CSV**.
3. Dans SENTINEL GESTION, cliquez sur **Importer** > onglet **Asana CSV**.
4. Collez le contenu du fichier CSV et cliquez sur **Confirmer l'importation**.

---

## 4. Import depuis Notion (Export CSV)

1. Dans votre page Notion contenant la base de données de tâches, cliquez sur `...` en haut à droite.
2. Choisissez **Export** > Format **Markdown & CSV**.
3. Décompressez l'archive et ouvrez le fichier CSV correspondant aux tâches.
4. Dans SENTINEL GESTION, cliquez sur **Importer** > onglet **Notion CSV**.
5. Collez les lignes et validez l'importation.
