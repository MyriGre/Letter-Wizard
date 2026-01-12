// AI-AGENT-HEADER
// path: /src/components/eletters/AIEletterModal.tsx
// summary: AI builder modal with chat (left) + live preview (right) and Apply action.
// last-reviewed: 2025-12-17
// line-range: 1-360

import * as Dialog from '@radix-ui/react-dialog';
import { useMemo, useRef, useState } from 'react';
import { Button } from '../ui/button';
import { cn } from '../../lib/cn';
import type { Letter, Screen } from '../../types/editor';
import { generateEletterFromPrompt } from '../../eletters/ai';
import { EletterPreview } from './EletterPreview';

type ChatMessage = { id: string; role: 'user' | 'assistant'; text: string };
  type DraftSource = 'gemini' | 'openai' | 'heuristic';
  type DraftWarning = string | undefined;

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

function nowId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function AIEletterModal({
  open,
  onOpenChange,
  onApply,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply: (letter: Letter) => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: nowId(),
      role: 'assistant',
      text: 'Describe your eLetter: audience, goal, tone, and any questions you want to include.',
    },
  ]);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [draft, setDraft] = useState<Letter | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<'mobile' | 'desktop'>('mobile');
  const [layoutMode, setLayoutMode] = useState<'single' | 'per-question'>('single');
  const starterPrompts = [
    {
      id: 'customer-feedback',
      title: 'Customer feedback',
      badge: 'CF',
      text: 'Create a short customer feedback eLetter. Ask about satisfaction, effort to get help, and if issues occurred.',
    },
    {
      id: 'employee-pulse',
      title: 'Employee pulse',
      badge: 'EP',
      text: 'Create a quick employee pulse about role satisfaction, enablement, psychological safety, and workload.',
    },
    {
      id: 'market-research',
      title: 'Market research',
      badge: 'MR',
      text: 'Create a market research survey to understand needs, decision factors, priorities, and timing.',
    },
  ];
  const showStarterPrompts = messages.length <= 1;

  const canApply = Boolean(draft) && !isGenerating;

  const isValidLetter = (value: unknown): value is Letter => {
    if (!value || typeof value !== 'object') return false;
    const obj = value as any;
    return typeof obj.id === 'string' && typeof obj.title === 'string' && Array.isArray(obj.screens);
  };

  const summarizeDraft = (value: Letter, source?: DraftSource, warning?: DraftWarning) => {
    const screens = value.screens ?? [];
    const questionCount = screens.reduce((sum, screen) => {
      const elements = screen.elements ?? [];
      return sum + elements.filter((el) => questionTypes.has(el.type as string)).length;
    }, 0);
    const screenCount = screens.length;
    const title = value.title?.trim() || 'Untitled';
    const sourceLabel =
      source === 'gemini'
        ? 'Gemini'
        : source === 'openai'
          ? 'OpenAI'
          : 'local logic';
    const detail =
      questionCount === 0
        ? `Draft ready: "${title}" with ${screenCount} screen${screenCount === 1 ? '' : 's'} (source: ${sourceLabel}).`
        : `Draft ready: "${title}" with ${questionCount} question${questionCount === 1 ? '' : 's'} across ${screenCount} screen${screenCount === 1 ? '' : 's'} (source: ${sourceLabel}).`;
    const warningText = warning ? ` ${warning}` : '';
    return `${detail}${warningText} Tell me what to adjust.`;
  };

  const submit = async () => {
    const prompt = input.trim();
    if (!prompt || isGenerating) return;
    const hadDraft = Boolean(draft);
    setInput('');
    setLastError(null);
    setMessages((prev) => [...prev, { id: nowId(), role: 'user', text: prompt }]);
    setIsGenerating(true);
    try {
      let result: Letter | null = null;
      let source: DraftSource | undefined;
      let warning: DraftWarning;

      // Prefer backend endpoint (no API key in frontend). Falls back to local heuristic generator if unavailable.
      try {
        const resp = await fetch('/api/eletters/ai-draft', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt, currentDraftJson: draft }),
        });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const data = (await resp.json()) as { draftJson?: unknown; source?: DraftSource; warning?: DraftWarning };
        if (!isValidLetter(data.draftJson)) throw new Error('Invalid draft JSON');
        result = data.draftJson;
        source = data.source ?? 'heuristic';
        warning = data.warning;
      } catch {
        result = await generateEletterFromPrompt(prompt, draft);
        source = 'heuristic';
        warning = 'Gemini unavailable: AI backend not reachable.';
      }

      if (!result) throw new Error('No draft generated');
      setDraft(result);
      setMessages((prev) => [
        ...prev,
        {
          id: nowId(),
          role: 'assistant',
          text: hadDraft
            ? `Updated draft. ${summarizeDraft(result, source, warning)}`
            : summarizeDraft(result, source, warning),
        },
      ]);
    } catch {
      setLastError('Sorry — I could not generate a draft. Please try again.');
      setMessages((prev) => [
        ...prev,
        { id: nowId(), role: 'assistant', text: 'Sorry — I could not generate a draft. Please try again.' },
      ]);
      setDraft(null);
    } finally {
      setIsGenerating(false);
      setTimeout(() => bottomRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' }), 0);
    }
  };

  const previewTitle = useMemo(() => draft?.title ?? 'AI preview', [draft]);
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
  const previewDraft = draft ? applyLayout(draft, layoutMode) : null;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/30" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 h-[88vh] w-[92vw] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <Dialog.Title className="text-lg font-semibold text-slate-900">Build with AI</Dialog.Title>
                <Dialog.Description className="mt-1 text-sm text-slate-600">
                  Prompt → draft JSON → preview → apply.
                </Dialog.Description>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="md"
                  disabled={!canApply}
                  onClick={() => {
                    if (!draft) return;
                    onApply(previewDraft ?? draft);
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

            <div className="grid flex-1 min-h-0 grid-cols-1 lg:grid-cols-[420px_1fr]">
              <div className="flex min-h-0 flex-col border-b border-slate-200 lg:border-b-0 lg:border-r">
                <div className="flex-1 overflow-auto p-4">
                  <div className="space-y-4">
                    {showStarterPrompts && (
                      <div className="space-y-3">
                        <div>
                          <div className="text-sm font-semibold text-slate-900">Try a starter prompt</div>
                          <div className="text-xs text-slate-500">Pick a template-style prompt to get started.</div>
                        </div>
                        <div className="grid grid-cols-1 gap-3">
                          {starterPrompts.map((prompt) => (
                            <button
                              key={prompt.id}
                              type="button"
                              onClick={() => {
                                setInput(prompt.text);
                                requestAnimationFrame(() => inputRef.current?.focus());
                              }}
                              className={cn(
                                'group rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition',
                                'hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md',
                              )}
                            >
                              <div className="flex items-start gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                                  {prompt.badge}
                                </div>
                                <div className="flex-1">
                                  <div className="text-sm font-semibold text-slate-900">{prompt.title}</div>
                                  <div className="mt-1 text-xs text-slate-600">{prompt.text}</div>
                                  <div className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-slate-900">
                                    Use prompt
                                    <span className="text-slate-400 transition group-hover:translate-x-0.5">→</span>
                                  </div>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {messages.map((m) => (
                      <div
                        key={m.id}
                        className={cn(
                          'max-w-[92%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
                          m.role === 'user'
                            ? 'ml-auto bg-slate-900 text-white'
                            : 'mr-auto bg-slate-50 text-slate-800 border border-slate-200',
                        )}
                      >
                        {m.text}
                      </div>
                    ))}
                    {isGenerating && (
                      <div className="mr-auto max-w-[92%] rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
                        Generating…
                      </div>
                    )}
                    <div ref={bottomRef} />
                  </div>
                </div>
                <div className="border-t border-slate-200 p-3">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      submit();
                    }}
                    className="flex items-center gap-2"
                  >
                    <input
                      ref={inputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Describe your eLetter…"
                      className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    />
                    <Button type="submit" size="md" disabled={isGenerating || !input.trim()}>
                      Send
                    </Button>
                  </form>
                </div>
              </div>

              <div className="min-h-0 bg-slate-50 p-5">
                <div className="flex h-full min-h-0 flex-col">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-slate-900">{previewTitle}</div>
                    <div className="flex flex-wrap items-center gap-2">
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
                  </div>
                  {lastError && (
                    <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {lastError}
                    </div>
                  )}
                  <div className="flex-1 min-h-0">
                    <EletterPreview
                      letter={previewDraft}
                      variant={previewMode}
                      tone="compact"
                      frameHeight={previewMode === 'mobile' ? '100%' : undefined}
                      allowScroll={previewMode === 'mobile'}
                      className={cn('h-full', previewMode === 'desktop' ? 'max-w-[1100px]' : undefined)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
