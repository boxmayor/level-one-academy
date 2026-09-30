import { getCard } from './cardpool';
import type { Color, GameState, ManaSym, Permanent, Side } from './types';

export interface ParsedCost {
  generic: number;
  colored: ManaSym[];
  hasX: boolean;
}

const COLORS: Color[] = ['W', 'U', 'B', 'R', 'G'];

export function parseCost(cost?: string): ParsedCost {
  const out: ParsedCost = { generic: 0, colored: [], hasX: false };
  if (!cost) return out;
  const re = /\{([^}]+)\}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(cost))) {
    const sym = m[1];
    if (sym === 'X') out.hasX = true;
    else if (/^\d+$/.test(sym)) out.generic += Number(sym);
    else if (sym === 'C' || (COLORS as string[]).includes(sym)) out.colored.push(sym as ManaSym);
  }
  return out;
}

export function manaValue(cost?: string): number {
  const p = parseCost(cost);
  return p.generic + p.colored.length;
}

export function costColors(cost?: string): Color[] {
  const p = parseCost(cost);
  const set = new Set<Color>();
  for (const c of p.colored) if (c !== 'C') set.add(c);
  return COLORS.filter((c) => set.has(c));
}

/** Mana symbols a permanent can currently tap for (empty if it can't). */
export function manaOptions(p: Permanent): ManaSym[] {
  if (p.tapped) return [];
  const def = getCard(p.name);
  if (def.types.includes('land') && def.produces) {
    return def.produces;
  }
  const ab = def.abilities?.find((a) => a.mana);
  if (ab && ab.mana) {
    if (ab.tap && p.sick && !def.types.includes('land')) return [];
    return ab.mana;
  }
  return [];
}

interface Source {
  kind: 'pool' | 'perm';
  poolIndex?: number;
  uid?: string;
  options: ManaSym[];
  painful: boolean;
  isLand: boolean;
}

export interface Payment {
  pool: number[];
  taps: { uid: string; sym: ManaSym; pain: boolean }[];
}

function sources(s: GameState, side: Side, excludeUid?: string): Source[] {
  const out: Source[] = [];
  s.players[side].pool.forEach((sym, i) => out.push({ kind: 'pool', poolIndex: i, options: [sym], painful: false, isLand: false }));
  for (const p of s.battlefield) {
    if (p.controller !== side || p.uid === excludeUid) continue;
    const opts = manaOptions(p);
    if (!opts.length) continue;
    const def = getCard(p.name);
    out.push({ kind: 'perm', uid: p.uid, options: opts, painful: !!def.painful, isLand: def.types.includes('land') });
  }
  return out;
}

function pref(src: Source): number {
  // Lower = used first. Pool first, then basics/mono lands, then flexible lands, painful last, creatures last.
  if (src.kind === 'pool') return 0;
  let v = 10 + src.options.length * 3;
  if (src.painful) v += 20;
  if (!src.isLand) v += 40;
  return v;
}

function symPain(src: Source, sym: ManaSym): boolean {
  return src.painful && sym !== 'C';
}

/** How many colored symbols of each color the other cards in hand need (to keep those colors open). */
function colorDemand(s: GameState, side: Side, excludeHandUid?: string): Record<string, number> {
  const d: Record<string, number> = {};
  for (const c of s.players[side].hand) {
    if (c.uid === excludeHandUid) continue;
    for (const sym of parseCost(getCard(c.name).cost).colored) d[sym] = (d[sym] ?? 0) + 1;
  }
  // Activated abilities on your permanents (e.g. "{R}: +1/+0") want their colors kept open too.
  for (const p of s.battlefield) {
    if (p.controller !== side) continue;
    for (const ab of getCard(p.name).abilities ?? []) {
      if (ab.mana) continue;
      for (const sym of parseCost(ab.cost).colored) d[sym] = (d[sym] ?? 0) + 1;
    }
  }
  return d;
}

/** Find a way to pay a cost, or null. `x` adds to the generic part. */
export function findPayment(s: GameState, side: Side, costStr: string | undefined, x = 0, excludeUid?: string, excludeHandUid?: string): Payment | null {
  const cost = parseCost(costStr);
  const srcs = sources(s, side, excludeUid).sort((a, b) => pref(a) - pref(b));
  const colored = [...cost.colored];
  // Scarcest requirement first.
  colored.sort((a, b) => srcs.filter((q) => q.options.includes(a)).length - srcs.filter((q) => q.options.includes(b)).length);
  const used = new Array(srcs.length).fill(false);
  const assign: { src: number; sym: ManaSym }[] = [];

  const solveColored = (i: number): boolean => {
    if (i === colored.length) return true;
    const need = colored[i];
    for (let k = 0; k < srcs.length; k++) {
      if (used[k] || !srcs[k].options.includes(need)) continue;
      used[k] = true;
      assign.push({ src: k, sym: need });
      if (solveColored(i + 1)) return true;
      assign.pop();
      used[k] = false;
    }
    return false;
  };
  if (!solveColored(0)) return null;

  let generic = cost.generic + x;
  // Generic: prefer sources that can pay without pain (pain lands can make {C}),
  // then sources whose colors the rest of the hand needs least.
  const demand = colorDemand(s, side, excludeHandUid);
  const need = (src: Source) => (src.kind === 'pool' ? -1 : Math.max(0, ...src.options.map((o) => demand[o] ?? 0)));
  const genericOrder = srcs
    .map((src, k) => ({ src, k }))
    .filter(({ k }) => !used[k])
    .sort((a, b) => {
      const pa = a.src.painful && !a.src.options.includes('C') ? 1 : 0;
      const pb = b.src.painful && !b.src.options.includes('C') ? 1 : 0;
      return pa - pb || need(a.src) - need(b.src) || pref(a.src) - pref(b.src);
    });
  for (const { src, k } of genericOrder) {
    if (generic <= 0) break;
    used[k] = true;
    const sym = src.options.includes('C') ? 'C' : src.options[0];
    assign.push({ src: k, sym });
    generic--;
  }
  if (generic > 0) return null;

  const pay: Payment = { pool: [], taps: [] };
  for (const a of assign) {
    const src = srcs[a.src];
    if (src.kind === 'pool') pay.pool.push(src.poolIndex!);
    else pay.taps.push({ uid: src.uid!, sym: a.sym, pain: symPain(src, a.sym) });
  }
  return pay;
}

/** Largest X the side could pay for a cost with {X}. */
export function maxX(s: GameState, side: Side, costStr: string | undefined, excludeUid?: string): number {
  let best = -1;
  for (let x = 0; x <= 20; x++) {
    if (findPayment(s, side, costStr, x, excludeUid)) best = x;
    else break;
  }
  return best;
}

/** Number of mana the side could produce right now (pool + untapped sources). */
export function availableMana(s: GameState, side: Side): number {
  return sources(s, side).length;
}
