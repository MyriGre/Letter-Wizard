// AI-AGENT-HEADER
// path: /src/components/eletters/ImportQuestionnaireModal.tsx
// summary: Modal to upload an existing questionnaire file and start a draft.
// last-reviewed: 2026-01-12
// line-range: 1-220

import * as Dialog from '@radix-ui/react-dialog';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '../ui/button';
import { cn } from '../../lib/cn';
import type { Letter, Screen } from '../../types/editor';
import { importQuestionnaireFile } from '../../eletters/import';
import { EletterPreview } from './EletterPreview';

const ACCEPT_LABEL = 'PDF, DOCX, JPG, or PNG';
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

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
}

export function ImportQuestionnaireModal({
  open,
  onOpenChange,
  onImport,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (payload: { file: File; draft?: Letter | null }) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [parsedDraft, setParsedDraft] = useState<Letter | null>(null);
  const [parseNotes, setParseNotes] = useState<string[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [layoutMode, setLayoutMode] = useState<'single' | 'per-question'>('single');

  useEffect(() => {
    if (!open) setFile(null);
  }, [open]);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    if (!file) {
      setParsedDraft(null);
      setParseNotes([]);
      setParseError(null);
      setIsParsing(false);
      return;
    }
    let cancelled = false;
    setIsParsing(true);
    setParseError(null);
    setParseNotes([]);
    importQuestionnaireFile(file)
      .then((result) => {
        if (cancelled) return;
        if (result.error) {
          setParseError(result.error);
          setParsedDraft(null);
          return;
        }
        setParsedDraft(result.draftJson ?? null);
        setParseNotes(Array.isArray(result.notes) ? result.notes : []);
      })
      .catch((err) => {
        if (cancelled) return;
        setParseError(err instanceof Error ? err.message : 'Failed to analyze file.');
        setParsedDraft(null);
      })
      .finally(() => {
        if (!cancelled) setIsParsing(false);
      });
    return () => {
      cancelled = true;
    };
  }, [file]);

  const fileMeta = useMemo(() => {
    if (!file) return null;
    return {
      name: file.name,
      size: formatBytes(file.size),
    };
  }, [file]);

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
    const elements = letter.screens.flatMap((s) =>
      (s.elements ?? []).filter((el) => !el.parentId && questionTypes.has(el.type as string)),
    );
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

  const previewDraft = useMemo(
    () => (parsedDraft ? applyLayout(parsedDraft, layoutMode) : null),
    [parsedDraft, layoutMode],
  );
  const canApply = Boolean(file) && (!isParsing && (Boolean(previewDraft) || Boolean(parseError)));

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/30" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 h-[88vh] w-[92vw] max-w-[1200px] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <Dialog.Title className="text-lg font-semibold text-slate-900">Import questionnaire</Dialog.Title>
                <Dialog.Description className="mt-1 text-sm text-slate-600">
                  Upload an existing questionnaire and turn it into a digital draft.
                </Dialog.Description>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="md"
                  disabled={!canApply}
                  onClick={() => {
                    if (!file) return;
                    onImport({ file, draft: previewDraft ?? parsedDraft });
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
              <div className="flex min-h-0 flex-col gap-4 border-r border-slate-200 p-5">
                <label
                  className={cn(
                    'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-600 transition',
                    'hover:border-slate-400 hover:bg-white',
                  )}
                >
                  <span className="text-sm font-semibold text-slate-900">Drop a file or click to upload</span>
                  <span className="text-xs text-slate-500">{ACCEPT_LABEL}</span>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                    className="sr-only"
                    onChange={(event) => {
                      const next = event.target.files?.[0] ?? null;
                      setFile(next);
                    }}
                  />
                </label>

                {fileMeta ? (
                  <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-3 text-sm">
                    <div className="text-slate-900">{fileMeta.name}</div>
                    <div className="text-xs text-slate-500">{fileMeta.size}</div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-slate-200 bg-white p-3 text-xs text-slate-500">
                    No file selected yet.
                  </div>
                )}
                {previewUrl && (
                  <a
                    href={previewUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-xs font-semibold text-slate-900"
                  >
                    Open uploaded file
                    <span aria-hidden>↗</span>
                  </a>
                )}

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                  We will detect questions and create a draft you can review. If parsing fails, you can still continue
                  with a blank draft and edit manually.
                </div>
                {isParsing && (
                  <div className="rounded-2xl border border-blue-200 bg-blue-50 p-3 text-xs text-blue-700">
                    Analyzing the document… extracting questions and options.
                  </div>
                )}
                {parseError && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                    We could not extract questions. You can still import a blank draft.
                  </div>
                )}
                {parseNotes.length > 0 && (
                  <div className="rounded-2xl border border-slate-200 bg-white p-3 text-xs text-slate-600">
                    <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      Import notes
                    </div>
                    <ul className="list-disc space-y-1 pl-4">
                      {parseNotes.slice(0, 4).map((note, index) => (
                        <li key={`${note}-${index}`}>{note}</li>
                      ))}
                      {parseNotes.length > 4 && <li>+ {parseNotes.length - 4} more</li>}
                    </ul>
                  </div>
                )}
              </div>

              <div className="flex min-h-0 flex-col bg-slate-50 p-5">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-slate-700">Preview</div>
                  {previewDraft && (
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
                  )}
                </div>
                <div
                  className={cn(
                    'mt-3 flex min-h-0 flex-1 rounded-2xl border border-dashed border-slate-200 bg-white p-4',
                    previewDraft ? 'items-stretch justify-stretch' : 'items-center justify-center',
                  )}
                >
                  {!file && <div className="text-sm text-slate-500">Upload a file to see a preview.</div>}
                  {file && isParsing && (
                    <div
                      className="flex w-full max-w-md flex-col items-center gap-3 text-center text-sm text-slate-600"
                      role="status"
                      aria-live="polite"
                    >
                      <div className="flex items-center gap-3 text-base font-semibold text-slate-900">
                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                          AI
                        </span>
                        Analyzing your document…
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                        <div className="import-progress-bar h-full w-full rounded-full bg-slate-900/80" />
                      </div>
                      <style>{`
                        @keyframes import-progress {
                          0% { transform: scaleX(0.15); }
                          50% { transform: scaleX(0.92); }
                          100% { transform: scaleX(0.3); }
                        }
                        .import-progress-bar {
                          transform-origin: left;
                          animation: import-progress 1.8s ease-in-out infinite;
                        }
                      `}</style>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <div className="flex items-center gap-1">
                          <span
                            className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400"
                            style={{ animationDelay: '0ms' }}
                          />
                          <span
                            className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400"
                            style={{ animationDelay: '120ms' }}
                          />
                          <span
                            className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400"
                            style={{ animationDelay: '240ms' }}
                          />
                        </div>
                        Extracting questions and options.
                      </div>
                    </div>
                  )}
                  {file && !isParsing && previewDraft && (
                    <EletterPreview
                      letter={previewDraft}
                      variant="mobile"
                      tone="compact"
                      frameHeight="100%"
                      allowScroll
                      className="h-full w-full max-w-none"
                    />
                  )}
                  {file && !isParsing && !previewDraft && (
                    <div className="text-center text-sm text-slate-500">
                      We could not extract questions from this file yet.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
