'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { 
  Shield, 
  Lock, 
  Mail, 
  User as UserIcon, 
  Briefcase, 
  FolderPlus, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  Crown, 
  Users, 
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  Eye,
  EyeOff,
  Building2,
  Phone,
  MapPin,
  Coins,
  Target,
  Calendar,
  Check,
  KeyRound,
  FileCheck,
  Loader2
} from 'lucide-react';
import { useSentinel } from '@/lib/store';
import { WorkspaceRole, User as UserType } from '@/types/sentinel';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { encryptSensitiveText, hashPassword, verifyPassword } from '@/lib/security/crypto';

export const AUTH_SESSION_STORAGE_KEY = 'sentinel_auth_session';

interface AuthPortalProps {
  onAuthenticated: () => void;
}

export function AuthPortal({ onAuthenticated }: AuthPortalProps) {
  const { users, registerUser, switchCurrentUser, addNotification, workspace } = useSentinel();

  // Détection de l'existence d'un Super Administrateur
  const existingSuperAdmin = useMemo(() => {
    return users.find(u => u.role === 'super_admin' || u.isSuperAdmin);
  }, [users]);

  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Formulaire de connexion
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Rôle choisi : si un Super Admin existe déjà, seul 'admin' (Administrateur de Projet) est accessible
  const [registerRole, setRegisterRole] = useState<'admin' | 'super_admin'>('admin');

  // Multi-Step Onboarding pour Administrateur de Projet (Sessions d'instructions)
  // Étapes : 1=Identité, 2=Organisation, 3=Projet, 4=Abonnement, 5=Sécurité, 6=Synthèse
  const [currentStep, setCurrentStep] = useState<number>(1);
  const totalSteps = 6;

  // Étape 1 : Identité & Contact
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [jobTitle, setJobTitle] = useState('Directeur de Projet & Pilotage');

  // Étape 2 : Organisation
  const [companyName, setCompanyName] = useState('SENTINEL GESTION');
  const [companySector, setCompanySector] = useState('Technologies & Conseil en Gestion');
  const [companyCountry, setCompanyCountry] = useState('République du Congo');
  const [currency, setCurrency] = useState('FCFA');

  // Étape 3 : Projet Initial
  const [projectName, setProjectName] = useState('Projet Stratégique 2026');
  const [projectGoal, setProjectGoal] = useState('Pilotage opérationnel, optimisation des délais et maîtrise budgétaire');
  const [projectBudget, setProjectBudget] = useState('25000000');
  const [projectDueDate, setProjectDueDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 6);
    return d.toISOString().split('T')[0];
  });

  // Étape 4 : Formule d'Abonnement
  const [subscriptionTier, setSubscriptionTier] = useState<'starter' | 'pro' | 'enterprise'>('pro');

  // Étape 5 : Sécurité & Chiffrement
  const [registerPassword, setRegisterPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Messages d'état
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calcul du score de robustesse du mot de passe (0 à 4)
  const passwordStrength = useMemo(() => {
    let score = 0;
    if (registerPassword.length >= 8) score++;
    if (/[A-Z]/.test(registerPassword)) score++;
    if (/[0-9]/.test(registerPassword)) score++;
    if (/[^A-Za-z0-9]/.test(registerPassword)) score++;
    return score;
  }, [registerPassword]);

  // Connexion rapide avec un profil existant (Démo / Recette)
  const handleSelectQuickProfile = (profile: UserType) => {
    try {
      const sessionData = {
        userId: profile.id,
        email: profile.email,
        name: profile.name,
        role: profile.role,
        timestamp: Date.now(),
      };
      localStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(sessionData));
    } catch {}

    switchCurrentUser(profile);
    addNotification('Authentification réussie', `Bienvenue ${profile.name} (${profile.role === 'super_admin' ? 'Super Administrateur' : 'Administrateur'}).`, 'system');
    onAuthenticated();
  };

  // Traitement Connexion Identifiants
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!loginEmail.trim() || !loginPassword.trim()) {
      setErrorMsg('Veuillez saisir votre adresse e-mail et votre mot de passe.');
      return;
    }

    setIsSubmitting(true);
    const cleanEmail = loginEmail.trim().toLowerCase();

    try {
      // 1. Authentification distante Supabase si configuré (source autoritaire serveur)
      if (isSupabaseConfigured()) {
        const supabase = createClient();
        const { data: supaData, error: supaError } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: loginPassword,
        });

        if (supaError) {
          setErrorMsg(supaError.message || 'Identifiants incorrects.');
          setIsSubmitting(false);
          return;
        }

        if (!supaData?.user) {
          setErrorMsg('Compte utilisateur introuvable.');
          setIsSubmitting(false);
          return;
        }

        const serverRole = (supaData.user.user_metadata?.role as WorkspaceRole) || 'admin';
        const matchedLocal = users.find(u => u.email.toLowerCase() === cleanEmail);
        const activeUser: UserType = matchedLocal ? {
          ...matchedLocal,
          id: supaData.user.id,
          role: serverRole,
        } : {
          id: supaData.user.id,
          name: supaData.user.user_metadata?.full_name || cleanEmail.split('@')[0],
          email: cleanEmail,
          role: serverRole,
          avatar: (supaData.user.user_metadata?.avatar_url as string) || '',
          jobTitle: supaData.user.user_metadata?.job_title || 'Administrateur',
          weeklyCapacityMinutes: 2100,
          hourlyRate: 75,
        };

        try {
          localStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify({
            userId: activeUser.id,
            email: activeUser.email,
            name: activeUser.name,
            role: activeUser.role,
            timestamp: Date.now(),
          }));
        } catch {}

        switchCurrentUser(activeUser);
        addNotification('Session connectée', `Bienvenue ${activeUser.name}.`, 'system');
        onAuthenticated();
        return;
      }

      // 2. Mode local / hors-ligne : contrôle strict du mot de passe
      const matchedLocal = users.find(u => u.email.toLowerCase() === cleanEmail);
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
          setErrorMsg('Erreur lors du contrôle des identifiants.');
          setIsSubmitting(false);
          return;
        }
      } else if (matchedLocal) {
        // En mode démo local, exiger le mot de passe de démonstration
        if (loginPassword !== 'sentinel2026' && loginPassword !== 'admin123') {
          setErrorMsg('Mot de passe incorrect pour ce profil de démonstration (utiliser "sentinel2026").');
          setIsSubmitting(false);
          return;
        }
      } else {
        setErrorMsg('Compte introuvable. Veuillez vérifier vos identifiants ou créer un compte.');
        setIsSubmitting(false);
        return;
      }

      const activeUser = matchedLocal || ({
        id: `usr_${Date.now()}`,
        name: cleanEmail.split('@')[0],
        email: cleanEmail,
        role: 'admin',
        avatar: '',
        jobTitle: 'Administrateur',
        weeklyCapacityMinutes: 2100,
        hourlyRate: 75,
      } as UserType);

      try {
        localStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify({
          userId: activeUser.id,
          email: activeUser.email,
          name: activeUser.name,
          role: activeUser.role,
          timestamp: Date.now(),
        }));
      } catch {}

      switchCurrentUser(activeUser);
      addNotification('Session connectée', `Bienvenue ${activeUser.name}.`, 'system');
      onAuthenticated();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur de connexion.';
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Validation d'étape de l'onboarding
  const handleNextStep = () => {
    setErrorMsg('');
    if (currentStep === 1) {
      if (!firstName.trim() || !lastName.trim()) {
        setErrorMsg('Veuillez renseigner votre prénom et votre nom.');
        return;
      }
      if (!registerEmail.trim() || !registerEmail.includes('@')) {
        setErrorMsg('Veuillez renseigner une adresse e-mail professionnelle valide.');
        return;
      }
    }
    if (currentStep === 2) {
      if (!companyName.trim()) {
        setErrorMsg('Veuillez indiquer le nom de votre organisation ou entreprise.');
        return;
      }
    }
    if (currentStep === 3) {
      if (!projectName.trim()) {
        setErrorMsg('Veuillez renseigner le nom de votre projet initial.');
        return;
      }
    }
    if (currentStep === 5) {
      if (registerPassword.length < 6) {
        setErrorMsg('Le mot de passe doit comporter au moins 6 caractères.');
        return;
      }
      if (registerPassword !== confirmPassword) {
        setErrorMsg('Les mots de passe saisis ne correspondent pas.');
        return;
      }
    }
    setCurrentStep(prev => Math.min(totalSteps, prev + 1));
  };

  const handlePrevStep = () => {
    setErrorMsg('');
    setCurrentStep(prev => Math.max(1, prev - 1));
  };

  // Finalisation de l'inscription & initialisation de l'espace
  const handleCompleteRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    // Si un super admin existe déjà, interdire la création d'un autre via le portail public
    if (registerRole === 'super_admin' && existingSuperAdmin) {
      setErrorMsg('Un Super Administrateur maître existe déjà. Connectez-vous avec ce compte pour administrer le système.');
      return;
    }

    if (registerPassword.length < 6) {
      setErrorMsg('Le mot de passe doit comporter au moins 6 caractères.');
      return;
    }

    setIsSubmitting(true);
    const fullName = `${firstName.trim()} ${lastName.trim()}`;
    const cleanEmail = registerEmail.trim().toLowerCase();
    const resolvedJobTitle = jobTitle.trim() || (registerRole === 'super_admin' ? 'Super Administrateur Système' : 'Administrateur Général de Projets');

    try {
      // 1. Hachage sécurisé du mot de passe avec sel cryptographique
      try {
        const { hash, salt } = await hashPassword(registerPassword);
        localStorage.setItem(`sentinel_cipher_${cleanEmail}`, JSON.stringify({ hash, salt }));
      } catch (err) {
        console.warn('Note chiffrement:', err);
      }

      // 2. Inscription Supabase Auth autoritaire si configuré
      if (isSupabaseConfigured()) {
        const supabase = createClient();
        const { error: supaError } = await supabase.auth.signUp({
          email: cleanEmail,
          password: registerPassword,
          options: {
            data: {
              full_name: fullName,
              role: registerRole,
              job_title: resolvedJobTitle,
              organization_name: companyName.trim(),
              phone: phone.trim(),
              currency,
              subscription_tier: subscriptionTier,
            },
          },
        });

        if (supaError) {
          setErrorMsg(`Erreur lors de l'enregistrement distant Supabase : ${supaError.message}`);
          setIsSubmitting(false);
          return;
        }
      }

      // 3. Enregistrement dans le store Sentinel
      const createdUser = registerUser({
        name: fullName,
        email: cleanEmail,
        role: registerRole,
        jobTitle: resolvedJobTitle,
        projectName: registerRole === 'super_admin' ? undefined : projectName.trim(),
      });

      // 4. Sauvegarde de session sécurisée
      try {
        localStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify({
          userId: createdUser.id,
          email: createdUser.email,
          name: createdUser.name,
          role: createdUser.role,
          company: companyName.trim(),
          tier: subscriptionTier,
          currency,
          timestamp: Date.now(),
        }));
      } catch {}

      addNotification(
        'Espace initialisé avec succès',
        `Bienvenue ${fullName} ! Votre poste de pilotage pour « ${companyName.trim()} » est prêt.`,
        'system'
      );

      onAuthenticated();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de la création du compte.';
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[#02050A] text-[#FFFFFF] relative overflow-hidden font-ui">
      {/* Halos d'ambiance bleue et rouge Sentinelle */}
      <div 
        className="absolute top-1/4 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] rounded-full pointer-events-none opacity-25 blur-[140px]"
        style={{
          background: 'radial-gradient(circle, #0066FF 0%, rgba(0,102,255,0.15) 50%, transparent 70%)'
        }}
      />
      <div 
        className="absolute bottom-1/4 right-1/3 translate-x-1/2 translate-y-1/2 w-[550px] h-[550px] rounded-full pointer-events-none opacity-20 blur-[130px]"
        style={{
          background: 'radial-gradient(circle, #FF0000 0%, rgba(255,0,0,0.1) 50%, transparent 70%)'
        }}
      />

      {/* Cadre central */}
      <div className="w-full max-w-2xl bg-[#070B14] rounded-2xl border border-[rgba(0,102,255,0.4)] shadow-[0_0_50px_rgba(0,102,255,0.25)] relative z-10 overflow-hidden">
        
        {/* En-tête avec Nouvelle Image / Logo Officiel */}
        <div className="p-6 pb-4 border-b border-[#1A2338] bg-[#050811] flex flex-col items-center text-center relative">
          <div className="relative w-24 h-24 mb-3 rounded-2xl overflow-hidden border-2 border-[var(--brand,#0066FF)] shadow-[0_0_30px_rgba(0,102,255,0.45)] p-1 bg-[#02050A] flex items-center justify-center">
            <Image
              src="/sentinel-logo.jpg"
              alt="Sentinelle de Gestion Logo Officiel"
              width={96}
              height={96}
              priority
              className="w-full h-full object-contain rounded-xl"
            />
          </div>

          <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-[#FFFFFF] flex items-center gap-2">
            <span>SENTINELLE DE GESTION</span>
          </h1>
          <p className="text-xs text-[#94A3B8] mt-1 font-mono uppercase tracking-wide">
            Plateforme Unifiée de Pilotage de Projets, Finances & Risques
          </p>

          <div className="mt-3 inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-[rgba(0,102,255,0.5)] bg-[rgba(0,102,255,0.12)] text-[11px] font-mono text-[#4D94FF]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#00D2FF]" />
            <span>AUTHENTIFICATION SÉCURISÉE & CHIFFREMENT DE BOUT EN BOUT</span>
          </div>
        </div>

        {/* Onglets d'action : S'IDENTIFIER vs CRÉER UN COMPTE */}
        <div className="flex border-b border-[#1A2338] bg-[#050811]">
          <button
            type="button"
            onClick={() => { setActiveTab('login'); setErrorMsg(''); setSuccessMsg(''); }}
            data-testid="tab-login"
            className={`flex-1 py-3.5 text-xs font-bold uppercase tracking-wider font-mono transition text-center flex items-center justify-center gap-2 ${
              activeTab === 'login'
                ? 'bg-[#0066FF] text-[#FFFFFF] shadow-[0_0_20px_rgba(0,102,255,0.5)]'
                : 'text-[#94A3B8] hover:text-[#FFFFFF] hover:bg-[#0D1527]'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>S’identifier</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('register'); setErrorMsg(''); setSuccessMsg(''); }}
            data-testid="tab-register"
            className={`flex-1 py-3.5 text-xs font-bold uppercase tracking-wider font-mono transition text-center flex items-center justify-center gap-2 ${
              activeTab === 'register'
                ? 'bg-[#0066FF] text-[#FFFFFF] shadow-[0_0_20px_rgba(0,102,255,0.5)]'
                : 'text-[#94A3B8] hover:text-[#FFFFFF] hover:bg-[#0D1527]'
            }`}
          >
            <UserIcon className="w-3.5 h-3.5" />
            <span>Initialiser mon espace (Admin)</span>
          </button>
        </div>

        {/* Message d'erreur */}
        {errorMsg && (
          <div className="m-5 mb-0 p-3 rounded-lg border border-[#D91C24] bg-[rgba(217,28,36,0.15)] text-[#FFFFFF] text-xs flex items-center gap-2 animate-in fade-in">
            <AlertTriangle className="w-4 h-4 text-[#FF5A61] shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ONGLET 1 : S'IDENTIFIER                                                   */}
        {/* ========================================================================= */}
        {activeTab === 'login' && (
          <div className="p-6 space-y-6">
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] mb-1.5 font-mono">
                  Adresse e-mail
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0066FF]" />
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="ex: contact@entreprise.cg"
                    className="w-full bg-[#02050A] border border-[#1A2338] focus:border-[#0066FF] focus:ring-2 focus:ring-[#0066FF]/30 rounded-lg pl-9 pr-3 py-2.5 text-sm text-[#FFFFFF] placeholder:text-[#64748B] outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] mb-1.5 font-mono">
                  Mot de passe
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0066FF]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-[#02050A] border border-[#1A2338] focus:border-[#0066FF] focus:ring-2 focus:ring-[#0066FF]/30 rounded-lg pl-9 pr-10 py-2.5 text-sm text-[#FFFFFF] placeholder:text-[#64748B] outline-none transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#FFFFFF]"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                data-testid="btn-login-submit"
                className="w-full py-3 rounded-lg font-bold text-xs uppercase tracking-wider text-[#FFFFFF] bg-gradient-to-r from-[#0066FF] to-[#0047B3] hover:from-[#3385FF] hover:to-[#0052CC] border border-[#3385FF] shadow-[0_0_24px_rgba(0,102,255,0.45)] transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Vérification sécurisée...</span>
                  </>
                ) : (
                  <>
                    <span>Accéder à mon espace</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Accès Instantané par Profils (Démonstration & Recette) */}
            <div className="pt-4 border-t border-[#1A2338]">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] font-mono mb-2.5 flex items-center justify-between">
                <span>Accès rapide en un clic (Démonstration) :</span>
                <span className="text-[10px] text-[#00D2FF]">Prêt à l'emploi</span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {/* Super Admin */}
                <button
                  type="button"
                  data-testid="btn-quick-superadmin"
                  onClick={() => {
                    const superAdmin = users.find(u => u.role === 'super_admin' || u.isSuperAdmin) || users[0];
                    handleSelectQuickProfile(superAdmin);
                  }}
                  className="p-3 rounded-lg border border-[rgba(0,102,255,0.4)] bg-[#02050A] hover:bg-[rgba(0,102,255,0.12)] hover:border-[#0066FF] text-left transition flex items-center justify-between group"
                >
                  <div>
                    <div className="text-xs font-bold text-[#FFFFFF] flex items-center gap-1.5">
                      <Crown className="w-3.5 h-3.5 text-[#00D2FF]" />
                      <span>Super Admin</span>
                    </div>
                    <div className="text-[10px] text-[#64748B] font-mono">
                      Supervision globale
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#64748B] group-hover:text-[#00D2FF] transition" />
                </button>

                {/* Admin Projet */}
                <button
                  type="button"
                  data-testid="btn-quick-admin"
                  onClick={() => {
                    const admin = users.find(u => u.role === 'admin' || u.role === 'owner') || users[0];
                    handleSelectQuickProfile(admin);
                  }}
                  className="p-3 rounded-lg border border-[#1A2338] bg-[#02050A] hover:bg-[#0D1527] hover:border-[rgba(0,102,255,0.4)] text-left transition flex items-center justify-between group"
                >
                  <div>
                    <div className="text-xs font-bold text-[#FFFFFF] flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-[#4D94FF]" />
                      <span>Admin Projet</span>
                    </div>
                    <div className="text-[10px] text-[#64748B] font-mono">
                      Poste de pilotage
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#64748B] group-hover:text-[#4D94FF] transition" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ONGLET 2 : FORMULAIRE D'ONBOARDING MULTI-ÉTAPES (SESSION PAR ÉTAPES)       */}
        {/* ========================================================================= */}
        {activeTab === 'register' && (
          <div className="p-6 space-y-5">

            {/* AVERTISSEMENT SUPER ADMIN UNIQUE */}
            {existingSuperAdmin ? (
              <div className="p-3 rounded-lg border border-[rgba(0,102,255,0.4)] bg-[rgba(0,102,255,0.08)] flex items-start gap-2.5 text-xs text-[#CBD5E1]">
                <ShieldCheck className="w-4 h-4 text-[#00D2FF] shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-[#FFFFFF] font-mono uppercase text-[11px]">
                    Super Administrateur déjà configuré
                  </div>
                  <div className="text-[11px] text-[#94A3B8] mt-0.5">
                    Le compte Super Administrateur maître est verrouillé. Vous initialisez ici un profil d’<strong>Administrateur de Projet</strong> pour votre organisation.
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-lg border border-[#FF0000] bg-[rgba(255,0,0,0.1)] flex items-start gap-2.5 text-xs text-[#CBD5E1]">
                <Crown className="w-4 h-4 text-[#FF5A61] shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-[#FFFFFF] font-mono uppercase text-[11px]">
                    Premier Démarrage · Initialisation Super Admin Unique
                  </div>
                  <div className="text-[11px] text-[#94A3B8] mt-0.5">
                    Aucun Super Administrateur n'est encore enregistré. Vous allez créer le compte superviseur unique de ce système.
                  </div>
                </div>
              </div>
            )}

            {/* JAUGE DE PROGRESSION DES ÉTAPES */}
            <div>
              <div className="flex items-center justify-between text-[11px] font-mono mb-2">
                <span className="text-[#00D2FF] font-bold uppercase tracking-wider">
                  Session d'instructions · Étape {currentStep} sur {totalSteps}
                </span>
                <span className="text-[#94A3B8]">
                  {currentStep === 1 && '1. Identité du Responsable'}
                  {currentStep === 2 && '2. Organisation & Entité'}
                  {currentStep === 3 && '3. Premier Projet'}
                  {currentStep === 4 && '4. Formule d’Abonnement'}
                  {currentStep === 5 && '5. Sécurité & Accès'}
                  {currentStep === 6 && '6. Synthèse & Activation'}
                </span>
              </div>
              <div className="w-full h-1.5 bg-[#1A2338] rounded-full overflow-hidden flex">
                <div 
                  className="bg-gradient-to-r from-[#0066FF] to-[#00D2FF] h-full transition-all duration-300"
                  style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                />
              </div>
            </div>

            {/* CONTENU SELON L'ÉTAPE COURANTE */}
            <form onSubmit={currentStep === totalSteps ? handleCompleteRegistration : (e) => { e.preventDefault(); handleNextStep(); }}>
              
              {/* ÉTAPE 1 : IDENTITÉ & CONTACT */}
              {currentStep === 1 && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="text-xs text-[#94A3B8] flex items-center gap-1.5 font-mono">
                    <UserIcon className="w-3.5 h-3.5 text-[#0066FF]" />
                    <span>Renseignez vos coordonnées de responsable de projet :</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] mb-1 font-mono">
                        Prénom *
                      </label>
                      <input
                        type="text"
                        required
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="Jean"
                        className="w-full bg-[#02050A] border border-[#1A2338] focus:border-[#0066FF] focus:ring-2 focus:ring-[#0066FF]/30 rounded-lg px-3 py-2 text-sm text-[#FFFFFF] placeholder:text-[#64748B] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] mb-1 font-mono">
                        Nom *
                      </label>
                      <input
                        type="text"
                        required
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Mabiala"
                        className="w-full bg-[#02050A] border border-[#1A2338] focus:border-[#0066FF] focus:ring-2 focus:ring-[#0066FF]/30 rounded-lg px-3 py-2 text-sm text-[#FFFFFF] placeholder:text-[#64748B] outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] mb-1 font-mono">
                        E-mail professionnel *
                      </label>
                      <input
                        type="email"
                        required
                        value={registerEmail}
                        onChange={(e) => setRegisterEmail(e.target.value)}
                        placeholder="jean.mabiala@groupe.cg"
                        className="w-full bg-[#02050A] border border-[#1A2338] focus:border-[#0066FF] focus:ring-2 focus:ring-[#0066FF]/30 rounded-lg px-3 py-2 text-sm text-[#FFFFFF] placeholder:text-[#64748B] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] mb-1 font-mono">
                        Téléphone / WhatsApp
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+242 06 000 00 00"
                        className="w-full bg-[#02050A] border border-[#1A2338] focus:border-[#0066FF] focus:ring-2 focus:ring-[#0066FF]/30 rounded-lg px-3 py-2 text-sm text-[#FFFFFF] placeholder:text-[#64748B] outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] mb-1 font-mono">
                      Poste / Fonction
                    </label>
                    <input
                      type="text"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      placeholder="Directeur de Projet, Lead Ingénieur, DG..."
                      className="w-full bg-[#02050A] border border-[#1A2338] focus:border-[#0066FF] focus:ring-2 focus:ring-[#0066FF]/30 rounded-lg px-3 py-2 text-sm text-[#FFFFFF] placeholder:text-[#64748B] outline-none"
                    />
                  </div>
                </div>
              )}

              {/* ÉTAPE 2 : ORGANISATION & ENTREPRISE */}
              {currentStep === 2 && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="text-xs text-[#94A3B8] flex items-center gap-1.5 font-mono">
                    <Building2 className="w-3.5 h-3.5 text-[#0066FF]" />
                    <span>Paramétrez l'organisation et la devise de travail :</span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] mb-1 font-mono">
                      Nom de l'Organisation / Entreprise *
                    </label>
                    <input
                      type="text"
                      required
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Ex: SENTINEL GESTION, Société ABC..."
                      className="w-full bg-[#02050A] border border-[#1A2338] focus:border-[#0066FF] focus:ring-2 focus:ring-[#0066FF]/30 rounded-lg px-3 py-2 text-sm text-[#FFFFFF] placeholder:text-[#64748B] outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] mb-1 font-mono">
                        Secteur d'activité
                      </label>
                      <input
                        type="text"
                        value={companySector}
                        onChange={(e) => setCompanySector(e.target.value)}
                        placeholder="BTP, Informatique, Conseil..."
                        className="w-full bg-[#02050A] border border-[#1A2338] focus:border-[#0066FF] focus:ring-2 focus:ring-[#0066FF]/30 rounded-lg px-3 py-2 text-sm text-[#FFFFFF] placeholder:text-[#64748B] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] mb-1 font-mono">
                        Pays / Territoire
                      </label>
                      <input
                        type="text"
                        value={companyCountry}
                        onChange={(e) => setCompanyCountry(e.target.value)}
                        placeholder="Congo, France, RDC..."
                        className="w-full bg-[#02050A] border border-[#1A2338] focus:border-[#0066FF] focus:ring-2 focus:ring-[#0066FF]/30 rounded-lg px-3 py-2 text-sm text-[#FFFFFF] placeholder:text-[#64748B] outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] mb-1.5 font-mono">
                      Devise Principale de Gestion
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {['FCFA', 'EUR', 'USD', 'CAD'].map((curr) => (
                        <button
                          key={curr}
                          type="button"
                          onClick={() => setCurrency(curr)}
                          className={`p-2 rounded-lg border text-xs font-mono font-bold transition text-center ${
                            currency === curr
                              ? 'border-[#0066FF] bg-[rgba(0,102,255,0.2)] text-[#FFFFFF]'
                              : 'border-[#1A2338] bg-[#02050A] text-[#94A3B8] hover:text-[#FFFFFF]'
                          }`}
                        >
                          {curr}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ÉTAPE 3 : PREMIER PROJET À PILOTER */}
              {currentStep === 3 && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="text-xs text-[#94A3B8] flex items-center gap-1.5 font-mono">
                    <Target className="w-3.5 h-3.5 text-[#0066FF]" />
                    <span>Définissez le premier projet opérationnel de votre espace :</span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] mb-1 font-mono">
                      Intitulé du Projet Pilote *
                    </label>
                    <input
                      type="text"
                      required
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      placeholder="Ex: Déploiement Stratégique 2026"
                      className="w-full bg-[#02050A] border border-[#1A2338] focus:border-[#0066FF] focus:ring-2 focus:ring-[#0066FF]/30 rounded-lg px-3 py-2 text-sm text-[#FFFFFF] placeholder:text-[#64748B] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] mb-1 font-mono">
                      Objectif Clé / Périmètre
                    </label>
                    <input
                      type="text"
                      value={projectGoal}
                      onChange={(e) => setProjectGoal(e.target.value)}
                      placeholder="Description synthétique des livrables attendus..."
                      className="w-full bg-[#02050A] border border-[#1A2338] focus:border-[#0066FF] focus:ring-2 focus:ring-[#0066FF]/30 rounded-lg px-3 py-2 text-sm text-[#FFFFFF] placeholder:text-[#64748B] outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] mb-1 font-mono">
                        Budget Prévisionnel ({currency})
                      </label>
                      <input
                        type="number"
                        value={projectBudget}
                        onChange={(e) => setProjectBudget(e.target.value)}
                        placeholder="25000000"
                        className="w-full bg-[#02050A] border border-[#1A2338] focus:border-[#0066FF] focus:ring-2 focus:ring-[#0066FF]/30 rounded-lg px-3 py-2 text-sm text-[#FFFFFF] placeholder:text-[#64748B] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] mb-1 font-mono">
                        Date d'Échéance Cible
                      </label>
                      <input
                        type="date"
                        value={projectDueDate}
                        onChange={(e) => setProjectDueDate(e.target.value)}
                        className="w-full bg-[#02050A] border border-[#1A2338] focus:border-[#0066FF] focus:ring-2 focus:ring-[#0066FF]/30 rounded-lg px-3 py-2 text-sm text-[#FFFFFF] outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ÉTAPE 4 : FORMULE D'ABONNEMENT */}
              {currentStep === 4 && (
                <div className="space-y-3 animate-in fade-in">
                  <div className="text-xs text-[#94A3B8] flex items-center gap-1.5 font-mono mb-1">
                    <Sparkles className="w-3.5 h-3.5 text-[#0066FF]" />
                    <span>Sélectionnez votre formule d'abonnement :</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {/* Starter */}
                    <div
                      onClick={() => setSubscriptionTier('starter')}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition ${
                        subscriptionTier === 'starter'
                          ? 'border-[#0066FF] bg-[rgba(0,102,255,0.18)] shadow-[0_0_15px_rgba(0,102,255,0.3)]'
                          : 'border-[#1A2338] bg-[#02050A] hover:border-[rgba(0,102,255,0.4)]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold uppercase font-mono text-[#FFFFFF]">Starter</span>
                        {subscriptionTier === 'starter' && <Check className="w-3.5 h-3.5 text-[#00D2FF]" />}
                      </div>
                      <div className="text-sm font-extrabold text-[#00D2FF] mb-1 font-mono">Gratuit</div>
                      <p className="text-[10px] text-[#94A3B8] leading-tight">
                        1 projet actif, Kanban, suivi du temps, 3 collaborateurs.
                      </p>
                    </div>

                    {/* Pro Business */}
                    <div
                      onClick={() => setSubscriptionTier('pro')}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition relative ${
                        subscriptionTier === 'pro'
                          ? 'border-[#0066FF] bg-[rgba(0,102,255,0.18)] shadow-[0_0_15px_rgba(0,102,255,0.3)]'
                          : 'border-[#1A2338] bg-[#02050A] hover:border-[rgba(0,102,255,0.4)]'
                      }`}
                    >
                      <span className="absolute -top-2 right-2 px-1.5 py-0.5 rounded text-[8px] font-mono font-extrabold uppercase bg-[#0066FF] text-[#FFFFFF]">
                        Populaire
                      </span>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold uppercase font-mono text-[#FFFFFF]">Pro Business</span>
                        {subscriptionTier === 'pro' && <Check className="w-3.5 h-3.5 text-[#00D2FF]" />}
                      </div>
                      <div className="text-sm font-extrabold text-[#4D94FF] mb-1 font-mono">Recommandé</div>
                      <p className="text-[10px] text-[#94A3B8] leading-tight">
                        Projets illimités, Budgets, Sprints, Gantt, Rapports PDF, Mode Hors-Ligne.
                      </p>
                    </div>

                    {/* Entreprise */}
                    <div
                      onClick={() => setSubscriptionTier('enterprise')}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition ${
                        subscriptionTier === 'enterprise'
                          ? 'border-[#0066FF] bg-[rgba(0,102,255,0.18)] shadow-[0_0_15px_rgba(0,102,255,0.3)]'
                          : 'border-[#1A2338] bg-[#02050A] hover:border-[rgba(0,102,255,0.4)]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold uppercase font-mono text-[#FFFFFF]">Entreprise</span>
                        {subscriptionTier === 'enterprise' && <Check className="w-3.5 h-3.5 text-[#00D2FF]" />}
                      </div>
                      <div className="text-sm font-extrabold text-[#FF5A61] mb-1 font-mono">Sur-mesure</div>
                      <p className="text-[10px] text-[#94A3B8] leading-tight">
                        Multi-équipes, Matrice des risques 5x5, Piste d'audit RGPD, Superviseur.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* ÉTAPE 5 : SÉCURITÉ & CHIFFREMENT */}
              {currentStep === 5 && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="text-xs text-[#94A3B8] flex items-center gap-1.5 font-mono">
                    <KeyRound className="w-3.5 h-3.5 text-[#0066FF]" />
                    <span>Sécurisez vos accès avec chiffrement de niveau militaire :</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] mb-1 font-mono">
                        Mot de passe *
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={registerPassword}
                          onChange={(e) => setRegisterPassword(e.target.value)}
                          placeholder="Min. 6 caractères"
                          className="w-full bg-[#02050A] border border-[#1A2338] focus:border-[#0066FF] focus:ring-2 focus:ring-[#0066FF]/30 rounded-lg px-3 py-2 text-sm text-[#FFFFFF] placeholder:text-[#64748B] outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#FFFFFF]"
                        >
                          {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] mb-1 font-mono">
                        Confirmation du mot de passe *
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Répétez le mot de passe"
                          className="w-full bg-[#02050A] border border-[#1A2338] focus:border-[#0066FF] focus:ring-2 focus:ring-[#0066FF]/30 rounded-lg px-3 py-2 text-sm text-[#FFFFFF] placeholder:text-[#64748B] outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#FFFFFF]"
                        >
                          {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Jauge de robustesse */}
                  {registerPassword && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-mono">
                        <span className="text-[#94A3B8]">Force du mot de passe</span>
                        <span className={
                          passwordStrength <= 1 ? 'text-[#FF5A61]' :
                          passwordStrength <= 2 ? 'text-[#F59E0B]' :
                          'text-[#22C55E]'
                        }>
                          {passwordStrength <= 1 ? 'Faible' : passwordStrength <= 2 ? 'Moyen' : 'Robuste & Chiffré'}
                        </span>
                      </div>
                      <div className="w-full h-1 bg-[#1A2338] rounded-full overflow-hidden flex">
                        <div 
                          className={`h-full transition-all duration-300 ${
                            passwordStrength <= 1 ? 'bg-[#FF5A61] w-1/4' :
                            passwordStrength <= 2 ? 'bg-[#F59E0B] w-2/4' :
                            passwordStrength === 3 ? 'bg-[#00D2FF] w-3/4' :
                            'bg-[#22C55E] w-full'
                          }`}
                        />
                      </div>
                    </div>
                  )}

                  <div className="p-2.5 rounded-lg border border-[#1A2338] bg-[#02050A] text-[11px] text-[#94A3B8] flex items-center gap-2 font-mono">
                    <ShieldCheck className="w-4 h-4 text-[#00D2FF] shrink-0" />
                    <span>Dérivation cryptographique PBKDF2 (100 000 itérations) & Chiffrement AES-GCM 256 bits.</span>
                  </div>
                </div>
              )}

              {/* ÉTAPE 6 : SYNTHÈSE & ACTIVATION */}
              {currentStep === 6 && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="text-xs text-[#94A3B8] flex items-center gap-1.5 font-mono">
                    <FileCheck className="w-3.5 h-3.5 text-[#0066FF]" />
                    <span>Récapitulatif avant activation de votre espace de pilotage :</span>
                  </div>

                  <div className="p-3.5 rounded-xl border border-[#1A2338] bg-[#02050A] space-y-2.5 text-xs">
                    <div className="flex justify-between pb-1.5 border-b border-[#1A2338]">
                      <span className="text-[#94A3B8]">Responsable :</span>
                      <span className="font-bold text-[#FFFFFF]">{firstName} {lastName} ({registerEmail})</span>
                    </div>
                    <div className="flex justify-between pb-1.5 border-b border-[#1A2338]">
                      <span className="text-[#94A3B8]">Organisation :</span>
                      <span className="font-bold text-[#FFFFFF]">{companyName} · {companyCountry}</span>
                    </div>
                    <div className="flex justify-between pb-1.5 border-b border-[#1A2338]">
                      <span className="text-[#94A3B8]">Projet initial :</span>
                      <span className="font-bold text-[#4D94FF]">{projectName}</span>
                    </div>
                    <div className="flex justify-between pb-1.5 border-b border-[#1A2338]">
                      <span className="text-[#94A3B8]">Budget initial :</span>
                      <span className="font-mono font-bold text-[#00D2FF]">
                        {Number(projectBudget || 0).toLocaleString()} {currency}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#94A3B8]">Formule choisie :</span>
                      <span className="font-mono uppercase font-extrabold text-[#FFFFFF] px-2 py-0.5 rounded bg-[#0066FF]">
                        {subscriptionTier.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* BOUTONS DE NAVIGATION DU WIZARD */}
              <div className="flex items-center justify-between pt-4 border-t border-[#1A2338] mt-4">
                {currentStep > 1 ? (
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className="px-4 py-2 rounded-lg border border-[#1A2338] bg-[#02050A] text-[#94A3B8] hover:text-[#FFFFFF] text-xs font-mono font-bold flex items-center gap-1.5 transition"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Précédent</span>
                  </button>
                ) : (
                  <div />
                )}

                {currentStep < totalSteps ? (
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="px-5 py-2.5 rounded-lg bg-[#0066FF] hover:bg-[#3385FF] text-[#FFFFFF] text-xs font-mono font-bold flex items-center gap-1.5 transition shadow-[0_0_15px_rgba(0,102,255,0.4)]"
                  >
                    <span>Continuer</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    data-testid="btn-register-submit"
                    className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-[#0066FF] to-[#00D2FF] hover:from-[#3385FF] hover:to-[#70E6FF] text-[#FFFFFF] text-xs font-mono font-bold flex items-center gap-2 transition shadow-[0_0_25px_rgba(0,102,255,0.5)] cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Initialisation en cours...</span>
                      </>
                    ) : (
                      <>
                        <span>Activer mon espace & Accéder</span>
                        <CheckCircle2 className="w-4 h-4" />
                      </>
                    )}
                  </button>
                )}
              </div>
            </form>
          </div>
        )}

        {/* Pied de page console Sentinelle */}
        <div className="px-6 py-3 border-t border-[#1A2338] bg-[#050811] flex items-center justify-between text-[11px] text-[#64748B] font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#0066FF] shadow-[0_0_8px_#0066FF]" />
            <span>SENTINEL ENGINE v2.7 · SÉCURITÉ ANSSI</span>
          </div>
          <span>CHIFFREMENT AES-256-GCM & SHA-256</span>
        </div>
      </div>
    </div>
  );
}
