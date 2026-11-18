# Pairwise

Find out which of your brand colors actually work as text.

**[Try it →](https://pairwise-three.vercel.app/)**

---

## Why I built it

I build websites for a living, and almost every project starts with a brand palette that looks great in a style guide. Then I start building and find out the gorgeous peach can't hold body text on anything, the secondary blue only works on white, and nobody checked.

So I made the thing I kept wishing I had. Paste in a palette and you get every text-and-background pairing at once, with the ones that pass WCAG standing out and the ones that don't fading back. Click a pair that fails and Pairwise finds the closest shade that passes.

## What it does

- **Takes your palette however you've got it.** Hex, rgb, hsl, CSS variables, SCSS, JSON, a list copied out of a brand guide. It finds the colors and the names.
- **Checks every pairing.** Every color as text on every other color, against AA Large, AA or AAA.
- **Suggests fixes.** For a pair that fails, it finds the smallest change to the text color that gets it over the line.
- **Exports the palette** as CSS variables, SCSS, Tailwind v4 or JSON, with a readable `on-` text color for every swatch.
- **Shares by link.** The palette lives in the URL, so send it to a client or a designer and they'll see exactly what you see.

The sample palette is Atlanta: Georgia Peach, Red Clay, Kudzu, Sweet Tea, Dogwood and Night Train. Sweet Tea on Dogwood fails, which feels about right.

## How it works

The contrast math follows WCAG 2.2: linearize each RGB channel, weight them by how sensitive our eyes are to red, green and blue, then compare the two luminances. It's all hand-written in [`src/lib/color.ts`](src/lib/color.ts), with no color libraries.

A few decisions I made along the way:

- **Ratios round down, never up.** A pair at 4.499:1 shows as 4.49 and fails. Plenty of contrast checkers round it to 4.5 and call it a pass.
- **Fix suggestions use a binary search.** The tool mixes the text color toward black or white and narrows in on the smallest change that passes, then picks whichever direction changes your color less.
- **Hex without a `#` only counts when it's clearly a value.** Otherwise words like "facade" and "decade" were being read as colors. (Yes, really. There's a test for it now.)
- **The grid has no rating badges.** Cells that miss your target fade back, and the full breakdown is one click away. It reads better with the colors doing the talking.

## Run it locally

```bash
npm install
npm run dev     # start the dev server
npm test        # run the tests
npm run build   # production build
```

Built with React, TypeScript and Vite. Tested with Vitest. Hosted on Vercel.

## What's next

- **Better fix suggestions.** Right now fixes mix colors in sRGB, so a red can drift a little pink on its way lighter. Switching to OKLCH would keep the hue and change only the lightness.
- **Exports for the tools I use every day,** starting with Webflow and Elementor.
- **APCA scores** alongside the WCAG ratio, for a more perceptual read on contrast.

## Known limitations

- Transparency is ignored. Every color is treated as fully opaque.
- A comma-separated list of hex values without `#` won't parse. Add the `#` and it works.
- Editing a swatch rewrites your pasted text as simple `name: #hex` lines.

---

Made with ♥ in Atlanta by [Emily Wilbur](https://www.emilyjwilbur.com).