# SENTINEL GESTION — Architecture de Sécurité & Conformité RGPD

Ce document détaille l'architecture de protection en profondeur (*defense-in-depth*), la cryptographie côté client, le journal d'audit infalsifiable et les garanties de conformité au Règlement Général sur la Protection des Données (RGPD) mises en œuvre dans **SENTINEL GESTION**.

---

## 1. Principes Directeurs & Menaces Prises en Compte

| Vecteur de Menace | Risque Associé | Contre-Mesure SENTINEL GESTION |
| :--- | :--- | :--- |
| **Fuite de données au repos** | Lecture non autorisée du stockage local ou de la base | Chiffrement symétrique **AES-GCM 256 bits** avec dérivation de clé **PBKDF2-SHA256** (100 000 itérations). |
| **Injections XSS / Balises malveillantes** | Vol de session ou détournement d'interface | Échappement HTML systématique, neutralisation des pseudo-protocoles (`javascript:`, `data:`), assainissement strict des descriptions enrichies. |
| **Usurpation / Élévation de privilèges** | Exécution d'actions critiques hors rôle | Matrice d'habilitations stricte **RBAC** (Owner, Admin, Project Manager, Member, Viewer) et expiration automatique de session. |
| **Répudiation / Falsification d'historique** | Modification rétroactive des budgets ou suppressions discrètes | **Grand livre d'audit infalsifiable** avec chaînage cryptographique SHA-256 (chaque événement scelle le hachage du bloc précédent). |
| **Rupture réseau prolongée** | Perte de données en déplacement ou chantier | File d'attente locale de mutations (`PendingMutations`) et réconciliation automatique **Last-Write-Wins (LWW)** à la reconnexion. |
| **Non-conformité réglementaire** | Sanctions CNIL / RGPD | Export automatisé en format JSON ouvert (**Art. 20**) et procédure de droit à l'effacement irréversible (**Art. 17**). |

---

## 2. Module Cryptographique Côté Client (Web Crypto API)

Conformément aux préconisations de l'ANSSI, le chiffrement des données sensibles (documents, budgets confidentiels, notes de réunion privées) repose exclusivement sur la **Web Crypto API standard** intégrée aux navigateurs modernes et aux moteurs JavaScript conformes W3C.

### 2.1 Spécifications Techniques :
- **Algorithme de chiffrement** : `AES-GCM` (Galois/Counter Mode) en 256 bits, garantissant à la fois la **confidentialité** et l'**authenticité** des données.
- **Dérivation de clé** : `PBKDF2` avec fonction de hachage `SHA-256` et **100 000 itérations**.
- **Gestion des sels et vecteurs d'initialisation (IV)** :
  - Sel cryptographique aléatoire de **16 octets** généré par `crypto.getRandomValues()`.
  - Vecteur d'initialisation (IV) unique de **12 octets** pour chaque opération de chiffrement.
- **Résistance aux altérations** : Tout bit modifié dans la charge chiffrée entraîne le rejet immédiat du déchiffrement via le tag d'authentification GCM.

```typescript
// Exemple d'utilisation
const payload = await encryptSensitiveText('Budget prévisionnel confidentiel', passphrase);
const clair = await decryptSensitiveText(payload, passphrase);
```

---

## 3. Prévention XSS & Assainissement des Entrées

Toutes les données provenant de l'utilisateur ou d'importateurs externes (Excel, CSV, Trello) sont traitées comme potentiellement hostiles :
1. `escapeHtml` : Neutralise les 8 caractères critiques (`&`, `<`, `>`, `"`, `'`, `/`, `` ` ``, `=`).
2. `stripHtml` : Élimine toute balise HTML pour les champs mono-lignes (titres, noms, références).
3. `sanitizeUrl` : Vérifie rigoureusement le protocole des liens hypertextes (autorise uniquement `http:`, `https:`, `mailto:` et les chemins relatifs `/`). Rejette catégoriquement les injections de script via URI.
4. `sanitizeRichText` : Découpe et neutralise les balises actives (`<script>`, `<iframe>`, `<object>`, `<embed>`) ainsi que l'ensemble des gestionnaires d'événements JavaScript inline (`onload`, `onerror`, `onclick`).

---

## 4. Contrôle d'Accès Basé sur les Rôles (RBAC) & Sessions

### 4.1 Matrice des Habilitations

| Rôle | Gestion Espace | Projets (Créer/Suppr) | Budgets & Dépenses | Tâches & Phases | Audit Trail | Portabilité RGPD |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Owner** | ✅ | ✅ / ✅ | ✅ Lecture & Écriture | ✅ Total | ✅ Consultation | ✅ Export |
| **Admin** | ✅ | ✅ / ✅ | ✅ Lecture & Écriture | ✅ Total | ✅ Consultation | ✅ Export |
| **Project Manager** | ❌ | ✅ / ❌ | ✅ Lecture & Écriture | ✅ Total | ❌ | ✅ Export |
| **Member** | ❌ | ❌ / ❌ | ❌ | ✅ Création / Édition | ❌ | ✅ Export |
| **Viewer** | ❌ | ❌ / ❌ | ❌ | ❌ Lecture seule | ❌ | ✅ Export |

### 4.2 Politique de Gestion des Sessions :
- **Délai d'inactivité maximal** : Déconnexion automatique après **8 heures d'inactivité** consécutives.
- **Durée de vie absolue de session** : Expiration programmée au terme de **7 jours**, nécessitant un renouvellement d'authentification.

---

## 5. Journal d'Audit Infalsifiable (Chaîne SHA-256)

Pour interdire toute contestation ou falsification des opérations sensibles, **SENTINEL GESTION** intègre un journal d'événements structuré sous forme de grand livre chaîné :

$$H_i = \text{SHA-256}\Big(\text{Sequence} \parallel \text{Timestamp} \parallel \text{UserId} \parallel \text{Action} \parallel \text{EntityType} \parallel \text{EntityId} \parallel \text{CanonicalJson}(\text{Details}) \parallel H_{i-1}\Big)$$

- **Bloc Genesis** : $H_0 = \text{"0000000000000000000000000000000000000000000000000000000000000000"}$
- **Détection des anomalies** : La fonction `verifyAuditTrailIntegrity` parcourt séquentiellement la chaîne :
  - Si un montant de budget ou un horodatage est rétroactivement altéré, le recalcul du hachage échoue et pointe l'index exact.
  - Si une entrée est effacée, le lien $H_{i-1}$ du bloc suivant est immédiatement rompu.

---

## 6. Mode Hors-Ligne & Synchronisation Bidirectionnelle

SENTINEL GESTION opère selon une architecture **Offline-First** :
1. **Détection réseau native** : Écoute en continu des événements `online` et `offline` du navigateur.
2. **File d'attente des mutations (`PendingMutation`)** :
   - Chaque action de création, mise à jour ou suppression effectuée hors connexion est horodatée et placée dans la file locale persistée.
   - Si plusieurs modifications interviennent successivement sur la même entité, les charges utiles sont agrégées pour optimiser la réconciliation.
3. **Résolution de conflits Last-Write-Wins (LWW)** :
   - Lors de la reconnexion, les versions locales et distantes sont confrontées à l'aide de leur horodatage vectoriel.
   - La modification la plus récente l'emporte de façon déterministe.
4. **Indicateur visuel d'état** : Un badge interactif dans la barre supérieure informe l'utilisateur de l'état de synchronisation (*En ligne*, *Hors ligne*, *Synchronisation en cours*, *X modifications en attente*).

---

## 7. Conformité RGPD

### 7.1 Article 20 — Droit à la Portabilité des Données
Chaque collaborateur peut, en un clic depuis l'interface ou son profil, télécharger une archive JSON exhaustive regroupant :
- Ses métadonnées de profil et coordonnées professionnelles.
- L'ensemble des tâches dont il est responsable ou assigné.
- L'intégralité de son journal de saisie des temps de travail.
- L'historique de ses contributions et activités sur la plateforme.

### 7.2 Article 17 — Droit à l'Effacement (Droit à l'Oubli)
L'anonymisation est déclenchée après saisie d'un mot-clé de sécurité explicite (`ANONYMISER`) :
1. Les nom, prénom, avatar personnalisé et adresse électronique sont définitivement purgés et remplacés par une référence neutre (*« Collaborateur Anonymisé (abc123) »*).
2. L'intégrité comptable et temporelle des projets passés (heures réalisées, livrables terminés) demeure intacte pour la continuité de l'entreprise, sans qu'aucune donnée nominative ne subsiste.
3. Les notifications privées et jetons d'invitation associés sont immédiatement révoqués.
