import { board, hand, match, mc, num, order, sort, src, tf } from './helpers';
import type { Unit } from './types';

const G_W_DECK = 'Limited: green-white creature deck, 17 lands (9 Forest, 8 Plains). You are on the play; the opponent\'s deck is unknown.';

export const unit4: Unit = {
  id: 'u4',
  title: 'Concepts of Gameplay II',
  subtitle: 'Sweepers, counters, races, mulligans and sequencing',
  color: '#7a4ea3',
  lessons: [
    {
      id: 'board-sweepers',
      title: 'Board Sweepers',
      icon: '🌊',
      source: src('Board Sweepers', 'level-one/board-sweepers-2015-06-22'),
      terms: ['Board Sweepers', 'Format-Defining', 'Spot Removal'],
      teach: [
        {
          title: 'Many creatures at once',
          body: `**Board sweepers** (also called wraths) destroy many creatures at once. They come in several shapes:

- **Symmetric**: destroy all creatures.
- **Conditional**: e.g. 2 damage to each creature without flying, or -4/-4 to everything.
- **Asymmetric**: spare some creatures.`,
          cards: ['Final Judgment', 'Tremor Rift', 'Grim Tide'],
        },
        {
          title: 'Know the sweepers in your format',
          body: `Sweepers can be **format-defining**: most decks are built around them or against them. When you start a new format, learn which sweepers exist.

Ways to fight them: creatures with high toughness or flying (against conditional sweepers), tokens and creature lands, and not dumping every creature onto the board at once.`,
        },
        {
          title: 'Who should play them?',
          body: `Sweepers are best in **control** decks: they have few creatures, so "destroy all creatures" is really one-sided.

In **creature** decks, spot removal usually fits better. Imagine a creature mirror: you cast your big creature, they cast theirs. A sweeper trades 2 cards for 2. A spot removal spell kills theirs and you keep attacking.`,
        },
        {
          title: 'Main deck or sideboard?',
          body: `Sweepers are easy to sideboard (great vs. creatures, weak vs. control), but they're often **strongest in the main deck**. In game 1, creature decks haven't adapted yet. After sideboarding, they diversify their threats and play around sweepers.`,
        },
      ],
      exercises: [
        board({
          prompt: 'You\'re ahead. You know the opponent will cast Grim Tide (all creatures get -2/-2) next turn. You can cast one of your two creatures.',
          goalText: 'Still have a creature after the opponent\'s turn.',
          puzzle: {
            continueToOppTurn: true,
            you: { battlefield: ['Pack Wolf', 'Grizzly Cub', 'Plains', 'Plains', 'Forest', 'Forest'], hand: ['Stalwart Irregulars', 'Forward Cleric'] },
            opp: { life: 12, battlefield: ['Swamp', 'Swamp', 'Swamp'], hand: ['Grim Tide'], revealHand: true },
            oppTurnCasts: [{ card: 'Grim Tide' }],
            goal: { type: 'creaturesAtLeast', n: 1 },
          },
          hint: 'Which of your creatures has more than 2 toughness?',
          solution: [{ do: 'combat' }, { do: 'attack', with: ['Pack Wolf', 'Grizzly Cub'] }, { do: 'pass' }, { do: 'cast', card: 'Stalwart Irregulars' }, { do: 'endTurn' }],
          solutionText: 'Attack with your 2/2s, then cast Stalwart Irregulars (4/4). Grim Tide kills the 2/2s but the Irregulars survive as a 2/2 for the turn.',
          explain: 'You can\'t stop the sweeper, but you can choose threats it doesn\'t kill. Your 2/2s still dealt damage before they died.',
          rating: 850,
          themes: ['sweeper', 'playing around'],
          refute: [[{ do: 'combat' }, { do: 'attack', with: ['Pack Wolf', 'Grizzly Cub'] }, { do: 'pass' }, { do: 'cast', card: 'Forward Cleric' }, { do: 'endTurn' }]],
        }),
        mc(
          'Which creatures survive Tremor Rift (2 damage to each creature without flying)? (Select all that apply.)',
          ['Crypt Shambler (2/3)', 'Sky Griffin (2/2, flying)', 'Grizzly Cub (2/2)', 'Eager Squire (2/1)'],
          [0, 1],
          'A conditional sweeper: 3 toughness survives 2 damage, and fliers are not hit at all.',
        ),
        mc(
          'Why are sweepers stronger in control decks than in creature decks?',
          ['Control has few creatures, so the effect is effectively one-sided', 'Control decks have more mana', 'Creature decks can\'t cast sorceries', 'Sweepers are cheaper for control'],
          0,
          'A symmetric effect is only symmetric on paper. With no creatures of your own, you lose nothing.',
        ),
        mc(
          'In a creature mirror, you and the opponent each have a big creature. What kind of removal fits your creature deck best?',
          ['Spot removal: kill theirs, keep attacking with yours', 'A sweeper: kill both', 'No removal at all', 'A counterspell'],
          0,
          'The sweeper trades 2-for-2 and stalls your offense. Spot removal lets your creature keep working.',
        ),
        tf('Sweepers are easier to put in a sideboard, but they are often more powerful in the main deck.', true, 'In game 1, creature decks haven\'t prepared for them yet.'),
      ],
      takeaways: ['Learn the sweepers in your format.', 'Play threats that survive the sweepers you expect.', 'Sweepers shine in control; spot removal suits creature decks.'],
    },
    {
      id: 'permission-spells',
      title: 'Permission Spells',
      icon: '🚫',
      source: src('Permission Spells', 'level-one/permission-spells-2015-08-17'),
      terms: ['Permission Spells', 'Stack'],
      teach: [
        {
          title: 'Counters hit spells, not permanents',
          body: `**Permission spells** (counterspells) counter a spell while it's on the stack.

- A creature is a spell while being cast, then a **permanent** once it resolves. Counters can't touch it after that.
- **Lands are never spells**. Playing a land doesn't use the stack and can't be countered.`,
          cards: ['Dissolve Thought', 'Deny Magic', 'Scatter Essence'],
        },
        {
          title: 'Four ways to use permission',
          body: `- **Early defense**: counters answer anything (a removal spell can't always). But they're weak against very fast decks with 1-drops. Mix in removal.
- **Pushing tempo**: when you're ahead, counter their comeback spell — like a sweeper — and keep attacking.
- **Locking the late game**: hard counters protect your inevitability from the one big spell that could beat you.
- **Sideboard**: specific counters for specific matchups.

In Limited, 2–3 counters is plenty.`,
        },
        {
          title: 'Behind, even, ahead',
          body: `Permission is **poor when you're behind** (it can't remove what's already there), **good at parity**, and **deadly when you're ahead**.`,
        },
        {
          title: 'Playing against counters',
          body: `A counterspell needs mana held open. Make the opponent use it or waste it:

- Lead with a spell you care less about.
- Don't play your best threat into open counter mana and then lose it to their sweeper too.
- Use abilities on your board that force them to act.

But don't play scared: they don't always have it, and every turn you wait helps a control deck.`,
        },
      ],
      exercises: [
        board({
          prompt: 'You\'re ahead on board. On their turn, the opponent casts Final Judgment to wipe out your creatures. You hold Dissolve Thought.',
          goalText: 'Keep all three of your creatures.',
          puzzle: {
            start: 'oppMain1',
            you: { battlefield: ['Pack Wolf', 'Grizzly Cub', 'Forward Cleric', 'Island', 'Island', 'Island'], hand: ['Dissolve Thought'] },
            opp: { life: 6, battlefield: ['Plains', 'Plains', 'Plains', 'Island', 'Island'], hand: ['Final Judgment'] },
            oppCasts: [{ card: 'Final Judgment' }],
            goal: { type: 'creaturesAtLeast', n: 3 },
          },
          hint: 'Target the spell on the stack.',
          solution: [{ do: 'cast', card: 'Dissolve Thought', target: 'stack:Final Judgment' }, { do: 'pass' }],
          solutionText: 'Counter Final Judgment with Dissolve Thought.',
          explain: 'Permission is deadly when you\'re ahead: the opponent spent their turn trying to recover and got nothing.',
          rating: 750,
          themes: ['counterspell', 'stack'],
          refute: [[{ do: 'pass' }]],
        }),
        board({
          prompt: 'The opponent has three Islands open and one card in hand. You want your Stalwart Irregulars to resolve.',
          goalText: 'End the turn with Stalwart Irregulars on the battlefield.',
          puzzle: {
            you: { battlefield: ['Forest', 'Forest', 'Forest', 'Plains', 'Plains', 'Plains'], hand: ['Grizzly Cub', 'Stalwart Irregulars'] },
            opp: { battlefield: ['Island', 'Island', 'Island'], hand: ['Dissolve Thought'] },
            ai: { counter: 'eval' },
            goal: { type: 'alive', card: 'Stalwart Irregulars' },
          },
          hint: 'Lead with the spell you care less about.',
          solution: [{ do: 'cast', card: 'Grizzly Cub' }, { do: 'pass' }, { do: 'cast', card: 'Stalwart Irregulars' }, { do: 'endTurn' }],
          solutionText: 'Cast Grizzly Cub first. The opponent counters it, and then Stalwart Irregulars resolves.',
          explain: 'Early in the game, a player holding counter mana tends to use it — unused mana is wasted. Baiting with the lesser spell protects the one you care about.',
          rating: 950,
          themes: ['counterspell', 'sequencing'],
          refute: [[{ do: 'cast', card: 'Stalwart Irregulars' }, { do: 'pass' }, { do: 'cast', card: 'Grizzly Cub' }, { do: 'endTurn' }]],
        }),
        mc(
          'Which of these can Dissolve Thought (counter target spell) counter? (Select all that apply.)',
          ['A creature spell being cast', 'An instant being cast', 'A land being played', 'A creature already on the battlefield'],
          [0, 1],
          'Only spells on the stack. Lands never use the stack, and permanents already in play aren\'t spells.',
        ),
        mc('Permission is ___ when you\'re behind, ___ at parity, and ___ when you\'re ahead.', ['poor / good / deadly', 'deadly / good / poor', 'good / good / good', 'poor / poor / good'], 0, 'Counters protect a position; they can\'t repair one.'),
        num('Reid suggests at most how many counterspells in a Limited deck?', 3, 'Two or three is plenty. Permission should be one tool among many. Sealed decks can lean a bit more on them to answer bombs.', { min: 2, max: 3, unit: 'counters' }),
        tf('Because the opponent might have a counterspell, you should hold your threats until they tap out.', false, 'That\'s playing scared. They won\'t always have it, and waiting gives a control deck exactly what it wants.'),
      ],
      takeaways: ['Counters hit spells on the stack — never lands or permanents in play.', 'Poor behind, good even, deadly ahead.', 'Bait counters with lesser spells; don\'t play scared.'],
    },
    {
      id: 'creature-lands',
      title: '"Creature" Lands',
      icon: '🏔️',
      source: src('"Creature" Lands', 'level-one/creature-lands-2015-09-07'),
      terms: ['Creature Land', 'Investment'],
      teach: [
        {
          title: 'Mana early, threat later',
          body: `**Creature lands** are lands that can turn into creatures. Early they make mana; later, when you have spare mana, they attack or block.`,
          cards: ['Cascade Falls', 'Old Foundry'],
        },
        {
          title: 'A small investment',
          body: `Many creature lands enter tapped: you lose a little tempo now for a stronger card later. That's fine for midrange and control decks, not for fast aggro.

The best time: a turn when you wouldn't spend the mana anyway — like turn 1 with no 1-drop.`,
        },
        {
          title: 'Why they\'re so good',
          body: `- **Flood insurance**: extra lands become threats. That lets you play a slightly higher land count and get screwed less.
- **Resilience**: they dodge sorcery-speed sweepers (they're not creatures on the opponent's turn), and hexproof ones dodge removal.
- **Turning the corner**: once you've stabilized, animate them for a surprise attack.`,
        },
      ],
      exercises: [
        board({
          prompt: 'The opponent just wiped the board. They\'re at 3 life. Your hand is empty.',
          goalText: 'Win this turn.',
          puzzle: {
            you: { battlefield: ['Cascade Falls', 'Forest', 'Island', 'Forest', 'Island'] },
            opp: { life: 3, graveyard: ['Final Judgment'] },
            goal: { type: 'win' },
          },
          hint: 'Tap Cascade Falls to see its ability.',
          solution: [{ do: 'activate', card: 'Cascade Falls' }, { do: 'combat' }, { do: 'attack', with: ['Cascade Falls'] }],
          solutionText: 'Pay {2}{G}{U} with your basics to make Cascade Falls a 3/3, then attack.',
          explain: 'The land survived the sweeper because it wasn\'t a creature then. Pay for the ability with your other lands so the Falls stays untapped to attack.',
          rating: 650,
          themes: ['creature land', 'lethal'],
        }),
        board({
          prompt: 'It\'s the opponent\'s turn. You\'re at 3 and they have two creatures ready to attack. Your only card is Old Foundry.',
          goalText: 'Survive the attack.',
          puzzle: {
            start: 'oppMain1',
            you: { life: 3, battlefield: ['Old Foundry', 'Mountain'] },
            opp: { battlefield: ['Pack Wolf', 'Eager Squire'] },
            ai: { attack: ['Pack Wolf', 'Eager Squire'] },
            goal: { type: 'survive' },
          },
          hint: 'Old Foundry can become a creature at instant speed — then it can block.',
          solution: [{ do: 'activate', card: 'Old Foundry' }, { do: 'pass' }, { do: 'block', blocks: [['Old Foundry', 'Pack Wolf']] }],
          solutionText: 'Activate Old Foundry (paying with the Mountain), then block one attacker. You take 2 and survive at 1.',
          explain: 'Creature lands can defend too. Using the Mountain to pay keeps the Foundry untapped so it can block.',
          rating: 800,
          themes: ['creature land', 'blocking'],
          refute: [[{ do: 'pass' }, { do: 'block', blocks: [] }]],
        }),
        mc(
          'Turn 1: your hand has no 1-mana spell. Play the tapped creature land or a basic land?',
          ['The tapped creature land — you lose nothing by it entering tapped', 'The basic — always play untapped lands first', 'Neither; hold both', 'It doesn\'t matter at all'],
          0,
          'When you wouldn\'t use the mana anyway, the tapped land costs no tempo. Save the untapped basic for a turn when you need the mana right away.',
        ),
        mc('Why can decks with creature lands afford one more land than usual?', ['Extra lands become threats, so flooding hurts less', 'Creature lands cost no mana', 'They count as two lands', 'They let you draw more'], 0, 'Creature lands are insurance against flood, so you can reduce the risk of mana screw.'),
        tf('A creature land survives a sorcery that destroys all creatures (cast on the opponent\'s turn).', true, 'On the opponent\'s turn your creature land is just a land, so "destroy all creatures" doesn\'t touch it.'),
      ],
      takeaways: ['Creature lands: mana early, threat late.', 'Play tapped ones on turns you\'d waste the mana anyway.', 'Great flood insurance; they dodge sweepers.'],
    },
    {
      id: 'symmetric-effects',
      title: 'Symmetric Effects',
      icon: '⚖️',
      source: src('Symmetric Effects', 'lo/symmetric-effects-2014-09-01'),
      terms: ['Symmetric Effect', 'Dodge'],
      teach: [
        {
          title: 'Equal on paper, never in practice',
          body: `A **symmetric effect** affects both players the same way on paper — "each player discards their hand", "destroy all creatures". But the two players are never in the same position, so the effect is never really even.`,
        },
        {
          title: 'Four ways to come out ahead',
          body: `- **Use it better**: build around it. (Extra mana for everyone helps the deck full of big X spells.)
- **Dodge it**: build so it doesn't hurt you. (No multicolored cards → "each player sacrifices a multicolored permanent" only hits them.)
- **Pick the window**: you choose when to cast it. Empty your hand before "each player discards their hand"; hold creatures back before your sweeper.
- **Lock it in when ahead**: effects that take away resources hurt the player who is behind. Cast "each player sacrifices three lands" when your board is winning.`,
        },
      ],
      exercises: [
        board({
          prompt: 'Maddening Whispers: each player discards their hand, then draws cards equal to the greatest number discarded. The opponent holds four cards.',
          goalText: 'End the turn with Grizzly Cub on the battlefield and at least 4 cards in hand.',
          puzzle: {
            you: {
              battlefield: ['Island', 'Swamp', 'Forest', 'Forest', 'Swamp'],
              hand: ['Maddening Whispers', 'Grizzly Cub'],
              library: ['Forest', 'Pack Wolf', 'Swamp', 'Crypt Shambler', 'Island', 'Hero\'s Ruin'],
            },
            opp: { hand: ['Plains', 'Plains', 'Island', 'Sky Griffin'], library: ['Plains', 'Island', 'Plains', 'Island', 'Plains', 'Island'] },
            goal: { type: 'all', goals: [{ type: 'alive', card: 'Grizzly Cub' }, { type: 'handAtLeast', n: 4 }] },
          },
          hint: 'You choose when to cast a symmetric effect. What should your hand look like when you cast it?',
          solution: [{ do: 'cast', card: 'Grizzly Cub' }, { do: 'cast', card: 'Maddening Whispers' }, { do: 'endTurn' }],
          solutionText: 'Cast Grizzly Cub first to empty your hand, then Maddening Whispers: you discard nothing and draw four.',
          explain: 'You picked the best window. The opponent swapped four cards for four new ones; you gained four cards and kept your creature.',
          rating: 900,
          themes: ['symmetric effect', 'sequencing', 'card advantage'],
          refute: [[{ do: 'cast', card: 'Maddening Whispers' }, { do: 'endTurn' }]],
        }),
        match(
          'Match each way to exploit a symmetric effect with an example.',
          [
            ['Use it better', 'Extra mana for everyone, in a deck full of X spells'],
            ['Dodge it', 'Play no multicolored cards against "sacrifice a multicolored permanent"'],
            ['Pick the window', 'Empty your hand before "each player discards their hand"'],
            ['Lock it in when ahead', 'Make everyone sacrifice lands while your board is winning'],
          ],
          'In each case you arranged for the "equal" effect to hurt the opponent more.',
        ),
        mc(
          'When is the best time to cast a creature that makes each player sacrifice three lands?',
          ['When your board is already ahead', 'When you\'re far behind on board', 'On turn 2', 'Whenever you draw it'],
          0,
          'Taking away resources freezes the game. That helps the player who\'s ahead and hurts the one who needs to catch up.',
        ),
        tf('A symmetric effect always helps both players equally.', false, 'The players\' positions are never the same, so the effect never is either.'),
      ],
      takeaways: ['Symmetric on paper ≠ symmetric in play.', 'Use it better, dodge it, pick the window, or lock in a lead.'],
    },
    {
      id: 'threats-answers',
      title: 'Threats and Answers',
      icon: '🎯',
      source: src('Threats and Answers', 'lo/threats-and-answers-2014-09-08'),
      terms: ['Win Condition', 'Proactive', 'Reactive'],
      teach: [
        {
          title: 'No wrong threats',
          body: `Threats (creatures, planeswalkers) win games. Answers (removal, counters) only stop you from losing.

Dave Price put it this way: there are wrong answers, but there are **no wrong threats**. A threat is either answered (an even trade) or it moves you toward winning. An answer can be dead (nothing to hit) or the wrong kind.`,
        },
        {
          title: 'Kinds of threats',
          body: `- **Quick**: cheap creatures that come down before expensive answers.
- **Potent**: one big threat that wins if unanswered and may need several answers.
- **Resilient**: hard to remove (e.g. hexproof).
- **Guaranteed value**: leaves something behind even if answered — enters-the-battlefield effects, haste, planeswalkers that make creatures.`,
          cards: ['Ember Goblin', 'Crimson Drake', 'Mistcloak Serpent', 'Tower Spirit'],
        },
        {
          title: 'Answers need to match',
          body: `Answers are essential, but they're reactive. Burn is special: it can always hit the opponent's face, so it's never completely dead.

At a tournament with many different decks, a proactive plan has a chance against everything; an answer-heavy deck needs to guess right.`,
        },
      ],
      exercises: [
        sort(
          'What kind of threat is each card?',
          ['Quick', 'Potent', 'Resilient', 'Guaranteed value'],
          [
            ['Ember Goblin (1-mana 1/1 haste)', 0],
            ['Eager Squire (1-mana 2/1)', 0],
            ['Crimson Drake (6-mana 5/5 flier)', 1],
            ['Mistcloak Serpent (hexproof 5/5)', 2],
            ['Tower Spirit (flier that draws a card when it enters)', 3],
            ['Siegehorn Rhino (drains 3 when it enters)', 3],
          ],
          'Different threat types beat different kinds of answers.',
        ),
        mc(
          'Why are there "no wrong threats, only wrong answers"?',
          ['A threat is either answered or it advances your win; an answer can be dead or mismatched', 'Threats cost less mana', 'Answers can\'t be cast at instant speed', 'Threats can\'t be countered'],
          0,
          'Answers depend on the opponent having the right target. Threats work on their own.',
        ),
        mc('Why is a burn spell never a completely "wrong" answer?', ['It can always target the opponent\'s face', 'It\'s always cheap', 'It can\'t be countered', 'It kills any creature'], 0, 'Even with no good creature target, burn moves the opponent toward 0.'),
        mc(
          'The opponent has a lot of 3-mana removal. Which threat gives you guaranteed value?',
          ['Tower Spirit — you keep the card it draws even if it dies', 'Grizzly Cub', 'Palisade Wall', 'Stalwart Irregulars'],
          0,
          'Value that happens on entry can\'t be taken back by removal.',
        ),
      ],
      takeaways: ['Threats win; answers only prevent losing.', 'Choose threat types that beat the answers you expect.', 'Proactive plans handle unknown opponents best.'],
    },
    {
      id: 'inevitability',
      title: 'Inevitability',
      icon: '⏳',
      source: src('Inevitability', 'level-one/inevitability-2014-12-08'),
      terms: ['Inevitability'],
      teach: [
        {
          title: 'Who wins a very long game?',
          body: `You have **inevitability** if you're almost sure to win a game that goes long. It's more than card advantage: your late-game plan has to crush theirs.

A thought experiment: give both players 30 cards and 100 free mana every turn. Who wins? A deck full of burn might beat a deck with lots of draw spells but few ways to actually win.`,
        },
        {
          title: 'Sources of inevitability',
          body: `- **Resilient win conditions**: a threat that keeps coming back beats any number of removal spells.
- **Hard counters**: saved for the few cards that could beat you.
- **Incidental life gain**: takes away the opponent's reach (burn, last-ditch attacks) — best when it comes attached to other useful effects.`,
        },
        {
          title: 'What are you waiting for?',
          body: `- **You have inevitability**: play defense, avoid risks, and win at your convenience.
- **They have it**: force the action. Attack, pressure, and end the game before the late game arrives.`,
        },
      ],
      exercises: [
        mc(
          'Your deck: fast creatures and 12 burn spells. Theirs: card draw, life gain, and a threat that returns whenever it dies. If the game lasts 20 turns, who has inevitability?',
          ['The opponent', 'You', 'Nobody', 'Whoever is on the play'],
          0,
          'Life gain blunts your burn and their threat outlasts removal. You need to win early.',
        ),
        mc('The opponent has inevitability. What should you do?', ['Force the action and try to end the game soon', 'Play defensively and wait', 'Hold back creatures for a sweeper', 'Draw as many cards as possible'], 0, 'Waiting plays into their plan.'),
        mc(
          'Which card most adds inevitability to a control deck?',
          ['A win condition that can\'t be permanently removed', 'A 1-mana 2/1', 'A combat trick', 'A tapped dual land'],
          0,
          'One resilient threat can beat any number of answers in a long game.',
        ),
        tf('Having lots of card draw automatically gives you inevitability.', false, 'You also need a late-game plan that actually beats theirs.'),
        mc(
          'You have inevitability. The opponent attacks with a creature you can block safely or take 3 from. You\'re at 18. Their deck has burn.',
          ['Block — you don\'t need to take risks, and life protects against their burn', 'Take it to save your creature for attacking', 'Race them', 'Concede'],
          0,
          'With inevitability, defense is your job. Every point of life you keep makes their reach weaker.',
        ),
      ],
      takeaways: ['Inevitability = you win if the game goes long.', 'Build it with resilient threats, hard counters, and incidental life gain.', 'Have it: defend. Don\'t: force the action.'],
    },
    {
      id: 'role-assignment',
      title: 'Role Assignment',
      icon: '🎭',
      source: src('Role Assignment', 'level-one/role-assignment-2015-01-05'),
      terms: ['Adaptability', 'Initiative'],
      teach: [
        {
          title: 'Who\'s the beatdown?',
          body: `Mike Flores's classic question: in this game, which player should attack and which should defend? Getting the answer wrong loses games.

- Don't try to race an opponent who deals damage faster than you.
- Don't try to outlast an opponent with a stronger late game.`,
        },
        {
          title: 'Roles change',
          body: `Your role isn't fixed by your deck. It depends on:

- **The matchup**: a midrange deck attacks control and defends against aggro.
- **Play or draw**: in a mirror, the player on the draw often defends and trades.
- **The actual cards drawn**: a fast start can make the "slower" deck the aggressor.
- **Late-game plans**: sideboarded-in bombs → defend. They beat you with a bomb in game 1 → attack before they find it.`,
        },
        {
          title: 'Flexible cards',
          body: `Cards that work in both roles make switching easy: creatures that block well and hit hard, removal that can kill an attacker or a blocker, and especially **burn**, which can also go to the face.`,
        },
      ],
      exercises: [
        board({
          prompt: 'Aggro mirror, and you\'re on the draw — they\'re a turn ahead. They attack with two 2/1s.',
          goalText: 'Take the defensive role: trade off both attackers.',
          puzzle: {
            start: 'oppAttack',
            you: { life: 14, battlefield: ['Furnace Hound', 'Ember Goblin'] },
            opp: { battlefield: ['Eager Squire', 'Vampire Pup'] },
            ai: { attack: ['Eager Squire', 'Vampire Pup'] },
            goal: { type: 'oppCreaturesAtMost', n: 0 },
          },
          hint: 'A 1/1 kills a 2/1 in combat.',
          solution: [{ do: 'block', blocks: [['Furnace Hound', 'Eager Squire'], ['Ember Goblin', 'Vampire Pup']] }],
          solutionText: 'Block both. Every creature dies — the trades slow the game down, which is what the player on the draw wants.',
          explain: 'On the draw in a mirror, you\'re behind in the race. Trade resources and reach the later turns on even footing.',
          rating: 700,
          themes: ['blocking', 'role assignment'],
          refute: [[{ do: 'block', blocks: [] }]],
        }),
        mc('Your ramp deck faces hyper-aggro that kills by turn 5. What\'s your role?', ['Defender: use your creatures to block and survive', 'Beatdown: race them', 'Ignore their creatures', 'Mulligan to 5'], 0, 'You can\'t out-race them. Survive, then your big cards take over.'),
        mc('You lost game 1 to their 7-mana bomb. In game 2, your role is…', ['Beatdown — win before they cast it', 'Control — wait for it', 'The same as always', 'Whoever gets more lands'], 0, 'If their late game beats yours, end the game early.'),
        mc('Which kind of card is the most flexible for switching roles?', ['Burn spells', 'Walls with defender', 'Pure card draw', 'Tapped lands'], 0, 'Burn kills attackers, clears blockers, and hits the opponent.'),
        tf('Your role is decided when you build your deck and never changes.', false, 'Matchup, play/draw, the cards you drew and sideboard plans all change your role.'),
      ],
      takeaways: ['Always ask "who\'s the beatdown?"', 'Don\'t race a faster deck; don\'t outlast a stronger late game.', 'Roles shift with matchup, play/draw, and draws.'],
    },
    {
      id: 'damage-racing',
      title: 'Damage Racing',
      icon: '🏁',
      source: src('Damage Racing', 'level-one/damage-racing-2015-05-04'),
      terms: ['Damage Race', 'Chump Block', 'Turning the Corner'],
      teach: [
        {
          title: 'A race needs precision',
          body: `A **damage race** happens when neither player controls the board: fliers, pump effects or tricks make blocking bad, so both players attack. Races look reckless but need the most careful counting.`,
        },
        {
          title: 'Life is a resource',
          body: `Only 0 life matters — 1 life plays the same as 20. But low life limits you: you must block, can't use pain lands, and fear burn. Against control, taking some damage is fine. Against burn, every point counts.`,
        },
        {
          title: 'Chump blocking',
          body: `A **chump block** saves life by losing a creature.

- Early, avoid it: the creature may still do useful work, or block something bigger later.
- Late, do it when it buys the turn you need.
- Don't wait too long: fliers, burn or removal can surprise you.`,
        },
        {
          title: 'Turning the corner',
          body: `Switch from defense to offense the moment you safely can. And whenever you're not going to block with a creature, attack with it — races start unexpectedly, and early damage cuts the number of draws the opponent gets.`,
        },
      ],
      exercises: [
        num('You\'re at 10 life. The opponent attacks for 4 each turn and you can\'t block. How many of their attacks can you survive?', 2, '10 → 6 → 2. The third attack kills you.', { unit: 'attacks' }),
        num('The opponent is at 9. You hit for 3 each turn. How many of your attacks does it take to kill them?', 3, '9 → 6 → 3 → 0.', { unit: 'attacks' }),
        mc(
          'You\'re at 12 and deal 4 per turn. The opponent is at 9 and deals 5 per turn. It\'s your turn and neither side blocks. Who wins?',
          ['You — your third attack lands before theirs', 'The opponent', 'It\'s a draw', 'Nobody can tell'],
          0,
          'You: 9 → 5 → 1 → dead on your 3rd attack. Them: 12 → 7 → 2 after two attacks, so you strike first.',
        ),
        board({
          prompt: 'The opponent attacks with Cliff Giant (3/3) and Grizzly Cub (2/2). You\'re at 5. They\'re at 2 with no fliers or reach — your Sky Griffin wins next turn.',
          goalText: 'Survive and keep Sky Griffin alive.',
          puzzle: {
            start: 'oppAttack',
            you: { life: 5, battlefield: ['Ember Goblin', 'Sky Griffin'] },
            opp: { life: 2, battlefield: ['Cliff Giant', 'Grizzly Cub'] },
            ai: { attack: ['Cliff Giant', 'Grizzly Cub'] },
            goal: { type: 'all', goals: [{ type: 'survive' }, { type: 'alive', card: 'Sky Griffin' }] },
          },
          hint: 'Which creature can you afford to lose?',
          solution: [{ do: 'block', blocks: [['Ember Goblin', 'Cliff Giant']] }],
          solutionText: 'Chump block Cliff Giant with Ember Goblin. You take 2 and keep the Griffin for the winning attack.',
          explain: 'This is the right moment to chump: it buys exactly the turn you need. Your flier is the win condition, so it must not block.',
          rating: 800,
          themes: ['racing', 'chump block'],
          refute: [[{ do: 'block', blocks: [['Sky Griffin', 'Cliff Giant']] }], [{ do: 'block', blocks: [] }]],
        }),
        board({
          prompt: 'You\'re at 6, the opponent at 5. They have two ground creatures; you have a flier and a ground creature. They\'ll attack next turn.',
          goalText: 'Get the opponent to 3 or less and survive their attack.',
          puzzle: {
            continueToOppTurn: true,
            you: { life: 6, battlefield: ['Sky Griffin', 'Grizzly Cub'] },
            opp: { life: 5, battlefield: ['Pack Wolf', 'Cliff Giant'] },
            ai: { attack: ['Pack Wolf', 'Cliff Giant'] },
            goal: { type: 'all', goals: [{ type: 'oppLifeAtMost', n: 3 }, { type: 'survive' }] },
          },
          hint: 'If a creature isn\'t going to block, it should attack.',
          solution: [{ do: 'combat' }, { do: 'attack', with: ['Sky Griffin'] }, { do: 'endTurn' }, { do: 'block', blocks: [['Grizzly Cub', 'Cliff Giant']] }],
          solutionText: 'Attack with Sky Griffin (they can\'t block it) and keep Grizzly Cub home. Their attack deals at most 5, so you survive.',
          explain: 'Free damage now shortens the race. Your math: their two creatures deal 5, you\'re at 6, so the Griffin doesn\'t need to stay home.',
          rating: 900,
          themes: ['racing', 'attacking'],
          refute: [[{ do: 'endTurn' }]],
        }),
      ],
      takeaways: ['Count every race precisely.', 'Only 0 life matters, but low life limits your options.', 'Chump when it buys the turn you need.', 'Not blocking with it? Attack with it.'],
    },
    {
      id: 'mulligans',
      title: 'Mulligans',
      icon: '🔄',
      source: src('Mulligans', 'level-one/mulligans-2015-01-26'),
      terms: ['Two-to-Five Lands Strategy', 'Critical Mass'],
      teach: [
        {
          title: 'Two bad options',
          body: `A mulligan costs a card. Keeping a bad hand also costs you. Your job is to pick whichever gives you the better chance to win — without emotion, embarrassment, or frustration from earlier mulligans.`,
        },
        {
          title: 'The Two-to-Five Lands rule',
          body: `**Keep** hands with 2–5 lands. **Mulligan** hands with 0, 1, 6 or 7 lands. This simple rule is right about 90% of the time.

In Limited, also ask:
- Do I have **all my colors**?
- Do I have something to do in the **first three turns**?

Fast decks mulligan more readily; slow decks can keep almost any 3-land, 4-spell hand.`,
        },
        {
          title: 'Key cards and linear decks',
          body: `In Constructed the rule bends. A linear deck without its key piece — say, a deck built to enchant one creature, holding no creatures — should mulligan even with perfect lands.

Against such a deck, your answers become key cards: a borderline hand without them may be worse than six cards with one.`,
        },
        {
          title: 'Smaller hands',
          body: `After a mulligan, loosen up. At six, only mulligan if the hand can't win. At five, keep almost anything with a land. Below that, keep.`,
        },
      ],
      exercises: [
        hand(G_W_DECK, ['Forest', 'Plains', 'Plains', 'Grizzly Cub', 'Forward Cleric', 'Web Weaver', 'Stalwart Irregulars'], 'keep', 'Three lands, both colors, plays on turns 2, 3 and 4. An easy keep.'),
        hand(G_W_DECK, ['Forest', 'Grizzly Cub', 'Pack Wolf', 'Titan\'s Surge', 'Stalwart Irregulars', 'Thornhide Rhino', 'Sky Griffin'], 'mulligan', 'One land. Even if you draw a second, you need more to cast most of these. Mulligan.'),
        hand(G_W_DECK, ['Forest', 'Forest', 'Forest', 'Plains', 'Plains', 'Plains', 'Grizzly Cub'], 'mulligan', 'Six lands and one spell: you\'ll flood out. Mulligan.'),
        hand(G_W_DECK, ['Forest', 'Forest', 'Forest', 'Forest', 'Grizzly Cub', 'Pack Wolf', 'Titanic Bloom'], 'keep', 'Four lands and three green spells you can cast early. No Plains yet, but every card here is castable. Keep.'),
        hand(
          'Constructed: a deck that wins by pumping one creature with enchantments and tricks (like White-Blue Heroic). Game 1, on the play.',
          ['Plains', 'Island', 'Sunlit Causeway', 'Plains', 'Mighty Vault', 'Resolute Stand', 'Mighty Vault'],
          'mulligan',
          'Good lands, but no creature to pump. The deck can\'t execute its plan. Mulligan even though the lands are fine.',
        ),
        mc('Which two questions does Reid suggest for Limited opening hands?', ['Do I have all my colors? Do I have plays in the first three turns?', 'Do I have a bomb? Do I have removal?', 'Am I on the play? Is my opponent good?', 'Do I have a combat trick? Do I have a flier?'], 0, 'Colors and early plays decide most Limited keeps.'),
        mc('You mulliganed to five. The new hand has one land and four spells. Keep?', ['Keep — at five, keep almost any hand with a land', 'Mulligan to four', 'Only keep if on the draw', 'Only keep with two colors'], 0, 'The odds of finding a better four-card hand are worse than drawing into this one.'),
      ],
      takeaways: ['Keep 2–5 lands; mulligan 0, 1, 6, 7.', 'Limited: all colors + early plays?', 'Linear decks need their key cards.', 'Be more lenient with smaller hands.'],
    },
    {
      id: 'sequencing',
      title: 'Sequencing',
      icon: '🔢',
      source: src('Sequencing', 'level-one/sequencing-2015-02-16'),
      terms: ['Sequencing'],
      teach: [
        {
          title: 'Plan the whole turn first',
          body: `After you untap and draw, take 10–20 seconds to map your whole turn before touching anything. It prevents "oops, I should have done that first".`,
        },
        {
          title: 'Four kinds of actions',
          body: `Every action does one or more of these:

1. **Gives you information** (drawing, looking at cards).
2. **Gives the opponent information** (revealing a card, casting your bomb).
3. **Forces you to make a decision** (choosing which cards to keep).
4. **Forces the opponent to make a decision** (attacking, making them discard).`,
        },
        {
          title: 'The ordering rule',
          body: `Do actions that **give you information** and **force the opponent to decide** as early as possible.

Do actions that **give the opponent information** and **force you to decide** as late as possible.

Common results: attack before casting creatures; cast card draw before your land drop (you might draw a better land); cast discard spells early, before they know your hand.`,
        },
      ],
      exercises: [
        board({
          prompt: 'You have three Islands and a Swamp. In hand: Scholar\'s Insight (draw two) and a Plains. The top of your library holds a Forest and Pack Wolf.',
          goalText: 'End the turn with Pack Wolf on the battlefield.',
          puzzle: {
            you: { battlefield: ['Island', 'Island', 'Island', 'Swamp'], hand: ['Scholar\'s Insight', 'Plains'], library: ['Forest', 'Pack Wolf', 'Swamp', 'Island'] },
            opp: {},
            goal: { type: 'alive', card: 'Pack Wolf' },
          },
          hint: 'Draw first, then decide which land to play.',
          solution: [{ do: 'cast', card: 'Scholar\'s Insight' }, { do: 'land', card: 'Forest' }, { do: 'cast', card: 'Pack Wolf' }, { do: 'endTurn' }],
          solutionText: 'Cast Scholar\'s Insight before your land drop. You draw the Forest, play it, and cast Pack Wolf with Forest + Swamp.',
          explain: 'Card draw gives you information, so it comes before the decision it informs — which land to play.',
          rating: 850,
          themes: ['sequencing'],
          refute: [[{ do: 'land', card: 'Plains' }, { do: 'cast', card: 'Scholar\'s Insight' }, { do: 'endTurn' }]],
        }),
        order(
          'Your 2/2 faces an untapped 3/3. Your hand: a land, a pump spell (+3/+3) and a card-draw spell. Put your turn in the best order.',
          ['Attack with your 2/2', 'If they block, cast the pump spell; if not, cast the card-draw spell', 'Play your land'],
          'Attack first to force their decision while they know least. The land goes last: it gives information away and you might draw a better one.',
        ),
        order(
          'Your hand: a spell that makes the opponent discard, a land, and a combat trick. Your 2/2 faces their untapped 3/3. Order your turn.',
          ['Cast the discard spell', 'Play the land', 'Attack', 'Cast the trick if they block'],
          'Make them decide what to discard while they know least about your plans. Then play the land so the trick is available, and attack.',
        ),
        sort(
          'Which kind of action is each one?',
          ['Gives you information', 'Gives the opponent information', 'Forces you to decide', 'Forces the opponent to decide'],
          [
            ['Drawing a card', 0],
            ['Casting your bomb creature', 1],
            ['A spell that shows you cards and makes you pick some', 2],
            ['Attacking', 3],
            ['Making the opponent discard', 3],
          ],
          'Do the first and last kinds early; the middle two late.',
        ),
        mc(
          'Why do you usually attack before casting your new creature?',
          ['The opponent blocks with less information, and you see combat before deciding what to cast', 'Creatures can\'t be cast after combat', 'It saves mana', 'Attacking untaps your lands'],
          0,
          'Casting first tells them what you have. After combat you also know which creature you need.',
        ),
      ],
      takeaways: ['Map the whole turn before acting.', 'Gain info and force their decisions early.', 'Give away info and make your own decisions late.'],
    },
    {
      id: 'play-or-draw',
      title: 'Play or Draw',
      icon: '🎲',
      source: src('Play or Draw', 'level-one/play-or-draw-2015-03-16'),
      terms: ['Zero-Sum Game', 'Initiative'],
      teach: [
        {
          title: 'The default: play first',
          body: `The player going first skips their first draw. In return they get tempo: they deploy first and often get one more turn before the game ends (6 turns to 5, or 4 to 3).

Reid's rule of thumb: if you always choose to play first, you'll rarely be making a mistake.`,
        },
        {
          title: 'When drawing can be right',
          body: `Drawing gives you one more card on each of your turns — useful for hitting land drops. It can be right only when all of these hold:

- early tempo is unlikely to decide the game,
- the decks need lots of resources (expensive spells, demanding mana),
- total mana isn't the limit,
- games will go long.

That happens sometimes in Sealed, occasionally in Draft, almost never in Constructed.`,
        },
        {
          title: 'Speed of the format',
          body: `The faster the format, the bigger the edge from going first. In a zero-sum game, if the opponent's fast deck wants to play first, taking that from them is itself an advantage.`,
        },
      ],
      exercises: [
        mc('What should you choose by default?', ['Play first', 'Draw first', 'Decide by coin flip', 'Whatever the opponent wants'], 0, 'Going first is right in the vast majority of situations.'),
        sort(
          'Which choice fits each situation?',
          ['Choose to play', 'Choosing to draw can be right'],
          [
            ['A fast Constructed format', 0],
            ['The opponent\'s deck is aggressive', 0],
            ['You don\'t know — when in doubt', 0],
            ['Sealed: both decks slow, clunky, with shaky mana and long games', 1],
          ],
          'Drawing is a niche choice for slow, resource-hungry games.',
        ),
        mc('In which kind of format is choosing to draw almost never right?', ['Constructed', 'Sealed', 'Draft', 'Casual multiplayer'], 0, 'Constructed decks are fast and powerful, so tempo matters most.'),
        mc('Why does going first matter more in fast formats?', ['A 4-vs-3-turn edge is proportionally bigger than 11 vs 10', 'Fast formats give extra cards', 'The draw step is skipped twice', 'It doesn\'t'], 0, 'In short games, one extra turn is a large share of the whole game.'),
      ],
      takeaways: ['Play first by default.', 'Draw only for slow, resource-hungry, long games (mostly Sealed).', 'The faster the format, the bigger the edge.'],
    },
  ],
};
