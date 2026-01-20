// AI-AGENT-HEADER
// path: /src/components/RightPanel.tsx
// summary: Right-side properties panel showing basic editing controls for the selected element.
// last-reviewed: 2025-12-10
// line-range: 1-200

import { useEffect, useMemo, useState } from 'react';
import { useEditorStore } from '../store/editorStore';
import type { BaseElement, Screen } from '../types/editor';
import { Button } from './ui/button';
import { FontSelector } from './FontSelector';
import { DesignSuggestionPanel } from './DesignSuggestionPanel';
import { getAccessibleTextColor } from './DesignSuggestionPanel';
import { colorInputValue, normalizeColorValue } from '../lib/color';
import { cn } from '../lib/cn';

function normalizeImageUrl(input: string) {
  const value = input.trim();
  if (!value) return '';
  let url = value;
  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }

  const imgurMatch = url.match(/^https?:\/\/(?:www\.)?imgur\.com\/(gallery\/)?([a-zA-Z0-9]+)(\.[a-zA-Z0-9]+)?$/i);
  if (imgurMatch) {
    const id = imgurMatch[2];
    const ext = imgurMatch[3];
    const safeExt = ext ? ext.toLowerCase() : '.jpg';
    const finalExt = safeExt === '.gifv' ? '.gif' : safeExt;
    return `https://i.imgur.com/${id}${finalExt}`;
  }

  if (url.toLowerCase().endsWith('.gifv')) return url.slice(0, -1); // .gifv -> .gif
  return url;
}

const textTypes = new Set<BaseElement['type']>(['header', 'subheader', 'paragraph', 'button']);
const mediaTypes = new Set<BaseElement['type']>(['image', 'video']);

export function RightPanel() {
  const letter = useEditorStore((state) => state.letter);
  const selectedElementId = useEditorStore((state) => state.selectedElementId);
  const selectedScreenId = useEditorStore((state) => state.selectedScreenId);
  const updateElementStyle = useEditorStore((state) => state.updateElementStyle);
  const removeElement = useEditorStore((state) => state.removeElement);
  const updateElementProps = useEditorStore((state) => state.updateElementProps);
  const ungroupElement = useEditorStore((state) => state.ungroupElement);
  const updateElementContent = useEditorStore((state) => state.updateElementContent);
  const updateScreen = useEditorStore((state) => state.updateScreen);
  const setElementType = useEditorStore((state) => state.setElementType);
  const brand = useEditorStore((state) => state.brand);
  const [showCustomPanel, setShowCustomPanel] = useState(false);
  const [fontSizeInput, setFontSizeInput] = useState<string>('');
  const [fontSizeOpen, setFontSizeOpen] = useState(false);
  const [customBg, setCustomBg] = useState('');
  const [customImage, setCustomImage] = useState('');
  const [overlayColor, setOverlayColor] = useState('#000000');
  const [overlayOpacity, setOverlayOpacity] = useState(0);
  const [customTextColor, setCustomTextColor] = useState('');
  const [customButtonColor, setCustomButtonColor] = useState('');
  const [groupSpacingDraft, setGroupSpacingDraft] = useState<string>('');

  const selectedElement = useMemo(() => {
    if (!selectedElementId) return null;
    for (const screen of letter.screens) {
      const found = screen.elements.find((el) => el.id === selectedElementId);
      if (found) return found;
    }
    return null;
  }, [letter.screens, selectedElementId]);

  const selectedScreen = useMemo(
    () => letter.screens.find((s) => s.id === selectedScreenId),
    [letter.screens, selectedScreenId],
  );
  const screenBackground = selectedScreen?.style?.background ?? '#ffffff';
  const screenTextColor = getAccessibleTextColor(screenBackground, selectedScreen?.style?.textColor);
  const buttonColor =
    selectedScreen?.style?.buttonColor ?? selectedScreen?.style?.accentColor ?? brand?.primaryColor ?? '#111827';

  useEffect(() => {
    if (!selectedScreen) return;
    setCustomBg(selectedScreen.style?.background ?? '');
    setCustomImage(selectedScreen.style?.backgroundImage ?? '');
    setOverlayColor(selectedScreen.style?.backgroundOverlayColor ?? '#000000');
    setOverlayOpacity(selectedScreen.style?.backgroundOverlayOpacity ?? 0);
    setCustomTextColor(selectedScreen.style?.textColor ?? '');
    setCustomButtonColor(selectedScreen.style?.buttonColor ?? '');
    setShowCustomPanel(false);
  }, [selectedScreen?.id]);

  // Sync the font size field when selection changes or its value changes externally.
  useEffect(() => {
    if (!selectedElement || !textTypes.has(selectedElement.type)) {
      setFontSizeInput('');
      return;
    }
    const size = selectedElement.style?.fontSize;
    setFontSizeInput(size !== undefined ? String(size) : '');
  }, [selectedElementId, selectedElement?.type]);

  useEffect(() => {
    if (!selectedElement || selectedElement.type !== 'group') {
      setGroupSpacingDraft('');
      return;
    }
    const props = (selectedElement.props ?? {}) as { spacing?: number };
    const spacing = props.spacing ?? 12;
    setGroupSpacingDraft(String(spacing));
  }, [selectedElementId, selectedElement?.type]);

  const handleFontSizeChange = (value?: number) => {
    if (!selectedElement) return;
    if (!value) {
      updateElementStyle(selectedElement.id, { fontSize: undefined });
    } else {
      updateElementStyle(selectedElement.id, { fontSize: value });
    }
  };

  const renderChoiceControls = () => {
    if (!selectedElement) return null;
    if (!['single-choice', 'multiple-choice', 'ranking'].includes(selectedElement.type)) return null;

    const props = (selectedElement.props ?? {}) as {
      options?: { label?: string }[];
      required?: boolean;
      randomize?: boolean;
      optionFormat?: 'text' | 'media' | 'text-media';
    };
    const options = props.options ?? [{ label: 'Option A' }, { label: 'Option B' }, { label: 'Option C' }];
    const count = options.length;
    const required = props.required ?? false;
    const randomize = props.randomize ?? false;
    const optionFormat = props.optionFormat ?? 'text';
    const isMulti = selectedElement.type === 'multiple-choice';
    const isRanking = selectedElement.type === 'ranking';

    const setOptionsCount = (nextCount: number) => {
      const safe = Math.min(12, Math.max(1, Math.round(nextCount)));
      if (safe === count) return;
      const labelPrefix = isRanking ? 'Item' : 'Option';
      const nextOptions =
        safe > count
          ? [
              ...options,
              ...Array.from({ length: safe - count }, (_, i) => ({ label: `${labelPrefix} ${count + i + 1}` })),
            ]
          : options.slice(0, safe);
      updateElementProps(selectedElement.id, { options: nextOptions });
    };

    const toggleMulti = (next: boolean) => {
      const current = (selectedElement.content ?? '').trim();
      const isDefault =
        current.length === 0 ||
        current === 'Single choice question' ||
        current === 'Multiple choice question';
      setElementType(selectedElement.id, next ? 'multiple-choice' : 'single-choice');
      if (isDefault) {
        updateElementContent(selectedElement.id, next ? 'Multiple choice question' : 'Single choice question');
      }
    };

    return (
      <div className="space-y-3 rounded-lg border border-slate-200 px-3 py-3 shadow-sm">
        <div className="flex items-center justify-between text-sm font-semibold text-slate-800">
          <span>Choices</span>
          <span className="text-sm text-slate-500">
            {isRanking ? 'Ranking' : isMulti ? 'Multiple choice' : 'Single choice'}
          </span>
        </div>

        <div className="space-y-2">
          <div className="text-xs font-semibold text-slate-700">Format</div>
          <div className="grid grid-cols-3 gap-2">
            {(['text', 'media', 'text-media'] as const).map((fmt) => (
              <Button
                key={fmt}
                variant={optionFormat === fmt ? 'secondary' : 'outline'}
                size="sm"
                className="w-full"
                onClick={() => updateElementProps(selectedElement.id, { optionFormat: fmt })}
              >
                {fmt === 'text' ? 'Text' : fmt === 'media' ? 'Media' : 'Text + Media'}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-xs font-semibold text-slate-700">{isRanking ? 'Options' : 'Amount of choices'}</div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-9 w-9"
              onClick={() => setOptionsCount(count - 1)}
              disabled={count <= 1}
            >
              <span className="text-base">−</span>
            </Button>
            <input
              className="h-10 w-16 rounded-md border border-slate-200 text-center text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
              type="number"
              min={1}
              max={12}
              value={count}
              onChange={(e) => setOptionsCount(Number(e.target.value) || count)}
            />
            <Button variant="outline" size="sm" className="h-9 w-9" onClick={() => setOptionsCount(count + 1)}>
              <span className="text-base">+</span>
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-xs font-semibold text-slate-700">Settings</div>
          <div className="space-y-2">
            {!isRanking && (
              <button
                type="button"
                className={cn(
                  'flex w-full items-center justify-between rounded-md border px-3 py-2 text-sm transition hover:border-slate-300',
                  isMulti ? 'border-blue-300 bg-blue-50 text-slate-900' : 'border-slate-200 bg-white text-slate-700',
                )}
                onClick={() => toggleMulti(!isMulti)}
              >
                <span>Multi selection possible</span>
                <span
                  className={cn(
                    'inline-flex h-6 w-10 items-center rounded-full px-1 text-white transition',
                    isMulti ? 'bg-blue-600 justify-end' : 'bg-slate-300 justify-start',
                  )}
                >
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white text-[11px] font-bold text-slate-700">
                    {isMulti ? '✓' : '×'}
                  </span>
                </span>
              </button>
            )}
            <button
              type="button"
              className={cn(
                'flex w-full items-center justify-between rounded-md border px-3 py-2 text-sm transition hover:border-slate-300',
                required ? 'border-blue-300 bg-blue-50 text-slate-900' : 'border-slate-200 bg-white text-slate-700',
              )}
              onClick={() => updateElementProps(selectedElement.id, { required: !required })}
            >
              <span>Required answer</span>
              <span
                className={cn(
                  'inline-flex h-6 w-10 items-center rounded-full px-1 text-white transition',
                  required ? 'bg-blue-600 justify-end' : 'bg-slate-300 justify-start',
                )}
              >
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white text-[11px] font-bold text-slate-700">
                  {required ? '✓' : '×'}
                </span>
              </span>
            </button>
            <button
              type="button"
              className={cn(
                'flex w-full items-center justify-between rounded-md border px-3 py-2 text-sm transition hover:border-slate-300',
                randomize ? 'border-blue-300 bg-blue-50 text-slate-900' : 'border-slate-200 bg-white text-slate-700',
              )}
              onClick={() => updateElementProps(selectedElement.id, { randomize: !randomize })}
            >
              <span>Randomize choices</span>
              <span
                className={cn(
                  'inline-flex h-6 w-10 items-center rounded-full px-1 text-white transition',
                  randomize ? 'bg-blue-600 justify-end' : 'bg-slate-300 justify-start',
                )}
              >
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white text-[11px] font-bold text-slate-700">
                  {randomize ? '✓' : '×'}
                </span>
              </span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderRatingControls = () => {
    if (!selectedElement) return null;
    if (selectedElement.type !== 'rating') return null;
    const props = (selectedElement.props ?? {}) as {
      max?: number;
      required?: boolean;
      scaleType?: 'stars' | 'hearts' | 'numbers';
      minLabel?: string;
      maxLabel?: string;
    };
    const max = Math.max(1, Math.min(10, Number(props.max ?? 5)));
    const required = props.required ?? false;
    const scaleType = props.scaleType ?? 'stars';
    const minLabel = props.minLabel ?? '';
    const maxLabel = props.maxLabel ?? '';

    const setMax = (val: number) => {
      const next = Math.max(1, Math.min(10, Math.round(val)));
      updateElementProps(selectedElement.id, { max: next });
    };

    return (
      <div className="space-y-3 rounded-lg border border-slate-200 px-3 py-3 shadow-sm">
        <div className="text-sm font-semibold text-slate-800">Choices</div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-9 w-9" onClick={() => setMax(max - 1)} disabled={max <= 1}>
            <span className="text-base">−</span>
          </Button>
          <input
            className="h-10 w-16 rounded-md border border-slate-200 text-center text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
            type="number"
            min={1}
            max={10}
            value={max}
            onChange={(e) => setMax(Number(e.target.value) || max)}
          />
          <Button variant="outline" size="sm" className="h-9 w-9" onClick={() => setMax(max + 1)}>
            <span className="text-base">+</span>
          </Button>
          <select
            className="h-10 flex-1 rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
            value={scaleType}
            onChange={(e) =>
              updateElementProps(selectedElement.id, { scaleType: e.target.value as 'stars' | 'hearts' | 'numbers' })
            }
          >
            <option value="stars">Stars</option>
            <option value="hearts">Hearts</option>
            <option value="numbers">Numbers</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <label className="text-xs font-semibold text-slate-700">
            Min label
            <input
              className="mt-1 h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
              type="text"
              value={minLabel}
              placeholder="Not relevant"
              onChange={(e) => updateElementProps(selectedElement.id, { minLabel: e.target.value })}
            />
          </label>
          <label className="text-xs font-semibold text-slate-700">
            Max label
            <input
              className="mt-1 h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
              type="text"
              value={maxLabel}
              placeholder="Very relevant"
              onChange={(e) => updateElementProps(selectedElement.id, { maxLabel: e.target.value })}
            />
          </label>
        </div>
        <div className="space-y-2">
          <div className="text-xs font-semibold text-slate-700">Settings</div>
          <button
            type="button"
            className={cn(
              'flex w-full items-center justify-between rounded-md border px-3 py-2 text-sm transition hover:border-slate-300',
              required ? 'border-blue-300 bg-blue-50 text-slate-900' : 'border-slate-200 bg-white text-slate-700',
            )}
            onClick={() => updateElementProps(selectedElement.id, { required: !required })}
          >
            <span>Required answer</span>
            <span
              className={cn(
                'inline-flex h-6 w-10 items-center rounded-full px-1 text-white transition',
                required ? 'bg-blue-600 justify-end' : 'bg-slate-300 justify-start',
              )}
            >
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white text-[11px] font-bold text-slate-700">
                {required ? '✓' : '×'}
              </span>
            </span>
          </button>
        </div>
      </div>
    );
  };

  const renderDateControls = () => {
    if (!selectedElement) return null;
    if (selectedElement.type !== 'date') return null;
    const props = (selectedElement.props ?? {}) as {
      required?: boolean;
      mode?: 'date' | 'time' | 'datetime';
      placeholder?: string;
    };
    const required = props.required ?? false;
    const mode = props.mode ?? 'date';

    return (
      <div className="space-y-3 rounded-lg border border-slate-200 px-3 py-3 shadow-sm">
        <div className="text-sm font-semibold text-slate-800">Settings</div>
        <div className="space-y-2">
          <div className="text-xs font-semibold text-slate-700">Format</div>
          <select
            className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
            value={mode}
            onChange={(e) =>
              updateElementProps(selectedElement.id, {
                mode: e.target.value as 'date' | 'time' | 'datetime',
              })
            }
          >
            <option value="date">Date</option>
            <option value="time">Time</option>
            <option value="datetime">Date & Time</option>
          </select>
        </div>
        <div className="space-y-2">
          <div className="text-xs font-semibold text-slate-700">Required</div>
          <button
            type="button"
            className={cn(
              'flex w-full items-center justify-between rounded-md border px-3 py-2 text-sm transition hover:border-slate-300',
              required ? 'border-blue-300 bg-blue-50 text-slate-900' : 'border-slate-200 bg-white text-slate-700',
            )}
            onClick={() => updateElementProps(selectedElement.id, { required: !required })}
          >
            <span>Required answer</span>
            <span
              className={cn(
                'inline-flex h-6 w-10 items-center rounded-full px-1 text-white transition',
                required ? 'bg-blue-600 justify-end' : 'bg-slate-300 justify-start',
              )}
            >
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white text-[11px] font-bold text-slate-700">
                {required ? '✓' : '×'}
              </span>
            </span>
          </button>
        </div>
      </div>
    );
  };

  const setScreenStyle = (patch: Partial<NonNullable<Screen['style']>>) => {
    if (!selectedScreen) return;
    updateScreen(selectedScreen.id, {
      style: {
        ...(selectedScreen.style ?? {}),
        ...patch,
      },
    });
  };

  const renderScreenControls = () => {
    if (!selectedScreen || selectedElement) return null;
    const elementSpacing = selectedScreen.style?.elementSpacing ?? 12;
    return (
      <div className="space-y-2">
        <div className="text-[11px] uppercase tracking-wide text-slate-500">Layout</div>
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span>Spacing between elements</span>
            <button
              type="button"
              className="text-[11px] font-semibold text-slate-500 hover:text-slate-800"
              onClick={() => setScreenStyle({ elementSpacing: undefined })}
            >
              Reset
            </button>
          </div>
          <input
            type="number"
            min={0}
            max={120}
            className="h-9 w-full rounded-md border border-slate-200 px-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
            value={elementSpacing}
            onChange={(e) => setScreenStyle({ elementSpacing: Math.max(0, Number(e.target.value) || 0) })}
          />
        </div>
      </div>
    );
  };

  const renderCustomStyleControls = () => {
    if (!selectedScreen || selectedElement) return null;
    const applyLive = (next?: {
      bg?: string;
      image?: string;
      overlayColor?: string;
      overlayOpacity?: number;
      textColor?: string;
      buttonColor?: string;
    }) => {
      const bg = next?.bg ?? customBg;
      const textVal = next?.textColor ?? customTextColor;
      const btnVal = next?.buttonColor ?? customButtonColor;
      const finalBg = bg || selectedScreen.style?.background || '#ffffff';
      const nextText = textVal || getAccessibleTextColor(finalBg, selectedScreen.style?.textColor);
      const nextButton = btnVal || selectedScreen.style?.buttonColor || selectedScreen.style?.accentColor;
      const nextImage = next?.image ?? customImage;
      const variantKey = 'custom';
      setScreenStyle({
        background: bg || undefined,
        backgroundImage: nextImage || undefined,
        backgroundOverlayColor: next?.overlayColor ?? overlayColor,
        backgroundOverlayOpacity: Number.isNaN(next?.overlayOpacity ?? overlayOpacity)
          ? 0
          : next?.overlayOpacity ?? overlayOpacity,
        textColor: nextText,
        buttonColor: nextButton,
        variantKey,
      });
    };

    const resetCustom = () => {
      setCustomBg('');
      setCustomImage('');
      setOverlayColor('#000000');
      setOverlayOpacity(0);
      setCustomTextColor('');
      setCustomButtonColor('');
      setScreenStyle({
        background: undefined,
        backgroundImage: undefined,
        backgroundOverlayColor: undefined,
        backgroundOverlayOpacity: undefined,
        textColor: undefined,
        buttonColor: undefined,
        variantKey: undefined,
      });
    };

    const isCustomSelected = selectedScreen.style?.variantKey === 'custom';

    return (
      <div
        className={cn(
          'space-y-3 rounded-lg border border-slate-200 px-3 py-3 shadow-sm',
          isCustomSelected && 'ring-2 ring-blue-500 border-blue-200',
        )}
      >
        <div className="flex items-center justify-between text-xs text-slate-600">
          <span>Custom background</span>
          <button
            type="button"
            className="text-[11px] font-semibold text-slate-500 hover:text-slate-800"
            onClick={resetCustom}
          >
            Reset
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <label className="text-xs text-slate-600">
            Background
            <div className="mt-1 flex items-center gap-2">
              <input
                className="h-9 w-full rounded-md border border-slate-200 px-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                type="text"
                value={customBg}
                placeholder="#000000"
                onChange={(e) => {
                  setShowCustomPanel(true);
                  const raw = e.target.value;
                  setCustomBg(raw);
                  const normalized = normalizeColorValue(raw);
                  applyLive({ bg: normalized ?? raw });
                }}
              />
              <input
                type="color"
                className="h-9 w-10 cursor-pointer rounded-md border border-slate-200 p-1"
                value={colorInputValue(customBg || '#000000')}
                onChange={(e) => {
                  setShowCustomPanel(true);
                  const raw = e.target.value;
                  setCustomBg(raw);
                  applyLive({ bg: raw });
                }}
              />
            </div>
          </label>
          <label className="text-xs text-slate-600">
            Image URL
            <input
              className="mt-1 h-9 w-full rounded-md border border-slate-200 px-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
              type="text"
              value={customImage}
              placeholder="https://"
              onChange={(e) => {
                setShowCustomPanel(true);
                const normalized = normalizeImageUrl(e.target.value);
                setCustomImage(normalized);
                applyLive({ image: normalized });
              }}
            />
          </label>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <label className="text-xs text-slate-600">
            Overlay color
            <div className="mt-1 flex items-center gap-2">
              <input
                className="h-9 w-full rounded-md border border-slate-200 px-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                type="text"
                value={overlayColor}
                onChange={(e) => {
                  setShowCustomPanel(true);
                  const raw = e.target.value;
                  setOverlayColor(raw);
                  const normalized = normalizeColorValue(raw);
                  applyLive({ overlayColor: normalized ?? raw });
                }}
              />
              <input
                type="color"
                className="h-9 w-10 cursor-pointer rounded-md border border-slate-200 p-1"
                value={colorInputValue(overlayColor)}
                onChange={(e) => {
                  setShowCustomPanel(true);
                  const raw = e.target.value;
                  setOverlayColor(raw);
                  applyLive({ overlayColor: raw });
                }}
              />
            </div>
          </label>
          <label className="text-xs text-slate-600">
            Overlay opacity
            <input
              className="mt-1 h-9 w-full rounded-md border border-slate-200 px-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
              type="range"
              min={0}
              max={0.8}
              step={0.02}
              value={overlayOpacity}
              onChange={(e) => {
                const val = Number(e.target.value);
                setShowCustomPanel(true);
                setOverlayOpacity(val);
                applyLive({ overlayOpacity: val });
              }}
            />
            <div className="text-[11px] text-slate-500">{Math.round((overlayOpacity || 0) * 100)}%</div>
          </label>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <label className="text-xs text-slate-600">
            Text color
            <div className="mt-1 flex items-center gap-2">
              <input
                className="h-9 w-full rounded-md border border-slate-200 px-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                type="text"
                value={customTextColor}
                placeholder="auto"
                onChange={(e) => {
                  setShowCustomPanel(true);
                  const raw = e.target.value;
                  setCustomTextColor(raw);
                  const normalized = normalizeColorValue(raw);
                  applyLive({ textColor: normalized ?? raw });
                }}
              />
              <input
                type="color"
                className="h-9 w-10 cursor-pointer rounded-md border border-slate-200 p-1"
                value={colorInputValue(customTextColor || screenTextColor)}
                onChange={(e) => {
                  setShowCustomPanel(true);
                  const raw = e.target.value;
                  setCustomTextColor(raw);
                  applyLive({ textColor: raw });
                }}
              />
            </div>
          </label>
          <label className="text-xs text-slate-600">
            Button color
            <div className="mt-1 flex items-center gap-2">
              <input
                className="h-9 w-full rounded-md border border-slate-200 px-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                type="text"
                value={customButtonColor}
                placeholder="brand accent"
                onChange={(e) => {
                  setShowCustomPanel(true);
                  const raw = e.target.value;
                  setCustomButtonColor(raw);
                  const normalized = normalizeColorValue(raw);
                  applyLive({ buttonColor: normalized ?? raw });
                }}
              />
              <input
                type="color"
                className="h-9 w-10 cursor-pointer rounded-md border border-slate-200 p-1"
                value={colorInputValue(customButtonColor || buttonColor)}
                onChange={(e) => {
                  setShowCustomPanel(true);
                  const raw = e.target.value;
                  setCustomButtonColor(raw);
                  applyLive({ buttonColor: raw });
                }}
              />
            </div>
          </label>
        </div>
      </div>
    );
  };

  const renderInputControls = () => {
    if (!selectedElement) return null;
    if (selectedElement.type !== 'input' && selectedElement.type !== 'date-input' && selectedElement.type !== 'file')
      return null;
    const props = (selectedElement.props ?? {}) as {
      required?: boolean;
      maxLength?: number;
      maxSizeMb?: number;
      accept?: 'any' | 'images' | 'documents' | 'video' | 'custom';
      customAccept?: string[] | string;
    };
    const required = props.required ?? false;
    const maxLength = props.maxLength;
    const maxSizeMb = props.maxSizeMb ?? 10;
    const accept = props.accept ?? 'any';
    const customAccept = Array.isArray(props.customAccept)
      ? props.customAccept
      : props.customAccept
        ? String(props.customAccept)
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : [];
    const customOptions = [
      { label: 'Images (jpg, jpeg, png, gif, heic, webp, svg)', values: ['.jpg', '.jpeg', '.png', '.gif', '.heic', '.webp', '.svg'] },
      { label: 'Documents (pdf, doc, docx, txt, rtf, odt)', values: ['.pdf', '.doc', '.docx', '.txt', '.rtf', '.odt'] },
      { label: 'Sheets & presentations (xls, xlsx, csv, ppt, pptx, key, ods)', values: ['.xls', '.xlsx', '.csv', '.ppt', '.pptx', '.key', '.ods'] },
      { label: 'Media (mp4, mov, avi, mp3, wav, m4a)', values: ['.mp4', '.mov', '.avi', '.mp3', '.wav', '.m4a'] },
      { label: 'Design & archives (zip, rar, psd, ai, eps)', values: ['.zip', '.rar', '.psd', '.ai', '.eps'] },
    ];

    return (
      <div className="space-y-3 rounded-lg border border-slate-200 px-3 py-3 shadow-sm">
        <div className="text-sm font-semibold text-slate-800">Settings</div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-800">Required</span>
            <button
              type="button"
              className={cn(
                'inline-flex h-6 w-11 items-center rounded-full px-1 text-white transition',
                required ? 'bg-blue-600 justify-end' : 'bg-slate-300 justify-start',
              )}
              onClick={() => updateElementProps(selectedElement.id, { required: !required })}
            >
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white text-[11px] font-bold text-slate-700">
                {required ? '✓' : '×'}
              </span>
            </button>
          </div>

          {selectedElement.type === 'input' ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-800">Max characters</span>
                <button
                  type="button"
                  className={cn(
                    'inline-flex h-6 w-11 items-center rounded-full px-1 text-white transition',
                    maxLength ? 'bg-blue-600 justify-end' : 'bg-slate-300 justify-start',
                  )}
                  onClick={() =>
                    updateElementProps(selectedElement.id, {
                      maxLength: maxLength ? undefined : 120,
                    })
                  }
                >
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white text-[11px] font-bold text-slate-700">
                    {maxLength ? '✓' : '×'}
                  </span>
                </button>
              </div>
              {maxLength ? (
                <input
                  className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                  type="number"
                  min={1}
                  max={500}
                  value={maxLength ?? ''}
                  placeholder="0-999999"
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    updateElementProps(selectedElement.id, {
                      maxLength: Number.isNaN(val) ? undefined : Math.max(1, val),
                    });
                  }}
                />
              ) : null}
            </div>
          ) : selectedElement.type === 'file' ? (
            <div className="space-y-3">
              <div className="space-y-1">
                <span className="text-sm text-slate-800">Max file size (MB)</span>
                <input
                  className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                  type="number"
                  min={1}
                  max={500}
                  value={maxSizeMb}
                  onChange={(e) =>
                    updateElementProps(selectedElement.id, {
                      maxSizeMb: Math.max(1, Number(e.target.value) || 10),
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm font-semibold text-slate-800">
                  <span>Allowed file types</span>
                  {accept === 'custom' && customAccept.length > 0 && (
                    <button
                      type="button"
                      className="text-[11px] font-semibold text-slate-500 hover:text-slate-800"
                      onClick={() => updateElementProps(selectedElement.id, { customAccept: [] })}
                    >
                      Reset
                    </button>
                  )}
                </div>
                <div className="space-y-1">
                  {[
                    { key: 'any' as const, label: 'Any', hint: 'Any file type' },
                    { key: 'images' as const, label: 'Images', hint: 'jpg, png, heic' },
                    { key: 'documents' as const, label: 'Documents', hint: 'pdf, doc, xls' },
                    { key: 'video' as const, label: 'Video', hint: 'mp4, mov' },
                    {
                      key: 'custom' as const,
                      label: 'Custom',
                      hint: customAccept.length ? customAccept.join(', ') : 'Select types',
                    },
                  ].map((opt) => (
                    <div key={opt.key} className="flex items-center gap-3">
                      <Button
                        variant={accept === opt.key ? 'secondary' : 'outline'}
                        size="sm"
                        className="h-11 min-w-[160px] flex-1 justify-start"
                        onClick={() => updateElementProps(selectedElement.id, { accept: opt.key })}
                      >
                        {opt.label}
                      </Button>
                      <span className="flex-1 text-right text-xs text-slate-500 whitespace-pre-line">{opt.hint}</span>
                    </div>
                  ))}
                </div>
                {accept === 'custom' && (
                  <div className="space-y-2 rounded-md border border-slate-200 p-2">
                    <div className="flex items-center justify-between text-xs text-slate-600">
                      <span>Select extensions to allow</span>
                      {customAccept.length > 0 && (
                        <button
                          type="button"
                          className="text-[11px] font-semibold text-slate-500 hover:text-slate-800"
                          onClick={() => updateElementProps(selectedElement.id, { customAccept: [] })}
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <div className="max-h-48 space-y-2 overflow-y-auto">
                      {customOptions.map((group) => (
                        <div key={group.label} className="space-y-1 rounded-md bg-slate-50 p-2">
                          <div className="text-[11px] font-semibold text-slate-600">{group.label}</div>
                          <div className="flex flex-wrap gap-2">
                            {group.values.map((ext) => {
                              const active = customAccept.includes(ext);
                              return (
                                <button
                                  key={ext}
                                  type="button"
                                  className={cn(
                                    'rounded-full border px-2 py-1 text-xs transition',
                                    active
                                      ? 'border-blue-400 bg-blue-50 text-blue-700'
                                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300',
                                  )}
                                  onClick={() => {
                                    const next = active
                                      ? customAccept.filter((v) => v !== ext)
                                      : [...customAccept, ext];
                                    updateElementProps(selectedElement.id, { customAccept: next });
                                  }}
                                >
                                  {ext}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    );
  };

  const renderGroupControls = () => {
    if (!selectedElement || selectedElement.type !== 'group') return null;
    const props = (selectedElement.props ?? {}) as { spacing?: number };
    const spacing = props.spacing ?? 12;
    return (
      <div className="space-y-3 rounded-lg border border-slate-200 px-3 py-3 shadow-sm">
        <div className="flex items-center justify-between text-xs text-slate-600">
          <span>Group settings</span>
          <button
            type="button"
            className="text-[11px] font-semibold text-red-500 hover:text-red-700"
            onClick={() => ungroupElement(selectedElement.id)}
          >
            Ungroup
          </button>
        </div>
        <div className="space-y-2">
          <div className="text-xs text-slate-600">Spacing between items</div>
          <input
            type="text"
            inputMode="numeric"
            className="h-9 w-full rounded-md border border-slate-200 px-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
            value={groupSpacingDraft}
            onChange={(e) => {
              const next = e.target.value;
              if (!/^-?\d*$/.test(next)) return;
              setGroupSpacingDraft(next);
              const asNumber = Number(next);
              if (!Number.isNaN(asNumber) && next !== '' && next !== '-') {
                updateElementProps(selectedElement.id, { spacing: asNumber });
              }
            }}
            onBlur={() => {
              const asNumber = Number(groupSpacingDraft);
              if (!Number.isNaN(asNumber) && groupSpacingDraft !== '' && groupSpacingDraft !== '-') {
                updateElementProps(selectedElement.id, { spacing: asNumber });
                return;
              }
              setGroupSpacingDraft(String(spacing));
            }}
          />
        </div>
      </div>
    );
  };

  const renderTextControls = () => {
    if (!selectedElement || !textTypes.has(selectedElement.type)) return null;
    const fontFamily = selectedElement.style?.fontFamily;
    const color = selectedElement.style?.color ?? '#111827';
    const bold = selectedElement.style?.bold ?? false;
    const italic = selectedElement.style?.italic ?? false;
    const underline = selectedElement.style?.underline ?? false;
    const align = selectedElement.style?.align ?? 'left';

    const setStyle = (patch: Partial<BaseElement['style']>) => {
      updateElementStyle(selectedElement.id, patch);
    };

    const handleReset = () => {
      setStyle({
        fontFamily: undefined,
        fontSize: undefined,
        color: undefined,
        align: 'left',
        bold: false,
        italic: false,
        underline: false,
      });
    };

    return (
      <div className="space-y-4">
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span>Font</span>
            <button
              type="button"
              className="text-[11px] font-semibold text-slate-500 hover:text-slate-800"
              onClick={handleReset}
            >
              Reset
            </button>
          </div>
          <FontSelector
            currentFontFamily={fontFamily}
            onFontChange={(font) => setStyle({ fontFamily: font })}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="text-xs text-slate-600">
            Font size
            <div className="relative mt-1">
              <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-100">
                <input
                  className="h-8 flex-1 bg-transparent text-sm outline-none"
                  type="text"
                  inputMode="numeric"
                  value={fontSizeInput}
                  onChange={(e) => setFontSizeInput(e.target.value)}
                  onBlur={() => {
                    const val = fontSizeInput.trim();
                    const num = Number(val);
                    if (!val || Number.isNaN(num) || num === 0) {
                      handleFontSizeChange(1);
                      setFontSizeInput('1');
                    } else {
                      handleFontSizeChange(num);
                      setFontSizeInput(String(num));
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const val = fontSizeInput.trim();
                      const num = Number(val);
                      if (!val || Number.isNaN(num) || num === 0) {
                        handleFontSizeChange(1);
                        setFontSizeInput('1');
                      } else {
                        handleFontSizeChange(num);
                        setFontSizeInput(String(num));
                      }
                    }
                  }}
                />
                <button
                  type="button"
                  className="flex h-8 w-8 items-center justify-center text-xs text-slate-600 hover:text-slate-900"
                  onClick={() => setFontSizeOpen((o) => !o)}
                >
                  ▾
                </button>
              </div>
              {fontSizeOpen && (
                <div className="absolute left-0 right-0 top-10 z-20 max-h-64 overflow-auto rounded-lg border border-slate-200 bg-white shadow-lg">
                  {[12, 14, 16, 18, 21, 24, 28, 32, 36, 42, 48, 56, 64, 72].map((size) => (
                    <button
                      key={size}
                      type="button"
                      className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
                      onClick={() => {
                        handleFontSizeChange(size);
                        setFontSizeInput(String(size));
                        setFontSizeOpen(false);
                      }}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </label>
          <label className="text-xs text-slate-600">
            Color
            <div className="mt-1 flex items-center gap-2">
              <input
                className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                type="text"
                value={color}
                onChange={(e) => {
                  const raw = e.target.value;
                  const normalized = normalizeColorValue(raw);
                  setStyle({ color: normalized ?? raw });
                }}
              />
              <input
                type="color"
                className="h-10 w-10 cursor-pointer rounded-lg border border-slate-200 p-1"
                value={colorInputValue(color)}
                onChange={(e) => setStyle({ color: e.target.value })}
              />
            </div>
          </label>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span>Alignment</span>
            <button
              type="button"
              className="text-[11px] font-semibold text-slate-500 hover:text-slate-800"
              onClick={() => setStyle({ align: 'left' })}
            >
              Reset
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {(['left', 'center', 'right'] as const).map((option) => (
              <Button
                key={option}
                size="sm"
                variant={align === option ? 'secondary' : 'outline'}
                className="w-full"
                onClick={() => setStyle({ align: option })}
              >
                {option === 'left' ? 'Left' : option === 'center' ? 'Center' : 'Right'}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-1">
          <div className="text-xs text-slate-600">Style</div>
          <div className="grid grid-cols-3 gap-2">
            <Button
              size="sm"
              variant={bold ? 'secondary' : 'outline'}
              className="w-full"
              onClick={() => setStyle({ bold: !bold })}
            >
              Bold
            </Button>
            <Button
              size="sm"
              variant={italic ? 'secondary' : 'outline'}
              className="w-full"
              onClick={() => setStyle({ italic: !italic })}
            >
              Italic
            </Button>
            <Button
              size="sm"
              variant={underline ? 'secondary' : 'outline'}
              className="w-full"
              onClick={() => setStyle({ underline: !underline })}
            >
              Underline
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const renderMediaControls = () => {
    if (!selectedElement || !mediaTypes.has(selectedElement.type)) return null;
    const fit = (selectedElement.props as { fit?: 'contain' | 'cover' } | undefined)?.fit ?? 'contain';
    const aspect = (selectedElement.props as { aspect?: number } | undefined)?.aspect;
    const radius = selectedElement.style?.borderRadius ?? 0;

    const setMediaStyle = (patch: Partial<BaseElement['style']>) => {
      updateElementStyle(selectedElement.id, patch);
    };

    const setMediaProps = (patch: Record<string, unknown>) => {
      updateElementProps(selectedElement.id, patch);
    };

    return (
      <div className="space-y-4">
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span>Fit</span>
            <span className="text-[11px] text-slate-400">{aspect ? `Aspect ${aspect.toFixed(2)}` : 'Auto'}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {(['contain', 'cover'] as const).map((option) => (
              <Button
                key={option}
                size="sm"
                variant={fit === option ? 'secondary' : 'outline'}
                className="w-full"
                onClick={() => setMediaProps({ fit: option })}
              >
                {option === 'contain' ? 'Fit' : 'Fill'}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="text-xs text-slate-600">
            Corner radius
            <input
              className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
              type="number"
              min={0}
              value={radius}
              onChange={(e) => setMediaStyle({ borderRadius: Math.max(0, Number(e.target.value) || 0) })}
            />
          </label>
        </div>
      </div>
    );
  };

  return (
    <aside className="sticky top-[56px] flex h-[calc(100vh-56px)] w-[320px] shrink-0 flex-col overflow-y-auto border-l border-slate-200 bg-white px-4 py-5">
      <div className="flex flex-col gap-5">
        {selectedScreen && !selectedElement && (
          <div className="space-y-3">
            {renderScreenControls()}
            <div className="text-[11px] uppercase tracking-wide text-slate-500">Style collection</div>
            <DesignSuggestionPanel
              activeScreen={selectedScreen}
              brandKit={brand}
              onApplySuggestion={(screen) => {
                if (!selectedScreen) return;
                updateScreen(selectedScreen.id, { style: { ...screen.style, variantKey: screen.style?.variantKey } });
              }}
            />
            <Button
              type="button"
              variant="secondary"
              className={cn(
                'w-full',
                selectedScreen.style?.variantKey === 'custom' && 'border-blue-500 text-blue-700 ring-2 ring-blue-500',
              )}
              onClick={() => setShowCustomPanel((open) => !open)}
            >
              Customize style
            </Button>
            {showCustomPanel ? renderCustomStyleControls() : null}
          </div>
        )}

        {!selectedElement ? null : (
          <div className="flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-wide text-slate-500">Selected</div>
                <div className="text-sm font-semibold capitalize text-slate-800">{selectedElement.type}</div>
              </div>
              <Button variant="ghost" size="sm" className="text-red-600" onClick={() => removeElement(selectedElement.id)}>
                Delete
              </Button>
            </div>
            {renderChoiceControls()}
            {renderRatingControls()}
            {renderDateControls()}
            {renderInputControls()}
            {renderGroupControls()}
            {renderTextControls()}
            {renderMediaControls()}
          </div>
        )}
      </div>
    </aside>
  );
}
