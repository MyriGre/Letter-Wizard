// AI-AGENT-HEADER
// path: /src/eletters/metrics.ts
// summary: Helpers for categorizing eLetters and computing performance metrics.
// last-reviewed: 2025-12-17
// line-range: 1-200

import type { Letter } from '../types/editor';
import type { EletterDraft } from './types';

export type EletterKind = 'informative' | 'interactive';

const questionTypes = new Set([
  'single-choice',
  'multiple-choice',
  'input',
  'file',
  'date',
  'date-input',
  'rating',
  'ranking',
]);

export function getLetterKind(letter: Letter): EletterKind {
  for (const screen of letter.screens ?? []) {
    for (const element of screen.elements ?? []) {
      if (questionTypes.has(element.type)) return 'interactive';
    }
  }
  return 'informative';
}

export function getDraftKind(draft: EletterDraft): EletterKind {
  return getLetterKind(draft.json);
}

export type DraftMetricTotals = {
  sent: number;
  opened: number;
  started: number;
  completed: number;
  running: number;
};

export type DraftMetrics = DraftMetricTotals & {
  openRate: number;
  startRate: number;
  completionRate: number;
};

export function getDraftMetrics(draft: EletterDraft): DraftMetrics {
  const sent = draft.metrics?.sentCount ?? 0;
  const opened = draft.metrics?.openedCount ?? 0;
  const started = draft.metrics?.startedCount ?? 0;
  const completed = draft.metrics?.completedCount ?? 0;
  const openRate = sent > 0 ? Math.round((opened / sent) * 100) : 0;
  const startRate = sent > 0 ? Math.round((started / sent) * 100) : 0;
  const completionRate = sent > 0 ? Math.round((completed / sent) * 100) : 0;
  return {
    sent,
    opened,
    started,
    completed,
    running: draft.status === 'Running' ? 1 : 0,
    openRate,
    startRate,
    completionRate,
  };
}

export function aggregateDraftMetrics(drafts: EletterDraft[]): DraftMetrics {
  const totals = drafts.reduce(
    (acc, draft) => {
      acc.sent += draft.metrics?.sentCount ?? 0;
      acc.opened += draft.metrics?.openedCount ?? 0;
      acc.started += draft.metrics?.startedCount ?? 0;
      acc.completed += draft.metrics?.completedCount ?? 0;
      if (draft.status === 'Running') acc.running += 1;
      return acc;
    },
    { sent: 0, opened: 0, started: 0, completed: 0, running: 0 } as DraftMetricTotals,
  );
  const openRate = totals.sent > 0 ? Math.round((totals.opened / totals.sent) * 100) : 0;
  const startRate = totals.sent > 0 ? Math.round((totals.started / totals.sent) * 100) : 0;
  const completionRate = totals.sent > 0 ? Math.round((totals.completed / totals.sent) * 100) : 0;
  return { ...totals, openRate, startRate, completionRate };
}
