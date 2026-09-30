import type { Keyword, Side } from './types';

// Pure combat-damage calculator. The engine and the AI both use it,
// so the AI's predictions always match what actually happens.

export interface CombatUnit {
  uid: string;
  side: Side;
  power: number;
  toughness: number;
  damage: number;
  keywords: Keyword[];
}

export interface CombatInput {
  units: Record<string, CombatUnit>;
  attackers: string[];
  /** blocker uid -> attacker uid */
  blocks: Record<string, string>;
  /** attackers that were blocked when blockers were declared (stay blocked even if the blocker leaves) */
  blocked: string[];
  defender: Side;
}

export interface CombatResult {
  damageToPlayer: Record<Side, number>;
  lifeGain: Record<Side, number>;
  /** final marked damage per unit */
  damage: Record<string, number>;
  dead: string[];
}

const has = (u: CombatUnit, k: Keyword) => u.keywords.includes(k);

export function isDeadUnit(u: CombatUnit, deathtouched: boolean): boolean {
  if (u.toughness <= 0) return true;
  if (has(u, 'indestructible')) return false;
  return u.damage >= u.toughness || (deathtouched && u.damage > 0);
}

export function resolveCombatDamage(input: CombatInput): CombatResult {
  const units: Record<string, CombatUnit> = {};
  for (const k of Object.keys(input.units)) units[k] = { ...input.units[k] };
  const res: CombatResult = { damageToPlayer: { you: 0, opp: 0 }, lifeGain: { you: 0, opp: 0 }, damage: {}, dead: [] };
  const dead = new Set<string>();
  const deathtouched = new Set<string>();
  const attackerSide: Side = input.defender === 'you' ? 'opp' : 'you';
  const attackers = input.attackers.filter((a) => units[a]);
  const blockersOf = (a: string) => Object.keys(input.blocks).filter((b) => input.blocks[b] === a && units[b]);
  const inCombat = [...attackers, ...Object.keys(input.blocks).filter((b) => units[b] && attackers.includes(input.blocks[b]))];
  const anyFirst = inCombat.some((u) => has(units[u], 'firstStrike'));
  const phases: ('first' | 'regular')[] = anyFirst ? ['first', 'regular'] : ['regular'];

  for (const phase of phases) {
    const deals = (u: CombatUnit) => (phase === 'first' ? has(u, 'firstStrike') : !has(u, 'firstStrike') || !anyFirst);
    const pending: Record<string, number> = {};
    const pendingDT = new Set<string>();
    const addDmg = (target: string, amt: number, src: CombatUnit) => {
      if (amt <= 0) return;
      pending[target] = (pending[target] ?? 0) + amt;
      if (has(src, 'deathtouch')) pendingDT.add(target);
    };

    for (const a of attackers) {
      const au = units[a];
      if (dead.has(a) || !deals(au) || au.power <= 0) continue;
      const bl = blockersOf(a).filter((b) => !dead.has(b));
      const wasBlocked = input.blocked.includes(a) || blockersOf(a).length > 0;
      if (!wasBlocked) {
        res.damageToPlayer[input.defender] += au.power;
        if (has(au, 'lifelink')) res.lifeGain[attackerSide] += au.power;
        continue;
      }
      if (bl.length === 0) {
        if (has(au, 'trample')) {
          res.damageToPlayer[input.defender] += au.power;
          if (has(au, 'lifelink')) res.lifeGain[attackerSide] += au.power;
        }
        continue;
      }
      // Assign lethal damage to blockers, easiest to kill first; excess tramples over or piles on.
      let remaining = au.power;
      const order = [...bl].sort((x, y) => lethalNeeded(units[x], au) - lethalNeeded(units[y], au));
      for (const b of order) {
        if (remaining <= 0) break;
        const need = lethalNeeded(units[b], au);
        const amt = Math.min(remaining, need);
        addDmg(b, amt, au);
        remaining -= amt;
      }
      if (remaining > 0) {
        if (has(au, 'trample')) res.damageToPlayer[input.defender] += remaining;
        else addDmg(order[0], remaining, au);
      }
      if (has(au, 'lifelink')) res.lifeGain[attackerSide] += au.power;
    }

    for (const b of Object.keys(input.blocks)) {
      const bu = units[b];
      const a = input.blocks[b];
      if (!bu || dead.has(b) || !deals(bu) || bu.power <= 0) continue;
      if (!units[a] || dead.has(a) || !attackers.includes(a)) continue;
      addDmg(a, bu.power, bu);
      if (has(bu, 'lifelink')) res.lifeGain[input.defender] += bu.power;
    }

    for (const [t, amt] of Object.entries(pending)) units[t].damage += amt;
    for (const t of pendingDT) deathtouched.add(t);
    for (const u of inCombat) {
      if (!dead.has(u) && isDeadUnit(units[u], deathtouched.has(u))) dead.add(u);
    }
  }

  for (const u of Object.keys(units)) res.damage[u] = units[u].damage;
  res.dead = [...dead];
  return res;
}

function lethalNeeded(b: CombatUnit, src: CombatUnit): number {
  if (has(src, 'deathtouch')) return b.damage > 0 && b.toughness - b.damage <= 0 ? 0 : 1;
  return Math.max(0, b.toughness - b.damage);
}
