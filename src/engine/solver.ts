import { getCard } from './cardpool';
import { blockProblem, canActivate, canAttack, canBlock, canCast, canPlayLand, creatures, defOf, describeTarget, effectTarget, findPerm, legalTargets } from './game';
import { maxX, parseCost } from './mana';
import { applyUserAction, puzzleStatus, setupPuzzle, type PuzzleSpec, type UserAction } from './puzzle';
import type { GameState } from './types';

// A brute-force puzzle solver: tries every line of play you could take against the AI.
// Used by the test suite and while designing puzzles, to confirm a puzzle is solvable
// and to count how many different lines solve it.

function subsets<T>(arr: T[]): T[][] {
  const out: T[][] = [];
  for (let mask = 0; mask < 1 << arr.length; mask++) out.push(arr.filter((_, i) => mask & (1 << i)));
  return out;
}

function blockAssignments(s: GameState): Record<string, string>[] {
  const attackers = s.combat?.attackers ?? [];
  const defenders = creatures(s, 'you').filter((p) => !p.tapped);
  const options = defenders.map((d) => ['', ...attackers.filter((a) => canBlock(s, d, findPerm(s, a)!))]);
  const out: Record<string, string>[] = [];
  const cur: Record<string, string> = {};
  const rec = (i: number) => {
    if (i === defenders.length) {
      if (!blockProblem(s, cur)) out.push({ ...cur });
      return;
    }
    for (const a of options[i]) {
      if (a) cur[defenders[i].uid] = a;
      else delete cur[defenders[i].uid];
      rec(i + 1);
    }
    delete cur[defenders[i].uid];
  };
  rec(0);
  return out;
}

function instantActions(s: GameState, sorcerySpeedOk: boolean): UserAction[] {
  const out: UserAction[] = [];
  for (const c of s.players.you.hand) {
    const def = getCard(c.name);
    if (def.types.includes('land')) {
      if (sorcerySpeedOk && canPlayLand(s, 'you', c.uid).ok) out.push({ type: 'playLand', uid: c.uid });
      continue;
    }
    const modes = def.effect?.kind === 'modal' ? def.effect.modes.map((_, i) => i) : [undefined];
    const xs = parseCost(def.cost).hasX ? [Math.max(0, maxX(s, 'you', def.cost))] : [undefined];
    for (const mode of modes) {
      for (const x of xs) {
        const spec = effectTarget(def.effect, mode);
        const targets = spec ? legalTargets(s, 'you', spec) : [undefined];
        for (const target of targets) {
          if (canCast(s, 'you', c.uid, { mode, x, target }).ok) out.push({ type: 'cast', uid: c.uid, mode, x, target });
        }
      }
    }
  }
  for (const p of s.battlefield) {
    if (p.controller !== 'you') continue;
    (defOf(p).abilities ?? []).forEach((ab, i) => {
      if (ab.mana || !canActivate(s, 'you', p.uid, i).ok) return;
      const spec = effectTarget(ab.effect);
      const targets = spec ? legalTargets(s, 'you', spec) : [undefined];
      for (const target of targets) out.push({ type: 'activate', uid: p.uid, index: i, target });
    });
  }
  return out;
}

/** Every sensible action you can take right now. */
export function legalUserActions(spec: PuzzleSpec, s: GameState): UserAction[] {
  if (puzzleStatus(spec, s) !== 'playing') return [];
  if (s.step === 'attackers' && s.active === 'you') {
    return subsets(creatures(s, 'you').filter((p) => canAttack(s, p)).map((p) => p.uid)).map((uids) => ({ type: 'attack', uids }));
  }
  if (s.step === 'blockers' && s.active === 'opp' && !s.stack.length) {
    return [...instantActions(s, false), ...blockAssignments(s).map((blocks) => ({ type: 'block' as const, blocks }))];
  }
  if (s.priority !== 'you') return [];
  const main = (s.step === 'main1' || s.step === 'main2') && s.active === 'you' && !s.stack.length;
  const out = instantActions(s, main).filter((a) => {
    if (a.type !== 'cast') return true;
    const def = getCard(s.players.you.hand.find((h) => h.uid === a.uid)!.name);
    return main || def.types.includes('instant');
  });
  if (main && s.step === 'main1') out.push({ type: 'toCombat' });
  if (main) out.push({ type: 'endTurn' });
  else out.push({ type: 'pass' });
  return out;
}

export function describeAction(s: GameState, a: UserAction): string {
  const name = (uid: string) => findPerm(s, uid)?.name ?? s.players.you.hand.find((h) => h.uid === uid)?.name ?? uid;
  switch (a.type) {
    case 'playLand':
      return `land ${name(a.uid)}`;
    case 'cast':
      return `cast ${name(a.uid)}${a.mode !== undefined ? ` (mode ${a.mode})` : ''}${a.x !== undefined ? ` X=${a.x}` : ''}${a.target ? ` → ${describeTarget(s, a.target)}` : ''}`;
    case 'activate':
      return `activate ${name(a.uid)}${a.target ? ` → ${describeTarget(s, a.target)}` : ''}`;
    case 'attack':
      return `attack [${a.uids.map(name).join(', ')}]`;
    case 'block':
      return `block {${Object.entries(a.blocks)
        .map(([b, at]) => `${name(b)}→${name(at)}`)
        .join(', ')}}`;
    default:
      return a.type;
  }
}

export interface SolveResult {
  wins: string[][];
  winCount: number;
  /** Distinct finished lines that fail the goal (a rough measure of how easy it is to go wrong). */
  failCount: number;
  nodes: number;
  truncated: boolean;
}

function stateKey(s: GameState): string {
  return JSON.stringify([s.battlefield, s.players.you, s.players.opp, s.stack, s.step, s.active, s.priority, s.passes, s.combat, s.events.cast, s.winner]);
}

/** Depth-first search over your possible lines. */
export function solve(spec: PuzzleSpec, opts: { maxDepth?: number; maxNodes?: number; keep?: number } = {}): SolveResult {
  const maxDepth = opts.maxDepth ?? 12;
  const maxNodes = opts.maxNodes ?? 20000;
  const keep = opts.keep ?? 5;
  const res: SolveResult = { wins: [], winCount: 0, failCount: 0, nodes: 0, truncated: false };
  const seen = new Map<string, boolean>();
  const dfs = (s: GameState, path: string[], depth: number): boolean => {
    if (res.nodes++ > maxNodes) {
      res.truncated = true;
      return false;
    }
    const st = puzzleStatus(spec, s);
    if (st === 'success') {
      res.winCount++;
      if (res.wins.length < keep) res.wins.push(path);
      return true;
    }
    if (st === 'fail') {
      res.failCount++;
      return false;
    }
    if (depth >= maxDepth) return false;
    const key = stateKey(s);
    if (seen.has(key)) {
      if (seen.get(key)) res.winCount++;
      return seen.get(key)!;
    }
    let any = false;
    for (const a of legalUserActions(spec, s)) {
      let next: GameState;
      try {
        next = applyUserAction(spec, s, a);
      } catch {
        continue;
      }
      if (dfs(next, [...path, describeAction(s, a)], depth + 1)) any = true;
    }
    seen.set(key, any);
    return any;
  };
  dfs(setupPuzzle(spec), [], 0);
  return res;
}
