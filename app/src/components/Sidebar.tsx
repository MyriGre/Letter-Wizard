// AI-AGENT-HEADER
// path: /src/components/Sidebar.tsx
// summary: Left rail with mode switcher and context panels (elements tabs, media, inline brand editor).
// last-reviewed: 2025-12-08
// line-range: 1-420

import { useEffect, useMemo, useRef, useState, type DragEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Button } from './ui/button';
import { useEditorStore } from '../store/editorStore';
import type { Brand, ElementType, UploadItem } from '../types/editor';
import { ELEMENT_DRAG_TYPE, MEDIA_URL_DRAG_TYPE } from '../constants/dnd';
import { FontSelector } from './FontSelector';
import { colorInputValue, normalizeColorValue } from '../lib/color';
import {
  QUESTION_BANK,
  type QuestionBankItem,
  type QuestionCategory,
  type QuestionType,
} from '../data/questionBank';

type SectionItem = { label: string; type: ElementType; className?: string; group?: string };
type Section = {
  title: string;
  items: SectionItem[];
};

type AddElementOptions = { content?: string; props?: Record<string, unknown> };

const uploadedImages: { src: string; alt: string }[] = [
  { src: 'https://i.imgur.com/Nqg158g.png', alt: 'Illustration 1' },
  { src: 'https://i.imgur.com/1Nx3d1q.png', alt: 'Illustration 2' },
  { src: 'https://i.imgur.com/WE6FTUc.png', alt: 'Illustration 3' },
  { src: 'https://i.imgur.com/sPAxzbK.png', alt: 'Illustration 4' },
  { src: 'https://i.imgur.com/zcBmDMt.png', alt: 'Illustration 5' },
  { src: 'https://i.imgur.com/DCEk6uN.png', alt: 'Illustration 6' },
  { src: 'https://i.imgur.com/vNN7jbf.png', alt: 'Illustration 7' },
  { src: 'https://i.imgur.com/q3h2nyr.png', alt: 'Illustration 8' },
];

const uploadedVideos: { src: string; alt: string }[] = [
  { src: 'https://i.imgur.com/bJLcEQF.mp4', alt: 'Video 1' },
  { src: 'https://i.imgur.com/BwoQb7R.mp4', alt: 'Video 2' },
  { src: 'https://i.imgur.com/XbtEZ0N.mp4', alt: 'Video 3' },
];

const illustrationPlaceholders: { src: string; alt: string }[] = [
  {
    src: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><defs><linearGradient id="g1" x1="0" y1="0" x2="1" y2="1"><stop stop-color="%23c084fc" offset="0"/><stop stop-color="%23818cf8" offset="1"/></linearGradient></defs><rect width="400" height="300" fill="url(%23g1)"/><circle cx="70" cy="70" r="50" fill="%23ffffff22"/><circle cx="330" cy="230" r="40" fill="%23ffffff33"/></svg>',
    alt: 'Placeholder gradient 1',
  },
  {
    src: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><defs><linearGradient id="g2" x1="0" y1="0" x2="1" y2="0"><stop stop-color="%23f97316" offset="0"/><stop stop-color="%23facc15" offset="1"/></linearGradient></defs><rect width="400" height="300" fill="url(%23g2)"/><rect x="40" y="40" width="120" height="60" fill="%23ffffff22"/><rect x="240" y="180" width="120" height="60" fill="%23ffffff33"/></svg>',
    alt: 'Placeholder gradient 2',
  },
  {
    src: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><defs><linearGradient id="g3" x1="0" y1="1" x2="1" y2="0"><stop stop-color="%230ea5e9" offset="0"/><stop stop-color="%2310b981" offset="1"/></linearGradient></defs><rect width="400" height="300" fill="url(%23g3)"/><path d="M40 240 Q200 120 360 240" stroke="%23ffffff55" stroke-width="6" fill="none" stroke-linecap="round"/></svg>',
    alt: 'Placeholder gradient 3',
  },
];

const textItems: Section = {
  title: 'Text',
  items: [
    { label: 'Add header', type: 'header', className: 'text-3xl font-bold leading-tight' },
    { label: 'Add sub-header', type: 'subheader', className: 'text-2xl font-semibold leading-snug' },
    { label: 'Add normal text', type: 'paragraph', className: 'text-lg font-normal leading-normal text-slate-700' },
  ],
};

const questionItems: Section = {
  title: 'Questions',
  items: [
    { label: 'Single choice', type: 'single-choice', group: 'Choice' },
    { label: 'Multiple choice', type: 'multiple-choice', group: 'Choice' },
    { label: 'Text input', type: 'input', group: 'Input' },
    { label: 'Date input', type: 'date', group: 'Input' },
    { label: 'File upload', type: 'file', group: 'Input' },
    { label: 'Ranking', type: 'ranking', group: 'Rating' },
    { label: 'Rating', type: 'rating', group: 'Rating' },
  ],
};

const questionTypeMap: Record<QuestionType, ElementType> = {
  single_choice: 'single-choice',
  multiple_choice: 'multiple-choice',
  text_input: 'input',
  date_input: 'date',
  file_upload: 'file',
  ranking: 'ranking',
  rating: 'rating',
};

const questionCategoryLabels: Record<QuestionCategory, string> = {
  customer_feedback: 'Customer feedback',
  customer_satisfaction: 'Customer satisfaction',
  employee_satisfaction: 'Employee satisfaction',
  product_review: 'Product review',
  events: 'Events',
  market_research: 'Market research',
};

function toLabel(value: string) {
  return value
    .split('_')
    .map((part) => (part ? part[0]?.toUpperCase() + part.slice(1) : part))
    .join(' ');
}

function matchQuestion(item: QuestionBankItem, query: string) {
  if (!query) return true;
  const q = query.toLowerCase();
  if (item.id.toLowerCase().includes(q)) return true;
  if (item.text.en.toLowerCase().includes(q)) return true;
  if (item.tags?.some((tag) => tag.toLowerCase().includes(q))) return true;
  return false;
}

function toElementProps(item: QuestionBankItem): AddElementOptions {
  if (item.type === 'rating' && item.scale) {
    return {
      content: item.text.en,
      props: {
        max: item.scale.max,
        minLabel: item.scale.minLabel?.en,
        maxLabel: item.scale.maxLabel?.en,
        showPrompt: true,
      },
    };
  }
  if (item.type === 'ranking' && item.options) {
    return {
      content: item.text.en,
      props: {
        options: item.options.en.map((label) => ({ label })),
        optionFormat: 'text',
        showPrompt: true,
      },
    };
  }
  if (item.type === 'single_choice' || item.type === 'multiple_choice') {
    return {
      content: item.text.en,
      props: {
        options: item.options?.en.map((label) => ({ label })) ?? [],
        optionFormat: 'text',
        showPrompt: true,
      },
    };
  }
  if (item.type === 'text_input') {
    return { content: item.text.en, props: { showPrompt: true } };
  }
  if (item.type === 'date_input') {
    return { content: item.text.en, props: { showPrompt: true, placeholder: 'Enter a date' } };
  }
  if (item.type === 'file_upload') {
    return { content: item.text.en, props: { showPrompt: true, maxSizeMb: 10 } };
  }
  return { content: item.text.en, props: { showPrompt: true } };
}

type NavSection =
  | 'design'
  | 'elements'
  | 'brand'
  | 'questions';

function QuestionBankPanel({
  onAdd,
  onDragStart,
  onDragEnd,
}: {
  onAdd: (type: ElementType, options?: AddElementOptions) => void;
  onDragStart: (event: DragEvent<HTMLButtonElement>, type: ElementType, options?: { content?: string }) => void;
  onDragEnd: () => void;
}) {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<QuestionCategory | 'all'>('all');
  const chipScrollerRef = useRef<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

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

  const filtered = useMemo(() => {
    return QUESTION_BANK.filter((item) => {
      const matchesCategory = activeCategory === 'all' ? true : item.categories.includes(activeCategory);
      return matchesCategory && matchQuestion(item, query);
    });
  }, [activeCategory, query]);

  return (
    <div className="space-y-4">
      <input
        type="text"
        placeholder="Search question bank..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
      />
      <div className="relative">
        <div
          ref={chipScrollerRef}
          onScroll={updateScrollState}
          className="hide-scrollbar flex gap-2 overflow-x-auto pb-1 pr-10"
        >
          <button
            type="button"
            onClick={() => setActiveCategory('all')}
            className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold transition ${
              activeCategory === 'all'
                ? 'border-slate-900 bg-slate-900 text-white'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
            }`}
          >
            All
          </button>
          {(Object.keys(questionCategoryLabels) as QuestionCategory[]).map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
              className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold transition ${
                activeCategory === category
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
              }`}
            >
              {questionCategoryLabels[category]}
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
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
            No questions match your filters.
          </div>
        ) : (
          filtered.map((item) => {
            const elementType = questionTypeMap[item.type];
            const options = toElementProps(item);
            return (
              <button
                key={item.id}
                type="button"
                className="w-full rounded-xl border border-slate-200 bg-white p-3 text-left shadow-sm transition hover:border-slate-300 hover:shadow-md"
                onClick={() => onAdd(elementType, options)}
                draggable
                onDragStart={(event) => onDragStart(event, elementType, { content: options.content })}
                onDragEnd={onDragEnd}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-semibold text-slate-900">{item.text.en}</div>
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold uppercase text-slate-600">
                    {toLabel(item.type)}
                  </span>
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  {item.categories.map((cat) => questionCategoryLabels[cat]).join(' • ')}
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

function QuestionsPanel({
  onAdd,
  onDragStart,
  onDragEnd,
}: {
  onAdd: (type: ElementType, options?: AddElementOptions) => void;
  onDragStart: (event: DragEvent<HTMLButtonElement>, type: ElementType, options?: { content?: string }) => void;
  onDragEnd: () => void;
}) {
  const [activeTab, setActiveTab] = useState<'format' | 'bank'>('format');

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 border-b border-slate-200 pb-1">
        {(['format', 'bank'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`relative pb-2 text-sm font-semibold transition ${
              activeTab === tab
                ? 'text-slate-900 after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:bg-slate-900'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab === 'format' ? 'Format' : 'Question bank'}
          </button>
        ))}
      </div>
      {activeTab === 'format' ? (
        <>
          <h3 className="text-sm font-semibold text-slate-800">Questions</h3>
          {['Choice', 'Input', 'Rating'].map((group) => (
            <div key={group} className="space-y-2">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{group}</div>
              <div className="grid grid-cols-1 gap-2">
                {questionItems.items
                  .filter((item) => item.group === group)
                  .map((item) => (
                    <Button
                      key={item.type}
                      variant="outline"
                      size="md"
                      className="w-full justify-start rounded-xl border-slate-200 bg-white text-left shadow-sm hover:border-slate-300 hover:shadow-md"
                      onClick={() => onAdd(item.type)}
                      draggable
                      onDragStart={(event) => onDragStart(event, item.type)}
                      onDragEnd={onDragEnd}
                    >
                      {item.label}
                    </Button>
                  ))}
              </div>
            </div>
          ))}
        </>
      ) : (
        <QuestionBankPanel onAdd={onAdd} onDragStart={onDragStart} onDragEnd={onDragEnd} />
      )}
    </div>
  );
}

function ElementsPanel({
  activeTab,
  onTabChange,
  onAdd,
  onDragStart,
  onDragEnd,
  uploads,
  addUpload,
}: {
  activeTab: 'text' | 'media';
  onTabChange: (tab: 'text' | 'media') => void;
  onAdd: (type: ElementType, options?: AddElementOptions) => void;
  onDragStart: (event: DragEvent<HTMLButtonElement>, type: ElementType, options?: { content?: string }) => void;
  onDragEnd: () => void;
  uploads: UploadItem[];
  addUpload: (item: Omit<UploadItem, 'id'>) => void;
}) {
  const [showUploadsAll, setShowUploadsAll] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const handleUploadClick = () => fileInputRef.current?.click();
  const handleUploadChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      Array.from(files).forEach((file) => {
        const url = URL.createObjectURL(file);
        const kind: UploadItem['kind'] =
          file.type.startsWith('video') ? 'video' : file.type.startsWith('image') ? 'image' : 'image';
        addUpload({ src: url, kind, name: file.name });
      });
    }
    event.target.value = '';
  };

  const handleImageDragStart = (event: DragEvent<HTMLButtonElement>, url: string) => {
    if (!event.dataTransfer) return;
    event.dataTransfer.effectAllowed = 'copy';
    event.dataTransfer.setData(ELEMENT_DRAG_TYPE, 'image');
    event.dataTransfer.setData('text/plain', 'image');
    event.dataTransfer.setData(MEDIA_URL_DRAG_TYPE, url);
    event.dataTransfer.setData('text/uri-list', url);
    onDragStart(event, 'image', { content: url });
  };

  const handleVideoDragStart = (event: DragEvent<HTMLButtonElement>, url: string) => {
    if (!event.dataTransfer) return;
    event.dataTransfer.effectAllowed = 'copy';
    event.dataTransfer.setData(ELEMENT_DRAG_TYPE, 'video');
    event.dataTransfer.setData('text/plain', 'video');
    event.dataTransfer.setData(MEDIA_URL_DRAG_TYPE, url);
    event.dataTransfer.setData('text/uri-list', url);
    onDragStart(event, 'video', { content: url });
  };

  const previewUploads = uploads.slice(-4).reverse();

  const renderImageButton = (img: { src: string; alt: string; kind?: UploadItem['kind'] }, className = 'aspect-[4/3]') => (
    <button
      key={img.src}
      type="button"
      onClick={() => onAdd(img.kind === 'video' ? 'video' : 'image', { content: img.src })}
      onDragStart={(event) =>
        img.kind === 'video' ? handleVideoDragStart(event as unknown as DragEvent<HTMLButtonElement>, img.src) : handleImageDragStart(event, img.src)
      }
      onDragEnd={onDragEnd}
      draggable
      className={`group relative overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${className}`}
      aria-label="Add uploaded media"
    >
      {img.kind === 'video' ? (
        <video src={img.src} className="h-full w-full object-cover" muted playsInline />
      ) : (
        <img src={img.src} alt={img.alt} className="h-full w-full object-cover" />
      )}
      <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/15 via-transparent opacity-0 transition group-hover:opacity-100" />
    </button>
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4 border-b border-slate-200 pb-1">
        {(['text', 'media'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => onTabChange(tab)}
            className={`relative pb-2 text-sm font-semibold transition ${
              activeTab === tab
                ? 'text-slate-900 after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:bg-slate-900'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab === 'text' ? 'Text' : 'Media'}
          </button>
        ))}
      </div>

      {activeTab === 'text' && (
        <div className="space-y-4">
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-800">Text formats</h3>
            {textItems.items.map((item) => (
              <Button
                key={item.type}
                variant="outline"
                size="lg"
                className={`w-full justify-start rounded-2xl border-slate-200 bg-white px-4 py-6 text-left shadow-sm hover:border-slate-300 hover:shadow-md ${item.className ?? ''}`}
                onClick={() => onAdd(item.type)}
                draggable
                onDragStart={(event) => onDragStart(event, item.type)}
                onDragEnd={onDragEnd}
              >
                {item.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'media' && (
        <div className="space-y-5">
          <Button className="w-full bg-slate-900 text-white hover:bg-slate-800" size="md" onClick={handleUploadClick}>
            Upload media
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*"
            className="hidden"
            onChange={handleUploadChange}
          />

          <div className="space-y-4 px-1">
            <div className="flex items-center justify-between text-xs font-semibold uppercase text-slate-700">
              <span>Uploads</span>
              <button
                type="button"
                className="text-[11px] font-semibold text-slate-500 underline-offset-2 hover:text-slate-800 hover:underline"
                onClick={() => setShowUploadsAll(true)}
              >
                See all
              </button>
            </div>
            {!showUploadsAll ? (
              <div className="grid h-[180px] grid-cols-2 gap-2 rounded-xl border border-slate-100 bg-slate-50/70 p-2 shadow-inner">
                {previewUploads.length === 0 ? (
                  <div className="col-span-2 flex items-center justify-center text-sm text-slate-400">No uploads yet</div>
                ) : (
                  previewUploads.map((img) =>
                    renderImageButton(
                      { src: img.src, alt: img.name ?? 'Upload', kind: img.kind },
                      'aspect-[4/3]',
                    ),
                  )
                )}
              </div>
            ) : (
              <div className="space-y-2 rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between px-3 pt-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="text-xs font-semibold text-slate-600 underline-offset-2 hover:text-slate-900 hover:underline"
                      onClick={() => setShowUploadsAll(false)}
                    >
                      ← Back
                    </button>
                    <span className="text-xs text-slate-400">Uploads</span>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500">{uploads.length} items</span>
                </div>
                <div className="max-h-[380px] overflow-auto px-3 pb-3">
        <div className="grid grid-cols-2 gap-3">
                    {uploads.length === 0 ? (
                      <div className="col-span-2 flex items-center justify-center text-sm text-slate-400">No uploads yet</div>
                    ) : (
                      [...uploads].reverse().map((img) =>
                        renderImageButton({ src: img.src, alt: img.name ?? 'Upload', kind: img.kind }),
                      )
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4 px-1">
            <div className="flex items-center justify-between text-xs font-semibold uppercase text-slate-700">
              <span>Illustration library</span>
              <span className="text-slate-500">See all</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {illustrationPlaceholders.map((img) => (
                <button
                  key={img.src}
                  type="button"
                  onClick={() => onAdd('image', { content: img.src })}
                  onDragStart={(event) => handleImageDragStart(event as unknown as DragEvent<HTMLButtonElement>, img.src)}
                  onDragEnd={onDragEnd}
                  draggable
                  className="group relative aspect-[4/3] overflow-hidden rounded-md border border-slate-200 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  aria-label="Add illustration"
                >
                  <img src={img.src} alt={img.alt} className="h-full w-full object-cover" />
                  <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 via-transparent opacity-0 transition group-hover:opacity-100" />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4 px-1">
            <div className="flex items-center justify-between text-xs font-semibold uppercase text-slate-700">
              <span>Image library</span>
              <span className="text-slate-500">See all</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {uploadedImages.slice(-3).map((img) => (
                <button
                  key={img.src}
                  type="button"
                  onClick={() => onAdd('image', { content: img.src })}
                  onDragStart={(event) => handleImageDragStart(event as unknown as DragEvent<HTMLButtonElement>, img.src)}
                  onDragEnd={onDragEnd}
                  draggable
                  className="group relative aspect-square overflow-hidden rounded-md border border-slate-200 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  aria-label="Add image"
                >
                  <img src={img.src} alt={img.alt} className="h-full w-full object-cover" />
                  <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 via-transparent opacity-0 transition group-hover:opacity-100" />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4 px-1">
            <div className="flex items-center justify-between text-xs font-semibold uppercase text-slate-700">
              <span>Video library</span>
              <span className="text-slate-500">See all</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {uploadedVideos.map((vid) => (
                <button
                  key={vid.src}
                  type="button"
                  onClick={() => onAdd('video', { content: vid.src })}
                  onDragStart={(event) => handleVideoDragStart(event, vid.src)}
                  onDragEnd={onDragEnd}
                  draggable
                  className="group relative aspect-[3/4] overflow-hidden rounded-md border border-slate-200 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  aria-label="Add video"
                >
                  <video src={vid.src} className="h-full w-full object-cover" muted playsInline />
                  <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent opacity-0 transition group-hover:opacity-100" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

type LocalBrand = {
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  fontHeader: string;
  fontParagraph: string;
};

type BrandPanelProps = {
  onClose?: () => void;
  initialKit?: Brand | null;
  onSave?: (kit: Omit<Brand, 'id'>) => void;
};

function BrandPanel({ onClose, initialKit, onSave }: BrandPanelProps) {
  const brand = useEditorStore((state) => state.brand);
  const updateBrand = useEditorStore((state) => state.updateBrand);
  const updateBrandKit = useEditorStore((state) => state.updateBrandKit);
  const [kitName, setKitName] = useState(initialKit?.name ?? '');
  const [nameError, setNameError] = useState('');
  const getSecondaryColor = (val?: string) => {
    return val === '#10b981' ? '#FFCA28' : (val ?? '#FFCA28');
  };

  const [localBrand, setLocalBrand] = useState<LocalBrand>({
    logoUrl: initialKit?.logoUrl ?? brand.logoUrl ?? '',
    primaryColor: initialKit?.primaryColor ?? brand.primaryColor ?? '#000000',
    secondaryColor: getSecondaryColor(initialKit?.secondaryColor ?? brand.secondaryColor),
    fontFamily: initialKit?.fontFamily ?? brand.fontFamily ?? 'Inter, system-ui, sans-serif',
    fontHeader: initialKit?.fontHeader ?? initialKit?.fontFamily ?? brand.fontHeader ?? brand.fontFamily ?? 'Inter, system-ui, sans-serif',
    fontParagraph: initialKit?.fontParagraph ?? initialKit?.fontFamily ?? brand.fontParagraph ?? brand.fontFamily ?? 'Inter, system-ui, sans-serif',
  });
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const primaryInputRef = useRef<HTMLInputElement | null>(null);
  const secondaryInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setKitName(initialKit?.name ?? '');
    const secondaryColorValue = getSecondaryColor(initialKit?.secondaryColor ?? brand.secondaryColor);
    setLocalBrand({
      logoUrl: initialKit?.logoUrl ?? brand.logoUrl ?? '',
      primaryColor: initialKit?.primaryColor ?? brand.primaryColor ?? '#000000',
      secondaryColor: secondaryColorValue,
      fontFamily: initialKit?.fontFamily ?? brand.fontFamily ?? 'Inter, system-ui, sans-serif',
      fontHeader: initialKit?.fontHeader ?? initialKit?.fontFamily ?? brand.fontHeader ?? brand.fontFamily ?? 'Inter, system-ui, sans-serif',
      fontParagraph: initialKit?.fontParagraph ?? initialKit?.fontFamily ?? brand.fontParagraph ?? brand.fontFamily ?? 'Inter, system-ui, sans-serif',
    });
    
    // If we detected the old green color, update the brand in the store
    if ((initialKit?.secondaryColor ?? brand.secondaryColor) === '#10b981') {
      if (initialKit?.id) {
        updateBrandKit(initialKit.id, { secondaryColor: '#FFCA28' });
      } else {
        updateBrand({ secondaryColor: '#FFCA28' });
      }
    }
  }, [brand, initialKit, updateBrand, updateBrandKit]);

  const handleSave = () => {
    if (!kitName.trim()) {
      setNameError('Please enter a brand kit name');
      return;
    }
    setNameError('');
    onSave?.({
      name: kitName.trim(),
      logoUrl: localBrand.logoUrl || undefined,
      primaryColor: localBrand.primaryColor,
      secondaryColor: localBrand.secondaryColor || undefined,
      fontFamily: localBrand.fontFamily || undefined,
      fontHeader: localBrand.fontHeader || localBrand.fontFamily || undefined,
      fontParagraph: localBrand.fontParagraph || localBrand.fontFamily || undefined,
    });
  };

  const handleReset = () => {
    setNameError('');
    setKitName(initialKit?.name ?? brand.name ?? '');
    setLocalBrand({
      logoUrl: initialKit?.logoUrl ?? brand.logoUrl ?? '',
      primaryColor: initialKit?.primaryColor ?? brand.primaryColor ?? '#000000',
      secondaryColor: getSecondaryColor(initialKit?.secondaryColor ?? brand.secondaryColor),
      fontFamily: initialKit?.fontFamily ?? brand.fontFamily ?? 'Inter, system-ui, sans-serif',
      fontHeader: initialKit?.fontHeader ?? initialKit?.fontFamily ?? brand.fontHeader ?? brand.fontFamily ?? 'Inter, system-ui, sans-serif',
      fontParagraph: initialKit?.fontParagraph ?? initialKit?.fontFamily ?? brand.fontParagraph ?? brand.fontFamily ?? 'Inter, system-ui, sans-serif',
    });
    onClose?.();
  };

  const triggerUpload = () => fileInputRef.current?.click();

  return (
    <div className="flex flex-col gap-5">
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">Brand kit name</label>
        <input
          className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          value={kitName}
          onChange={(e) => setKitName(e.target.value)}
          required
          placeholder="Enter brand kit name"
        />
        {nameError && <p className="text-sm text-red-600">{nameError}</p>}
      </div>

      <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
        <div className="mb-3 text-2xl">⇧</div>
        <p className="text-sm font-semibold text-slate-800">Upload Logo</p>
        <p className="text-xs text-slate-500">PNG or SVG</p>
        <div className="mt-4 flex justify-center">
          <Button size="md" variant="secondary" onClick={triggerUpload}>
            Upload
          </Button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
               const url = URL.createObjectURL(file);
               setLocalBrand((prev) => ({ ...prev, logoUrl: url }));
            }
            e.target.value = '';
          }}
        />
      </div>

      <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-800">Choose your primary brand color</label>
          <div className="relative">
            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-800 transition hover:border-slate-300"
            >
              <span
                className="h-8 w-8 rounded-full border-2 border-white shadow ring-1 ring-slate-200"
                style={{ backgroundColor: localBrand.primaryColor }}
                aria-label="Pick primary color"
              />
              <span className="font-mono text-xs">{localBrand.primaryColor}</span>
            </button>
            <input
              ref={primaryInputRef}
              type="color"
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              value={colorInputValue(localBrand.primaryColor)}
              onChange={(e) => setLocalBrand((prev) => ({ ...prev, primaryColor: e.target.value }))}
            />
          </div>
          <input
            className="h-9 w-full rounded-md border border-slate-200 px-2 text-sm text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            value={localBrand.primaryColor}
            placeholder="#000000 or rgb() / hsl() / hsb()"
            onChange={(e) => {
              const raw = e.target.value;
              const normalized = normalizeColorValue(raw);
              setLocalBrand((prev) => ({ ...prev, primaryColor: normalized ?? raw }));
            }}
          />
        </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-800">Choose your secondary brand color (optional)</label>
          <div className="relative">
            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-800 transition hover:border-slate-300"
            >
              <span
                className="h-8 w-8 rounded-full border-2 border-white shadow ring-1 ring-slate-200"
                style={{ backgroundColor: localBrand.secondaryColor }}
                aria-label="Pick secondary color"
              />
              <span className="font-mono text-xs">{localBrand.secondaryColor}</span>
            </button>
            <input
              ref={secondaryInputRef}
              type="color"
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              value={colorInputValue(localBrand.secondaryColor)}
              onChange={(e) => setLocalBrand((prev) => ({ ...prev, secondaryColor: e.target.value }))}
            />
          </div>
          <input
            className="h-9 w-full rounded-md border border-slate-200 px-2 text-sm text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            value={localBrand.secondaryColor}
            placeholder="#000000 or rgb() / hsl() / hsb()"
            onChange={(e) => {
              const raw = e.target.value;
              const normalized = normalizeColorValue(raw);
              setLocalBrand((prev) => ({ ...prev, secondaryColor: normalized ?? raw }));
            }}
          />
      </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-800">Font header</label>
          <FontSelector
            currentFontFamily={localBrand.fontHeader}
            portal={false}
            onFontChange={(f) => setLocalBrand((prev) => ({ ...prev, fontHeader: f }))}
          />
          <div
            className="text-sm text-slate-700"
            style={{ fontFamily: localBrand.fontHeader, fontWeight: 600 }}
          >
            The quick brown fox jumps over the lazy dog
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-800">Font paragraph</label>
          <FontSelector
            currentFontFamily={localBrand.fontParagraph}
            portal={false}
            onFontChange={(f) => setLocalBrand((prev) => ({ ...prev, fontParagraph: f }))}
          />
          <div
            className="text-sm text-slate-700"
            style={{ fontFamily: localBrand.fontParagraph, fontWeight: 400 }}
          >
            The quick brown fox jumps over the lazy dog
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 flex justify-end gap-2 border-t border-slate-200 bg-white pt-4">
        <Button
          variant="ghost"
          size="md"
          onClick={handleReset}
        >
          Cancel
        </Button>
        <Button size="md" onClick={handleSave}>
          Save brand
        </Button>
      </div>
    </div>
  );
}

export function Sidebar() {
  const addElement = useEditorStore((state) => state.addElement);
  const uploads = useEditorStore((state) => state.uploads);
  const addUpload = useEditorStore((state) => state.addUpload);
  const setDraggingNewElement = useEditorStore((state) => state.setDraggingNewElement);
  const selectedElementId = useEditorStore((state) => state.selectedElementId);
  const letter = useEditorStore((state) => state.letter);
  const brand = useEditorStore((state) => state.brand);
  const brandKits = useEditorStore((state) => state.brandKits);
  const addBrandKit = useEditorStore((state) => state.addBrandKit);
  const updateBrandKit = useEditorStore((state) => state.updateBrandKit);
  const setActiveBrand = useEditorStore((state) => state.setActiveBrand);
  const [brandMenuOpenId, setBrandMenuOpenId] = useState<string | null>(null);
  const [editingKit, setEditingKit] = useState<Brand | null>(null);
  const selectedElement =
    selectedElementId &&
    letter.screens
      .flatMap((s) => s.elements)
      .find((el) => el.id === selectedElementId);
  const [activeMain, setActiveMain] = useState<NavSection>('brand');
  const [activeElementsTab, setActiveElementsTab] = useState<'text' | 'media'>('text');
  const handleAddElement = (type: ElementType, options?: AddElementOptions) =>
    addElement(type, undefined, undefined, options);
  const [brandModalOpen, setBrandModalOpen] = useState(false);
  const modalContentRef = useRef<HTMLDivElement | null>(null);

  const handleDragStart = (event: DragEvent<HTMLButtonElement>, type: ElementType, options?: { content?: string }) => {
    if (!event.dataTransfer) return;
    event.dataTransfer.effectAllowed = 'copy';
    event.dataTransfer.setData(ELEMENT_DRAG_TYPE, type);
    event.dataTransfer.setData('text/plain', type);
    setDraggingNewElement({ type, content: options?.content });
  };
  const handleDragEnd = () => setDraggingNewElement(null);

  const navSections: { id: NavSection; label: string; icon: ReactNode }[] = [
    {
      id: 'brand',
      label: 'Brand',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="4" y="4" width="16" height="16" rx="3" />
          <circle cx="10" cy="10" r="2" />
          <path d="M14 8h4M14 12h4M6 14h12" />
        </svg>
      ),
    },
    {
      id: 'elements',
      label: 'Elements',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" stroke="none">
          <path d="M8 6.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Zm11 0c0 1.933-1.567 3.5-3.5 3.5S12 8.433 12 6.5 13.567 3 15.5 3 19 4.567 19 6.5Zm-9 11A2.5 2.5 0 1 1 7.5 15 2.5 2.5 0 0 1 10 17.5Zm7-3.5-4.33 5.773a1 1 0 0 1-1.34.227L7 17l4.33-5.773a1 1 0 0 1 1.34-.227L17 14Z" />
        </svg>
      ),
    },
    {
      id: 'questions',
      label: 'Questions',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" />
        </svg>
      ),
    },
    {
      id: 'design',
      label: selectedElement ? 'Edit' : 'Design',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="4" y="4" width="7" height="7" rx="2" />
          <rect x="13" y="4" width="7" height="7" rx="2" />
          <rect x="4" y="13" width="16" height="7" rx="2" />
        </svg>
      ),
    },
  ];

  const renderContent = () => {
    if (activeMain === 'brand') {
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Brand kits</h3>
            <Button
              size="sm"
              onClick={() => {
                setEditingKit(null);
                setBrandModalOpen(true);
              }}
              className="bg-black text-white hover:bg-black/90"
            >
              Add brand kit
            </Button>
          </div>
          <div className="grid w-full grid-cols-1 gap-3">
            {brandKits.map((kit, idx) => {
              const isActive = brand.id === kit.id;
              const accent = kit.primaryColor || '#111827';
              return (
                <button
                  key={kit.id ?? `kit-${idx}`}
                  type="button"
                  onClick={() => kit.id && setActiveBrand(kit.id)}
                  className={`relative flex w-full min-h-[108px] items-start gap-3 rounded-2xl border p-4 text-left shadow-sm transition focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    isActive
                      ? 'border-transparent ring-offset-slate-900'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                  style={
                    isActive
                      ? {
                          background: `linear-gradient(135deg, ${accent}15, ${accent}05)`,
                          boxShadow: `0 10px 30px -15px ${accent}80`,
                          borderColor: accent,
                        }
                      : undefined
                  }
                >
                  <div className="flex flex-col gap-1 text-slate-900">
                    <div className="text-base font-semibold">{kit.name ?? 'Brand kit'}</div>
                    <div className="text-xs text-slate-600">{isActive ? 'Active' : 'Inactive'}</div>
                    {!isActive && (
                      <span
                        className="mt-1 inline-flex w-fit items-center gap-1 rounded-full px-3 py-1 text-[11px] font-semibold"
                        style={{ color: accent, backgroundColor: `${accent}14`, border: `1px solid ${accent}33` }}
                      >
                        Tap to apply this kit
                      </span>
                    )}
                    {isActive && (
                      <span
                        className="mt-1 inline-flex w-fit items-center gap-1 rounded-full px-3 py-1 text-[11px] font-semibold text-white"
                        style={{ backgroundColor: accent }}
                      >
                        ✓ Active on canvas
                      </span>
                    )}
                  </div>
                  <div className="relative ml-auto">
                    <button
                      type="button"
                      className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-800 hover:bg-slate-200"
                      onClick={(e) => {
                        e.stopPropagation();
                        setBrandMenuOpenId((v) => (v === kit.id ? null : kit.id ?? null));
                      }}
                    >
                      ⋯
                    </button>
                    {brandMenuOpenId === kit.id && (
                      <div className="absolute right-0 top-11 z-10 w-36 rounded-lg border border-slate-200 bg-white text-slate-800 shadow-lg">
                        <button
                          type="button"
                          className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            setBrandMenuOpenId(null);
                            setEditingKit(kit);
                            setBrandModalOpen(true);
                          }}
                        >
                          Edit
                        </button>
                        {!isActive && (
                          <button
                            type="button"
                            className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              setBrandMenuOpenId(null);
                              kit.id && setActiveBrand(kit.id);
                            }}
                          >
                            Set active
                          </button>
                        )}
                        <button
                          type="button"
                          className="block w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-slate-50 disabled:text-red-300"
                          disabled
                          onClick={(e) => {
                            e.stopPropagation();
                            setBrandMenuOpenId(null);
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
          {brandModalOpen &&
            createPortal(
              <div 
                className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4"
                onClick={(e) => {
                  // Close if clicking on the backdrop (outside the modal content)
                  if (modalContentRef.current && !modalContentRef.current.contains(e.target as Node)) {
                    setBrandModalOpen(false);
                  }
                }}
              >
                <div 
                  ref={modalContentRef}
                  className="flex max-h-[85vh] w-full max-w-xl flex-col rounded-2xl bg-white p-5 shadow-xl"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <h4 className="text-lg font-semibold text-slate-900">Edit brand kit</h4>
                    <button
                      type="button"
                      className="text-sm text-slate-500 hover:text-slate-800"
                      onClick={() => setBrandModalOpen(false)}
                    >
                      ✕
                    </button>
                  </div>
                  <div className="min-h-0 flex-1 overflow-y-auto pr-1">
                    <BrandPanel
                      initialKit={editingKit}
                      onClose={() => setBrandModalOpen(false)}
                      onSave={(data) => {
                        if (editingKit?.id) {
                          updateBrandKit(editingKit.id, data);
                          setActiveBrand(editingKit.id);
                        } else {
                          const newId = addBrandKit(data);
                          if (newId) setActiveBrand(newId);
                        }
                        setBrandModalOpen(false);
                      }}
                    />
                  </div>
                </div>
              </div>,
              document.body,
            )}
        </div>
      );
    }
    if (activeMain === 'elements') {
      return (
        <ElementsPanel
          activeTab={activeElementsTab}
          onTabChange={setActiveElementsTab}
          onAdd={handleAddElement}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          uploads={uploads}
          addUpload={addUpload}
        />
      );
    }
    if (activeMain === 'questions') {
      return (
        <QuestionsPanel
          onAdd={handleAddElement}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        />
      );
    }
    return (
      <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
        {selectedElement ? 'Select an element to edit its properties.' : 'Design panel is coming soon.'}
      </div>
    );
  };

  return (
    <aside className="sticky top-[56px] flex h-[calc(100vh-56px)] w-[380px] min-w-[340px] border-r border-slate-200 bg-white overflow-y-auto">
      <div className="flex w-24 flex-col items-center gap-4 border-r border-slate-200 py-6">
        {navSections.map((item) => {
          const isActive = activeMain === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveMain(item.id)}
              className={`flex h-20 w-16 flex-col items-center justify-center gap-2 rounded-2xl text-xs font-semibold transition ${
                isActive
                  ? 'bg-white text-blue-600 shadow-[0_10px_30px_-18px_rgba(0,0,0,0.35)] ring-1 ring-blue-200'
                  : 'text-slate-500 hover:text-blue-600'
              }`}
              aria-pressed={isActive}
            >
              <span
                className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                  isActive ? 'bg-blue-50 text-blue-600' : 'text-slate-500'
                }`}
              >
                {item.icon}
              </span>
              <span className="text-[12px] leading-none text-center">{item.label}</span>
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-auto px-3 py-5">
        {renderContent()}
      </div>
    </aside>
  );
}
