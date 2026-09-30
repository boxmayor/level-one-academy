import { board, match, mc, num, sort, src, tf } from './helpers';
import type { Unit } from './types';

export const unit1: Unit = {
  id: 'u1',
  title: 'The Basics',
  subtitle: 'What Magic asks of you, mana, and card advantage',
  color: '#3f7f53',
  lessons: [
    {
      id: 'what-is-magic',
      title: 'What Is Magic?',
      icon: '🧭',
      source: src('What Is Magic?', 'lo/what-magic-2014-08-11'),
      terms: ['Focus', 'Proactive', 'Reactive'],
      teach: [
        {
          title: 'Chess with a deck of cards',
          body: `Magic mixes the strategy of chess with the uncertainty of card games. Two things make it different from chess:

- **Variance**: you can't know which card you'll draw next, so no two games are the same and you can't memorize openings.
- **Hidden information**: you can't see the opponent's hand, so you often choose between plays that are good if they have a certain card and plays that are good if they don't.`,
        },
        {
          title: 'The "chess" skills come first',
          body: `Reid Duke lists the board skills as the foundation:

- **Strategy**: How will I win? How will the opponent try to win?
- **Spotting opportunities**: when does an attack or a trade suddenly work?
- **Patience**: waiting can be the best play. Don't make a big play just because it's big.
- **Planning ahead**: think one or two turns forward, especially in a damage race.`,
        },
        {
          title: 'The "card game" skills',
          body: `- **Managing variance**: you can't control your draws, only how well you use them. Basic counting is enough.
- **Hidden information**: list what the opponent could have, then pick the play that holds up across those possibilities.

Learn to play your own cards well first. Reading opponents comes after.`,
        },
        {
          title: 'Focus is the most important skill',
          body: `Focus is not a gift some people have. It is a discipline you practice:

- Keep distractions away while you play.
- Keep thinking during the opponent's turn.
- Take a moment before each decision.

Better focus means fewer mistakes, better reads on the opponent, and faster learning.`,
        },
      ],
      exercises: [
        sort(
          'Is each item mainly a "chess" skill or a "card game" skill?',
          ['Chess skill (the board)', 'Card game skill (uncertainty)'],
          [
            ['Planning a damage race two turns ahead', 0],
            ['Waiting instead of making a flashy play', 0],
            ['Spotting that an attack now wins', 0],
            ['Making the most of a bad draw', 1],
            ['Guessing what the opponent is holding', 1],
            ['Choosing a play that works whether or not they have removal', 1],
          ],
          'Board skills are about the position in front of you. Card-game skills deal with what you can\'t see or control.',
        ),
        mc(
          'Which skill does Reid Duke call the single most important one?',
          ['Focus', 'Bluffing', 'Deck building', 'Knowing every card'],
          0,
          'Focus helps every other skill: fewer mistakes, better reads, faster learning.',
        ),
        tf('Focus is a natural talent — some players have it and others never will.', false, 'Focus is a discipline you build by practicing it on purpose.'),
        mc(
          'The opponent passes the turn with three untapped lands. You can\'t see their hand. What is the best way to decide your play?',
          [
            'List what they could reasonably have, and pick the play that holds up across those cases',
            'Assume they have nothing',
            'Assume they always have the perfect answer',
            'Do nothing until they tap out',
          ],
          0,
          'Hidden information means working with possibilities. Assuming the best or the worst every time leads to bad plays.',
        ),
        board({
          prompt: 'Plan ahead. The opponent is at 4 life with one untapped 2/2. You have two 2/2s and a Spark Jolt (2 damage to any target).',
          goalText: 'Win this turn.',
          puzzle: {
            you: { battlefield: ['Pack Wolf', 'Grizzly Cub', 'Mountain'], hand: ['Spark Jolt'] },
            opp: { life: 4, battlefield: ['Forward Cleric'] },
            goal: { type: 'win' },
          },
          hint: 'Count it out: the opponent can block only one attacker.',
          solution: [{ do: 'combat' }, { do: 'attack', with: ['Pack Wolf', 'Grizzly Cub'] }, { do: 'cast', card: 'Spark Jolt', target: 'opp' }, { do: 'pass' }],
          solutionText: 'Attack with both creatures. One gets through for 2, and Spark Jolt to the face deals the last 2.',
          explain: 'With one blocker, at least 2 damage gets through. Spark Jolt adds 2 more: exactly 4. Killing the blocker first with Spark Jolt also works. Planning the whole turn before acting shows you the win.',
          rating: 650,
          themes: ['lethal', 'planning'],
          refute: [[{ do: 'cast', card: 'Spark Jolt', target: 'opp' }, { do: 'combat' }, { do: 'attack', with: ['Pack Wolf'] }]],
        }),
        mc(
          'Why can\'t you memorize a set of "best openings" like in chess?',
          ['Your draws are random, so each game starts differently', 'The rules change every game', 'Openings don\'t matter in Magic', 'You can — most pros do'],
          0,
          'Variance means you face new situations every game. You learn principles, not move orders.',
        ),
      ],
      takeaways: [
        'Magic = chess-like strategy + card-game uncertainty.',
        'Board skills first: strategy, opportunities, patience, planning.',
        'Handle hidden info by listing the opponent\'s possibilities.',
        'Focus is the #1 skill, and it can be trained.',
      ],
    },
    {
      id: 'basics-of-mana',
      title: 'The Basics of Mana',
      icon: '💧',
      source: src('The Basics of Mana', 'level-one/basics-mana-2015-07-06'),
      terms: ['Mana Base', 'Mana Curve', 'Mana Flooded', 'Mana Hosed', 'Mana Sink', 'Splashing', 'Mana Fixing'],
      teach: [
        {
          title: 'How many lands?',
          body: `A deck's **mana base** is its lands plus any other mana sources. A tested starting point:

- **40-card Limited deck**: 17–18 lands.
- **60-card Constructed deck**: 24–25 lands.

Adjust: fewer lands if your spells are cheap or you have mana creatures; more if you have many 6- and 7-mana spells. A mana creature is not a full land — it costs mana to cast and dies to removal.`,
        },
        {
          title: 'Colors',
          body: `More colors give you stronger cards but more hands without the right color. With basic lands only, **two colors** is the sweet spot. Dual lands make a third color possible.

A **splash** is a small amount of a third color for one or two great cards. In Limited that is about **3–4 sources**. A main color wants about **9–10 sources** in 40 cards (about 15–16 in 60).`,
        },
        {
          title: 'The mana curve',
          body: `The **mana curve** is how your spells spread across mana costs. A deck of only 5-drops does nothing on turns 1–4. A deck of only 1-drops wastes mana later.

There is no master formula: it depends on your cards and plan. Fast decks go very low; slower decks can afford more expensive cards.`,
        },
        {
          title: 'Flood and screw are normal',
          body: `Drawing too many lands (**flood**) or too few (**screw**) happens to everyone.

- Against flood: include **mana sinks** — cards that turn extra mana into value.
- Against screw: include **cheap cards** that can trade with expensive ones.

Don't rebuild your deck after one bad game. Judge it over many games.`,
        },
      ],
      exercises: [
        num('How many lands does a typical 40-card Limited deck play?', 17, 'The usual range is 17–18 (a bit over 40% of the deck).', { min: 17, max: 18, unit: 'lands' }),
        num('How many lands does a typical 60-card Constructed deck play?', 24, 'The usual range is 24–25. Very low-curve aggro decks can play fewer.', { min: 24, max: 25, unit: 'lands' }),
        mc(
          'Your two-color Limited deck splashes a third color for two strong cards. About how many sources of the splash color should you play?',
          ['3–4', '1', '9–10', '15 or more'],
          0,
          'A splash is a light commitment. 3–4 sources lets you cast the splash cards in most long games without hurting your main colors.',
        ),
        sort(
          'Does each card help more against mana flood or mana screw?',
          ['Helps when flooded', 'Helps when screwed'],
          [
            ['Grove Warden ({3}{G}: +1/+1 counter)', 0],
            ['Bellows Salamander ({1}{R}: +1/+0)', 0],
            ['A creature land', 0],
            ['Spark Jolt (1-mana removal)', 1],
            ['A 2-mana 2/2 that trades with bigger creatures', 1],
            ['Soul Siphon (2-mana removal)', 1],
          ],
          'Mana sinks turn extra lands into value. Cheap cards keep you in the game when lands are short.',
        ),
        board({
          prompt: 'You are flooded: seven lands and nothing else to cast. The opponent is at 4 with no creatures.',
          goalText: 'Win this turn.',
          puzzle: {
            you: { battlefield: ['Bellows Salamander', 'Mountain', 'Mountain', 'Mountain', 'Mountain', 'Mountain', 'Mountain', 'Mountain'], hand: ['Mountain'] },
            opp: { life: 4 },
            goal: { type: 'win' },
          },
          hint: 'Bellows Salamander is a mana sink. Attack, then use its ability as many times as you can.',
          solution: [
            { do: 'combat' },
            { do: 'attack', with: ['Bellows Salamander'] },
            { do: 'activate', card: 'Bellows Salamander' },
            { do: 'activate', card: 'Bellows Salamander' },
            { do: 'activate', card: 'Bellows Salamander' },
            { do: 'pass' },
          ],
          solutionText: 'Attack with Bellows Salamander and pump it three times ({1}{R} each) to make it 4/1.',
          explain: 'Seven lands pay for three activations: 1 + 3 = 4 damage. Mana sinks turn a flooded hand into a win.',
          rating: 700,
          themes: ['mana sink', 'lethal'],
        }),
        mc(
          'You lost three games in a row to mana flood with your 17-land Limited deck. What should you do?',
          ['Keep 17 lands — a short streak is normal variance', 'Cut down to 14 lands', 'Add more expensive spells', 'Switch to three colors'],
          0,
          'Flood and screw happen to everyone. Change your land count based on patterns over many games, not a bad streak.',
        ),
        mc(
          'Which deck most likely wants **fewer** lands than usual?',
          ['A fast deck of 1- and 2-drops with mana creatures', 'A control deck with many 6-mana spells', 'A three-color deck', 'Any deck with a splash'],
          0,
          'Cheap spells and extra mana sources lower the land count. Expensive spells raise it.',
        ),
      ],
      takeaways: ['17–18 lands in 40 cards; 24–25 in 60.', 'Two colors is the sweet spot; splash with 3–4 sources.', 'Mana sinks fight flood; cheap cards fight screw.', 'Judge your mana over many games.'],
    },
    {
      id: 'card-advantage',
      title: 'The Basics of Card Advantage',
      icon: '🃏',
      source: src('The Basics of Card Advantage', 'level-one/basics-card-advantage-2015-07-13'),
      terms: ['Card Advantage', 'Virtual Card Advantage', 'Dead Card', 'Blank', 'High-Impact Card', 'Card Quality', 'Card Quantity'],
      teach: [
        {
          title: 'Cards are a resource',
          body: `**Card advantage** means ending up with effectively more cards than your opponent. Every spell costs you a card, so count cards spent against cards gained.

- A draw-two spell costs 1 card and gives 2: **+1**.
- Two cards that together do what one card could do: **−1** compared with the one card.`,
          cards: ['Scholar\'s Insight'],
        },
        {
          title: 'It\'s relative',
          body: `Card advantage compares you with the opponent:

- **Mind Rend** (opponent discards two): you spend 1, they lose 2 → **+1**.
- A **2-for-1**: one of your cards takes out two of theirs.
- A sweeper that kills 3 of their creatures and 1 of yours: you lose 2, they lose 3 → **+1**.`,
        },
        {
          title: 'Virtual card advantage',
          body: `Raw counting misses how *useful* cards are.

- A **dead card** can't affect the game (removal with no targets).
- To **blank** a card is to make it dead — e.g. play no artifacts and their artifact removal does nothing.
- Card **quality** matters: two 1/1 tokens are "more cards" than one 5/5 flying dragon, but the dragon player is winning.`,
        },
      ],
      exercises: [
        num('You cast Scholar\'s Insight (draw two cards). What is your net card advantage?', 1, 'You spent 1 card and gained 2: net +1.', { unit: 'card(s)' }),
        num('You cast Mind Rend and the opponent discards two cards. Net card advantage for you?', 1, 'You spent 1 card; the opponent lost 2. You come out 1 card ahead.', { unit: 'card(s)' }),
        num(
          'Your sweeper destroys three of the opponent\'s creatures and one of yours. What is your net card advantage?',
          1,
          'You lost 2 cards (the sweeper and your creature). They lost 3. Net +1.',
          { unit: 'card(s)' },
        ),
        board({
          prompt: 'The opponent attacks with Grizzly Cub and Pack Wolf (both 2/2). You have Crypt Shambler (2/3) and Spark Jolt.',
          goalText: 'Kill both attackers and keep Crypt Shambler.',
          puzzle: {
            start: 'oppAttack',
            you: { life: 12, battlefield: ['Crypt Shambler', 'Mountain'], hand: ['Spark Jolt'] },
            opp: { battlefield: ['Grizzly Cub', 'Pack Wolf'] },
            ai: { attack: ['Grizzly Cub', 'Pack Wolf'] },
            goal: {
              type: 'all',
              goals: [
                { type: 'gone', card: 'Grizzly Cub' },
                { type: 'gone', card: 'Pack Wolf' },
                { type: 'alive', card: 'Crypt Shambler' },
              ],
            },
          },
          hint: 'Your 2/3 survives a fight with a 2/2. Use Spark Jolt on the other one.',
          solution: [{ do: 'block', blocks: [['Crypt Shambler', 'Grizzly Cub']] }, { do: 'cast', card: 'Spark Jolt', target: 'Pack Wolf' }, { do: 'pass' }],
          solutionText: 'Block Grizzly Cub with Crypt Shambler and Spark Jolt the Pack Wolf.',
          explain: 'You spend one card (Spark Jolt) and they lose two creatures: a 2-for-1. Crypt Shambler takes 2 damage and survives.',
          rating: 750,
          themes: ['card advantage', 'blocking'],
          refute: [[{ do: 'block', blocks: [['Crypt Shambler', 'Grizzly Cub']] }, { do: 'pass' }]],
        }),
        mc(
          'Your deck has no artifacts. The opponent\'s artifact-destroying spell is now…',
          ['A dead card — you blanked it', 'Card advantage for them', 'Still useful against your creatures', 'Worth two cards'],
          0,
          'By deck construction you turned their card into one that can\'t affect the game.',
        ),
        mc(
          'You cast Goblin Rally (two 1/1 tokens). The opponent casts a 5/5 flying dragon. Who is better off?',
          ['The dragon player — card quality beats raw card count here', 'You — you got two cards\' worth', 'Nobody; it\'s even', 'Whoever has more lands'],
          0,
          'Counting says you got "more". But the dragon has far more impact on the game.',
        ),
        match(
          'Match each term to its meaning.',
          [
            ['2-for-1', 'One card of yours takes out two of theirs'],
            ['Dead card', 'A card that can\'t affect the game'],
            ['Blank', 'Make an opponent\'s card useless'],
            ['Virtual card advantage', 'Counting how much impact cards have, not just how many'],
          ],
          'These ideas come up in almost every later lesson.',
        ),
      ],
      takeaways: ['Every spell costs a card: count cards spent vs. gained.', 'Card advantage is relative to the opponent.', 'Blanking and card quality are "virtual" card advantage.', 'The player with more cards doesn\'t always win.'],
    },
  ],
};
