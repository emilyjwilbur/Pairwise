import { bestTextColor, THRESHOLDS } from '../lib/color';
import type { Swatch } from '../lib/palette';
import type { Level, PairResult } from '../types';

type Props = {
  backgrounds: Swatch[];
  results: PairResult[];
  level: Level;
  onSelect: (fg: Swatch, bg: Swatch) => void;
};

export function Pairings({ backgrounds, results, level, onSelect }: Props) {
  const min = THRESHOLDS[level];

  return (
    <section className="panel" aria-labelledby="pairings-heading">
      <div className="panel-head">
        <h2 id="pairings-heading">Accessible pairings</h2>
        <span className="hint">Text colors that pass {level} on each background, best first.</span>
      </div>

      <div className="pairings">
        {backgrounds.map((bg) => {
          const passing = results
            .filter((r) => r.bg.hex === bg.hex && r.ratio >= min)
            .sort((a, b) => b.ratio - a.ratio);
          return (
            <div
              key={bg.hex}
              className="pairing-card"
              style={{ background: bg.hex, color: bestTextColor(bg.hex, ['#000000', '#ffffff']).hex }}
            >
              <p className="pairing-bg">
                <span>{bg.name}</span>
                <code>{bg.hex}</code>
              </p>
              {passing.length ? (
                <ul className="pairing-list">
                  {passing.map((r) => (
                    <li key={r.fg.hex}>
                      <button
                        className="pairing-chip"
                        style={{ color: r.fg.hex, borderColor: r.fg.hex }}
                        onClick={() => onSelect(r.fg, bg)}
                      >
                        {r.fg.name} <span>{(Math.floor(r.ratio * 10) / 10).toFixed(1)}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="pairing-empty">No text color passes {level} here.</p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
