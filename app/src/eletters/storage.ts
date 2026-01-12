// AI-AGENT-HEADER
// path: /src/eletters/storage.ts
// summary: localStorage persistence for eLetter drafts, templates, and designs.
// last-reviewed: 2025-12-17
// line-range: 1-220

import { nanoid } from 'nanoid';
import type { Letter } from '../types/editor';
import type { EletterDraft, EletterStatus, SavedDesign, Template } from './types';
import { createBlankLetter, getLibraryTemplates, getSeedDesigns, getSeedDrafts, getSeedUserTemplates } from './seed';
import { getDraftKind } from './metrics';

const DRAFTS_KEY = 'eletters:drafts:v1';
// Bump version to reseed library with updated catalog from template-recipes.yaml
const TEMPLATES_KEY = 'eletters:templates:v3';
const DESIGNS_KEY = 'eletters:designs:v1';

export function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore quota/serialization issues for now
  }
}

export function ensureSeedData(): void {
  const drafts = loadFromStorage<EletterDraft[]>(DRAFTS_KEY, []);
  const templates = loadFromStorage<Template[]>(TEMPLATES_KEY, []);
  const designs = loadFromStorage<SavedDesign[]>(DESIGNS_KEY, []);

  if (drafts.length === 0) {
    saveToStorage(DRAFTS_KEY, getSeedDrafts());
  } else {
    const hasInformative = drafts.some(
      (draft) =>
        (draft.status === 'Sent' || draft.status === 'Running') && getDraftKind(draft) === 'informative',
    );
    const hasInteractive = drafts.some(
      (draft) =>
        (draft.status === 'Sent' || draft.status === 'Running') && getDraftKind(draft) === 'interactive',
    );
    if (!hasInformative || !hasInteractive) {
      const seeded = getSeedDrafts();
      const additions = seeded.filter((draft) => draft.status === 'Sent' || draft.status === 'Running');
      const nextDrafts = [
        ...drafts,
        ...additions.filter((draft) => {
          const kind = getDraftKind(draft);
          return (kind === 'informative' && !hasInformative) || (kind === 'interactive' && !hasInteractive);
        }),
      ];
      saveToStorage(DRAFTS_KEY, nextDrafts);
    }
  }

  // Always refresh library templates from catalog; preserve any user templates if present.
  const userTemplates = templates.filter((t) => t.source === 'user');
  const catalog = getLibraryTemplates();
  const seededUser = userTemplates.length ? userTemplates : getSeedUserTemplates();
  saveToStorage(TEMPLATES_KEY, [...seededUser, ...catalog]);

  if (designs.length === 0) saveToStorage(DESIGNS_KEY, getSeedDesigns());
}

export function listDrafts(): EletterDraft[] {
  return loadFromStorage<EletterDraft[]>(DRAFTS_KEY, []).sort((a, b) => b.updatedAt - a.updatedAt);
}

export function getDraft(id: string): EletterDraft | null {
  return loadFromStorage<EletterDraft[]>(DRAFTS_KEY, []).find((d) => d.id === id) ?? null;
}

export function upsertDraft(draft: EletterDraft): void {
  const all = loadFromStorage<EletterDraft[]>(DRAFTS_KEY, []);
  const idx = all.findIndex((d) => d.id === draft.id);
  if (idx >= 0) all[idx] = draft;
  else all.push(draft);
  saveToStorage(DRAFTS_KEY, all);
}

export function updateDraftJson(id: string, json: Letter): void {
  const all = loadFromStorage<EletterDraft[]>(DRAFTS_KEY, []);
  const idx = all.findIndex((d) => d.id === id);
  if (idx === -1) return;
  all[idx] = {
    ...all[idx],
    updatedAt: Date.now(),
    json,
  };
  saveToStorage(DRAFTS_KEY, all);
}

export function createDraft(params?: { name?: string; status?: EletterStatus; json?: Letter }): EletterDraft {
  const now = Date.now();
  const status = params?.status ?? 'Draft';
  const publishedAt = status === 'Draft' ? undefined : now;
  const draft: EletterDraft = {
    id: nanoid(),
    name: params?.name ?? 'No title',
    status,
    createdAt: now,
    updatedAt: now,
    publishedAt,
    publishedBy: publishedAt ? 'You' : undefined,
    json: params?.json ?? createBlankLetter(),
  };
  upsertDraft(draft);
  return draft;
}

export function updateDraftName(id: string, name: string): void {
  const all = loadFromStorage<EletterDraft[]>(DRAFTS_KEY, []);
  const idx = all.findIndex((d) => d.id === id);
  if (idx === -1) return;
  all[idx] = {
    ...all[idx],
    name,
    updatedAt: Date.now(),
    json: { ...all[idx].json, title: name },
  };
  saveToStorage(DRAFTS_KEY, all);
}

export function listTemplates(): Template[] {
  return loadFromStorage<Template[]>(TEMPLATES_KEY, []).sort((a, b) => a.name.localeCompare(b.name));
}

export function addUserTemplate(name: string, json: Letter): Template {
  const next = loadFromStorage<Template[]>(TEMPLATES_KEY, []);
  const template: Template = {
    id: `tpl-${nanoid()}`,
    name,
    source: 'user',
    category: 'Your template',
    json,
  };
  saveToStorage(TEMPLATES_KEY, [...next, template]);
  return template;
}

export function listDesigns(): SavedDesign[] {
  return loadFromStorage<SavedDesign[]>(DESIGNS_KEY, []).sort((a, b) => b.updatedAt - a.updatedAt);
}
