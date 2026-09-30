import { getCard } from './cardpool';
import { resolveCombatDamage, type CombatUnit } from './combat';
import {
  activate,
  basePower,
  blockProblem,
  canAttack,
  canBlock,
  castSpell,
  creatures,
  declareAttackers,
  declareBlockers,
  defOf,
  effectTarget,
  findPerm,
  hasInstantOptions,
  hasKw,
  isCreature,
  keywords,
  legalTargets,
  pass,
  playLand,
  power,
  toughness,
  clone,
} from './game';
import { findPayment, maxX, parseCost } from './mana';
import { other, type Effect, type GameState, type Keyword, type Permanent, type Side, type TargetRef } from './types';

// ---------------------------------------------------------------------------
// Policy

export interface AIPolicy {
  /** How the opponent uses counterspells. */
  /** A number means: only counter spells with at least this mana value. */
  counter?: 'eval' | 'first' | 'never' | 'creatures' | 'noncreature' | number;
  /** How the opponent blocks. 'minimax' assumes it can see your hand (chess-style best defense). */
  blocks?: 'minimax' | 'visible' | 'none' | [string, string][];
  /** Whether the opponent casts instants (tricks, removal, responses). */
  tricks?: boolean;
  /** On its own turn: play a land and cast creatures before combat. */
  develop?: boolean;
  /** On its own turn: how it attacks. */
  attack?: 'best' | 'all' | 'none' | string[];
}

const DEFAULT_POLICY: Required<Pick<AIPolicy, 'counter' | 'blocks' | 'tricks' | 'develop' | 'attack'>> = {
  counter: 'eval' as AIPolicy['counter'] & {},
  blocks: 'minimax',
  tricks: true,
  develop: false,
  attack: 'best',
};

// ---------------------------------------------------------------------------
// Evaluation

const KW_VALUE: Partial<Record<Keyword, number>> = {
  flying: 1.5,
  firstStrike: 1,
  deathtouch: 1.5,
  lifelink: 1,
  trample: 0.5,
  vigilance: 0.4,
  hexproof: 1,
  menace: 0.7,
  haste: 0.3,
  reach: 0.4,
  indestructible: 2,
};

export function creatureValue(p: number, t: number, kws: Keyword[]): number {
  let v = 1 + Math.max(0, p) * 1.3 + Math.max(0, t) * 0.9;
  for (const k of kws) v += KW_VALUE[k] ?? 0;
  if (kws.includes('defender')) v -= Math.max(0, p) * 1.0;
  return v;
}

export function permValue(p: Permanent): number {
  if (!isCreature(p)) return 0;
  const permP = basePower(p) + p.counters;
  const permT = (p.animated ? p.animated.toughness : defOf(p).toughness ?? 0) + p.counters;
  // Animated lands are only creatures for a turn — value them as lands.
  if (p.animated) return 0.5;
  const kws = [...new Set([...(defOf(p).keywords ?? [])])];
  return creatureValue(permP, permT, kws);
}

export function lifeScore(l: number): number {
  if (l <= 0) return -10000;
  return Math.min(l, 5) * 1.2 + Math.min(Math.max(l - 5, 0), 5) * 0.7 + Math.max(l - 10, 0) * 0.35;
}

export function evaluate(s: GameState, side: Side): number {
  if (s.winner === side) return 10000;
  if (s.winner === other(side)) return -10000;
  if (s.winner === 'draw') return -5000;
  const o = other(side);
  let v = lifeScore(s.players[side].life) - lifeScore(s.players[o].life);
  for (const p of s.battlefield) {
    const val = permValue(p);
    v += p.controller === side ? val : -val;
  }
  v += 1.0 * (s.players[side].hand.length - s.players[o].hand.length);
  return v;
}

// ---------------------------------------------------------------------------
// Responses (instant-speed actions) and a light simulation for combat search

export interface Response {
  side: Side;
  kind: 'cast' | 'activate';
  uid: string;
  abilityIndex?: number;
  mode?: number;
  target?: TargetRef;
  x?: number;
  cost: string;
  effect: Effect;
  name: string;
  usesCard: boolean;
}

export function listResponses(s: GameState, side: Side): Response[] {
  const out: Response[] = [];
  const pushTargets = (base: Omit<Response, 'target'>, effect: Effect, mode?: number) => {
    const spec = effectTarget(effect, mode);
    if (!spec) {
      out.push({ ...base });
      return;
    }
    if (spec.kind === 'spell' || spec.kind === 'creatureSpell' || spec.kind === 'noncreatureSpell') return;
    for (const t of legalTargets(s, side, spec)) out.push({ ...base, target: t });
  };
  for (const c of s.players[side].hand) {
    const def = getCard(c.name);
    if (!def.types.includes('instant') || !def.effect) continue;
    const cost = parseCost(def.cost);
    const x = cost.hasX ? maxX(s, side, def.cost) : 0;
    if (x < 0 || !findPayment(s, side, def.cost, x)) continue;
    const base = { side, kind: 'cast' as const, uid: c.uid, cost: def.cost ?? '', x, name: c.name, usesCard: true };
    if (def.effect.kind === 'modal') {
      def.effect.modes.forEach((m, i) => pushTargets({ ...base, mode: i, effect: m.effect }, def.effect!, i));
    } else pushTargets({ ...base, effect: def.effect }, def.effect);
  }
  for (const p of s.battlefield) {
    if (p.controller !== side) continue;
    const abs = defOf(p).abilities ?? [];
    abs.forEach((ab, i) => {
      if (ab.mana || ab.animate || !ab.effect || ab.sorcery) return;
      if (ab.tap && (p.tapped || (isCreature(p) && p.sick && !hasKw(p, 'haste')))) return;
      if (!findPayment(s, side, ab.cost, 0, ab.tap ? p.uid : undefined)) return;
      const base = { side, kind: 'activate' as const, uid: p.uid, abilityIndex: i, cost: ab.cost, effect: ab.effect!, name: p.name, usesCard: false };
      pushTargets(base, ab.effect!);
    });
  }
  return out;
}

interface LUnit extends CombatUnit {
  value: number;
  controller: Side;
  gone?: boolean;
  tapped: boolean;
}

interface LState {
  units: Record<string, LUnit>;
  life: Record<Side, number>;
  hand: Record<Side, number>;
}

function toLight(s: GameState): LState {
  const units: Record<string, LUnit> = {};
  for (const p of creatures(s)) {
    units[p.uid] = {
      uid: p.uid,
      side: p.controller,
      controller: p.controller,
      power: power(p),
      toughness: toughness(p),
      damage: p.damage,
      keywords: keywords(p),
      value: permValue(p),
      tapped: p.tapped,
    };
  }
  return { units, life: { you: s.players.you.life, opp: s.players.opp.life }, hand: { you: s.players.you.hand.length, opp: s.players.opp.hand.length } };
}

function cloneLight(l: LState): LState {
  const units: Record<string, LUnit> = {};
  for (const k in l.units) units[k] = { ...l.units[k], keywords: [...l.units[k].keywords] };
  return { units, life: { ...l.life }, hand: { ...l.hand } };
}

function lightDead(u: LUnit): boolean {
  if (u.toughness <= 0) return true;
  if (u.keywords.includes('indestructible')) return false;
  return u.damage >= u.toughness;
}

function applyLight(l: LState, r: Response, effect: Effect = r.effect) {
  const target = r.target;
  const unitT = target?.type === 'perm' ? l.units[target.uid] : undefined;
  const self = r.kind === 'activate' ? l.units[r.uid] : undefined;
  switch (effect.kind) {
    case 'damage': {
      const amt = effect.amount === 'X' ? r.x ?? 0 : effect.amount;
      if (target?.type === 'player') l.life[target.side] -= amt;
      else if (unitT && !unitT.gone) {
        unitT.damage += amt;
        if (lightDead(unitT)) unitT.gone = true;
      }
      break;
    }
    case 'destroy':
      if (unitT && !unitT.keywords.includes('indestructible')) unitT.gone = true;
      if (effect.gainLife) l.life[r.side] += effect.gainLife;
      break;
    case 'exile':
    case 'bounce':
      if (unitT) unitT.gone = true;
      break;
    case 'tap':
      if (unitT) unitT.tapped = true;
      break;
    case 'pump': {
      const u = effect.target === 'self' ? self : unitT;
      if (u && !u.gone) {
        u.power += effect.power;
        u.toughness += effect.toughness;
        if (effect.keywords) u.keywords.push(...effect.keywords);
        if (lightDead(u)) u.gone = true;
      }
      break;
    }
    case 'counters': {
      const u = effect.target === 'self' ? self : unitT;
      const amt = effect.amount === 'X' ? r.x ?? 0 : effect.amount;
      if (u && !u.gone) {
        u.power += amt;
        u.toughness += amt;
        u.value += amt * 2.2;
      }
      break;
    }
    case 'pumpTeam':
      for (const u of Object.values(l.units)) {
        if (u.controller === r.side && !u.gone) {
          u.power += effect.power;
          u.toughness += effect.toughness;
        }
      }
      break;
    case 'draw':
      l.hand[r.side] += effect.amount === 'X' ? r.x ?? 0 : effect.amount;
      if (effect.loseLife) l.life[r.side] -= effect.loseLife;
      break;
    case 'gainLife':
      l.life[r.side] += effect.amount;
      break;
    case 'drain':
      l.life[other(r.side)] -= effect.amount;
      l.life[r.side] += effect.amount;
      break;
    case 'modal':
      if (r.mode !== undefined) applyLight(l, r, effect.modes[r.mode].effect);
      break;
    case 'seq':
      for (const e of effect.effects) applyLight(l, r, e);
      break;
    default:
      break;
  }
  if (r.usesCard) l.hand[r.side] -= 1;
}

function lightEval(l: LState, side: Side): number {
  const o = other(side);
  if (l.life[o] <= 0 && l.life[side] > 0) return 10000 + l.life[side];
  if (l.life[side] <= 0) return -10000;
  let v = lifeScore(l.life[side]) - lifeScore(l.life[o]);
  for (const u of Object.values(l.units)) {
    if (u.gone) continue;
    v += u.controller === side ? u.value : -u.value;
  }
  v += 1.0 * (l.hand[side] - l.hand[o]);
  return v;
}

function lightCombat(l0: LState, attackers: string[], blocks: Record<string, string>, defender: Side): LState {
  const l = cloneLight(l0);
  const alive = (u: string) => l.units[u] && !l.units[u].gone;
  const att = attackers.filter(alive);
  const bl: Record<string, string> = {};
  for (const [b, a] of Object.entries(blocks)) if (alive(b)) bl[b] = a;
  const units: Record<string, CombatUnit> = {};
  for (const u of [...att, ...Object.keys(bl)]) units[u] = l.units[u];
  const res = resolveCombatDamage({ units, attackers: att, blocks: bl, blocked: [...new Set(Object.values(blocks))], defender });
  l.life[defender] -= res.damageToPlayer[defender];
  l.life.you += res.lifeGain.you;
  l.life.opp += res.lifeGain.opp;
  for (const d of res.dead) l.units[d].gone = true;
  return l;
}

/** Response sets of size 0..maxN whose combined cost is payable. */
function responseSets(s: GameState, rs: Response[], maxN: number): Response[][] {
  const sets: Response[][] = [[]];
  if (maxN >= 1) for (const r of rs) sets.push([r]);
  if (maxN >= 2 && rs.length <= 10) {
    for (let i = 0; i < rs.length; i++) {
      for (let j = i + 1; j < rs.length; j++) {
        if (rs[i].usesCard && rs[j].usesCard && rs[i].uid === rs[j].uid) continue;
        if (!findPayment(s, rs[i].side, rs[i].cost + rs[j].cost + (rs[i].x ? `{${rs[i].x}}` : '') + (rs[j].x ? `{${rs[j].x}}` : ''))) continue;
        sets.push([rs[i], rs[j]]);
      }
    }
  }
  return sets;
}

const COMBAT_RELEVANT = new Set(['damage', 'destroy', 'exile', 'bounce', 'pump', 'counters', 'pumpTeam', 'modal', 'seq']);

function combatResponses(s: GameState, side: Side): Response[] {
  return listResponses(s, side).filter((r) => COMBAT_RELEVANT.has(r.effect.kind));
}

// ---------------------------------------------------------------------------
// Blocking

function enumerateBlocks(s: GameState, attackers: string[], defenders: Permanent[]): Record<string, string>[] {
  const options: string[][] = defenders.map((d) => ['', ...attackers.filter((a) => canBlock(s, d, findPerm(s, a)!))]);
  const out: Record<string, string>[] = [];
  const cur: Record<string, string> = {};
  const rec = (i: number) => {
    if (out.length > 1500) return;
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

/** Value (for the defender) of a block assignment after the attacker's best trick and the defender's best reply. */
function blockValue(
  base: LState,
  attackers: string[],
  blocks: Record<string, string>,
  defender: Side,
  attackerSets: Response[][],
  defenderSets: Response[][],
): number {
  let worst = Infinity;
  for (const aSet of attackerSets) {
    let best = -Infinity;
    for (const dSet of defenderSets) {
      const l = cloneLight(base);
      for (const r of aSet) applyLight(l, r);
      for (const r of dSet) applyLight(l, r);
      const after = lightCombat(l, attackers, blocks, defender);
      const v = lightEval(after, defender);
      if (v > best) best = v;
    }
    if (best < worst) worst = best;
    if (worst <= -10000) break;
  }
  return worst;
}

export function chooseBlocks(s: GameState, policy: AIPolicy = {}): Record<string, string> {
  const pol = { ...DEFAULT_POLICY, ...policy };
  const c = s.combat;
  if (!c) return {};
  const defender = other(s.active);
  if (pol.blocks === 'none') return {};
  if (Array.isArray(pol.blocks)) {
    // Scripted blocks: [blocker name, attacker name] pairs. Repeated names use the next unused copy.
    const out: Record<string, string> = {};
    for (const [bName, aName] of pol.blocks) {
      const b = s.battlefield.find((p) => p.name === bName && p.controller === defender && !(p.uid in out) && !p.tapped);
      const cands = s.battlefield.filter((p) => p.name === aName && c.attackers.includes(p.uid));
      const a = cands.find((p) => !Object.values(out).includes(p.uid)) ?? cands[0];
      if (b && a && canBlock(s, b, a)) out[b.uid] = a.uid;
    }
    return blockProblem(s, out) ? {} : out;
  }
  const defenders = creatures(s, defender).filter((p) => !p.tapped);
  const assigns = enumerateBlocks(s, c.attackers, defenders);
  const base = toLight(s);
  const attackerSets = pol.blocks === 'minimax' ? responseSets(s, combatResponses(s, s.active), 2) : [[]];
  const defenderSets = pol.tricks ? responseSets(s, combatResponses(s, defender), 1) : [[]];
  let bestV = -Infinity;
  let best: Record<string, string> = {};
  for (const a of assigns) {
    const v = blockValue(base, c.attackers, a, defender, attackerSets, defenderSets) - Object.keys(a).length * 0.01;
    if (v > bestV + 1e-9) {
      bestV = v;
      best = a;
    }
  }
  return best;
}

// ---------------------------------------------------------------------------
// Attacking (opponent's turn)

export function chooseAttackers(s: GameState, policy: AIPolicy = {}): string[] {
  const pol = { ...DEFAULT_POLICY, ...policy };
  const side = s.active;
  const candidates = creatures(s, side).filter((p) => canAttack(s, p));
  if (pol.attack === 'none') return [];
  if (pol.attack === 'all') return candidates.map((p) => p.uid);
  if (Array.isArray(pol.attack)) {
    const names = [...pol.attack];
    const out: string[] = [];
    for (const p of candidates) {
      const i = names.indexOf(p.name);
      if (i >= 0) {
        out.push(p.uid);
        names.splice(i, 1);
      }
    }
    return out;
  }
  const defender = other(side);
  const blockers = creatures(s, defender).filter((p) => !p.tapped);
  const base = toLight(s);
  const mySets = pol.tricks ? responseSets(s, combatResponses(s, side), 1) : [[]];
  let bestV = -Infinity;
  let best: string[] = [];
  const n = candidates.length;
  for (let mask = 0; mask < 1 << n; mask++) {
    const att = candidates.filter((_, i) => mask & (1 << i)).map((p) => p.uid);
    // Attacking taps creatures (unless vigilance) — they can't block on the next turn, but we only look at this combat.
    const fakeCombat = { ...s, combat: { attackers: att, blocks: {}, blocked: [], blockersDeclared: false } } as GameState;
    const assigns = att.length ? enumerateBlocks(fakeCombat, att, blockers) : [{}];
    let worst = Infinity;
    for (const a of assigns) {
      let bestTrick = -Infinity;
      for (const set of mySets) {
        const l = cloneLight(base);
        for (const r of set) applyLight(l, r);
        const v = lightEval(lightCombat(l, att, a, defender), side);
        if (v > bestTrick) bestTrick = v;
      }
      if (bestTrick < worst) worst = bestTrick;
    }
    // Small bonus for pressure so ties favour attacking.
    const v = worst + att.length * 0.01;
    if (v > bestV) {
      bestV = v;
      best = att;
    }
  }
  return best;
}

// ---------------------------------------------------------------------------
// Priority decisions

type AIAction =
  | { type: 'pass' }
  | { type: 'respond'; r: Response }
  | { type: 'counter'; uid: string; target: TargetRef }
  | { type: 'blocks'; blocks: Record<string, string> }
  | { type: 'attack'; attackers: string[] }
  | { type: 'land'; uid: string }
  | { type: 'castMain'; uid: string; target?: TargetRef; x?: number };

function applyResponse(s: GameState, r: Response): GameState {
  if (r.kind === 'cast') return castSpell(s, r.side, r.uid, { target: r.target, mode: r.mode, x: r.x });
  return activate(s, r.side, r.uid, r.abilityIndex!, { target: r.target, x: r.x });
}

/** Resolve the stack with nobody responding, then finish combat if blockers are declared. */
function settle(s0: GameState): GameState {
  let s = s0;
  let guard = 0;
  while (!s.winner && s.stack.length && guard++ < 20) {
    s = clone(s);
    s.passes = 1;
    s = pass(s, s.priority);
  }
  if (!s.winner && s.step === 'combat') {
    s = clone(s);
    s.passes = 1;
    s = pass(s, s.priority);
  }
  return s;
}

function counterCandidates(s: GameState): { uid: string; target: TargetRef }[] {
  const top = s.stack[s.stack.length - 1];
  if (!top || top.controller === 'opp' || top.isAbility) return [];
  const out: { uid: string; target: TargetRef }[] = [];
  for (const c of s.players.opp.hand) {
    const def = getCard(c.name);
    if (def.effect?.kind !== 'counter' || !def.types.includes('instant')) continue;
    if (!findPayment(s, 'opp', def.cost)) continue;
    const spec = effectTarget(def.effect);
    if (!spec) continue;
    const t = legalTargets(s, 'opp', spec).find((r) => r.type === 'stack' && r.id === top.id);
    if (t) out.push({ uid: c.uid, target: t });
  }
  return out;
}

function decidePriority(s: GameState, pol: typeof DEFAULT_POLICY & AIPolicy): AIAction {
  const side: Side = 'opp';
  const top = s.stack[s.stack.length - 1];

  // 1. Counterspells
  if (top && top.controller !== side && !top.isAbility && pol.counter !== 'never') {
    const cands = counterCandidates(s);
    if (cands.length) {
      const isCre = getCard(top.card.name).types.includes('creature');
      const mv = parseCost(getCard(top.card.name).cost).generic + parseCost(getCard(top.card.name).cost).colored.length;
      if (
        pol.counter === 'first' ||
        (pol.counter === 'creatures' && isCre) ||
        (pol.counter === 'noncreature' && !isCre) ||
        (typeof pol.counter === 'number' && mv >= pol.counter)
      ) {
        return { type: 'counter', ...cands[0] };
      }
      if (pol.counter === 'eval') {
        const passV = evaluate(settle(s), side);
        const s2 = castSpell(s, side, cands[0].uid, { target: cands[0].target });
        const cV = evaluate(settle(s2), side);
        if (cV > passV + 1.5) return { type: 'counter', ...cands[0] };
      }
    }
  }

  // 2. Before blocking as the defender: removal on attackers, then declare blocks.
  if (s.step === 'blockers' && s.active !== side && !s.stack.length) {
    if (pol.tricks) {
      const baseV = blockOutcome(s, pol);
      let best: { r: Response; v: number } | null = null;
      for (const r of listResponses(s, side)) {
        if (!['damage', 'destroy', 'exile', 'bounce', 'tap'].includes(r.effect.kind)) continue;
        if (r.target?.type !== 'perm' || !s.combat?.attackers.includes(r.target.uid)) continue;
        const s2 = settle(applyResponse(s, r));
        if (s2.step !== 'blockers') continue;
        const v = blockOutcome(s2, pol);
        if (!best || v > best.v) best = { r, v };
      }
      if (best && best.v > baseV + 1.5) return { type: 'respond', r: best.r };
    }
    return { type: 'blocks', blocks: chooseBlocks(s, pol) };
  }

  // 3. Instant-speed responses and combat tricks, judged by simulating the result.
  if (pol.tricks && s.step !== 'main1' && s.step !== 'main2') {
    const passV = evaluate(settle(s), side);
    let best: { r: Response; v: number } | null = null;
    for (const r of listResponses(s, side)) {
      let s2: GameState;
      try {
        s2 = applyResponse(s, r);
      } catch {
        continue;
      }
      const v = evaluate(settle(s2), side);
      if (!best || v > best.v) best = { r, v };
    }
    if (best && best.v > passV + 1.5) return { type: 'respond', r: best.r };
  }
  if (pol.tricks && top && top.controller !== side) {
    // Responses in main phases (e.g. save a creature from removal).
    const passV = evaluate(settle(s), side);
    let best: { r: Response; v: number } | null = null;
    for (const r of listResponses(s, side)) {
      let s2: GameState;
      try {
        s2 = applyResponse(s, r);
      } catch {
        continue;
      }
      const v = evaluate(settle(s2), side);
      if (!best || v > best.v) best = { r, v };
    }
    if (best && best.v > passV + 1.5) return { type: 'respond', r: best.r };
  }
  return { type: 'pass' };
}

/** Defender's value of the best block (used to judge removal before blocks). */
function blockOutcome(s: GameState, pol: AIPolicy): number {
  const c = s.combat;
  if (!c) return evaluate(s, 'opp');
  const defenders = creatures(s, 'opp').filter((p) => !p.tapped);
  const base = toLight(s);
  const attackerSets = pol.blocks === 'minimax' ? responseSets(s, combatResponses(s, s.active), 1) : [[]];
  let best = -Infinity;
  for (const a of enumerateBlocks(s, c.attackers, defenders)) {
    const v = blockValue(base, c.attackers, a, 'opp', attackerSets, [[]]);
    if (v > best) best = v;
  }
  return best;
}

function developMain(s: GameState): AIAction | null {
  const hand = s.players.opp.hand;
  if (s.players.opp.landsPlayed === 0) {
    const land = hand.find((c) => getCard(c.name).types.includes('land'));
    if (land) return { type: 'land', uid: land.uid };
  }
  // Burn to the face if it's lethal.
  for (const c of hand) {
    const def = getCard(c.name);
    if (def.effect?.kind === 'damage' && (def.effect.target === 'any' || def.effect.target === 'player')) {
      const amt = def.effect.amount === 'X' ? maxX(s, 'opp', def.cost) : def.effect.amount;
      if (amt >= s.players.you.life && findPayment(s, 'opp', def.cost, def.effect.amount === 'X' ? amt : 0)) {
        return { type: 'castMain', uid: c.uid, target: { type: 'player', side: 'you' }, x: def.effect.amount === 'X' ? amt : undefined };
      }
    }
  }
  const castable = hand
    .filter((c) => getCard(c.name).types.includes('creature') && !parseCost(getCard(c.name).cost).hasX && findPayment(s, 'opp', getCard(c.name).cost))
    .sort((a, b) => (parseCost(getCard(b.name).cost).generic + parseCost(getCard(b.name).cost).colored.length) - (parseCost(getCard(a.name).cost).generic + parseCost(getCard(a.name).cost).colored.length));
  if (castable.length) return { type: 'castMain', uid: castable[0].uid };
  return null;
}

/** Perform one AI step. Returns the same state if the AI has nothing to do. */
export function aiStep(s: GameState, policy: AIPolicy = {}): GameState {
  const pol = { ...DEFAULT_POLICY, ...policy };
  if (s.winner) return s;
  // Opponent declares attackers on its turn.
  if (s.step === 'attackers' && s.active === 'opp') return declareAttackers(s, chooseAttackers(s, pol));
  if (s.priority !== 'opp') return s;
  if (s.active === 'opp' && (s.step === 'main1' || s.step === 'main2') && !s.stack.length && pol.develop) {
    const act = developMain(s);
    if (act?.type === 'land') return playLand(s, 'opp', act.uid);
    if (act?.type === 'castMain') return castSpell(s, 'opp', act.uid, { target: act.target, x: act.x });
  }
  const act = decidePriority(s, pol);
  switch (act.type) {
    case 'counter':
      return castSpell(s, 'opp', act.uid, { target: act.target });
    case 'respond':
      return applyResponse(s, act.r);
    case 'blocks':
      return declareBlockers(s, act.blocks);
    default:
      return pass(s, 'opp');
  }
}

/** True when the game is waiting for the human player to act. */
export function waitingForUser(s: GameState): boolean {
  if (s.winner || s.step === 'end') return false;
  if (s.step === 'attackers') return s.active === 'you';
  if (s.step === 'blockers' && s.active === 'opp' && !s.stack.length) return true;
  return s.priority === 'you';
}

/**
 * Let the AI act until the human has a decision to make.
 * Your own spells resolve automatically once the opponent passes.
 */
export function runAI(s0: GameState, policy: AIPolicy = {}): GameState {
  let s = s0;
  for (let guard = 0; guard < 200; guard++) {
    if (s.winner || s.step === 'end') return s;
    // Auto-resolve your own spell after the opponent passes on it.
    if (s.priority === 'you' && s.passes === 1 && s.stack.length && s.stack[s.stack.length - 1].controller === 'you') {
      s = pass(s, 'you');
      continue;
    }
    // On the opponent's turn, pass automatically when you have nothing you could do.
    if (s.priority === 'you' && s.active === 'opp' && !s.stack.length && s.step !== 'blockers' && !hasInstantOptions(s, 'you')) {
      s = pass(s, 'you');
      continue;
    }
    // While the opponent is choosing blockers, hand priority back to it.
    if (s.priority === 'you' && s.step === 'blockers' && s.active === 'you' && !s.stack.length) {
      s = pass(s, 'you');
      continue;
    }
    if (waitingForUser(s)) return s;
    const next = aiStep(s, policy);
    if (next === s) return s;
    s = next;
  }
  return s;
}

