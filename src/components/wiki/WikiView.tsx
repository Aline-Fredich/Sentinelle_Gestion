'use client';

import React, { useState } from 'react';
import { 
  BookOpen, Plus, Trash2, Edit3, Pin, 
  Search, FileText, Check, X
} from 'lucide-react';
import { useSentinel } from '@/lib/store';
import { WikiPage } from '@/types/sentinel';

export function WikiView() {
  const { 
    wikiPages, createWikiPage, updateWikiPage, deleteWikiPage, 
    activeProjectId, currentUser, projects 
  } = useSentinel();

  const [selectedPageId, setSelectedPageId] = useState<string>(wikiPages[0]?.id || '');
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [searchWiki, setSearchWiki] = useState('');

  const [showNewPageModal, setShowNewPageModal] = useState(false);
  const [newPageTitle, setNewPageTitle] = useState('');
  const [newPageCategory, setNewPageCategory] = useState<WikiPage['category']>('architecture');
  const [newPageContent, setNewPageContent] = useState('');

  const projectWikiPages = wikiPages.filter(p => {
    const matchesProj = activeProjectId === 'all' || p.projectId === activeProjectId;
    const matchesSearch = p.title.toLowerCase().includes(searchWiki.toLowerCase());
    return matchesProj && matchesSearch;
  });

  const currentPage = wikiPages.find(p => p.id === selectedPageId) || projectWikiPages[0];

  const handleStartEdit = () => {
    if (!currentPage) return;
    setEditTitle(currentPage.title);
    setEditContent(currentPage.content);
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (!currentPage) return;
    updateWikiPage(currentPage.id, {
      title: editTitle,
      content: editContent,
    });
    setIsEditing(false);
  };

  const generateUniqueSlug = (title: string): string => {
    const base = title
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'page';
    let slug = base;
    let counter = 1;
    while (wikiPages.some(p => p.slug === slug)) {
      slug = `${base}-${counter}`;
      counter++;
    }
    return slug;
  };

  const handleCreatePage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPageTitle.trim()) return;

    const fallbackProjectId = projects[0]?.id || 'prj-1';
    const targetProj = activeProjectId === 'all' ? fallbackProjectId : activeProjectId;
    const created = createWikiPage({
      projectId: targetProj,
      title: newPageTitle.trim(),
      slug: generateUniqueSlug(newPageTitle),
      content: newPageContent || `# ${newPageTitle}\n\nRédigez votre documentation ici...`,
      category: newPageCategory,
      authorName: currentUser.name,
      pinned: false,
    });

    setSelectedPageId(created.id);
    setShowNewPageModal(false);
    setNewPageTitle('');
    setNewPageContent('');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* En-tête du module Wiki */}
      <div className="panel flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[6px] border border-red bg-red/10 flex items-center justify-center text-red">
            <BookOpen className="w-5 h-5 text-red" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red shadow-[var(--glow-sm)]" />
              <h1 className="text-base font-bold text-white uppercase tracking-wider">
                WIKI & BASE DE CONNAISSANCES
              </h1>
            </div>
            <p className="text-xs text-white/45 mt-0.5">
              Documentation collaborative, comptes-rendus de réunion et spécifications de projet
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowNewPageModal(true)}
          className="btn btn-primary btn-sm"
        >
          <Plus className="w-4 h-4 text-white" />
          <span>NOUVELLE PAGE</span>
        </button>
      </div>

      {/* Interface Wiki 2 colonnes */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Colonne gauche (1 quart) : Liste des pages */}
        <div className="panel space-y-4">
          <div className="input-group">
            <Search className="w-4 h-4 text-red pointer-events-none" />
            <input
              type="text"
              value={searchWiki}
              onChange={(e) => setSearchWiki(e.target.value)}
              placeholder="Rechercher une note..."
              className="form-input text-xs"
            />
          </div>

          <div className="space-y-1">
            <div className="text-micro font-bold uppercase tracking-wider text-white/45 px-1 py-1">
              DOCUMENTS ({projectWikiPages.length})
            </div>
            {projectWikiPages.length === 0 ? (
              <p className="text-micro text-white/45 p-2 text-center">Aucune page trouvée</p>
            ) : (
              projectWikiPages.map(page => {
                const isSelected = page.id === currentPage?.id;
                return (
                  <button
                    key={page.id}
                    onClick={() => {
                      setSelectedPageId(page.id);
                      setIsEditing(false);
                    }}
                    className={`flex items-center justify-between w-full p-2.5 rounded-[6px] text-xs font-bold text-left uppercase tracking-wide transition border ${
                      isSelected
                        ? 'border-red bg-red/10 text-white'
                        : 'border-transparent text-white/70 hover:bg-[#0D0D0D] hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileText className={`w-3.5 h-3.5 flex-shrink-0 ${isSelected ? 'text-red' : 'text-white/45'}`} />
                      <span className="truncate">{page.title}</span>
                    </div>
                    {page.pinned && (
                      <Pin className={`w-3 h-3 ${isSelected ? 'text-red' : 'text-white/45'}`} />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Colonne droite (3 quarts) : Lecteur / Éditeur de la page */}
        <div className="lg:col-span-3 panel space-y-6 min-h-[500px]">
          {currentPage ? (
            <div>
              {/* En-tête de la page */}
              <div className="flex flex-wrap items-center justify-between pb-4 border-b border-[#242424] gap-3">
                <div>
                  <div className="flex items-center gap-2 text-micro font-mono text-white/45 mb-1">
                    <span className="badge badge--ok text-[9px]">
                      {currentPage.category.toUpperCase()}
                    </span>
                    <span>•</span>
                    <span>RÉDIGÉ PAR {currentPage.authorName.toUpperCase()}</span>
                  </div>

                  {isEditing ? (
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="form-input text-lg font-bold"
                    />
                  ) : (
                    <h1 className="text-xl font-bold text-white uppercase tracking-wide">
                      {currentPage.title}
                    </h1>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {isEditing ? (
                    <button
                      onClick={handleSaveEdit}
                      className="btn btn-primary btn-sm"
                    >
                      <Check className="w-3.5 h-3.5 text-white" />
                      <span>ENREGISTRER</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleStartEdit}
                      className="btn btn-secondary btn-sm"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-red" />
                      <span>MODIFIER</span>
                    </button>
                  )}

                  <button
                    onClick={() => deleteWikiPage(currentPage.id)}
                    className="btn btn-ghost btn-sm p-2 text-white/45 hover:text-red"
                    title="Supprimer la note"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Corps de la page */}
              <div className="mt-6">
                {isEditing ? (
                  <textarea
                    rows={16}
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="form-textarea font-mono text-xs leading-relaxed"
                  />
                ) : (
                  <div className="space-y-2 pt-1 font-sans">
                    {currentPage.content.split('\n').map((line, idx) => {
                      if (line.startsWith('# ')) {
                        return <h1 key={idx} className="text-lg font-bold text-white uppercase mt-4 mb-2 pb-1 border-b border-[#242424]">{line.slice(2)}</h1>;
                      } else if (line.startsWith('## ')) {
                        return <h2 key={idx} className="text-base font-bold text-white uppercase mt-3 mb-1.5">{line.slice(3)}</h2>;
                      } else if (line.startsWith('### ')) {
                        return <h3 key={idx} className="text-sm font-bold text-white uppercase mt-2 mb-1">{line.slice(4)}</h3>;
                      } else if (line.startsWith('> ')) {
                        return (
                          <blockquote key={idx} className="p-3 my-2 border-l-2 border-red bg-red/5 text-white/70 text-xs italic">
                            {line.slice(2)}
                          </blockquote>
                        );
                      } else if (line.startsWith('- ') || line.startsWith('* ')) {
                        return (
                          <div key={idx} className="flex items-start gap-2 ml-2 my-0.5 text-xs text-white/70">
                            <span className="w-1.5 h-1.5 rounded-full bg-red mt-1.5 flex-shrink-0" />
                            <span>{line.slice(2)}</span>
                          </div>
                        );
                      } else if (line.trim().length === 0) {
                        return <div key={idx} className="h-2" />;
                      } else {
                        return <p key={idx} className="text-xs text-white/70 leading-relaxed my-1">{line}</p>;
                      }
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="empty py-20 text-xs text-white/45">
              Sélectionnez une page de documentation ou créez-en une nouvelle.
            </div>
          )}
        </div>
      </div>

      {/* Modale Nouvelle Page */}
      {showNewPageModal && (
        <div className="modal-overlay" onClick={() => setShowNewPageModal(false)} role="dialog" aria-modal="true">
          <div className="modal max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-3 border-b border-[#242424] mb-4">
              <h3 className="modal-title mb-0">
                CRÉER UNE PAGE DE DOCUMENTATION
              </h3>
              <button
                onClick={() => setShowNewPageModal(false)}
                className="btn btn-ghost btn-sm p-1"
                aria-label="Fermer"
              >
                <X className="w-4 h-4 text-white/70" />
              </button>
            </div>

            <form onSubmit={handleCreatePage} className="space-y-4">
              <div className="form-group mb-0">
                <label className="form-label">
                  Titre de la page <span className="req">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newPageTitle}
                  onChange={(e) => setNewPageTitle(e.target.value)}
                  placeholder="Ex : Architecture et conventions d'API"
                  className="form-input"
                />
              </div>

              <div className="form-group mb-0">
                <label className="form-label">
                  Catégorie
                </label>
                <select
                  value={newPageCategory}
                  onChange={(e) => setNewPageCategory(e.target.value as WikiPage['category'])}
                  className="form-select uppercase font-bold text-xs"
                >
                  <option value="architecture">Architecture Technique</option>
                  <option value="specifications">Spécifications Métier</option>
                  <option value="meeting_notes">Comptes-Rendus de Réunion</option>
                  <option value="onboarding">Guide d'Onboarding</option>
                  <option value="guides">Guides & Procédures</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="form-label mb-1">
                  Modèles prêts à l'emploi (1 clic)
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => {
                      setNewPageTitle('Compte-Rendu : Réunion du ' + new Date().toLocaleDateString('fr-FR'));
                      setNewPageCategory('meeting_notes');
                      setNewPageContent(`# Compte-Rendu de Réunion\n\n**Date :** ${new Date().toLocaleDateString('fr-FR')}\n**Participants :** [Noms des participants]\n\n## 1. Ordre du Jour\n* Point d'avancement des tâches\n* Blocages et risques identifiés\n\n## 2. Décisions Validées\n1. Décision A\n2. Décision B\n\n## 3. Plan d'Actions & Responsables\n* [ ] Action 1 — @Responsable (Échéance : JJ/MM)\n* [ ] Action 2 — @Responsable (Échéance : JJ/MM)`);
                    }}
                    className="chip text-[10px]"
                  >
                    📝 COMPTE-RENDU DE RÉUNION
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setNewPageTitle('Spécifications Techniques : [Nom de la Fonctionnalité]');
                      setNewPageCategory('specifications');
                      setNewPageContent(`# Cahier des Charges & Spécifications\n\n## 1. Contexte & Objectif Métier\nExpliquer ici le problème à résoudre et la valeur apportée aux utilisateurs.\n\n## 2. Spécifications Fonctionnelles\n* **Règle 1 :** Comportement attendu\n* **Règle 2 :** Gestion des cas d'erreur\n\n## 3. Architecture & Modèle de Données\n* Tables impactées :\n* Endpoints d'API / Services :\n\n## 4. Critères d'Acceptation & Tests\n* [ ] Scénario nominal validé\n* [ ] Cas limites testés`);
                    }}
                    className="chip text-[10px]"
                  >
                    ⚙️ SPÉCIFICATIONS MÉTIER
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setNewPageTitle('Guide d’Architecture & Normes');
                      setNewPageCategory('architecture');
                      setNewPageContent(`# Guide d'Architecture & Bonnes Pratiques\n\n## 1. Stack Technique\n* Frontend : Next.js 16, React 19, CSS Noir Rouge Blanc\n* State : Store réactif TypeScript\n\n## 2. Conventions de Nommage\n* Composants en PascalCase\n* Fichiers utilitaires en camelCase`);
                    }}
                    className="chip text-[10px]"
                  >
                    🏛️ ARCHITECTURE TECHNIQUE
                  </button>
                </div>

                <label className="form-label mb-1">
                  Contenu de la documentation (Markdown)
                </label>
                <textarea
                  rows={6}
                  value={newPageContent}
                  onChange={(e) => setNewPageContent(e.target.value)}
                  placeholder="Rédigez le texte en markdown..."
                  className="form-textarea font-mono text-xs"
                />
              </div>

              <div className="modal-actions pt-4 border-t border-[#242424]">
                <button
                  type="button"
                  onClick={() => setShowNewPageModal(false)}
                  className="btn btn-secondary btn-sm"
                >
                  ANNULER
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                >
                  PUBLIER LA NOTE
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
