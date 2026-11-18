import type { Rating } from './lib/color';
import type { Swatch } from './lib/palette';

export type Level = Exclude<Rating, 'Fail'>;

export type Pair = { fg: Swatch; bg: Swatch };

export type PairResult = Pair & { ratio: number; rating: Rating };
