import { match, mc, num, order, sort, src, tf } from './helpers';
import type { Unit } from './types';

export const unit8: Unit = {
  id: 'u8',
  title: 'Tournaments and Growth',
  subtitle: 'Playing in big events and becoming a better player',
  color: '#8a3b5c',
  lessons: [
    {
      id: 'grand-prix-1',
      title: 'Playing in a Grand Prix: Part I',
      icon: '🏟️',
      source: src('Playing in a Grand Prix: Part I', 'level-one/playing-grand-prix-part-i-2015-05-18'),
      teach: [
        {
          title: 'Set good goals',
          body: `People play big events to win prizes, to learn, and to have fun — all valid.

Hard placement goals backfire: stress if you miss them, complacency if you hit them early. Use **benchmarks** ("I'd be proud of 6-3 or better") and **process goals** you control: stay focused, mulligan carefully, remember your triggers, play every round.`,
        },
        {
          title: 'Be at your best',
          body: `Sleep well — the nights *before* the night before matter too. Eat breakfast, drink water, arrive early. Handle registration, deck and logistics the night before. A few light games are fine, but don't practice late into the night or start second-guessing your deck.`,
        },
        {
          title: 'Opponents and rules',
          body: `Don't be intimidated — most players are friendly. Communicate clearly. **Track both life totals on paper** and confirm every change out loud; fix any mismatch immediately.

There are **no take-backs** in tournaments. You may shuffle your opponent's deck after they shuffle — that's normal procedure, not an accusation.`,
        },
      ],
      exercises: [
        sort(
          'Process goal or outcome goal?',
          ['Process goal (you control it)', 'Outcome goal'],
          [
            ['Stay focused every game', 0],
            ['Make careful mulligan decisions', 0],
            ['Remember all my triggers', 0],
            ['Make the Top 8', 1],
            ['Win at least 12 matches', 1],
          ],
          'Process goals keep you calm and improving no matter how the pairings go.',
        ),
        mc('The opponent says you\'re at 8, but your paper says 6. What do you do?', ['Sort it out right away (call a judge if you can\'t agree)', 'Wait a few turns and see', 'Use whichever number is better for you', 'Ignore it'], 0, 'Deciding with the wrong life total can lose you the game. Fix it immediately.'),
        tf('Shuffling your opponent\'s deck is an accusation of cheating.', false, 'It\'s normal tournament procedure, and you\'re entitled to do it.'),
        mc('The day before a big event, Reid recommends…', ['Light practice, logistics done early, and a good night\'s sleep', 'Testing until 3 a.m.', 'Switching decks', 'Skipping meals to save time'], 0, 'Show up rested and prepared, not burned out.'),
      ],
      takeaways: ['Use benchmarks and process goals.', 'Sleep, eat, hydrate, prepare early.', 'Track life on paper; no take-backs.'],
    },
    {
      id: 'grand-prix-2',
      title: 'Playing in a Grand Prix: Part II',
      icon: '⚖️',
      source: src('Playing in a Grand Prix: Part II', 'level-one/playing-grand-prix-part-ii-2015-05-26'),
      teach: [
        {
          title: 'Judges are your friends',
          body: `Judges answer questions, give rulings, settle disagreements and fix illegal actions. You don't need to know every rule — they do. Calling a judge isn't tattling or accusing anyone.

**When in doubt, call a judge.** Don't fix problems yourself or accept the opponent's version of a rule you're unsure about.`,
        },
        {
          title: 'How to call a judge',
          body: `1. Tell your opponent you're calling a judge.
2. Raise your hand and call "Judge!"
3. Explain exactly what happened — facts only, no accusations.
4. If you disagree with the ruling, you may politely appeal to the head judge, whose decision is final.

A **warning** isn't a penalty — it's a note that says "please don't do this again". Everyone gets them.`,
        },
        {
          title: 'The clock',
          body: `Grand Prix rounds are **50 minutes**, best of three. When time is called, the current turn finishes and **5 more turns** are played. An unfinished game is a draw.

Match points: **win 3, draw 1, loss 0**. Day 1 was 9 Swiss rounds, and Day 2 needed 7 wins — so a draw is almost as bad as a loss. Keep a steady pace (about 3 minutes to sideboard and shuffle).`,
        },
        {
          title: 'Finish strong',
          body: `Play every round, even when you're out of contention: tournament experience is valuable. Save your reflection for after the event — during it, stay focused on the next game.`,
        },
      ],
      exercises: [
        num('How long is a Grand Prix round (in minutes)?', 50, 'Best of three games in 50 minutes.', { unit: 'minutes' }),
        num('After time is called, how many extra turns are played?', 5, 'Finish the current turn, then 5 more.', { unit: 'turns' }),
        mc('How many match points is a draw worth?', ['1', '0', '2', '3'], 0, 'Win 3, draw 1, loss 0.', { fixedOrder: true }),
        mc('You\'re not sure whether a play in your match is legal. What should you do?', ['Call a judge', 'Accept what the opponent says', 'Fix it yourself', 'Ignore it'], 0, 'When in doubt, call a judge. It\'s their job and it\'s not an accusation.'),
        order('Put the steps of calling a judge in order.', ['Tell your opponent you\'re calling a judge', 'Raise your hand and call "Judge!"', 'Explain exactly what happened, without accusations', 'Appeal to the head judge if you disagree'], 'Calm, factual, and in order.'),
        mc('When should you reflect on your mistakes?', ['After the tournament', 'Between every game, at length', 'During your opponent\'s turn', 'Never'], 0, 'During the event, keep your focus on the next game.'),
      ],
      takeaways: ['When in doubt, call a judge.', 'Warnings aren\'t penalties.', '50-minute rounds; +5 turns; draws hurt.'],
    },
    {
      id: 'better-player',
      title: 'Becoming a Better Player',
      icon: '🌟',
      source: src('Becoming a Better Player', 'level-one/becoming-better-player-2015-09-28'),
      terms: ['Focus'],
      teach: [
        {
          title: 'Practice with focus',
          body: `The greatest winning streaks came from players who lived and breathed Magic. But quantity isn't enough: distracted games (TV on, several games at once, tilted) train bad habits. Focused games are worth far more.`,
        },
        {
          title: 'Ask why',
          body: `After every game — won or lost — ask why, layer by layer:

1. **Technical mistakes**: missed damage, sequencing, misplays.
2. **Information**: could I have read their hand better?
3. **Sideboarding and deckbuilding**: was my configuration right? Was my mana a deck problem or bad luck?
4. **Deck choice**: do I keep losing this matchup?
5. **Luck** — only after everything else.

This takes patience and honesty, especially after a loss.`,
        },
        {
          title: 'Learn from everyone',
          body: `Read articles, watch coverage, study decklists — then test the ideas yourself. Play and talk with better players, but everyone has something to teach you.`,
        },
        {
          title: 'The right attitude',
          body: `Many losses really are bad luck — but don't hide behind that. Take losses seriously without dwelling on them. Keep improving even while winning: most mistakes don't change the result, so wins can hide them.

Aim for **confidence** (you look for winning lines), **humility** (you keep learning), **perfectionism** (you sweat details), **resilience** (you survive bad stretches) — and real enjoyment.`,
        },
      ],
      exercises: [
        order(
          'Put the "ask why" layers in the order Reid uses them.',
          ['Technical mistakes', 'Information and reads', 'Sideboarding and deckbuilding', 'Deck choice', 'Luck'],
          'Luck comes last: only after you\'ve checked everything you control.',
        ),
        mc('When is it fair to blame a loss on luck?', ['Only after checking everything you could control', 'Always — Magic is random', 'Never', 'Whenever you mulliganed'], 0, 'Blaming luck too early stops you from learning.'),
        mc('You won the tournament. What\'s Reid\'s advice?', ['Keep reviewing your mistakes — most don\'t affect the result, so wins can hide them', 'Stop practicing while you\'re hot', 'Assume you played perfectly', 'Switch decks'], 0, 'Improvement compounds; your highs last longer and your lows are less low.'),
        tf('Playing many games while watching TV is great practice.', false, 'Distracted practice trains bad habits. Focused games are worth much more.'),
        match(
          'Match each quality with why it helps.',
          [
            ['Confidence', 'You look for — and find — winning lines'],
            ['Humility', 'You keep learning from others'],
            ['Perfectionism', 'You care about small details'],
            ['Resilience', 'You keep going through losing streaks'],
          ],
          'Reid also adds genuine passion: if the game stops being fun, take a step back.',
        ),
      ],
      takeaways: ['Practice with focus; quality over quantity.', 'Ask why after every game — luck last.', 'Confidence, humility, perfectionism, resilience, passion.'],
    },
  ],
};
