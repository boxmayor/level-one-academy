import { board, hand, mc, order, sort, src, tf } from './helpers';
import type { Unit } from './types';

export const unit5: Unit = {
  id: 'u5',
  title: 'Concepts of Gameplay III',
  subtitle: 'Investment, line-ups, outs, precision and timing',
  color: '#1f7f82',
  lessons: [
    {
      id: 'investment',
      title: 'Investment',
      icon: '📈',
      source: src('Investment', 'level-one/investment-2015-03-02'),
      terms: ['Investment'],
      teach: [
        {
          title: 'Value now beats value later',
          body: `Money today is worth more than the same money tomorrow. In Magic, an effect is worth more when it hits the board now. A 2/2 on turn 2 attacks more often and forces answers sooner than the same 2/2 on turn 5 — and the game might end before a slow payoff arrives.`,
        },
        {
          title: 'What counts as an investment',
          body: `An **investment** spends resources now for a payoff later: mana creatures, card draw, enchantments that give you something every turn. Even a normal creature is a small investment: it pays off when it attacks next turn.

Investments cost tempo. Some make it back by giving value every turn after.`,
          cards: ['Mana Elf', 'Scholar\'s Tome', 'Scholar\'s Insight'],
        },
        {
          title: 'Two questions',
          body: `- **How long will this game last?** A card-a-turn engine is great over ten turns and poor over two.
- **What does spending this turn cost me?** Against an aggressive start, turn 4 may be your last chance to stabilize.

Investments are better in slower matchups and slower formats (like Sealed). The healthiest ones give some immediate impact plus a later payoff.`,
        },
      ],
      exercises: [
        board({
          prompt: 'You\'re at 4 facing Mogg Brute (3/2, menace) and Furnace Hound (2/1). You have four Forests. They will attack next turn.',
          goalText: 'Survive the opponent\'s next turn.',
          puzzle: {
            continueToOppTurn: true,
            you: { life: 4, battlefield: ['Forest', 'Forest', 'Forest', 'Forest'], hand: ['Scholar\'s Tome', 'Web Weaver'] },
            opp: { battlefield: ['Mogg Brute', 'Furnace Hound'] },
            ai: { attack: ['Mogg Brute', 'Furnace Hound'] },
            goal: { type: 'survive' },
          },
          hint: 'The investment pays off later — but will there be a later?',
          solution: [{ do: 'cast', card: 'Web Weaver' }, { do: 'endTurn' }, { do: 'block', blocks: [['Web Weaver', 'Furnace Hound']] }],
          solutionText: 'Cast Web Weaver and block Furnace Hound with it. You take 3 from the Brute and survive at 1.',
          explain: 'Scholar\'s Tome would draw you lots of cards over a long game, but against this board there is no long game. Affect the board now.',
          rating: 800,
          themes: ['investment', 'defense'],
          refute: [[{ do: 'cast', card: 'Scholar\'s Tome' }, { do: 'endTurn' }]],
        }),
        mc(
          'Turn 4 against a slow control deck with no creatures. Cast a 4-mana artifact that draws you a card every turn?',
          ['Yes — they aren\'t pressuring you, so the investment has time to pay off', 'No — always develop creatures first', 'No — investments are never worth it', 'Only if you\'re on the draw'],
          0,
          'In a slow matchup the game lasts long enough for the engine to return far more than it cost.',
        ),
        mc('Which of these are investments? (Select all that apply.)', ['A mana creature', 'A draw-two sorcery', 'A creature with haste', 'An instant that deals 3 damage'], [0, 1], 'Haste creatures and burn affect the game right away. Mana creatures and card draw pay off on later turns.'),
        tf('Investments are generally better in slower formats like Sealed.', true, 'Longer games give investments time to pay back.'),
      ],
      takeaways: ['Value now > value later.', 'Ask how long the game will last and what this turn costs.', 'Prefer investments with immediate impact.'],
    },
    {
      id: 'line-up-theory',
      title: 'Line-Up Theory',
      icon: '🧰',
      source: src('Line-Up Theory', 'level-one/line-theory-2015-03-23'),
      terms: ['Line-Up Theory', 'Situational'],
      teach: [
        {
          title: 'The right tool for every job',
          body: `**Line-up theory** is matching each of your answers to the threat it's best against. Spend your only anti-flier removal on a ground creature and the flier that shows up later beats you.`,
        },
        {
          title: 'Deck vs. deck',
          body: `Look at the whole matchup. In one control mirror, one deck had about 20 answers to the other's 6 real threats. Saving counters only for those threats meant the other deck ran out of ways to win and eventually drew its whole library.

But waste your answers on small stuff and the matchup can flip.`,
        },
        {
          title: 'Hand vs. hand, and Limited',
          body: `In the moment: which of their cards can only one of your answers handle? Save that answer for that card and handle the rest another way — a block, a trade, or simply taking some damage.

In Limited, save narrow, powerful removal for probable bombs (big fliers especially) instead of the first creature you see.`,
        },
      ],
      exercises: [
        board({
          prompt: 'The opponent attacks with Grizzly Cub (2/2) and Sky Griffin (2/2, flying). You have Crypt Shambler (2/3) and Spark Jolt.',
          goalText: 'Kill both attackers and keep Crypt Shambler.',
          puzzle: {
            start: 'oppAttack',
            you: { life: 10, battlefield: ['Crypt Shambler', 'Mountain'], hand: ['Spark Jolt'] },
            opp: { battlefield: ['Grizzly Cub', 'Sky Griffin'] },
            ai: { attack: ['Grizzly Cub', 'Sky Griffin'] },
            goal: {
              type: 'all',
              goals: [{ type: 'gone', card: 'Grizzly Cub' }, { type: 'gone', card: 'Sky Griffin' }, { type: 'alive', card: 'Crypt Shambler' }],
            },
          },
          hint: 'Which attacker can your Shambler not handle?',
          solution: [{ do: 'block', blocks: [['Crypt Shambler', 'Grizzly Cub']] }, { do: 'cast', card: 'Spark Jolt', target: 'Sky Griffin' }, { do: 'pass' }],
          solutionText: 'Block the Cub with Crypt Shambler, and use Spark Jolt on the flier — the one threat only the Jolt can answer.',
          explain: 'Your Shambler handles the ground creature for free. Your burn spell is the only answer to the flier, so it goes there.',
          rating: 750,
          themes: ['line-up', 'removal'],
          refute: [[{ do: 'block', blocks: [['Crypt Shambler', 'Grizzly Cub']] }, { do: 'cast', card: 'Spark Jolt', target: 'Grizzly Cub' }, { do: 'pass' }]],
        }),
        mc(
          'Limited: your only answer to fliers is one removal spell. The opponent plays a 2/2 ground creature your 2/3 can block. Use the removal?',
          ['No — save it; your blocker handles the 2/2', 'Yes — kill everything as soon as possible', 'Yes — removal is best early', 'Only if you\'re ahead'],
          0,
          'Use the right tool for each job. The flier bomb may come later, and only that spell can stop it.',
        ),
        mc(
          'In a control matchup, you have about 20 answers and the opponent has only 6 real threats. What should you do?',
          ['Save your answers for those real threats and ignore the small stuff', 'Counter everything they cast', 'Race them', 'Sideboard out your answers'],
          0,
          'If your answers outlast their threats, they eventually can\'t win at all.',
        ),
        mc(
          'You hold two removal spells: one kills anything, the other only kills creatures with power 3 or less. The opponent plays a 2/2. Which do you use (if any)?',
          ['The one that only kills small creatures', 'The one that kills anything', 'Both', 'Neither, ever'],
          0,
          'Keep the flexible answer for the threat only it can handle.',
        ),
      ],
      takeaways: ['Match each answer to the threat it\'s best against.', 'Count threats vs. answers across the whole matchup.', 'Save narrow answers for the threats that need them.'],
    },
    {
      id: 'ahead-behind',
      title: 'Playing From Ahead, Playing From Behind',
      icon: '🎢',
      source: src('Playing From Ahead, Playing From Behind', 'level-one/playing-ahead-playing-behind-2015-03-30'),
      terms: ['Out', 'Slowroll'],
      teach: [
        {
          title: 'Behind: play to your outs',
          body: `An **out** is a card or event you need to win from a losing position. If you'd lose anyway without it, set up so that if the out comes, you win.

In a famous game, a player losing badly held a 4-damage burn spell. Using it on a creature only delayed the loss. He aimed it at the opponent's face instead, drew a second burn spell, and won.`,
        },
        {
          title: 'Behind: complicate, and never concede',
          body: `A complicated board creates more chances: for a surprise draw to matter and for the opponent to misstep. Keep creatures around even if it costs some life.

Play until you're actually dead. Make the opponent find the win.`,
        },
        {
          title: 'Ahead: think about their outs',
          body: `Ask: how can they still beat me? If their only way back is a sweeper, hold some creatures back. If it's burn, protect your life total.

**Simplify**: trade resources. The same advantage matters more when both sides have little: 11 cards vs 9 becomes 8 vs 6 after three even trades.`,
        },
        {
          title: 'The winning turn',
          body: `Slow down. Could a counterspell, life gain, or a trick stop you? Is there a safer route to the same win? Taking your time here isn't slowrolling — blundering a won game is worse.`,
        },
      ],
      exercises: [
        mc(
          'You\'re at 3 and will die to their attack next turn no matter what. They\'re at 7. You hold Scorching Blast (4 damage). What gives you the best chance?',
          ['Blast the opponent (7 → 3) and hope to draw more burn', 'Kill their biggest creature', 'Hold it', 'Concede'],
          0,
          'Killing a creature doesn\'t stop the lethal attack. Only burn to the face gives you an out.',
          {
            scene: {
              you: { life: 3, battlefield: ['Mountain', 'Mountain', 'Mountain'], hand: ['Scorching Blast'] },
              opp: { life: 7, battlefield: ['Stalwart Irregulars', 'Cliff Giant'] },
              note: 'Any one of their creatures is lethal next turn.',
            },
          },
        ),
        mc('You\'re behind against a big board. Should you complicate or simplify the game?', ['Complicate: more creatures and options mean more chances', 'Simplify: trade everything off', 'Concede to save time', 'Stop attacking forever'], 0, 'Complex boards give your outs, and opponent mistakes, more room.'),
        mc('You\'re well ahead. Why trade creatures even when you don\'t have to?', ['An advantage is bigger when both sides have fewer resources', 'Trading gives you cards', 'It speeds up your mana', 'It forces a draw'], 0, 'Being up 2 cards means more with 8 vs 6 than with 20 vs 18.'),
        tf('You should concede as soon as you think you\'re losing, to save time.', false, 'Play until the end. The only reasons to concede are to save time for later games or to hide information.'),
        mc(
          'You\'re far ahead; the opponent\'s only realistic way back is a board sweeper. You have two creatures in play and two in hand.',
          ['Attack with what you have and keep the other two in hand', 'Cast everything to maximize damage', 'Stop attacking', 'Discard your hand'],
          0,
          'If they don\'t have it, you win anyway. If they do, you rebuild immediately.',
        ),
      ],
      takeaways: ['Behind: play to your outs, complicate, never concede.', 'Ahead: play around their outs and simplify.', 'Double-check the winning turn.'],
    },
    {
      id: 'going-through-motions',
      title: 'Going Through the Motions',
      icon: '🎯',
      source: src('Going Through the Motions', 'level-one/going-through-motions-2015-05-11'),
      terms: ['Going Through the Motions'],
      teach: [
        {
          title: 'Everything matters',
          body: `You never know which decision will matter, so treat each one as if it does.

Real example: a player protected their creature from a spell and casually picked a protection color — the same color as the Aura enchanting their creature. The Aura fell off and the game was lost.`,
        },
        {
          title: 'Casting a spell properly',
          body: `Complete every step, in order, before seeing the opponent's reaction:

1. Announce modes and extra costs (including the value of X).
2. Choose targets.
3. Divide damage or effects.
4. Pay the costs.

You can't cast half a spell, pause, and finish after seeing their response. And don't let opponents do that to you.`,
        },
        {
          title: 'Play it out, and hide information',
          body: `The game isn't over until someone loses. When facing lethal, first make sure the opponent actually finished the spell, then look for any response.

Small habits hide information: tap basic lands first and keep dual lands open, so the opponent can't tell which instants you might still cast.`,
        },
      ],
      exercises: [
        order('Put the steps of casting a spell in order.', ['Announce modes and extra costs (including X)', 'Choose targets', 'Divide damage or effects', 'Pay the costs'], 'All four steps happen before the opponent responds.'),
        mc(
          'You cast a {1}{B} spell. Untapped: Swamp, Swamp, and a dual land that makes {U} or {B}. Which lands should you tap?',
          ['Both Swamps', 'The dual land and one Swamp', 'Any two — it doesn\'t matter', 'All three'],
          0,
          'Keeping the dual land open leaves you able to cast a blue instant — and keeps the opponent guessing.',
          { scene: { you: { battlefield: ['Swamp', 'Swamp', 'Gloomwater Grotto'], hand: ['Soul Siphon', 'Deny Magic'] }, opp: { battlefield: ['Grizzly Cub'] } } },
        ),
        mc(
          'The opponent reveals a damage spell, then waits to see your reaction before choosing its targets. What\'s wrong?',
          ['A spell must be fully cast — targets, division and payment — before you respond', 'Nothing, that\'s normal', 'They should have tapped lands first', 'Revealing cards is illegal'],
          0,
          'Casting part of a spell to gain information is improper. Insist that they finish it.',
        ),
        tf('If a choice seems not to matter, it\'s fine to pick at random.', false, 'You can\'t know which decisions will matter later. Take a second and pick carefully.'),
        mc('You\'re at 3 and the opponent casts what looks like lethal burn. What do you do first?', ['Make sure the spell is fully cast, then check every possible response', 'Concede immediately', 'Pick up your cards', 'Ask them to hurry'], 0, 'It costs nothing to take a final look for a way out.'),
      ],
      takeaways: ['Treat every decision as important.', 'Cast spells fully: modes, targets, division, payment.', 'Play until the end; hide info by tapping basics first.'],
    },
    {
      id: 'mulligans-constructed',
      title: 'Mulligans Part III: Constructed',
      icon: '🗂️',
      source: src('Mulligans Part III: Constructed', 'level-one/mulligans-part-iii-constructed-2015-06-29'),
      terms: ['Two-to-Five Lands Strategy'],
      teach: [
        {
          title: 'Know your deck',
          body: `Constructed decks range from blisteringly fast to glacially slow, so mulligans depend on context.

**Key cards** change hand values. A deck that enchants hexproof creatures needs one of those creatures; a ramp deck needs its mana creature. Without the key card, a hand that looks fine is often a mulligan.`,
        },
        {
          title: 'Early plays can\'t be recovered',
          body: `You can draw your expensive cards later, but you can never go back to turn 1 to make the play you missed. The faster your deck (or theirs), the more your opening hand must contain the early plays.

A fast deck mulligans a hand of lands and burn with no creatures. A slow control deck happily keeps lands and removal.`,
        },
        {
          title: 'Know your opponent',
          body: `The same seven cards can be a keep against a slow deck and a mulligan against a fast one. After sideboarding, hate cards become key cards: a decent six with the right answer can beat a mediocre seven without it.`,
        },
      ],
      exercises: [
        hand(
          'Mono-red aggro, game 1, unknown opponent.',
          ['Mountain', 'Mountain', 'Prismatic Well', 'Spark Jolt', 'Lightning Lance', 'Lightning Lance', 'Scorching Blast'],
          'mulligan',
          'Three lands and four spells looks fine, but there are no creatures. An aggro deck needs early threats; this is a control hand in an aggro deck.',
        ),
        hand(
          'White-blue control against another slow control deck.',
          ['Plains', 'Island', 'Sunlit Causeway', 'Island', 'Plains', 'Dissolve Thought', 'Deep Study'],
          'keep',
          'Five lands, a counter and card draw is a fine start for a long control mirror.',
        ),
        hand(
          'White-blue control against a fast mono-red aggro deck.',
          ['Plains', 'Island', 'Sunlit Causeway', 'Island', 'Plains', 'Dissolve Thought', 'Deep Study'],
          'mulligan',
          'Same seven cards, different opponent: nothing here stops early creatures. Against aggro you need cheap defense.',
        ),
        hand(
          'Green ramp deck (wants to cast big spells from turn 3–4). Game 1.',
          ['Forest', 'Forest', 'Forest', 'Elder Oak', 'Thornhide Rhino', 'Elder Oak', 'Wildborn Hydra'],
          'mulligan',
          'No mana creature and nothing to do until turn 5. For a ramp deck, a borderline hand without acceleration is a mulligan.',
        ),
        hand(
          'Green ramp deck. Game 1.',
          ['Forest', 'Forest', 'Mirehollow', 'Mana Elf', 'Mana Elf', 'Thornhide Rhino', 'Elder Oak'],
          'keep',
          'Two mana creatures make this hand explosive: a 5-drop on turn 3 is possible.',
        ),
        mc('Why should your opening hand favor cheap plays?', ['You can draw expensive cards later, but you can\'t go back to make a turn-1 play', 'Cheap cards are more powerful', 'Expensive cards can\'t be kept', 'It lowers your land count'], 0, 'Early tempo is irreversible.'),
      ],
      takeaways: ['Key cards change what\'s keepable.', 'Fast decks need early plays in the opener.', 'The same hand can be a keep or a mulligan depending on the opponent.'],
    },
    {
      id: 'safe-scared',
      title: 'Playing Safe and Playing Scared',
      icon: '😨',
      source: src('Playing Safe and Playing Scared', 'level-one/playing-safe-and-playing-scared-2015-08-24'),
      teach: [
        {
          title: 'Safe vs. scared',
          body: `**Playing safe**: avoiding needless risks when you're ahead or even, to squeeze out every edge.

**Playing scared**: caution that costs you the game — giving the opponent extra draw steps, missing damage, or never casting spells because they *might* have a counter.`,
        },
        {
          title: 'A four-step check',
          body: `1. Can I afford to play safe? (Am I winning if the game goes long?)
2. What exactly is the risk — a specific card, not a vague fear?
3. What would playing around it look like?
4. What does that cost me (tempo, damage, extra turns for them)?`,
        },
        {
          title: 'Know your bias',
          body: `Reid once held back his big flier for several turns, fearing two specific cards. Neither showed up — but the extra draw steps let the opponent find a blocker and finally burn him out.

If you're naturally cautious, lean aggressive in close spots; if you're naturally aggressive, lean cautious. Strong opponents don't draw better cards than anyone else.`,
        },
      ],
      exercises: [
        board({
          prompt: 'The opponent is at 4 with one blocker (Web Weaver, 1/4 reach) and one card in hand. You have three 2-power creatures.',
          goalText: 'Win this turn.',
          puzzle: {
            you: { battlefield: ['Sky Griffin', 'Pack Wolf', 'Grizzly Cub'] },
            opp: { life: 4, battlefield: ['Web Weaver', 'Swamp'], hand: ['Plains'] },
            goal: { type: 'win' },
          },
          hint: 'One blocker can stop only one attacker.',
          solution: [{ do: 'combat' }, { do: 'attack', with: ['Sky Griffin', 'Pack Wolf', 'Grizzly Cub'] }],
          solutionText: 'Attack with all three. Web Weaver blocks one; the other two deal 4.',
          explain: 'Holding creatures back "just in case" would give the opponent another draw step. When the math says you win, attack.',
          rating: 650,
          themes: ['lethal', 'playing scared'],
          refute: [[{ do: 'combat' }, { do: 'attack', with: ['Pack Wolf', 'Grizzly Cub'] }], [{ do: 'endTurn' }]],
        }),
        mc(
          'Low on life, Reid held back his big flier for several turns, fearing two specific cards. What went wrong?',
          ['The extra turns let the opponent draw a blocker and burn to finish him', 'He attacked too early', 'He forgot a trigger', 'He mulliganed badly'],
          0,
          'Neither feared card appeared. The cost of "safety" was extra draw steps for the opponent.',
        ),
        mc('You know you tend to be cautious. In a close decision between attacking and holding back, you should lean…', ['Aggressive', 'Cautious', 'Random', 'Whatever the opponent expects'], 0, 'Correct for your natural bias.'),
        sort(
          'Playing safe or playing scared?',
          ['Playing safe', 'Playing scared'],
          [
            ['Holding one creature back when you\'re far ahead and they need a sweeper', 0],
            ['Blocking to keep your life high against a burn deck when you have inevitability', 0],
            ['Never casting a threat because the control player might have a counter', 1],
            ['Skipping a lethal attack because they might have a trick', 1],
            ['Against a control deck, waiting turns to rebuild instead of pressuring', 1],
          ],
          'Safe play protects a lead cheaply. Scared play gives up real value to avoid imagined risks.',
        ),
        tf('Stronger opponents are more likely to have the exact card you fear.', false, 'Their decks draw randomly like anyone else\'s. Don\'t give them extra credit.'),
      ],
      takeaways: ['Play safe when you can afford it; don\'t play scared.', 'Name the specific risk and weigh the cost.', 'Correct for your natural bias.'],
    },
    {
      id: 'when-to-cast',
      title: 'When to Cast Your Spells',
      icon: '⏰',
      source: src('When to Cast Your Spells', 'level-one/when-cast-your-spells-2015-08-31'),
      teach: [
        {
          title: 'Default: as late as possible',
          body: `Waiting until the last moment gives you the most information and keeps the opponent guessing about your open mana.

Two big exceptions:
- The spell **gives information** you need for another decision (draw first, then pick your land or plan).
- You **fear a response**, and right now the opponent is tapped out.`,
        },
        {
          title: 'Combat tricks',
          body: `If a block looks suspicious, the opponent may have a trick. Pass priority first: let them commit, then respond with yours and trump it.

Against counterspells, the logic flips: cast your pump **before** blocking. If it's countered, you simply don't block and keep your creature.`,
        },
        {
          title: 'Removal and burn',
          body: `Damage-based removal can be foiled by a pump spell, so cast it while they're tapped out. Burn in the opponent's upkeep can force them to spend mana on their own turn if they want to counter it.

Ask: Can my spell fail? When is it most likely to succeed? Can timing gain me information or value? How can I most inconvenience them?`,
        },
      ],
      exercises: [
        board({
          prompt: 'You attack with two Crypt Shamblers (2/3). The opponent blocks each with a Forward Cleric (2/2) and has two Plains open. You hold Titanic Bloom (+4/+4).',
          goalText: 'Kill both Clerics and keep both Shamblers.',
          puzzle: {
            you: { battlefield: ['Crypt Shambler', 'Crypt Shambler', 'Forest', 'Forest'], hand: ['Titanic Bloom'] },
            opp: { battlefield: ['Forward Cleric', 'Forward Cleric', 'Plains', 'Plains'], hand: ['Mighty Vault'] },
            ai: { blocks: [['Forward Cleric', 'Crypt Shambler'], ['Forward Cleric', 'Crypt Shambler']] },
            goal: { type: 'all', goals: [{ type: 'gone', card: 'Forward Cleric' }, { type: 'alive', card: 'Crypt Shambler', count: 2 }] },
          },
          hint: 'Your creatures already win both fights. Why would they block like this? Let them act first.',
          solution: [
            { do: 'combat' },
            { do: 'attack', with: ['Crypt Shambler', 'Crypt Shambler'] },
            { do: 'pass' },
            { do: 'cast', card: 'Titanic Bloom', target: 'you:Crypt Shambler' },
            { do: 'pass' },
            { do: 'pass' },
          ],
          solutionText: 'Pass priority after blocks. When they pump a Cleric with Mighty Vault, respond with Titanic Bloom on the Shambler it\'s blocking.',
          explain: 'Their blocks only make sense with a trick. By waiting, you see which creature they pump, and your bigger trick answers theirs. Casting first would let them pump the *other* Cleric.',
          rating: 1150,
          themes: ['combat trick', 'stack', 'timing'],
          refute: [
            [
              { do: 'combat' },
              { do: 'attack', with: ['Crypt Shambler', 'Crypt Shambler'] },
              { do: 'cast', card: 'Titanic Bloom', target: 'you:Crypt Shambler' },
              { do: 'pass' },
              { do: 'pass' },
            ],
          ],
        }),
        mc(
          'Your removal deals damage. The opponent has two open Forests and cards in hand. When is the best time to cast it?',
          ['When they\'re tapped out, so a pump spell can\'t save their creature', 'Right now, into their open mana', 'Never — hold it forever', 'Only in response to their attack'],
          0,
          'Damage-based removal can be beaten by a pump in response. Tapped-out opponents can\'t respond.',
        ),
        mc(
          'The opponent is at 3; you hold Lightning Lance but think they might have a counterspell. Why cast it in their upkeep?',
          ['It forces them to use their mana on their own turn if they want to counter it', 'Spells deal double damage in upkeep', 'They can\'t counter during upkeep', 'It draws you a card'],
          0,
          'If they counter it, they have less mana for their turn. If not, you win before they draw.',
        ),
        mc(
          'The opponent attacks; they have three Islands open, possibly holding a counter for your pump spell. Your 2/2 would lose the fight without the pump. When should you pump?',
          ['Before declaring the block — if it\'s countered, just don\'t block', 'After blocking, like any trick', 'Never cast tricks against blue', 'During your own turn'],
          0,
          'Pumping first means a counter only costs you the pump, not the creature too.',
        ),
        mc(
          'You want to cast a draw spell and play a land this turn. Why cast the draw spell first?',
          ['It gives you information for the land choice', 'Draw spells are cheaper after lands', 'Lands can\'t be played after spells', 'It doesn\'t matter'],
          0,
          'Spells that give information should come before the decisions they inform.',
        ),
      ],
      takeaways: ['Default: cast as late as possible.', 'Exceptions: info you need now, or a tapped-out opponent.', 'Let them commit tricks first; pump before blocks vs. counters.'],
    },
    {
      id: 'flexibility',
      title: 'Flexibility',
      icon: '🤸',
      source: src('Flexibility', 'level-one/flexibility-2015-09-14'),
      terms: ['Flexible', 'Modal Spell', 'Mana Sink', 'Consistency'],
      teach: [
        {
          title: 'Lower risk, higher consistency',
          body: `Flexible cards rarely let you down. They lower your risk and make your deck more **consistent** — especially when the flexibility costs little power.`,
        },
        {
          title: 'Three kinds of flexible cards',
          body: `- **Modal spells**: choose a mode. Three modes that would each be weak alone can make one great card.
- **Mana sinks**: cheap to cast, and they soak up extra mana late — insurance against flood.
- **X spells**: pay what you have. Great for filling holes in your curve: small on turn 2, huge on turn 8.`,
          cards: ['Tri-Clan Charm', 'Grove Warden', 'Formless Golem'],
        },
        {
          title: 'The trade-off',
          body: `Flexible cards are rarely the best possible play on a given turn: a specialized card usually beats them at their one job. But they almost never rot in your hand.`,
        },
      ],
      exercises: [
        board({
          prompt: 'The opponent is at 4 with Stalwart Irregulars (4/4) ready to block. You have Clan Warlord (4/4) and Tri-Clan Charm.',
          goalText: 'Win this turn.',
          puzzle: {
            you: { battlefield: ['Clan Warlord', 'Plains', 'Swamp', 'Forest'], hand: ['Tri-Clan Charm'] },
            opp: { life: 4, battlefield: ['Stalwart Irregulars'] },
            goal: { type: 'win' },
          },
          hint: 'Pick the mode — and the timing — that clears the way.',
          solution: [{ do: 'cast', card: 'Tri-Clan Charm', mode: 0, target: 'Stalwart Irregulars' }, { do: 'combat' }, { do: 'attack', with: ['Clan Warlord'] }],
          solutionText: 'Before combat, use Tri-Clan Charm\'s exile mode on Stalwart Irregulars. Then attack for 4.',
          explain: 'The counters mode would win the fight but not the game: a blocked attacker deals no damage to the player. The right mode, cast before blocks, wins.',
          rating: 850,
          themes: ['modal spell', 'lethal', 'removal timing'],
          refute: [[{ do: 'combat' }, { do: 'attack', with: ['Clan Warlord'] }, { do: 'cast', card: 'Tri-Clan Charm', mode: 2, target: 'you:Clan Warlord' }, { do: 'pass' }]],
        }),
        sort(
          'What kind of flexible card is each one?',
          ['Modal spell', 'Mana sink', 'X spell'],
          [
            ['Tri-Clan Charm', 0],
            ['Grove Warden ({3}{G}: +1/+1 counter)', 1],
            ['Bellows Salamander ({1}{R}: +1/+0)', 1],
            ['Scholar\'s Tome ({4}, {T}: draw)', 1],
            ['Formless Golem ({X}: X/X)', 2],
            ['Crater Blast ({X}{R}: X damage)', 2],
          ],
          'All three kinds adapt to the situation instead of needing a specific one.',
        ),
        mc('What is the main downside of flexible cards?', ['They\'re rarely the best possible play on a given turn', 'They can\'t be cast early', 'They always cost more', 'They\'re dead late'], 0, 'Specialized cards do their one job better. Flexible cards trade peak power for consistency.'),
        mc('You have five lands, nothing else to do, and Formless Golem ({X}: enters with X +1/+1 counters). What do you cast?', ['A 5/5 Golem', 'A 1/1 Golem, saving mana', 'Nothing', 'A 0/0 Golem'], 0, 'X spells turn whatever mana you have into a matching threat.'),
      ],
      takeaways: ['Flexible cards trade peak power for consistency.', 'Modal spells, mana sinks, X spells.', 'Great at filling curve gaps and fighting flood.'],
    },
  ],
};
