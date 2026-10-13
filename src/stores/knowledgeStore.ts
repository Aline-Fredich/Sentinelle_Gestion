/**
 * SENTINEL GESTION — Store de Domaine : Base de Connaissances
 * Gère les pages de wiki, spécifications techniques, comptes-rendus et documents joints.
 */

import { create } from 'zustand';
import { WikiPage, ProjectDocument } from '@/types/sentinel';
import { INITIAL_WIKI_PAGES, INITIAL_DOCUMENTS } from '@/lib/initialData';
import { generateId } from '@/lib/idUtils';

interface KnowledgeState {
  wikiPages: WikiPage[];
  documents: ProjectDocument[];

  setWikiPages: (wikiPages: WikiPage[]) => void;
  setDocuments: (documents: ProjectDocument[]) => void;

  createWikiPage: (data: Omit<WikiPage, 'id' | 'updatedAt'>) => WikiPage;
  updateWikiPage: (id: string, partial: Partial<WikiPage>) => void;
  deleteWikiPage: (id: string) => void;

  createDocument: (data: Omit<ProjectDocument, 'id' | 'updatedAt'>) => ProjectDocument;
  deleteDocument: (id: string) => void;
}

export const useKnowledgeStore = create<KnowledgeState>((set) => ({
  wikiPages: INITIAL_WIKI_PAGES,
  documents: INITIAL_DOCUMENTS,

  setWikiPages: (wikiPages) => set({ wikiPages }),
  setDocuments: (documents) => set({ documents }),

  createWikiPage: (data) => {
    const newPage: WikiPage = {
      ...data,
      id: generateId('wiki'),
      updatedAt: new Date().toISOString(),
    };
    set((state) => ({ wikiPages: [newPage, ...state.wikiPages] }));
    return newPage;
  },

  updateWikiPage: (id, partial) => {
    set((state) => ({
      wikiPages: state.wikiPages.map((p) =>
        p.id === id ? { ...p, ...partial, updatedAt: new Date().toISOString() } : p
      ),
    }));
  },

  deleteWikiPage: (id) => {
    set((state) => ({
      wikiPages: state.wikiPages.filter((p) => p.id !== id),
    }));
  },

  createDocument: (data) => {
    const newDoc: ProjectDocument = {
      ...data,
      id: generateId('doc'),
      updatedAt: new Date().toISOString(),
    };
    set((state) => ({ documents: [newDoc, ...state.documents] }));
    return newDoc;
  },

  deleteDocument: (id) => {
    set((state) => ({
      documents: state.documents.filter((d) => d.id !== id),
    }));
  },
}));
