import { CARD_LIST, getCard } from '../engine/cardpool';
import type { BoardSpec } from '../engine/puzzle';
import type { Exercise, Teach } from './types';

// Finds card names in lesson and question text, so the UI can highlight them and show the card.
// Full names always match ("Grizzly Cub", plurals like "Forests"). Short names ("the Cub",
// "Shambler") match only when the full card is part of the same question, and only when no
// other card in that question shares the short name.

const NAMES = CARD_LIST.map((c) => c.name);
/** Non-creature cards whose last word is a specific enough short name. */
const SPELL_ALIASES = new Set(['Jolt', 'Lance', 'Charm', 'Edge', 'Coat', 'Horn', 'Surge', 'Vault', 'Falls', 'Foundry']);

function aliasOf(name: string): string | undefined {
  const def = getCard(name);
  const words = name.split(' ');
  if (def.token || words.length < 2) return undefined;
  const last = words[words.length - 1];
  return def.types.includes('creature') || SPELL_ALIASES.has(last) ? last : undefined;
}

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/'/g, "['’]");

export interface Matcher {
  re: RegExp;
  /** Matched text (straight apostrophes) → card name. */
  lookup: Map<string, string>;
}

const cache = new Map<string, Matcher>();

export function mentionMatcher(scope: readonly string[] = []): Matcher {
  const key = scope.join('|');
  const hit = cache.get(key);
  if (hit) return hit;
  const lookup = new Map(NAMES.map((n) => [n, n]));
  const byAlias = new Map<string, Set<string>>();
  for (const n of scope) {
    const a = aliasOf(n);
    if (a) byAlias.set(a, (byAlias.get(a) ?? new Set()).add(n));
  }
  for (const [a, ns] of byAlias) if (ns.size === 1 && !lookup.has(a)) lookup.set(a, [...ns][0]);
  const alts = [...lookup.keys()].sort((a, b) => b.length - a.length).map(esc);
  // Optional plural; not part of a longer word; "Goblin tokens" is not "Ember Goblin".
  const re = new RegExp(`(?<![\\w'’-])(${alts.join('|')})(?:e?s)?(?![\\w-])(?! [Tt]okens?\\b)`, 'g');
  const m = { re, lookup };
  cache.set(key, m);
  return m;
}

/** Card names mentioned in a text, in order of first mention. */
export function cardMentions(text: string, scope: readonly string[] = []): string[] {
  const { re, lookup } = mentionMatcher(scope);
  const out: string[] = [];
  for (const m of text.matchAll(re)) {
    const name = lookup.get(m[1].replace(/’/g, "'"))!;
    if (!out.includes(name)) out.push(name);
  }
  return out;
}

const uniq = (xs: string[]) => [...new Set(xs)];
/** Everyone knows what a basic land does, so text mentions of one get a preview but no extra card. */
const isBasic = (name: string) => !!getCard(name).subtypes?.includes('Basic');

function boardCards(b: BoardSpec, showHand: boolean): string[] {
  return [...(b.battlefield ?? []).map((e) => (typeof e === 'string' ? e : e.card)), ...(showHand ? b.hand ?? [] : [])];
}

/** Cards the question already shows as a card or a board tile. */
export function shownCards(ex: Exercise): string[] {
  const out = [...(ex.cards ?? [])];
  if (ex.scene) out.push(...boardCards(ex.scene.you, true), ...boardCards(ex.scene.opp, !!ex.scene.opp.revealHand));
  if (ex.type === 'hand') out.push(...ex.hand);
  if (ex.type === 'pick') out.push(...ex.pack);
  if (ex.type === 'board') out.push(...boardCards(ex.puzzle.you, true), ...boardCards(ex.puzzle.opp, !!ex.puzzle.opp.revealHand));
  return uniq(out);
}

/** Text the player reads before answering. */
function questionTexts(ex: Exercise): string[] {
  const out = [ex.prompt];
  if (ex.type === 'mc') out.push(...ex.options);
  if (ex.type === 'order') out.push(...ex.items);
  if (ex.type === 'sort') out.push(...ex.items.map((i) => i.text));
  if (ex.type === 'match') out.push(...ex.pairs.flat());
  if (ex.type === 'hand' || ex.type === 'pick') out.push(ex.context ?? '');
  if (ex.type === 'board') out.push(ex.goalText);
  return out;
}

/** Text shown after answering, or on request. */
function laterTexts(ex: Exercise): string[] {
  const out = [ex.explain, ex.scene?.note ?? ''];
  if (ex.type === 'mc' || ex.type === 'pick') out.push(...ex.notes?.filter((n): n is string => !!n) ?? []);
  if (ex.type === 'board') out.push(ex.hint, ex.solutionText);
  return out;
}

/** Every card the exercise is about. Short names in its text resolve against these. */
export function exerciseScope(ex: Exercise): string[] {
  return uniq([...shownCards(ex), ...[...questionTexts(ex), ...laterTexts(ex)].flatMap((t) => cardMentions(t))]);
}

/** Cards the question names but doesn't show yet (except basic lands). The UI shows these under the prompt. */
export function unshownQuestionCards(ex: Exercise): string[] {
  const shown = shownCards(ex);
  const scope = exerciseScope(ex);
  return uniq(questionTexts(ex).flatMap((t) => cardMentions(t, scope))).filter((c) => !shown.includes(c) && !isBasic(c));
}

export function teachScope(t: Teach): string[] {
  return uniq([...(t.cards ?? []), ...(t.scene ? [...boardCards(t.scene.you, true), ...boardCards(t.scene.opp, false)] : []), ...cardMentions(t.body)]);
}

/** Cards a teaching card shows in its card row: its own, plus any the text names that aren't on its board. */
export function teachCardRow(t: Teach): string[] {
  const onBoard = t.scene ? [...boardCards(t.scene.you, true), ...boardCards(t.scene.opp, false)] : [];
  return uniq([...(t.cards ?? []), ...cardMentions(t.body, teachScope(t)).filter((c) => !onBoard.includes(c) && !isBasic(c))]);
}
