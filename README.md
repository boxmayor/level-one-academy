# Level One Academy

A gamified web app that teaches Magic: The Gathering strategy from Reid Duke's
[Level One course](https://magic.wizards.com/en/news/feature/level-one-full-course-2015-10-05).
It works like Duolingo (short lessons, XP, streaks, hearts, spaced review) and like a chess
tactics trainer (board puzzles with a rating, Puzzle Rush, a daily puzzle).

**Live app:** https://boxmayor.github.io/level-one-academy/

This is an unofficial study companion. Lesson text is written in our own words and links to
each original article. The cards in the puzzles are original, simplified designs modeled on the
examples in the course.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # engine, content and progress tests
npm run build      # production build in dist/
```

## What's inside

| Part | Details |
| --- | --- |
| Course | 45 lessons, one per Level One article, in the course's 8 sections. Plus a 3-lesson board tutorial for new players. |
| Lesson shape | 2–4 short teaching cards → 3–8 exercises → takeaways. Missed exercises come back at the end of the lesson. |
| Exercise types | Multiple choice, true/false, number, put-in-order, matching, sorting, keep-or-mulligan hands, draft picks, interactive board puzzles. |
| Board puzzles | 51 puzzles on a real rules engine: 30 inside lessons plus a 21-puzzle ladder (Advanced → Grandmaster, rated 1000–1950). The opponent plays its best defense: it searches every block against up to three of your tricks. |
| Review | Leitner spaced repetition (1, 3, 7, 16, 35 days). Mixes questions from all finished lessons. Glossary terms join review as lessons teach them. |
| Puzzle Trainer | Elo-style puzzle rating; puzzles picked near your rating; filter by theme; a ladder view of every puzzle by difficulty tier. |
| Puzzle Rush | 3 minutes, 3 strikes. Endless generated drills: combat math, lethal counting, race math, card counting, two-to-five lands. |
| Gamification | XP, levels with titles, daily goal, streak, hearts (regenerate, or refill by reviewing), stars per lesson, achievements, daily puzzle. |

Progress is stored in the browser's `localStorage`. Profile → Your data can copy and import it.
Each address keeps its own progress, so progress on `localhost` doesn't appear on the live site.

## Deployment

Every push to `main` runs `.github/workflows/deploy.yml`: install, test, build, and publish `dist/`
to GitHub Pages. If a test fails, nothing is deployed. The build uses relative paths and `#` routes,
so it works under the `/level-one-academy/` subpath without extra configuration.

## Learning design

- **Retrieval practice**: every lesson is mostly questions, not reading.
- **Worked-then-independent practice**: teaching cards show the idea; puzzles make you apply it.
- **Immediate, explained feedback**: every answer shows why.
- **Mastery loop**: wrong answers return later in the same session.
- **Spaced repetition and interleaving**: Review mixes topics and spaces them out.
- **Desirable difficulty**: rated puzzles adapt to your level, like chess tactics trainers.
- **Pattern recognition at speed**: Puzzle Rush drills the small calculations (who dies, is it lethal, who wins the race) until they're automatic.

## Code map

```
src/engine/      simplified Magic rules engine (plus solver.ts, a brute-force puzzle solver)
  types.ts       game state, cards, effects
  cardpool.ts    the card database (original cards)
  mana.ts        costs and automatic mana payment
  combat.ts      combat damage (first strike, deathtouch, trample, lifelink…)
  game.ts        actions, the stack, priority, turn steps
  ai.ts          opponent AI: blocks, attacks, counterspells, tricks
  puzzle.ts      puzzle setup, goals, scripted solutions
src/content/     course content
  unit0.ts…unit8.ts   lessons (one file per course section)
  ladder.ts      the puzzle ladder (trainer-only, Advanced to Grandmaster)
  glossary.ts    the course glossary, in our own words
  drills.ts      generated Puzzle Rush questions
src/state/       progress, spaced repetition, XP, streaks, achievements
src/ui/          React screens: path, lesson player, board, review, puzzles, glossary, profile
```

### Engine scope

Supported: lands (basic, dual, tapped, painful, creature lands), creatures with flying, reach,
haste, first strike, deathtouch, trample, lifelink, vigilance, defender, hexproof, menace,
indestructible; activated abilities (mana, pump, pinging, +1/+1 counters, animation); instants and
sorceries with damage, destroy, exile, bounce, tap, pump, counters, counterspells, draw, discard,
life gain/drain, tokens, sweepers and modal choices; X costs; a real stack with priority.

Simplifications: one target per spell, no auras or planeswalkers, creature-land animation resolves
immediately, and the attacker declares all blocks' damage order automatically.

### Adding a puzzle

Add a `board({...})` exercise to a lesson in `src/content/unitN.ts`:

```ts
board({
  prompt: 'The opponent is at 4…',
  goalText: 'Win this turn.',
  puzzle: {
    you: { battlefield: ['Pack Wolf', 'Mountain'], hand: ['Spark Jolt'] },
    opp: { life: 4, battlefield: ['Forward Cleric'] },
    goal: { type: 'win' },
  },
  hint: '…',
  solution: [{ do: 'combat' }, { do: 'attack', with: ['Pack Wolf'] }, { do: 'cast', card: 'Spark Jolt', target: 'opp' }],
  solutionText: '…',
  explain: '…',
  rating: 700,
  themes: ['lethal'],
  refute: [[{ do: 'endTurn' }]], // tempting wrong lines that must fail
}),
```

`npm test` plays every `solution` against the AI and checks it succeeds, and plays every `refute`
line and checks it fails.

### Card names in text

Write card names as plain text. `src/content/mentions.ts` finds them, and the app highlights each one
and shows the full card on hover, focus or tap. Short names ("the Cub") work when the full card is
part of the same question. If a question names a card that isn't on its board or in its card row,
the card also appears under the prompt. To list every short-name match and check for mistakes:

```bash
DESIGN=1 npx vitest run src/dev/mentions.test.ts --silent=false
```

### Designing harder puzzles

`src/engine/solver.ts` tries every line of play against the AI and counts winning and losing lines.
Ladder puzzles live in `src/content/ladder.ts`. To survey them (slow, not part of `npm test`):

```bash
DESIGN=1 npx vitest run src/dev --silent=false
```

A good hard puzzle has few winning lines (often just different orderings of one idea) and many
failing ones. The ladder stops at about 1950: beyond that, puzzles would need more than one of your
turns, hidden information, or more tricks than the AI can search exhaustively — so the "best
defense" guarantee would no longer hold.
