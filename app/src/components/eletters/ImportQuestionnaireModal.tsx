// AI-AGENT-HEADER
// path: /src/components/eletters/ImportQuestionnaireModal.tsx
// summary: Modal to upload an existing questionnaire file and start a draft.
// last-reviewed: 2026-01-12
// line-range: 1-220

import * as Dialog from '@radix-ui/react-dialog';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '../ui/button';
import { cn } from '../../lib/cn';

const ACCEPT_LABEL = 'PDF, DOCX, JPG, or PNG';

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
  onImport: (file: File) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

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

  const fileMeta = useMemo(() => {
    if (!file) return null;
    return {
      name: file.name,
      size: formatBytes(file.size),
    };
  }, [file]);

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
                  disabled={!file}
                  onClick={() => {
                    if (!file) return;
                    onImport(file);
                    onOpenChange(false);
                  }}
                >
                  Import
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

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                  We will detect questions and create a draft you can review. If parsing fails, you can still continue
                  with a blank draft and edit manually.
                </div>
              </div>

              <div className="flex min-h-0 flex-col bg-slate-50 p-5">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-slate-700">Preview</div>
                  {fileMeta && <div className="text-xs text-slate-500">File preview</div>}
                </div>
                <div className="mt-3 flex min-h-0 flex-1 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white p-4">
                  {!file && <div className="text-sm text-slate-500">Upload a file to see a preview.</div>}
                  {file && previewUrl && file.type.startsWith('image/') && (
                    <img
                      src={previewUrl}
                      alt="Questionnaire preview"
                      className="max-h-full w-auto rounded-xl object-contain"
                    />
                  )}
                  {file && previewUrl && file.type === 'application/pdf' && (
                    <iframe
                      title="Questionnaire preview"
                      src={previewUrl}
                      className="h-full w-full rounded-xl"
                    />
                  )}
                  {file && (!previewUrl || (!file.type.startsWith('image/') && file.type !== 'application/pdf')) && (
                    <div className="text-center text-sm text-slate-500">
                      Preview not available for this file type yet.
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
