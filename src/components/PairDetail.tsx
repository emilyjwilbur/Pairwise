import { formatRatio, suggestFix, THRESHOLDS } from '../lib/color';
import type { PairResult } from '../types';

type Props = {
  pair: PairResult;
  onAddColor: (name: string, hex: string) => void;
  canAdd: (hex: string) => boolean;
};

const CHECKS = [
  { label: 'Body text', level: 'AA', min: 4.5 },
  { label: 'Body text', level: 'AAA', min: 7 },
  { label: 'Large text (24px, or 18.5px bold)', level: 'AA', min: 3 },
  { label: 'Large text', level: 'AAA', min: 4.5 },
  { label: 'Icons, borders and UI parts', level: 'AA', min: 3 },
] as const;

export function PairDetail({ pair, onAddColor, canAdd }: Props) {
  const { fg, bg, ratio } = pair;
  const fixAA = suggestFix(fg.hex, bg.hex, THRESHOLDS.AA);
  const fixAAA = suggestFix(fg.hex, bg.hex, THRESHOLDS.AAA);

  return (
    <section className="panel detail" aria-labelledby="detail-heading" aria-live="polite">
      <div className="panel-head">
        <h2 id="detail-heading">
          <span className="pill" style={{ background: fg.hex }} /> {fg.name} on{' '}
          <span className="pill" style={{ background: bg.hex }} /> {bg.name}
        </h2>
        <span className="ratio-big">{formatRatio(ratio)}</span>
      </div>

      <div className="detail-grid">
        <div className="preview" style={{ background: bg.hex, color: fg.hex }}>
          <p className="preview-eyebrow">Preview</p>
          <p className="preview-title">Large headline text</p>
          <p className="preview-body">
            Body copy at 16px. This is the size most of your site's paragraphs, labels and links will
            use, so it needs at least 4.5:1.
          </p>
          <span className="preview-btn" style={{ borderColor: fg.hex }}>
            Outlined button
          </span>
        </div>

        <ul className="checks">
          {CHECKS.map((c) => {
            const ok = ratio >= c.min;
            return (
              <li key={`${c.label}-${c.level}`} className={ok ? 'ok' : 'no'}>
                <span className="check-mark" aria-hidden="true">{ok ? '✓' : '✕'}</span>
                <span className="check-label">{c.label}</span>
                <span className="check-level">
                  {c.level} · {c.min}:1
                </span>
                <span className="sr-only">{ok ? 'passes' : 'fails'}</span>
              </li>
            );
          })}
        </ul>
      </div>

      {(fixAA || fixAAA) && (
        <div className="fixes">
          <p className="fixes-title">Closest shades of {fg.name} that pass on {bg.name}</p>
          <div className="fix-row">
            {[
              { fix: fixAA, level: 'AA' },
              { fix: fixAAA, level: 'AAA' },
            ].map(({ fix, level }) =>
              fix ? (
                <div className="fix" key={level}>
                  <span className="fix-sample" style={{ background: bg.hex, color: fix.hex }}>
                    Aa
                  </span>
                  <div className="fix-meta">
                    <strong>
                      {level} · {formatRatio(fix.ratio)}
                    </strong>
                    <code>{fix.hex}</code>
                    <span className="hint">{fix.direction}</span>
                  </div>
                  <button
                    className="btn small"
                    disabled={!canAdd(fix.hex)}
                    onClick={() => onAddColor(`${fg.name}-${level.toLowerCase()}`, fix.hex)}
                  >
                    {canAdd(fix.hex) ? 'Add to palette' : 'Added'}
                  </button>
                </div>
              ) : (
                <div className="fix none" key={level}>
                  No shade of {fg.name} reaches {level} on this background.
                </div>
              ),
            )}
          </div>
        </div>
      )}
    </section>
  );
}
