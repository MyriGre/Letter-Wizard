import { useMemo } from 'react';
import type { Screen, Brand } from '../types/editor';

type Props = {
  activeScreen: Screen;
  brandKit: Brand;
  onApplySuggestion: (screen: Screen) => void;
};

// ---------- Color utilities ----------
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const normalized = hex.replace('#', '');
  const value =
    normalized.length === 3
      ? parseInt(
          normalized
            .split('')
            .map((c) => c + c)
            .join(''),
          16,
        )
      : parseInt(normalized, 16);
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

function luminance(rgb: { r: number; g: number; b: number }) {
  const toLin = (c: number) => {
    const chan = c / 255;
    return chan <= 0.03928 ? chan / 12.92 : Math.pow((chan + 0.055) / 1.055, 2.4);
  };
  const { r, g, b } = rgb;
  return 0.2126 * toLin(r) + 0.7152 * toLin(g) + 0.0722 * toLin(b);
}

function contrastRatio(c1: string, c2: string) {
  const L1 = luminance(hexToRgb(c1));
  const L2 = luminance(hexToRgb(c2));
  const [light, dark] = L1 > L2 ? [L1, L2] : [L2, L1];
  return (light + 0.05) / (dark + 0.05);
}

// Ensures >= 4.5:1. Tries preferred, then white, then black.
function getAccessibleTextColor(bgColor: string, preferredColor?: string) {
  const candidates = [preferredColor, '#FFFFFF', '#000000'].filter(Boolean) as string[];
  for (const candidate of candidates) {
    if (contrastRatio(bgColor, candidate) >= 4.5) return candidate;
  }
  // Fallback: choose best of black/white
  return contrastRatio(bgColor, '#000000') > contrastRatio(bgColor, '#FFFFFF') ? '#000000' : '#FFFFFF';
}

// Lighten toward white
function tintColor(hex: string, amount = 0.9) {
  const { r, g, b } = hexToRgb(hex);
  const mix = (c: number) => Math.round(c + (255 - c) * amount);
  const [nr, ng, nb] = [mix(r), mix(g), mix(b)];
  return `#${[nr, ng, nb]
    .map((c) => c.toString(16).padStart(2, '0'))
    .join('')}`;
}

// ---------- Variations ----------
function buildVariations(screen: Screen, kit: Brand) {
  const primary = kit.primaryColor ?? '#111827';
  const secondary = kit.secondaryColor ?? '#4b5563';
  const subtleBg = '#FFFFFF';
  const balancedBg = tintColor(primary, 0.9);

  const boldText = getAccessibleTextColor(primary, secondary);
  const subtleText = '#111827';
  const balancedText = getAccessibleTextColor(balancedBg, '#111827');
  const balancedAccent = contrastRatio(balancedBg, secondary) >= 3 ? secondary : primary;
  const balancedButton = primary;

  const baseSuggestions = [
    {
      key: 'subtle',
      label: 'Subtle',
      bg: subtleBg,
      text: subtleText,
      accent: primary,
      screen: {
        ...screen,
        style: {
          ...(screen.style || {}),
          background: subtleBg,
          textColor: subtleText,
          accentColor: primary,
          buttonColor: primary,
          variantKey: 'subtle',
        },
      },
    },
    {
      key: 'balanced',
      label: 'Balanced',
      bg: balancedBg,
      text: balancedText,
      accent: balancedAccent,
      screen: {
        ...screen,
        style: {
          ...(screen.style || {}),
          background: balancedBg,
          textColor: balancedText,
          accentColor: balancedAccent,
          buttonColor: balancedButton,
          variantKey: 'balanced',
        },
      },
    },
    {
      key: 'bold',
      label: 'Bold',
      bg: primary,
      text: boldText,
      accent: boldText,
      screen: {
        ...screen,
        style: {
          ...(screen.style || {}),
          background: primary,
          textColor: boldText,
          accentColor: boldText,
          buttonColor: boldText,
          variantKey: 'bold',
        },
      },
    },
  ];

  return baseSuggestions;
}

export function DesignSuggestionPanel({ activeScreen, brandKit, onApplySuggestion }: Props) {
  const suggestions = useMemo(() => buildVariations(activeScreen, brandKit), [activeScreen, brandKit]);

  const activeKey = useMemo(() => {
    const variantKey = activeScreen.style?.variantKey;
    const sameStyle = (current?: Screen['style'], target?: Screen['style']) => {
      const keys: (keyof NonNullable<Screen['style']>)[] = [
        'background',
        'textColor',
        'accentColor',
        'buttonColor',
        'backgroundImage',
        'backgroundOverlayColor',
        'backgroundOverlayOpacity',
        'variantKey',
      ];
      return keys.every((k) => (current?.[k] ?? null) === (target?.[k] ?? null));
    };
    const found = suggestions.find((variant) => sameStyle(activeScreen.style, variant.screen.style))?.key;
    return variantKey ?? found ?? 'subtle';
  }, [activeScreen.style, suggestions]);

  const sampleText = "If you can't say something nice, don't say nothing at all.";

  return (
    <div className="flex flex-col gap-2">
      {suggestions.map((variant) => (
        <button
          key={variant.key}
          type="button"
          onClick={() => onApplySuggestion({ ...variant.screen, style: { ...variant.screen.style, variantKey: variant.key } })}
          className={`w-full overflow-hidden rounded-xl border bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none ${
            activeKey === variant.key ? 'ring-2 ring-blue-500 border-blue-200' : 'border-slate-200'
          }`}
        >
          <div className="flex h-full w-full flex-col gap-3 px-4 py-3">
            <div
              className="relative flex flex-col gap-3 rounded-lg border border-slate-200 px-3 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.3)]"
              style={{ background: variant.bg }}
            >
              <div className="flex items-start justify-between text-xs font-semibold">
                <span className="rounded-full bg-white/80 px-2 py-0.5 text-slate-700">{variant.label}</span>
                {activeKey === variant.key ? (
                  <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[11px] font-semibold text-white">Selected</span>
                ) : null}
              </div>
              <div className="space-y-2">
                <p className="text-sm leading-snug" style={{ color: variant.text }}>
                  {sampleText}
                </p>
                <div className="flex justify-start">
                  <span
                    className="inline-flex items-center justify-center rounded-full px-3 py-1 text-[13px] font-semibold shadow-sm"
                    style={{ background: variant.screen.style?.buttonColor ?? variant.accent, color: getAccessibleTextColor(variant.screen.style?.buttonColor ?? variant.accent, variant.text) }}
                  >
                    Got it
                  </span>
                </div>
              </div>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}

export { getAccessibleTextColor };
