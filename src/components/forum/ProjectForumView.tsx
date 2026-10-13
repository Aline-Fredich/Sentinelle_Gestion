'use client';

import React, { useState } from 'react';
import { 
  MessageSquare, Plus, Pin, CheckCircle2, MessageCircle, 
  Send, ThumbsUp, Rocket, Eye, Search, Filter, Trash2, ArrowLeft,
  Calendar, User
} from 'lucide-react';
import { useSentinel } from '@/lib/store';
import { ForumCategory, ForumTopic, ForumPost } from '@/types/sentinel';
import { formatRelativeTimeFrench } from '@/lib/dateUtils';

export function ProjectForumView() {
  const { 
    currentProject, projects, activeProjectId, setActiveProjectId,
    forumTopics, forumPosts, createForumTopic, createForumPost,
    toggleTopicPin, markPostAsSolution, addReactionToPost, deleteForumTopic,
    currentUser
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

  const categoryLabels: Record<ForumCategory, { label: string; badge: string }> = {
    general: { label: 'Discussions générales', badge: 'bg-slate-100 text-[#667085] dark:bg-slate-800' },
    qa: { label: 'Questions & Réponses', badge: 'bg-blue-50 text-[#3478C8] dark:bg-blue-950/40' },
    decisions: { label: 'Décisions du projet', badge: 'bg-emerald-50 text-[#23845B] dark:bg-emerald-950/40' },
    announcements: { label: 'Annonces du responsable', badge: 'bg-rose-50 text-[#C83B42] dark:bg-rose-950/40' },
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
    <div className="space-y-6">
      {/* En-tête du Forum */}
      <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-[#E4E7EC] dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#C83B42] dark:text-rose-400 mb-1 uppercase tracking-wider">
            <MessageSquare className="w-3.5 h-3.5" />
            Collaboration par projet
          </div>
          <h1 className="text-xl font-bold text-[#202733] dark:text-white">
            Forum & Discussions : {activePrj?.name || 'Projet'}
          </h1>
          <p className="text-xs text-[#667085] dark:text-slate-400 mt-1">
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
            className="text-xs px-3 py-2 bg-[#F6F7F9] dark:bg-slate-800 border border-[#E4E7EC] dark:border-slate-700 rounded-xl font-medium text-[#202733] dark:text-white"
          >
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          <button
            onClick={() => setIsNewTopicOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#C83B42] hover:bg-[#b03037] active:bg-[#99252c] rounded-xl shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Nouveau sujet</span>
          </button>
        </div>
      </div>

      {/* Si un sujet est ouvert : Vue Fil de discussion */}
      {selectedTopic ? (
        <div className="space-y-4">
          <button
            onClick={() => setSelectedTopicId(null)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#667085] hover:text-[#202733] dark:hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Retour à la liste des discussions</span>
          </button>

          {/* Sujet initial */}
          <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-[#E4E7EC] dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={selectedTopic.authorAvatar} alt={selectedTopic.authorName} className="w-10 h-10 rounded-full object-cover" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[#202733] dark:text-white">
                      {selectedTopic.title}
                    </span>
                    {selectedTopic.isPinned && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-[#D69A24] flex items-center gap-1">
                        <Pin className="w-3 h-3" /> Épinglé
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[#667085] mt-0.5">
                    <span>Par {selectedTopic.authorName}</span>
                    <span>•</span>
                    <span>{formatRelativeTimeFrench(selectedTopic.createdAt)}</span>
                    <span>•</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${categoryLabels[selectedTopic.category].badge}`}>
                      {categoryLabels[selectedTopic.category].label}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleTopicPin(selectedTopic.id)}
                  className="p-1.5 text-slate-400 hover:text-amber-500 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                  title="Épingler en haut"
                >
                  <Pin className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    deleteForumTopic(selectedTopic.id);
                    setSelectedTopicId(null);
                  }}
                  className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                  title="Supprimer la discussion"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <p className="text-xs text-[#202733] dark:text-slate-200 leading-relaxed whitespace-pre-wrap pl-13">
              {selectedTopic.body}
            </p>
          </div>

          {/* Liste des réponses */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-[#667085] uppercase tracking-wider">
              Réponses de l’équipe ({selectedPosts.length})
            </h3>

            {selectedPosts.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-[#E4E7EC] dark:border-slate-800">
                Soyez le premier à répondre à ce sujet !
              </div>
            ) : (
              selectedPosts.map(post => {
                const thumbsCount = (post.reactions['👍'] || []).length;
                const rocketsCount = (post.reactions['🚀'] || []).length;

                return (
                  <div
                    key={post.id}
                    className={`p-5 rounded-2xl border transition ${
                      post.isSolution
                        ? 'bg-emerald-50/40 border-emerald-300 dark:border-emerald-800 dark:bg-emerald-950/20'
                        : 'bg-white dark:bg-slate-900 border-[#E4E7EC] dark:border-slate-800'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={post.authorAvatar} alt={post.authorName} className="w-7 h-7 rounded-full object-cover" />
                        <div>
                          <span className="text-xs font-bold text-[#202733] dark:text-white">
                            {post.authorName}
                          </span>
                          <span className="text-[10px] text-[#667085] ml-2">
                            {formatRelativeTimeFrench(post.createdAt)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {post.isSolution ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Solution officielle
                          </span>
                        ) : (
                          <button
                            onClick={() => markPostAsSolution(selectedTopic.id, post.id)}
                            className="text-[11px] font-medium text-emerald-600 hover:underline flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Marquer comme solution</span>
                          </button>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-[#202733] dark:text-slate-200 mt-2.5 leading-relaxed pl-9 whitespace-pre-wrap">
                      {post.body}
                    </p>

                    {/* Réactions */}
                    <div className="flex items-center gap-2 mt-3 pl-9">
                      <button
                        onClick={() => addReactionToPost(post.id, '👍')}
                        className="px-2 py-1 rounded-lg text-xs bg-[#F6F7F9] dark:bg-slate-800 hover:bg-slate-200 flex items-center gap-1 text-[#667085]"
                      >
                        <ThumbsUp className="w-3 h-3 text-blue-500" />
                        <span>{thumbsCount > 0 ? thumbsCount : ''}</span>
                      </button>
                      <button
                        onClick={() => addReactionToPost(post.id, '🚀')}
                        className="px-2 py-1 rounded-lg text-xs bg-[#F6F7F9] dark:bg-slate-800 hover:bg-slate-200 flex items-center gap-1 text-[#667085]"
                      >
                        <Rocket className="w-3 h-3 text-rose-500" />
                        <span>{rocketsCount > 0 ? rocketsCount : ''}</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Formulaire de réponse */}
          <form onSubmit={handleSendReply} className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-[#E4E7EC] dark:border-slate-800 shadow-sm space-y-3">
            <textarea
              required
              rows={3}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Écrivez votre réponse ou proposez une solution..."
              className="w-full p-3 text-xs bg-[#F6F7F9] dark:bg-slate-800 border border-[#E4E7EC] dark:border-slate-700 rounded-xl text-[#202733] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#C83B42]"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#C83B42] hover:bg-[#b03037] active:bg-[#99252c] rounded-xl transition shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Publier la réponse</span>
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* Liste des Sujets */
        <div className="space-y-4">
          {/* Barre de filtres et recherche */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 text-xs font-medium">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1.5 rounded-xl transition ${
                  selectedCategory === 'all'
                    ? 'bg-[#202733] text-white dark:bg-slate-800'
                    : 'bg-white dark:bg-slate-900 text-[#667085] border border-[#E4E7EC] dark:border-slate-800'
                }`}
              >
                Toutes
              </button>
              {(Object.keys(categoryLabels) as ForumCategory[]).map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl transition whitespace-nowrap ${
                    selectedCategory === cat
                      ? 'bg-[#202733] text-white dark:bg-slate-800'
                      : 'bg-white dark:bg-slate-900 text-[#667085] border border-[#E4E7EC] dark:border-slate-800'
                  }`}
                >
                  {categoryLabels[cat].label}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher un sujet..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-[#E4E7EC] dark:border-slate-800 rounded-xl text-[#202733] dark:text-white"
              />
            </div>
          </div>

          {/* Grille des discussions */}
          <div className="space-y-3">
            {projectTopics.length === 0 ? (
              <div className="p-12 text-center text-xs text-[#667085] bg-white dark:bg-slate-900 rounded-2xl border border-[#E4E7EC] dark:border-slate-800">
                Aucune discussion pour ce projet. Cliquez sur « Nouveau sujet » pour lancer le premier échange !
              </div>
            ) : (
              projectTopics.map(topic => (
                <div
                  key={topic.id}
                  onClick={() => setSelectedTopicId(topic.id)}
                  className={`p-4 rounded-2xl bg-white dark:bg-slate-900 border transition cursor-pointer hover:border-slate-400 shadow-sm flex items-start justify-between gap-4 ${
                    topic.isPinned ? 'border-amber-300 dark:border-amber-900/60' : 'border-[#E4E7EC] dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={topic.authorAvatar} alt={topic.authorName} className="w-9 h-9 rounded-full object-cover mt-0.5" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-[#202733] dark:text-white truncate">
                          {topic.title}
                        </h3>
                        {topic.isPinned && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-[#D69A24] flex items-center gap-0.5">
                            <Pin className="w-3 h-3" /> Épinglé
                          </span>
                        )}
                        {topic.solutionPostId && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-[#23845B] flex items-center gap-0.5">
                            <CheckCircle2 className="w-3 h-3" /> Résolu
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-[#667085] dark:text-slate-400 line-clamp-1 mt-1">
                        {topic.body}
                      </p>

                      <div className="flex items-center gap-3 text-[11px] text-[#667085] mt-2">
                        <span>{topic.authorName}</span>
                        <span>•</span>
                        <span>{formatRelativeTimeFrench(topic.createdAt)}</span>
                        <span>•</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${categoryLabels[topic.category].badge}`}>
                          {categoryLabels[topic.category].label}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[#667085] flex-shrink-0 pt-1">
                    <MessageCircle className="w-4 h-4 text-slate-400" />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-lg w-full border border-[#E4E7EC] dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#E4E7EC] dark:border-slate-800">
              <h2 className="text-sm font-bold text-[#202733] dark:text-white">
                Ouvrir une nouvelle discussion
              </h2>
              <button onClick={() => setIsNewTopicOpen(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTopic} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#202733] dark:text-slate-300 mb-1">
                  Titre du sujet *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ex : Choix technique sur le composant d’export PDF..."
                  className="w-full px-3 py-2 bg-[#F6F7F9] dark:bg-slate-800 border border-[#E4E7EC] dark:border-slate-700 rounded-xl text-[#202733] dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#202733] dark:text-slate-300 mb-1">
                  Catégorie
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as ForumCategory)}
                  className="w-full px-3 py-2 bg-[#F6F7F9] dark:bg-slate-800 border border-[#E4E7EC] dark:border-slate-700 rounded-xl text-[#202733] dark:text-white"
                >
                  <option value="general">Discussions générales</option>
                  <option value="qa">Questions & Réponses</option>
                  <option value="decisions">Décisions du projet</option>
                  <option value="announcements">Annonces du responsable</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#202733] dark:text-slate-300 mb-1">
                  Contenu de la discussion *
                </label>
                <textarea
                  required
                  rows={4}
                  value={newBody}
                  onChange={(e) => setNewBody(e.target.value)}
                  placeholder="Détaillez le contexte, la question ou la proposition..."
                  className="w-full p-3 bg-[#F6F7F9] dark:bg-slate-800 border border-[#E4E7EC] dark:border-slate-700 rounded-xl text-[#202733] dark:text-white"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsNewTopicOpen(false)}
                  className="px-3.5 py-2 text-[#667085] hover:bg-[#F6F7F9] rounded-xl font-medium"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-semibold text-white bg-[#C83B42] hover:bg-[#b03037] active:bg-[#99252c] rounded-xl shadow-sm"
                >
                  Créer le sujet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
