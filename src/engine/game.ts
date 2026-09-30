import { getCard } from './cardpool';
import { resolveCombatDamage, type CombatUnit } from './combat';
import { findPayment, manaOptions, parseCost } from './mana';
import {
  other,
  type CardDef,
  type CardInst,
  type CastOptions,
  type Effect,
  type GameState,
  type Keyword,
  type ManaSym,
  type Permanent,
  type Side,
  type StackItem,
  type TargetFilter,
  type TargetKind,
  type TargetRef,
} from './types';

// ---------------------------------------------------------------------------
// Basics

export function emptyState(): GameState {
  const player = () => ({ life: 20, hand: [], library: [], graveyard: [], landsPlayed: 0, pool: [], hiddenHand: false });
  return {
    turn: 1,
    active: 'you',
    step: 'main1',
    priority: 'you',
    passes: 0,
    players: { you: player(), opp: { ...player(), hiddenHand: true } },
    battlefield: [],
    stack: [],
    combat: null,
    log: [],
    winner: null,
    nextId: 1,
    events: {
      died: [],
      cast: [],
      countered: [],
      damageToPlayer: { you: 0, opp: 0 },
      lifeGained: { you: 0, opp: 0 },
      cardsDrawn: { you: 0, opp: 0 },
      bounced: [],
      attacked: [],
    },
  };
}

export const clone = (s: GameState): GameState => structuredClone(s);

export const sideName = (side: Side) => (side === 'you' ? 'You' : 'Opponent');

export function newUid(s: GameState, prefix = 'c'): string {
  return `${prefix}${s.nextId++}`;
}

export function log(s: GameState, side: Side | 'game', text: string) {
  s.log.push({ side, text });
}

export function findPerm(s: GameState, uid: string): Permanent | undefined {
  return s.battlefield.find((p) => p.uid === uid);
}

export function defOf(p: { name: string }): CardDef {
  return getCard(p.name);
}

export function isCreature(p: Permanent): boolean {
  return defOf(p).types.includes('creature') || !!p.animated;
}

export function isLand(p: Permanent): boolean {
  return defOf(p).types.includes('land');
}

export function basePower(p: Permanent): number {
  return p.animated ? p.animated.power : defOf(p).power ?? 0;
}

export function power(p: Permanent): number {
  return basePower(p) + p.counters + p.eotPower;
}

export function toughness(p: Permanent): number {
  const base = p.animated ? p.animated.toughness : defOf(p).toughness ?? 0;
  return base + p.counters + p.eotToughness;
}

export function keywords(p: Permanent): Keyword[] {
  const set = new Set<Keyword>([...(defOf(p).keywords ?? []), ...(p.animated?.keywords ?? []), ...p.eotKeywords]);
  return [...set];
}

export const hasKw = (p: Permanent, k: Keyword) => keywords(p).includes(k);

export function creatures(s: GameState, side?: Side): Permanent[] {
  return s.battlefield.filter((p) => isCreature(p) && (!side || p.controller === side));
}

export function describeTarget(s: GameState, t?: TargetRef): string {
  if (!t) return '';
  if (t.type === 'player') return t.side === 'you' ? 'you' : 'the opponent';
  if (t.type === 'perm') {
    const p = findPerm(s, t.uid);
    return p ? p.name : 'a creature';
  }
  const item = s.stack.find((i) => i.id === t.id);
  return item ? item.card.name : 'a spell';
}

// ---------------------------------------------------------------------------
// Zones

export function makePermanent(s: GameState, name: string, controller: Side, opts: Partial<Permanent> = {}): Permanent {
  const def = getCard(name);
  const p: Permanent = {
    uid: opts.uid ?? newUid(s, 'p'),
    name,
    controller,
    owner: opts.owner ?? controller,
    tapped: opts.tapped ?? !!def.entersTapped,
    sick: opts.sick ?? true,
    damage: 0,
    counters: opts.counters ?? 0,
    eotPower: 0,
    eotToughness: 0,
    eotKeywords: [],
    token: opts.token ?? !!def.token,
  };
  s.battlefield.push(p);
  return p;
}

function removePerm(s: GameState, uid: string): Permanent | undefined {
  const i = s.battlefield.findIndex((p) => p.uid === uid);
  if (i < 0) return undefined;
  const [p] = s.battlefield.splice(i, 1);
  if (s.combat) {
    s.combat.attackers = s.combat.attackers.filter((a) => a !== uid);
    for (const b of Object.keys(s.combat.blocks)) {
      if (b === uid || s.combat.blocks[b] === uid) delete s.combat.blocks[b];
    }
  }
  return p;
}

function toGraveyard(s: GameState, p: Permanent) {
  if (!p.token) s.players[p.owner].graveyard.push({ uid: p.uid, name: p.name });
}

export function destroyPerm(s: GameState, uid: string, reason = 'dies') {
  const p = removePerm(s, uid);
  if (!p) return;
  toGraveyard(s, p);
  s.events.died.push({ name: p.name, controller: p.controller, token: !!p.token });
  log(s, p.controller, `${p.name} ${reason}.`);
}

function exilePerm(s: GameState, uid: string) {
  const p = removePerm(s, uid);
  if (!p) return;
  s.events.died.push({ name: p.name, controller: p.controller, token: !!p.token });
  log(s, p.controller, `${p.name} is exiled.`);
}

function bouncePerm(s: GameState, uid: string) {
  const p = removePerm(s, uid);
  if (!p) return;
  s.events.bounced.push({ name: p.name, controller: p.controller });
  if (p.token) {
    log(s, p.controller, `${p.name} returns to hand and ceases to exist.`);
    return;
  }
  s.players[p.owner].hand.push({ uid: p.uid, name: p.name });
  log(s, p.controller, `${p.name} returns to its owner's hand.`);
}

export function drawCards(s: GameState, side: Side, n: number) {
  const pl = s.players[side];
  for (let i = 0; i < n; i++) {
    const c = pl.library.shift();
    if (!c) {
      log(s, side, `${sideName(side)} can't draw — the library is empty.`);
      return;
    }
    pl.hand.push(c);
    s.events.cardsDrawn[side]++;
  }
  if (n > 0) log(s, side, `${sideName(side)} draw${side === 'opp' ? 's' : ''} ${n} card${n === 1 ? '' : 's'}.`);
}

function loseLife(s: GameState, side: Side, n: number, damage = true) {
  if (n <= 0) return;
  s.players[side].life -= n;
  if (damage) s.events.damageToPlayer[side] += n;
}

function gainLife(s: GameState, side: Side, n: number) {
  if (n <= 0) return;
  s.players[side].life += n;
  s.events.lifeGained[side] += n;
}

// ---------------------------------------------------------------------------
// State-based actions

export function checkSBA(s: GameState) {
  let changed = true;
  while (changed) {
    changed = false;
    for (const p of [...s.battlefield]) {
      if (!isCreature(p)) continue;
      const t = toughness(p);
      const indestructible = hasKw(p, 'indestructible');
      if (t <= 0 || (!indestructible && (p.damage >= t || (p.deathtouched && p.damage > 0)))) {
        destroyPerm(s, p.uid);
        changed = true;
      }
    }
  }
  const youDead = s.players.you.life <= 0;
  const oppDead = s.players.opp.life <= 0;
  if (!s.winner && (youDead || oppDead)) {
    s.winner = youDead && oppDead ? 'draw' : youDead ? 'opp' : 'you';
    log(s, 'game', s.winner === 'draw' ? 'Both players lose — the game is a draw.' : `${sideName(s.winner as Side)} win${s.winner === 'opp' ? 's' : ''} the game!`);
  }
}

// ---------------------------------------------------------------------------
// Mana

export function tapForMana(s0: GameState, side: Side, uid: string, sym?: ManaSym): GameState {
  const s = clone(s0);
  const p = findPerm(s, uid);
  if (!p || p.controller !== side) return s0;
  const opts = manaOptions(p);
  if (!opts.length) return s0;
  const chosen = sym && opts.includes(sym) ? sym : opts[0];
  p.tapped = true;
  s.players[side].pool.push(chosen);
  if (defOf(p).painful && chosen !== 'C') {
    loseLife(s, side, 1);
    log(s, side, `${p.name} deals 1 damage to ${side === 'you' ? 'you' : 'the opponent'}.`);
    checkSBA(s);
  }
  return s;
}

function payCost(s: GameState, side: Side, cost: string | undefined, x: number, excludeUid?: string, excludeHandUid?: string): boolean {
  const pay = findPayment(s, side, cost, x, excludeUid, excludeHandUid);
  if (!pay) return false;
  const pool = s.players[side].pool;
  for (const i of [...pay.pool].sort((a, b) => b - a)) pool.splice(i, 1);
  let pain = 0;
  for (const t of pay.taps) {
    const p = findPerm(s, t.uid);
    if (p) p.tapped = true;
    if (t.pain) pain++;
  }
  if (pain) {
    loseLife(s, side, pain);
    log(s, side, `Pain lands deal ${pain} damage to ${side === 'you' ? 'you' : 'the opponent'}.`);
  }
  return true;
}

// ---------------------------------------------------------------------------
// Targeting

export interface TargetSpec {
  kind: TargetKind;
  filter?: TargetFilter;
}

export function effectTarget(effect: Effect | null | undefined, mode?: number): TargetSpec | null {
  if (!effect) return null;
  switch (effect.kind) {
    case 'damage':
    case 'destroy':
    case 'exile':
    case 'bounce':
      return { kind: effect.target, filter: effect.filter };
    case 'tap':
    case 'pump':
    case 'counters':
      return effect.target === 'self' ? null : { kind: effect.target };
    case 'counter':
      return { kind: effect.target };
    case 'modal':
      return mode === undefined ? null : effectTarget(effect.modes[mode]?.effect);
    case 'seq':
      for (const e of effect.effects) {
        const t = effectTarget(e);
        if (t) return t;
      }
      return null;
    default:
      return null;
  }
}

function passesFilter(p: Permanent, f?: TargetFilter): boolean {
  if (!f) return true;
  if (f.maxPower !== undefined && power(p) > f.maxPower) return false;
  if (f.minPower !== undefined && power(p) < f.minPower) return false;
  if (f.maxToughness !== undefined && toughness(p) > f.maxToughness) return false;
  if (f.nonflying && hasKw(p, 'flying')) return false;
  return true;
}

export function legalTargets(s: GameState, caster: Side, spec: TargetSpec, excludeStackId?: string): TargetRef[] {
  const out: TargetRef[] = [];
  const canTargetPerm = (p: Permanent) => !(hasKw(p, 'hexproof') && p.controller !== caster) && passesFilter(p, spec.filter);
  const creatureRefs = (pred: (p: Permanent) => boolean) => {
    for (const p of s.battlefield) if (isCreature(p) && pred(p) && canTargetPerm(p)) out.push({ type: 'perm', uid: p.uid });
  };
  const attacking = (p: Permanent) => !!s.combat?.attackers.includes(p.uid);
  const blocking = (p: Permanent) => !!s.combat && p.uid in s.combat.blocks;
  switch (spec.kind) {
    case 'any':
      creatureRefs(() => true);
      out.push({ type: 'player', side: other(caster) }, { type: 'player', side: caster });
      break;
    case 'creature':
      creatureRefs(() => true);
      break;
    case 'yourCreature':
      creatureRefs((p) => p.controller === caster);
      break;
    case 'oppCreature':
      creatureRefs((p) => p.controller !== caster);
      break;
    case 'attacker':
      creatureRefs(attacking);
      break;
    case 'attackerOrBlocker':
      creatureRefs((p) => attacking(p) || blocking(p));
      break;
    case 'permanent':
      for (const p of s.battlefield) if (!isLand(p) && canTargetPerm(p)) out.push({ type: 'perm', uid: p.uid });
      break;
    case 'player':
      out.push({ type: 'player', side: other(caster) }, { type: 'player', side: caster });
      break;
    case 'opponent':
      out.push({ type: 'player', side: other(caster) });
      break;
    case 'spell':
    case 'creatureSpell':
    case 'noncreatureSpell':
      for (const item of s.stack) {
        if (item.id === excludeStackId || item.isAbility) continue;
        const isCre = getCard(item.card.name).types.includes('creature');
        if (spec.kind === 'creatureSpell' && !isCre) continue;
        if (spec.kind === 'noncreatureSpell' && isCre) continue;
        out.push({ type: 'stack', id: item.id });
      }
      break;
    case 'self':
      break;
  }
  return out;
}

export const sameTarget = (a?: TargetRef, b?: TargetRef) => {
  if (!a || !b) return false;
  if (a.type !== b.type) return false;
  if (a.type === 'player' && b.type === 'player') return a.side === b.side;
  if (a.type === 'perm' && b.type === 'perm') return a.uid === b.uid;
  if (a.type === 'stack' && b.type === 'stack') return a.id === b.id;
  return false;
};

function isTargetLegal(s: GameState, caster: Side, spec: TargetSpec, t?: TargetRef): boolean {
  if (!t) return false;
  return legalTargets(s, caster, spec).some((r) => sameTarget(r, t));
}

// ---------------------------------------------------------------------------
// Timing

export function isSorcerySpeed(def: CardDef): boolean {
  return !def.types.includes('instant') && !def.types.includes('land');
}

function canActSorcery(s: GameState, side: Side): boolean {
  return s.active === side && (s.step === 'main1' || s.step === 'main2') && s.stack.length === 0 && s.priority === side;
}

function canActInstant(s: GameState, side: Side): boolean {
  return s.priority === side && s.step !== 'end' && s.step !== 'attackers' && !s.winner;
}

export interface Check {
  ok: boolean;
  reason?: string;
}

export function canPlayLand(s: GameState, side: Side, uid: string): Check {
  const card = s.players[side].hand.find((c) => c.uid === uid);
  if (!card) return { ok: false, reason: 'Not in hand.' };
  if (!getCard(card.name).types.includes('land')) return { ok: false, reason: 'Not a land.' };
  if (!canActSorcery(s, side)) return { ok: false, reason: 'You can only play lands in your main phase with an empty stack.' };
  if (s.players[side].landsPlayed >= 1) return { ok: false, reason: 'You already played a land this turn.' };
  return { ok: true };
}

export function playLand(s0: GameState, side: Side, uid: string): GameState {
  if (!canPlayLand(s0, side, uid).ok) return s0;
  const s = clone(s0);
  const pl = s.players[side];
  const i = pl.hand.findIndex((c) => c.uid === uid);
  const [card] = pl.hand.splice(i, 1);
  makePermanent(s, card.name, side, { uid: card.uid, sick: true });
  pl.landsPlayed++;
  log(s, side, `${sideName(side)} play${side === 'opp' ? 's' : ''} ${card.name}${getCard(card.name).entersTapped ? ' (enters tapped)' : ''}.`);
  return s;
}

export function canCast(s: GameState, side: Side, uid: string, opts: CastOptions = {}): Check {
  if (s.winner) return { ok: false, reason: 'The game is over.' };
  const card = s.players[side].hand.find((c) => c.uid === uid);
  if (!card) return { ok: false, reason: 'Not in hand.' };
  const def = getCard(card.name);
  if (def.types.includes('land')) return canPlayLand(s, side, uid);
  if (isSorcerySpeed(def) ? !canActSorcery(s, side) : !canActInstant(s, side)) {
    return { ok: false, reason: isSorcerySpeed(def) ? 'Sorcery-speed: only in your main phase with an empty stack.' : 'You don\'t have priority right now.' };
  }
  const x = opts.x ?? 0;
  if (!findPayment(s, side, def.cost, x)) return { ok: false, reason: 'Not enough mana.' };
  if (def.effect?.kind === 'modal' && opts.mode === undefined) return { ok: true };
  const spec = effectTarget(def.effect, opts.mode);
  if (spec) {
    const targets = legalTargets(s, side, spec);
    if (!targets.length) return { ok: false, reason: 'No legal targets.' };
    if (opts.target && !targets.some((t) => sameTarget(t, opts.target))) return { ok: false, reason: 'Illegal target.' };
  }
  return { ok: true };
}

export function castSpell(s0: GameState, side: Side, uid: string, opts: CastOptions = {}): GameState {
  const chk = canCast(s0, side, uid, opts);
  if (!chk.ok) throw new Error(`Can't cast: ${chk.reason}`);
  const s = clone(s0);
  const pl = s.players[side];
  const i = pl.hand.findIndex((c) => c.uid === uid);
  const card = pl.hand[i];
  const def = getCard(card.name);
  if (def.types.includes('land')) return playLand(s0, side, uid);
  const spec = effectTarget(def.effect, opts.mode);
  if (spec && !opts.target) throw new Error(`${card.name} needs a target.`);
  const x = opts.x ?? 0;
  payCost(s, side, def.cost, x, undefined, uid);
  pl.hand.splice(i, 1);
  const item: StackItem = {
    id: newUid(s, 's'),
    controller: side,
    card,
    isAbility: false,
    effect: def.effect ?? null,
    target: opts.target,
    mode: opts.mode,
    x,
    permanent: !def.types.includes('instant') && !def.types.includes('sorcery'),
  };
  s.stack.push(item);
  s.events.cast.push({ name: card.name, controller: side });
  const modeText = def.effect?.kind === 'modal' && opts.mode !== undefined ? ` (${def.effect.modes[opts.mode].label.replace(/\.$/, '')})` : '';
  const xText = parseCost(def.cost).hasX ? ` with X=${x}` : '';
  const tText = opts.target ? ` targeting ${describeTarget(s, opts.target)}` : '';
  log(s, side, `${sideName(side)} cast${side === 'opp' ? 's' : ''} ${card.name}${xText}${modeText}${tText}.`);
  checkSBA(s);
  s.passes = 0;
  s.priority = other(side);
  return s;
}

// ---------------------------------------------------------------------------
// Activated abilities

export function canActivate(s: GameState, side: Side, uid: string, idx: number, opts: CastOptions = {}): Check {
  if (s.winner) return { ok: false, reason: 'The game is over.' };
  const p = findPerm(s, uid);
  if (!p || p.controller !== side) return { ok: false, reason: 'Not your permanent.' };
  const ab = defOf(p).abilities?.[idx];
  if (!ab) return { ok: false, reason: 'No such ability.' };
  if (ab.mana) return manaOptions(p).length ? { ok: true } : { ok: false, reason: 'Can\'t tap for mana now.' };
  if (ab.sorcery ? !canActSorcery(s, side) : !canActInstant(s, side)) return { ok: false, reason: 'You can\'t activate that right now.' };
  if (ab.tap) {
    if (p.tapped) return { ok: false, reason: 'Already tapped.' };
    if (isCreature(p) && p.sick && !hasKw(p, 'haste')) return { ok: false, reason: 'Summoning sick — it can\'t use {T} abilities this turn.' };
  }
  if (ab.animate && p.animated) return { ok: false, reason: 'It\'s already a creature.' };
  if (!findPayment(s, side, ab.cost, opts.x ?? 0, ab.tap ? uid : undefined)) return { ok: false, reason: 'Not enough mana.' };
  const spec = effectTarget(ab.effect);
  if (spec && !legalTargets(s, side, spec).length) return { ok: false, reason: 'No legal targets.' };
  return { ok: true };
}

export function activate(s0: GameState, side: Side, uid: string, idx: number, opts: CastOptions = {}): GameState {
  const chk = canActivate(s0, side, uid, idx, opts);
  if (!chk.ok) throw new Error(`Can't activate: ${chk.reason}`);
  const p0 = findPerm(s0, uid)!;
  const ab = defOf(p0).abilities![idx];
  if (ab.mana) return tapForMana(s0, side, uid);
  const s = clone(s0);
  const p = findPerm(s, uid)!;
  // Don't tap the source for mana if other lands can pay (a creature land should stay untapped to attack or block).
  const avoidSelf = ab.tap || findPayment(s, side, ab.cost, opts.x ?? 0, uid) ? uid : undefined;
  payCost(s, side, ab.cost, opts.x ?? 0, avoidSelf);
  if (ab.tap) p.tapped = true;
  if (ab.animate) {
    // Simplification: animation resolves immediately.
    p.animated = { power: ab.animate.power, toughness: ab.animate.toughness, keywords: ab.animate.keywords ?? [] };
    log(s, side, `${p.name} becomes a ${ab.animate.power}/${ab.animate.toughness} creature until end of turn.`);
    return s;
  }
  const spec = effectTarget(ab.effect);
  if (spec && !opts.target) throw new Error('Ability needs a target.');
  s.stack.push({
    id: newUid(s, 's'),
    controller: side,
    card: { uid: p.uid, name: p.name },
    isAbility: true,
    sourceUid: p.uid,
    effect: ab.effect ?? null,
    target: opts.target,
    x: opts.x,
  });
  log(s, side, `${sideName(side)} activate${side === 'opp' ? 's' : ''} ${p.name}${opts.target ? ` targeting ${describeTarget(s, opts.target)}` : ''}.`);
  checkSBA(s);
  s.passes = 0;
  s.priority = other(side);
  return s;
}

// ---------------------------------------------------------------------------
// Resolution

function applyEffect(s: GameState, controller: Side, effect: Effect, item: StackItem) {
  const t = item.target;
  const x = item.x ?? 0;
  const targetPerm = () => (t && t.type === 'perm' ? findPerm(s, t.uid) : undefined);
  const selfPerm = () => (item.sourceUid ? findPerm(s, item.sourceUid) : undefined);
  switch (effect.kind) {
    case 'damage': {
      const amt = effect.amount === 'X' ? x : effect.amount;
      if (t?.type === 'player') {
        loseLife(s, t.side, amt);
        log(s, controller, `${item.card.name} deals ${amt} damage to ${t.side === 'you' ? 'you' : 'the opponent'}.`);
      } else {
        const p = targetPerm();
        if (p) {
          p.damage += amt;
          log(s, controller, `${item.card.name} deals ${amt} damage to ${p.name}.`);
        }
      }
      break;
    }
    case 'destroy': {
      const p = targetPerm();
      if (p) {
        if (hasKw(p, 'indestructible')) log(s, controller, `${p.name} is indestructible.`);
        else destroyPerm(s, p.uid, 'is destroyed');
      }
      if (effect.gainLife) gainLife(s, controller, effect.gainLife);
      break;
    }
    case 'exile': {
      const p = targetPerm();
      if (p) exilePerm(s, p.uid);
      break;
    }
    case 'bounce': {
      const p = targetPerm();
      if (p) bouncePerm(s, p.uid);
      break;
    }
    case 'tap': {
      const p = targetPerm();
      if (p) {
        p.tapped = true;
        log(s, controller, `${p.name} becomes tapped.`);
      }
      break;
    }
    case 'pump': {
      const p = effect.target === 'self' ? selfPerm() : targetPerm();
      if (p) {
        p.eotPower += effect.power;
        p.eotToughness += effect.toughness;
        if (effect.keywords) p.eotKeywords.push(...effect.keywords);
        if (effect.untap) p.tapped = false;
        const sign = (n: number) => (n >= 0 ? `+${n}` : `${n}`);
        const kw = effect.keywords?.length ? ` and gains ${effect.keywords.map(kwLabel).join(', ')}` : '';
        if (effect.power || effect.toughness) log(s, controller, `${p.name} gets ${sign(effect.power)}/${sign(effect.toughness)}${kw} until end of turn.`);
        else if (kw) log(s, controller, `${p.name}${kw} until end of turn.`);
      }
      break;
    }
    case 'counters': {
      const p = effect.target === 'self' ? selfPerm() : targetPerm();
      const amt = effect.amount === 'X' ? x : effect.amount;
      if (p) {
        p.counters += amt;
        log(s, controller, `${p.name} gets ${amt} +1/+1 counter${amt === 1 ? '' : 's'}.`);
      }
      break;
    }
    case 'counter': {
      if (t?.type === 'stack') {
        const i = s.stack.findIndex((it) => it.id === t.id);
        if (i >= 0) {
          const [countered] = s.stack.splice(i, 1);
          if (!countered.isAbility) s.players[countered.controller].graveyard.push(countered.card);
          s.events.countered.push({ name: countered.card.name, controller: countered.controller });
          log(s, controller, `${countered.card.name} is countered.`);
        }
      }
      break;
    }
    case 'draw': {
      drawCards(s, controller, effect.amount === 'X' ? x : effect.amount);
      if (effect.loseLife) {
        loseLife(s, controller, effect.loseLife, false);
        log(s, controller, `${sideName(controller)} lose${controller === 'opp' ? 's' : ''} ${effect.loseLife} life.`);
      }
      break;
    }
    case 'gainLife':
      gainLife(s, controller, effect.amount);
      log(s, controller, `${sideName(controller)} gain${controller === 'opp' ? 's' : ''} ${effect.amount} life.`);
      break;
    case 'drain':
      loseLife(s, other(controller), effect.amount, false);
      gainLife(s, controller, effect.amount);
      log(s, controller, `${sideName(other(controller))} lose${controller === 'you' ? 's' : ''} ${effect.amount} life; ${sideName(controller).toLowerCase()} gain${controller === 'opp' ? 's' : ''} ${effect.amount}.`);
      break;
    case 'tokens':
      for (let i = 0; i < effect.count; i++) makePermanent(s, effect.token, controller, { token: true, sick: true });
      log(s, controller, `${sideName(controller)} create${controller === 'opp' ? 's' : ''} ${effect.count} ${effect.token.replace(' Token', '')} token${effect.count === 1 ? '' : 's'}.`);
      break;
    case 'discard': {
      const victim = other(controller);
      const hand = s.players[victim].hand;
      const sorted = [...hand].sort((a, b) => cardValue(getCard(a.name)) - cardValue(getCard(b.name)));
      const gone = sorted.slice(0, effect.amount);
      for (const g of gone) {
        hand.splice(hand.findIndex((c) => c.uid === g.uid), 1);
        s.players[victim].graveyard.push(g);
      }
      log(s, victim, `${sideName(victim)} discard${victim === 'opp' ? 's' : ''} ${gone.length ? gone.map((g) => g.name).join(' and ') : 'nothing (empty hand)'}.`);
      break;
    }
    case 'wheel': {
      // Each player discards their hand, then draws cards equal to the greatest number discarded.
      const n = Math.max(s.players.you.hand.length, s.players.opp.hand.length);
      for (const side of ['you', 'opp'] as Side[]) {
        const pl = s.players[side];
        const k = pl.hand.length;
        pl.graveyard.push(...pl.hand);
        pl.hand = [];
        log(s, side, `${sideName(side)} discard${side === 'opp' ? 's' : ''} ${k} card${k === 1 ? '' : 's'}.`);
      }
      for (const side of ['you', 'opp'] as Side[]) drawCards(s, side, n);
      break;
    }
    case 'wipe': {
      const hit = creatures(s).filter((p) => !(effect.nonflyingOnly && hasKw(p, 'flying')));
      for (const p of hit) {
        if (effect.damage) p.damage += effect.damage;
        else if (effect.minus) {
          p.eotPower -= effect.minus;
          p.eotToughness -= effect.minus;
        } else if (!hasKw(p, 'indestructible')) destroyPerm(s, p.uid, 'is destroyed');
      }
      log(s, controller, `${item.card.name} sweeps the board.`);
      break;
    }
    case 'pumpTeam':
      for (const p of creatures(s, controller)) {
        p.eotPower += effect.power;
        p.eotToughness += effect.toughness;
        if (effect.keywords) p.eotKeywords.push(...effect.keywords);
      }
      log(s, controller, `Creatures ${controller === 'you' ? 'you control' : 'the opponent controls'} get +${effect.power}/+${effect.toughness}.`);
      break;
    case 'modal':
      if (item.mode !== undefined) applyEffect(s, controller, effect.modes[item.mode].effect, item);
      break;
    case 'seq':
      for (const e of effect.effects) applyEffect(s, controller, e, item);
      break;
  }
}

function resolveTop(s: GameState) {
  const item = s.stack.pop();
  if (!item) return;
  const def = getCard(item.card.name);
  // Fizzle check
  const spec = item.isAbility ? effectTarget(item.effect) : effectTarget(def.effect, item.mode);
  if (spec && !isTargetLegal(s, item.controller, spec, item.target)) {
    log(s, item.controller, `${item.card.name} fizzles — its target is gone or illegal.`);
    if (!item.isAbility) s.players[item.controller].graveyard.push(item.card);
    return;
  }
  if (item.permanent) {
    const p = makePermanent(s, item.card.name, item.controller, { uid: item.card.uid, sick: true, tapped: false });
    if (def.xCounters) p.counters = item.x ?? 0;
    log(s, item.controller, `${item.card.name} enters the battlefield${def.xCounters ? ` with ${item.x ?? 0} +1/+1 counters` : ''}.`);
    if (def.etb) applyEffect(s, item.controller, def.etb, { ...item, sourceUid: p.uid });
  } else if (item.effect) {
    applyEffect(s, item.controller, item.effect, item);
    if (!item.isAbility) s.players[item.controller].graveyard.push(item.card);
  }
  checkSBA(s);
}

// ---------------------------------------------------------------------------
// Priority and steps

export function pass(s0: GameState, side: Side): GameState {
  if (s0.priority !== side || s0.winner) return s0;
  const s = clone(s0);
  s.passes++;
  if (s.passes < 2) {
    s.priority = other(side);
    return s;
  }
  s.passes = 0;
  if (s.stack.length) {
    resolveTop(s);
    s.priority = s.active;
    return s;
  }
  advanceStep(s);
  return s;
}

function emptyPools(s: GameState) {
  s.players.you.pool = [];
  s.players.opp.pool = [];
}

export function canAttack(s: GameState, p: Permanent): boolean {
  return (
    isCreature(p) &&
    p.controller === s.active &&
    !p.tapped &&
    (!p.sick || hasKw(p, 'haste')) &&
    !hasKw(p, 'defender')
  );
}

function advanceStep(s: GameState) {
  emptyPools(s);
  switch (s.step) {
    case 'main1':
      if (creatures(s, s.active).some((p) => canAttack(s, p))) {
        s.step = 'attackers';
        s.priority = s.active;
      } else {
        s.step = 'main2';
        s.priority = s.active;
        log(s, 'game', 'No creatures can attack — skipping combat.');
      }
      break;
    case 'blockers':
      // Both passed without blocks declared: the defender still has to declare.
      s.priority = other(s.active);
      break;
    case 'combat':
      combatDamage(s);
      s.step = 'main2';
      s.priority = s.active;
      break;
    case 'main2':
      endStep(s);
      break;
    default:
      break;
  }
}

/** Active player moves from main phase 1 to declaring attackers (both players pass). */
export function goToCombat(s0: GameState): GameState {
  if (s0.step !== 'main1' || s0.stack.length) return s0;
  const s = clone(s0);
  s.passes = 0;
  advanceStep(s);
  return s;
}

export function declareAttackers(s0: GameState, uids: string[]): GameState {
  if (s0.step !== 'attackers') throw new Error('Not declaring attackers now.');
  const s = clone(s0);
  const valid = uids.filter((u) => {
    const p = findPerm(s, u);
    return p && canAttack(s, p);
  });
  s.combat = { attackers: valid, blocks: {}, blocked: [], blockersDeclared: false };
  s.events.attacked.push(...valid.map((u) => findPerm(s, u)!.name));
  for (const u of valid) {
    const p = findPerm(s, u)!;
    if (!hasKw(p, 'vigilance')) p.tapped = true;
  }
  if (!valid.length) {
    log(s, s.active, `${sideName(s.active)} attack${s.active === 'opp' ? 's' : ''} with nothing.`);
    s.combat = null;
    s.step = 'main2';
    s.priority = s.active;
    s.passes = 0;
    return s;
  }
  log(s, s.active, `${sideName(s.active)} attack${s.active === 'opp' ? 's' : ''} with ${valid.map((u) => findPerm(s, u)!.name).join(', ')}.`);
  s.step = 'blockers';
  s.priority = other(s.active);
  s.passes = 0;
  return s;
}

export function canBlock(s: GameState, blocker: Permanent, attacker: Permanent): boolean {
  if (!isCreature(blocker) || blocker.tapped || blocker.controller === s.active) return false;
  if (hasKw(attacker, 'unblockable')) return false;
  if (hasKw(attacker, 'flying') && !hasKw(blocker, 'flying') && !hasKw(blocker, 'reach')) return false;
  return true;
}

export function blockProblem(s: GameState, blocks: Record<string, string>): string | null {
  for (const [b, a] of Object.entries(blocks)) {
    const bp = findPerm(s, b);
    const ap = findPerm(s, a);
    if (!bp || !ap) return 'A blocker or attacker is missing.';
    if (!s.combat?.attackers.includes(a)) return `${ap.name} isn't attacking.`;
    if (!canBlock(s, bp, ap)) return `${bp.name} can't block ${ap.name}.`;
  }
  for (const a of s.combat?.attackers ?? []) {
    const ap = findPerm(s, a);
    const n = Object.values(blocks).filter((x) => x === a).length;
    if (ap && hasKw(ap, 'menace') && n === 1) return `${ap.name} has menace — it needs two or more blockers.`;
  }
  return null;
}

export function declareBlockers(s0: GameState, blocks: Record<string, string>): GameState {
  if (s0.step !== 'blockers' || s0.stack.length) throw new Error('Not declaring blockers now.');
  const problem = blockProblem(s0, blocks);
  if (problem) throw new Error(problem);
  const s = clone(s0);
  s.combat!.blocks = { ...blocks };
  s.combat!.blocked = [...new Set(Object.values(blocks))];
  s.combat!.blockersDeclared = true;
  const defender = other(s.active);
  const lines = Object.entries(blocks).map(([b, a]) => `${findPerm(s, b)!.name} blocks ${findPerm(s, a)!.name}`);
  log(s, defender, lines.length ? `${lines.join('; ')}.` : `${sideName(defender)} ${defender === 'you' ? "don't" : "doesn't"} block.`);
  s.step = 'combat';
  s.priority = s.active;
  s.passes = 0;
  return s;
}

export function combatUnits(s: GameState): Record<string, CombatUnit> {
  const units: Record<string, CombatUnit> = {};
  for (const p of creatures(s)) {
    units[p.uid] = { uid: p.uid, side: p.controller, power: power(p), toughness: toughness(p), damage: p.damage, keywords: keywords(p) };
  }
  return units;
}

function combatDamage(s: GameState) {
  const c = s.combat;
  if (!c) return;
  const defender = other(s.active);
  const res = resolveCombatDamage({ units: combatUnits(s), attackers: c.attackers, blocks: c.blocks, blocked: c.blocked, defender });
  for (const p of creatures(s)) {
    if (res.damage[p.uid] !== undefined && res.damage[p.uid] !== p.damage) p.damage = res.damage[p.uid];
  }
  const dmg = res.damageToPlayer[defender];
  if (dmg > 0) {
    loseLife(s, defender, dmg);
    log(s, s.active, `Combat: ${dmg} damage to ${defender === 'you' ? 'you' : 'the opponent'}.`);
  } else {
    log(s, s.active, 'Combat damage is dealt.');
  }
  for (const side of ['you', 'opp'] as Side[]) {
    if (res.lifeGain[side]) gainLife(s, side, res.lifeGain[side]);
  }
  for (const uid of res.dead) {
    const p = findPerm(s, uid);
    if (p) destroyPerm(s, uid);
  }
  s.combat = null;
  checkSBA(s);
}

function endStep(s: GameState) {
  s.step = 'end';
  for (const p of s.battlefield) {
    p.damage = 0;
    p.eotPower = 0;
    p.eotToughness = 0;
    p.eotKeywords = [];
    p.animated = undefined;
    p.deathtouched = false;
  }
  s.combat = null;
  emptyPools(s);
  log(s, 'game', `End of ${s.active === 'you' ? 'your' : "the opponent's"} turn.`);
  checkSBA(s);
}

/** Skip straight to the end of the turn (both players pass through every step). */
export function endTurn(s0: GameState): GameState {
  let s = s0;
  let guard = 0;
  while (!s.winner && s.step !== 'end' && guard++ < 50) {
    if (s.step === 'attackers') s = declareAttackers(s, []);
    else if (s.step === 'blockers') s = declareBlockers(s, {});
    else s = pass(s, s.priority);
  }
  return s;
}

export function startTurn(s0: GameState, side: Side, draw = true): GameState {
  const s = clone(s0);
  s.turn++;
  s.active = side;
  s.step = 'main1';
  s.priority = side;
  s.passes = 0;
  s.combat = null;
  s.players[side].landsPlayed = 0;
  for (const p of s.battlefield) {
    if (p.controller === side) {
      p.tapped = false;
      p.sick = false;
    }
  }
  log(s, 'game', `${side === 'you' ? 'Your' : "The opponent's"} turn begins.`);
  if (draw) drawCards(s, side, 1);
  return s;
}

// ---------------------------------------------------------------------------
// Helpers

export function kwLabel(k: Keyword): string {
  return (
    {
      flying: 'flying',
      reach: 'reach',
      haste: 'haste',
      firstStrike: 'first strike',
      deathtouch: 'deathtouch',
      trample: 'trample',
      lifelink: 'lifelink',
      vigilance: 'vigilance',
      defender: 'defender',
      hexproof: 'hexproof',
      menace: 'menace',
      unblockable: "can't be blocked",
      indestructible: 'indestructible',
    } as Record<Keyword, string>
  )[k];
}

/** Rough "how good is this card" number, used by the AI to pick discards. */
export function cardValue(def: CardDef): number {
  if (def.types.includes('land')) return 1;
  const mv = parseCost(def.cost).generic + parseCost(def.cost).colored.length;
  return 2 + mv;
}

/** Can this side do anything at instant speed right now (cast an instant or activate an ability)? */
export function hasInstantOptions(s: GameState, side: Side): boolean {
  for (const c of s.players[side].hand) {
    const def = getCard(c.name);
    if (def.types.includes('instant') && canCast(s, side, c.uid).ok) return true;
  }
  for (const p of s.battlefield) {
    if (p.controller !== side) continue;
    const abs = defOf(p).abilities ?? [];
    for (let i = 0; i < abs.length; i++) {
      if (abs[i].mana) continue;
      if (canActivate(s, side, p.uid, i).ok) return true;
    }
  }
  return false;
}

export function handCard(s: GameState, side: Side, name: string, nth = 1): CardInst | undefined {
  return s.players[side].hand.filter((c) => c.name === name)[nth - 1];
}
