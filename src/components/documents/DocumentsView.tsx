'use client';

import React, { useState } from 'react';
import { FileText, Search, Tag, BookOpen } from 'lucide-react';
import { useSentinel } from '@/lib/store';
import { formatShortDateFrench } from '@/lib/dateUtils';
import { ProjectDocument } from '@/types/sentinel';

export function DocumentsView() {
  const { documents, currentProject } = useSentinel();
  const [selectedDoc, setSelectedDoc] = useState<ProjectDocument | null>(documents[0] || null);
  const [searchDoc, setSearchDoc] = useState('');

  const filteredDocs = documents.filter(d => {
    if (searchDoc.trim()) {
      const q = searchDoc.toLowerCase();
      return d.title.toLowerCase().includes(q) || d.content.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-12">
      <div className="panel flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-red shadow-[var(--glow-sm)]" />
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              DOCUMENTS & BASES DOCUMENTAIRES
            </h2>
            <p className="text-xs text-white/45">
              Spécifications fonctionnelles, architectures techniques et livrables de projet
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Liste des documents */}
        <div className="space-y-3">
          <div className="input-group">
            <Search className="w-4 h-4 text-red pointer-events-none" />
            <input
              type="text"
              value={searchDoc}
              onChange={(e) => setSearchDoc(e.target.value)}
              placeholder="Rechercher un document..."
              className="form-input text-xs"
            />
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {filteredDocs.map(doc => {
              const isSelected = selectedDoc?.id === doc.id;
              return (
                <div
                  key={doc.id}
                  onClick={() => setSelectedDoc(doc)}
                  className={`card-inner cursor-pointer transition ${
                    isSelected
                      ? 'border-red bg-red/10'
                      : 'border-[#242424] hover:border-white/40'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="w-4 h-4 text-red flex-none" />
                    <h4 className="text-xs font-bold text-white uppercase tracking-wide truncate">
                      {doc.title}
                    </h4>
                  </div>
                  <p className="text-micro text-white/45 line-clamp-2">
                    {doc.content}
                  </p>
                  <div className="flex items-center justify-between pt-2 mt-2 border-t border-[#242424] text-micro font-mono text-white/45">
                    <span>{doc.authorName}</span>
                    <span>{formatShortDateFrench(doc.updatedAt.split('T')[0])}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Aperçu du document sélectionné */}
        <div className="md:col-span-2 panel min-h-[500px]">
          {selectedDoc ? (
            <div className="space-y-4">
              <div className="pb-4 border-b border-[#242424]">
                <span className="badge badge--ok text-[9px]">
                  {selectedDoc.category.toUpperCase()}
                </span>
                <h3 className="text-base font-bold text-white uppercase tracking-wide mt-2">
                  {selectedDoc.title}
                </h3>
                <div className="flex items-center gap-3 text-micro text-white/45 font-mono mt-1">
                  <span>AUTEUR : {selectedDoc.authorName.toUpperCase()}</span>
                  <span>•</span>
                  <span>DERNIÈRE MISE À JOUR : {formatShortDateFrench(selectedDoc.updatedAt.split('T')[0])}</span>
                </div>
              </div>

              <div className="text-xs text-white/70 leading-relaxed whitespace-pre-wrap font-sans">
                {selectedDoc.content}
              </div>

              {selectedDoc.tags && (
                <div className="pt-4 border-t border-[#242424] flex items-center gap-2">
                  <Tag className="w-3.5 h-3.5 text-red" />
                  <div className="flex gap-1.5">
                    {selectedDoc.tags.map((t, idx) => (
                      <span key={idx} className="badge text-[9px] py-0 px-1.5">
                        {t.toUpperCase()}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="empty py-24">
              <BookOpen className="w-8 h-8 text-white/30" />
              <span className="text-micro text-white/45 uppercase tracking-wider">Sélectionnez un document à consulter</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
