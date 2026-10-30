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
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="icon-picker-title"
      onClick={onClose}
    >
      <div 
        className="modal max-w-2xl flex flex-col max-h-[85vh] overflow-hidden p-0"
        onClick={e => e.stopPropagation()}
      >
        {/* En-tête */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--line)] bg-[#050505]">
          <div>
            <h2 id="icon-picker-title" className="modal-title mb-0">
              {title.toUpperCase()}
            </h2>
            <p className="text-xs text-[var(--white-70)] mt-0.5">
              Sélectionnez une icône pour personnaliser l’élément visuel
            </p>
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-icon btn-sm"
            aria-label="Fermer la palette d'icônes"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Barre de recherche & catégories */}
        <div className="p-4 border-b border-[var(--line)] bg-black space-y-3">
          <div className="input-group">
            <Search className="w-4 h-4 text-[var(--red)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par mot-clé (ex: sécurité, code, calendrier, projet)..."
              className="form-input text-xs"
              autoFocus
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="btn btn-ghost btn-icon btn-sm absolute right-2 top-1/2 -translate-y-1/2"
                aria-label="Effacer la recherche"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Liste de catégories avec onglets */}
          <div className="tabs">
            {ICON_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className="tab"
                aria-selected={activeCategory === cat}
              >
                {cat.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Grille d'icônes */}
        <div className="flex-1 overflow-y-auto p-4 min-h-[260px] bg-[#050505]">
          {filteredIcons.length === 0 ? (
            <div className="empty py-12">
              <Search className="w-8 h-8 text-[var(--red)] mb-2" />
              <p className="text-xs font-bold text-white uppercase tracking-wider">
                Aucune icône trouvée pour « {searchQuery} »
              </p>
              <button
                onClick={() => { setSearchQuery(''); setActiveCategory('Tous'); }}
                className="btn btn-secondary btn-sm mt-3"
              >
                RÉINITIALISER LA RECHERCHE
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
              {filteredIcons.map((item) => {
                const IconComp = item.icon;
                const isSelected = selectedKey === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setSelectedKey(item.key)}
                    title={item.label}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-[var(--r-xs)] border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[var(--red)] bg-[var(--red-tint)] text-white shadow-[var(--glow-sm)]'
                        : 'border-[var(--line)] hover:border-[var(--line-strong)] bg-black text-[var(--red)] hover:bg-[#0D0D0D]'
                    }`}
                  >
                    <IconComp className="w-5 h-5 mb-1.5" />
                    <span className="text-[10px] text-center line-clamp-1 w-full text-[var(--white-70)] font-mono">
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Aperçu & Barre d'actions */}
        <div className="px-6 py-4 border-t border-[var(--line)] bg-black flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {currentSelectedDef ? (
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-[var(--r-xs)] bg-black border border-[var(--red)] text-[var(--red)] flex items-center justify-center shadow-[var(--glow-sm)]">
                  {React.createElement(currentSelectedDef.icon, { className: 'w-5 h-5' })}
                </div>
                <div>
                  <div className="text-xs font-bold text-white uppercase tracking-wider">
                    {currentSelectedDef.label}
                  </div>
                  <div className="text-[11px] text-[var(--white-45)] font-mono">
                    Catégorie : {currentSelectedDef.category.toUpperCase()}
                  </div>
                </div>
              </div>
            ) : (
              <span className="text-xs text-[var(--white-45)] italic">
                Aucune icône sélectionnée (icône standard par défaut)
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {selectedKey && (
              <button
                type="button"
                onClick={handleRemove}
                className="btn btn-danger btn-sm"
                title="Rétablit l'icône par défaut sans supprimer l'élément"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>SUPPRIMER</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary btn-sm"
            >
              ANNULER
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="btn btn-primary btn-sm"
            >
              <Check className="w-3.5 h-3.5" />
              <span>APPLIQUER</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
