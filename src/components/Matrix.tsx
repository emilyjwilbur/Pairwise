import { formatRatio, THRESHOLDS } from '../lib/color';
import type { Swatch } from '../lib/palette';
import type { Level, PairResult } from '../types';

type Props = {
  colors: Swatch[];
  results: Map<string, PairResult>;
  level: Level;
  selected: { fg: string; bg: string } | null;
  onSelect: (fg: Swatch, bg: Swatch) => void;
};

import { pairKey } from '../lib/pairKey';

export function Matrix({ colors, results, level, selected, onSelect }: Props) {
  return (
    <section className="panel" aria-labelledby="matrix-heading">
      <div className="panel-head">
        <h2 id="matrix-heading">Contrast matrix</h2>
        <span className="hint">Rows are backgrounds, columns are text. Select a cell for details.</span>
      </div>

      <div className="matrix-scroll">
        <table className="matrix">
          <thead>
            <tr>
              <th scope="col" className="corner">
                <span>text →</span>
                <span>bg ↓</span>
              </th>
              {colors.map((fg) => (
                <th key={fg.hex} scope="col">
                  <span className="dot" style={{ background: fg.hex }} />
                  {fg.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {colors.map((bg) => (
              <tr key={bg.hex}>
                <th scope="row">
                  <span className="dot" style={{ background: bg.hex }} />
                  {bg.name}
                </th>
                {colors.map((fg) => {
                  if (fg.hex === bg.hex) {
                    return <td key={fg.hex} className="cell-self" aria-label="Same color" />;
                  }
                  const r = results.get(pairKey(fg.hex, bg.hex))!;
                  const passes = r.ratio >= THRESHOLDS[level];
                  const isSelected = selected?.fg === fg.hex && selected?.bg === bg.hex;
                  return (
                    <td key={fg.hex}>
                      <button
                        className={`cell ${passes ? 'pass' : 'fail'} ${isSelected ? 'selected' : ''}`}
                        style={{ background: bg.hex, color: fg.hex }}
                        onClick={() => onSelect(fg, bg)}
                        aria-pressed={isSelected}
                        aria-label={`${fg.name} text on ${bg.name}: ${formatRatio(r.ratio)}, ${r.rating}`}
                      >
                        <span className="cell-aa">Aa</span>
                        <span className="cell-ratio">{(Math.floor(r.ratio * 10) / 10).toFixed(1)}</span>
                        <span className={`badge badge-${r.rating.replace(' ', '-').toLowerCase()}`}>
                          {r.rating === 'AA Large' ? 'AA18' : r.rating}
                        </span>
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
