// AI-AGENT-HEADER
// path: /src/components/BrandSheet.tsx
// summary: Sliding drawer for global brand settings (logo, colors, font, theme).
// last-reviewed: 2025-12-08
// line-range: 1-220

import { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Button } from './ui/button';
import { useEditorStore } from '../store/editorStore';
import { colorInputValue, normalizeColorValue } from '../lib/color';

const themes = ['Bold', 'Accent', 'Minimal'] as const;

export function BrandSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const brand = useEditorStore((state) => state.brand);
  const updateBrand = useEditorStore((state) => state.updateBrand);

  const [logoUrl, setLogoUrl] = useState(brand.logoUrl ?? '');
  const [primaryColor, setPrimaryColor] = useState(brand.primaryColor ?? '#2563eb');
  const [secondaryColor, setSecondaryColor] = useState(() => {
    // If it's the old default green color, use the new yellow instead
    return brand.secondaryColor === '#10b981' ? '#FFCA28' : (brand.secondaryColor ?? '#FFCA28');
  });
  const [fontFamily, setFontFamily] = useState(brand.fontFamily ?? 'Inter, system-ui, sans-serif');
  const [theme, setTheme] = useState(brand.theme ?? 'Minimal');

  // Update local state when brand changes, and migrate old green to new yellow
  useEffect(() => {
    if (open) {
      const updatedSecondaryColor = brand.secondaryColor === '#10b981' ? '#FFCA28' : (brand.secondaryColor ?? '#FFCA28');
      setLogoUrl(brand.logoUrl ?? '');
      setPrimaryColor(brand.primaryColor ?? '#2563eb');
      setSecondaryColor(updatedSecondaryColor);
      setFontFamily(brand.fontFamily ?? 'Inter, system-ui, sans-serif');
      setTheme(brand.theme ?? 'Minimal');
      
      // If we detected the old green color, update the brand in the store
      if (brand.secondaryColor === '#10b981') {
        updateBrand({ secondaryColor: '#FFCA28' });
      }
    }
  }, [brand, open, updateBrand]);

  const handleSave = () => {
    updateBrand({
      logoUrl: logoUrl || undefined,
      primaryColor,
      secondaryColor: secondaryColor || undefined,
      fontFamily: fontFamily || undefined,
      theme,
    });
    onOpenChange(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/20" />
        <Dialog.Content className="fixed inset-y-0 right-0 z-50 w-[420px] max-w-full overflow-y-auto border-l border-slate-200 bg-white px-6 py-6 shadow-2xl transition-transform">
          <div className="flex items-start justify-between">
            <div>
              <Dialog.Title className="text-lg font-semibold text-slate-900">Brand</Dialog.Title>
              <Dialog.Description className="text-sm text-slate-600">
                Set global logo, colors, fonts, and theme presets.
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

          <div className="mt-6 space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Logo URL</label>
              <input
                type="text"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://example.com/logo.png"
                className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Primary color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => {
                      const raw = e.target.value;
                      const normalized = normalizeColorValue(raw);
                      setPrimaryColor(normalized ?? raw);
                    }}
                    placeholder="#000000 or rgb() / hsl() / hsb()"
                    className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />
                  <input
                    type="color"
                    value={colorInputValue(primaryColor)}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="h-10 w-12 cursor-pointer rounded-lg border border-slate-200 bg-white p-1"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Secondary color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={secondaryColor}
                    onChange={(e) => {
                      const raw = e.target.value;
                      const normalized = normalizeColorValue(raw);
                      setSecondaryColor(normalized ?? raw);
                    }}
                    placeholder="#000000 or rgb() / hsl() / hsb()"
                    className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />
                  <input
                    type="color"
                    value={colorInputValue(secondaryColor)}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="h-10 w-12 cursor-pointer rounded-lg border border-slate-200 bg-white p-1"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Font family</label>
              <input
                type="text"
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value)}
                placeholder="Inter, system-ui, sans-serif"
                className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
              <p className="text-xs text-slate-500">Use any web-safe or loaded font stack.</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Theme preset</label>
              <div className="grid grid-cols-3 gap-2">
                {themes.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTheme(t)}
                    className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                      theme === t
                        ? 'border-blue-300 bg-blue-50 text-blue-700 shadow-sm'
                        : 'border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Dialog.Close asChild>
              <Button variant="ghost" size="md">
                Cancel
              </Button>
            </Dialog.Close>
            <Button size="md" onClick={handleSave} style={{ backgroundColor: primaryColor }}>
              Save brand
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}



