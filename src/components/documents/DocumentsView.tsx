'use client';

import React, { useState } from 'react';
import { FileText, Search, Plus, Tag, BookOpen, Clock, Check } from 'lucide-react';
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
    <div className="space-y-4">
      <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            Documents & Bases documentaires
          </h2>
          <p className="text-xs text-slate-500">
            Spécifications fonctionnelles, architectures techniques et livrables de projet
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Liste des documents */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchDoc}
              onChange={(e) => setSearchDoc(e.target.value)}
              placeholder="Rechercher un document..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
            />
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {filteredDocs.map(doc => {
              const isSelected = selectedDoc?.id === doc.id;
              return (
                <div
                  key={doc.id}
                  onClick={() => setSelectedDoc(doc)}
                  className={`p-3.5 rounded-xl border transition cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50/80 dark:bg-blue-950/40 border-[#0066FF] text-blue-900 dark:text-cyan-200'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="w-4 h-4 text-[#0066FF]" />
                    <h4 className="text-xs font-bold truncate">
                      {doc.title}
                    </h4>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                    {doc.content}
                  </p>
                  <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-100 dark:border-slate-700/50 text-xs text-slate-400">
                    <span>{doc.authorName}</span>
                    <span>{formatShortDateFrench(doc.updatedAt.split('T')[0])}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Aperçu du document sélectionné */}
        <div className="md:col-span-2 p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm min-h-[500px]">
          {selectedDoc ? (
            <div className="space-y-4">
              <div className="pb-4 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-[#0066FF] dark:bg-blue-950 dark:text-cyan-400">
                  {selectedDoc.category}
                </span>
                <h3 className="text-lg font-black text-slate-900 dark:text-white mt-2">
                  {selectedDoc.title}
                </h3>
                <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                  <span>Auteur : {selectedDoc.authorName}</span>
                  <span>•</span>
                  <span>Dernière mise à jour : {formatShortDateFrench(selectedDoc.updatedAt.split('T')[0])}</span>
                </div>
              </div>

              <div className="prose dark:prose-invert max-w-none text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                {selectedDoc.content}
              </div>

              {selectedDoc.tags && (
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                  <Tag className="w-3.5 h-3.5 text-slate-400" />
                  <div className="flex gap-1.5">
                    {selectedDoc.tags.map((t, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center text-slate-400 text-xs">
              <BookOpen className="w-10 h-10 mb-2 opacity-30" />
              <span>Sélectionnez un document à consulter</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
