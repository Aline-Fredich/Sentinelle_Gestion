'use client';

import React, { useState } from 'react';
import { 
  BookOpen, Plus, Trash2, Edit3, Pin, 
  Search, FileText, Check
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
    <div className="space-y-6">
      {/* En-tête du module Wiki */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-[#0066FF] shadow-sm">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Wiki & Base de Connaissances
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Documentation collaborative, comptes-rendus de réunion et spécifications de projet
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowNewPageModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#0066FF] hover:bg-blue-600 rounded-xl shadow-md shadow-blue-500/20 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Nouvelle page</span>
        </button>
      </div>

      {/* Interface Wiki 2 colonnes : Arborescence & Contenu */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Colonne gauche (1 quart) : Liste des pages */}
        <div className="p-4 bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchWiki}
              onChange={(e) => setSearchWiki(e.target.value)}
              placeholder="Rechercher une note..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
            />
          </div>

          <div className="space-y-1">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1">
              Documents ({projectWikiPages.length})
            </div>
            {projectWikiPages.length === 0 ? (
              <p className="text-xs text-slate-400 p-2 text-center">Aucune page trouvée</p>
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
                    className={`flex items-center justify-between w-full p-2.5 rounded-xl text-xs font-semibold text-left transition ${
                      isSelected
                        ? 'bg-[#0066FF] text-white shadow-md shadow-blue-500/20'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileText className={`w-3.5 h-3.5 flex-shrink-0 ${isSelected ? 'text-white' : 'text-blue-500'}`} />
                      <span className="truncate">{page.title}</span>
                    </div>
                    {page.pinned && (
                      <Pin className={`w-3 h-3 ${isSelected ? 'text-white' : 'text-amber-500'}`} />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Colonne droite (3 quarts) : Lecteur / Éditeur de la page */}
        <div className="lg:col-span-3 bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-6 min-h-[500px]">
          {currentPage ? (
            <div>
              {/* En-tête de la page */}
              <div className="flex flex-wrap items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-3">
                <div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                    <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-semibold uppercase">
                      {currentPage.category}
                    </span>
                    <span>•</span>
                    <span>Rédigé par {currentPage.authorName}</span>
                  </div>

                  {isEditing ? (
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="text-xl font-bold text-slate-900 dark:text-white px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 w-full"
                    />
                  ) : (
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                      {currentPage.title}
                    </h1>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {isEditing ? (
                    <button
                      onClick={handleSaveEdit}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Enregistrer</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleStartEdit}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Modifier</span>
                    </button>
                  )}

                  <button
                    onClick={() => deleteWikiPage(currentPage.id)}
                    className="p-2 text-slate-400 hover:text-[#FF1E27] rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
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
                    className="w-full p-4 text-sm font-mono rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white leading-relaxed"
                  />
                ) : (
                  <div className="space-y-1 pt-1">
                    {currentPage.content.split('\n').map((line, idx) => {
                      if (line.startsWith('# ')) {
                        return <h1 key={idx} className="text-xl font-bold text-slate-900 dark:text-white mt-4 mb-2 pb-1 border-b border-slate-200 dark:border-slate-800">{line.slice(2)}</h1>;
                      } else if (line.startsWith('## ')) {
                        return <h2 key={idx} className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-3 mb-1.5">{line.slice(3)}</h2>;
                      } else if (line.startsWith('### ')) {
                        return <h3 key={idx} className="text-base font-bold text-slate-800 dark:text-slate-200 mt-2 mb-1">{line.slice(4)}</h3>;
                      } else if (line.startsWith('> ')) {
                        return (
                          <blockquote key={idx} className="p-3 my-2 border-l-4 border-[#0066FF] bg-blue-50/50 dark:bg-blue-950/20 text-slate-700 dark:text-slate-300 rounded-r-xl text-sm italic">
                            {line.slice(2)}
                          </blockquote>
                        );
                      } else if (line.startsWith('- ') || line.startsWith('* ')) {
                        return (
                          <div key={idx} className="flex items-start gap-2 ml-2 my-0.5 text-sm text-slate-700 dark:text-slate-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#0066FF] mt-2 flex-shrink-0" />
                            <span>{line.slice(2)}</span>
                          </div>
                        );
                      } else if (line.trim().length === 0) {
                        return <div key={idx} className="h-2" />;
                      } else {
                        return <p key={idx} className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed my-1">{line}</p>;
                      }
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="py-20 text-center text-slate-400 text-sm">
              Sélectionnez une page de documentation ou créez-en une nouvelle.
            </div>
          )}
        </div>
      </div>

      {/* Modale Nouvelle Page */}
      {showNewPageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#0F172A] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
              Créer une page de documentation
            </h3>
            <form onSubmit={handleCreatePage} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Titre de la page
                </label>
                <input
                  type="text"
                  required
                  value={newPageTitle}
                  onChange={(e) => setNewPageTitle(e.target.value)}
                  placeholder="Ex : Architecture et conventions d'API"
                  className="w-full px-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Catégorie
                </label>
                <select
                  value={newPageCategory}
                  onChange={(e) => setNewPageCategory(e.target.value as WikiPage['category'])}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                >
                  <option value="architecture">Architecture Technique</option>
                  <option value="specifications">Spécifications Métier</option>
                  <option value="meeting_notes">Comptes-Rendus de Réunion</option>
                  <option value="onboarding">Guide d'Onboarding</option>
                  <option value="guides">Guides & Procédures</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                  Modèles prêts à l'emploi (1 clic)
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => {
                      setNewPageTitle('Compte-Rendu : Réunion du ' + new Date().toLocaleDateString('fr-FR'));
                      setNewPageCategory('meeting_notes');
                      setNewPageContent(`# Compte-Rendu de Réunion\n\n**Date :** ${new Date().toLocaleDateString('fr-FR')}\n**Participants :** [Noms des participants]\n\n## 1. Ordre du Jour\n* Point d'avancement des tâches\n* Blocages et risques identifiés\n\n## 2. Décisions Validées\n1. Décision A\n2. Décision B\n\n## 3. Plan d'Actions & Responsables\n* [ ] Action 1 — @Responsable (Échéance : JJ/MM)\n* [ ] Action 2 — @Responsable (Échéance : JJ/MM)`);
                    }}
                    className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-blue-50 dark:bg-blue-950 text-[#0066FF] border border-blue-200 dark:border-blue-800 hover:bg-blue-100 transition"
                  >
                    📝 Compte-Rendu de Réunion
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setNewPageTitle('Spécifications Techniques : [Nom de la Fonctionnalité]');
                      setNewPageCategory('specifications');
                      setNewPageContent(`# Cahier des Charges & Spécifications\n\n## 1. Contexte & Objectif Métier\nExpliquer ici le problème à résoudre et la valeur apportée aux utilisateurs.\n\n## 2. Spécifications Fonctionnelles\n* **Règle 1 :** Comportement attendu\n* **Règle 2 :** Gestion des cas d'erreur\n\n## 3. Architecture & Modèle de Données\n* Tables impactées :\n* Endpoints d'API / Services :\n\n## 4. Critères d'Acceptation & Tests\n* [ ] Scénario nominal validé\n* [ ] Cas limites testés`);
                    }}
                    className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition"
                  >
                    ⚙️ Spécifications Métier
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setNewPageTitle('Guide d’Architecture & Normes');
                      setNewPageCategory('architecture');
                      setNewPageContent(`# Guide d'Architecture & Bonnes Pratiques\n\n## 1. Stack Technique\n* Frontend : Next.js 16, React 19, Tailwind CSS\n* State : Store réactif TypeScript\n\n## 2. Conventions de Nommage\n* Composants en PascalCase\n* Fichiers utilitaires en camelCase`);
                    }}
                    className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-purple-50 dark:bg-purple-950 text-purple-600 border border-purple-200 dark:border-purple-800 hover:bg-purple-100 transition"
                  >
                    🏛️ Architecture Technique
                  </button>
                </div>

                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Contenu de la documentation (Markdown)
                </label>
                <textarea
                  rows={6}
                  value={newPageContent}
                  onChange={(e) => setNewPageContent(e.target.value)}
                  placeholder="Rédigez le texte en markdown..."
                  className="w-full px-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowNewPageModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-[#0066FF] hover:bg-blue-600 rounded-xl shadow-md"
                >
                  Publier la note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
