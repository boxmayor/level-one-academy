import { match, mc, num, sort, src, tf } from './helpers';
import type { Unit } from './types';

export const unit7: Unit = {
  id: 'u7',
  title: 'Deck Construction',
  subtitle: 'Mana bases, formats, sideboards and the metagame',
  color: '#4b5ea8',
  lessons: [
    {
      id: 'mana-base',
      title: 'Building a Mana Base',
      icon: '🏗️',
      source: src('Building a Mana Base', 'level-one/building-mana-base-2014-11-24'),
      terms: ['Mana Base', 'Mana Fixing', 'Splashing'],
      teach: [
        {
          title: 'The most neglected part of deckbuilding',
          body: `Many players pick their spells carefully and throw the lands in last. Start instead by rating how much your deck depends on each color, then count **sources** — lands and other cards that can make that color.`,
        },
        {
          title: 'How many sources? (60 cards / 40 cards)',
          body: `- **Essential** (you can't cast your key cards without lots of it): as many as you can.
- **Can't keep a hand without it**: 17–18 / 11–12.
- **Main color**: 14–16 / 9–10.
- **Secondary color**: 10–13 / 6–7.
- **Splash**: 4–7 / 2–4.

With two main colors, split evenly: a two-color Limited deck with 18 lands wants 9 of each, not 12 and 6.`,
        },
        {
          title: 'Land types have costs',
          body: `- **Enters tapped**: costs tempo. Fine in slow decks (8–12 is OK for a slow midrange deck), bad in aggro.
- **Pain lands** (damage for colored mana): aggro accepts the life loss; control prefers tapped lands. A few of them are easy to manage.
- **Choice lands** that fetch one of two basics count as a bit less than a full source of each color, because you must choose early.`,
        },
      ],
      exercises: [
        match(
          'Match each color role with the number of sources in a 40-card deck.',
          [
            ['Can\'t keep a hand without it', '11–12'],
            ['Main color', '9–10'],
            ['Secondary color', '6–7'],
            ['Splash', '2–4'],
          ],
          'In 60 cards: 17–18, 14–16, 10–13 and 4–7.',
        ),
        num('A two-color green-white Limited deck plays 18 lands and uses both colors equally. How many Plains?', 9, 'Split main colors evenly: 9 Plains and 9 Forests.', { unit: 'Plains' }),
        num('Minimum number of sources for a splash color in a 60-card deck?', 4, 'A Constructed splash wants 4–7 sources.', { min: 4, max: 7, unit: 'sources' }),
        mc('You\'re building a fast aggro deck. Tapped dual land or pain land?', ['Pain land — tempo matters more than a little life', 'Tapped land — life matters more', 'Neither — only basics', 'Both equally'], 0, 'Aggro trades life for speed; a tapped land can ruin its curve.'),
        mc('You\'re building a slow control deck. How do you feel about lands that enter tapped?', ['Fine — play them; the tempo cost is small for a slow deck', 'Avoid them completely', 'Only in sideboard games', 'Only if they cause pain too'], 0, 'Slow decks rarely need all their mana on turns 1–3.'),
        tf('A deck with two main colors should split its basics evenly between them.', true, 'Even splits maximize your chance of having both colors.'),
      ],
      takeaways: ['Rate each color, then count sources.', '40 cards: main 9–10, secondary 6–7, splash 2–4.', 'Tapped lands suit slow decks; pain lands suit aggro.'],
    },
    {
      id: 'constructed-formats',
      title: 'An Introduction to the Popular Constructed Formats',
      icon: '🗺️',
      source: src('An Introduction to the Popular Constructed Formats', 'level-one/introduction-popular-constructed-formats-2015-04-27'),
      terms: ['Format', 'Constructed', 'Power'],
      teach: [
        {
          title: 'How to compare formats',
          body: `Look at a format's **speed** (when do the fastest decks win?), **power level**, **balance**, **diversity** and **complexity**.

The big rule: **the larger the card pool, the faster and more powerful the format.**

(This lesson describes the formats as of 2015, when the course was written. Formats change — Pioneer, for example, was added later.)`,
        },
        {
          title: 'The formats',
          body: `- **Standard**: recent sets only (rotating). Lower power; games rarely end before turn 5. A few key cards matter a lot.
- **Block**: a single block — even smaller. A handful of cards dominate.
- **Modern**: sets from 2003 (Eighth Edition and Mirrodin) onward, never rotating, with a banned list. Many decks can win on turn 4; 50+ viable decks. Play a strong plan of your own.
- **Legacy**: all sets, with a banned list. Card-selection spells and free spells make it complex.
- **Vintage**: all sets; instead of banning for power, it **restricts** the strongest cards to one copy. Turn 1–2 wins are possible.`,
        },
        {
          title: 'Cross-train',
          body: `Reid suggests Modern as a bridge from Standard toward Legacy and Vintage. Playing several formats makes you better at all of them.`,
        },
      ],
      exercises: [
        match(
          'Match each format with its description (as of 2015).',
          [
            ['Standard', 'Recent sets only; rotates'],
            ['Modern', 'Sets from 2003 onward; never rotates'],
            ['Legacy', 'All sets, with a banned list'],
            ['Vintage', 'All sets; restricts the strongest cards to one copy'],
          ],
          'Card pool size is the main difference, and it drives speed and power.',
        ),
        mc('What\'s the general rule about card pool size?', ['Larger pool → faster and more powerful format', 'Larger pool → slower format', 'Pool size doesn\'t matter', 'Smaller pool → more diversity'], 0, 'More cards means more efficient options for every job.'),
        mc('What does Vintage do with its most powerful cards instead of banning them?', ['Restricts them to one copy per deck', 'Bans them anyway', 'Lets you play unlimited copies', 'Only allows them in the sideboard'], 0, 'The restricted list keeps legendary power cards playable but rare.'),
        mc('Which format did Reid suggest as a bridge between Standard and Legacy/Vintage?', ['Modern', 'Block', 'Sealed', 'Commander'], 0, 'Modern is bigger and faster than Standard but less complex than Legacy.'),
        mc('In a very diverse format like Modern, what kind of plan does Reid recommend?', ['A powerful proactive plan of your own', 'Answers for every possible deck', 'The slowest control deck available', 'Random card choices'], 0, 'You can\'t prepare for 50+ decks. Make them answer you.'),
      ],
      takeaways: ['Bigger card pool → faster, stronger format.', 'Know each format\'s card pool and ban/restrict rules.', 'Cross-train to improve everywhere.'],
    },
    {
      id: 'the-sideboard',
      title: 'The Sideboard',
      icon: '🗃️',
      source: src('The Sideboard', 'level-one/sideboard-2015-08-10'),
      terms: ['Sideboard', 'Hate Cards', 'Transformational Sideboard', 'Elephant Method', 'Main Deck'],
      teach: [
        {
          title: 'The rules',
          body: `A match is best two out of three games. Game 1 uses your main deck; before games 2 and 3 you may swap cards with your **sideboard** of up to **15 cards**. In Constructed your deck must stay at least 60 cards.

Sideboard cards can be very narrow, so they're often your most powerful cards in the right matchup.`,
        },
        {
          title: 'Four jobs',
          body: `- **Answer problems**: narrow answers that would be dead in other matchups.
- **Add threats**: more (or different) threats against a control deck with few answers.
- **Hate cards**: devastating against one deck, color or strategy. The more extreme a strategy, the easier it is to hate out.
- **Transform**: switch to a different strategy. Use rarely — sideboarding should perfect your deck, not bolt two plans together.`,
        },
        {
          title: 'The elephant method',
          body: `Treat your deck as 75 cards. Write your ideal post-sideboard list for each matchup you expect. Make the unique cards across those lists add up to 75, then decide which 60 start.

And don't over-sideboard: keep your creature count, curve and core plan intact.`,
        },
      ],
      exercises: [
        num('What is the maximum size of a Constructed sideboard?', 15, 'Deck at least 60, sideboard at most 15.', { unit: 'cards' }),
        sort(
          'Which sideboard job does each card do?',
          ['Answer a problem', 'Add a threat', 'Hate card'],
          [
            ['Artifact removal against an artifact deck', 0],
            ['A cheap sweeper against a swarm of tokens', 0],
            ['An extra planeswalker against a control deck', 1],
            ['A threat that survives sweepers', 1],
            ['A card that stops all burn damage', 2],
            ['An uncounterable creature against blue control', 2],
          ],
          'Answers fix problems, threats pressure slow decks, hate cards shut one strategy down.',
        ),
        mc('What is the elephant method?', ['Write ideal lists for each matchup, make the unique cards total 75, then split 60/15', 'Always play the biggest creatures', 'Copy the winning deck', 'Sideboard in as many cards as possible'], 0, 'It gives the sideboard the same care as the main deck.'),
        mc('What\'s the danger of bringing in lots of sideboard cards?', ['You can lose your deck\'s core plan, curve and creature count', 'Judges will penalize you', 'The deck gets too small', 'There is no danger'], 0, 'Swapping six creatures for six answers can turn an aggro deck into nothing.'),
        tf('A transformational sideboard is Reid\'s preferred everyday sideboard plan.', false, 'He recommends it only as a last resort; sideboarding should perfect your deck.'),
      ],
      takeaways: ['Up to 15 cards; swap between games.', 'Answers, threats, hate cards — transform rarely.', 'Plan all 75 with the elephant method.'],
    },
    {
      id: 'sideboard-plans',
      title: 'Sideboard Plans',
      icon: '📋',
      source: src('Sideboard Plans', 'level-one/sideboard-plans-2015-03-09'),
      terms: ['Sideboard'],
      teach: [
        {
          title: 'Plan before the tournament',
          body: `Decide your sideboard plans in advance, so deck building and in-match decisions support each other.`,
        },
        {
          title: 'Match the numbers',
          body: `For each matchup, first count the main-deck cards you're happy to cut. Then bring in exactly that many.

Example against red aggro: you can cut one expensive card and two card-draw spells → 3 slots → bring in 3 cheap removal spells. Bringing in 6 would force out cards your deck needs.`,
        },
        {
          title: 'Plan for matchups, not single cards',
          body: `After losing to one annoying card, adding four narrow answers to it is tempting — but those answers may be dead against the rest of that deck. Only add narrow answers when the matchup as a whole supports it.`,
        },
        {
          title: 'When to deviate',
          body: `- The opponent's list is unusual.
- Their sideboarding surprised you — **always re-evaluate between games 2 and 3**. (If they brought in enchantment removal for your enchantments, consider taking yours out.)
- Their play pattern is unusual (always holding creatures back, always casting the same threat on turn 5).

Bonus: leave a feared card in for game 2 and take it out for game 3 — they may still play around it.`,
        },
      ],
      exercises: [
        num('Against red aggro you can cut one expensive card and two card-draw spells. How many cheap removal spells should you bring in?', 3, 'Match the number of dispensable cards.', { unit: 'cards' }),
        mc('You lost game 1 to a single enchantment. Should you bring in four enchantment-removal cards?', ['Not automatically — sideboard for the whole matchup, not one card', 'Yes, always', 'Yes, and cut your creatures for them', 'Bring in eight'], 0, 'If those cards are dead against the rest of their deck, you made game 2 worse.'),
        mc('For game 2 the opponent brought in three cards that destroy enchantments to beat your enchantment plan. For game 3 you should…', ['Consider taking your enchantments out, so their removal is dead', 'Add more enchantments', 'Change nothing', 'Concede'], 0, 'Always re-evaluate between games 2 and 3.'),
        tf('Sideboard plans should be made before the tournament, not improvised in the match.', true, 'Advance planning avoids rushed, disconnected decisions.'),
      ],
      takeaways: ['Count your cuts, then match the numbers.', 'Sideboard for matchups, not single cards.', 'Re-evaluate between games 2 and 3.'],
    },
    {
      id: 'choosing-deck',
      title: 'Choosing Your Deck',
      icon: '🧺',
      source: src('Choosing Your Deck', 'level-one/choosing-your-deck-2015-06-08'),
      terms: ['Netdecking', 'Power', 'Proactive', 'Inevitability'],
      teach: [
        {
          title: 'Netdeck or build your own?',
          body: `**Netdecking** gives you a proven deck, refined by thousands of players, and frees your time for practice. **Building your own** can surprise opponents and teaches you a lot — but most new ideas don't work out (Reid estimates one good idea for every nine bad ones).`,
        },
        {
          title: 'Power, metagame and plan',
          body: `- **Raw power**: how strong the deck is in a vacuum.
- **Metagame position**: how it matches up against what people actually play. A strong deck can be a poor choice if the field is full of its worst matchups.
- **Proactive plans** handle diverse fields; **inevitability** helps too — but don't assume you have it.`,
        },
        {
          title: 'Look at all three games',
          body: `Don't judge a deck on game 1 alone. Extreme strategies get hit hardest by sideboards; balanced midrange decks suffer least.`,
        },
        {
          title: 'You matter most',
          body: `Enjoying your deck helps you focus and keep improving it. But the biggest factor is **how well you pilot the deck**. Sticking with one deck across many events builds real mastery.`,
        },
      ],
      exercises: [
        mc('According to Reid, what matters most in deck choice?', ['How well you pilot the deck', 'The deck\'s price', 'Its game-1 win rate', 'How original it is'], 0, 'A well-played good deck beats a poorly played great deck.'),
        mc('A deck wins game 1 often but gets crushed after sideboarding. How should you evaluate it?', ['Across all three games, including sideboarded ones', 'Only by game 1', 'Only by game 3', 'By its mana curve'], 0, 'Two of the three games are played after sideboarding.'),
        tf('Netdecking is always worse than building your own deck.', false, 'Proven decks are refined by many players and let you spend time practicing.'),
        mc('Why do proactive decks suit large, diverse tournaments?', ['You can\'t prepare answers for every deck, but a strong plan works against most', 'They\'re cheaper', 'They never need sideboards', 'They always have inevitability'], 0, 'Make the opponent answer you.'),
        mc('Which strategies are hurt most by the opponent\'s sideboarding?', ['Extreme ones: all-in aggro, pure control, linear combo', 'Balanced midrange decks', 'Decks with many lands', 'Two-color decks'], 0, 'The more extreme the strategy, the easier it is to sideboard against.'),
      ],
      takeaways: ['Netdecks are proven; brewing is high risk, high reward.', 'Weigh raw power vs. metagame fit.', 'Judge all three games; pilot skill matters most.'],
    },
    {
      id: 'metagame',
      title: 'The Metagame',
      icon: '🌐',
      source: src('The Metagame', 'level-one/metagame-2015-06-01'),
      terms: ['Metagame', 'Predicting the Metagame'],
      teach: [
        {
          title: 'The game around the game',
          body: `The **metagame** is everything outside the rules that still matters: which decks are popular, new combos, sideboard trends, what people expect.`,
        },
        {
          title: 'Predicting it',
          body: `Frank Karsten's method weights recent results by finish: **1st = 6 points, 2nd = 5, 3rd–4th = 4, 5th–8th = 3, 9th–16th = 2**. Averaging recent events estimates how popular each deck will be.

Also consider: what was popular last week, recent wins, what influential players recommend, which cards people own, and trends (midrange tends to be overplayed; fast decks are popular online).`,
        },
        {
          title: 'Using it',
          body: `- **Deck choice** targeting the field: powerful but risky.
- **Sideboard tuning**: the most common use (e.g. 3–4 copies of a card against the deck you expect most).
- **Practice**: test the popular matchups and new breakout decks.`,
        },
        {
          title: 'Information cascades',
          body: `Popularity feeds on itself: a popular deck gets more top finishes simply because more people play it, which makes it more popular. Meanwhile, a strong deck without big results can become a "lost deck" — overlooked, and a hidden edge for whoever finds it.`,
        },
      ],
      exercises: [
        num('In Karsten\'s method, how many points is a 2nd-place finish worth?', 5, '1st = 6, 2nd = 5, 3rd–4th = 4, 5th–8th = 3, 9th–16th = 2.', { unit: 'points' }),
        num('A deck finished 1st at one event and in the Top 8 (5th–8th) at another. How many points does it get?', 9, '6 for the win plus 3 for the 5th–8th finish.', { unit: 'points' }),
        mc('What\'s the most common way players use metagame predictions?', ['Tuning their sideboard', 'Picking their colors at random', 'Choosing a playmat', 'Deciding whether to mulligan'], 0, 'Sideboard slots are the easiest place to react to an expected field.'),
        mc('What is an "information cascade" in the metagame?', ['Popularity creates results, which create more popularity, regardless of quality', 'A combo that draws many cards', 'Spoilers of a new set', 'A tournament report'], 0, 'This is how decks become over- or underrated.'),
      ],
      takeaways: ['Predict the field from weighted recent results and trends.', 'Use predictions mostly for sideboards and practice.', 'Look for overlooked "lost decks".'],
    },
  ],
};
