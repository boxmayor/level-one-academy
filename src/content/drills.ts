import { getCard } from '../engine/cardpool';
import { resolveCombatDamage } from '../engine/combat';
import type { Keyword } from '../engine/types';

// Fast, generated drills for Puzzle Rush. Each one trains a single pattern
// (combat math, lethal counting, race math, card counting, keep/mulligan)
// and its answer is computed, so there is an endless supply.

export interface Drill {
  kind: string;
  prompt: string;
  options: string[];
  answer: number;
  explain: string;
  cards?: string[];
}

type Rand = () => number;
const ri = (r: Rand, lo: number, hi: number) => lo + Math.floor(r() * (hi - lo + 1));
const pickOne = <T,>(r: Rand, arr: T[]) => arr[Math.floor(r() * arr.length)];

const KW_TEXT: Partial<Record<Keyword, string>> = { firstStrike: 'first strike', deathtouch: 'deathtouch', indestructible: 'indestructible' };

function creatureText(p: number, t: number, kws: Keyword[]) {
  return `${p}/${t}${kws.length ? ` with ${kws.map((k) => KW_TEXT[k]).join(' and ')}` : ''}`;
}

export function combatDrill(r: Rand): Drill {
  const kwPool: Keyword[][] = [[], [], [], ['firstStrike'], ['deathtouch'], ['firstStrike', 'deathtouch'], ['indestructible']];
  const a = { p: ri(r, 1, 5), t: ri(r, 1, 5), k: pickOne(r, kwPool) };
  const b = { p: ri(r, 0, 5), t: ri(r, 1, 6), k: pickOne(r, kwPool.slice(0, 5)) };
  const res = resolveCombatDamage({
    units: {
      a: { uid: 'a', side: 'you', power: a.p, toughness: a.t, damage: 0, keywords: a.k },
      b: { uid: 'b', side: 'opp', power: b.p, toughness: b.t, damage: 0, keywords: b.k },
    },
    attackers: ['a'],
    blocks: { b: 'a' },
    blocked: ['a'],
    defender: 'opp',
  });
  const aDead = res.dead.includes('a');
  const bDead = res.dead.includes('b');
  const options = ['Only the attacker dies', 'Only the blocker dies', 'Both die', 'Neither dies'];
  const answer = aDead && bDead ? 2 : aDead ? 0 : bDead ? 1 : 3;
  return {
    kind: 'Combat math',
    prompt: `Your ${creatureText(a.p, a.t, a.k)} attacks. It's blocked by a ${creatureText(b.p, b.t, b.k)}. What happens?`,
    options,
    answer,
    explain: 'First strike deals damage first; deathtouch makes any damage lethal; indestructible creatures don\'t die from damage.',
  };
}

export function lethalDrill(r: Rand): Drill {
  const n = ri(r, 2, 4);
  const attackers = Array.from({ length: n }, () => ({ p: ri(r, 1, 4), fly: r() < 0.3 }));
  const blockers = ri(r, 0, 2);
  const burn = pickOne(r, [0, 0, 2, 3]);
  const ground = attackers.filter((x) => !x.fly).map((x) => x.p).sort((x, y) => y - x);
  const air = attackers.filter((x) => x.fly).reduce((s, x) => s + x.p, 0);
  const through = air + ground.slice(blockers).reduce((s, x) => s + x, 0) + burn;
  const life = Math.max(1, through + pickOne(r, [-1, 0, 0, 1, 2]));
  const lethal = through >= life;
  const desc = attackers.map((x) => `${x.p}-power${x.fly ? ' flier' : ''}`).join(', ');
  return {
    kind: 'Count lethal',
    prompt: `Opponent at ${life} life with ${blockers} untapped ground blocker${blockers === 1 ? '' : 's'} (no reach). You attack with: ${desc}.${burn ? ` You also hold a burn spell for ${burn}.` : ''} Is it lethal against their best blocks?`,
    options: ['Yes, lethal', 'No'],
    answer: lethal ? 0 : 1,
    explain: `Their best blocks stop your ${blockers} biggest ground attacker${blockers === 1 ? '' : 's'}. Damage that gets through: ${through}${burn ? ` (including ${burn} burn)` : ''} vs. ${life} life.`,
  };
}

export function raceDrill(r: Rand): Drill {
  const myLife = ri(r, 4, 15);
  const myDmg = ri(r, 2, 6);
  const oppLife = ri(r, 4, 15);
  const oppDmg = ri(r, 2, 6);
  const myTurns = Math.ceil(oppLife / myDmg);
  const oppTurns = Math.ceil(myLife / oppDmg);
  const iWin = myTurns <= oppTurns;
  return {
    kind: 'Race math',
    prompt: `It's your turn. You're at ${myLife} and deal ${myDmg} per attack. The opponent is at ${oppLife} and deals ${oppDmg} per attack. Nobody blocks. Who wins the race?`,
    options: ['You', 'The opponent'],
    answer: iWin ? 0 : 1,
    explain: `You need ${myTurns} attack${myTurns > 1 ? 's' : ''}; they need ${oppTurns}. You attack first, so you win ties.`,
  };
}

export function cardAdvantageDrill(r: Rand): Drill {
  const t = ri(r, 0, 3);
  let prompt = '';
  let net = 0;
  let explain = '';
  if (t === 0) {
    const n = ri(r, 1, 3);
    net = n - 1;
    prompt = `You cast a spell that draws ${n} card${n > 1 ? 's' : ''}. Net card advantage?`;
    explain = `You spent 1 card and gained ${n}.`;
  } else if (t === 1) {
    const n = ri(r, 1, 3);
    net = n - 1;
    prompt = `You cast a spell that makes the opponent discard ${n} card${n > 1 ? 's' : ''}. Net card advantage?`;
    explain = `You spent 1 card; they lost ${n}.`;
  } else if (t === 2) {
    const theirs = ri(r, 1, 4);
    const mine = ri(r, 0, 2);
    net = theirs - (mine + 1);
    prompt = `Your sweeper destroys ${theirs} of their creatures and ${mine} of yours. Net card advantage?`;
    explain = `You lost ${mine + 1} (the sweeper plus ${mine} creature${mine === 1 ? '' : 's'}); they lost ${theirs}.`;
  } else {
    net = -1;
    prompt = 'You cast a pump spell on your creature and the opponent kills the creature in response with one removal spell. Net card advantage?';
    explain = 'You lost 2 cards (creature and pump) to their 1: a 2-for-1 for them.';
  }
  const opts = [-2, -1, 0, 1, 2, 3];
  return {
    kind: 'Card counting',
    prompt,
    options: opts.map((o) => (o > 0 ? `+${o}` : `${o}`)),
    answer: opts.indexOf(net),
    explain,
  };
}

const LIMITED_DECK = [
  ...Array(9).fill('Forest'),
  ...Array(8).fill('Plains'),
  'Grizzly Cub',
  'Pack Wolf',
  'Forward Cleric',
  'Blade Knight',
  'Web Weaver',
  'Grove Warden',
  'Sky Griffin',
  'Dawn Acolyte',
  'Stalwart Irregulars',
  'Plainsrunner Lion',
  'Thornhide Rhino',
  'Watch Sentinel',
  'Elder Oak',
  'Radiant Angel',
  'Titanic Bloom',
  'Mighty Vault',
  'Righteous Verdict',
  'Titan\'s Surge',
  'Eager Squire',
  'Palisade Wall',
  'Bear\'s Rage',
  'Resolute Stand',
  'Grizzly Cub',
];

export function mulliganDrill(r: Rand): Drill {
  const deck = [...LIMITED_DECK];
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  const handCards = deck.slice(0, 7);
  const lands = handCards.filter((c) => getCard(c).types.includes('land')).length;
  const keep = lands >= 2 && lands <= 5;
  return {
    kind: 'Two-to-five lands',
    prompt: `40-card green-white Limited deck. Using the Two-to-Five Lands rule: keep or mulligan?`,
    options: ['Keep', 'Mulligan'],
    answer: keep ? 0 : 1,
    explain: `${lands} land${lands === 1 ? '' : 's'} in hand. Keep 2–5; mulligan 0, 1, 6 or 7.`,
    cards: handCards,
  };
}

const GENERATORS = [combatDrill, combatDrill, lethalDrill, raceDrill, cardAdvantageDrill, mulliganDrill];

export function randomDrill(r: Rand = Math.random): Drill {
  return pickOne(r, GENERATORS)(r);
}
