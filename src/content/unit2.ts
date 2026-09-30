import { board, mc, sort, src, tf } from './helpers';
import type { Unit } from './types';

export const unit2: Unit = {
  id: 'u2',
  title: 'Concepts of Gameplay I',
  subtitle: 'Combat, tempo, and focused strategies',
  color: '#b5452f',
  lessons: [
    {
      id: 'attacking-blocking',
      title: 'Attacking and Blocking',
      icon: '⚔️',
      source: src('Attacking and Blocking', 'level-one/attacking-and-blocking-2015-07-27'),
      terms: ['Combat Trick', 'Priority'],
      teach: [
        {
          title: 'Creatures only matter when they fight',
          body: `A creature that neither attacks nor blocks wasted a turn of value. Many players hold back out of fear of tricks and removal — that's usually a mistake.

**Default**: when creatures are about the same size, attack and block. If the opponent attacks a 2/2 into your 2/2, blocking is usually right: an even trade that also saves you 2 life.`,
        },
        {
          title: 'Trade sooner, not later',
          body: `If a trade is fair, take it now. Waiting gives the opponent time to draw removal, find a combat trick, or build a board where your blocks get worse.

The exception: you hold a card that needs many creatures (like a spell that pumps your whole team).`,
        },
        {
          title: 'Bluffs and semi-bluffs',
          body: `Reid's observation: people **bluff less** and **block less** than you'd expect.

A **semi-bluff** is an attack where you'd prefer no block but are fine if they do. Example: your 2/2 attacks into a 4/4 while you hold a 3-damage burn spell. No block: free damage. Block: 2 + 3 damage kills their 4/4.`,
        },
        {
          title: 'Priority in combat',
          body: `After blockers are declared, the **attacking player acts first** and the **defender gets the last word**.

- Casting a pump spell into lots of open mana is risky: they can kill your creature in response, and you lose two cards to their one.
- Tricks are best on offense, when the defender has tapped mana for other things.
- In Limited, be careful playing more than about **two combat tricks**: they are dead without creatures.`,
        },
      ],
      exercises: [
        board({
          prompt: 'The opponent attacks with its Forward Cleric (2/2). You also have a Forward Cleric.',
          goalText: 'Make the right defensive play: trade.',
          puzzle: {
            start: 'oppAttack',
            you: { battlefield: ['Forward Cleric'] },
            opp: { battlefield: ['Forward Cleric'] },
            ai: { attack: ['Forward Cleric'] },
            goal: { type: 'gone', card: 'Forward Cleric', side: 'opp' },
          },
          hint: 'Equal creatures should usually trade.',
          solution: [{ do: 'block', blocks: [['Forward Cleric', 'Forward Cleric']] }],
          solutionText: 'Block. Both 2/2s die: an even trade that also saves you 2 life.',
          explain: 'If you don\'t block, you take 2 and the trade is still available later — but later the opponent may have a trick or removal ready. Take the fair trade now.',
          rating: 600,
          themes: ['blocking', 'trading'],
          refute: [[{ do: 'block', blocks: [] }]],
        }),
        board({
          prompt: 'Semi-bluff. Your Pack Wolf (2/2) faces a 4/4. You hold Lightning Lance (3 damage).',
          goalText: 'Deal combat damage (keeping the Lance), or kill the 4/4.',
          puzzle: {
            you: { battlefield: ['Pack Wolf', 'Mountain', 'Mountain'], hand: ['Lightning Lance'] },
            opp: { battlefield: ['Stalwart Irregulars'] },
            goal: {
              type: 'any',
              goals: [
                { type: 'gone', card: 'Stalwart Irregulars' },
                { type: 'all', goals: [{ type: 'oppLifeAtMost', n: 18 }, { type: 'notCast', card: 'Lightning Lance' }] },
              ],
            },
          },
          hint: 'Attack with the Wolf. If they block, Lance + the Wolf\'s 2 damage kills the 4/4. If they don\'t, you get in for free.',
          solution: [{ do: 'combat' }, { do: 'attack', with: ['Pack Wolf'] }, { do: 'pass' }, { do: 'endTurn' }],
          solutionText: 'Attack with Pack Wolf. If the 4/4 blocks, finish it with Lightning Lance; if not, take 2 free damage and keep the Lance.',
          explain: 'Both outcomes are good for you — that\'s a semi-bluff. An opponent who can see your hand won\'t block, so you deal 2 and keep your burn spell.',
          rating: 800,
          themes: ['attacking', 'bluffing'],
          refute: [[{ do: 'cast', card: 'Lightning Lance', target: 'opp' }, { do: 'endTurn' }], [{ do: 'endTurn' }]],
        }),
        mc(
          'Your Grizzly Cub is blocked by a 2/3. The opponent has three untapped Swamps and cards in hand. Should you cast Titanic Bloom (+4/+4) now?',
          [
            'Probably not — they can kill the Cub in response and you lose two cards to one',
            'Yes — tricks are always best after blocks',
            'Yes — untapped Swamps don\'t matter',
            'Only if the Cub has summoning sickness',
          ],
          0,
          'Combat tricks are risky into lots of open mana. If they respond with removal, they get a 2-for-1 and a tempo swing.',
          {
            scene: {
              you: { battlefield: ['Grizzly Cub', 'Forest', 'Forest'], hand: ['Titanic Bloom'] },
              opp: { battlefield: ['Crypt Shambler', 'Swamp', 'Swamp', 'Swamp'], hand: ['Plains', 'Plains', 'Plains'] },
              note: 'Grizzly Cub is attacking; Crypt Shambler blocked it.',
            },
          },
        ),
        mc(
          'Reid\'s observation from years of play: people bluff ___ than you\'d expect, and block ___ than you\'d expect.',
          ['less often / less often', 'more often / more often', 'less often / more often', 'more often / less often'],
          0,
          'So an attack that looks like a bluff often isn\'t, and a risky attack often goes unblocked.',
        ),
        mc(
          'After blockers are declared, who gets the first chance to cast a spell?',
          ['The attacking (active) player', 'The defending player', 'Whoever has more mana', 'Both at the same time'],
          0,
          'The active player acts first. That gives the defender the last chance to respond — a real advantage.',
        ),
        mc(
          'About how many combat tricks should a typical Limited deck play?',
          ['Two or fewer', 'Five or six', 'None, ever', 'As many as possible'],
          0,
          'Tricks are dead without creatures and are often cast in bad spots when you draw several. Some aggressive decks can play a few more.',
        ),
        tf('If a trade is even, it\'s usually best to wait a few turns before taking it.', false, 'Take even trades early. Waiting gives the opponent time to find removal, tricks, or a better board.'),
      ],
      takeaways: ['Attack and block by default when creatures are similar.', 'Take fair trades now.', 'Semi-bluff: attack when both outcomes are fine.', 'Don\'t cast tricks into lots of open mana.'],
    },
    {
      id: 'tempo',
      title: 'Tempo',
      icon: '⏱️',
      source: src('Tempo', 'level-one/tempo-2015-07-20'),
      terms: ['Tempo', 'Initiative', 'Bounce', 'Bottleneck', 'Pushing a Tempo Advantage'],
      teach: [
        {
          title: 'Tempo is board presence',
          body: `Magic has three main resources: **mana**, **cards**, and **tempo**. Tempo is how your permanents match up against the opponent's, and what that lets you do. It's hard to count, but you can feel it: one player sets the pace and the other scrambles.`,
        },
        {
          title: 'Use your mana',
          body: `If you often end turns with unspent mana, you're losing tempo. A good curve helps, and so does casting cheap spells on time.

Example: the opponent plays a 2-drop. You have 2-mana removal and a 3-mana draw spell for next turn. Kill it now — if you wait, one of your spells gets delayed and the tempo loss snowballs.

Each land gives you +1 mana every turn, so **missing a land drop** hurts now and later. Tapped lands cost a little tempo.`,
        },
        {
          title: 'Initiative',
          body: `The player on offense sets the pace and forces the other to react. Attacking means you don't have to defend, and the defender has to make hard blocks while you keep mana up for tricks.`,
        },
        {
          title: 'Removal and bounce',
          body: `A 1-for-1 removal spell is tempo-neutral. An **expensive** removal spell against many cheap creatures loses tempo.

**Pushing a tempo advantage**: remove the key blocker so your whole team can attack.

**Bounce** (return to hand) costs you a card, but it's strong when:
- you're already ahead,
- the target is expensive to recast,
- the opponent has more to cast than mana (**bottlenecked**).

Bouncing their last creature when they have nothing else to do only buys a moment.`,
        },
      ],
      exercises: [
        board({
          prompt: 'You have four 2-power creatures. The opponent is at 7 with one big blocker, Watch Sentinel (4/6).',
          goalText: 'Win this turn.',
          puzzle: {
            you: { battlefield: ['Pack Wolf', 'Grizzly Cub', 'Forward Cleric', 'Eager Squire', 'Island', 'Island'], hand: ['Wash Away'] },
            opp: { life: 7, battlefield: ['Watch Sentinel'] },
            goal: { type: 'win' },
          },
          hint: 'Remove the blocker **before** combat. A blocked attacker stays blocked even if its blocker disappears.',
          solution: [
            { do: 'cast', card: 'Wash Away', target: 'Watch Sentinel' },
            { do: 'combat' },
            { do: 'attack', with: ['Pack Wolf', 'Grizzly Cub', 'Forward Cleric', 'Eager Squire'] },
          ],
          solutionText: 'Bounce Watch Sentinel with Wash Away first, then attack with everything for 8.',
          explain: 'This is pushing a tempo advantage: a cheap spell removes their only blocker and your board converts into lethal damage. Card disadvantage doesn\'t matter when the game ends.',
          rating: 850,
          themes: ['tempo', 'lethal', 'removal timing'],
          refute: [
            [
              { do: 'combat' },
              { do: 'attack', with: ['Pack Wolf', 'Grizzly Cub', 'Forward Cleric', 'Eager Squire'] },
              { do: 'cast', card: 'Wash Away', target: 'Watch Sentinel' },
              { do: 'pass' },
            ],
          ],
        }),
        mc(
          'The opponent just played a 2-drop. You have two lands, a 2-mana removal spell, and a 3-mana card-draw spell you want to cast next turn. What\'s the tempo play?',
          ['Kill the 2-drop now and cast the draw spell next turn', 'Save the removal for something bigger', 'Pass and cast both later', 'Cast nothing and hold up mana'],
          0,
          'You use all your mana each turn and keep pace on the board. Waiting would delay one of your spells and cost tempo.',
        ),
        mc(
          'When is a bounce spell at its best? (Select all that apply.)',
          ['When you\'re already ahead on board', 'When the target cost a lot of mana', 'When the opponent has more spells than mana', 'When the opponent has nothing else to do and you can\'t attack'],
          [0, 1, 2],
          'Bounce trades a card for time. That time is only worth something if you can use it — to attack, or while they are short on mana.',
        ),
        mc(
          'Why is missing a land drop so costly?',
          ['You lose mana this turn and every later turn', 'You have to discard', 'You lose a turn of combat', 'It gives the opponent a card'],
          0,
          'Each land is +1 mana on every future turn. Missing one early compounds.',
        ),
        tf('Expensive removal spells are a great answer to a deck that plays many cheap creatures.', false, 'You spend a whole turn to answer one cheap creature while the others keep attacking. That loses tempo.'),
      ],
      takeaways: ['Tempo = board presence; it sets the pace.', 'Spend your mana every turn.', 'Remove key blockers to push an advantage.', 'Bounce is best when ahead, on expensive targets, or vs. a mana bottleneck.'],
    },
    {
      id: 'tempo-card-advantage',
      title: 'Tempo & Card Advantage: A Delicate Balance',
      icon: '⚖️',
      source: src('Tempo & Card Advantage: A Delicate Balance', 'level-one/tempo-card-advantage-delicate-balance-2014-11-17'),
      terms: ['Early Stage', 'Late Stage'],
      teach: [
        {
          title: 'Two stages of a game',
          body: `There's no exchange rate between tempo and cards. What matters is which one limits you right now.

- **Early stage**: hands are full, mana is short. Mana is the bottleneck, so **tempo** decides things.
- **Late stage**: everyone has mana and few cards. Cards are the bottleneck, so **card advantage** decides things.

Aggro decks try to win before the late stage. Control mirrors may skip most of the early stage.`,
        },
        {
          title: 'Counterspells in each stage',
          body: `Counterspells can't help you come back from behind — but they keep you even.

- **Early**: if you left mana open for a counter, be willing to counter whatever they cast. Unused mana is lost tempo.
- **Late**: be patient. Save the counter for the spell that would actually beat you.`,
        },
        {
          title: 'Bounce in each stage',
          body: `- **Early**: bouncing one of their first creatures delays everything they do while they're short on mana.
- **Late**: bounce costs you a card, so look for ways around that: bounce a **token** (it disappears), or bounce **your own** creature in response to removal to save it.`,
        },
      ],
      exercises: [
        sort(
          'Early stage or late stage?',
          ['Early stage (tempo)', 'Late stage (cards)'],
          [
            ['Mana is the limiting factor', 0],
            ['Countering whatever they cast so your open mana isn\'t wasted', 0],
            ['Bouncing their first creature to slow their whole hand down', 0],
            ['Both players have more mana than things to do', 1],
            ['Saving a counterspell for their one big threat', 1],
            ['Card-draw spells are at their best', 1],
          ],
          'Ask which resource is scarce. Early on it\'s mana; later it\'s cards.',
        ),
        board({
          prompt: 'The opponent casts Hero\'s Ruin on your Stalwart Irregulars. You hold Wash Away.',
          goalText: 'Don\'t lose the Irregulars card.',
          puzzle: {
            you: { battlefield: ['Stalwart Irregulars', 'Island', 'Island'], hand: ['Wash Away'] },
            opp: { battlefield: ['Swamp', 'Swamp', 'Swamp'], hand: ['Hero\'s Ruin'] },
            oppCasts: [{ card: 'Hero\'s Ruin', target: 'you:Stalwart Irregulars' }],
            goal: { type: 'inHand', card: 'Stalwart Irregulars' },
          },
          hint: 'Respond to their removal by bouncing your own creature.',
          solution: [{ do: 'cast', card: 'Wash Away', target: 'you:Stalwart Irregulars' }, { do: 'pass' }],
          solutionText: 'In response, cast Wash Away on your own Stalwart Irregulars. Hero\'s Ruin has no target and fizzles.',
          explain: 'Wash Away turned into a counterspell for their removal: one card for one card, and you can cast the Irregulars again.',
          rating: 900,
          themes: ['stack', 'card advantage'],
          refute: [[{ do: 'pass' }]],
        }),
        mc(
          'Turn 2. You left three mana open for Dissolve Thought (counter target spell). The opponent casts an ordinary 2-drop. Counter it?',
          ['Yes — early on, unused mana is wasted tempo', 'No — always save counters for bombs', 'No — counters can\'t hit creatures', 'Only if it has flying'],
          0,
          'In the early stage, if you pass with counter mana up, use it. Otherwise you spent your turn doing nothing.',
        ),
        mc(
          'Turn 11. You\'re ahead on cards and the opponent has nine lands. They cast a 2/2. You hold Dissolve Thought.',
          ['Let it resolve and save the counter for a real threat', 'Counter it — never let anything resolve', 'Counter it because it\'s cheap', 'It doesn\'t matter'],
          0,
          'Late in the game, patience wins. Their big X-spell or bomb is what can beat you.',
        ),
        mc(
          'In the late stage, which bounce target avoids card disadvantage?',
          ['An opponent\'s token', 'An opponent\'s 2/2', 'Your own land', 'A tapped creature'],
          0,
          'A bounced token stops existing, so you trade one card for one card.',
        ),
      ],
      takeaways: ['Early: mana is scarce → tempo. Late: cards are scarce → card advantage.', 'Early counters: use your open mana. Late counters: be patient.', 'Late bounce: hit tokens or save your own creatures.'],
    },
    {
      id: 'linear-strategies',
      title: 'Linear Strategies',
      icon: '➡️',
      source: src('Linear Strategies', 'level-one/linear-strategies-2014-12-29'),
      terms: ['Linear Strategy', 'Critical Mass', 'Synergy'],
      teach: [
        {
          title: 'A straight line from A to B',
          body: `A **linear strategy** focuses on one goal. Every card serves that goal, and the deck barely cares what the opponent does.

Not every themed deck is linear. It becomes linear at **critical mass**: when the synergy is so strong that even good off-plan cards (like removal) make the deck worse.`,
        },
        {
          title: 'Strengths',
          body: `- **Explosive**: when left alone, synergy produces more power than a "fair" deck can match.
- **Consistent**: focused decks find their key pieces more often.
- **Game 1**: unprepared opponents often just lose.`,
        },
        {
          title: 'Weaknesses',
          body: `- Below critical mass, the individual cards are weak.
- **Little interaction**: a linear deck often can't stop or race an opponent who is doing something faster.
- **Easy to sideboard against**: the more extreme a strategy, the easier it is to prepare for. Cheap removal that stops it from reaching critical mass is often enough.`,
        },
        {
          title: 'Cards that fit anyway',
          body: `Some interaction still belongs in a linear deck when it **serves the plan**. Example: a spell that can either protect your key creature or destroy a blocker. Both modes push your one plan forward.`,
        },
      ],
      exercises: [
        tf('In a truly linear deck, a strong general removal spell is always worth including.', false, 'Past critical mass, cards that don\'t advance the plan make the deck worse — even strong ones.'),
        mc('What is "critical mass"?', ['The tipping point where a strategy can reliably work', 'The largest creature in your deck', 'The number of lands you need', 'When your library runs out'], 0, 'Enough synergy pieces that the plan comes together.'),
        mc(
          'You face a linear creature-synergy deck in games 2 and 3. What\'s the best sideboard plan?',
          ['Add cheap interaction that stops it from reaching critical mass', 'Add slow card-draw spells', 'Add more expensive creatures', 'Change nothing'],
          0,
          'Linear decks are vulnerable to targeted disruption. Kill the key pieces early.',
        ),
        sort(
          'Strength or weakness of a linear strategy?',
          ['Strength', 'Weakness'],
          [
            ['Explosive when unchecked', 0],
            ['Finds its key pieces reliably', 0],
            ['Often wins game 1 against unprepared opponents', 0],
            ['Little ability to interact', 1],
            ['Easy for opponents to sideboard against', 1],
            ['Weak cards when below critical mass', 1],
          ],
          'The focus that makes linear decks powerful also makes them fragile.',
        ),
        mc(
          'Your deck wins by enchanting one creature. Which card fits best?',
          ['A spell that can protect your creature or destroy a blocker', 'A draw-three sorcery', 'A board sweeper', 'A big defensive wall'],
          0,
          'Both modes advance the single plan, so the card doesn\'t dilute the deck.',
        ),
      ],
      takeaways: ['Linear = one goal, every card serves it.', 'Critical mass turns weak cards into a strong deck.', 'Weaknesses: little interaction, easy to sideboard against.'],
    },
  ],
};
