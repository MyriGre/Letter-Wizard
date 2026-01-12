// AI-AGENT-HEADER
// path: /src/components/eletters/TemplatePickerModal.tsx
// summary: Template picker modal with tabs (user/library), search, and category chips.
// last-reviewed: 2025-12-17
// line-range: 1-320

import * as Dialog from '@radix-ui/react-dialog';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '../ui/button';
import { cn } from '../../lib/cn';
import type { Template } from '../../eletters/types';
import { EletterPreview as TemplatePreview } from './EletterPreview';
import type { Letter, Screen } from '../../types/editor';

function TemplateCard({ tpl, onSelect, selected }: { tpl: Template; onSelect: () => void; selected?: boolean }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'group w-full rounded-2xl border bg-white p-3 text-left shadow-sm transition',
        'hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
        selected ? 'border-blue-300 shadow-md ring-2 ring-blue-200' : 'border-slate-200',
      )}
    >
      <div className="flex h-36 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
        <div className="pointer-events-none select-none origin-center scale-[0.26]">
          <TemplatePreview letter={tpl.json} className="w-[360px]" />
        </div>
      </div>
      <div className="mt-3 flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-900">{tpl.name}</div>
          <div className="mt-0.5 text-xs text-slate-500">{tpl.category ?? (tpl.source === 'user' ? 'Your template' : 'Library')}</div>
        </div>
        <div className="mt-0.5 text-slate-400 transition group-hover:text-slate-700">→</div>
      </div>
    </button>
  );
}

export function TemplatePickerModal({
  open,
  onOpenChange,
  templates,
  onSelectTemplate,
  initialTab = 'user',
  initialTemplate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templates: Template[];
  onSelectTemplate: (tpl: Template) => void;
  initialTab?: 'user' | 'library';
  initialTemplate?: Template;
}) {
  const [tab, setTab] = useState<'user' | 'library'>(initialTab);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string>('All');
  const [selected, setSelected] = useState<Template | null>(initialTemplate ?? null);
  const [layoutMode, setLayoutMode] = useState<'single' | 'per-question'>('single');
  const chipScrollerRef = useRef<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const canApply = Boolean(selected);

  // Re-sync defaults when opening (so callers can open directly on "Library").
  useEffect(() => {
    if (!open) return;
    setTab(initialTab);
    setQuery('');
    setCategory('All');
    setSelected(initialTemplate ?? null);
    setLayoutMode('single');
  }, [open, initialTab, initialTemplate]);

  const updateScrollState = () => {
    const el = chipScrollerRef.current;
    if (!el) return;
    const maxScrollLeft = el.scrollWidth - el.clientWidth;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < maxScrollLeft - 4);
  };

  useEffect(() => {
    updateScrollState();
    const handleResize = () => updateScrollState();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const categories = useMemo(() => {
    const cats = new Set<string>();
    templates
      .filter((t) => t.source === 'library')
      .forEach((t) => {
        if (t.category) cats.add(t.category);
      });
    return ['All', ...Array.from(cats).sort((a, b) => a.localeCompare(b))];
  }, [templates]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return templates
      .filter((t) => t.source === tab)
      .filter((t) => (tab === 'library' && category !== 'All' ? t.category === category : true))
      .filter((t) => (q ? t.name.toLowerCase().includes(q) : true));
  }, [templates, tab, query, category]);

  const applyLayout = (letter: Letter, mode: 'single' | 'per-question'): Letter => {
    const spreadSingleScreen = (input: Letter): Letter => {
      const screens = (input.screens ?? []).map((screen) => {
        const rootElements = (screen.elements ?? []).filter((el) => !el.parentId);
        if (rootElements.length <= 1) return screen;
        return {
          ...screen,
          style: {
            ...(screen.style ?? {}),
            justifyContent: screen.style?.justifyContent ?? 'center',
          },
        };
      });
      return { ...input, screens };
    };

    if (mode === 'single') return spreadSingleScreen({ ...letter });

    const baseScreen = letter.screens[0];
    if (!baseScreen) return letter;
    const elements = letter.screens.flatMap((s) => (s.elements ?? []).filter((el) => !el.parentId));
    if (elements.length <= 1) return letter;
    const style = baseScreen.style;
    const screens: Screen[] = elements.map((el, idx) => ({
      id: `screen-${idx + 1}`,
      order: idx + 1,
      mode: 'single-screen',
      elements: [{ ...el }],
      style,
      navDoneLabel: idx === elements.length - 1 ? baseScreen.navDoneLabel ?? 'Done' : undefined,
    }));
    return spreadSingleScreen({ ...letter, screens });
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/30" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 h-[88vh] w-[92vw] max-w-[1200px] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <Dialog.Title className="text-lg font-semibold text-slate-900">Templates</Dialog.Title>
                <Dialog.Description className="mt-1 text-sm text-slate-600">
                  Choose a template, pick layout, and apply.
                </Dialog.Description>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="md"
                  disabled={!canApply}
                  onClick={() => {
                    if (!selected) return;
                    const transformed = { ...selected, json: applyLayout(selected.json, layoutMode) };
                    onSelectTemplate(transformed);
                    onOpenChange(false);
                  }}
                >
                  Apply
                </Button>
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
            </div>

            <div className="grid flex-1 min-h-0 grid-cols-[320px_1fr]">
              <div className="flex min-h-0 flex-col border-r border-slate-200 bg-white">
                <div className="flex-1 overflow-y-auto">
                  <div className="sticky top-0 z-10 space-y-3 bg-white px-4 pb-4 pt-4">
                    <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1">
                      {(['user', 'library'] as const).map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => {
                            setTab(t);
                            setCategory('All');
                          }}
                          className={cn(
                            'rounded-lg px-4 py-2 text-sm font-semibold transition',
                            tab === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800',
                          )}
                        >
                          {t === 'user' ? 'Your templates' : 'Library'}
                        </button>
                      ))}
                    </div>

                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search templates..."
                      className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    />

                    {tab === 'library' && (
                      <div className="relative">
                        <div
                          ref={chipScrollerRef}
                          onScroll={updateScrollState}
                          className="hide-scrollbar flex gap-2 overflow-x-auto pb-1 pr-10"
                        >
                          {categories.map((c) => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => setCategory(c)}
                              className={cn(
                                'shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition',
                                category === c
                                  ? 'border-slate-900 bg-slate-900 text-white'
                                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-800',
                              )}
                            >
                              {c}
                            </button>
                          ))}
                        </div>
                        {canScrollRight && (
                          <>
                            <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-white to-transparent" />
                            <button
                              type="button"
                              onClick={() => chipScrollerRef.current?.scrollBy({ left: 160, behavior: 'smooth' })}
                              className="absolute right-0 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white text-slate-500 transition-transform hover:scale-110 hover:text-slate-700"
                              aria-label="Scroll categories"
                            >
                              ›
                            </button>
                          </>
                        )}
                        {canScrollLeft && (
                          <button
                            type="button"
                            onClick={() => chipScrollerRef.current?.scrollBy({ left: -160, behavior: 'smooth' })}
                            className="absolute left-0 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white text-slate-500 transition-transform hover:scale-110 hover:text-slate-700"
                            aria-label="Scroll categories back"
                          >
                            ‹
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="space-y-3 px-4 pb-4">
                    {visible.map((tpl) => (
                      <TemplateCard
                        key={tpl.id}
                        tpl={tpl}
                        selected={selected?.id === tpl.id}
                        onSelect={() => {
                          setSelected(tpl);
                        }}
                      />
                    ))}
                    {visible.length === 0 && (
                      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-600">
                        No templates found.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="min-h-0 bg-slate-50 p-5">
                {selected ? (
                  <div className="flex h-full min-h-0 flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="mb-3 flex items-center justify-between">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">{selected.name}</div>
                        <div className="text-xs text-slate-500">{selected.category ?? 'Template'}</div>
                      </div>
                      <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1 text-xs font-semibold text-slate-600">
                        {(['single', 'per-question'] as const).map((mode) => (
                          <button
                            key={mode}
                            type="button"
                            onClick={() => setLayoutMode(mode)}
                            className={cn(
                              'rounded-md px-2 py-1 transition',
                              layoutMode === mode
                                ? 'bg-white text-slate-900 shadow-sm'
                                : 'text-slate-500 hover:bg-white hover:text-slate-800',
                            )}
                          >
                            {mode === 'single' ? 'All questions on one screen' : 'One question per screen'}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-1 min-h-0 justify-center">
                      <div className="h-full w-full max-w-[520px]">
                        <TemplatePreview
                          letter={applyLayout(selected.json, layoutMode)}
                          tone="compact"
                          frameHeight="100%"
                          allowScroll
                          className="h-full"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-sm text-slate-500">
                    Select a template to preview
                  </div>
                )}
              </div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
