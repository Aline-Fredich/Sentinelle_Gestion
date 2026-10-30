'use client';

import React, { useState, useEffect } from 'react';
import { 
  Shield, RefreshCcw, Lock, CheckCircle2, 
  FileText, Database, ShieldAlert, Key, Globe, Eye,
  Zap, Send, Check, AlertCircle, BellRing, Palette, Sparkles, Sliders
} from 'lucide-react';
import { useSentinel } from '@/lib/store';
import { AppearanceSelector } from '@/components/theme/AppearanceSelector';
import { useTheme } from '@/context/ThemeContext';
import { ConfirmDialog } from '@/components/dialogs/ConfirmDialog';
import { formatRelativeTimeFrench } from '@/lib/dateUtils';
import { 
  DEFAULT_AUTOMATION_RULES, 
  formatWebhookPayload, 
  dispatchWebhookNotification 
} from '@/lib/automations/ruleEngine';

export function SettingsView() {
  const { workspace, currentUser, users, activities, resetToFactoryData } = useSentinel();
  const { themeData } = useTheme();
  const [activeTab, setActiveTab] = useState<'general' | 'appearance' | 'security' | 'audit' | 'data' | 'automations'>('appearance');
  const [resetDone, setResetDone] = useState(false);
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  // Configuration Webhooks & Automatismes
  const [rules, setRules] = useState(DEFAULT_AUTOMATION_RULES);
  const [webhookPlatform, setWebhookPlatform] = useState<'slack' | 'teams' | 'generic'>('slack');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookEnabled, setWebhookEnabled] = useState(false);
  const [testResult, setTestResult] = useState<{ testing: boolean; success?: boolean; message?: string } | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('sentinel_webhook_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.platform) setWebhookPlatform(parsed.platform);
        if (parsed.url) setWebhookUrl(parsed.url);
        if (typeof parsed.enabled === 'boolean') setWebhookEnabled(parsed.enabled);
      }
    } catch {
      // Ignorer
    }
  }, []);

  const handleSaveWebhookConfig = () => {
    try {
      localStorage.setItem('sentinel_webhook_config', JSON.stringify({
        platform: webhookPlatform,
        url: webhookUrl,
        enabled: webhookEnabled,
      }));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch {
      // Ignorer
    }
  };

  const handleTestWebhook = async () => {
    if (!webhookUrl || !webhookUrl.startsWith('https://')) {
      setTestResult({ testing: false, success: false, message: 'Veuillez saisir une URL HTTPS valide (ex: https://hooks.slack.com/...)' });
      return;
    }
    setTestResult({ testing: true });
    try {
      const payload = formatWebhookPayload(
        webhookPlatform,
        'Test de Connexion SENTINELLE DE GESTION',
        'Le connecteur Webhook fonctionne avec succès depuis votre instance Sentinel.',
        'Projet Démonstration'
      );
      const res = await dispatchWebhookNotification(webhookUrl, payload);
      setTestResult({
        testing: false,
        success: res.success,
        message: res.success ? 'Notification test envoyée avec succès !' : (res.error || 'Échec de transmission'),
      });
    } catch (err) {
      setTestResult({
        testing: false,
        success: false,
        message: (err as Error).message,
      });
    }
  };

  const toggleRule = (ruleId: string) => {
    setRules(prev => prev.map(r => r.id === ruleId ? { ...r, enabled: !r.enabled } : r));
  };

  const handleConfirmReset = () => {
    resetToFactoryData();
    setShowConfirmReset(false);
    setResetDone(true);
    setTimeout(() => setResetDone(false), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* En-tête Paramètres */}
      <div className="panel flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-micro font-bold text-red mb-1 uppercase tracking-wider">
            <Shield className="w-3.5 h-3.5 text-red" />
            ADMINISTRATION & GOUVERNANCE
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red shadow-[var(--glow-sm)]" />
            <h1 className="text-base font-bold text-white uppercase tracking-wider">
              PARAMÈTRES DU SYSTÈME SENTINELLE
            </h1>
          </div>
          <p className="text-xs text-white/45 mt-1">
            Gérez la sécurité, les journaux d'audit certifiés et les préférences d'organisation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="badge badge--ok text-micro">
            SÉCURISÉ TLS 1.3 / AES-256
          </span>
        </div>
      </div>

      {/* Barre d'onglets */}
      <div className="tabs">
        <button
          data-testid="tab-appearance"
          onClick={() => setActiveTab('appearance')}
          aria-selected={activeTab === 'appearance'}
          className="tab flex items-center gap-2"
        >
          <Palette className="w-3.5 h-3.5" />
          <span>APPARENCE & THÈMES</span>
        </button>

        <button
          onClick={() => setActiveTab('general')}
          aria-selected={activeTab === 'general'}
          className="tab flex items-center gap-2"
        >
          <Globe className="w-3.5 h-3.5" />
          <span>GÉNÉRAL & ORGANISATION</span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          aria-selected={activeTab === 'security'}
          className="tab flex items-center gap-2"
        >
          <Lock className="w-3.5 h-3.5" />
          <span>SÉCURITÉ & RÔLES (RBAC)</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          aria-selected={activeTab === 'audit'}
          className="tab flex items-center gap-2"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>JOURNAL D’AUDIT ({activities.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('data')}
          aria-selected={activeTab === 'data'}
          className="tab flex items-center gap-2"
        >
          <Database className="w-3.5 h-3.5" />
          <span>DONNÉES & SAUVEGARDES</span>
        </button>

        <button
          onClick={() => setActiveTab('automations')}
          aria-selected={activeTab === 'automations'}
          className="tab flex items-center gap-2"
        >
          <Zap className="w-3.5 h-3.5" />
          <span>AUTOMATISMES & WEBHOOKS</span>
        </button>
      </div>

      {/* CONTENU ONGLETS */}
      {activeTab === 'appearance' && (
        <div className="space-y-6">
          {/* Panneau de sélection de thèmes */}
          <div className="panel space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-[var(--border)]">
              <div>
                <h3 className="panel-title mb-1 flex items-center gap-2">
                  <Palette className="w-4 h-4 text-[var(--brand)]" />
                  LES 4 THÈMES DE FOND DE L'APPLICATION
                </h3>
                <p className="text-xs text-[var(--text-muted)]">
                  Sélectionnez la couleur de fond de tout le logiciel (Blanc, Noir, Bleu, Bleu de nuit). Le choix s’applique instantanément et s’adapte à vos préférences.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="badge badge--info text-micro">
                  THÈME ACTIF : {themeData.label.toUpperCase()}
                </span>
              </div>
            </div>

            {/* Sélecteur des 4 thèmes avec maquettes miniatures */}
            <div className="pt-2">
              <AppearanceSelector layout="grid" showDescriptions={true} />
            </div>
          </div>

          {/* Démonstrateur d'éléments réactifs en direct */}
          <div className="panel space-y-4">
            <h3 className="panel-title mb-0">
              <Sliders className="w-4 h-4 text-[var(--color-primary)]" />
              APERÇU DES COMPOSANTS EN DIRECT
            </h3>
            <p className="text-xs text-[#AAB4C3]">
              Visualisez le comportement immédiat des composants avec le thème actif :
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {/* Carte Boutons */}
              <div className="card-inner space-y-3">
                <div className="text-[11px] font-bold text-white uppercase font-mono">Boutons & Actions</div>
                <div className="flex flex-col gap-2">
                  <button className="btn btn-primary btn-sm w-full">
                    <Sparkles className="w-3.5 h-3.5" /> Action Principale
                  </button>
                  <button className="btn btn-secondary btn-sm w-full">
                    Action Secondaire
                  </button>
                  <button className="btn btn-outline btn-sm w-full">
                    Contour Accent
                  </button>
                </div>
              </div>

              {/* Carte Formulaires & Focus */}
              <div className="card-inner space-y-3">
                <div className="text-[11px] font-bold text-white uppercase font-mono">Champs & Focus</div>
                <div className="space-y-2">
                  <input
                    type="text"
                    defaultValue="Champ actif avec lueur"
                    className="form-input text-xs"
                    readOnly
                  />
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#AAB4C3]">Indicateur d’état</span>
                    <span className="status-dot status-dot--off" />
                  </div>
                </div>
              </div>

              {/* Carte Badges & Rôles */}
              <div className="card-inner space-y-3">
                <div className="text-[11px] font-bold text-white uppercase font-mono">Badges & Rôles</div>
                <div className="flex flex-wrap gap-2 pt-1">
                  <span className="badge-role">SUPER ADMIN</span>
                  <span className="badge badge--bad">CRITIQUE</span>
                  <span className="badge badge--info">INFORMATIF</span>
                  <span className="badge badge--ok">CONFORME</span>
                </div>
              </div>
            </div>
          </div>

          {/* Spécification et principes de conception */}
          <div className="panel space-y-3 bg-[#0D0D0D] border-[#303641]">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
              <Check className="w-4 h-4 text-[var(--color-primary)]" />
              Principes de la charte graphique SENTINEL GESTION
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-[#AAB4C3] pt-1">
              <div className="p-3 rounded bg-[#101216] border border-[#303641]">
                <strong className="text-white block mb-1">1. Base sombre unifiée</strong>
                Les deux thèmes partagent la même base sombre (#050505 et #101216) garantissant un confort visuel maximal et un contraste parfait.
              </div>
              <div className="p-3 rounded bg-[#101216] border border-[#303641]">
                <strong className="text-white block mb-1">2. Inversion sémantique</strong>
                Le bleu et le rouge sont présents dans les deux thèmes. En Sentinel Blue, le bleu domine ; en Sentinel Red, le rouge vif prend le pas tout en conservant les touches cyan.
              </div>
              <div className="p-3 rounded bg-[#101216] border border-[#303641]">
                <strong className="text-white block mb-1">3. Zéro duplication</strong>
                Toutes les nuances reposent sur des design tokens CSS centralisés. Aucune logique métier ni donnée n'est altérée par le changement d'apparence.
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'general' && (
        <div className="space-y-4">
          {/* Espace de travail */}
          <div className="panel space-y-4">
            <h3 className="panel-title mb-0">
              <Shield className="w-4 h-4 text-red" />
              ESPACE DE TRAVAIL ACTIF
            </h3>

            <div className="form-row text-xs">
              <div className="form-group mb-0">
                <label className="form-label">
                  Nom de l’espace
                </label>
                <input
                  type="text"
                  disabled
                  value={workspace.name}
                  className="form-input opacity-70"
                />
              </div>
              <div className="form-group mb-0">
                <label className="form-label">
                  Identifiant d’accès (Slug)
                </label>
                <input
                  type="text"
                  disabled
                  value={workspace.slug}
                  className="form-input font-mono opacity-70"
                />
              </div>
            </div>
          </div>

          {/* Préférences régionales */}
          <div className="panel space-y-4">
            <h3 className="panel-title mb-0">
              <Globe className="w-4 h-4 text-red" />
              PRÉFÉRENCES RÉGIONALES & DEVISE OFFICIELLE
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="form-group mb-0">
                <label className="form-label">
                  Langue officielle
                </label>
                <input
                  type="text"
                  disabled
                  value="Français (France / CEMAC)"
                  className="form-input opacity-70"
                />
              </div>
              <div className="form-group mb-0">
                <label className="form-label">
                  Fuseau horaire
                </label>
                <input
                  type="text"
                  disabled
                  value={workspace.timezone || 'Africa/Brazzaville'}
                  className="form-input font-mono opacity-70"
                />
              </div>
              <div className="form-group mb-0">
                <label className="form-label">
                  Devise par défaut
                </label>
                <input
                  type="text"
                  disabled
                  value={`${workspace.currency || 'FCFA'} (Franc CFA CEMAC - Congo)`}
                  className="form-input font-mono opacity-70"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'security' && (
        <div className="space-y-4">
          {/* Politique de Sécurité */}
          <div className="panel space-y-4">
            <h3 className="panel-title mb-0">
              <Lock className="w-4 h-4 text-red" />
              CONTRÔLE D’ACCÈS BASÉ SUR LES RÔLES (RBAC)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="card-inner space-y-1">
                <span className="font-bold text-white uppercase block">
                  Propriétaire & Administrateurs ({users.filter(u => u.role === 'owner' || u.role === 'admin').length})
                </span>
                <p className="text-white/45 text-micro">
                  Gestion des forfaits, suppression de projet, export total des audits et modifications structurelles.
                </p>
              </div>

              <div className="card-inner space-y-1">
                <span className="font-bold text-white uppercase block">
                  Chefs de Projet & Membres ({users.filter(u => u.role === 'project_manager' || u.role === 'member').length})
                </span>
                <p className="text-white/45 text-micro">
                  Gestion quotidienne des tâches, pointage du temps, création de sprints et alimentation de la documentation.
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-[#242424] flex items-center justify-between text-xs">
              <span className="text-white/70">
                Session active : <strong className="text-red uppercase">{currentUser.name}</strong> ({currentUser.jobTitle})
              </span>
              <span className="badge badge--ok text-micro">
                RÔLE : {currentUser.role.toUpperCase()}
              </span>
            </div>
          </div>

          <div className="panel space-y-2">
            <h3 className="panel-title mb-0">
              <Key className="w-4 h-4 text-red" />
              CONFORMITÉ & INTÉGRITÉ CRYPTOGRAPHIQUE
            </h3>
            <p className="text-xs text-white/45">
              Toutes les données en transit et au repos respectent les préconisations de sécurité pour les systèmes de pilotage critique.
            </p>
          </div>
        </div>
      )}

      {activeTab === 'audit' && (
        <div className="panel space-y-4">
          <div className="flex items-center justify-between border-b border-[#242424] pb-3">
            <div>
              <h3 className="panel-title mb-0">
                <Eye className="w-4 h-4 text-red" />
                JOURNAL D’AUDIT IMMUABLE
              </h3>
              <p className="text-xs text-white/45">
                Traçabilité des opérations de modification et de connexion
              </p>
            </div>
            <span className="badge badge--ok text-micro">
              ENREGISTREMENT CONTINU
            </span>
          </div>

          <div className="divide-y divide-[#242424] text-xs">
            {activities.length === 0 ? (
              <div className="table-empty">
                Aucun événement d’audit enregistré.
              </div>
            ) : (
              activities.map(item => (
                <div key={item.id} className="py-3 flex items-center justify-between hover:bg-red/5 transition">
                  <div className="space-y-0.5">
                    <span className="font-bold text-white block uppercase text-xs">
                      {item.description}
                    </span>
                    <span className="text-micro text-white/45">
                      Par <strong>{item.userName}</strong> • Action : <code className="tag-mono">{item.actionType}</code>
                    </span>
                  </div>
                  <span className="text-micro font-mono text-white/45">
                    {formatRelativeTimeFrench(item.createdAt)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'data' && (
        <div className="space-y-4">
          {/* Persistance locale */}
          <div className="panel space-y-2">
            <h3 className="panel-title mb-0">
              <Database className="w-4 h-4 text-red" />
              STOCKAGE LOCAL INDEXEDDB (OFFLINE-FIRST)
            </h3>
            <p className="text-xs text-white/45">
              Le moteur local indexe les tables avec synchronisation immédiate et tolérance aux déconnexions.
            </p>
          </div>

          {/* Réinitialisation */}
          <div className="panel border-red space-y-3">
            <div className="flex items-center gap-2 text-red">
              <ShieldAlert className="w-5 h-5 text-red" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                ZONE CRITIQUE : RÉINITIALISATION D’USINE
              </h3>
            </div>
            <p className="text-xs text-white/70">
              Rétablissez l’ensemble des projets, phases, tâches réelles, budgets, sprints et risques à leur configuration initiale d’usine.
            </p>

            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmReset(true)}
                className="btn btn-danger btn-sm"
              >
                <RefreshCcw className="w-3.5 h-3.5 text-white" />
                <span>RÉTABLIR LES DONNÉES D’USINE</span>
              </button>
              {resetDone && (
                <span className="badge badge--ok text-xs">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Données réinitialisées !
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ONGLET AUTOMATISMES & WEBHOOKS */}
      {activeTab === 'automations' && (
        <div className="space-y-4">
          {/* Règles d'Automatismes */}
          <div className="panel space-y-4">
            <div className="flex items-center justify-between border-b border-[#242424] pb-3">
              <h3 className="panel-title mb-0">
                <Zap className="w-4 h-4 text-red" />
                RÈGLES ACTIVES & DÉCLENCHEURS ÉVÉNEMENTIELS
              </h3>
              <span className="badge font-mono">
                {rules.filter(r => r.enabled).length} / {rules.length} ACTIVES
              </span>
            </div>

            <div className="space-y-3">
              {rules.map(rule => (
                <div 
                  key={rule.id}
                  className="card-inner flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white uppercase tracking-wide">
                        {rule.name}
                      </span>
                      <span className="tag-mono text-[10px]">
                        {rule.trigger}
                      </span>
                    </div>
                    <p className="text-micro text-white/45">
                      {rule.description}
                    </p>
                  </div>

                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={rule.enabled}
                      onChange={() => toggleRule(rule.id)}
                    />
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Connecteurs Webhooks Sortants */}
          <div className="panel space-y-4">
            <h3 className="panel-title mb-0">
              <BellRing className="w-4 h-4 text-red" />
              CONNECTEUR WEBHOOKS SORTANTS (SLACK / TEAMS / GÉNÉRIQUE)
            </h3>

            <div className="space-y-4">
              <div className="form-row">
                <div className="form-group mb-0">
                  <label className="form-label">
                    Plateforme Cible
                  </label>
                  <select
                    value={webhookPlatform}
                    onChange={e => setWebhookPlatform(e.target.value as 'slack' | 'teams' | 'generic')}
                    className="form-select uppercase font-bold text-xs"
                  >
                    <option value="slack">Slack Incoming Webhook</option>
                    <option value="teams">Microsoft Teams MessageCard</option>
                    <option value="generic">Générique JSON (Custom API / Zapier)</option>
                  </select>
                </div>

                <div className="form-group mb-0">
                  <label className="form-label">
                    Statut du connecteur
                  </label>
                  <div className="flex items-center gap-3 h-[40px]">
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={webhookEnabled}
                        onChange={e => setWebhookEnabled(e.target.checked)}
                      />
                    </label>
                    <span className="text-xs font-bold uppercase text-white/70">
                      {webhookEnabled ? 'ACTIF EN TEMPS RÉEL' : 'DÉSACTIVÉ'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="form-group mb-0">
                <label className="form-label">
                  URL du Webhook (HTTPS Sécurisée)
                </label>
                <input
                  type="url"
                  value={webhookUrl}
                  onChange={e => setWebhookUrl(e.target.value)}
                  placeholder="https://hooks.slack.com/services/... ou https://outlook.office.com/webhook/..."
                  className="form-input font-mono text-xs"
                />
              </div>

              {testResult && (
                <div className={testResult.success ? 'alert text-xs' : 'alert alert--error text-xs'}>
                  {testResult.success ? (
                    <Check className="w-4 h-4 mr-1 inline" />
                  ) : (
                    <AlertCircle className="w-4 h-4 mr-1 inline text-red" />
                  )}
                  <span>{testResult.message}</span>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleSaveWebhookConfig}
                  className="btn btn-primary btn-sm"
                >
                  <Check className="w-3.5 h-3.5 text-white" />
                  <span>ENREGISTRER LA CONFIGURATION</span>
                </button>

                <button
                  type="button"
                  onClick={handleTestWebhook}
                  disabled={testResult?.testing}
                  className="btn btn-secondary btn-sm"
                >
                  <Send className="w-3.5 h-3.5 text-red" />
                  <span>{testResult?.testing ? 'ENVOI EN COURS...' : 'TESTER LE WEBHOOK'}</span>
                </button>

                {saveSuccess && (
                  <span className="badge badge--ok text-xs">
                    <CheckCircle2 className="w-3 h-3 mr-1" /> CONFIGURATION ENREGISTRÉE !
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={showConfirmReset}
        title="Réinitialiser les données d’usine"
        message="Voulez-vous réinitialiser toutes les données aux valeurs d'origine ? Toutes les modifications locales seront restaurées à leur état initial."
        confirmLabel="Oui, réinitialiser"
        cancelLabel="Annuler"
        variant="danger"
        onConfirm={handleConfirmReset}
        onCancel={() => setShowConfirmReset(false)}
      />
    </div>
  );
}
