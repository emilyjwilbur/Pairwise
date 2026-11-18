import { useState } from 'react';
import { exportPalette, FORMAT_LABELS, type ExportFormat } from '../lib/exporters';
import type { Swatch } from '../lib/palette';
import { useCopy } from '../hooks/useCopy';

export function ExportPanel({ swatches }: { swatches: Swatch[] }) {
  const [format, setFormat] = useState<ExportFormat>('css');
  const [includeOn, setIncludeOn] = useState(true);
  const { copied, copy } = useCopy();
  const code = swatches.length ? exportPalette(swatches, format, includeOn) : '';

  return (
    <section className="panel" aria-labelledby="export-heading">
      <div className="panel-head">
        <h2 id="export-heading">Export</h2>
        <button className="btn small" onClick={() => copy(code, 'export')} disabled={!code}>
          {copied === 'export' ? 'Copied' : 'Copy code'}
        </button>
      </div>

      <div className="tabs" role="tablist" aria-label="Export format">
        {(Object.keys(FORMAT_LABELS) as ExportFormat[]).map((f) => (
          <button
            key={f}
            id={`tab-${f}`}
            role="tab"
            aria-selected={format === f}
            className={`tab ${format === f ? 'active' : ''}`}
            onClick={() => setFormat(f)}
          >
            {FORMAT_LABELS[f]}
          </button>
        ))}
      </div>

      <label className="toggle" htmlFor="include-on">
        <input
          id="include-on"
          type="checkbox"
          checked={includeOn}
          onChange={(e) => setIncludeOn(e.target.checked)}
        />
        Include an <code>on-</code> text color for each swatch
      </label>

      <pre className="code" role="tabpanel" aria-labelledby={`tab-${format}`}>
        <code>{code || '/* Add colors to see output */'}</code>
      </pre>
    </section>
  );
}
