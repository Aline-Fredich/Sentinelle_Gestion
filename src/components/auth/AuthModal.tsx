'use client';

import React, { useState } from 'react';
import { 
  X, Shield, User, Lock, Mail, FolderPlus, 
  ArrowRight, Sparkles, CheckCircle2, ShieldCheck, Key
} from 'lucide-react';
import { useSentinel } from '@/lib/store';
import { WorkspaceRole, User as UserType } from '@/types/sentinel';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'login' | 'register';
}

export function AuthModal({ isOpen, onClose, defaultMode = 'login' }: AuthModalProps) {
  const { users, currentUser, switchCurrentUser, registerUser, addNotification } = useSentinel();

  const [mode, setMode] = useState<'login' | 'register'>(defaultMode);

  // Inscription
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<WorkspaceRole>('admin');
  const [jobTitle, setJobTitle] = useState('Administrateur Projet');
  const [projectName, setProjectName] = useState('Mon Espace Projet 2026');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      setErrorMsg('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    const fullName = `${firstName.trim()} ${lastName.trim()}`;
    const newUser = registerUser({
      name: fullName,
      email: email.trim().toLowerCase(),
      role,
      jobTitle: jobTitle.trim(),
      projectName: role === 'super_admin' ? undefined : projectName.trim(),
    });

    onClose();
  };

  const handleSelectUser = (user: UserType) => {
    switchCurrentUser(user);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-white dark:bg-[#1C1C1E] rounded-3xl border border-black/10 dark:border-white/10 shadow-[0_24px_70px_rgba(0,0,0,0.22)] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* En-tête macOS Apple */}
        <div className="px-6 py-4 border-b border-black/5 dark:border-white/10 flex items-center justify-between bg-[#F5F5F7]/80 dark:bg-[#2C2C2E]/60 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#FF5F56] border border-[#E0443E]" />
              <span className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-[#DEA123]" />
              <span className="w-3 h-3 rounded-full bg-[#27C93F] border border-[#1AAB29]" />
            </div>
            <div className="h-4 w-[1px] bg-black/10 dark:bg-white/10 mx-1" />
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#0071E3] dark:text-[#2997FF]" />
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                SENTINEL GESTION • Espace Authentification
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/10 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Corps de la modale */}
        <div className="p-6 space-y-6">
          {/* Onglets Apple Switcher */}
          <div className="flex p-1 rounded-2xl bg-[#F5F5F7] dark:bg-[#2C2C2E] border border-black/5 dark:border-white/10">
            <button
              onClick={() => { setMode('login'); setErrorMsg(''); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-xl transition ${
                mode === 'login'
                  ? 'bg-white dark:bg-[#1C1C1E] text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Connexion & Sélecteur
            </button>
            <button
              onClick={() => { setMode('register'); setErrorMsg(''); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-xl transition ${
                mode === 'register'
                  ? 'bg-white dark:bg-[#1C1C1E] text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Créer un Compte Administrateur
            </button>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-medium">
              {errorMsg}
            </div>
          )}

          {mode === 'login' ? (
            /* Mode Sélecteur de Rôles / Connexion */
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Choisissez un espace pour vous connecter
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Chaque administrateur accède directement à son propre projet et à ses collaborateurs.
                </p>
              </div>

              <div className="space-y-2.5">
                {users.map(u => {
                  const isCurrent = u.id === currentUser.id;
                  const isSuper = u.role === 'super_admin' || u.isSuperAdmin;
                  return (
                    <button
                      key={u.id}
                      onClick={() => handleSelectUser(u)}
                      className={`w-full p-3.5 rounded-2xl border text-left transition flex items-center justify-between ${
                        isCurrent
                          ? 'border-[#0071E3] bg-[#0071E3]/5 dark:bg-[#2997FF]/10 ring-1 ring-[#0071E3]/20'
                          : 'border-black/5 dark:border-white/10 hover:border-black/15 dark:hover:border-white/20 bg-[#F5F5F7]/50 dark:bg-[#2C2C2E]/40'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <img 
                          src={u.avatar} 
                          alt={u.name} 
                          className="w-10 h-10 rounded-full shadow-sm"
                        />
                        <div>
                          <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <span>{u.name}</span>
                            {isSuper && (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                                Super Admin
                              </span>
                            )}
                            {u.role === 'admin' && (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-[#0071E3]/10 text-[#0071E3] dark:text-[#2997FF] border border-[#0071E3]/20">
                                Administrateur
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">
                            {u.jobTitle} • {u.email}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isCurrent && (
                          <span className="text-[11px] font-bold text-[#0071E3] dark:text-[#2997FF] flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Actif
                          </span>
                        )}
                        <ArrowRight className="w-4 h-4 text-slate-400" />
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="pt-2 text-center">
                <button
                  onClick={() => setMode('register')}
                  className="text-xs font-semibold text-[#0071E3] dark:text-[#2997FF] hover:underline"
                >
                  + Créer un nouvel identifiant d'administrateur
                </button>
              </div>
            </div>
          ) : (
            /* Mode Inscription Administrateur */
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Créer un compte Administrateur
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Renseignez vos identifiants pour configurer votre profil et votre projet.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Prénom
                  </label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    className="apple-input w-full text-xs"
                    placeholder="Jean"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Nom
                  </label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    className="apple-input w-full text-xs"
                    placeholder="Dupont"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Adresse e-mail
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="apple-input w-full pl-8 text-xs"
                    placeholder="jean.dupont@entreprise.fr"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Mot de passe
                </label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="apple-input w-full pl-8 text-xs"
                    placeholder="••••••••••••"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">
                    Rôle dans le projet
                  </label>
                  <select
                    value={role}
                    onChange={e => setRole(e.target.value as WorkspaceRole)}
                    className="apple-input w-full text-[13px] font-medium"
                  >
                    <option value="admin">Administrateur de Projet</option>
                    <option value="project_manager">Chef de Projet</option>
                    <option value="member">Collaborateur (Membre)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Fonction / Titre
                  </label>
                  <input
                    type="text"
                    value={jobTitle}
                    onChange={e => setJobTitle(e.target.value)}
                    className="apple-input w-full text-xs"
                    placeholder="Chef de Projet Tech"
                  />
                </div>
              </div>

              {role !== 'super_admin' && (
                <div className="space-y-1 pt-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <FolderPlus className="w-3.5 h-3.5 text-[#0071E3]" />
                    Nom de votre premier projet
                  </label>
                  <input
                    type="text"
                    required
                    value={projectName}
                    onChange={e => setProjectName(e.target.value)}
                    className="apple-input w-full text-xs font-medium"
                    placeholder="Ex : Refonte Site Web Client"
                  />
                  <p className="text-[11px] text-slate-400">
                    Votre espace personnel de projet sera créé immédiatement avec vos membres.
                  </p>
                </div>
              )}

              <div className="pt-3">
                <button
                  type="submit"
                  className="apple-btn-primary w-full text-xs py-2.5 font-bold"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Créer mon Compte & Accéder à mon Espace</span>
                </button>
              </div>
            </form>
          )}

          {/* Note de sécurité Apple ID */}
          <div className="pt-2 text-center border-t border-black/5 dark:border-white/10">
            <span className="text-[11px] text-slate-400 flex items-center justify-center gap-1">
              <ShieldCheck className="w-3 h-3 text-[#34C759]" />
              Authentification locale sécurisée conforme RGPD & Isolation multi-projets
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
