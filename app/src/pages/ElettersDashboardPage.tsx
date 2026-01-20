// AI-AGENT-HEADER
// path: /src/pages/ElettersDashboardPage.tsx
// summary: E-Letters dashboard listing drafts, designs, and templates with create flows.
// last-reviewed: 2025-12-17
// line-range: 1-420

import { useEffect, useMemo, useState } from 'react';
import { Button } from '../components/ui/button';
import type { EletterDraft, Template } from '../eletters/types';
import { addUserTemplate, createDraft, ensureSeedData, listDrafts, listTemplates } from '../eletters/storage';
import { CreateEletterModal } from '../components/eletters/CreateEletterModal';
import { TemplatePickerModal } from '../components/eletters/TemplatePickerModal';
import { AIEletterModal } from '../components/eletters/AIEletterModal';
import { ImportQuestionnaireModal } from '../components/eletters/ImportQuestionnaireModal';
import { EletterPreview } from '../components/eletters/EletterPreview';
import { aggregateDraftMetrics, getDraftKind } from '../eletters/metrics';

function formatRelative(ts: number): string {
  const delta = Date.now() - ts;
  const mins = Math.round(delta / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  return `${days}d ago`;
}

function SectionHeader({
  title,
  subtitle,
  onSeeAll,
}: {
  title: string;
  subtitle?: string;
  onSeeAll?: () => void;
}) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <div className="text-sm font-semibold uppercase tracking-wide text-slate-500">{title}</div>
        {subtitle && <div className="mt-1 text-sm text-slate-600">{subtitle}</div>}
      </div>
      {onSeeAll && (
        <button type="button" className="text-sm font-semibold text-slate-700 hover:underline" onClick={onSeeAll}>
          See all
        </button>
      )}
    </div>
  );
}

function navigate(to: string) {
  window.history.pushState({}, '', to);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

export function ElettersDashboardPage({
  onOpenDraft,
}: {
  onOpenDraft: (draftId: string) => void;
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [templateInitialTab, setTemplateInitialTab] = useState<'user' | 'library'>('library');
  const [initialTemplate, setInitialTemplate] = useState<Template | null>(null);
  const [templateView, setTemplateView] = useState<'user' | 'library'>('library');
  const [aiOpen, setAiOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  const [drafts, setDrafts] = useState<EletterDraft[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  useEffect(() => {
    ensureSeedData();
    setDrafts(listDrafts());
    setTemplates(listTemplates());
  }, []);

  useEffect(() => {
    const onClickAway = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('[data-menu-root]')) return;
      if (menuOpenId) setMenuOpenId(null);
    };
    document.addEventListener('click', onClickAway);
    return () => document.removeEventListener('click', onClickAway);
  }, [menuOpenId]);

  const recentDrafts = drafts.slice(0, 5);
  const userTemplates = useMemo(() => templates.filter((t) => t.source === 'user'), [templates]);
  const libraryTemplates = useMemo(() => templates.filter((t) => t.source === 'library'), [templates]);
  const performanceDrafts = useMemo(
    () => drafts.filter((d) => d.status === 'Sent' || d.status === 'Running'),
    [drafts],
  );
  const informativeDrafts = useMemo(
    () => performanceDrafts.filter((draft) => getDraftKind(draft) === 'informative'),
    [performanceDrafts],
  );
  const interactiveDrafts = useMemo(
    () => performanceDrafts.filter((draft) => getDraftKind(draft) === 'interactive'),
    [performanceDrafts],
  );
  const performanceSummary = useMemo(() => aggregateDraftMetrics(performanceDrafts), [performanceDrafts]);
  const informativeSummary = useMemo(() => aggregateDraftMetrics(informativeDrafts), [informativeDrafts]);
  const interactiveSummary = useMemo(() => aggregateDraftMetrics(interactiveDrafts), [interactiveDrafts]);

  const formatRate = (rate: number, sent: number) => (sent > 0 ? `${rate}%` : '—');
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
          <div>
            <div className="text-xl font-semibold text-slate-900">E-Letters</div>
            <div className="mt-0.5 text-sm text-slate-600">Manage drafts, designs, and templates.</div>
          </div>
          <Button size="md" className="bg-slate-900 text-white hover:bg-slate-800" onClick={() => setCreateOpen(true)}>
            Create new eLetter
          </Button>
        </div>
      </div>

      <div className="mx-auto w-full max-w-6xl space-y-10 px-6 py-8">
        <section className="space-y-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <div className="text-sm font-semibold uppercase tracking-wide text-slate-500">Performance snapshot</div>
              <div className="mt-1 text-sm text-slate-600">Quick view of your recent sending performance.</div>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate('/eletters/analytics')}>
              View analytics
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'Total sent', value: performanceSummary.sent.toLocaleString() },
              {
                label: 'Informative opened',
                value: formatRate(informativeSummary.openRate, informativeSummary.sent),
                subItems: [{ label: 'Opened', value: informativeSummary.opened.toLocaleString() }],
              },
              {
                label: 'Interactive completion rate',
                value: formatRate(interactiveSummary.completionRate, interactiveSummary.sent),
                subItems: [
                  { label: 'Opened', value: interactiveSummary.opened.toLocaleString() },
                  { label: 'Completed', value: interactiveSummary.completed.toLocaleString() },
                ],
              },
              { label: 'Campaigns tracked', value: performanceDrafts.length.toLocaleString() },
            ].map(renderStatCard)}
          </div>
        </section>

        <section className="space-y-4">
          <SectionHeader
            title="Recent eLetters"
            subtitle="Drafts and running eLetters you've worked on recently."
            onSeeAll={() => {}}
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {recentDrafts.map((d) => (
              <div
                key={d.id}
                className="relative rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                {d.status === 'Draft' && (
                  <span className="pointer-events-none absolute left-4 top-4 z-10 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-700 shadow-sm ring-1 ring-slate-200/70">
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-500" aria-hidden />
                    Draft
                  </span>
                )}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => onOpenDraft(d.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onOpenDraft(d.id);
                    }
                  }}
                  className="block w-full cursor-pointer text-left focus:outline-none"
                >
                  <div className="space-y-2">
                    <div className="flex h-40 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                      <div className="pointer-events-none select-none origin-center scale-[0.26]">
                        <EletterPreview letter={d.json} className="w-[360px]" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-slate-900" title={d.name}>
                            {d.name}
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-slate-500">Updated {formatRelative(d.updatedAt)}</div>
                    </div>
                  </div>
                </div>
                <div className="absolute bottom-2 right-2">
                  <button
                    type="button"
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm hover:bg-slate-50"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpenId((prev) => (prev === d.id ? null : d.id));
                    }}
                  >
                    <span className="text-lg leading-none text-slate-800">⋯</span>
                  </button>
                  {menuOpenId === d.id && (
                    <div className="absolute right-0 z-20 mt-2 w-40 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                      <button
                        type="button"
                        className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenDraft(d.id);
                          setMenuOpenId(null);
                        }}
                      >
                        Open
                      </button>
                      <button
                        type="button"
                        className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          const copy = createDraft({ name: `${d.name} (Copy)`, json: d.json });
                          setDrafts(listDrafts().concat([copy]));
                          setMenuOpenId(null);
                        }}
                      >
                        Create copy
                      </button>
                      {d.status === 'Draft' && (
                        <button
                          type="button"
                          className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            addUserTemplate(d.name, d.json);
                            setTemplates(listTemplates());
                            setMenuOpenId(null);
                          }}
                        >
                          Save as template
                        </button>
                      )}
                      <button
                        type="button"
                        className="block w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDrafts((prev) => prev.filter((x) => x.id !== d.id));
                          setMenuOpenId(null);
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {recentDrafts.length === 0 && (
              <div className="col-span-full rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-600">
                No eLetters yet.
              </div>
            )}
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="text-sm font-semibold uppercase tracking-wide text-slate-500">Templates</div>
              <div className="mt-1 text-sm text-slate-600">Browse the library or reuse your own.</div>
            </div>
            <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1">
              {(['user', 'library'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setTemplateView(tab)}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                    templateView === tab ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {tab === 'user' ? 'Your templates' : 'Library'}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {(templateView === 'library' ? libraryTemplates : userTemplates).map((tpl) => (
              <button
                key={tpl.id}
                type="button"
                onClick={() => {
                  if (templateView === 'library') {
                    setTemplateInitialTab('library');
                    setInitialTemplate(tpl);
                    setTemplateOpen(true);
                  } else {
                    const draft = createDraft({ name: tpl.name, status: 'Draft', json: tpl.json });
                    onOpenDraft(draft.id);
                  }
                }}
                className="rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <div className="flex h-40 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                  <div className="pointer-events-none select-none origin-center scale-[0.26]">
                    <EletterPreview letter={tpl.json} className="w-[360px]" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-sm font-semibold text-slate-900">{tpl.name}</div>
                  <div className="mt-0.5 text-xs text-slate-500">
                    {templateView === 'library' ? tpl.category ?? 'Library template' : 'Your template'}
                  </div>
                </div>
              </button>
            ))}
            {templateView === 'library' && libraryTemplates.length === 0 && (
              <div className="col-span-full rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-600">
                No library templates yet.
              </div>
            )}
            {templateView === 'user' && userTemplates.length === 0 && (
              <div className="col-span-full rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-600">
                No templates yet.
              </div>
            )}
          </div>
        </section>
      </div>

      <CreateEletterModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        onChoose={(choice) => {
          setCreateOpen(false);
          if (choice === 'scratch') {
            const draft = createDraft({ name: 'Untitled', status: 'Draft' });
            onOpenDraft(draft.id);
            return;
          }
          if (choice === 'template') {
            setTemplateOpen(true);
            return;
          }
          if (choice === 'import') {
            setImportOpen(true);
            return;
          }
          setAiOpen(true);
        }}
      />

      <TemplatePickerModal
        open={templateOpen}
        onOpenChange={(open) => {
          setTemplateOpen(open);
          if (!open) setInitialTemplate(null);
        }}
        templates={templates}
        initialTab={templateInitialTab}
        initialTemplate={initialTemplate ?? undefined}
        onSelectTemplate={(tpl) => {
          const draft = createDraft({ name: tpl.name, status: 'Draft', json: tpl.json });
          onOpenDraft(draft.id);
        }}
      />

      <AIEletterModal
        open={aiOpen}
        onOpenChange={setAiOpen}
        onApply={(letter) => {
          const draft = createDraft({ name: letter.title || 'AI draft', status: 'Draft', json: letter });
          onOpenDraft(draft.id);
        }}
      />

      <ImportQuestionnaireModal
        open={importOpen}
        onOpenChange={setImportOpen}
        onImport={({ file, draft: importedDraft }) => {
          const baseName = file.name.replace(/\.[^/.]+$/, '').trim() || 'Imported questionnaire';
          const draft = createDraft({
            name: baseName,
            status: 'Draft',
            json: importedDraft ?? undefined,
          });
          setImportOpen(false);
          onOpenDraft(draft.id);
        }}
      />
    </div>
  );
}
