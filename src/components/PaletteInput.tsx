import type { Swatch } from '../lib/palette';

type Props = {
  text: string;
  swatches: Swatch[];
  onTextChange: (text: string) => void;
  onSwatchChange: (index: number, hex: string) => void;
  onRemove: (index: number) => void;
};

export function PaletteInput({ text, swatches, onTextChange, onSwatchChange, onRemove }: Props) {
  return (
    <section className="panel" aria-labelledby="palette-heading">
      <div className="panel-head">
        <h2 id="palette-heading">Your palette</h2>
        <span className="count">{swatches.length} colors</span>
      </div>

      <label htmlFor="palette-text" className="hint">
        Paste hex, rgb() or hsl() values, one per line. Names, CSS variables, SCSS and JSON all work.
      </label>
      <textarea
        id="palette-text"
        className="palette-text"
        value={text}
        spellCheck={false}
        rows={7}
        onChange={(e) => onTextChange(e.target.value)}
        placeholder={'Navy: #1d3557\n--brand-red: #e63946;\n#f1faee'}
      />

      {swatches.length > 0 && (
        <ul className="swatch-list">
          {swatches.map((s, i) => (
            <li key={`${s.name}-${i}`} className="swatch-row">
              <label className="swatch-chip" style={{ background: s.hex }} title={`Edit ${s.name}`}>
                <input
                  id={`swatch-${i}`}
                  type="color"
                  value={s.hex}
                  onChange={(e) => onSwatchChange(i, e.target.value)}
                  aria-label={`Edit ${s.name}`}
                />
              </label>
              <span className="swatch-name">{s.name}</span>
              <code className="swatch-hex">{s.hex}</code>
              <button className="icon-btn" onClick={() => onRemove(i)} aria-label={`Remove ${s.name}`}>
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
