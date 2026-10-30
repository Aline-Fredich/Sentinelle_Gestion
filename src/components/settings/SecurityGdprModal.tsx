'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Download,
  UserX,
  Lock,
  CheckCircle2,
  AlertTriangle,
  X,
  FileCheck,
} from 'lucide-react';
import { useSentinel } from '@/lib/store';
import { exportUserPersonalData, anonymizeUserData } from '@/lib/security/gdpr';
import { 
  verifyAuditTrailIntegrity, 
  loadPersistentAuditTrail,
  recordSecureAuditEvent,
  type AuditEntry 
} from '@/lib/security/auditTrail';

interface SecurityGdprModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SecurityGdprModal({ isOpen, onClose }: SecurityGdprModalProps) {
  const { users, tasks, timeEntries, activities, currentUser } = useSentinel();
  const [activeTab, setActiveTab] = useState<'integrity' | 'export' | 'erasure'>('integrity');

  // État Audit Trail
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationReport, setVerificationReport] = useState<{
    tested: boolean;
    isValid: boolean;
    total: number;
    reason?: string;
  }>({ tested: false, isValid: true, total: 0 });

  // État Anonymisation
  const [confirmKeyword, setConfirmKeyword] = useState('');
  const [erasureDone, setErasureDone] = useState(false);

  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentUserId = currentUser?.id || users[0]?.id || 'u-1';

  // Lancement de l'audit cryptographique
  const handleVerifyAuditChain = async () => {
    setIsVerifying(true);
    try {
      let chain = await loadPersistentAuditTrail();
      if (chain.length === 0) {
        const initEntry = await recordSecureAuditEvent({
          userId: currentUserId,
          userName: currentUser?.name || 'Administrateur Système',
          action: 'user_login',
          entityType: 'security',
          entityId: currentUserId,
          details: { system: 'Sentinel Gestion Initialized', timestamp: new Date().toISOString() },
        });
        chain = [initEntry];
      }
      const result = await verifyAuditTrailIntegrity(chain);
      setVerificationReport({
        tested: true,
        isValid: result.isValid,
        total: result.totalEntries,
        reason: result.reason,
      });
    } finally {
      setIsVerifying(false);
    }
  };

  // Exportation des données RGPD (Article 20)
  const handleExportGdpr = () => {
    const exported = exportUserPersonalData(currentUserId, {
      users,
      tasks,
      timeEntries: timeEntries || [],
      activities: activities || [],
    });

    if (!exported) {
      alert('Impossible d’exporter les données : profil utilisateur introuvable.');
      return;
    }

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exported, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `sentinel_donnees_personnelles_rgpd_${currentUserId}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Droit à l'oubli (Article 17)
  const handleExecuteErasure = () => {
    if (confirmKeyword !== 'ANONYMISER') return;

    const { anonymizationResult } = anonymizeUserData(currentUserId, {
      users,
      tasks,
      timeEntries: timeEntries || [],
    });

    if (anonymizationResult.success) {
      setErasureDone(true);
    }
  };

  return (
    <div 
      className="modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div 
        className="modal max-w-2xl flex flex-col max-h-[90dvh]"
        onClick={e => e.stopPropagation()}
      >
        {/* En-tête */}
        <div className="flex items-center justify-between pb-3 border-b border-[#242424] mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[4px] border border-red bg-red/10 flex items-center justify-center text-red">
              <ShieldCheck className="w-4 h-4 text-red" />
            </div>
            <div>
              <h3 className="modal-title mb-0">SÉCURITÉ & CONFORMITÉ RGPD</h3>
              <p className="text-micro text-white/45">Gouvernance des données, intégrité d’audit et protection des personnes</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-sm p-1"
            aria-label="Fermer"
          >
            <X className="w-4 h-4 text-white/70" />
          </button>
        </div>

        {/* Onglets */}
        <div className="tabs mb-4">
          <button
            onClick={() => setActiveTab('integrity')}
            aria-selected={activeTab === 'integrity'}
            className="tab flex items-center gap-2"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>JOURNAL D'AUDIT INFALSIFIABLE</span>
          </button>
          <button
            onClick={() => setActiveTab('export')}
            aria-selected={activeTab === 'export'}
            className="tab flex items-center gap-2"
          >
            <Download className="w-3.5 h-3.5" />
            <span>PORTABILITÉ RGPD (ART. 20)</span>
          </button>
          <button
            onClick={() => setActiveTab('erasure')}
            aria-selected={activeTab === 'erasure'}
            className="tab flex items-center gap-2"
          >
            <UserX className="w-3.5 h-3.5" />
            <span>DROIT À L’OUBLI (ART. 17)</span>
          </button>
        </div>

        {/* Contenu */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {activeTab === 'integrity' && (
            <div className="space-y-4">
              <div className="card-inner space-y-2">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-red" />
                  Chaîne de traçabilité cryptographique SHA-256
                </h4>
                <p className="text-micro text-white/70 leading-relaxed">
                  Chaque événement opérationnel (création de projet, modification budgétaire, authentification)
                  est lié au bloc précédent par une empreinte SHA-256. Aucune entrée ne peut être altérée ou retirée
                  sans rompre instantanément la validité mathématique de la chaîne.
                </p>
              </div>

              <div className="card-inner flex items-center justify-between">
                <div>
                  <span className="text-micro text-white/45 block uppercase font-bold">État du grand livre d’audit</span>
                  <span className="text-xs font-bold text-white uppercase font-mono">
                    {verificationReport.tested
                      ? verificationReport.isValid
                        ? `Vérification réussie (${verificationReport.total} blocs scellés)`
                        : 'Alerte : Rupture détectée'
                      : 'Audit non exécuté pour cette session'}
                  </span>
                </div>
                <button
                  onClick={handleVerifyAuditChain}
                  disabled={isVerifying}
                  className="btn btn-primary btn-sm"
                >
                  <ShieldCheck className="w-4 h-4 text-white" />
                  <span>{isVerifying ? 'ANALYSE EN COURS...' : 'VÉRIFIER L’INTÉGRITÉ'}</span>
                </button>
              </div>

              {verificationReport.tested && (
                <div
                  className={`alert ${verificationReport.isValid ? '' : 'alert--error'} flex items-start gap-3`}
                >
                  {verificationReport.isValid ? (
                    <CheckCircle2 className="w-5 h-5 text-white shrink-0 mt-0.5" />
                  ) : (
                    <ShieldAlert className="w-5 h-5 text-red shrink-0 mt-0.5" />
                  )}
                  <div className="text-xs space-y-1">
                    <p className="font-bold uppercase tracking-wider">
                      {verificationReport.isValid
                        ? 'Intégrité mathématique certifiée à 100%'
                        : 'Anomalie de chaîne identifiée'}
                    </p>
                    <p className="text-micro opacity-90 font-mono">
                      {verificationReport.isValid
                        ? `Toutes les empreintes antérieures et liens de succession sont conformes sur ${verificationReport.total} entrées vérifiées.`
                        : verificationReport.reason}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'export' && (
            <div className="space-y-4">
              <div className="card-inner space-y-2">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Download className="w-4 h-4 text-red" />
                  Export structuré de vos données personnelles
                </h4>
                <p className="text-micro text-white/70 leading-relaxed">
                  Conformément à l’Article 20 du Règlement Général sur la Protection des Données (RGPD), vous disposez
                  du droit de recevoir vos données personnelles dans un format structuré, couramment utilisé et lisible
                  par machine (JSON).
                </p>
              </div>

              <div className="card-inner text-micro text-white/70 space-y-2">
                <span className="font-bold text-white uppercase">Éléments inclus dans l’archive JSON :</span>
                <ul className="list-disc list-inside space-y-1 text-white/45">
                  <li>Identité, adresse électronique et paramètres de capacité de travail</li>
                  <li>Toutes les tâches sous votre responsabilité ou assignation directe</li>
                  <li>Historique chronologique des feuilles de temps saisies</li>
                  <li>Journal des actions et contributions enregistrées</li>
                </ul>
              </div>

              <button
                onClick={handleExportGdpr}
                className="btn btn-primary btn-block py-2.5"
              >
                <Download className="w-4 h-4 text-white" />
                <span>TÉLÉCHARGER L’ARCHIVE JSON DE MES DONNÉES PERSONNELLES</span>
              </button>
            </div>
          )}

          {activeTab === 'erasure' && (
            <div className="space-y-4">
              <div className="alert alert--error space-y-2">
                <h4 className="text-xs font-bold text-red uppercase tracking-wider flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red" />
                  Droit à l’effacement & Anonymisation irréversible
                </h4>
                <p className="text-micro text-white/70 leading-relaxed">
                  Cette procédure efface définitivement toutes vos coordonnées nominatives (nom, prénom, e-mail direct,
                  avatar personnalisé). Vos contributions passées sont converties sous l’entité neutre &laquo; Collaborateur
                  Anonymisé &raquo; afin de garantir la pérennité comptable et calendaire des chantiers d’équipe.
                </p>
              </div>

              {!erasureDone ? (
                <div className="space-y-3">
                  <label className="text-xs text-white/70 block uppercase font-bold">
                    Pour valider, veuillez saisir le mot <strong className="text-red">ANONYMISER</strong> ci-dessous :
                  </label>
                  <input
                    type="text"
                    value={confirmKeyword}
                    onChange={e => setConfirmKeyword(e.target.value)}
                    placeholder="Saisissez ANONYMISER"
                    className="form-input font-mono font-bold"
                  />
                  <button
                    onClick={handleExecuteErasure}
                    disabled={confirmKeyword !== 'ANONYMISER'}
                    className="btn btn-danger btn-block py-2.5"
                  >
                    <UserX className="w-4 h-4 text-white" />
                    <span>CONFIRMER L’ANONYMISATION IRRÉVERSIBLE</span>
                  </button>
                </div>
              ) : (
                <div className="alert flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-white shrink-0" />
                  <p className="text-xs font-bold uppercase tracking-wider text-white">
                    Vos données ont été anonymisées avec succès conformément aux exigences du RGPD.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Pied de page */}
        <div className="modal-actions pt-4 border-t border-[#242424]">
          <button
            onClick={onClose}
            className="btn btn-secondary btn-sm"
          >
            FERMER
          </button>
        </div>
      </div>
    </div>
  );
}
