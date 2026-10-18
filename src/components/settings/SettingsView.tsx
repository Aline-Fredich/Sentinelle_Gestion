'use client';

import React, { useState, useEffect } from 'react';
import { 
  Shield, RefreshCcw, Lock, CheckCircle2, 
  FileText, Database, ShieldAlert, Key, Globe, Eye,
  Zap, Send, Check, AlertCircle, BellRing
} from 'lucide-react';
import { useSentinel } from '@/lib/store';
import { ConfirmDialog } from '@/components/dialogs/ConfirmDialog';
import { formatRelativeTimeFrench } from '@/lib/dateUtils';
import { 
  DEFAULT_AUTOMATION_RULES, 
  formatWebhookPayload, 
  dispatchWebhookNotification 
} from '@/lib/automations/ruleEngine';

export function SettingsView() {
  const { workspace, currentUser, users, activities, resetToFactoryData } = useSentinel();
  const [activeTab, setActiveTab] = useState<'general' | 'security' | 'audit' | 'data' | 'automations'>('general');
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
        'Test de Connexion SENTINEL GESTION',
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
    <div className="max-w-5xl space-y-6">
      {/* En-tête Paramètres */}
      <div className="p-6 bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#0066FF] dark:text-blue-400 mb-1 uppercase tracking-wider">
            <Shield className="w-3.5 h-3.5" />
            Administration & Gouvernance
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            Paramètres du Système SENTINEL GESTION
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Gérez la sécurité, les journaux d'audit certifiés et les préférences d'organisation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Sécurisé TLS 1.3 / AES-256
          </span>
        </div>
      </div>

      {/* Barre d'onglets */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 text-xs font-semibold overflow-x-auto">
        <button
          onClick={() => setActiveTab('general')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition ${
            activeTab === 'general'
              ? 'bg-[#0066FF] text-white shadow-md shadow-blue-500/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>Général & Organisation</span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition ${
            activeTab === 'security'
              ? 'bg-[#0066FF] text-white shadow-md shadow-blue-500/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>Sécurité & Rôles (RBAC)</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition ${
            activeTab === 'audit'
              ? 'bg-[#0066FF] text-white shadow-md shadow-blue-500/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Journal d’Audit de Sécurité ({activities.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('data')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition ${
            activeTab === 'data'
              ? 'bg-[#0066FF] text-white shadow-md shadow-blue-500/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Données & Sauvegardes</span>
        </button>

        <button
          onClick={() => setActiveTab('automations')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition ${
            activeTab === 'automations'
              ? 'bg-[#0066FF] text-white shadow-md shadow-blue-500/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>Automatismes & Webhooks</span>
        </button>
      </div>

      {/* CONTENU ONGLETS */}
      {activeTab === 'general' && (
        <div className="space-y-4 animate-in fade-in">
          {/* Espace de travail */}
          <div className="p-5 bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-50 text-[#0066FF] dark:bg-blue-950/50">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Espace de travail actif
                </h3>
                <p className="text-xs text-slate-500">
                  Identité et nom de l’organisation gestionnaire
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                  Nom de l’espace
                </label>
                <input
                  type="text"
                  disabled
                  value={workspace.name}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium"
                />
              </div>
              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                  Identifiant d’accès (Slug)
                </label>
                <input
                  type="text"
                  disabled
                  value={workspace.slug}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono"
                />
              </div>
            </div>
          </div>

          {/* Préférences régionales */}
          <div className="p-5 bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Préférences régionales & Fuseau horaire
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                  Langue officielle
                </label>
                <input
                  type="text"
                  disabled
                  value="Français (France)"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium"
                />
              </div>
              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                  Fuseau horaire
                </label>
                <input
                  type="text"
                  disabled
                  value={workspace.timezone || 'Europe/Paris'}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium"
                />
              </div>
              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                  Devise par défaut
                </label>
                <input
                  type="text"
                  disabled
                  value={`${workspace.currency || 'FCFA'} (Franc CFA CEMAC - République du Congo)`}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'security' && (
        <div className="space-y-4 animate-in fade-in">
          {/* Politique de Sécurité */}
          <div className="p-5 bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-red-50 text-[#FF1E27] dark:bg-red-950/50">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Contrôle d’Accès Basé sur les Rôles (RBAC)
                </h3>
                <p className="text-xs text-slate-500">
                  Hiérarchie des privilèges opérationnels
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 space-y-1">
                <span className="font-bold text-slate-900 dark:text-white block">
                  Propriétaire & Administrateurs ({users.filter(u => u.role === 'owner' || u.role === 'admin').length})
                </span>
                <p className="text-slate-500 text-[11px]">
                  Gestion des forfaits, suppression de projet, export total des audits et modifications structurelles.
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 space-y-1">
                <span className="font-bold text-slate-900 dark:text-white block">
                  Chefs de Projet & Membres ({users.filter(u => u.role === 'project_manager' || u.role === 'member').length})
                </span>
                <p className="text-slate-500 text-[11px]">
                  Gestion quotidienne des tâches, pointage du temps, création de sprints et alimentation de la documentation.
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-600 dark:text-slate-400">
                Votre session actuelle : <strong className="text-[#0066FF]">{currentUser.name}</strong> ({currentUser.jobTitle})
              </span>
              <span className="text-[11px] font-mono px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                Rôle : {currentUser.role}
              </span>
            </div>
          </div>

          <div className="p-5 bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Key className="w-4 h-4 text-[#0066FF]" />
              Conformité & Intégrité Cryptographique
            </h3>
            <p className="text-xs text-slate-500">
              Toutes les données en transit et au repos respectent les préconisations ANSSI pour les systèmes de pilotage critique.
            </p>
          </div>
        </div>
      )}

      {activeTab === 'audit' && (
        <div className="bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden animate-in fade-in">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Journal d’Audit Immuable
              </h3>
              <p className="text-xs text-slate-500">
                Traçabilité des opérations de modification et de connexion
              </p>
            </div>
            <span className="text-xs text-[#0066FF] font-bold flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" /> Enregistrement continu
            </span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {activities.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                Aucun événement d’audit enregistré.
              </div>
            ) : (
              activities.map(item => (
                <div key={item.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                  <div className="space-y-0.5">
                    <span className="font-semibold text-slate-900 dark:text-white block">
                      {item.description}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Par <strong>{item.userName}</strong> • Action : <code className="text-[#0066FF]">{item.actionType}</code>
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">
                    {formatRelativeTimeFrench(item.createdAt)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'data' && (
        <div className="space-y-4 animate-in fade-in">
          {/* Persistance locale IndexedDB */}
          <div className="p-5 bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-[#0066FF]" />
              Stockage Local IndexedDB (Dexie Engine)
            </h3>
            <p className="text-xs text-slate-500">
              Le moteur local indexe 18 tables avec synchronisation immédiate et tolérance aux déconnexions (Offline-First).
            </p>
          </div>

          {/* Réinitialisation */}
          <div className="p-5 bg-white dark:bg-[#0F172A] rounded-2xl border border-red-200 dark:border-red-900/40 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <ShieldAlert className="w-4 h-4" />
              <h3 className="text-sm font-bold">
                Zone Dangereuse : Réinitialisation d’Usine
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              Rétablissez l’ensemble des projets, phases, tâches réelles, budgets, sprints et risques à leur configuration initiale d’usine.
            </p>

            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmReset(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl transition shadow-sm"
              >
                <RefreshCcw className="w-4 h-4" />
                <span>Rétablir les données d’usine</span>
              </button>
              {resetDone && (
                <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Données réinitialisées avec succès !
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ONGLET AUTOMATISMES & WEBHOOKS */}
      {activeTab === 'automations' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Règles d'Automatismes */}
          <div className="p-5 bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-50 text-[#0066FF] dark:bg-blue-950/50">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Règles Actives & Déclencheurs Événementiels
                  </h3>
                  <p className="text-xs text-slate-500">
                    Exécution automatique d’actions réactives (« Si ceci alors cela »)
                  </p>
                </div>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-[#0066FF] border border-blue-200 dark:border-blue-900">
                {rules.filter(r => r.enabled).length} / {rules.length} actives
              </span>
            </div>

            <div className="space-y-3 pt-2">
              {rules.map(rule => (
                <div 
                  key={rule.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {rule.name}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {rule.trigger}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {rule.description}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleRule(rule.id)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                      rule.enabled ? 'bg-[#0066FF]' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        rule.enabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Connecteurs Webhooks Sortants */}
          <div className="p-5 bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/50">
                <BellRing className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Connecteur Webhooks Sortants (Slack / Teams / Generic)
                </h3>
                <p className="text-xs text-slate-500">
                  Diffusez instantanément les alertes et jalons vers vos canaux d’équipe
                </p>
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Plateforme Cible
                  </label>
                  <select
                    value={webhookPlatform}
                    onChange={e => setWebhookPlatform(e.target.value as 'slack' | 'teams' | 'generic')}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0066FF]"
                  >
                    <option value="slack">Slack Incoming Webhook</option>
                    <option value="teams">Microsoft Teams MessageCard</option>
                    <option value="generic">Générique JSON (Custom API / Zapier)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Statut du connecteur
                  </label>
                  <div className="flex items-center gap-3 h-[38px]">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={webhookEnabled}
                        onChange={e => setWebhookEnabled(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0066FF]"></div>
                    </label>
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                      {webhookEnabled ? 'Actif en temps réel' : 'Désactivé'}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  URL du Webhook (Sécurisée HTTPS)
                </label>
                <input
                  type="url"
                  value={webhookUrl}
                  onChange={e => setWebhookUrl(e.target.value)}
                  placeholder="https://hooks.slack.com/services/... ou https://outlook.office.com/webhook/..."
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-[#0066FF]"
                />
              </div>

              {testResult && (
                <div className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                  testResult.success
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                    : 'bg-red-50 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800'
                }`}>
                  {testResult.success ? (
                    <Check className="w-4 h-4 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  )}
                  <span>{testResult.message}</span>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleSaveWebhookConfig}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#0066FF] hover:bg-blue-600 text-white text-xs font-semibold rounded-xl transition shadow-sm"
                >
                  <Check className="w-4 h-4" />
                  <span>Enregistrer la configuration</span>
                </button>

                <button
                  type="button"
                  onClick={handleTestWebhook}
                  disabled={testResult?.testing}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-xl transition border border-slate-200 dark:border-slate-700 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{testResult?.testing ? 'Envoi en cours...' : 'Tester le Webhook'}</span>
                </button>

                {saveSuccess && (
                  <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Configuration enregistrée !
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
        message="Voulez-vous réinitialiser toutes les données aux valeurs d'origine ? Toutes les modifications locales (projets, tâches, finances, temps, sprints, wiki, risques) seront restaurées à leur état initial."
        confirmLabel="Oui, réinitialiser"
        cancelLabel="Annuler"
        variant="danger"
        onConfirm={handleConfirmReset}
        onCancel={() => setShowConfirmReset(false)}
      />
    </div>
  );
}
