import { describe, expect, it } from 'vitest';
import { contrast, formatRatio, normalizeHex, parseColor, rate, suggestFix } from './color';
import { decodeHash, encodeHash, parsePalette } from './palette';
import { exportPalette } from './exporters';

describe('color parsing', () => {
  it('normalizes hex shorthand and alpha', () => {
    expect(normalizeHex('#ABC')).toBe('#aabbcc');
    expect(normalizeHex('1d3557')).toBe('#1d3557');
    expect(normalizeHex('#1d3557ff')).toBe('#1d3557');
    expect(normalizeHex('#12345')).toBeNull();
  });

  it('parses rgb() and hsl()', () => {
    expect(parseColor('rgb(29, 53, 87)')).toBe('#1d3557');
    expect(parseColor('rgba(255 255 255 / 0.5)')).toBe('#ffffff');
    expect(parseColor('hsl(0, 100%, 50%)')).toBe('#ff0000');
  });
});

describe('contrast', () => {
  it('matches known WCAG values', () => {
    expect(contrast('#000000', '#ffffff')).toBeCloseTo(21, 5);
    expect(contrast('#ffffff', '#ffffff')).toBeCloseTo(1, 5);
    // #767676 on white is the classic "just passes AA" grey
    expect(contrast('#767676', '#ffffff')).toBeGreaterThanOrEqual(4.5);
    expect(contrast('#777777', '#ffffff')).toBeLessThan(4.5);
  });

  it('rates by threshold', () => {
    expect(rate(7)).toBe('AAA');
    expect(rate(4.5)).toBe('AA');
    expect(rate(3)).toBe('AA Large');
    expect(rate(2.99)).toBe('Fail');
  });

  it('never rounds a failing ratio up to a pass', () => {
    expect(formatRatio(4.499)).toBe('4.49:1');
  });
});

describe('suggestFix', () => {
  it('returns null when the pair already passes', () => {
    expect(suggestFix('#000000', '#ffffff')).toBeNull();
  });

  it('finds a shade that passes AA', () => {
    const fix = suggestFix('#e63946', '#f1faee');
    expect(fix).not.toBeNull();
    expect(contrast(fix!.hex, '#f1faee')).toBeGreaterThanOrEqual(4.5);
    expect(fix!.direction).toBe('darker');
  });
});

describe('parsePalette', () => {
  it('does not mistake hex-like words for colors', () => {
    expect(parsePalette('Facade beige: #f5f0e6')).toEqual([
      { name: 'facade-beige', hex: '#f5f0e6' },
    ]);
    expect(parsePalette('Primary for the decade: #1d3557')).toEqual([
      { name: 'primary-for-the-decade', hex: '#1d3557' },
    ]);
  });
  
  it('still accepts bare hex in the value position', () => {
    expect(parsePalette('1d3557')).toEqual([{ name: 'color-1', hex: '#1d3557' }]);
    expect(parsePalette('Facade beige: f5f0e6')).toEqual([
      { name: 'facade-beige', hex: '#f5f0e6' },
    ]);
    expect(parsePalette('"navy": "1d3557",')).toEqual([{ name: 'navy', hex: '#1d3557' }]);
  });
  it('reads names from many formats', () => {
    const text = [
      'Navy: #1d3557',
      '--brand-red: #e63946;',
      '"cream": "#f1faee",',
      '$steel: rgb(69, 123, 157);',
      '#a8dadc',
    ].join('\n');
    expect(parsePalette(text)).toEqual([
      { name: 'navy', hex: '#1d3557' },
      { name: 'brand-red', hex: '#e63946' },
      { name: 'cream', hex: '#f1faee' },
      { name: 'steel', hex: '#457b9d' },
      { name: 'color-5', hex: '#a8dadc' },
    ]);
  });

  it('handles a comma-separated line and skips duplicates', () => {
    expect(parsePalette('#111111, #222222, #111111')).toHaveLength(2);
  });

  it('round-trips through the URL hash', () => {
    const swatches = parsePalette('navy: #1d3557\nbrand-red: #e63946');
    expect(decodeHash(encodeHash(swatches))).toEqual(swatches);
  });
});

describe('exportPalette', () => {
  it('writes CSS variables with readable on-colors', () => {
    const css = exportPalette([{ name: 'navy', hex: '#1d3557' }], 'css');
    expect(css).toContain('--color-navy: #1d3557;');
    expect(css).toContain('--color-on-navy: #ffffff;');
  });
});
