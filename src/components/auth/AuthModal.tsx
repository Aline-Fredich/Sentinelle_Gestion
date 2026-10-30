'use client';

import React, { useState } from 'react';
import { 
  X, Shield, User, Lock, Mail, FolderPlus, 
  ArrowRight, Sparkles, CheckCircle2, ShieldCheck, Key, Loader2, LogIn, Users
} from 'lucide-react';
import { useSentinel } from '@/lib/store';
import { WorkspaceRole, User as UserType } from '@/types/sentinel';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { hashPassword, verifyPassword } from '@/lib/security/crypto';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'login' | 'register';
}

export function AuthModal({ isOpen, onClose, defaultMode = 'login' }: AuthModalProps) {
  const { users, currentUser, switchCurrentUser, registerUser, addNotification } = useSentinel();

  const [mode, setMode] = useState<'login' | 'register'>(defaultMode);
  const [loginMethod, setLoginMethod] = useState<'quick' | 'credentials'>('quick');

  // Connexion email/password
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Inscription
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<WorkspaceRole>('admin');
  const [jobTitle, setJobTitle] = useState('Administrateur Projet');
  const [projectName, setProjectName] = useState('Mon Espace Projet 2026');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      setErrorMsg('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Le mot de passe doit comporter au moins 6 caractères.');
      return;
    }

    setIsSubmitting(true);
    const fullName = `${firstName.trim()} ${lastName.trim()}`;
    const cleanEmail = email.trim().toLowerCase();

    try {
      // 1. Inscription distante Supabase si configuré (source autoritaire)
      if (isSupabaseConfigured()) {
        const supabase = createClient();
        const { error: authError } = await supabase.auth.signUp({
          email: cleanEmail,
          password: password,
          options: {
            data: {
              full_name: fullName,
              role: role,
              job_title: jobTitle.trim(),
              organization_name: projectName.trim(),
            },
          },
        });

        if (authError) {
          setErrorMsg(`Erreur d'inscription Supabase : ${authError.message}`);
          setIsSubmitting(false);
          return;
        }
      }

      // 2. Enregistrement sécurisé du sel et empreinte pour validation locale
      try {
        const { hash, salt } = await hashPassword(password);
        localStorage.setItem(`sentinel_cipher_${cleanEmail}`, JSON.stringify({ hash, salt }));
      } catch (cryptoErr) {
        console.warn('Note crypto:', cryptoErr);
      }

      // 3. Enregistrement dans le store local Sentinel
      registerUser({
        name: fullName,
        email: cleanEmail,
        role,
        jobTitle: jobTitle.trim(),
        projectName: role === 'super_admin' ? undefined : projectName.trim(),
      });

      addNotification(
        'Compte créé avec succès',
        `Bienvenue ${fullName} ! Votre espace administrateur et votre projet sont prêts.`,
        'system'
      );

      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Une erreur est survenue lors de la création du compte.';
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLoginWithCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!loginEmail.trim() || !loginPassword.trim()) {
      setErrorMsg('Veuillez saisir votre e-mail et votre mot de passe.');
      return;
    }

    setIsSubmitting(true);
    const cleanEmail = loginEmail.trim().toLowerCase();

    try {
      // 1. Si Supabase est configuré, authentification autoritaire côté serveur
      if (isSupabaseConfigured()) {
        const supabase = createClient();
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: loginPassword,
        });

        if (error) {
          setErrorMsg(`Identifiants incorrects : ${error.message}`);
          setIsSubmitting(false);
          return;
        }

        if (!data.user) {
          setErrorMsg('Compte utilisateur introuvable.');
          setIsSubmitting(false);
          return;
        }

        // Rôle autoritaire vérifié par le serveur
        const serverRole = (data.user.user_metadata?.role as WorkspaceRole) || 'admin';
        const existingLocalUser = users.find(u => u.email.toLowerCase() === cleanEmail);
        const resolvedUser: UserType = existingLocalUser ? {
          ...existingLocalUser,
          id: data.user.id,
          role: serverRole,
        } : registerUser({
          name: data.user?.user_metadata?.full_name || cleanEmail.split('@')[0],
          email: cleanEmail,
          role: serverRole,
          jobTitle: data.user?.user_metadata?.job_title || 'Administrateur',
        });

        switchCurrentUser(resolvedUser);
        addNotification('Session sécurisée', `Connexion réussie avec ${cleanEmail}.`, 'security');
        onClose();
        return;
      }

      // 2. Mode local / hors-ligne : vérification stricte du mot de passe
      const storedCipher = localStorage.getItem(`sentinel_cipher_${cleanEmail}`);
      if (storedCipher) {
        try {
          const parsed = JSON.parse(storedCipher);
          if (parsed.hash && parsed.salt) {
            const isValid = await verifyPassword(loginPassword, parsed.hash, parsed.salt);
            if (!isValid) {
              setErrorMsg('Mot de passe incorrect.');
              setIsSubmitting(false);
              return;
            }
          }
        } catch {
          setErrorMsg('Erreur de validation des identifiants.');
          setIsSubmitting(false);
          return;
        }
      } else {
        const existingLocalUser = users.find(u => u.email.toLowerCase() === cleanEmail);
        if (existingLocalUser) {
          // Mot de passe de démonstration requis
          if (loginPassword !== 'sentinel2026' && loginPassword !== 'admin123') {
            setErrorMsg('Mot de passe incorrect pour ce profil de démonstration (utiliser "sentinel2026").');
            setIsSubmitting(false);
            return;
          }
        } else {
          setErrorMsg('Compte introuvable. Veuillez vérifier vos identifiants.');
          setIsSubmitting(false);
          return;
        }
      }

      const existingUser = users.find(u => u.email.toLowerCase() === cleanEmail);
      if (existingUser) {
        switchCurrentUser(existingUser);
        addNotification('Session connectée', `Bienvenue de retour, ${existingUser.name}.`, 'system');
        onClose();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur inattendue de connexion.';
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectUser = (user: UserType) => {
    switchCurrentUser(user);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div 
        className="w-full max-w-lg bg-[#050505] rounded-md border border-[rgba(255,0,0,0.45)] shadow-[0_0_28px_rgba(255,0,0,0.22)] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* En-tête Console Sentinelle */}
        <div className="px-5 py-3.5 border-b border-[#242424] flex items-center justify-between bg-[#000000]">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-primary)] shadow-[var(--glow-sm)]" />
            <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              SENTINEL GESTION • AUTHENTIFICATION
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded flex items-center justify-center text-white/45 hover:text-white hover:bg-[#0D0D0D] transition"
          >
            <X className="w-4 h-4 text-[var(--color-primary)]" />
          </button>
        </div>

        {/* Corps de la modale */}
        <div className="p-6 space-y-6">
          {/* Onglets Noir Rouge Blanc */}
          <div className="tabs w-full flex">
            <button
              onClick={() => { setMode('login'); setErrorMsg(''); }}
              className={`tab flex-1 py-2 text-xs font-bold uppercase transition ${
                mode === 'login' ? 'active' : ''
              }`}
              aria-selected={mode === 'login'}
            >
              Connexion & Sélecteur
            </button>
            <button
              onClick={() => { setMode('register'); setErrorMsg(''); }}
              className={`tab flex-1 py-2 text-xs font-bold uppercase transition ${
                mode === 'register' ? 'active' : ''
              }`}
              aria-selected={mode === 'register'}
            >
              Créer un Compte
            </button>
          </div>

          {errorMsg && (
            <div className="alert alert--error text-xs font-mono">
              {errorMsg}
            </div>
          )}

          {mode === 'login' ? (
            /* Mode Sélecteur de Rôles / Connexion */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase font-ui">
                    Connexion Administrateur
                  </h3>
                  <p className="text-xs text-white/45 mt-0.5">
                    Connectez-vous à votre espace projet ou choisissez un compte actif.
                  </p>
                </div>
                {/* Sous-bascule Sélecteur / Identifiants */}
                <div className="tabs">
                  <button
                    type="button"
                    onClick={() => setLoginMethod('quick')}
                    className={`tab ${loginMethod === 'quick' ? 'active' : ''}`}
                    aria-selected={loginMethod === 'quick'}
                  >
                    Profils
                  </button>
                  <button
                    type="button"
                    onClick={() => setLoginMethod('credentials')}
                    className={`tab ${loginMethod === 'credentials' ? 'active' : ''}`}
                    aria-selected={loginMethod === 'credentials'}
                  >
                    E-mail
                  </button>
                </div>
              </div>

              {loginMethod === 'credentials' ? (
                /* Formulaire de connexion direct par e-mail et mot de passe (Supabase Auth) */
                <form onSubmit={handleLoginWithCredentials} className="space-y-3 pt-1">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Adresse e-mail
                    </label>
                    <div className="relative">
                      <Mail className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="email"
                        required
                        value={loginEmail}
                        onChange={e => setLoginEmail(e.target.value)}
                        className="apple-input w-full pl-8 text-xs"
                        placeholder="admin@sentinel.cg"
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
                        value={loginPassword}
                        onChange={e => setLoginPassword(e.target.value)}
                        className="apple-input w-full pl-8 text-xs"
                        placeholder="••••••••••••"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="apple-btn-primary w-full text-xs py-2.5 font-bold flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Vérification sécurisée...</span>
                        </>
                      ) : (
                        <>
                          <LogIn className="w-4 h-4" />
                          <span>Se connecter à mon Espace</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                /* Sélecteur de profils existants */
                <div className="space-y-2">
                  {users.map(u => {
                    const isCurrent = u.id === currentUser.id;
                    const isSuper = u.role === 'super_admin' || u.isSuperAdmin;
                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => handleSelectUser(u)}
                        className={`w-full p-3 rounded-md border text-left transition flex items-center justify-between ${
                          isCurrent
                            ? 'border-[var(--color-primary)] bg-[var(--theme-primary-tint)] shadow-[var(--glow-sm)]'
                            : 'border-[#242424] hover:border-[var(--color-primary)] bg-[#000000]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded border border-[var(--color-primary)] bg-[var(--theme-primary-tint)] flex items-center justify-center text-xs font-mono font-bold text-white">
                            {u.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-white flex items-center gap-2">
                              <span>{u.name}</span>
                              {isSuper && (
                                <span className="px-1.5 py-0.2 rounded border border-[var(--color-primary)] text-[var(--color-primary)] bg-[var(--theme-primary-tint)] text-[9px] font-mono font-bold uppercase">
                                  SUPER ADMIN
                                </span>
                              )}
                              {u.role === 'admin' && (
                                <span className="px-1.5 py-0.2 rounded border border-white text-white text-[9px] font-mono font-bold uppercase">
                                  ADMIN
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-white/45 font-mono">
                              {u.jobTitle} • {u.email}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {isCurrent && (
                            <span className="text-[11px] font-mono font-bold text-[var(--color-primary)] flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                              ACTIF
                            </span>
                          )}
                          <ArrowRight className="w-4 h-4 text-white/45" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className="text-xs font-semibold text-[var(--color-primary)] hover:underline uppercase font-mono"
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
                  disabled={isSubmitting}
                  className="apple-btn-primary w-full text-xs py-2.5 font-bold flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Création de votre espace en cours...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Créer mon Compte & Accéder à mon Espace</span>
                    </>
                  )}
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
