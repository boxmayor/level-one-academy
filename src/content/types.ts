import type { BoardSpec, PuzzleSpec, ScriptAction } from '../engine/puzzle';

/** A static board picture shown with a question or a teaching card. */
export interface Scene {
  you: BoardSpec;
  opp: BoardSpec;
  note?: string;
}

interface Base {
  /** Set automatically: `${lessonId}:${index}` */
  id?: string;
  prompt: string;
  /** Shown after the answer is checked. */
  explain: string;
  scene?: Scene;
  /** A row of cards to show with the question. */
  cards?: string[];
}

export interface MCExercise extends Base {
  type: 'mc';
  options: string[];
  /** Keep the authored option order (otherwise options are shuffled). */
  fixedOrder?: boolean;
  /** Index of the right option, or several for "select all that apply". */
  answer: number | number[];
  /** Optional note per option, shown when that option was picked. */
  notes?: (string | undefined)[];
}

export interface NumberExercise extends Base {
  type: 'number';
  answer: number;
  /** Accept anything from min to max (inclusive). Defaults to exactly `answer`. */
  min?: number;
  max?: number;
  unit?: string;
}

export interface OrderExercise extends Base {
  type: 'order';
  /** Items in the correct order. The UI shuffles them. */
  items: string[];
}

export interface MatchExercise extends Base {
  type: 'match';
  pairs: [string, string][];
}

export interface SortExercise extends Base {
  type: 'sort';
  buckets: string[];
  items: { text: string; bucket: number }[];
}

export interface BoardExercise extends Base {
  type: 'board';
  puzzle: PuzzleSpec;
  goalText: string;
  hint: string;
  solution: ScriptAction[];
  solutionText: string;
  /** Puzzle-trainer rating (like chess puzzle ratings). */
  rating: number;
  themes: string[];
  /** Tempting wrong lines; the test suite checks that each one fails. */
  refute?: ScriptAction[][];
}

export interface HandExercise extends Base {
  type: 'hand';
  /** Deck, matchup and play/draw. */
  context: string;
  hand: string[];
  answer: 'keep' | 'mulligan';
}

export interface PickExercise extends Base {
  type: 'pick';
  context?: string;
  pack: string[];
  answer: number | number[];
  notes?: (string | undefined)[];
}

export type Exercise = MCExercise | NumberExercise | OrderExercise | MatchExercise | SortExercise | BoardExercise | HandExercise | PickExercise;

export interface Teach {
  title: string;
  /** Light markdown: **bold**, *italic*, "- " bullets, blank line = paragraph, {G} mana symbols. */
  body: string;
  scene?: Scene;
  cards?: string[];
}

export interface Lesson {
  id: string;
  title: string;
  icon: string;
  source: { title: string; url: string };
  teach: Teach[];
  exercises: Exercise[];
  takeaways: string[];
  /** Glossary terms this lesson introduces (added to review). */
  terms?: string[];
}

export interface Unit {
  id: string;
  title: string;
  subtitle: string;
  color: string;
  lessons: Lesson[];
  optional?: boolean;
}
