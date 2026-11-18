import { bestTextColor, formatRatio, rate } from './color';
import type { Swatch } from './palette';

export type ExportFormat = 'css' | 'scss' | 'tailwind' | 'json';

export const FORMAT_LABELS: Record<ExportFormat, string> = {
  css: 'CSS variables',
  scss: 'SCSS',
  tailwind: 'Tailwind v4',
  json: 'JSON tokens',
};

/** For each swatch, the most readable text color from the palette plus black and white. */
export function onColors(swatches: Swatch[]) {
  const candidates = [...new Set([...swatches.map((s) => s.hex), '#000000', '#ffffff'])];
  return swatches.map((s) => {
    const best = bestTextColor(s.hex, candidates.filter((c) => c !== s.hex));
    const match = swatches.find((x) => x.hex === best.hex);
    return {
      ...s,
      on: best.hex,
      onName: match?.name ?? (best.hex === '#000000' ? 'black' : 'white'),
      ratio: best.ratio,
      rating: rate(best.ratio),
    };
  });
}

export function exportPalette(swatches: Swatch[], format: ExportFormat, includeOn = true): string {
  const rows = onColors(swatches);
  const note = (r: (typeof rows)[number]) => `${formatRatio(r.ratio)} ${r.rating}`;

  switch (format) {
    case 'css':
    case 'tailwind': {
      const open = format === 'css' ? ':root {' : '@theme {';
      const lines = rows.flatMap((r) => [
        `  --color-${r.name}: ${r.hex};`,
        ...(includeOn ? [`  --color-on-${r.name}: ${r.on}; /* ${note(r)} */`] : []),
      ]);
      return [open, ...lines, '}'].join('\n');
    }
    case 'scss':
      return rows
        .flatMap((r) => [
          `$color-${r.name}: ${r.hex};`,
          ...(includeOn ? [`$color-on-${r.name}: ${r.on}; // ${note(r)}`] : []),
        ])
        .join('\n');
    case 'json': {
      const obj: Record<string, unknown> = {};
      for (const r of rows) {
        obj[r.name] = includeOn
          ? { value: r.hex, on: r.on, contrast: Number(r.ratio.toFixed(2)), rating: r.rating }
          : r.hex;
      }
      return JSON.stringify({ color: obj }, null, 2);
    }
  }
}
