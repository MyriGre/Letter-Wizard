// AI-AGENT-HEADER
// path: /src/components/FontSelector.tsx
// summary: Font selector dropdown with searchable list of free/open fonts.
// last-reviewed: 2025-12-08
// line-range: 1-150

import { useMemo, useState } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { cn } from '../lib/cn';

// Curated list of free/open fonts (Google Fonts + system fonts)
const FONTS = [
  { name: 'Inter', family: 'Inter, sans-serif', category: 'Sans Serif' },
  { name: 'Roboto', family: 'Roboto, sans-serif', category: 'Sans Serif' },
  { name: 'Open Sans', family: '"Open Sans", sans-serif', category: 'Sans Serif' },
  { name: 'Lato', family: 'Lato, sans-serif', category: 'Sans Serif' },
  { name: 'Montserrat', family: 'Montserrat, sans-serif', category: 'Sans Serif' },
  { name: 'Poppins', family: 'Poppins, sans-serif', category: 'Sans Serif' },
  { name: 'Raleway', family: 'Raleway, sans-serif', category: 'Sans Serif' },
  { name: 'Source Sans Pro', family: '"Source Sans Pro", sans-serif', category: 'Sans Serif' },
  { name: 'Nunito', family: 'Nunito, sans-serif', category: 'Sans Serif' },
  { name: 'Playfair Display', family: '"Playfair Display", serif', category: 'Serif' },
  { name: 'Merriweather', family: 'Merriweather, serif', category: 'Serif' },
  { name: 'Lora', family: 'Lora, serif', category: 'Serif' },
  { name: 'PT Serif', family: '"PT Serif", serif', category: 'Serif' },
  { name: 'Crimson Text', family: '"Crimson Text", serif', category: 'Serif' },
  { name: 'Dancing Script', family: '"Dancing Script", cursive', category: 'Handwriting' },
  { name: 'Pacifico', family: 'Pacifico, cursive', category: 'Handwriting' },
  { name: 'Caveat', family: 'Caveat, cursive', category: 'Handwriting' },
  { name: 'Kalam', family: 'Kalam, cursive', category: 'Handwriting' },
  { name: 'Fira Code', family: '"Fira Code", monospace', category: 'Monospace' },
  { name: 'Roboto Mono', family: '"Roboto Mono", monospace', category: 'Monospace' },
  { name: 'System', family: 'system-ui, -apple-system, sans-serif', category: 'System' },
];

const DEFAULT_FONT = FONTS[0]; // Inter

export function FontSelector({
  currentFontFamily,
  onFontChange,
  portal = true,
}: {
  currentFontFamily?: string;
  onFontChange: (fontFamily: string) => void;
  portal?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const currentFont = FONTS.find((f) => f.family === currentFontFamily) || DEFAULT_FONT;
  const options = useMemo(() => {
    if (!currentFontFamily || FONTS.some((f) => f.family === currentFontFamily)) return FONTS;
    return [{ name: currentFontFamily, family: currentFontFamily, category: 'Custom' }, ...FONTS];
  }, [currentFontFamily]);
  const filteredFonts = options.filter(
    (font) =>
      font.name.toLowerCase().includes(search.toLowerCase()) ||
      font.category.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          className="flex h-10 w-full items-center justify-between rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-800 transition hover:border-slate-300 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
          style={{ fontFamily: currentFont.family }}
        >
          <span>{currentFont.name}</span>
          <span className="text-slate-400">⌄</span>
        </button>
      </Popover.Trigger>
      {portal ? (
        <Popover.Portal>
          <Popover.Content
            className="z-[10000] w-[280px] rounded-lg border border-slate-200 bg-white p-2 shadow-lg"
            sideOffset={5}
          >
            <div className="mb-2">
              <input
                type="text"
                placeholder="Search fonts..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </div>
            <div className="max-h-[300px] overflow-y-auto">
              {filteredFonts.length === 0 ? (
                <div className="py-4 text-center text-sm text-slate-500">No fonts found</div>
              ) : (
                <div className="space-y-0.5">
                  {filteredFonts.map((font) => (
                    <button
                      key={font.family}
                      onClick={() => {
                        onFontChange(font.family);
                        setOpen(false);
                        setSearch('');
                      }}
                      className={cn(
                        'w-full rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-slate-100',
                        currentFont.family === font.family && 'bg-blue-50 text-blue-700',
                      )}
                      style={{ fontFamily: font.family }}
                    >
                      <div className="flex items-center justify-between">
                        <span>{font.name}</span>
                        {currentFont.family === font.family && <span className="text-blue-600">✓</span>}
                      </div>
                      <div className="text-xs text-slate-500">{font.category}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </Popover.Content>
        </Popover.Portal>
      ) : (
        <Popover.Content
          className="z-[10000] w-[280px] rounded-lg border border-slate-200 bg-white p-2 shadow-lg"
          sideOffset={5}
        >
          <div className="mb-2">
            <input
              type="text"
              placeholder="Search fonts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>
          <div className="max-h-[300px] overflow-y-auto">
            {filteredFonts.length === 0 ? (
              <div className="py-4 text-center text-sm text-slate-500">No fonts found</div>
            ) : (
              <div className="space-y-0.5">
                {filteredFonts.map((font) => (
                  <button
                    key={font.family}
                    onClick={() => {
                      onFontChange(font.family);
                      setOpen(false);
                      setSearch('');
                    }}
                    className={cn(
                      'w-full rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-slate-100',
                      currentFont.family === font.family && 'bg-blue-50 text-blue-700',
                    )}
                    style={{ fontFamily: font.family }}
                  >
                    <div className="flex items-center justify-between">
                      <span>{font.name}</span>
                      {currentFont.family === font.family && <span className="text-blue-600">✓</span>}
                    </div>
                    <div className="text-xs text-slate-500">{font.category}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </Popover.Content>
      )}
    </Popover.Root>
  );
}
