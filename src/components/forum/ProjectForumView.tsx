'use client';

import React, { useState } from 'react';
import { 
  MessageSquare, Plus, Pin, CheckCircle2, MessageCircle, 
  Send, ThumbsUp, Rocket, Search, Trash2, ArrowLeft
} from 'lucide-react';
import { useSentinel } from '@/lib/store';
import { ForumCategory } from '@/types/sentinel';
import { formatRelativeTimeFrench } from '@/lib/dateUtils';

export function ProjectForumView() {
  const { 
    projects, activeProjectId, setActiveProjectId,
    forumTopics, forumPosts, createForumTopic, createForumPost,
    toggleTopicPin, markPostAsSolution, addReactionToPost, deleteForumTopic
  } = useSentinel();

  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<ForumCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modale nouveau sujet
  const [isNewTopicOpen, setIsNewTopicOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newBody, setNewBody] = useState('');
  const [newCategory, setNewCategory] = useState<ForumCategory>('general');

  // Réponse rapide
  const [replyText, setReplyText] = useState('');

  const targetProjectId = activeProjectId !== 'all' ? activeProjectId : (projects[0]?.id || 'prj-1');
  const activePrj = projects.find(p => p.id === targetProjectId);

  // Filtrer les sujets du projet actif
  const projectTopics = forumTopics.filter(t => {
    if (t.projectId !== targetProjectId) return false;
    if (selectedCategory !== 'all' && t.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return t.title.toLowerCase().includes(q) || t.body.toLowerCase().includes(q);
    }
    return true;
  }).sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));

  const selectedTopic = forumTopics.find(t => t.id === selectedTopicId);
  const selectedPosts = forumPosts.filter(p => p.topicId === selectedTopicId);

  const categoryLabels: Record<ForumCategory, { label: string }> = {
    general: { label: 'Discussions générales' },
    qa: { label: 'Questions & Réponses' },
    decisions: { label: 'Décisions du projet' },
    announcements: { label: 'Annonces du responsable' },
  };

  const handleCreateTopic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newBody.trim()) return;

    createForumTopic({
      projectId: targetProjectId,
      title: newTitle.trim(),
      body: newBody.trim(),
      category: newCategory,
    });

    setNewTitle('');
    setNewBody('');
    setIsNewTopicOpen(false);
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTopicId || !replyText.trim()) return;

    createForumPost(selectedTopicId, replyText.trim());
    setReplyText('');
  };

  return (
    <div className="stack animate-in fade-in duration-200">
      {/* En-tête du Forum */}
      <div className="panel flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="panel-title text-xs">
            FORUM DE COLLABORATION PAR PROJET
          </div>
          <h1 className="text-xl font-bold text-white uppercase tracking-tight">
            ÉCHANGES & DÉCISIONS : {activePrj?.name || 'Projet'}
          </h1>
          <p className="text-xs text-[var(--white-70)] mt-1">
            Échangez avec l’équipe, posez des questions techniques et actez les décisions officielles du projet.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={targetProjectId}
            onChange={(e) => {
              setActiveProjectId(e.target.value);
              setSelectedTopicId(null);
            }}
            className="form-select font-mono text-xs w-auto min-h-[38px]"
          >
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          <button
            onClick={() => setIsNewTopicOpen(true)}
            className="btn btn-primary"
          >
            <Plus className="w-4 h-4" />
            <span>NOUVEAU SUJET</span>
          </button>
        </div>
      </div>

      {/* Si un sujet est ouvert : Vue Fil de discussion */}
      {selectedTopic ? (
        <div className="stack">
          <button
            onClick={() => setSelectedTopicId(null)}
            className="btn btn-ghost btn-sm self-start"
          >
            <ArrowLeft className="w-4 h-4 text-[var(--red)]" />
            <span>RETOUR AUX DISCUSSIONS</span>
          </button>

          {/* Sujet initial */}
          <div className="panel space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={selectedTopic.authorAvatar} alt={selectedTopic.authorName} className="w-10 h-10 rounded-[var(--r-xs)] border border-[var(--red-soft)] object-cover" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white uppercase tracking-wider">
                      {selectedTopic.title}
                    </span>
                    {selectedTopic.isPinned && (
                      <span className="badge badge--bad text-[10px]">
                        <Pin className="w-3 h-3 text-[var(--red)] mr-1 inline" /> ÉPINGLÉ
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[var(--white-45)] mt-1 font-mono">
                    <span className="text-white font-semibold">Par {selectedTopic.authorName}</span>
                    <span>•</span>
                    <span>{formatRelativeTimeFrench(selectedTopic.createdAt)}</span>
                    <span>•</span>
                    <span className="badge text-[10px] uppercase">
                      {categoryLabels[selectedTopic.category].label}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => toggleTopicPin(selectedTopic.id)}
                  className="btn btn-ghost btn-icon btn-sm"
                  title="Épingler en haut"
                  aria-label="Épingler le sujet"
                >
                  <Pin className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    deleteForumTopic(selectedTopic.id);
                    setSelectedTopicId(null);
                  }}
                  className="btn btn-ghost btn-icon btn-sm text-[var(--red)] hover:bg-[var(--red-tint)]"
                  title="Supprimer la discussion"
                  aria-label="Supprimer la discussion"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <p className="text-xs text-[var(--white-70)] leading-relaxed whitespace-pre-wrap pl-13 card-inner">
              {selectedTopic.body}
            </p>
          </div>

          {/* Liste des réponses */}
          <div className="space-y-3">
            <h3 className="panel-title text-xs">
              RÉPONSES DE L’ÉQUIPE ({selectedPosts.length})
            </h3>

            {selectedPosts.length === 0 ? (
              <div className="panel p-8 text-center text-xs text-[var(--white-45)]">
                Soyez le premier à répondre à ce sujet !
              </div>
            ) : (
              selectedPosts.map(post => {
                const thumbsCount = (post.reactions['👍'] || []).length;
                const rocketsCount = (post.reactions['🚀'] || []).length;

                return (
                  <div
                    key={post.id}
                    className={`panel ${
                      post.isSolution ? 'border-[var(--red)] bg-[var(--red-tint)] shadow-[var(--glow-sm)]' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={post.authorAvatar} alt={post.authorName} className="w-7 h-7 rounded-[var(--r-xs)] border border-[var(--line-strong)] object-cover" />
                        <div>
                          <span className="text-xs font-bold text-white">
                            {post.authorName}
                          </span>
                          <span className="text-[10px] text-[var(--white-45)] ml-2 font-mono">
                            {formatRelativeTimeFrench(post.createdAt)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {post.isSolution ? (
                          <span className="badge badge--ok text-[10px]">
                            <CheckCircle2 className="w-3 h-3 mr-1 inline" /> SOLUTION OFFICIELLE
                          </span>
                        ) : (
                          <button
                            onClick={() => markPostAsSolution(selectedTopic.id, post.id)}
                            className="btn btn-ghost btn-sm text-[11px]"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-[var(--red)]" />
                            <span>MARQUER COMME SOLUTION</span>
                          </button>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-[var(--white-70)] mt-2.5 leading-relaxed whitespace-pre-wrap pl-9">
                      {post.body}
                    </p>

                    {/* Réactions */}
                    <div className="flex items-center gap-2 mt-3 pl-9">
                      <button
                        onClick={() => addReactionToPost(post.id, '👍')}
                        className="btn btn-secondary btn-sm"
                      >
                        <ThumbsUp className="w-3 h-3 text-[var(--red)]" />
                        <span className="font-mono text-xs">{thumbsCount > 0 ? thumbsCount : ''}</span>
                      </button>
                      <button
                        onClick={() => addReactionToPost(post.id, '🚀')}
                        className="btn btn-secondary btn-sm"
                      >
                        <Rocket className="w-3 h-3 text-[var(--red)]" />
                        <span className="font-mono text-xs">{rocketsCount > 0 ? rocketsCount : ''}</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Formulaire de réponse */}
          <form onSubmit={handleSendReply} className="panel space-y-3">
            <textarea
              required
              rows={3}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Écrivez votre réponse ou proposez une solution..."
              className="form-textarea"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                className="btn btn-primary"
              >
                <Send className="w-4 h-4" />
                <span>PUBLIER LA RÉPONSE</span>
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* Liste des Sujets */
        <div className="space-y-4">
          {/* Barre de filtres et recherche */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="tabs">
              <button
                onClick={() => setSelectedCategory('all')}
                className="tab"
                aria-selected={selectedCategory === 'all'}
              >
                TOUTES
              </button>
              {(Object.keys(categoryLabels) as ForumCategory[]).map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className="tab"
                  aria-selected={selectedCategory === cat}
                >
                  {categoryLabels[cat].label.toUpperCase()}
                </button>
              ))}
            </div>

            <div className="input-group w-full sm:w-64">
              <Search className="w-4 h-4 text-[var(--red)]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher un sujet..."
                className="form-input text-xs"
              />
            </div>
          </div>

          {/* Grille des discussions */}
          <div className="space-y-3">
            {projectTopics.length === 0 ? (
              <div className="empty panel">
                <MessageSquare className="w-8 h-8 text-[var(--red)]" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  AUCUNE DISCUSSION POUR CE PROJET
                </h3>
                <p className="text-xs text-[var(--white-70)]">
                  Cliquez sur « NOUVEAU SUJET » pour lancer le premier échange entre collaborateurs !
                </p>
                <button
                  onClick={() => setIsNewTopicOpen(true)}
                  className="btn btn-primary btn-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>CRÉER LE PREMIER SUJET</span>
                </button>
              </div>
            ) : (
              projectTopics.map(topic => (
                <div
                  key={topic.id}
                  onClick={() => setSelectedTopicId(topic.id)}
                  className={`panel panel--interactive flex items-start justify-between gap-4 ${
                    topic.isPinned ? 'border-[var(--red-soft)] bg-[var(--red-tint)]' : ''
                  }`}
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={topic.authorAvatar} alt={topic.authorName} className="w-9 h-9 rounded-[var(--r-xs)] border border-[var(--line-strong)] object-cover mt-0.5" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider truncate">
                          {topic.title}
                        </h3>
                        {topic.isPinned && (
                          <span className="badge badge--bad text-[9px]">
                            <Pin className="w-3 h-3 text-[var(--red)] mr-1 inline" /> ÉPINGLÉ
                          </span>
                        )}
                        {topic.solutionPostId && (
                          <span className="badge badge--ok text-[9px]">
                            <CheckCircle2 className="w-3 h-3 mr-1 inline" /> RÉSOLU
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-[var(--white-70)] line-clamp-1 mt-1">
                        {topic.body}
                      </p>

                      <div className="flex items-center gap-3 text-[11px] text-[var(--white-45)] mt-2 font-mono">
                        <span className="text-white font-semibold">Par {topic.authorName}</span>
                        <span>•</span>
                        <span>{formatRelativeTimeFrench(topic.createdAt)}</span>
                        <span>•</span>
                        <span className="badge text-[9px] uppercase">
                          {categoryLabels[topic.category].label}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-[var(--white-70)] flex-none pt-1">
                    <MessageCircle className="w-4 h-4 text-[var(--red)]" />
                    <span>{topic.replyCount}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Modale Nouveau Sujet */}
      {isNewTopicOpen && (
        <div className="modal-overlay" onClick={() => setIsNewTopicOpen(false)}>
          <div 
            className="modal max-w-lg w-full"
            onClick={e => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[var(--line)] mb-4">
              <h2 className="modal-title mb-0">
                OUVRIR UNE NOUVELLE DISCUSSION
              </h2>
              <button 
                onClick={() => setIsNewTopicOpen(false)} 
                className="btn btn-ghost btn-icon btn-sm"
                aria-label="Fermer la modale"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTopic} className="space-y-4">
              <div className="form-group mb-0">
                <label className="form-label">
                  Titre du sujet <span className="req">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ex : Choix technique sur le composant d’export PDF..."
                  className="form-input"
                />
              </div>

              <div className="form-group mb-0">
                <label className="form-label">
                  Catégorie
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as ForumCategory)}
                  className="form-select font-mono"
                >
                  <option value="general">DISCUSSIONS GÉNÉRALES</option>
                  <option value="qa">QUESTIONS & RÉPONSES</option>
                  <option value="decisions">DÉCISIONS DU PROJET</option>
                  <option value="announcements">ANNONCES DU RESPONSABLE</option>
                </select>
              </div>

              <div className="form-group mb-0">
                <label className="form-label">
                  Contenu de la discussion <span className="req">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={newBody}
                  onChange={(e) => setNewBody(e.target.value)}
                  placeholder="Détaillez le contexte, la question ou la proposition..."
                  className="form-textarea"
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setIsNewTopicOpen(false)}
                  className="btn btn-secondary"
                >
                  ANNULER
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  CRÉER LE SUJET
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
