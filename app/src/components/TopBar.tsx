// AI-AGENT-HEADER
// path: /src/components/TopBar.tsx
// summary: Top navigation bar with title, device toggle buttons, and JSON export action.
// last-reviewed: 2025-12-08
// line-range: 1-200

import { Button } from './ui/button';
import { useEditorStore } from '../store/editorStore';
import { cn } from '../lib/cn';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import * as Popover from '@radix-ui/react-popover';
import {
  translateLetterWithEngine,
  localTranslationLabel,
  translationLabels,
  translationLanguages,
  type TranslationEngine,
  type TranslationLanguage,
} from '../eletters/translation';
import { addUserTemplate, createDraft } from '../eletters/storage';
import type { EletterStatus } from '../eletters/types';

function navigate(to: string) {
  window.history.pushState({}, '', to);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

function TitleInput({
  value,
  placeholder,
  onCommit,
}: {
  value: string;
  placeholder: string;
  onCommit: (value: string) => void;
}) {
  const [local, setLocal] = useState(value);
  const prevValueRef = useRef(value);
  const measuredLength = Math.max(8, Math.min(Math.max(local.length, placeholder.length), 27));

  useEffect(() => {
    if (prevValueRef.current !== value) {
      prevValueRef.current = value;
      setLocal(value);
    }
  }, [value]);

  const commit = () => {
    const next = local.trim() || placeholder;
    if (next !== value) onCommit(next);
    setLocal(next);
  };

  return (
    <input
      value={local}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          (e.currentTarget as HTMLInputElement).blur();
        }
        if (e.key === 'Escape') {
          e.preventDefault();
          setLocal(value);
          (e.currentTarget as HTMLInputElement).blur();
        }
      }}
      placeholder={placeholder}
      className={cn(
        'h-10 w-auto max-w-[40vw] rounded-lg px-2 text-lg font-semibold text-slate-900 outline-none transition',
        'border border-transparent focus:border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-100',
        'placeholder:text-slate-400',
      )}
      style={{ width: `${measuredLength}ch` }}
      aria-label="E-Letter name"
    />
  );
}

export function TopBar({
  showBackToDashboard,
  draftName,
  draftStatus,
  viewMode,
  onViewModeChange,
  logicEnabled = true,
  logicDisabledReason,
  onDraftNameCommit,
}: {
  showBackToDashboard?: boolean;
  draftName?: string;
  draftStatus?: EletterStatus;
  viewMode?: 'content' | 'logic';
  onViewModeChange?: (mode: 'content' | 'logic') => void;
  logicEnabled?: boolean;
  logicDisabledReason?: string;
  onDraftNameCommit?: (name: string) => void;
}) {
  const deviceMode = useEditorStore((state) => state.deviceMode);
  const setDeviceMode = useEditorStore((state) => state.setDeviceMode);
  const letter = useEditorStore((state) => state.letter);
  const setLetter = useEditorStore((state) => state.setLetter);
  const selectedScreenId = useEditorStore((state) => state.selectedScreenId);
  const selectScreen = useEditorStore((state) => state.selectScreen);
  const [exportOpen, setExportOpen] = useState(false);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'error'>('idle');
  const copyResetRef = useRef<number | null>(null);
  const exportTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const exportJson = useMemo(() => JSON.stringify(letter, null, 2), [letter]);
  const [translateOpen, setTranslateOpen] = useState(false);
  const [targetLanguage, setTargetLanguage] = useState<TranslationLanguage>('de');
  const [translationMode, setTranslationMode] = useState<'replace' | 'duplicate'>('replace');
  const [isTranslating, setIsTranslating] = useState(false);
  const [translateError, setTranslateError] = useState<string | null>(null);
  const [lastEngine, setLastEngine] = useState<TranslationEngine | null>(null);
  const [actionsOpen, setActionsOpen] = useState(false);

  const handleExport = () => {
    setExportOpen(true);
  };
  const handleCopyJson = async () => {
    try {
      await navigator.clipboard.writeText(exportJson);
      setCopyStatus('copied');
    } catch {
      setCopyStatus('error');
    }
  };

  useEffect(() => {
    if (!exportOpen) {
      setCopyStatus('idle');
    }
  }, [exportOpen]);

  useEffect(() => {
    if (copyStatus !== 'copied') return;
    if (copyResetRef.current) window.clearTimeout(copyResetRef.current);
    copyResetRef.current = window.setTimeout(() => setCopyStatus('idle'), 1600);
    return () => {
      if (copyResetRef.current) window.clearTimeout(copyResetRef.current);
    };
  }, [copyStatus]);

  useEffect(() => {
    if (!translateOpen) return;
    const current =
      translationLanguages.find((lang) => lang === letter.language) ?? ('en' as TranslationLanguage);
    setTargetLanguage(current === 'en' ? 'de' : current);
    setTranslateError(null);
    setIsTranslating(false);
  }, [letter.language, translateOpen]);

  return (
    <div className="sticky top-0 z-30 border-b border-slate-200 bg-white px-6 py-3">
      <div className="grid w-full grid-cols-[1fr_auto_1fr] items-center gap-4">
        <div className="flex min-w-0 items-center gap-3">
          {showBackToDashboard && (
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
              onClick={() => navigate('/eletters')}
              aria-label="Back to E-Letters dashboard"
            >
              <span aria-hidden>←</span>
              <span>Overview</span>
            </button>
          )}
          <div className="flex items-center gap-2">
            <TitleInput
              value={draftName ?? letter.title ?? 'No title'}
              placeholder="No title"
              onCommit={(next) => onDraftNameCommit?.(next)}
            />
            {draftStatus === 'Draft' && (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-400" aria-hidden />
                Draft
              </span>
            )}
            {draftStatus === 'Draft' && (
              <Popover.Root open={actionsOpen} onOpenChange={setActionsOpen}>
                <Popover.Trigger asChild>
                  <button
                    type="button"
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-transparent text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                    aria-label="Draft actions"
                  >
                    ⋯
                  </button>
                </Popover.Trigger>
                <Popover.Portal>
                  <Popover.Content
                    className="z-50 w-44 rounded-xl border border-slate-200 bg-white p-1 shadow-lg"
                    sideOffset={8}
                    align="start"
                  >
                    <button
                      type="button"
                      className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                      onClick={() => {
                        const name = draftName ?? letter.title ?? 'Untitled';
                        addUserTemplate(name, letter);
                        setActionsOpen(false);
                      }}
                    >
                      Save as template
                    </button>
                  </Popover.Content>
                </Popover.Portal>
              </Popover.Root>
            )}
          </div>
        </div>

        <div className="flex justify-center">
          {onViewModeChange && viewMode && (
            <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1">
              {(['content', 'logic'] as const).map((mode) => {
                const disabled = mode === 'logic' && !logicEnabled;
                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => onViewModeChange(mode)}
                    disabled={disabled}
                    title={disabled ? logicDisabledReason : undefined}
                    className={cn(
                      'rounded-lg px-4 py-2 text-sm font-semibold transition',
                      disabled && 'cursor-not-allowed opacity-50',
                      viewMode === mode
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-500 hover:text-slate-800',
                    )}
                  >
                    {mode === 'content' ? 'Content' : 'Logic'}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3">
          <Button variant="outline" size="md" onClick={() => setTranslateOpen(true)}>
            Translate
          </Button>
          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
            {(['mobile', 'desktop'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setDeviceMode(mode)}
                className={cn(
                  'px-4 py-2 text-sm font-medium rounded-md transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
                  deviceMode === mode ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800',
                )}
              >
                {mode === 'mobile' ? 'Mobile' : 'Desktop'}
              </button>
            ))}
          </div>
          <Button variant="secondary" size="md" onClick={handleExport}>
            Export JSON
          </Button>
          <Button size="md" className="bg-slate-900 text-white hover:bg-slate-800">
            Send
          </Button>
        </div>
      </div>
      <Dialog.Root open={translateOpen} onOpenChange={setTranslateOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-black/30" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[560px] max-w-[calc(100vw-24px)] -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <Dialog.Title className="text-lg font-semibold text-slate-900">Translate letter</Dialog.Title>
                <Dialog.Description className="mt-1 text-sm text-slate-600">
                  Local model translation (offline after first download).
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
            <div className="mt-4 space-y-3">
              <label className="text-sm font-semibold text-slate-800" htmlFor="translate-language">
                Translate to
              </label>
              <select
                id="translate-language"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                value={targetLanguage}
                onChange={(e) => setTargetLanguage(e.target.value as TranslationLanguage)}
              >
                {translationLanguages.map((lang) => (
                  <option key={lang} value={lang}>
                    {translationLabels[lang]}
                  </option>
                ))}
              </select>
              <div>
                <div className="text-sm font-semibold text-slate-800">Apply translation</div>
                <div className="mt-2 inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
                  {(['replace', 'duplicate'] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setTranslationMode(mode)}
                      className={cn(
                        'rounded-md px-3 py-2 text-xs font-semibold transition',
                        translationMode === mode
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-500 hover:text-slate-800',
                      )}
                    >
                      {mode === 'replace' ? 'Replace current letter' : 'Create a copy'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-500">
                Engine: {localTranslationLabel}. Requires the local model to be available.
              </div>
              {lastEngine && (
                <div className="text-xs text-slate-500">Last run: {lastEngine === 'local' ? 'Local model' : 'Demo'}</div>
              )}
              {translateError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                  {translateError}
                </div>
              )}
            </div>
            <div className="mt-5 flex items-center justify-end gap-2">
              <Dialog.Close asChild>
                <Button variant="outline" size="sm">
                  Cancel
                </Button>
              </Dialog.Close>
              <Button
                variant="secondary"
                size="sm"
                disabled={isTranslating}
                onClick={() => {
                  (async () => {
                    setIsTranslating(true);
                    setTranslateError(null);
                    try {
                      const result = await translateLetterWithEngine(letter, targetLanguage, 'local');
                      setLastEngine(result.engine);
                      if (translationMode === 'duplicate') {
                        const baseName =
                          result.letter.title || draftName || letter.title || 'Untitled';
                        const copyName = `${baseName} (${translationLabels[targetLanguage]})`;
                        const draft = createDraft({ name: copyName, status: 'Draft', json: result.letter });
                        navigate(`/builder/${draft.id}`);
                      } else {
                        setLetter(result.letter);
                        if (result.letter.title) onDraftNameCommit?.(result.letter.title);
                        if (selectedScreenId) selectScreen(selectedScreenId);
                      }
                      setTranslateOpen(false);
                    } catch (err) {
                      setTranslateError(err instanceof Error ? err.message : 'Translation failed. Please try again.');
                    } finally {
                      setIsTranslating(false);
                    }
                  })();
                }}
              >
                {isTranslating ? 'Translating…' : 'Translate'}
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
      <Dialog.Root open={exportOpen} onOpenChange={setExportOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-black/30" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[720px] max-w-[calc(100vw-24px)] -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <Dialog.Title className="text-lg font-semibold text-slate-900">Export JSON</Dialog.Title>
                <Dialog.Description className="mt-1 text-sm text-slate-600">
                  Copy the full JSON for this letter.
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
            <div className="mt-4">
              <textarea
                ref={exportTextareaRef}
                readOnly
                className="h-[45vh] w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 font-mono text-xs text-slate-800 outline-none focus:ring-2 focus:ring-blue-200"
                value={exportJson}
                aria-label="Exported JSON"
              />
            </div>
            <div className="mt-4 flex items-center justify-between">
              <div className="text-xs text-slate-500">
                {copyStatus === 'copied' ? 'Copied.' : copyStatus === 'error' ? 'Copy failed.' : ' '}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    exportTextareaRef.current?.focus();
                    exportTextareaRef.current?.select();
                  }}
                >
                  Select all
                </Button>
                <Button variant="secondary" size="sm" onClick={handleCopyJson}>
                  Copy JSON
                </Button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
