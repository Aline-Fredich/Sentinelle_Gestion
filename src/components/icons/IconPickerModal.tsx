'use client';

import React, { useState, useMemo } from 'react';
import { Search, X, Check, Trash2 } from 'lucide-react';
import { ICON_REGISTRY, ICON_CATEGORIES, IconDefinition } from '@/lib/iconRegistry';

interface IconPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentIconKey?: string;
  onSelectIcon: (iconKey: string | undefined) => void;
  title?: string;
}

export function IconPickerModal({
  isOpen,
  onClose,
  currentIconKey,
  onSelectIcon,
  title = 'Choisir une icône',
}: IconPickerModalProps) {
  const [selectedKey, setSelectedKey] = useState<string | undefined>(currentIconKey);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('Tous');

  // Synchronisation lors de l'ouverture
  React.useEffect(() => {
    if (isOpen) {
      setSelectedKey(currentIconKey);
      setSearchQuery('');
      setActiveCategory('Tous');
    }
  }, [isOpen, currentIconKey]);

  // Filtrage selon recherche et catégorie
  const filteredIcons = useMemo(() => {
    return ICON_REGISTRY.filter((item: IconDefinition) => {
      if (activeCategory !== 'Tous' && item.category !== activeCategory) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchLabel = item.label.toLowerCase().includes(q);
        const matchKey = item.key.toLowerCase().includes(q);
        const matchKeyword = item.keywords.some((k: string) => k.toLowerCase().includes(q));
        if (!matchLabel && !matchKey && !matchKeyword) return false;
      }
      return true;
    });
  }, [activeCategory, searchQuery]);

  if (!isOpen) return null;

  const currentSelectedDef = ICON_REGISTRY.find(item => item.key === selectedKey);

  const handleApply = () => {
    onSelectIcon(selectedKey);
    onClose();
  };

  const handleRemove = () => {
    setSelectedKey(undefined);
    onSelectIcon(undefined);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="icon-picker-title"
    >
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[85vh] overflow-hidden">
        {/* En-tête */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 id="icon-picker-title" className="text-lg font-semibold text-slate-900 dark:text-white">
              {title}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Sélectionnez une icône pour personnaliser l’élément visuel
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            aria-label="Fermer la palette d'icônes"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barre de recherche & catégories */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par mot-clé (ex: sécurité, code, calendrier, projet)..."
              className="w-full pl-10 pr-4 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0066FF] text-slate-900 dark:text-white placeholder:text-slate-400 shadow-sm"
              autoFocus
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Liste de catégories avec défilement horizontal */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-thin">
            {ICON_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  activeCategory === cat
                    ? 'bg-[#0066FF] text-white shadow-sm'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Grille d'icônes */}
        <div className="flex-1 overflow-y-auto p-4 min-h-[260px]">
          {filteredIcons.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Search className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Aucune icône trouvée pour « {searchQuery} »
              </p>
              <button
                onClick={() => { setSearchQuery(''); setActiveCategory('Tous'); }}
                className="mt-3 text-xs text-[#0066FF] dark:text-cyan-400 font-medium hover:underline"
              >
                Réinitialiser la recherche
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2.5">
              {filteredIcons.map((item) => {
                const IconComp = item.icon;
                const isSelected = selectedKey === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setSelectedKey(item.key)}
                    title={item.label}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                      isSelected
                        ? 'border-[#0066FF] bg-blue-50/80 dark:bg-blue-950/40 text-[#0066FF] dark:text-cyan-400 ring-2 ring-blue-500/30'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <IconComp className="w-6 h-6 mb-1.5" />
                    <span className="text-[10px] text-center line-clamp-1 w-full text-slate-500 dark:text-slate-400">
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Aperçu & Barre d'actions */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {currentSelectedDef ? (
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-[#0066FF] text-white flex items-center justify-center shadow-md">
                  {React.createElement(currentSelectedDef.icon, { className: 'w-5 h-5' })}
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-900 dark:text-white">
                    {currentSelectedDef.label}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Catégorie : {currentSelectedDef.category}
                  </div>
                </div>
              </div>
            ) : (
              <span className="text-xs text-slate-500 dark:text-slate-400 italic">
                Aucune icône sélectionnée (icône standard par défaut)
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {selectedKey && (
              <button
                type="button"
                onClick={handleRemove}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition"
                title="Rétablit l'icône par défaut sans supprimer l'élément"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Supprimer l’icône
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#0066FF] hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-md transition"
            >
              <Check className="w-3.5 h-3.5" />
              Appliquer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
