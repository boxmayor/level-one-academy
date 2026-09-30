import { board, hand, match, mc, num, order, pick, sort, src, tf } from './helpers';
import type { Unit } from './types';

export const unit6: Unit = {
  id: 'u6',
  title: 'Limited',
  subtitle: 'Sealed deck, booster draft, and Limited sideboards',
  color: '#a8742f',
  lessons: [
    {
      id: 'sealed-deck',
      title: 'Sealed Deck',
      icon: '📦',
      source: src('Sealed Deck', 'lo/sealed-deck-2014-09-15'),
      terms: ['Limited', 'Bomb', 'Board Stall', 'Filler'],
      teach: [
        {
          title: 'Six packs, forty cards',
          body: `In **Sealed Deck** you open six packs, add basic lands, and build a 40-card deck. Power levels are low and games run long — often 6 to 20 turns.

Games are mostly decided by three things: **mana problems**, **bombs** (cards that win almost alone), and **long attrition** in board stalls where nobody can attack profitably.`,
        },
        {
          title: 'Build priorities',
          body: `- **Reliable mana and a balanced curve** — half the battle. Usually two colors, maybe a splash for a couple of great cards.
- **14–19 creatures**, with enough cheap ones to not get run over.
- **Every bomb and removal spell** you can play. Be patient with removal during games.
- **Very few other cards.** Each card should be a threat or an answer, or do something special.`,
        },
        {
          title: 'Breaking board stalls',
          body: `When the board clogs up, these win: **card advantage**, **evasion** (fliers skyrocket in value), and **mana sinks** that use your extra lands.`,
        },
        {
          title: 'A building process',
          body: `1. Sort cards by color (and multicolor).
2. Check the mana fixing — it can rule color pairs in or out.
3. Find the power: bombs, premium removal.
4. Set aside weak cards: low-impact creatures and most non-creature, non-removal spells.
5. Build candidate decks in the promising color pairs.
6. Compare, then trust your gut.`,
        },
      ],
      exercises: [
        mc('How many creatures does a good Sealed deck usually play?', ['14–19', '6–10', '22–25', 'As few as possible'], 0, 'Creatures are how Limited games are won and defended.'),
        order(
          'Put the Sealed building steps in order.',
          ['Sort the cards by color', 'Check the mana fixing', 'Find the bombs and removal', 'Set aside weak cards', 'Build candidate decks', 'Compare and decide'],
          'Start broad, narrow down by mana and power, then compare real builds.',
        ),
        mc('The board is stalled. Which cards gain the most value? (Select all that apply.)', ['Fliers and other evasive creatures', 'Card-advantage cards', 'Mana sinks', 'Cheap combat tricks'], [0, 1, 2], 'Evasion walks past the stall, card advantage outlasts it, and mana sinks use the extra lands of a long game.'),
        pick(
          'Your Sealed deck needs to cut one card. Which card is the best cut?',
          ['Hero\'s Ruin', 'Radiant Angel', 'War Horn', 'Web Weaver'],
          2,
          'War Horn is neither a threat nor an answer. Keep the removal, the bomb, and the creature.',
        ),
        board({
          prompt: 'Board stall: neither of you can attack on the ground. The opponent is at 4. You have a flier.',
          goalText: 'Get the opponent to 2 or less without losing your flier, and survive their turn.',
          puzzle: {
            continueToOppTurn: true,
            you: { life: 6, battlefield: ['Sky Griffin', 'Crypt Shambler', 'Crypt Shambler'] },
            opp: { life: 4, battlefield: ['Crypt Shambler', 'Crypt Shambler', 'Grizzly Cub'] },
            goal: { type: 'all', goals: [{ type: 'oppLifeAtMost', n: 2 }, { type: 'alive', card: 'Sky Griffin' }, { type: 'survive' }] },
          },
          hint: 'Only one of your creatures can get past their blockers. Keep the others home.',
          solution: [{ do: 'combat' }, { do: 'attack', with: ['Sky Griffin'] }, { do: 'endTurn' }],
          solutionText: 'Attack with only Sky Griffin. Your Shamblers stay back to hold the ground.',
          explain: 'In a stall, evasion is how you win. Attacking with the ground creatures would just trade them away or leave you open.',
          rating: 700,
          themes: ['board stall', 'evasion'],
          refute: [[{ do: 'endTurn' }]],
        }),
        tf('In Sealed, a three-color deck without mana fixing is usually more consistent than a two-color deck.', false, 'More colors means more hands without the right mana. Two colors (plus maybe a small splash) is usually best.'),
      ],
      takeaways: ['Mana and curve first; then bombs and removal.', '14–19 creatures; few other cards.', 'Fliers, card advantage and mana sinks break stalls.'],
    },
    {
      id: 'booster-draft-basics',
      title: 'The Basics of Booster Draft',
      icon: '🔁',
      source: src('The Basics of Booster Draft', 'level-one/basics-booster-draft-2015-08-03'),
      terms: ['Synergy', 'Archetype', 'Signals', 'Open Color', 'Counterdraft', 'Staying Open'],
      teach: [
        {
          title: 'How a draft works',
          body: `Eight players each open a pack, take one card, and pass the rest. Three packs later you've seen about 42 picks and build a 40-card deck. Draft decks tend to be more focused and faster than Sealed decks.`,
        },
        {
          title: 'Synergy and archetypes',
          body: `**Synergy**: cards that work especially well together — a two-card combo, a card that gets better in the right deck, or a whole deck built around one plan.

An **archetype** is a recurring strategy with many versions (e.g. "blue-red artifacts"). Knowing a set's archetypes gives your draft direction.`,
        },
        {
          title: 'Balance first — and a bomb is a bomb',
          body: `Don't sacrifice the fundamentals for synergy: good mana, a smooth curve, enough creatures, removal, and some card advantage. A balanced deck without much synergy works fine.

A true bomb beats synergy: take it.`,
        },
        {
          title: 'Choosing colors',
          body: `- **Decide in advance** (fine for beginners — just never discuss colors with neighbors).
- **Commit after the first picks.**
- **Stay open** (advanced): wait to see which colors are **open**. A strong card coming to you late is a **signal** that its color may be open.

**Counterdrafting** (taking a card just so nobody else gets it) is rarely right: you play only about 3 of 7 opponents. Do it only when nothing in the pack helps you.`,
        },
      ],
      exercises: [
        pick('Pack 1, pick 1. Which card do you take?', ['Grizzly Cub', 'Radiant Angel', 'Scholar\'s Insight', 'Hero\'s Ruin'], 1, 'Radiant Angel is a bomb: a 4/4 flier with vigilance wins games alone. Hero\'s Ruin is great too, but a tier below.', {
          notes: [undefined, undefined, undefined, 'Premium removal is excellent — but a bomb is a tier higher.'],
        }),
        mc('Lightning Lance comes to you as the 6th pick of the pack. What does that suggest?', ['Red may be open: the players before you aren\'t taking red', 'Red is overdrafted', 'Lightning Lance is a bad card', 'Nothing at all'], 0, 'Five players passed a premium red card. That\'s a hint — not proof — that red is flowing.'),
        mc('When is counterdrafting a reasonable pick?', ['When nothing in the pack is useful for your deck', 'Every time you see a bomb', 'In pack 1 only', 'Never, it\'s against the rules'], 0, 'You face only a few of the other drafters, so taking a playable for yourself is almost always better.'),
        match(
          'Match each kind of synergy with an example.',
          [
            ['Two-card combo', 'Steal a creature, then sacrifice it for value'],
            ['Card-to-deck synergy', 'An Elf lord in a deck full of Elves'],
            ['Deck-wide synergy', 'Cheap creatures that grow when they deal damage, plus tricks to help them connect'],
          ],
          'Synergy exists at every scale — from pairs of cards to your whole deck.',
        ),
        tf('A well-built deck with a smooth curve and good creatures works fine even without much synergy.', true, 'Fundamentals come first; synergy is a bonus.'),
      ],
      takeaways: ['Balance first: mana, curve, creatures, removal.', 'A bomb is a bomb.', 'Read signals; counterdraft rarely.'],
    },
    {
      id: 'sideboarding-limited',
      title: 'Sideboarding in Limited',
      icon: '🔀',
      source: src('Sideboarding in Limited', 'level-one/sideboarding-limited-2015-01-12'),
      terms: ['Sideboard', 'Situational'],
      teach: [
        {
          title: 'Small edges add up',
          body: `Between games, adapt to what you saw. In Limited, your whole unused card pool (Sealed) or your extra picks (Draft) are your sideboard.`,
        },
        {
          title: 'Perfect your answers',
          body: `Bring in narrow answers that were too situational for the main deck: a card that only kills fliers against their flying bomb, artifact or enchantment removal, a counterspell against a deck with huge spells, a card that punishes many small creatures.`,
        },
        {
          title: 'Match the pace',
          body: `- **Against fast decks**: add cheap creatures that trade early; cut slow, expensive cards.
- **Against slow decks**: get greedy — cut cheap creatures, add card advantage and late-game power.`,
        },
        {
          title: 'Match powers and toughnesses',
          body: `Rarity doesn't matter in a fight. A common 2/1 can be the perfect answer to their deck of 1-toughness creatures. If their blockers have 3 toughness, bring cards with 3 power.

Habits: study your pool between rounds, and always *look* like you're sideboarding so the opponent can't read your changes.`,
        },
      ],
      exercises: [
        mc('The opponent\'s deck is full of 1- and 2-toughness ground creatures. Which sideboard card shines?', ['Tremor Rift (2 damage to each creature without flying)', 'Scholar\'s Tome', 'Deep Study', 'Watch Sentinel'], 0, 'A conditional sweeper is weak in general but devastating against the right deck.'),
        mc('Against a slow, grindy opponent, how do you sideboard?', ['Cut cheap creatures; add card advantage and late-game power', 'Add more 1-drops', 'Add combat tricks', 'Change nothing'], 0, 'In a long game, raw power and cards matter more than speed.'),
        mc('Their bomb is a big flier and your main deck has no answer to it. What do you look for in your sideboard?', ['Narrow answers to fliers — reach creatures or removal', 'More ground creatures', 'Mana sinks', 'Discard spells'], 0, 'Situational answers earn their slot when you know the threat.'),
        tf('You should always look like you\'re sideboarding, even when you change nothing.', true, 'It keeps the opponent from learning what you did or didn\'t change.'),
        sort(
          'Against a fast aggro deck, bring these in or take them out?',
          ['Bring in', 'Take out'],
          [
            ['Cheap creatures that block well', 0],
            ['Cheap removal', 0],
            ['A 6-mana 5/6', 1],
            ['A slow card-draw spell', 1],
          ],
          'Survive the early turns first.',
        ),
      ],
      takeaways: ['Bring in narrow answers for the threats you saw.', 'Match the opponent\'s pace.', 'Match powers and toughnesses; rarity doesn\'t matter.'],
    },
    {
      id: 'signals',
      title: 'Signals in Booster Draft',
      icon: '📡',
      source: src('Signals in Booster Draft', 'level-one/signals-booster-draft-2015-01-19'),
      terms: ['Tier System', 'Signals', 'Open Color', 'Overdrafted'],
      teach: [
        {
          title: 'The tier system',
          body: `Group cards into tiers:

1. **Bombs** — win games almost alone. Take them early, almost regardless of color.
2. **Premium removal** — efficient, flexible answers (they also answer bombs).
3. **Strong filler** — the good commons that make up most of your deck.
4. **Weak filler / sideboard** — take-'em-or-leave-'em cards.
5. **Mostly useless** — pretend they don't exist.`,
        },
        {
          title: 'The pick rule',
          body: `Compare the best card overall with the best card in your colors:

- **Same tier** → take the one in your colors.
- **Different tiers** → take the stronger card, even off-color.

Example: after a white bomb first pick, choose a white filler over a green filler — but take black premium removal over white filler.`,
        },
        {
          title: 'Reading signals',
          body: `Good cards arriving late hint that the players passing to you aren't in that color. Seeing no good cards of a color hints that someone upstream is. Signals are hints, not proof.

Waiting makes you more certain but leaves less time to benefit. And if you opened a bomb, sticking with its color can be right even when it dries up: you haven't passed that color to the players who feed you in pack 2.`,
        },
      ],
      exercises: [
        sort(
          'Place each card in its tier.',
          ['Bomb', 'Premium removal', 'Filler'],
          [
            ['Radiant Angel', 0],
            ['Crimson Drake', 0],
            ['Hero\'s Ruin', 1],
            ['Lightning Lance', 1],
            ['Grizzly Cub', 2],
            ['Forward Cleric', 2],
          ],
          'Bombs win alone; premium removal answers almost anything efficiently; filler fills out your deck.',
        ),
        pick(
          'Your first pick was Radiant Angel (white). Both of these are filler. Which do you take?',
          ['Mighty Vault', 'Bear\'s Rage'],
          0,
          'Same tier → take the one that fits your colors.',
          { context: 'Picks so far: Radiant Angel.' },
        ),
        pick(
          'Your first pick was Radiant Angel (white). Which do you take now?',
          ['Mighty Vault', 'Hero\'s Ruin'],
          1,
          'Different tiers → take the stronger card. Premium removal is worth moving toward a second color.',
          { context: 'Picks so far: Radiant Angel.' },
        ),
        mc(
          'Picks 3–8 of pack 1: the packs reaching you contain almost no playable white cards, but you keep seeing strong red ones. What does this suggest?',
          ['Someone before you is taking white; red looks open', 'White is open', 'Nobody is taking red or white', 'You should counterdraft white'],
          0,
          'Missing cards and late strong cards are both signals. They point the same way here.',
        ),
        mc(
          'You opened a white bomb, but white dried up in pack 1. What does Reid suggest?',
          ['Often stick with it — you passed no white left, so pack 2 may deliver it', 'Always abandon the color immediately', 'Take only colorless cards', 'Start counterdrafting white'],
          0,
          'In pack 2 the direction reverses; the players now passing to you got no white from you.',
        ),
      ],
      takeaways: ['Tiers: bomb > premium removal > strong filler > weak filler > useless.', 'Same tier → on-color; different tier → the stronger card.', 'Signals are hints; act on them early.'],
    },
    {
      id: 'booster-draft-3',
      title: 'Booster Draft, Part 3',
      icon: '📐',
      source: src('Booster Draft, Part 3', 'level-one/booster-draft-part-3-2015-02-02'),
      teach: [
        {
          title: 'Fundamentals first',
          body: `Card advantage, removal and a solid mana base matter more than advanced ideas like signals or counterdrafting.`,
        },
        {
          title: 'The shape of a draft deck',
          body: `A good 40-card draft deck (for a typical set) looks like this:

- **17–18 lands**
- **14–17 creatures**: 0–2 one-drops, 2–4 two-drops, 5–8 three-drops, 2–3 four-drops, about 2 five-drops, 0–1 six-drops
- **4–8 removal spells**, 0–2 combat tricks`,
        },
        {
          title: 'Supply and demand',
          body: `You only want 0–1 six-drops, so a big expensive creature is easy to find late — don't spend an early pick on an unspectacular one. Cheap creatures, on the other hand, run out. When unsure early, take the cheap creature.`,
        },
        {
          title: 'Colors and timing',
          body: `Some color pairs clash (a defensive color with an all-out aggressive one). Learn the set's archetypes.

The best window to switch colors is **picks 2–7 of pack 1**. Around the first few picks of **pack 2** is the latest safe switch; after that you won't have enough cards.`,
        },
      ],
      exercises: [
        num('How many six-drops does the ideal draft deck want, at most?', 1, 'Zero or one. That\'s why expensive creatures are low picks.', { min: 0, max: 1 }),
        num('How many lands does a typical draft deck play?', 17, '17–18 lands.', { min: 17, max: 18, unit: 'lands' }),
        num('About how many two-drops should the ideal draft deck have?', 3, 'Two to four two-drops.', { min: 2, max: 4 }),
        pick(
          'Pack 1, pick 5. Your colors are green and white. Which do you take?',
          ['Elder Oak', 'Grizzly Cub'],
          1,
          'You need several cheap creatures but only 0–1 six-drops. Expensive creatures will still be around late.',
        ),
        mc('What\'s the latest reasonably safe time to switch colors?', ['The first few picks of pack 2', 'Any time in pack 3', 'Only before the draft starts', 'After the draft, during building'], 0, 'Switch later and you won\'t have enough playables in the new color.'),
      ],
      takeaways: ['17–18 lands, 14–17 creatures, 4–8 removal.', 'Cheap creatures are scarce; big ones come late.', 'Switch colors early in pack 1 if at all.'],
    },
    {
      id: 'draft-walkthrough',
      title: 'Draft Walkthrough',
      icon: '🧾',
      source: src('Draft Walkthrough', 'level-one/draft-walkthrough-2015-02-23'),
      teach: [
        {
          title: 'Have an end vision',
          body: `In this walkthrough, Reid aimed for a multicolor control deck: early mana fixing, card advantage, removal, and bombs.

He first-picked a bomb over a strong common, took dual lands early when the alternatives weren't cards he'd miss, and noticed a second copy of a slow card arriving late — a sign that nobody else wanted the slow, grindy plan.`,
        },
        {
          title: 'What went right and wrong',
          body: `Once he had plenty of late game, he correctly switched to dual lands and cheap creatures.

His mistakes: early on he took expensive cards and card draw over cheap defensive creatures. The finished deck was top-heavy (19 lands, many 5+ drops) and lost to a fast creature rush. He kept blue as a small splash instead of a main color to keep the mana reliable.`,
        },
      ],
      exercises: [
        pick('Pack 1, pick 1.', ['Lightning Lance', 'Radiant Angel', 'Pack Wolf'], 1, 'A bomb is a tier above even premium removal.'),
        pick(
          'Pack 2. You already have plenty of expensive, powerful cards. Which do you take?',
          ['Elder Oak', 'Verdant Terrace', 'Deep Study'],
          1,
          'More late game adds little. The dual land makes your mana more consistent.',
          { context: 'Your deck so far: two bombs, several 5- and 6-drops, few 2-drops. Colors: green-white-black.' },
        ),
        pick(
          'Pack 3. Your deck is struggling for early defense. Which do you take?',
          ['Deep Study', 'Web Weaver', 'Watch Sentinel'],
          1,
          'A cheap defensive creature fills the deck\'s biggest hole.',
          { context: 'Your deck: lots of late game, not enough plays before turn 4.' },
        ),
        mc('What was Reid\'s main regret in this draft?', ['Taking expensive cards and card draw over cheap creatures early', 'Taking a bomb first pick', 'Taking dual lands', 'Splashing a color'], 0, 'The deck ended up top-heavy and lost to a fast rush.'),
        tf('Taking early dual lands over cards you wouldn\'t miss keeps your options open.', true, 'Fixing lets you move toward bombs in any color later.'),
      ],
      takeaways: ['Know what deck you\'re aiming for.', 'After securing late game, prioritize cheap creatures and fixing.', 'Mana consistency beats one more powerful card.'],
    },
    {
      id: 'mulligans-limited',
      title: 'Mulligans Part II: Limited',
      icon: '🃏',
      source: src('Mulligans Part II: Limited', 'level-one/mulligans-part-ii-limited-2015-06-15'),
      teach: [
        {
          title: 'Two questions',
          body: `**How well does my deck mulligan?** Decks with high curves or that need many pieces suffer more from losing a card; cheap efficient creatures make a mulligan hurt less.

**How confident am I?** A strong deck can afford to throw back risky hands. A weak deck may need to gamble. If the opponent already mulliganed, you can keep a safer but slower hand. Don't let frustration from earlier games decide.`,
        },
        {
          title: 'Mana base quality',
          body: `- **Good mana** (mostly one color): you can mulligan freely.
- **Normal mana** (two even colors): follow the usual rules.
- **Bad mana** (three even colors): a good six-card hand is unlikely, so keep hands that have all your colors even if they're a bit weak.`,
        },
        {
          title: 'Extreme hands',
          body: `- **Six lands**: almost always mulligan.
- **One land**: rarely keep. Only on the draw, with several 1- and 2-mana plays.
- **Fast decks** throw back slow hands; against fast decks, raise your standards.
- **Too many conditions**: a hand that needs a specific land color *and* more creatures to function is a mulligan.`,
        },
      ],
      exercises: [
        hand(
          'Limited: aggressive white-red deck, on the play.',
          ['Plains', 'Plains', 'Plains', 'Mountain', 'Mountain', 'Stalwart Irregulars', 'Righteous Verdict'],
          'mulligan',
          'Five lands, and nothing to do until turn 4. An aggressive deck needs early plays. Mulligan.',
        ),
        hand(
          'Limited: green-white deck (9 Forest, 8 Plains).',
          ['Plains', 'Plains', 'Plains', 'Plains', 'Grizzly Cub', 'Thornhide Rhino', 'Titanic Bloom'],
          'mulligan',
          'Four lands, but every spell is green and you have no Forest. You need Forests to do anything — too many conditions.',
        ),
        hand(
          'Limited: green-white deck (9 Forest, 8 Plains).',
          ['Forest', 'Plains', 'Forest', 'Pack Wolf', 'Web Weaver', 'Stalwart Irregulars', 'Mighty Vault'],
          'keep',
          'Both colors, three lands, plays on turns 2, 3 and 4. Keep.',
        ),
        hand(
          'Limited: slow blue control deck, against an opponent you know is fast and aggressive.',
          ['Island', 'Island', 'Island', 'Island', 'Sphinx Oracle', 'Deep Study', 'Dissolve Thought'],
          'mulligan',
          'Fine against a slow deck, but nothing here stops early attackers. Against a fast opponent, raise your standards.',
        ),
        mc(
          'Your Limited deck is three colors split evenly. Your seven has all three colors but is a bit slow. Keep or mulligan?',
          ['Keep — with bad mana, a hand with all your colors is valuable', 'Mulligan — slow hands are always bad', 'Mulligan to find more lands', 'Keep only on the draw'],
          0,
          'A six-card hand with all three colors is unlikely. Take the working hand.',
        ),
      ],
      takeaways: ['Ask how well your deck mulligans and how confident you are.', 'Bad mana: keep hands with all colors.', 'Six-landers: mulligan. One-landers: rarely keep.'],
    },
  ],
};
