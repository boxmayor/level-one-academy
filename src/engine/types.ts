// Core types for the simplified Magic engine.
// The engine is deliberately small: two players, one turn (or one combat) at a time,
// a real stack with priority, combat with the common keywords, and a handful of effects.

export type Color = 'W' | 'U' | 'B' | 'R' | 'G';
export type ManaSym = Color | 'C';
export type Side = 'you' | 'opp';
export const other = (s: Side): Side => (s === 'you' ? 'opp' : 'you');

export type Keyword =
  | 'flying'
  | 'reach'
  | 'haste'
  | 'firstStrike'
  | 'deathtouch'
  | 'trample'
  | 'lifelink'
  | 'vigilance'
  | 'defender'
  | 'hexproof'
  | 'menace'
  | 'unblockable'
  | 'indestructible';

export type CardType = 'land' | 'creature' | 'instant' | 'sorcery' | 'enchantment' | 'artifact';

/** Who/what a spell or ability may target. Relative to the caster. */
export type TargetKind =
  | 'any' // any creature or player
  | 'creature'
  | 'yourCreature'
  | 'oppCreature'
  | 'player'
  | 'opponent'
  | 'attacker'
  | 'attackerOrBlocker'
  | 'permanent' // any nonland permanent
  | 'self' // the source of an ability (not targeted)
  | 'spell'
  | 'creatureSpell'
  | 'noncreatureSpell';

export interface TargetFilter {
  maxPower?: number;
  minPower?: number;
  maxToughness?: number;
  nonflying?: boolean;
}

export type Effect =
  | { kind: 'damage'; amount: number | 'X'; target: TargetKind; filter?: TargetFilter }
  | { kind: 'destroy'; target: TargetKind; filter?: TargetFilter; gainLife?: number }
  | { kind: 'exile'; target: TargetKind; filter?: TargetFilter }
  | { kind: 'bounce'; target: TargetKind; filter?: TargetFilter }
  | { kind: 'tap'; target: TargetKind }
  | { kind: 'pump'; power: number; toughness: number; keywords?: Keyword[]; target: TargetKind; untap?: boolean }
  | { kind: 'counters'; amount: number | 'X'; target: TargetKind }
  | { kind: 'counter'; target: 'spell' | 'creatureSpell' | 'noncreatureSpell' }
  | { kind: 'draw'; amount: number | 'X'; loseLife?: number }
  | { kind: 'gainLife'; amount: number }
  | { kind: 'drain'; amount: number }
  | { kind: 'tokens'; count: number; token: string }
  | { kind: 'discard'; amount: number }
  | { kind: 'wheel' }
  | { kind: 'wipe'; maxToughness?: number; minus?: number; damage?: number; nonflyingOnly?: boolean }
  | { kind: 'pumpTeam'; power: number; toughness: number; keywords?: Keyword[] }
  | { kind: 'modal'; modes: { label: string; effect: Effect }[] }
  | { kind: 'seq'; effects: Effect[] };

export interface Ability {
  /** Display text, e.g. "{2}{G}: Put a +1/+1 counter on this creature." */
  label: string;
  /** Mana cost of the ability ("" for none). */
  cost: string;
  tap?: boolean;
  /** Mana ability: tapping adds one mana of one of these. */
  mana?: ManaSym[];
  effect?: Effect;
  /** Creature lands: becomes a creature until end of turn. */
  animate?: { power: number; toughness: number; keywords?: Keyword[] };
  sorcery?: boolean;
}

export interface CardDef {
  name: string;
  cost?: string;
  types: CardType[];
  subtypes?: string[];
  power?: number;
  toughness?: number;
  keywords?: Keyword[];
  text?: string;
  flavor?: string;
  art: string;
  produces?: ManaSym[];
  entersTapped?: boolean;
  /** Tapping for colored mana deals 1 damage to you (pain lands). */
  painful?: boolean;
  effect?: Effect;
  etb?: Effect;
  abilities?: Ability[];
  /** Enters with X +1/+1 counters (X spells like "Formless Golem"). */
  xCounters?: boolean;
  token?: boolean;
  rarity?: 'common' | 'uncommon' | 'rare' | 'mythic';
  /** Shown as the card's "color identity" for rendering when it has no colored cost. */
  colorHint?: Color[];
}

export interface CardInst {
  uid: string;
  name: string;
}

export interface Permanent {
  uid: string;
  name: string;
  controller: Side;
  owner: Side;
  tapped: boolean;
  /** Came under control this turn (summoning sickness). */
  sick: boolean;
  damage: number;
  counters: number;
  eotPower: number;
  eotToughness: number;
  eotKeywords: Keyword[];
  animated?: { power: number; toughness: number; keywords: Keyword[] };
  deathtouched?: boolean;
  token?: boolean;
}

export interface PlayerState {
  life: number;
  hand: CardInst[];
  library: CardInst[];
  graveyard: CardInst[];
  landsPlayed: number;
  pool: ManaSym[];
  /** If true the UI shows this hand face down. */
  hiddenHand: boolean;
}

export type TargetRef =
  | { type: 'perm'; uid: string }
  | { type: 'player'; side: Side }
  | { type: 'stack'; id: string };

export interface StackItem {
  id: string;
  controller: Side;
  /** The card (for spells) or the source permanent's name (for abilities). */
  card: CardInst;
  isAbility: boolean;
  sourceUid?: string;
  effect: Effect | null;
  target?: TargetRef;
  mode?: number;
  x?: number;
  /** Creature spells: resolve into a permanent. */
  permanent?: boolean;
}

export type Step = 'main1' | 'attackers' | 'blockers' | 'combat' | 'main2' | 'end';

export interface Combat {
  attackers: string[];
  /** blocker uid -> attacker uid */
  blocks: Record<string, string>;
  /** attackers that had at least one blocker when blocks were declared */
  blocked: string[];
  blockersDeclared: boolean;
}

export interface GameEvents {
  died: { name: string; controller: Side; token: boolean }[];
  cast: { name: string; controller: Side }[];
  countered: { name: string; controller: Side }[];
  damageToPlayer: Record<Side, number>;
  lifeGained: Record<Side, number>;
  cardsDrawn: Record<Side, number>;
  bounced: { name: string; controller: Side }[];
  attacked: string[];
}

export interface LogEntry {
  side: Side | 'game';
  text: string;
}

export interface GameState {
  turn: number;
  active: Side;
  step: Step;
  priority: Side;
  passes: number;
  players: Record<Side, PlayerState>;
  battlefield: Permanent[];
  stack: StackItem[];
  combat: Combat | null;
  log: LogEntry[];
  winner: Side | 'draw' | null;
  nextId: number;
  events: GameEvents;
}

export interface CastOptions {
  target?: TargetRef;
  mode?: number;
  x?: number;
}
