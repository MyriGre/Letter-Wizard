// AI-AGENT-HEADER
// path: /src/pages/ElettersAnalyticsPage.tsx
// summary: Analytics view for sent and running eLetters with performance summary.
// last-reviewed: 2025-12-17
// line-range: 1-240

import { useEffect, useMemo, useState } from 'react';
import { Button } from '../components/ui/button';
import * as Dialog from '@radix-ui/react-dialog';
import { cn } from '../lib/cn';
import type { EletterDraft } from '../eletters/types';
import { ensureSeedData, listDrafts } from '../eletters/storage';
import { aggregateDraftMetrics, getDraftKind, getDraftMetrics } from '../eletters/metrics';
import type { Letter } from '../types/editor';

function navigate(to: string) {
  window.history.pushState({}, '', to);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

function formatDate(ts: number): string {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(ts));
}

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

function extractQuestions(letter: Letter): { id: string; label: string; type: string }[] {
  const screens = (letter.screens ?? []).slice().sort((a, b) => a.order - b.order);
  const items: { id: string; label: string; type: string }[] = [];
  screens.forEach((screen) => {
    (screen.elements ?? []).forEach((element) => {
      if (!questionTypes.has(element.type)) return;
      items.push({
        id: element.id,
        label: element.content ?? 'Untitled question',
        type: element.type,
      });
    });
  });
  return items;
}

export function ElettersAnalyticsPage({ onOpenDraft }: { onOpenDraft: (draftId: string) => void }) {
  const [drafts, setDrafts] = useState<EletterDraft[]>([]);
  const [typeFilter, setTypeFilter] = useState<'all' | 'informative' | 'interactive'>('all');
  const [detailDraft, setDetailDraft] = useState<EletterDraft | null>(null);

  useEffect(() => {
    ensureSeedData();
    setDrafts(listDrafts());
  }, []);

  const sentAndRunning = useMemo(
    () => drafts.filter((d) => d.status === 'Sent' || d.status === 'Running'),
    [drafts],
  );

  const typedDrafts = useMemo(
    () =>
      sentAndRunning.map((draft) => ({
        draft,
        kind: getDraftKind(draft),
        metrics: getDraftMetrics(draft),
      })),
    [sentAndRunning],
  );
  const informativeDrafts = useMemo(
    () => typedDrafts.filter((entry) => entry.kind === 'informative'),
    [typedDrafts],
  );
  const interactiveDrafts = useMemo(
    () => typedDrafts.filter((entry) => entry.kind === 'interactive'),
    [typedDrafts],
  );
  const filteredDrafts = useMemo(() => {
    if (typeFilter === 'informative') return informativeDrafts;
    if (typeFilter === 'interactive') return interactiveDrafts;
    return typedDrafts;
  }, [typeFilter, informativeDrafts, interactiveDrafts, typedDrafts]);

  const summaryAll = useMemo(() => aggregateDraftMetrics(sentAndRunning), [sentAndRunning]);
  const summaryInformative = useMemo(
    () => aggregateDraftMetrics(informativeDrafts.map((entry) => entry.draft)),
    [informativeDrafts],
  );
  const summaryInteractive = useMemo(
    () => aggregateDraftMetrics(interactiveDrafts.map((entry) => entry.draft)),
    [interactiveDrafts],
  );
  const allCount = sentAndRunning.length;
  const informativeCount = informativeDrafts.length;
  const interactiveCount = interactiveDrafts.length;

  const formatRate = (rate: number, sent: number) => (sent > 0 ? `${rate}%` : '—');
  const detailQuestions = useMemo(() => (detailDraft ? extractQuestions(detailDraft.json) : []), [detailDraft]);
  const detailKind = detailDraft ? getDraftKind(detailDraft) : null;
  const renderStatCard = (stat: {
    label: string;
    value: string;
    subItems?: { label: string; value: string }[];
  }) => (
    <div key={stat.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{stat.label}</div>
      <div className="mt-2 text-2xl font-semibold text-slate-900">{stat.value}</div>
      {stat.subItems?.length ? (
        <div className="mt-1 space-y-0.5 text-xs font-semibold text-slate-500">
          {stat.subItems.map((item) => (
            <div key={item.label}>
              {item.label} {item.value}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="sticky top-0 z-30 border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
              onClick={() => navigate('/eletters')}
              aria-label="Back to E-Letters dashboard"
            >
              <span aria-hidden>←</span>
              <span>Overview</span>
            </button>
            <div>
              <div className="text-xl font-semibold text-slate-900">Analytics</div>
              <div className="mt-0.5 text-sm text-slate-600">Performance for sent and running eLetters.</div>
            </div>
          </div>
          <Button size="md" className="bg-slate-900 text-white hover:bg-slate-800" onClick={() => navigate('/eletters')}>
            Create new eLetter
          </Button>
        </div>
      </div>

      <div className="mx-auto w-full max-w-6xl space-y-8 px-6 py-8">
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold uppercase tracking-wide text-slate-500">Performance focus</div>
              <div className="mt-1 text-sm text-slate-600">
                Informative letters track visibility. Interactive letters track resolution.
              </div>
            </div>
            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
              {(['all', 'informative', 'interactive'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setTypeFilter(tab)}
                  className={cn(
                    'px-4 py-2 text-sm font-medium rounded-md transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
                    typeFilter === tab ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800',
                  )}
                >
                  {tab === 'all' ? 'All' : tab === 'informative' ? 'Informative' : 'Interactive'}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {typeFilter === 'informative' && (
              <>
                {[
                  { label: 'Total sent', value: summaryInformative.sent.toLocaleString() },
                  {
                    label: 'Opened',
                    value: formatRate(summaryInformative.openRate, summaryInformative.sent),
                    subItems: [{ label: 'Opened', value: summaryInformative.opened.toLocaleString() }],
                  },
                  { label: 'Campaigns tracked', value: informativeCount.toLocaleString() },
                ].map(renderStatCard)}
              </>
            )}
            {typeFilter === 'interactive' && (
              <>
                {[
                  { label: 'Total sent', value: summaryInteractive.sent.toLocaleString() },
                  {
                    label: 'Opened',
                    value: formatRate(summaryInteractive.openRate, summaryInteractive.sent),
                    subItems: [{ label: 'Opened', value: summaryInteractive.opened.toLocaleString() }],
                  },
                  {
                    label: 'Completion rate',
                    value: formatRate(summaryInteractive.completionRate, summaryInteractive.sent),
                    subItems: [{ label: 'Completed', value: summaryInteractive.completed.toLocaleString() }],
                  },
                  { label: 'Campaigns tracked', value: interactiveCount.toLocaleString() },
                ].map(renderStatCard)}
              </>
            )}
            {typeFilter === 'all' && (
              <>
                {[
                  { label: 'Total sent', value: summaryAll.sent.toLocaleString() },
                  {
                    label: 'Informative opened',
                    value: formatRate(summaryInformative.openRate, summaryInformative.sent),
                    subItems: [{ label: 'Opened', value: summaryInformative.opened.toLocaleString() }],
                  },
                  {
                    label: 'Interactive completion rate',
                    value: formatRate(summaryInteractive.completionRate, summaryInteractive.sent),
                    subItems: [
                      { label: 'Opened', value: summaryInteractive.opened.toLocaleString() },
                      { label: 'Completed', value: summaryInteractive.completed.toLocaleString() },
                    ],
                  },
                  { label: 'Campaigns tracked', value: allCount.toLocaleString() },
                ].map(renderStatCard)}
              </>
            )}
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <div className="text-sm font-semibold uppercase tracking-wide text-slate-500">Sent & Performance</div>
              <div className="mt-1 text-sm text-slate-600">
                {typeFilter === 'informative'
                  ? 'Visibility metrics for informative eLetters.'
                  : typeFilter === 'interactive'
                    ? 'Resolution metrics for interactive eLetters.'
                    : 'Compare visibility and resolution across all eLetters.'}
              </div>
            </div>
          </div>
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {typeFilter === 'informative' && (
              <div className="grid grid-cols-[1.8fr_0.8fr_0.7fr_0.7fr] gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <div>Name</div>
                <div>Status</div>
                <div>Open rate</div>
                <div>Opened</div>
              </div>
            )}
            {typeFilter === 'interactive' && (
              <div className="grid grid-cols-[1.6fr_0.8fr_0.7fr_0.7fr_0.8fr] gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <div>Name</div>
                <div>Status</div>
                <div>Completion rate</div>
                <div>Completed</div>
                <div className="text-right">Actions</div>
              </div>
            )}
            {typeFilter === 'all' && (
              <div className="grid grid-cols-[1.5fr_0.7fr_0.7fr_0.8fr_0.8fr_0.8fr] gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <div>Name</div>
                <div>Type</div>
                <div>Status</div>
                <div>Primary KPI</div>
                <div>Opened / Completed</div>
                <div className="text-right">Actions</div>
              </div>
            )}
            {filteredDrafts.length > 0 ? (
              filteredDrafts.map(({ draft, kind, metrics }) => {
                const typeBadge =
                  kind === 'interactive'
                    ? 'bg-purple-100 text-purple-700'
                    : 'bg-slate-100 text-slate-700';
                const publishedAt = draft.publishedAt ?? draft.updatedAt ?? draft.createdAt;
                const publishedBy = draft.publishedBy ?? 'You';
                const statusLabel =
                  kind === 'interactive' ? (draft.status === 'Running' ? 'Running' : 'Closed') : 'Sent';
                const statusTone =
                  kind === 'interactive'
                    ? draft.status === 'Running'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-slate-100 text-slate-700'
                    : 'bg-blue-100 text-blue-700';
                return (
                  <div
                    key={draft.id}
                    className={cn(
                      'gap-3 px-4 py-3 text-sm text-slate-800 hover:bg-slate-50 cursor-pointer',
                      typeFilter === 'all'
                        ? 'grid grid-cols-[1.5fr_0.7fr_0.7fr_0.8fr_0.8fr_0.8fr]'
                        : typeFilter === 'informative'
                          ? 'grid grid-cols-[1.8fr_0.8fr_0.7fr_0.7fr]'
                          : 'grid grid-cols-[1.6fr_0.8fr_0.7fr_0.7fr_0.8fr]',
                    )}
                    role="button"
                    tabIndex={0}
                    onClick={() => setDetailDraft(draft)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setDetailDraft(draft);
                      }
                    }}
                  >
                    <div>
                      <div className="font-semibold text-slate-900">{draft.name}</div>
                      <div className="text-xs text-slate-500">
                        Published on {formatDate(publishedAt)} · by {publishedBy}
                      </div>
                    </div>
                    {typeFilter === 'all' && (
                      <div>
                        <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold', typeBadge)}>
                          {kind === 'interactive' ? 'Interactive' : 'Informative'}
                        </span>
                      </div>
                    )}
                    <div>
                      <span
                        className={cn(
                          'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold',
                          statusTone,
                        )}
                      >
                        {statusLabel}
                      </span>
                    </div>
                    {typeFilter === 'informative' && (
                      <>
                        <div className="text-slate-700">{formatRate(metrics.openRate, metrics.sent)}</div>
                        <div className="text-slate-700">{metrics.opened.toLocaleString()}</div>
                      </>
                    )}
                    {typeFilter === 'interactive' && (
                      <>
                        <div className="text-slate-700">{formatRate(metrics.completionRate, metrics.sent)}</div>
                        <div className="text-slate-700">{metrics.completed.toLocaleString()}</div>
                      </>
                    )}
                    {typeFilter === 'all' && (
                      <>
                        <div className="text-slate-700">
                          <div className="font-semibold">
                            {kind === 'interactive'
                              ? formatRate(metrics.completionRate, metrics.sent)
                              : formatRate(metrics.openRate, metrics.sent)}
                          </div>
                          <div className="text-xs text-slate-500">
                            {kind === 'interactive' ? 'Completion rate' : 'Open rate'}
                          </div>
                        </div>
                        <div className="text-slate-700">
                          {kind === 'interactive'
                            ? metrics.completed > 0
                              ? `${metrics.completed.toLocaleString()} completed`
                              : metrics.sent > 0
                                ? '0 completed'
                                : '—'
                            : `${metrics.opened.toLocaleString()} opened`}
                        </div>
                      </>
                    )}
                    {typeFilter === 'informative' ? null : typeFilter === 'all' && kind === 'informative' ? (
                      <div className="text-right text-sm text-slate-400">—</div>
                    ) : (
                      <div className="text-right space-x-3">
                        {draft.status === 'Running' ? (
                          <button
                            type="button"
                            className="text-sm font-semibold text-red-600 hover:underline"
                            onClick={(e) => {
                              e.stopPropagation();
                            }}
                          >
                            Close
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="text-sm font-semibold text-blue-700 hover:underline"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenDraft(draft.id);
                            }}
                          >
                            Open
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="px-4 py-8 text-center text-sm text-slate-600">
                {typeFilter === 'informative'
                  ? 'No informative eLetters yet.'
                  : typeFilter === 'interactive'
                    ? 'No interactive eLetters yet.'
                    : 'No sent eLetters yet.'}
              </div>
            )}
          </div>
        </section>
      </div>
      <Dialog.Root open={Boolean(detailDraft)} onOpenChange={(open) => (!open ? setDetailDraft(null) : null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-black/30" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 h-[82vh] w-[860px] max-w-[calc(100vw-24px)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex h-full flex-col">
              <div className="flex items-start justify-between border-b border-slate-200 px-6 py-4">
                <div>
                  <Dialog.Title className="text-lg font-semibold text-slate-900">
                    {detailDraft?.name ?? 'Results'}
                  </Dialog.Title>
                  <Dialog.Description className="mt-1 text-sm text-slate-600">
                    {detailKind === 'interactive'
                      ? 'Responses and completion insights.'
                      : 'Visibility insights for informative letters.'}
                  </Dialog.Description>
                </div>
                <Dialog.Close asChild>
                  <button
                    type="button"
                    className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100"
                    aria-label="Close"
                  >
                    ✕
                  </button>
                </Dialog.Close>
              </div>
              <div className="flex-1 overflow-auto px-6 py-5">
                {detailDraft ? (
                  <div className="space-y-5">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Published</div>
                      <div className="mt-2 text-sm text-slate-700">
                        {formatDate(detailDraft.publishedAt ?? detailDraft.updatedAt)} · by{' '}
                        {detailDraft.publishedBy ?? 'You'}
                      </div>
                      <div className="mt-2 text-sm text-slate-700">
                        Responses: {detailDraft.metrics?.completedCount?.toLocaleString() ?? 0}
                      </div>
                    </div>

                    {detailKind === 'informative' ? (
                      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
                        This is an informative letter. Response answers are not collected for this type.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="text-sm font-semibold text-slate-800">Questions</div>
                        {detailQuestions.length > 0 ? (
                          detailQuestions.map((question, idx) => (
                            <div
                              key={question.id}
                              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                            >
                              <div className="text-sm font-semibold text-slate-900">
                                {idx + 1}. {question.label}
                              </div>
                              <div className="mt-1 text-xs text-slate-500 uppercase tracking-wide">{question.type}</div>
                              <div className="mt-3 text-sm text-slate-600">No responses collected yet.</div>
                            </div>
                          ))
                        ) : (
                          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
                            No questions found for this letter.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
