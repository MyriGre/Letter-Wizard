function componentToHex(c: number) {
  const clamped = Math.max(0, Math.min(255, Math.round(c)));
  const hex = clamped.toString(16);
  return hex.length === 1 ? `0${hex}` : hex;
}

function rgbToHex(r: number, g: number, b: number) {
  return `#${componentToHex(r)}${componentToHex(g)}${componentToHex(b)}`;
}

function parseRgbString(value: string): string | null {
  const match = value.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)$/i);
  if (!match) return null;
  const [, rRaw, gRaw, bRaw] = match;
  const r = Number(rRaw);
  const g = Number(gRaw);
  const b = Number(bRaw);
  if ([r, g, b].some((n) => Number.isNaN(n))) return null;
  return rgbToHex(r, g, b);
}

function parseHexString(value: string): string | null {
  const match = value.match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (!match) return null;
  const hex = match[1];
  if (hex.length === 3) {
    return `#${hex
      .split('')
      .map((c) => `${c}${c}`)
      .join('')
      .toLowerCase()}`;
  }
  return `#${hex.toLowerCase()}`;
}

function hsbToHex(h: number, s: number, b: number): string {
  const hue = ((h % 360) + 360) % 360;
  const sat = s > 1 ? s / 100 : s;
  const bri = b > 1 ? b / 100 : b;
  const c = bri * sat;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = bri - c;
  let r = 0;
  let g = 0;
  let bl = 0;

  if (hue < 60) {
    r = c;
    g = x;
    bl = 0;
  } else if (hue < 120) {
    r = x;
    g = c;
    bl = 0;
  } else if (hue < 180) {
    r = 0;
    g = c;
    bl = x;
  } else if (hue < 240) {
    r = 0;
    g = x;
    bl = c;
  } else if (hue < 300) {
    r = x;
    g = 0;
    bl = c;
  } else {
    r = c;
    g = 0;
    bl = x;
  }

  return rgbToHex((r + m) * 255, (g + m) * 255, (bl + m) * 255);
}

let ctx: CanvasRenderingContext2D | null = null;
if (typeof document !== 'undefined') {
  const canvas = document.createElement('canvas');
  ctx = canvas.getContext('2d');
}

/**
 * Normalize a color string into a 6-char hex string (#rrggbb).
 * Supports: hex (#rgb / #rrggbb), rgb()/rgba(), hsl()/hsla(), named CSS colors,
 * and hsb()/hsv() (non-standard but user-friendly).
 */
export function normalizeColorValue(raw: string | undefined | null): string | null {
  if (!raw) return null;
  const value = raw.trim();

  const hex = parseHexString(value);
  if (hex) return hex;

  const hsbMatch = value.match(/^hs[bv]\(\s*([\d.]+)\s*,\s*([\d.]+)%?\s*,\s*([\d.]+)%?\s*\)$/i);
  if (hsbMatch) {
    const [, hRaw, sRaw, bRaw] = hsbMatch;
    const h = Number(hRaw);
    const s = Number(sRaw);
    const b = Number(bRaw);
    if (![h, s, b].some((n) => Number.isNaN(n))) {
      return hsbToHex(h, s, b);
    }
  }

  if (!ctx) return null;
  try {
    ctx.fillStyle = '#000';
    ctx.fillStyle = value;
    const parsed = ctx.fillStyle;
    const rgbHex = parseRgbString(parsed);
    if (rgbHex) return rgbHex;
    const parsedHex = parseHexString(parsed);
    if (parsedHex) return parsedHex;
  } catch {
    return null;
  }

  return null;
}

/**
 * Ensure a valid hex string for <input type="color">.
 */
export function colorInputValue(raw: string | undefined | null, fallback = '#000000'): string {
  return normalizeColorValue(raw) ?? fallback;
}
