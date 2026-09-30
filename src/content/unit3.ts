import { board, mc, num, sort, src, tf } from './helpers';
import type { Unit } from './types';

export const unit3: Unit = {
  id: 'u3',
  title: 'Deck Archetypes',
  subtitle: 'Aggro, control and midrange — and how each one wins',
  color: '#2f6fa8',
  lessons: [
    {
      id: 'aggro',
      title: 'Aggro Decks',
      icon: '🔥',
      source: src('Aggro Decks', 'lo/aggro-decks-2014-09-29'),
      terms: ['Aggro', 'Reach', 'Mana Efficiency', 'Evasion', 'Burn'],
      teach: [
        {
          title: 'The best defense is a good offense',
          body: `Aggro decks play cheap threats and attack right away. They try to decide the game with their opening hand and first few draws.

Tempo is aggro's main resource. Card advantage matters less because the game ends quickly — and so does aggro's own life total. Only the last point of damage matters.`,
        },
        {
          title: 'A low curve and mana efficiency',
          body: `Keep the curve as low as possible. One aggressive list in the article played 22 one-mana spells and only 21 lands in 60 cards.

**Mana efficiency**: for every job, pick the cheapest card that does it. Deploy threats for less than the opponent pays to answer them. Skip ramp — the game won't last long enough to pay off.`,
        },
        {
          title: 'Pay life, not tempo',
          body: `Aggro happily plays cards that cost life (pain lands, spells that cost life) when they save tempo. Newer players often avoid these; for aggro that's a mistake.

Lands that enter tapped are the opposite: they break the curve, so aggro avoids them.`,
          cards: ['Scorched Bastion', 'Verdant Terrace'],
        },
        {
          title: 'Reach',
          body: `**Reach** is how aggro finishes a wounded opponent after they stabilize the ground:

- **Evasion**: fliers and hard-to-block creatures.
- **Burn**: spells that can hit the opponent directly.

Once the opponent is low enough, they can't do much about burn. Pressure also makes opponents panic: they block badly and can't take risks.`,
        },
      ],
      exercises: [
        board({
          prompt: 'The opponent stabilized the ground with two big blockers. They\'re at 6. You have three small attackers and two burn spells.',
          goalText: 'Win this turn.',
          puzzle: {
            you: { battlefield: ['Ember Goblin', 'Pack Wolf', 'Furnace Hound', 'Mountain', 'Mountain', 'Mountain'], hand: ['Lightning Lance', 'Spark Jolt'] },
            opp: { life: 6, battlefield: ['Palisade Wall', 'Web Weaver'] },
            goal: { type: 'win' },
          },
          hint: 'Your burn deals 5. Where does the 6th point come from? They only have two blockers.',
          solution: [
            { do: 'combat' },
            { do: 'attack', with: ['Ember Goblin', 'Pack Wolf', 'Furnace Hound'] },
            { do: 'cast', card: 'Lightning Lance', target: 'opp' },
            { do: 'cast', card: 'Spark Jolt', target: 'opp' },
            { do: 'pass' },
          ],
          solutionText: 'Attack with all three — two blockers can stop only two. Then point both burn spells at the opponent: at least 1 + 5 = 6.',
          explain: 'This is reach. The blockers are too big for your burn, so don\'t aim burn at them. Every point of damage to the face counts.',
          rating: 900,
          themes: ['lethal', 'reach', 'burn'],
          refute: [
            [{ do: 'cast', card: 'Lightning Lance', target: 'opp' }, { do: 'cast', card: 'Spark Jolt', target: 'opp' }, { do: 'endTurn' }],
            [{ do: 'cast', card: 'Lightning Lance', target: 'Web Weaver' }, { do: 'combat' }, { do: 'attack', with: ['Ember Goblin', 'Pack Wolf', 'Furnace Hound'] }, { do: 'cast', card: 'Spark Jolt', target: 'opp' }, { do: 'pass' }],
          ],
        }),
        sort(
          'Does each card suit an aggro deck?',
          ['Good for aggro', 'Bad for aggro'],
          [
            ['A 1-mana 2/1', 0],
            ['A land that deals 1 damage to you but enters untapped', 0],
            ['A 3-damage burn spell', 0],
            ['A dual land that enters tapped', 1],
            ['An artifact that ramps your mana', 1],
            ['A 7-mana bomb', 1],
          ],
          'Aggro wants cheap, efficient, immediate cards. Tapped lands and ramp slow it down.',
        ),
        mc(
          'What does "reach" mean for an aggro deck?',
          ['The ability to finish a wounded opponent after losing the board', 'Having many lands', 'Blocking fliers', 'Drawing extra cards'],
          0,
          'Burn and evasive creatures let aggro close games even when the ground is locked up.',
        ),
        mc(
          'Which statement best describes how aggro treats its own life total?',
          ['It\'s a resource to spend — only the last point of damage matters', 'Protect it at all costs', 'It matters more than the opponent\'s', 'It should always stay above 15'],
          0,
          'Aggro trades life for tempo. Losing a few points to pain lands is fine if it wins the race.',
        ),
        tf('Aggro decks should include cards that ramp their mana for a strong late game.', false, 'The game rarely lasts long enough for ramp to pay off. Every early turn spent ramping is tempo lost.'),
      ],
      takeaways: ['Aggro wins with tempo, not cards.', 'Lowest curve possible; cheapest card for each job.', 'Spend life for tempo; avoid tapped lands.', 'Reach (burn, evasion) closes the game.'],
    },
    {
      id: 'control',
      title: 'Control Decks',
      icon: '🧊',
      source: src('Control Decks', 'lo/control-decks-2014-10-06'),
      terms: ['Control', 'Inevitability', 'Permission Spells'],
      teach: [
        {
          title: 'Shut them down, win later',
          body: `Control is aggro's opposite. It shuts the opponent down and wins later, at its own convenience.

Control doesn't try to win on tempo — it only needs to not fall too far behind. It wins with **card advantage**: by turn 11, a control player who cast a few draw spells may have seen 25 cards to the opponent's 18.`,
        },
        {
          title: 'Build inevitability first',
          body: `Surviving the early game is pointless without a way to dominate the late game. So a control deck first loads up on card draw and powerful late cards, then fills the rest with defense: counterspells, removal, blockers.`,
        },
        {
          title: 'Few creatures, many lands',
          body: `The example deck ran only **2 creatures** and **26 lands**.

- Few creatures **blank** the opponent's removal.
- They also make sweepers one-sided: "destroy all creatures" barely touches you.
- Lots of lands, because control needs to hit 5 and 6 mana on time for its answers.`,
        },
        {
          title: 'Counterspells and removal',
          body: `Counterspells can answer anything — creatures, spells, planeswalkers — but only while it's being cast. They can't touch what's already on the battlefield. Control balances counters with removal.`,
        },
      ],
      exercises: [
        board({
          prompt: 'You\'re the control deck at 6 life. The opponent has four creatures and will attack next turn for 9.',
          goalText: 'Survive the opponent\'s next turn.',
          puzzle: {
            continueToOppTurn: true,
            you: { life: 6, battlefield: ['Plains', 'Plains', 'Plains', 'Island', 'Island'], hand: ['Final Judgment', 'Deep Study'] },
            opp: { battlefield: ['Grizzly Cub', 'Pack Wolf', 'Mogg Brute', 'Eager Squire'] },
            goal: { type: 'survive' },
          },
          hint: 'You have five mana and two five-mana spells. Only one of them stops the attack.',
          solution: [{ do: 'cast', card: 'Final Judgment' }, { do: 'endTurn' }],
          solutionText: 'Cast Final Judgment. Their four creatures die; you had none.',
          explain: 'A symmetric sweeper is one-sided for a control deck with no creatures: a 1-for-4. Card draw can wait until you\'re safe.',
          rating: 700,
          themes: ['sweeper', 'defense'],
          refute: [[{ do: 'cast', card: 'Deep Study' }, { do: 'endTurn' }]],
        }),
        mc(
          'Why do control decks play so few creatures? (Select all that apply.)',
          ['It blanks the opponent\'s creature removal', 'It makes "destroy all creatures" effects one-sided', 'Creatures are bad cards', 'Creatures can\'t block'],
          [0, 1],
          'Few creatures turn the opponent\'s removal into dead cards and let symmetric sweepers hit only the opponent.',
        ),
        mc('How do control decks usually win?', ['With card advantage and a stronger late game', 'By dealing damage as fast as possible', 'By ramping to one big threat on turn 3', 'By milling the opponent'], 0, 'They survive, pull ahead on cards, and win when it\'s safe.'),
        num('The control deck in the article played how many lands in 60 cards?', 26, 'Control needs to hit its land drops through turn 6–7 for its expensive answers. 25–27 is common.', { min: 25, max: 27, unit: 'lands' }),
        mc('What can\'t a counterspell deal with?', ['A creature that\'s already on the battlefield', 'A creature spell being cast', 'An instant being cast', 'A sorcery being cast'], 0, 'Counterspells only hit spells on the stack. Control needs removal for what\'s already in play.'),
      ],
      takeaways: ['Control defends first and wins later.', 'Inevitability + card advantage are the core.', 'Few creatures blank removal and power up sweepers.', 'Mix counterspells with removal.'],
    },
    {
      id: 'midrange',
      title: 'Midrange Decks',
      icon: '🦏',
      source: src('Midrange Decks', 'lo/midrange-decks-2014-10-27'),
      terms: ['Midrange', 'Adaptability', 'Versatile', 'Incidental', 'Turning the Corner', 'Modal Spell'],
      teach: [
        {
          title: 'Offense and defense',
          body: `Midrange decks are built for both offense and defense, and they adapt to the matchup: attack slower decks, defend against faster ones.

The winning Pro Tour midrange deck in the article faced control, aggro, burn and other midrange decks. It played offense when it could, defense when it had to, and had an excellent sideboard.`,
        },
        {
          title: 'Every card does two jobs',
          body: `Midrange avoids cards that only attack (a 1-mana 2/1) or only invest (a slow draw-three).

- Creatures that block well **and** threaten, like a big body that also drains the opponent.
- **Modal** spells that can remove a creature, grow yours, or draw cards.
- Mana creatures early that still block against aggro.`,
          cards: ['Siegehorn Rhino', 'Tri-Clan Charm'],
        },
        {
          title: 'Incidental card advantage',
          body: `Midrange doesn't play pure draw spells. It gets **incidental** card advantage — value attached to other effects: creatures that leave something behind, charms with a draw mode, planeswalkers protected by its creatures and removal.`,
        },
        {
          title: 'Turning the corner',
          body: `Midrange usually lacks inevitability. So after surviving the early game, it has to **turn the corner**: switch from defense to offense and end the game before the opponent's late game takes over.

Balanced decks are also hard to sideboard against, and they can sideboard in whatever each matchup needs.`,
        },
      ],
      exercises: [
        board({
          prompt: 'You survived the aggro deck\'s rush. You have two big creatures and a second Siegehorn Rhino in hand. The opponent is at 11 with two small creatures.',
          goalText: 'Turn the corner: get the opponent to 5 or less and survive their next turn.',
          puzzle: {
            continueToOppTurn: true,
            you: { life: 6, battlefield: ['Clan Warlord', 'Siegehorn Rhino', 'Plains', 'Swamp', 'Forest', 'Forest', 'Swamp'], hand: ['Siegehorn Rhino'] },
            opp: { life: 11, battlefield: ['Ember Goblin', 'Furnace Hound'] },
            goal: { type: 'all', goals: [{ type: 'oppLifeAtMost', n: 5 }, { type: 'survive' }] },
          },
          hint: 'Your new Rhino can stay home as a blocker. Its enters-the-battlefield drain counts too.',
          solution: [{ do: 'cast', card: 'Siegehorn Rhino' }, { do: 'combat' }, { do: 'attack', with: ['Clan Warlord', 'Siegehorn Rhino'] }, { do: 'pass' }, { do: 'endTurn' }],
          solutionText: 'Cast the second Rhino (drain 3), then attack with Clan Warlord and the first Rhino. They must chump or die; trample still pushes damage through.',
          explain: 'You don\'t need total control of the game. Switching to offense at the right moment shortens the game before their burn can finish you.',
          rating: 1000,
          themes: ['turning the corner', 'racing'],
          refute: [[{ do: 'endTurn' }]],
        }),
        mc(
          'Which card fits a midrange deck best?',
          ['A 4-mana 4/5 that drains 3 when it enters', 'A 1-mana 2/1 that can only attack well', 'A 5-mana instant that draws three', 'A card that only works with one specific other card'],
          0,
          'It stabilizes the board against aggro and pressures slower decks — two jobs in one card.',
        ),
        mc(
          'Why are midrange decks good at sideboarding?',
          ['Balanced strategies are hard to sideboard against and can adapt to anything', 'They have more sideboard slots', 'They never need to sideboard', 'Their opponents can\'t sideboard'],
          0,
          'The more extreme a strategy, the easier it is to prepare for. Midrange is the least extreme.',
        ),
        tf('Midrange decks usually have inevitability, so they can always wait for the late game.', false, 'Midrange usually lacks inevitability against control. It has to turn the corner and win.'),
        sort(
          'Would a midrange deck want this card?',
          ['Fits midrange', 'Doesn\'t fit'],
          [
            ['Tri-Clan Charm (removal, draw, or +1/+1 counters)', 0],
            ['Siegehorn Rhino', 0],
            ['Mana Elf (ramps early, chump blocks later)', 0],
            ['Ember Goblin (1/1 haste)', 1],
            ['Deep Study (draw three for 5)', 1],
          ],
          'Midrange wants flexible cards that are good whether it\'s attacking or defending.',
        ),
      ],
      takeaways: ['Midrange attacks slower decks and defends against faster ones.', 'Choose cards that do two jobs.', 'Get card advantage incidentally.', 'Turn the corner — midrange rarely has inevitability.'],
    },
  ],
};
