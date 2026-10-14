# SENTINEL GESTION — Plan de Reprise d'Activité (PRA) & MCO

Ce document formalise les procédures d'urgence, la stratégie de tolérance aux pannes et le plan de Maintien en Conditions Opérationnelles (MCO) garantissant la continuité de service de **SENTINEL GESTION**.

---

## 1. Objectifs de Résilience (RTO & RPO)

| Indicateur Clé | Cible Contractuelle | Réalisation Technique SENTINEL GESTION |
| :--- | :---: | :--- |
| **RPO (Recovery Point Objective)** | $\le$ 1 minute | **Quasi-nul (< 1s)** : Toutes les mutations sont immédiatement persistées dans IndexedDB (`SentinelGestionDB`) et en mémoire locale avant réconciliation réseau. |
| **RTO (Recovery Time Objective)** | $\le$ 15 minutes | **< 3 minutes** : En cas de défaillance matérielle d'un nœud conteneurisé, redémarrage instantané via `docker compose up -d` ou bascule automatique Vercel / Cloud Run. |
| **Disponibilité Annuelle Cible** | 99.95% | Architecture Offline-First : l'indisponibilité temporaire du réseau n'empêche jamais les utilisateurs de continuer à travailler. |

---

## 2. Procédures de Sauvegarde

### 2.1 Sauvegarde Côté Client (Instantané Utilisateur)
- **Sauvegarde à Chaud** : L'utilisateur ou l'administrateur peut à tout instant cliquer sur le bouton *« Exporter »* dans la barre supérieure pour générer une archive JSON intégrale horodatée (`sentinel_export_YYYY-MM-DD.json`).
- **Sauvegarde Pré-Migration Automatique** : Tout processus de migration ascendante de données crée automatiquement une clé d'instantané horodatée (`sentinel_migration_backup_${timestamp}`) dans le stockage local avant d'exécuter la moindre mutation.

### 2.2 Sauvegarde Côté Serveur (Conteneur & Données)
- Dans le cadre d'un déploiement conteneurisé Docker / PostgreSQL, mise en place d'une tâche cron quotidienne réalisant un dump chiffré :
```bash
# Exemple de script de sauvegarde quotidienne automatisée
BACKUP_DIR="/var/backups/sentinel"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
mkdir -p "$BACKUP_DIR"

# Sauvegarde des volumes et données
docker run --rm -v sentinel_data:/data -v "$BACKUP_DIR":/backup alpine \
  tar czf "/backup/sentinel_volume_${TIMESTAMP}.tar.gz" -C /data .

# Rétention glissante sur 30 jours
find "$BACKUP_DIR" -type f -name "*.tar.gz" -mtime +30 -delete
```

---

## 3. Procédures de Restauration d'Urgence

### 3.1 Scénario 1 : Corruption de Données par Faute Utilisateur
1. Accéder au panneau d'import via le bouton *« Importer »* de la barre supérieure.
2. Sélectionner l'instantané JSON de référence le plus récent.
3. Valider l'importation : les entités sont réinjectées de façon non destructive avec détection des identifiants existants.

### 3.2 Scénario 2 : Rollback Immédiat suite à une Migration
En cas d'anomalie détectée après une migration ascendante du prototype :
```typescript
import { rollbackMigration } from '@/lib/migration/prototypeMigration';

// Restauration garantie à l'état exact antérieur
const backupKey = localStorage.getItem('sentinel_latest_backup_key');
if (backupKey) {
  rollbackMigration(backupKey);
  window.location.reload();
}
```

### 3.3 Scénario 3 : Défaillance Complète du Serveur / Hébergeur
1. Provisionner un nouveau serveur vierge (ex: VPS OVHcloud / Scaleway sous Debian 12 ou Ubuntu 24.04).
2. Installer Docker et Docker Compose.
3. Cloner le dépôt et restaurer la dernière sauvegarde d'archive.
4. Exécuter `docker compose up -d --build`.
5. Vérifier la conformité de la sonde : `curl -I http://localhost:3000/api/health` $\rightarrow$ `HTTP 200 OK`.

---

## 4. Maintien en Conditions Opérationnelles (MCO)

### 4.1 Supervision Proactive
- **Sonde `/api/health`** : Interrogation toutes les 60 secondes par un service de veille externe (Uptime Kuma, Better Stack, Datadog).
- **Alerte Dégradation** : Notification automatique de l'équipe d'astreinte si :
  - Le code HTTP $\ne$ 200.
  - L'utilisation mémoire RSS dépasse 800 Mo.
  - La chaîne d'audit détecte une rupture d'intégrité cryptographique.

### 4.2 Mises à Jour & Veille de Vulnérabilités (CVE)
- Audit trimestriel des dépendances npm : `npm audit`.
- Mise à jour des images de base Alpine : `docker compose pull && docker compose up -d`.
- Tests de non-régression automatisés : Exécution systématique de la suite de 54 tests unitaires et E2E (`npm test && npm run test:e2e`) avant tout déploiement en production.

---

## 5. Gestion des Incidents de Sécurité & Conformité RGPD

Conformément à l'Article 33 du RGPD :
1. En cas d'incident de sécurité avéré impliquant une fuite de données personnelles, l'administrateur notifie la CNIL dans un délai maximal de **72 heures**.
2. Grâce au **Grand Livre d'Audit SHA-256**, l'analyse forensique permet d'extraire la chronologie exacte des événements, les comptes utilisateurs impliqués et les entités ciblées sans risque de falsification de l'historique d'audit.
