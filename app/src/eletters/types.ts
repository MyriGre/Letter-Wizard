// AI-AGENT-HEADER
// path: /src/eletters/types.ts
// summary: Types for E-Letter dashboard drafts and templates.
// last-reviewed: 2025-12-17
// line-range: 1-120

import type { Letter } from '../types/editor';

export type EletterStatus = 'Draft' | 'Sent' | 'Running';

export type EletterDraft = {
  id: string;
  name: string;
  status: EletterStatus;
  createdAt: number;
  updatedAt: number;
  publishedAt?: number;
  publishedBy?: string;
  json: Letter;
  // Optional lightweight stats if this draft was sent
  metrics?: {
    sentCount?: number;
    openedCount?: number;
    startedCount?: number;
    completedCount?: number;
    last24hOpens?: number[];
  };
};

export type TemplateSource = 'user' | 'library';

export type Template = {
  id: string;
  name: string;
  source: TemplateSource;
  category?: string;
  json: Letter;
};

export type SavedDesign = {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  // Lightweight “design” info; not wired into builder yet.
  preview?: {
    background?: string;
    accent?: string;
  };
};
