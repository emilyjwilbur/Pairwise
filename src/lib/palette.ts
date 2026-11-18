import { parseColor } from './color';

export type Swatch = { name: string; hex: string };

// Matches #hex, bare 6-digit hex, rgb()/rgba(), hsl()/hsla()
const COLOR_RE = /#[0-9a-f]{3,8}\b|\b[0-9a-f]{6}\b|rgba?\([^)]*\)|hsla?\([^)]*\)/gi;

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/^-+|^\$|^@/, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Pull colors (and names, when present) out of whatever the user pastes:
 *   #1d3557
 *   Navy: #1d3557
 *   --brand-navy: #1d3557;
 *   "navy": "#1d3557",
 *   $navy: rgb(29, 53, 87);
 *   #1d3557, #e63946, #f1faee
 */
export function parsePalette(text: string): Swatch[] {
  const out: Swatch[] = [];
  const used = new Map<string, number>();

  const uniqueName = (base: string) => {
    const n = (used.get(base) ?? 0) + 1;
    used.set(base, n);
    return n === 1 ? base : `${base}-${n}`;
  };

  for (const line of text.split(/\r?\n/)) {
    const matches = [...line.matchAll(COLOR_RE)];
    const colors = matches
      .map((m) => parseColor(m[0]))
      .filter((c): c is string => Boolean(c));
    if (!colors.length) continue;

    // A single color on a line: use the rest of the line as its name.
    const label = colors.length === 1 ? slugify(line.replace(COLOR_RE, ' ')) : '';

    for (const hex of colors) {
      if (out.some((s) => s.hex === hex)) continue; // skip duplicates
      out.push({ name: uniqueName(label || `color-${out.length + 1}`), hex });
    }
  }
  return out;
}

export function serializePalette(swatches: Swatch[]): string {
  return swatches.map((s) => `${s.name}: ${s.hex}`).join('\n');
}

/** Compact, shareable form for the URL hash: "navy-1d3557.red-e63946" */
export function encodeHash(swatches: Swatch[]): string {
  return swatches.map((s) => `${s.name}-${s.hex.slice(1)}`).join('.');
}

export function decodeHash(hash: string): Swatch[] {
  return hash
    .replace(/^#/, '')
    .split('.')
    .map((chunk) => {
      const m = chunk.match(/^(.*)-([0-9a-f]{6})$/i);
      return m ? { name: slugify(decodeURIComponent(m[1])) || 'color', hex: `#${m[2].toLowerCase()}` } : null;
    })
    .filter((s): s is Swatch => s !== null);
}
