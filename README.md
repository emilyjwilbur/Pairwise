# Pairwise

Paste a brand palette and see every text-and-background pairing that meets WCAG contrast. Pairwise suggests the closest passing shade for any pair that fails, and exports the palette as CSS variables, SCSS, Tailwind v4 `@theme` tokens or JSON.

## Features

- **Forgiving input.** Paste hex, `rgb()` or `hsl()` values in nearly any format: plain lists, `Name: #hex`, CSS custom properties, SCSS variables or JSON. Names are picked up automatically.
- **Contrast matrix.** Every color is checked against every other one and rated AAA, AA, AA Large or Fail.
- **Fix suggestions.** For a failing pair, Pairwise finds the smallest lightness change that reaches AA and AAA. You can add the result to your palette in one click.
- **Accessible pairings.** For each background, the text colors that pass, sorted from highest contrast down.
- **Export.** Each swatch comes with a matching `--color-on-*` text color.
- **Shareable links.** The palette is stored in the URL hash, so copying the link shares your exact palette.

## Accuracy

Contrast ratios use the WCAG 2.2 relative luminance formula. Displayed ratios are truncated, never rounded, so a 4.499:1 pair never shows as a 4.5:1 pass.

## Stack

React 19, TypeScript, Vite and Vitest. There are no runtime dependencies beyond React. All color math is hand-written in `src/lib/color.ts` and covered by unit tests.

## Development

```bash
npm install
npm run dev      # local dev server
npm test         # unit tests
npm run build    # production build in dist/
```

## Project structure

```
src/
  lib/
    color.ts        parsing, luminance, contrast, ratings, fix suggestions
    palette.ts      palette parsing, naming and URL hash encoding
    exporters.ts    CSS, SCSS, Tailwind and JSON output
    color.test.ts   unit tests
  components/       PaletteInput, Matrix, PairDetail, Pairings, ExportPanel
  App.tsx
```
