import type {
  BoardExercise,
  HandExercise,
  MatchExercise,
  MCExercise,
  NumberExercise,
  OrderExercise,
  PickExercise,
  SortExercise,
} from './types';

export const mc = (prompt: string, options: string[], answer: number | number[], explain: string, extra: Partial<MCExercise> = {}): MCExercise => ({
  type: 'mc',
  prompt,
  options,
  answer,
  explain,
  ...extra,
});

export const tf = (prompt: string, truth: boolean, explain: string, extra: Partial<MCExercise> = {}): MCExercise =>
  mc(prompt, ['True', 'False'], truth ? 0 : 1, explain, { fixedOrder: true, ...extra });

export const num = (prompt: string, answer: number, explain: string, extra: Partial<NumberExercise> = {}): NumberExercise => ({
  type: 'number',
  prompt,
  answer,
  explain,
  ...extra,
});

export const order = (prompt: string, items: string[], explain: string, extra: Partial<OrderExercise> = {}): OrderExercise => ({
  type: 'order',
  prompt,
  items,
  explain,
  ...extra,
});

export const match = (prompt: string, pairs: [string, string][], explain: string): MatchExercise => ({ type: 'match', prompt, pairs, explain });

export const sort = (prompt: string, buckets: string[], items: [string, number][], explain: string): SortExercise => ({
  type: 'sort',
  prompt,
  buckets,
  items: items.map(([text, bucket]) => ({ text, bucket })),
  explain,
});

export const hand = (context: string, cards: string[], answer: 'keep' | 'mulligan', explain: string, prompt = ''): HandExercise => ({
  type: 'hand',
  prompt,
  context,
  hand: cards,
  answer,
  explain,
});

export const pick = (prompt: string, pack: string[], answer: number | number[], explain: string, extra: Partial<PickExercise> = {}): PickExercise => ({
  type: 'pick',
  prompt,
  pack,
  answer,
  explain,
  ...extra,
});

export const board = (b: Omit<BoardExercise, 'type'>): BoardExercise => ({ type: 'board', ...b });

const BASE = 'https://magic.wizards.com/en/articles/archive';
export const src = (title: string, path: string) => ({ title, url: `${BASE}/${path}` });
