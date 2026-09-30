import { board, mc, order, tf } from './helpers';
import type { Unit } from './types';

// Unit 0 is not part of Level One. It teaches how to use this app's board,
// so newer players can do the puzzles in the real course.

export const unit0: Unit = {
  id: 'u0',
  title: 'How the Board Works',
  subtitle: 'A quick tour of the game board used in every puzzle',
  color: '#6b7a8a',
  optional: true,
  lessons: [
    {
      id: 'board-turn',
      title: 'Your First Turn',
      icon: '🌱',
      source: { title: 'Level One: The Full Course (index)', url: 'https://magic.wizards.com/en/news/feature/level-one-full-course-2015-10-05' },
      teach: [
        {
          title: 'Lands make mana',
          body: `Each turn you may play **one land**. Lands tap for mana, shown as symbols like {G} (green) or {R} (red).

Spells cost mana. **Grizzly Cub** costs {1}{G}: one green mana plus one mana of any color.

In the puzzles you tap a card to see it. When you cast a spell, the app pays the mana for you from your untapped lands.`,
          cards: ['Forest', 'Grizzly Cub'],
        },
        {
          title: 'Creatures fight',
          body: `A creature shows its **power/toughness**, like 2/2. It deals damage equal to its power. It dies when it takes damage equal to its toughness.

A creature that just arrived is **summoning sick** (💤): it can't attack until your next turn.

To attack, go **To combat**, tap the creatures you want to send in, then confirm. Unblocked attackers deal damage to the opponent. At 0 life, a player loses.`,
        },
        {
          title: 'How puzzles work',
          body: `Every puzzle has a **goal** at the top, like "Win this turn". The opponent plays its best defense, like a chess puzzle.

If a line fails, you can **try again** or **watch the solution**. Your first try counts for your score.`,
        },
      ],
      exercises: [
        board({
          prompt: 'Play your land, then cast Grizzly Cub.',
          goalText: 'Get Grizzly Cub onto the battlefield.',
          puzzle: {
            you: { battlefield: ['Forest'], hand: ['Forest', 'Grizzly Cub'] },
            opp: {},
            goal: { type: 'alive', card: 'Grizzly Cub' },
          },
          hint: 'Tap the Forest in your hand and choose **Play land**. Then tap Grizzly Cub and cast it.',
          solution: [{ do: 'land', card: 'Forest' }, { do: 'cast', card: 'Grizzly Cub' }, { do: 'endTurn' }],
          solutionText: 'Play Forest, then cast Grizzly Cub with your two Forests.',
          explain: 'You need two mana for Grizzly Cub ({1}{G}). One land was already out; your land drop for the turn gives you the second.',
          rating: 400,
          themes: ['basics'],
        }),
        board({
          prompt: 'The opponent is at 2 life. Your Pack Wolf has been on the battlefield since last turn.',
          goalText: 'Win this turn.',
          puzzle: {
            you: { battlefield: ['Pack Wolf', 'Forest', 'Forest'], hand: ['Grizzly Cub'] },
            opp: { life: 2 },
            goal: { type: 'win' },
          },
          hint: 'Casting Grizzly Cub does not help this turn — it would be summoning sick. Press **To combat** and attack with Pack Wolf.',
          solution: [{ do: 'combat' }, { do: 'attack', with: ['Pack Wolf'] }],
          solutionText: 'Go to combat and attack with Pack Wolf for 2.',
          explain: 'Pack Wolf is not summoning sick, so it can attack. The opponent has no blockers, so 2 damage takes them from 2 to 0.',
          rating: 450,
          themes: ['basics', 'lethal'],
        }),
        mc(
          'You cast Grizzly Cub this turn. Why can\'t it attack yet?',
          ['It is summoning sick: creatures can\'t attack the turn they arrive', 'It costs too much mana', 'Only one creature can attack per turn', 'Creatures can only block on your turn'],
          0,
          'A creature has to start your turn under your control before it can attack. Haste is the exception.',
        ),
      ],
      takeaways: ['One land per turn.', 'Power is damage dealt; toughness is damage it can take.', 'New creatures are summoning sick unless they have haste.'],
    },
    {
      id: 'board-combat',
      title: 'Blocking and Keywords',
      icon: '🛡️',
      source: { title: 'Level One: The Full Course (index)', url: 'https://magic.wizards.com/en/news/feature/level-one-full-course-2015-10-05' },
      teach: [
        {
          title: 'Blocking',
          body: `When the opponent attacks, each of your untapped creatures may block one attacker. The blocker and the attacker deal damage to each other. A blocked attacker deals no damage to you.

To block in the app: tap your creature, then tap the attacker it should block. Then confirm.`,
        },
        {
          title: 'Keywords you will see',
          body: `- **Flying**: can only be blocked by creatures with flying or reach.
- **Reach**: can block fliers.
- **First strike**: deals combat damage before creatures without it.
- **Deathtouch**: any damage it deals to a creature is lethal.
- **Trample**: extra damage beyond lethal goes to the player.
- **Lifelink**: damage it deals also gains you that much life.
- **Menace**: can't be blocked except by two or more creatures.
- **Haste**: can attack right away. **Vigilance**: doesn't tap to attack. **Defender**: can't attack. **Hexproof**: can't be the target of the opponent's spells.`,
        },
      ],
      exercises: [
        board({
          prompt: 'The opponent attacks with Cliff Giant (3/3) and Grizzly Cub (2/2). You are at 3 life.',
          goalText: 'Survive the attack.',
          puzzle: {
            start: 'oppAttack',
            you: { life: 3, battlefield: ['Web Weaver'] },
            opp: { battlefield: ['Cliff Giant', 'Grizzly Cub'] },
            ai: { attack: ['Cliff Giant', 'Grizzly Cub'] },
            goal: { type: 'survive' },
          },
          hint: 'Unblocked damage adds up to 5. Block the attacker that deals the most damage.',
          solution: [{ do: 'block', blocks: [['Web Weaver', 'Cliff Giant']] }, { do: 'pass' }],
          solutionText: 'Block Cliff Giant with Web Weaver. You take 2 from the Cub and survive at 1.',
          explain: 'Web Weaver (1/4) survives the Giant\'s 3 damage, and you only take 2 from Grizzly Cub. Blocking the Cub instead lets 3 through, which is exactly lethal.',
          rating: 500,
          themes: ['basics', 'blocking'],
          refute: [[{ do: 'block', blocks: [['Web Weaver', 'Grizzly Cub']] }, { do: 'pass' }]],
        }),
        mc(
          'Can Grizzly Cub (no keywords) block Sky Griffin (flying)?',
          ['No — only creatures with flying or reach can block a flier', 'Yes, any creature can block', 'Only if Grizzly Cub is untapped and bigger', 'Only on your own turn'],
          0,
          'Flying is evasion: ground creatures without reach can\'t block it.',
        ),
        mc(
          'Your Blade Knight (2/2, first strike) is blocked by a 2/2 with no abilities. What happens?',
          ['Only the blocker dies', 'Both creatures die', 'Only Blade Knight dies', 'Nothing dies'],
          0,
          'First strike damage happens first. The blocker dies before it can deal its damage back.',
        ),
        tf('A creature with deathtouch and 1 power kills a 5/5 it blocks.', true, 'Any amount of damage from a deathtouch source is lethal to a creature.'),
      ],
      takeaways: ['Block the biggest threat when damage would be lethal.', 'Flying beats ground blockers; reach stops fliers.', 'First strike and deathtouch change who dies.'],
    },
    {
      id: 'board-stack',
      title: 'Instants and the Stack',
      icon: '⚡',
      source: { title: 'Level One: Permission Spells', url: 'https://magic.wizards.com/en/articles/archive/level-one/permission-spells-2015-08-17' },
      teach: [
        {
          title: 'Instants can be cast any time',
          body: `**Sorceries** and creatures are cast in your main phase. **Instants** can be cast whenever you have priority — even during combat or on the opponent's turn.

A classic instant is a **combat trick**: a pump spell cast after blockers are declared.`,
          cards: ['Titan\'s Surge', 'Lightning Lance'],
        },
        {
          title: 'The stack',
          body: `Spells wait on **the stack** before they resolve. Each player may respond by adding another spell on top. The **last spell cast resolves first**.

In the app, the stack appears in the middle of the board. When the opponent casts something, you can respond with an instant, or choose **Let it resolve**.`,
        },
      ],
      exercises: [
        board({
          prompt: 'The opponent attacks with Cliff Giant (3/3). You have Pack Wolf (2/2), a Forest and Titan\'s Surge ({G}: +3/+3).',
          goalText: 'Kill Cliff Giant and keep Pack Wolf.',
          puzzle: {
            start: 'oppAttack',
            you: { battlefield: ['Pack Wolf', 'Forest'], hand: ['Titan\'s Surge'] },
            opp: { battlefield: ['Cliff Giant'] },
            ai: { attack: ['Cliff Giant'] },
            goal: { type: 'all', goals: [{ type: 'gone', card: 'Cliff Giant' }, { type: 'alive', card: 'Pack Wolf' }] },
          },
          hint: 'Block first. Then, once blocks are locked in, cast Titan\'s Surge on your Wolf.',
          solution: [
            { do: 'block', blocks: [['Pack Wolf', 'Cliff Giant']] },
            { do: 'cast', card: 'Titan\'s Surge', target: 'you:Pack Wolf' },
            { do: 'pass' },
          ],
          solutionText: 'Block with Pack Wolf, then cast Titan\'s Surge on it. A 5/5 Wolf kills the Giant and survives.',
          explain: 'Pack Wolf becomes 5/5 until end of turn. It deals 5 damage to the 3/3 Giant and takes only 3.',
          rating: 550,
          themes: ['basics', 'combat trick'],
          refute: [[{ do: 'block', blocks: [['Pack Wolf', 'Cliff Giant']] }, { do: 'pass' }]],
        }),
        order(
          'You cast Lightning Lance. The opponent responds with a pump spell. Then you respond with Spark Jolt. In what order do they resolve?',
          ['Spark Jolt', 'The pump spell', 'Lightning Lance'],
          'Last in, first out: the most recent spell resolves first.',
        ),
        tf('You can cast a sorcery during your opponent\'s turn.', false, 'Sorceries (and creatures) are cast only in your own main phase with an empty stack. Instants can be cast at other times.'),
      ],
      takeaways: ['Instants work at any time you have priority.', 'The last spell cast resolves first.', 'Combat tricks are best after blockers are declared.'],
    },
  ],
};
