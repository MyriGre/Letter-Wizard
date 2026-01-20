// AI-AGENT-HEADER
// path: /src/components/eletters/EletterPreview.tsx
// summary: Lightweight phone-like preview for Letter JSON (used in templates + AI).
// last-reviewed: 2025-12-17
// line-range: 1-220

import type { BaseElement, Letter } from '../../types/editor';
import { cn } from '../../lib/cn';
import { useEffect, useMemo, useState } from 'react';

function PreviewElement({ element, tone }: { element: BaseElement; tone: 'default' | 'compact' }) {
  const type = element.type;
  const content = element.content;
  const props = (element.props ?? {}) as Record<string, unknown>;
  const isCompact = tone === 'compact';
  const containerClass = isCompact
    ? 'rounded-lg border border-slate-200/70 bg-white/90 p-3'
    : 'rounded-xl border border-slate-200 bg-white p-3';
  const optionClass = isCompact
    ? 'flex items-center gap-2 rounded-lg border border-slate-200/70 bg-slate-50/70 px-3 py-2 text-xs text-slate-700'
    : 'flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700';

  if (type === 'header') return <div className="text-xl font-semibold text-slate-900">{content ?? 'Header'}</div>;
  if (type === 'subheader')
    return <div className="text-base font-semibold text-slate-900">{content ?? 'Subheader'}</div>;
  if (type === 'paragraph') return <div className="text-sm text-slate-700">{content ?? 'Paragraph'}</div>;
  if (type === 'button')
    return (
      <div className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-slate-900 text-sm font-semibold text-white">
        {content ?? 'Button'}
      </div>
    );
  if (type === 'image')
    return <div className="h-36 w-full rounded-xl border border-dashed border-slate-300 bg-slate-50" />;
  if (type === 'video')
    return <div className="h-36 w-full rounded-xl border border-dashed border-slate-300 bg-slate-50" />;
  if (type === 'single-choice' || type === 'multiple-choice') {
    const optionsRaw = Array.isArray(props.options) ? (props.options as any[]) : [];
    const labels =
      optionsRaw.length > 0
        ? optionsRaw.map((o) => (typeof o === 'string' ? o : (o?.label as string | undefined) ?? '')).filter(Boolean)
        : ['Option A', 'Option B', 'Option C'];
    return (
      <div className={containerClass}>
        <div className="text-sm font-semibold text-slate-900">{content ?? 'Question'}</div>
        <div className="mt-2 space-y-2">
          {labels.slice(0, 5).map((opt, i) => (
            <div key={`${opt}-${i}`} className={optionClass}>
              <span className={cn('h-3.5 w-3.5 border border-slate-300', type === 'multiple-choice' ? 'rounded-[4px]' : 'rounded-full')} />
              <span className="truncate">{opt}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (type === 'input')
    return (
      <div className={containerClass}>
        <div className="text-sm font-semibold text-slate-900">{content ?? 'Text input'}</div>
        <div
          className={cn(
            'mt-2 h-10 w-full rounded-lg border border-slate-200',
            isCompact ? 'bg-slate-50' : 'bg-white',
          )}
        />
      </div>
    );
  if (type === 'file')
    return (
      <div className={containerClass}>
        <div className="text-sm font-semibold text-slate-900">{content ?? 'File upload'}</div>
        <div className="mt-2 h-28 w-full rounded-xl border border-dashed border-slate-300 bg-slate-50" />
      </div>
    );
  if (type === 'date' || type === 'date-input')
    return (
      <div className={containerClass}>
        <div className="text-sm font-semibold text-slate-900">{content ?? 'Date input'}</div>
        <div
          className={cn(
            'mt-2 h-10 w-full rounded-lg border border-slate-200',
            isCompact ? 'bg-slate-50' : 'bg-white',
          )}
        />
      </div>
    );
  if (type === 'rating') {
    const max = Math.max(1, Math.min(10, Number(props.max ?? 5)));
    const scaleType = (props.scaleType as 'stars' | 'hearts' | 'numbers' | undefined) ?? 'stars';
    const minLabel = typeof props.minLabel === 'string' ? props.minLabel : '';
    const maxLabel = typeof props.maxLabel === 'string' ? props.maxLabel : '';
    const icon = (i: number) => {
      if (scaleType === 'hearts') return '♡';
      if (scaleType === 'numbers') return String(i + 1);
      return '☆';
    };
    return (
      <div className={containerClass}>
        <div className="text-sm font-semibold text-slate-900">{content ?? 'Rating'}</div>
        <div className="mt-2 inline-flex max-w-full flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: max }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  'flex h-10 min-w-[40px] items-center justify-center rounded-lg border border-slate-200 px-2 text-sm font-semibold text-slate-800',
                  isCompact ? 'bg-slate-50' : 'bg-white',
                )}
              >
                {icon(i)}
              </div>
            ))}
          </div>
          {(minLabel || maxLabel) && (
            <div className="flex items-center justify-between text-[11px] font-medium text-slate-600">
              <span>{minLabel}</span>
              <span>{maxLabel}</span>
            </div>
          )}
        </div>
      </div>
    );
  }
  if (type === 'ranking') {
    const optionsRaw = Array.isArray(props.options) ? (props.options as any[]) : [];
    const labels =
      optionsRaw.length > 0
        ? optionsRaw.map((o) => (typeof o === 'string' ? o : (o?.label as string | undefined) ?? '')).filter(Boolean)
        : ['Item 1', 'Item 2', 'Item 3'];
    return (
      <div className={containerClass}>
        <div className="text-sm font-semibold text-slate-900">{content ?? 'Ranking'}</div>
        <div className="mt-2 space-y-2">
          {labels.slice(0, 5).map((opt, i) => (
            <div key={`${opt}-${i}`} className={optionClass}>
              <span className="w-4 text-slate-500">{i + 1}</span>
              <span className="truncate">{opt}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return <div className="h-10 w-full rounded-lg border border-slate-200 bg-white" />;
}

export function EletterPreview({
  letter,
  className,
  variant = 'mobile',
  tone = 'default',
  frameHeight,
  allowScroll = false,
}: {
  letter: Letter | null;
  className?: string;
  variant?: 'mobile' | 'desktop';
  tone?: 'default' | 'compact';
  frameHeight?: number | string;
  allowScroll?: boolean;
}) {
  const screens = useMemo(() => {
    const list = (letter?.screens ?? []).slice().sort((a, b) => a.order - b.order);
    return list;
  }, [letter]);
  const [screenIdx, setScreenIdx] = useState(0);

  useEffect(() => {
    setScreenIdx(0);
  }, [letter?.id]);

  const screen = screens[screenIdx];
  const background = screen?.style?.background ?? '#ffffff';
  const spacing = screen?.style?.elementSpacing ?? 12;
  const elements = (screen?.elements ?? []).filter((el) => !el.parentId && el.type !== 'header');
  const alignItems =
    screen?.style?.alignItems === 'center'
      ? 'center'
      : screen?.style?.alignItems === 'end'
        ? 'flex-end'
        : 'flex-start';
  const explicitJustify = screen?.style?.justifyContent;
  const fallbackJustify =
    screen?.mode === 'scroll' && elements.length > 1 ? 'space-evenly' : 'center';
  const justifyContent =
    explicitJustify === 'end'
      ? 'flex-end'
      : explicitJustify === 'start'
        ? 'flex-start'
        : explicitJustify === 'center'
          ? 'center'
      : fallbackJustify;
  const previewSpacing = tone === 'compact' ? Math.max(8, Math.round(spacing * 0.7)) : spacing;
  const contentPadding =
    tone === 'compact' ? 'px-4 py-5' : 'px-5 py-6';

  const frameClass =
    variant === 'mobile'
      ? 'w-[360px] rounded-[28px]'
      : 'w-[1024px] rounded-2xl';
  const resolvedHeight =
    typeof frameHeight === 'number' ? `${frameHeight}px` : frameHeight;
  const containerStyles =
    variant === 'mobile'
      ? { height: resolvedHeight ?? '720px' }
      : { minHeight: resolvedHeight ?? '560px' };

  return (
    <div className={cn('flex justify-center', className)}>
      <div
        className={cn(
          'mx-auto max-w-full border border-slate-200 bg-white shadow-soft-lg overflow-hidden',
          'flex h-full flex-col',
          frameClass,
        )}
        style={containerStyles}
      >
        <div
          className={cn(
            'flex h-full flex-col',
            allowScroll ? 'overflow-y-auto' : '',
            contentPadding,
            variant === 'desktop' && tone === 'default' ? 'md:px-8 md:py-8' : '',
          )}
          style={{ backgroundColor: background }}
        >
          {screens.length > 1 && (
            <div className="mb-3 flex items-center justify-between">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Screen {screenIdx + 1} / {screens.length}
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 disabled:opacity-40"
                  disabled={screenIdx === 0}
                  onClick={() => setScreenIdx((v) => Math.max(0, v - 1))}
                >
                  ‹
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 disabled:opacity-40"
                  disabled={screenIdx >= screens.length - 1}
                  onClick={() => setScreenIdx((v) => Math.min(screens.length - 1, v + 1))}
                >
                  ›
                </button>
              </div>
            </div>
          )}
          <div
            className="flex flex-1 flex-col"
            style={{ gap: previewSpacing, alignItems, justifyContent }}
          >
            {elements.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
                Preview will appear here.
              </div>
            ) : (
              elements.map((el) => <PreviewElement key={el.id} element={el} tone={tone} />)
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
