// AI-AGENT-HEADER
// path: /src/components/eletters/CreateEletterModal.tsx
// summary: "Create new" modal offering scratch/template/AI flows.
// last-reviewed: 2025-12-17
// line-range: 1-240

import * as Dialog from '@radix-ui/react-dialog';
import { Button } from '../ui/button';
import { cn } from '../../lib/cn';

type CreateChoice = 'scratch' | 'template' | 'ai';

function ChoiceCard({
  title,
  description,
  onSelect,
  subtle,
}: {
  title: string;
  description: string;
  onSelect: () => void;
  subtle?: string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'group relative w-full rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition',
        'hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-base font-semibold text-slate-900">{title}</div>
          <div className="mt-1 text-sm text-slate-600">{description}</div>
          {subtle && <div className="mt-2 text-xs font-medium text-slate-500">{subtle}</div>}
        </div>
        <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 transition group-hover:bg-white">
          →
        </div>
      </div>
    </button>
  );
}

export function CreateEletterModal({
  open,
  onOpenChange,
  onChoose,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChoose: (choice: CreateChoice) => void;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/30" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[720px] max-w-[calc(100vw-24px)] -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="text-lg font-semibold text-slate-900">What do you want to do?</Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-slate-600">
                Choose how you want to start your new eLetter.
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

          <div className="mt-5 grid grid-cols-1 gap-3">
            <ChoiceCard
              title="Start from scratch"
              description="Begin with a blank page and build with bricks."
              onSelect={() => onChoose('scratch')}
              subtle="Best for full control"
            />
            <ChoiceCard
              title="Use a template"
              description="Pick from your templates or our library."
              onSelect={() => onChoose('template')}
              subtle="Fast start with structure"
            />
            <ChoiceCard
              title="Build with AI"
              description="Describe what you want. AI drafts the eLetter for you."
              onSelect={() => onChoose('ai')}
              subtle="Great for quick prototypes"
            />
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <Dialog.Close asChild>
              <Button variant="ghost" size="md">
                Cancel
              </Button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

