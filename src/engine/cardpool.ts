import type { CardDef } from './types';

// Original card names. Each one is modeled on a card that Reid Duke uses as an example
// in the Level One course (noted in comments), simplified to fit this engine.

const lands: CardDef[] = [
  { name: 'Plains', types: ['land'], subtypes: ['Basic'], produces: ['W'], art: '☀️', text: '{T}: Add {W}.' },
  { name: 'Island', types: ['land'], subtypes: ['Basic'], produces: ['U'], art: '💧', text: '{T}: Add {U}.' },
  { name: 'Swamp', types: ['land'], subtypes: ['Basic'], produces: ['B'], art: '💀', text: '{T}: Add {B}.' },
  { name: 'Mountain', types: ['land'], subtypes: ['Basic'], produces: ['R'], art: '⛰️', text: '{T}: Add {R}.' },
  { name: 'Forest', types: ['land'], subtypes: ['Basic'], produces: ['G'], art: '🌲', text: '{T}: Add {G}.' },
  // Tapped dual lands (e.g. Scoured Barrens, Temples)
  { name: 'Sunlit Causeway', types: ['land'], produces: ['W', 'U'], entersTapped: true, art: '🌅', text: 'Enters tapped.\n{T}: Add {W} or {U}.' },
  { name: 'Gloomwater Grotto', types: ['land'], produces: ['U', 'B'], entersTapped: true, art: '🌊', text: 'Enters tapped.\n{T}: Add {U} or {B}.' },
  { name: 'Ashen Crossing', types: ['land'], produces: ['B', 'R'], entersTapped: true, art: '🌋', text: 'Enters tapped.\n{T}: Add {B} or {R}.' },
  { name: 'Wildfire Pass', types: ['land'], produces: ['R', 'G'], entersTapped: true, art: '🏞️', text: 'Enters tapped.\n{T}: Add {R} or {G}.' },
  { name: 'Verdant Terrace', types: ['land'], produces: ['G', 'W'], entersTapped: true, art: '🌿', text: 'Enters tapped.\n{T}: Add {G} or {W}.' },
  { name: 'Duskfield Abbey', types: ['land'], produces: ['W', 'B'], entersTapped: true, art: '⛪', text: 'Enters tapped.\n{T}: Add {W} or {B}.' },
  { name: 'Mirehollow', types: ['land'], produces: ['B', 'G'], entersTapped: true, art: '🍄', text: 'Enters tapped.\n{T}: Add {B} or {G}.' },
  { name: 'Tri-Clan Citadel', types: ['land'], produces: ['W', 'B', 'G'], entersTapped: true, art: '🏯', text: 'Enters tapped.\n{T}: Add {W}, {B} or {G}.' },
  // Pain lands (e.g. Caves of Koilos, Mana Confluence)
  { name: 'Scorched Bastion', types: ['land'], produces: ['C', 'R', 'W'], painful: true, art: '🏜️', text: '{T}: Add {C}.\n{T}: Add {R} or {W}. This deals 1 damage to you.' },
  { name: 'Prismatic Well', types: ['land'], produces: ['W', 'U', 'B', 'R', 'G'], painful: true, art: '🔮', text: '{T}: Add one mana of any color. This deals 1 damage to you.' },
  // Creature lands (e.g. Lumbering Falls, Mishra's Factory)
  {
    name: 'Cascade Falls',
    types: ['land'],
    produces: ['G', 'U'],
    entersTapped: true,
    art: '💦',
    colorHint: ['G', 'U'],
    text: 'Enters tapped.\n{T}: Add {G} or {U}.\n{2}{G}{U}: Becomes a 3/3 Elemental creature with hexproof until end of turn. It\'s still a land.',
    abilities: [
      { label: '{2}{G}{U}: Becomes a 3/3 hexproof creature until end of turn.', cost: '{2}{G}{U}', animate: { power: 3, toughness: 3, keywords: ['hexproof'] } },
    ],
  },
  {
    name: 'Old Foundry',
    types: ['land'],
    produces: ['C'],
    art: '⚙️',
    text: '{T}: Add {C}.\n{1}: Becomes a 2/2 Construct creature until end of turn. It\'s still a land.',
    abilities: [{ label: '{1}: Becomes a 2/2 creature until end of turn.', cost: '{1}', animate: { power: 2, toughness: 2 } }],
  },
];

const creatures: CardDef[] = [
  // White
  { name: 'Eager Squire', cost: '{W}', types: ['creature'], subtypes: ['Human', 'Soldier'], power: 2, toughness: 1, art: '🛡️', text: '', flavor: 'First to the field, first to the fight.' },
  { name: 'Forward Cleric', cost: '{1}{W}', types: ['creature'], subtypes: ['Human', 'Cleric'], power: 2, toughness: 2, art: '🙏', text: '', flavor: 'A fair fighter for a fair price.' },
  { name: 'Blade Knight', cost: '{1}{W}', types: ['creature'], subtypes: ['Human', 'Knight'], power: 2, toughness: 2, keywords: ['firstStrike'], art: '⚔️', text: 'First strike' },
  { name: 'Dawn Acolyte', cost: '{2}{W}', types: ['creature'], subtypes: ['Human', 'Monk'], power: 2, toughness: 3, keywords: ['lifelink'], art: '✨', text: 'Lifelink' },
  { name: 'Sky Griffin', cost: '{2}{W}', types: ['creature'], subtypes: ['Griffin'], power: 2, toughness: 2, keywords: ['flying'], art: '🦅', text: 'Flying' },
  { name: 'Palisade Wall', cost: '{1}{W}', types: ['creature'], subtypes: ['Wall'], power: 0, toughness: 5, keywords: ['defender'], art: '🧱', text: 'Defender' },
  { name: 'Stalwart Irregulars', cost: '{2}{W}{W}', types: ['creature'], subtypes: ['Human', 'Soldier'], power: 4, toughness: 4, art: '🏰', text: '' },
  { name: 'Watch Sentinel', cost: '{5}{W}', types: ['creature'], subtypes: ['Zombie', 'Soldier'], power: 4, toughness: 6, keywords: ['vigilance'], art: '🗿', text: 'Vigilance' },
  { name: 'Radiant Angel', cost: '{3}{W}{W}', types: ['creature'], subtypes: ['Angel'], power: 4, toughness: 4, keywords: ['flying', 'vigilance'], art: '👼', text: 'Flying, vigilance', rarity: 'mythic' },
  // Blue
  { name: 'Tide Sprite', cost: '{1}{U}', types: ['creature'], subtypes: ['Faerie'], power: 1, toughness: 1, keywords: ['flying'], art: '🧚', text: 'Flying' },
  { name: 'Harbor Turtle', cost: '{1}{U}', types: ['creature'], subtypes: ['Turtle'], power: 1, toughness: 4, art: '🐢', text: '' },
  { name: 'Tower Spirit', cost: '{3}{U}', types: ['creature'], subtypes: ['Spirit'], power: 2, toughness: 2, keywords: ['flying'], etb: { kind: 'draw', amount: 1 }, art: '👻', text: 'Flying\nWhen Tower Spirit enters, draw a card.' },
  { name: 'Mistcloak Serpent', cost: '{4}{U}{U}', types: ['creature'], subtypes: ['Serpent'], power: 5, toughness: 5, keywords: ['hexproof'], art: '🐍', text: 'Hexproof', rarity: 'rare' },
  { name: 'Sphinx Oracle', cost: '{4}{U}{U}', types: ['creature'], subtypes: ['Sphinx'], power: 5, toughness: 5, keywords: ['flying'], etb: { kind: 'draw', amount: 2 }, art: '🦁', text: 'Flying\nWhen Sphinx Oracle enters, draw two cards.', rarity: 'mythic' },
  // Black
  { name: 'Vampire Pup', cost: '{B}', types: ['creature'], subtypes: ['Vampire'], power: 2, toughness: 1, art: '🦇', text: '' },
  { name: 'Bog Viper', cost: '{1}{B}', types: ['creature'], subtypes: ['Snake'], power: 1, toughness: 1, keywords: ['deathtouch'], art: '🐍', text: 'Deathtouch' },
  { name: 'Crypt Shambler', cost: '{2}{B}', types: ['creature'], subtypes: ['Zombie'], power: 2, toughness: 3, art: '🧟', text: '' },
  { name: 'Night Stalker', cost: '{3}{B}', types: ['creature'], subtypes: ['Horror'], power: 3, toughness: 3, keywords: ['menace'], art: '🌘', text: 'Menace (can\'t be blocked except by two or more creatures)' },
  { name: 'Carrion Drake', cost: '{3}{B}{B}', types: ['creature'], subtypes: ['Drake'], power: 4, toughness: 4, keywords: ['flying'], art: '🐲', text: 'Flying', rarity: 'rare' },
  // Red
  { name: 'Ember Goblin', cost: '{R}', types: ['creature'], subtypes: ['Goblin'], power: 1, toughness: 1, keywords: ['haste'], art: '👺', text: 'Haste' },
  {
    name: 'Spark Slinger',
    cost: '{R}',
    types: ['creature'],
    subtypes: ['Goblin'],
    power: 1,
    toughness: 1,
    art: '🧨',
    text: '{T}: Spark Slinger deals 1 damage to target player.',
    abilities: [{ label: '{T}: Deal 1 damage to target player.', cost: '', tap: true, effect: { kind: 'damage', amount: 1, target: 'player' } }],
  },
  {
    name: 'Bellows Salamander',
    cost: '{R}',
    types: ['creature'],
    subtypes: ['Salamander'],
    power: 1,
    toughness: 1,
    art: '🦎',
    text: '{1}{R}: Bellows Salamander gets +1/+0 until end of turn.',
    abilities: [{ label: '{1}{R}: +1/+0 until end of turn.', cost: '{1}{R}', effect: { kind: 'pump', power: 1, toughness: 0, target: 'self' } }],
  },
  { name: 'Furnace Hound', cost: '{1}{R}', types: ['creature'], subtypes: ['Hound'], power: 2, toughness: 1, keywords: ['haste'], art: '🐕', text: 'Haste' },
  { name: 'Mogg Brute', cost: '{2}{R}', types: ['creature'], subtypes: ['Ogre'], power: 3, toughness: 2, keywords: ['menace'], art: '👹', text: 'Menace (can\'t be blocked except by two or more creatures)' },
  { name: 'Cliff Giant', cost: '{3}{R}', types: ['creature'], subtypes: ['Giant'], power: 3, toughness: 3, art: '🗻', text: '' },
  { name: 'Stormcrest Dragon', cost: '{3}{R}{R}', types: ['creature'], subtypes: ['Dragon'], power: 4, toughness: 4, keywords: ['flying', 'haste'], art: '🐉', text: 'Flying, haste', rarity: 'rare' },
  {
    name: 'Crimson Drake',
    cost: '{4}{R}{R}',
    types: ['creature'],
    subtypes: ['Dragon'],
    power: 5,
    toughness: 5,
    keywords: ['flying'],
    art: '🔥',
    rarity: 'rare',
    text: 'Flying\n{R}: Crimson Drake gets +1/+0 until end of turn.',
    abilities: [{ label: '{R}: +1/+0 until end of turn.', cost: '{R}', effect: { kind: 'pump', power: 1, toughness: 0, target: 'self' } }],
  },
  {
    name: 'Magma Brute',
    cost: '{5}{R}',
    types: ['creature'],
    subtypes: ['Elemental'],
    power: 6,
    toughness: 4,
    art: '🌋',
    text: '{2}{R}: Magma Brute deals 1 damage to target player.',
    abilities: [{ label: '{2}{R}: Deal 1 damage to target player.', cost: '{2}{R}', effect: { kind: 'damage', amount: 1, target: 'player' } }],
  },
  // Green
  {
    name: 'Mana Elf',
    cost: '{G}',
    types: ['creature'],
    subtypes: ['Elf', 'Druid'],
    power: 1,
    toughness: 1,
    art: '🧝',
    text: '{T}: Add {G}.',
    abilities: [{ label: '{T}: Add {G}.', cost: '', tap: true, mana: ['G'] }],
  },
  { name: 'Grizzly Cub', cost: '{1}{G}', types: ['creature'], subtypes: ['Bear'], power: 2, toughness: 2, art: '🐻', text: '' },
  { name: 'Pack Wolf', cost: '{1}{G}', types: ['creature'], subtypes: ['Wolf'], power: 2, toughness: 2, art: '🐺', text: '' },
  { name: 'Web Weaver', cost: '{2}{G}', types: ['creature'], subtypes: ['Spider'], power: 1, toughness: 4, keywords: ['reach'], art: '🕷️', text: 'Reach' },
  {
    name: 'Grove Warden',
    cost: '{2}{G}',
    types: ['creature'],
    subtypes: ['Treefolk'],
    power: 3,
    toughness: 3,
    art: '🌳',
    text: '{3}{G}: Put a +1/+1 counter on Grove Warden.',
    abilities: [{ label: '{3}{G}: Put a +1/+1 counter on it.', cost: '{3}{G}', effect: { kind: 'counters', amount: 1, target: 'self' } }],
  },
  { name: 'Thornhide Rhino', cost: '{4}{G}', types: ['creature'], subtypes: ['Rhino'], power: 4, toughness: 4, keywords: ['trample'], art: '🦏', text: 'Trample' },
  { name: 'Elder Oak', cost: '{4}{G}{G}', types: ['creature'], subtypes: ['Treefolk'], power: 5, toughness: 6, keywords: ['reach'], art: '🌲', text: 'Reach' },
  { name: 'Wildborn Hydra', cost: '{X}{G}{G}', types: ['creature'], subtypes: ['Hydra'], power: 0, toughness: 0, keywords: ['trample'], xCounters: true, art: '🐉', text: 'Trample\nWildborn Hydra enters with X +1/+1 counters.', rarity: 'rare' },
  // Multicolor
  { name: 'Plainsrunner Lion', cost: '{G}{W}', types: ['creature'], subtypes: ['Cat'], power: 3, toughness: 3, art: '🦁', text: '', rarity: 'rare' },
  { name: 'Clan Warlord', cost: '{W}{B}{G}', types: ['creature'], subtypes: ['Human', 'Warrior'], power: 4, toughness: 4, art: '🪓', text: '', rarity: 'mythic' },
  {
    name: 'Siegehorn Rhino',
    cost: '{1}{W}{B}{G}',
    types: ['creature'],
    subtypes: ['Rhino'],
    power: 4,
    toughness: 5,
    keywords: ['trample'],
    etb: { kind: 'drain', amount: 3 },
    art: '🦏',
    rarity: 'rare',
    text: 'Trample\nWhen Siegehorn Rhino enters, each opponent loses 3 life and you gain 3 life.',
  },
  // Colorless
  { name: 'Formless Golem', cost: '{X}', types: ['creature'], subtypes: ['Construct'], power: 0, toughness: 0, xCounters: true, art: '🗿', text: 'Formless Golem enters with X +1/+1 counters.', rarity: 'rare' },
  {
    name: 'Scholar\'s Tome',
    cost: '{4}',
    types: ['artifact'],
    art: '📘',
    text: '{4}, {T}: Draw a card.',
    abilities: [{ label: '{4}, {T}: Draw a card.', cost: '{4}', tap: true, effect: { kind: 'draw', amount: 1 } }],
  },
];

const tokens: CardDef[] = [
  { name: 'Goblin Token', types: ['creature'], subtypes: ['Goblin'], power: 1, toughness: 1, art: '👺', token: true, colorHint: ['R'], text: '' },
  { name: 'Soldier Token', types: ['creature'], subtypes: ['Soldier'], power: 1, toughness: 1, art: '🪖', token: true, colorHint: ['W'], text: '' },
  { name: 'Spirit Token', types: ['creature'], subtypes: ['Spirit'], power: 1, toughness: 1, keywords: ['flying'], art: '👻', token: true, colorHint: ['W'], text: 'Flying' },
];

const spells: CardDef[] = [
  // Red
  { name: 'Spark Jolt', cost: '{R}', types: ['instant'], art: '⚡', effect: { kind: 'damage', amount: 2, target: 'any' }, text: 'Spark Jolt deals 2 damage to any target.' },
  { name: 'Lightning Lance', cost: '{1}{R}', types: ['instant'], art: '🌩️', effect: { kind: 'damage', amount: 3, target: 'any' }, text: 'Lightning Lance deals 3 damage to any target.' },
  { name: 'Scorching Blast', cost: '{2}{R}', types: ['instant'], art: '☄️', effect: { kind: 'damage', amount: 4, target: 'any' }, text: 'Scorching Blast deals 4 damage to any target.' },
  { name: 'Crater Blast', cost: '{X}{R}', types: ['sorcery'], art: '💥', effect: { kind: 'damage', amount: 'X', target: 'any' }, text: 'Crater Blast deals X damage to any target.', rarity: 'rare' },
  { name: 'Goblin Rally', cost: '{1}{R}', types: ['sorcery'], art: '🎺', effect: { kind: 'tokens', count: 2, token: 'Goblin Token' }, text: 'Create two 1/1 red Goblin creature tokens.' },
  { name: 'Tremor Rift', cost: '{2}{R}', types: ['sorcery'], art: '🌍', effect: { kind: 'wipe', damage: 2, nonflyingOnly: true }, text: 'Tremor Rift deals 2 damage to each creature without flying.' },
  { name: 'War Horn', cost: '{2}{R}', types: ['instant'], art: '📯', effect: { kind: 'pumpTeam', power: 2, toughness: 0 }, text: 'Creatures you control get +2/+0 until end of turn.' },
  // Blue
  { name: 'Wash Away', cost: '{1}{U}', types: ['instant'], art: '🌀', effect: { kind: 'bounce', target: 'creature' }, text: 'Return target creature to its owner\'s hand.' },
  { name: 'Dissolve Thought', cost: '{1}{U}{U}', types: ['instant'], art: '🚫', effect: { kind: 'counter', target: 'spell' }, text: 'Counter target spell.' },
  { name: 'Deny Magic', cost: '{1}{U}', types: ['instant'], art: '🛑', effect: { kind: 'counter', target: 'noncreatureSpell' }, text: 'Counter target noncreature spell.' },
  { name: 'Scatter Essence', cost: '{1}{U}', types: ['instant'], art: '💨', effect: { kind: 'counter', target: 'creatureSpell' }, text: 'Counter target creature spell.' },
  { name: 'Scholar\'s Insight', cost: '{2}{U}', types: ['sorcery'], art: '📚', effect: { kind: 'draw', amount: 2 }, text: 'Draw two cards.' },
  { name: 'Deep Study', cost: '{3}{U}{U}', types: ['instant'], art: '📖', effect: { kind: 'draw', amount: 3 }, text: 'Draw three cards.' },
  { name: 'Lull to Sleep', cost: '{1}{U}', types: ['instant'], art: '😴', effect: { kind: 'tap', target: 'creature' }, text: 'Tap target creature.' },
  // Black
  { name: 'Hero\'s Ruin', cost: '{1}{B}{B}', types: ['instant'], art: '🗡️', effect: { kind: 'destroy', target: 'creature' }, text: 'Destroy target creature.' },
  { name: 'Soul Siphon', cost: '{1}{B}', types: ['sorcery'], art: '🩸', effect: { kind: 'destroy', target: 'creature', filter: { maxPower: 3 } }, text: 'Destroy target creature with power 3 or less.' },
  { name: 'Unholy Feast', cost: '{3}{B}{B}', types: ['instant'], art: '🍷', effect: { kind: 'destroy', target: 'creature', gainLife: 2 }, text: 'Destroy target creature. You gain 2 life.' },
  { name: 'Bile Curse', cost: '{B}{B}', types: ['instant'], art: '🤢', effect: { kind: 'pump', power: -3, toughness: -3, target: 'creature' }, text: 'Target creature gets -3/-3 until end of turn.' },
  { name: 'Wither Wave', cost: '{2}{B}{B}', types: ['sorcery'], art: '☠️', effect: { kind: 'wipe', minus: 4 }, text: 'All creatures get -4/-4 until end of turn.', rarity: 'rare' },
  { name: 'Grim Tide', cost: '{1}{B}{B}', types: ['sorcery'], art: '🌑', effect: { kind: 'wipe', minus: 2 }, text: 'All creatures get -2/-2 until end of turn.' },
  { name: 'Mind Rend', cost: '{2}{B}', types: ['sorcery'], art: '🧠', effect: { kind: 'discard', amount: 2 }, text: 'Target opponent discards two cards.' },
  { name: 'Read the Omens', cost: '{2}{B}', types: ['sorcery'], art: '🦴', effect: { kind: 'draw', amount: 2, loseLife: 2 }, text: 'Draw two cards and you lose 2 life.' },
  // White
  { name: 'Final Judgment', cost: '{3}{W}{W}', types: ['sorcery'], art: '⚖️', effect: { kind: 'wipe' }, text: 'Destroy all creatures.', rarity: 'rare' },
  { name: 'Mighty Vault', cost: '{1}{W}', types: ['instant'], art: '🪽', effect: { kind: 'pump', power: 2, toughness: 2, keywords: ['flying'], target: 'creature' }, text: 'Target creature gets +2/+2 and gains flying until end of turn.' },
  { name: 'Righteous Verdict', cost: '{2}{W}', types: ['instant'], art: '🔱', effect: { kind: 'destroy', target: 'attackerOrBlocker' }, text: 'Destroy target attacking or blocking creature.' },
  {
    name: 'Resolute Stand',
    cost: '{1}{W}',
    types: ['instant'],
    art: '🛡️',
    effect: { kind: 'seq', effects: [{ kind: 'counters', amount: 1, target: 'yourCreature' }, { kind: 'pump', power: 0, toughness: 0, keywords: ['hexproof'], target: 'yourCreature' }] },
    text: 'Put a +1/+1 counter on target creature you control. It gains hexproof until end of turn.',
  },
  // Green
  { name: 'Titan\'s Surge', cost: '{G}', types: ['instant'], art: '💪', effect: { kind: 'pump', power: 3, toughness: 3, target: 'creature' }, text: 'Target creature gets +3/+3 until end of turn.' },
  { name: 'Titanic Bloom', cost: '{1}{G}', types: ['instant'], art: '🌱', effect: { kind: 'pump', power: 4, toughness: 4, target: 'creature' }, text: 'Target creature gets +4/+4 until end of turn.' },
  { name: 'Bear\'s Rage', cost: '{2}{G}', types: ['instant'], art: '🐾', effect: { kind: 'pump', power: 3, toughness: 3, keywords: ['trample'], target: 'creature' }, text: 'Target creature gets +3/+3 and gains trample until end of turn.' },
  // Multicolor
  {
    name: 'Tri-Clan Charm',
    cost: '{W}{B}{G}',
    types: ['instant'],
    art: '🔯',
    rarity: 'uncommon',
    effect: {
      kind: 'modal',
      modes: [
        { label: 'Exile target creature with power 3 or greater.', effect: { kind: 'exile', target: 'creature', filter: { minPower: 3 } } },
        { label: 'Draw two cards and lose 2 life.', effect: { kind: 'draw', amount: 2, loseLife: 2 } },
        { label: 'Put two +1/+1 counters on target creature.', effect: { kind: 'counters', amount: 2, target: 'creature' } },
      ],
    },
    text: 'Choose one —\n• Exile target creature with power 3 or greater.\n• Draw two cards and lose 2 life.\n• Put two +1/+1 counters on target creature.',
  },
  { name: 'Maddening Whispers', cost: '{1}{U}{B}', types: ['sorcery'], art: '🌀', effect: { kind: 'wheel' }, text: 'Each player discards their hand, then draws cards equal to the greatest number of cards a player discarded this way.', rarity: 'rare' },
];

export const CARD_LIST: CardDef[] = [...lands, ...creatures, ...tokens, ...spells];

const registry = new Map<string, CardDef>(CARD_LIST.map((c) => [c.name, c]));

export function getCard(name: string): CardDef {
  const c = registry.get(name);
  if (!c) throw new Error(`Unknown card: ${name}`);
  return c;
}

export function hasCard(name: string): boolean {
  return registry.has(name);
}
