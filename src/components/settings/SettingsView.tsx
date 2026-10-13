'use client';

import React, { useState } from 'react';
import { 
  Shield, RefreshCcw, Lock, CheckCircle2, 
  FileText, Database, ShieldAlert, Key, Globe, Eye
} from 'lucide-react';
import { useSentinel } from '@/lib/store';
import { ConfirmDialog } from '@/components/dialogs/ConfirmDialog';
import { formatRelativeTimeFrench } from '@/lib/dateUtils';

export function SettingsView() {
  const { workspace, currentUser, users, activities, resetToFactoryData } = useSentinel();
  const [activeTab, setActiveTab] = useState<'general' | 'security' | 'audit' | 'data'>('general');
  const [resetDone, setResetDone] = useState(false);
  const [showConfirmReset, setShowConfirmReset] = useState(false);

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
                  value={`${workspace.currency || '€'} (Euro)`}
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
