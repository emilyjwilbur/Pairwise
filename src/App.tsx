import { useEffect, useMemo, useState } from 'react';
import { bestTextColor, contrast, rate, THRESHOLDS } from './lib/color';
import { decodeHash, encodeHash, parsePalette, serializePalette, type Swatch } from './lib/palette';
import { PaletteInput } from './components/PaletteInput';
import { Matrix } from './components/Matrix';
import { pairKey } from './lib/pairKey';
import { PairDetail } from './components/PairDetail';
import { Pairings } from './components/Pairings';
import { ExportPanel } from './components/ExportPanel';
import { useCopy } from './hooks/useCopy';
import type { Level, PairResult } from './types';

const SAMPLE = `Georgia Peach: #f4a261
Red Clay: #b5452b
Kudzu: #2f6b3a
Sweet Tea: #c98a2e
Dogwood: #faf3e8
Night Train: #1b1f3b`;

const BLACK: Swatch = { name: 'black', hex: '#000000' };
const WHITE: Swatch = { name: 'white', hex: '#ffffff' };
const LEVELS: Level[] = ['AA Large', 'AA', 'AAA'];

function initialText() {
  const fromHash = decodeHash(window.location.hash);
  return fromHash.length ? serializePalette(fromHash) : SAMPLE;
}

export default function App() {
  const [text, setText] = useState(initialText);
  const [level, setLevel] = useState<Level>('AA');
  const [includeBW, setIncludeBW] = useState(true);
  const [selected, setSelected] = useState<{ fg: string; bg: string } | null>(null);
  const { copied, copy } = useCopy();

  const swatches = useMemo(() => parsePalette(text), [text]);

  // Colors shown in the matrix: the palette, plus black and white if asked and not already present.
  const colors = useMemo(() => {
    if (!includeBW) return swatches;
    const extra = [WHITE, BLACK].filter((c) => !swatches.some((s) => s.hex === c.hex));
    return [...swatches, ...extra];
  }, [swatches, includeBW]);

  const results = useMemo(() => {
    const map = new Map<string, PairResult>();
    for (const bg of colors) {
      for (const fg of colors) {
        if (fg.hex === bg.hex) continue;
        const ratio = contrast(fg.hex, bg.hex);
        map.set(pairKey(fg.hex, bg.hex), { fg, bg, ratio, rating: rate(ratio) });
      }
    }
    return map;
  }, [colors]);

  const all = useMemo(() => [...results.values()], [results]);
  const passing = all.filter((r) => r.ratio >= THRESHOLDS[level]).length;

  // Keep the URL in sync so any palette can be shared as a link.
  useEffect(() => {
    const hash = swatches.length ? `#${encodeHash(swatches)}` : '';
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}${hash}`);
  }, [swatches]);

  // Default selection: the first pair that misses AA (so the fixes show), else the first pair.
  const active =
    (selected && results.get(pairKey(selected.fg, selected.bg))) ||
    all.find((r) => r.ratio < THRESHOLDS.AA && r.ratio >= 2) ||
    all[0];

  const updateSwatches = (next: Swatch[]) => setText(serializePalette(next));

  const select = (fg: Swatch, bg: Swatch) => setSelected({ fg: fg.hex, bg: bg.hex });

  return (
    <div className="app">
      <header className="hero">
        <h1 className="wordmark" aria-label="Pairwise">
          {'Pairwise'.split('').map((ch, i) => {
            const s = swatches.length ? swatches[i % swatches.length] : WHITE;
            const on = bestTextColor(s.hex, ['#000000', '#ffffff', ...swatches.map((x) => x.hex)]).hex;
            return (
              <span key={i} aria-hidden="true" style={{ background: s.hex, color: on }}>
                {ch}
              </span>
            );
          })}
        </h1>
        <p className="lede">
        Find out which of your brand colors actually work as text.
        </p>
      </header>

      <div className="layout">
        <aside className="sidebar">
          <PaletteInput
            text={text}
            swatches={swatches}
            onTextChange={setText}
            onSwatchChange={(i, hex) => updateSwatches(swatches.map((s, j) => (j === i ? { ...s, hex } : s)))}
            onRemove={(i) => updateSwatches(swatches.filter((_, j) => j !== i))}
          />
          <ExportPanel swatches={swatches} />
        </aside>

        <main className="main">
          <div className="toolbar">
            <div className="summary">
              <strong>{passing}</strong> of {all.length} pairings pass {level}
            </div>

            <div className="segmented" role="radiogroup" aria-label="Target level">
              {LEVELS.map((l) => (
                <button
                  key={l}
                  role="radio"
                  aria-checked={level === l}
                  className={level === l ? 'active' : ''}
                  onClick={() => setLevel(l)}
                >
                  {l}
                </button>
              ))}
            </div>

            <label className="toggle" htmlFor="include-bw">
              <input
                id="include-bw"
                type="checkbox"
                checked={includeBW}
                onChange={(e) => setIncludeBW(e.target.checked)}
              />
              Include black and white
            </label>

            <button className="btn" onClick={() => copy(window.location.href, 'link')}>
              {copied === 'link' ? 'Link copied' : 'Copy share link'}
            </button>
          </div>

          {colors.length < 2 ? (
            <section className="panel empty">
              <p>Add at least two colors to compare them.</p>
            </section>
          ) : (
            <>
              <Matrix
                colors={colors}
                results={results}
                level={level}
                selected={active ? { fg: active.fg.hex, bg: active.bg.hex } : null}
                onSelect={select}
              />
              {active && (
                <PairDetail
                  pair={active}
                  canAdd={(hex) => !swatches.some((s) => s.hex === hex)}
                  onAddColor={(name, hex) => {
                    updateSwatches([...swatches, { name, hex }]);
                    setSelected({ fg: hex, bg: active.bg.hex });
                  }}
                />
              )}
              <Pairings backgrounds={colors} results={all} level={level} onSelect={select} />
            </>
          )}
        </main>
      </div>

      <footer className="footer">
  <p>
    Made with <span aria-label="love" role="img">♥</span> in Atlanta, Georgia.
    Design and development by{' '}
    <a href="https://www.emilyjwilbur.com" target="_blank" rel="noopener">
      Emily Wilbur
    </a>
    .
  </p>
</footer>
    </div>
  );
}
