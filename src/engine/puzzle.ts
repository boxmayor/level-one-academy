import { runAI, type AIPolicy } from './ai';
import { getCard } from './cardpool';
import {
  activate,
  castSpell,
  creatures,
  declareAttackers,
  declareBlockers,
  emptyState,
  findPerm,
  goToCombat,
  log,
  makePermanent,
  newUid,
  pass,
  playLand,
  startTurn,
  tapForMana,
} from './game';
import { other, type GameState, type ManaSym, type Side, type TargetRef } from './types';

// ---------------------------------------------------------------------------
// Puzzle specs

export interface PermSpec {
  card: string;
  tapped?: boolean;
  sick?: boolean;
  counters?: number;
  damage?: number;
}

export interface BoardSpec {
  life?: number;
  battlefield?: (string | PermSpec)[];
  hand?: string[];
  library?: string[];
  graveyard?: string[];
  /** Show the opponent's hand face up (default: hidden). */
  revealHand?: boolean;
}

export type Goal =
  | { type: 'win' }
  | { type: 'survive' }
  | { type: 'all'; goals: Goal[] }
  | { type: 'any'; goals: Goal[] }
  | { type: 'oppLifeAtMost'; n: number }
  | { type: 'lifeAtLeast'; n: number }
  | { type: 'alive'; card: string; side?: Side; count?: number }
  | { type: 'gone'; card: string; side?: Side }
  | { type: 'oppCreaturesAtMost'; n: number }
  | { type: 'creaturesAtLeast'; n: number }
  | { type: 'handAtLeast'; n: number }
  | { type: 'notCast'; card: string }
  | { type: 'cast'; card: string }
  | { type: 'inHand'; card: string }
  | { type: 'custom'; test: (s: GameState) => boolean };

export type StartPoint = 'yourMain1' | 'yourCombat' | 'oppMain1' | 'oppAttack';

export interface PuzzleSpec {
  you: BoardSpec;
  opp: BoardSpec;
  start?: StartPoint;
  /** After your turn ends, the opponent takes a turn and attacks. */
  continueToOppTurn?: boolean;
  ai?: AIPolicy;
  goal: Goal;
  turn?: number;
  /** Spells the opponent casts as the puzzle starts (they wait on the stack for your response). */
  oppCasts?: OppCast[];
  /** Spells the opponent casts at the start of its next turn (with continueToOppTurn). */
  oppTurnCasts?: OppCast[];
}

export interface OppCast {
  card: string;
  /** 'you', 'opp', or a permanent name (prefix with you:/opp:). */
  target?: string;
}

function castForOpp(s0: GameState, list: OppCast[] | undefined): GameState {
  let s = s0;
  for (const oc of list ?? []) {
    const card = s.players.opp.hand.find((c) => c.name === oc.card);
    if (!card) throw new Error(`Opponent has no ${oc.card} in hand`);
    s = { ...s, priority: 'opp', passes: 0 };
    s = castSpell(s, 'opp', card.uid, { target: resolveTargetRef(s, oc.target) });
  }
  return s;
}

// ---------------------------------------------------------------------------
// Setup

export function setupPuzzle(spec: PuzzleSpec): GameState {
  const s = emptyState();
  s.turn = spec.turn ?? 5;
  for (const side of ['you', 'opp'] as Side[]) {
    const b = side === 'you' ? spec.you : spec.opp;
    const pl = s.players[side];
    pl.life = b.life ?? 20;
    pl.hiddenHand = side === 'opp' && !b.revealHand;
    for (const name of b.hand ?? []) pl.hand.push({ uid: newUid(s, 'h'), name: check(name) });
    for (const name of b.library ?? []) pl.library.push({ uid: newUid(s, 'l'), name: check(name) });
    for (const name of b.graveyard ?? []) pl.graveyard.push({ uid: newUid(s, 'g'), name: check(name) });
    for (const e of b.battlefield ?? []) {
      const ps: PermSpec = typeof e === 'string' ? { card: e } : e;
      const p = makePermanent(s, check(ps.card), side, { tapped: ps.tapped ?? false, sick: ps.sick ?? false, counters: ps.counters ?? 0 });
      p.damage = ps.damage ?? 0;
      if (getCard(ps.card).token) p.token = true;
    }
  }
  const start = spec.start ?? 'yourMain1';
  if (start === 'yourMain1' || start === 'yourCombat') {
    s.active = 'you';
    s.step = 'main1';
    s.priority = 'you';
  } else {
    s.active = 'opp';
    s.step = start === 'oppAttack' ? 'attackers' : 'main1';
    s.priority = 'opp';
    log(s, 'game', "It's the opponent's turn.");
  }
  let out = s;
  if (start === 'yourCombat') out = goToCombat(out);
  if (spec.oppCasts?.length) return castForOpp(out, spec.oppCasts);
  return runAI(out, spec.ai);
}

function check(name: string): string {
  getCard(name);
  return name;
}

// ---------------------------------------------------------------------------
// Goals and status

function countNamed(s: GameState, name: string, side: Side) {
  return s.battlefield.filter((p) => p.name === name && p.controller === side).length;
}

export function goalMet(g: Goal, s: GameState): boolean {
  switch (g.type) {
    case 'win':
      return s.winner === 'you';
    case 'survive':
      return s.winner !== 'opp' && s.winner !== 'draw' && s.players.you.life > 0;
    case 'all':
      return g.goals.every((x) => goalMet(x, s));
    case 'any':
      return g.goals.some((x) => goalMet(x, s));
    case 'oppLifeAtMost':
      return s.players.opp.life <= g.n;
    case 'lifeAtLeast':
      return s.players.you.life >= g.n;
    case 'alive':
      return countNamed(s, g.card, g.side ?? 'you') >= (g.count ?? 1);
    case 'gone':
      return countNamed(s, g.card, g.side ?? 'opp') === 0;
    case 'oppCreaturesAtMost':
      return creatures(s, 'opp').length <= g.n;
    case 'creaturesAtLeast':
      return creatures(s, 'you').length >= g.n;
    case 'handAtLeast':
      return s.players.you.hand.length >= g.n;
    case 'notCast':
      return !s.events.cast.some((c) => c.controller === 'you' && c.name === g.card);
    case 'cast':
      return s.events.cast.some((c) => c.controller === 'you' && c.name === g.card);
    case 'inHand':
      return s.players.you.hand.some((c) => c.name === g.card);
    case 'custom':
      return g.test(s);
  }
}

export type PuzzleStatus = 'playing' | 'success' | 'fail';

export function isTerminal(spec: PuzzleSpec, s: GameState): boolean {
  if (s.winner) return true;
  if (s.step !== 'end') return false;
  const oppTurnPuzzle = spec.start === 'oppMain1' || spec.start === 'oppAttack';
  if (oppTurnPuzzle) return s.active === 'opp';
  return s.active === 'opp' || !spec.continueToOppTurn;
}

export function puzzleStatus(spec: PuzzleSpec, s: GameState): PuzzleStatus {
  if (s.winner === 'opp' || s.winner === 'draw') return 'fail';
  if (s.winner === 'you') return goalMet(spec.goal, s) ? 'success' : 'fail';
  if (!isTerminal(spec, s)) return 'playing';
  return goalMet(spec.goal, s) ? 'success' : 'fail';
}

// ---------------------------------------------------------------------------
// User actions

export type UserAction =
  | { type: 'playLand'; uid: string }
  | { type: 'cast'; uid: string; target?: TargetRef; mode?: number; x?: number }
  | { type: 'activate'; uid: string; index: number; target?: TargetRef; x?: number }
  | { type: 'tapMana'; uid: string; sym?: ManaSym }
  | { type: 'toCombat' }
  | { type: 'attack'; uids: string[] }
  | { type: 'block'; blocks: Record<string, string> }
  | { type: 'pass' }
  | { type: 'endTurn' };

/** Apply a user action, then let the AI act and move the turn along until you have a decision. */
export function applyUserAction(spec: PuzzleSpec, s0: GameState, a: UserAction): GameState {
  let s = s0;
  switch (a.type) {
    case 'playLand':
      s = playLand(s, 'you', a.uid);
      break;
    case 'cast':
      s = castSpell(s, 'you', a.uid, { target: a.target, mode: a.mode, x: a.x });
      break;
    case 'activate':
      s = activate(s, 'you', a.uid, a.index, { target: a.target, x: a.x });
      break;
    case 'tapMana':
      s = tapForMana(s, 'you', a.uid, a.sym);
      break;
    case 'toCombat':
      s = goToCombat(s);
      break;
    case 'attack':
      s = declareAttackers(s, a.uids);
      break;
    case 'block':
      s = declareBlockers(s, a.blocks);
      break;
    case 'pass':
      s = pass(s, 'you');
      break;
    case 'endTurn':
      return advanceToEnd(spec, s);
  }
  return settleTurn(spec, runAI(s, spec.ai));
}

/** Hand the turn to the opponent when your turn ends (if the puzzle continues). */
function settleTurn(spec: PuzzleSpec, s: GameState): GameState {
  if (!s.winner && s.step === 'end' && s.active === 'you' && spec.continueToOppTurn) {
    const next = startTurn(s, 'opp');
    if (spec.oppTurnCasts?.length) return runAI(castForOpp(next, spec.oppTurnCasts), spec.ai);
    return runAI(next, spec.ai);
  }
  return s;
}

function advanceToEnd(spec: PuzzleSpec, s0: GameState): GameState {
  let s = s0;
  for (let guard = 0; guard < 40; guard++) {
    if (s.winner || s.step === 'end') break;
    if (s.step === 'main1' && s.active === 'you' && s.priority === 'you' && !s.stack.length) s = goToCombat(s);
    else if (s.step === 'attackers' && s.active === 'you') s = declareAttackers(s, []);
    else if (s.step === 'blockers' && s.active === 'opp' && !s.stack.length) s = declareBlockers(s, {});
    else if (s.priority === 'you') s = pass(s, 'you');
    s = runAI(s, spec.ai);
  }
  return settleTurn(spec, s);
}

// ---------------------------------------------------------------------------
// Scripts: name-based actions used for solutions, hints and tests

export type ScriptAction =
  | { do: 'land'; card: string }
  | { do: 'cast'; card: string; target?: string; mode?: number; x?: number }
  | { do: 'activate'; card: string; ability?: number; target?: string; x?: number }
  | { do: 'tap'; card: string; color?: ManaSym }
  | { do: 'combat' }
  | { do: 'attack'; with: string[] }
  | { do: 'block'; blocks: [string, string][] }
  | { do: 'pass' }
  | { do: 'endTurn' };

function parseName(ref: string): { name: string; nth: number } {
  const m = /^(.*)#(\d+)$/.exec(ref);
  return m ? { name: m[1], nth: Number(m[2]) } : { name: ref, nth: 1 };
}

function findPermByRef(s: GameState, ref: string, preferSide?: Side, exclude: string[] = []) {
  let side: Side | undefined = preferSide;
  let rest = ref;
  if (ref.startsWith('opp:')) {
    side = 'opp';
    rest = ref.slice(4);
  } else if (ref.startsWith('you:')) {
    side = 'you';
    rest = ref.slice(4);
  }
  const { name, nth } = parseName(rest);
  const order: Side[] = side ? [side] : ['opp', 'you'];
  for (const sd of order) {
    const list = s.battlefield.filter((p) => p.name === name && p.controller === sd && !exclude.includes(p.uid));
    if (list[nth - 1]) return list[nth - 1];
  }
  return undefined;
}

export function resolveTargetRef(s: GameState, ref?: string): TargetRef | undefined {
  if (!ref) return undefined;
  if (ref === 'player:opp' || ref === 'opp') return { type: 'player', side: 'opp' };
  if (ref === 'player:you' || ref === 'you') return { type: 'player', side: 'you' };
  if (ref.startsWith('stack:')) {
    const name = ref.slice(6);
    const item = [...s.stack].reverse().find((i) => i.card.name === name);
    if (!item) throw new Error(`No spell on the stack named ${name}`);
    return { type: 'stack', id: item.id };
  }
  const p = findPermByRef(s, ref);
  if (!p) throw new Error(`No permanent named ${ref}`);
  return { type: 'perm', uid: p.uid };
}

export function scriptToAction(s: GameState, a: ScriptAction): UserAction {
  const handUid = (ref: string) => {
    const { name, nth } = parseName(ref);
    const c = s.players.you.hand.filter((h) => h.name === name)[nth - 1];
    if (!c) throw new Error(`No card named ${ref} in your hand`);
    return c.uid;
  };
  const yourPerm = (ref: string) => {
    const p = findPermByRef(s, ref.startsWith('you:') ? ref : `you:${ref}`);
    if (!p) throw new Error(`You control no permanent named ${ref}`);
    return p.uid;
  };
  switch (a.do) {
    case 'land':
      return { type: 'playLand', uid: handUid(a.card) };
    case 'cast':
      return { type: 'cast', uid: handUid(a.card), target: resolveTargetRef(s, a.target), mode: a.mode, x: a.x };
    case 'activate':
      return { type: 'activate', uid: yourPerm(a.card), index: a.ability ?? 0, target: resolveTargetRef(s, a.target), x: a.x };
    case 'tap':
      return { type: 'tapMana', uid: yourPerm(a.card), sym: a.color };
    case 'combat':
      return { type: 'toCombat' };
    case 'attack': {
      const used: string[] = [];
      const uids = a.with.map((ref) => {
        const p = findPermByRef(s, ref.startsWith('you:') ? ref : `you:${ref}`, 'you', used);
        if (!p) throw new Error(`No attacker named ${ref}`);
        used.push(p.uid);
        return p.uid;
      });
      return { type: 'attack', uids };
    }
    case 'block': {
      const blocks: Record<string, string> = {};
      const used: string[] = [];
      for (const [b, at] of a.blocks) {
        const bp = findPermByRef(s, b.startsWith('you:') ? b : `you:${b}`, 'you', used);
        const ap = s.battlefield.find((p) => p.controller === 'opp' && p.name === parseName(at.replace(/^opp:/, '')).name && s.combat?.attackers.includes(p.uid));
        if (!bp || !ap) throw new Error(`Bad block ${b} -> ${at}`);
        used.push(bp.uid);
        blocks[bp.uid] = ap.uid;
      }
      return { type: 'block', blocks };
    }
    case 'pass':
      return { type: 'pass' };
    case 'endTurn':
      return { type: 'endTurn' };
  }
}

export interface RunResult {
  state: GameState;
  status: PuzzleStatus;
  error?: string;
}

/** Play a whole script from the start and report the result. */
export function runScript(spec: PuzzleSpec, script: ScriptAction[]): RunResult {
  let s = setupPuzzle(spec);
  try {
    for (const a of script) {
      if (puzzleStatus(spec, s) !== 'playing') break;
      s = applyUserAction(spec, s, scriptToAction(s, a));
    }
    // Finish the turn(s) if the script stops early.
    let guard = 0;
    while (puzzleStatus(spec, s) === 'playing' && guard++ < 10) {
      if (s.step === 'blockers' && s.active === 'opp') s = applyUserAction(spec, s, { type: 'block', blocks: {} });
      else s = applyUserAction(spec, s, { type: 'endTurn' });
    }
  } catch (e) {
    return { state: s, status: 'fail', error: (e as Error).message };
  }
  return { state: s, status: puzzleStatus(spec, s) };
}

export { findPerm, other };
