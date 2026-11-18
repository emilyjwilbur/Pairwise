// Color math for WCAG 2.x contrast checks.
// All colors are stored internally as normalized 6-digit lowercase hex: "#1a2b3c".

export type RGB = { r: number; g: number; b: number };

export type Rating = 'AAA' | 'AA' | 'AA Large' | 'Fail';

export const THRESHOLDS = {
  AAA: 7,
  AA: 4.5,
  'AA Large': 3,
} as const;

const clamp = (n: number, min = 0, max = 255) => Math.min(max, Math.max(min, n));

/** Normalize "#abc", "abc", "#aabbcc", "#aabbccff" to "#aabbcc". Returns null if invalid. */
export function normalizeHex(input: string): string | null {
  let h = input.trim().replace(/^#/, '').toLowerCase();
  if (/^[0-9a-f]{3,4}$/.test(h)) h = h.slice(0, 3).split('').map((c) => c + c).join('');
  if (/^[0-9a-f]{8}$/.test(h)) h = h.slice(0, 6); // ignore alpha
  if (!/^[0-9a-f]{6}$/.test(h)) return null;
  return `#${h}`;
}

export function hexToRgb(hex: string): RGB {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

export function rgbToHex({ r, g, b }: RGB): string {
  return '#' + [r, g, b].map((c) => Math.round(clamp(c)).toString(16).padStart(2, '0')).join('');
}

function hslToRgb(h: number, s: number, l: number): RGB {
  // h in degrees, s and l in 0–1
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return { r: f(0) * 255, g: f(8) * 255, b: f(4) * 255 };
}

/** Parse any supported CSS color string: hex, rgb()/rgba(), hsl()/hsla(). */
export function parseColor(input: string): string | null {
  const s = input.trim().toLowerCase();

  const hex = normalizeHex(s);
  if (hex) return hex;

  const nums = (str: string) => (str.match(/-?[\d.]+%?/g) ?? []);

  if (s.startsWith('rgb')) {
    const parts = nums(s);
    if (parts.length < 3) return null;
    const [r, g, b] = parts.slice(0, 3).map((p) =>
      p.endsWith('%') ? (parseFloat(p) / 100) * 255 : parseFloat(p),
    );
    if ([r, g, b].some(Number.isNaN)) return null;
    return rgbToHex({ r, g, b });
  }

  if (s.startsWith('hsl')) {
    const [hs, ss, ls] = nums(s);
    if (hs === undefined || ss === undefined || ls === undefined) return null;
    const h = parseFloat(hs);
    const sat = parseFloat(ss) / 100;
    const light = parseFloat(ls) / 100;
    if ([h, sat, light].some(Number.isNaN)) return null;
    return rgbToHex(hslToRgb(((h % 360) + 360) % 360, sat, light));
  }

  return null;
}

/** Relative luminance per WCAG 2.x. */
export function luminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const lin = (c: number) => {
    const v = c / 255;
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/** Contrast ratio between two colors, from 1 to 21. Order doesn't matter. */
export function contrast(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

export function rate(ratio: number): Rating {
  if (ratio >= THRESHOLDS.AAA) return 'AAA';
  if (ratio >= THRESHOLDS.AA) return 'AA';
  if (ratio >= THRESHOLDS['AA Large']) return 'AA Large';
  return 'Fail';
}

/** Ratios are truncated (never rounded up) so 4.499 never displays as a pass. */
export function formatRatio(ratio: number): string {
  return `${(Math.floor(ratio * 100) / 100).toFixed(2)}:1`;
}

/** Linear blend in sRGB. t = 0 returns a, t = 1 returns b. */
export function mix(a: string, b: string, t: number): string {
  const A = hexToRgb(a);
  const B = hexToRgb(b);
  return rgbToHex({
    r: A.r + (B.r - A.r) * t,
    g: A.g + (B.g - A.g) * t,
    b: A.b + (B.b - A.b) * t,
  });
}

export type Fix = { hex: string; ratio: number; direction: 'darker' | 'lighter' };

/**
 * Find the closest shade of `fg` (by mixing toward black or white) that reaches
 * `target` contrast against `bg`. Returns the smallest change that works, or null.
 */
export function suggestFix(fg: string, bg: string, target: number = THRESHOLDS.AA): Fix | null {
  if (contrast(fg, bg) >= target) return null;

  const candidates: Array<Fix & { t: number }> = [];
  for (const [end, direction] of [['#000000', 'darker'], ['#ffffff', 'lighter']] as const) {
    if (contrast(end, bg) < target) continue; // can't get there in this direction
    let lo = 0;
    let hi = 1;
    for (let i = 0; i < 24; i++) {
      const mid = (lo + hi) / 2;
      if (contrast(mix(fg, end, mid), bg) >= target) hi = mid;
      else lo = mid;
    }
    // Rounding to hex can land a hair under target; nudge until it passes.
    let t = hi;
    let hex = mix(fg, end, t);
    while (contrast(hex, bg) < target && t < 1) {
      t = Math.min(1, t + 0.005);
      hex = mix(fg, end, t);
    }
    candidates.push({ hex, ratio: contrast(hex, bg), direction, t });
  }

  if (!candidates.length) return null;
  candidates.sort((a, b) => a.t - b.t);
  const { hex, ratio, direction } = candidates[0];
  return { hex, ratio, direction };
}

/** The candidate with the highest contrast against `bg`. */
export function bestTextColor(bg: string, candidates: string[]): { hex: string; ratio: number } {
  return candidates
    .map((hex) => ({ hex, ratio: contrast(hex, bg) }))
    .sort((a, b) => b.ratio - a.ratio)[0];
}
