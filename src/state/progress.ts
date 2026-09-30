// Learner progress: XP, streak, hearts, lesson results, spaced repetition and puzzle rating.
// Pure functions over a plain object, so they are easy to test and to persist.

export interface LessonProgress {
  completed: boolean;
  stars: number;
  bestAccuracy: number;
  attempts: number;
  completedAt?: string;
}

export interface SrsItem {
  box: number;
  due: string;
  reps: number;
  lapses: number;
}

export interface Settings {
  sound: boolean;
  unlimitedHearts: boolean;
  unlockAll: boolean;
  theme: 'system' | 'light' | 'dark';
}

export interface Progress {
  version: 1;
  xp: number;
  xpByDay: Record<string, number>;
  streak: number;
  longestStreak: number;
  lastActiveDay: string | null;
  dailyGoal: number;
  hearts: number;
  heartsAt: number;
  lessons: Record<string, LessonProgress>;
  srs: Record<string, SrsItem>;
  puzzleRating: number;
  puzzles: Record<string, { solved: boolean; attempts: number }>;
  rushBest: number;
  rushRuns: number;
  reviewsDone: number;
  flawless: number;
  achievements: Record<string, string>;
  settings: Settings;
  onboarded: boolean;
  /** Chosen at onboarding: new players start with the board tutorial. */
  tutorialFirst?: boolean;
  dailyPuzzleDay?: string;
}

export const MAX_HEARTS = 5;
export const HEART_REGEN_MS = 30 * 60 * 1000;
/** Days until the next review, by Leitner box. */
export const BOX_INTERVALS = [0, 1, 3, 7, 16, 35];

export function newProgress(): Progress {
  return {
    version: 1,
    xp: 0,
    xpByDay: {},
    streak: 0,
    longestStreak: 0,
    lastActiveDay: null,
    dailyGoal: 30,
    hearts: MAX_HEARTS,
    heartsAt: Date.now(),
    lessons: {},
    srs: {},
    puzzleRating: 800,
    puzzles: {},
    rushBest: 0,
    rushRuns: 0,
    reviewsDone: 0,
    flawless: 0,
    achievements: {},
    settings: { sound: true, unlimitedHearts: false, unlockAll: false, theme: 'system' },
    onboarded: false,
  };
}

// ---------------------------------------------------------------------------
// Dates

export function dayKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function addDays(key: string, n: number): string {
  const [y, m, d] = key.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + n);
  return dayKey(dt);
}

// ---------------------------------------------------------------------------
// XP, streak, levels

export function touchStreak(p: Progress, today = dayKey()): void {
  if (p.lastActiveDay === today) return;
  p.streak = p.lastActiveDay === addDays(today, -1) ? p.streak + 1 : 1;
  p.longestStreak = Math.max(p.longestStreak, p.streak);
  p.lastActiveDay = today;
}

export function addXP(p: Progress, n: number, today = dayKey()): void {
  p.xp += n;
  p.xpByDay[today] = (p.xpByDay[today] ?? 0) + n;
  touchStreak(p, today);
}

/** The streak as shown to the user: it breaks if you skipped yesterday. */
export function visibleStreak(p: Progress, today = dayKey()): number {
  if (p.lastActiveDay === today || p.lastActiveDay === addDays(today, -1)) return p.streak;
  return 0;
}

const LEVELS = [0, 40, 100, 180, 280, 400, 550, 730, 950, 1200, 1500, 1850, 2250, 2700, 3200, 3800, 4500];
const TITLES = [
  'Spark',
  'Initiate',
  'Apprentice',
  'Novice Mage',
  'Journeyman',
  'Adept',
  'Tactician',
  'Strategist',
  'Grinder',
  'PTQ Contender',
  'Grand Prix Regular',
  'Pro Tour Hopeful',
  'Pro Player',
  'Deckmaster',
  'Hall of Famer',
  'Planeswalker',
  'Level One Legend',
];

export function levelInfo(xp: number) {
  let lvl = 0;
  while (lvl + 1 < LEVELS.length && xp >= LEVELS[lvl + 1]) lvl++;
  const floor = LEVELS[lvl];
  const next = LEVELS[lvl + 1] ?? floor + 800;
  return { level: lvl + 1, title: TITLES[lvl], into: xp - floor, span: next - floor };
}

// ---------------------------------------------------------------------------
// Hearts

export function regenHearts(p: Progress, now = Date.now()): void {
  if (p.hearts >= MAX_HEARTS) {
    p.heartsAt = now;
    return;
  }
  const gained = Math.floor((now - p.heartsAt) / HEART_REGEN_MS);
  if (gained > 0) {
    p.hearts = Math.min(MAX_HEARTS, p.hearts + gained);
    p.heartsAt = p.hearts >= MAX_HEARTS ? now : p.heartsAt + gained * HEART_REGEN_MS;
  }
}

export function msToNextHeart(p: Progress, now = Date.now()): number {
  if (p.hearts >= MAX_HEARTS) return 0;
  return Math.max(0, HEART_REGEN_MS - (now - p.heartsAt));
}

// ---------------------------------------------------------------------------
// Spaced repetition (Leitner boxes)

export function scheduleItem(p: Progress, id: string, correct: boolean, today = dayKey()): void {
  const cur = p.srs[id] ?? { box: 0, due: today, reps: 0, lapses: 0 };
  const box = correct ? Math.min(cur.box + 1, BOX_INTERVALS.length - 1) : 0;
  p.srs[id] = {
    box,
    due: addDays(today, correct ? BOX_INTERVALS[box] : 0),
    reps: cur.reps + 1,
    lapses: cur.lapses + (correct ? 0 : 1),
  };
}

export function addToReview(p: Progress, id: string, correctFirstTry: boolean, today = dayKey()): void {
  if (p.srs[id]) {
    scheduleItem(p, id, correctFirstTry, today);
    return;
  }
  p.srs[id] = { box: correctFirstTry ? 1 : 0, due: addDays(today, correctFirstTry ? 1 : 0), reps: 1, lapses: correctFirstTry ? 0 : 1 };
}

export function dueIds(p: Progress, today = dayKey()): string[] {
  return Object.entries(p.srs)
    .filter(([, it]) => it.due <= today)
    .sort((a, b) => a[1].box - b[1].box || a[1].due.localeCompare(b[1].due))
    .map(([id]) => id);
}

/** Items that are due; if there are few, top up with the weakest items so review is never empty. */
export function reviewQueue(p: Progress, n: number, today = dayKey(), rand = Math.random): string[] {
  const due = dueIds(p, today);
  let pool = due.slice(0, n);
  if (pool.length < n) {
    const rest = Object.entries(p.srs)
      .filter(([id]) => !pool.includes(id))
      .sort((a, b) => a[1].box - b[1].box || b[1].lapses - a[1].lapses)
      .map(([id]) => id);
    pool = [...pool, ...rest.slice(0, n - pool.length)];
  }
  // Interleave: shuffle so items from different lessons mix.
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool;
}

// ---------------------------------------------------------------------------
// Lessons

export function starsFor(accuracy: number): number {
  return accuracy >= 0.9 ? 3 : accuracy >= 0.7 ? 2 : 1;
}

export interface LessonResult {
  lessonId: string;
  items: { id: string; firstTry: boolean }[];
  terms: string[];
}

export function completeLesson(p: Progress, r: LessonResult, today = dayKey()): { xp: number; stars: number; accuracy: number; flawless: boolean } {
  const total = r.items.length || 1;
  const right = r.items.filter((i) => i.firstTry).length;
  const accuracy = right / total;
  const stars = starsFor(accuracy);
  const flawless = right === total;
  const prev = p.lessons[r.lessonId];
  const firstTime = !prev?.completed;
  const xp = (firstTime ? 15 : 8) + right + (flawless ? 5 : 0);
  p.lessons[r.lessonId] = {
    completed: true,
    stars: Math.max(stars, prev?.stars ?? 0),
    bestAccuracy: Math.max(accuracy, prev?.bestAccuracy ?? 0),
    attempts: (prev?.attempts ?? 0) + 1,
    completedAt: prev?.completedAt ?? today,
  };
  for (const it of r.items) addToReview(p, it.id, it.firstTry, today);
  for (const t of r.terms) if (!p.srs[`g:${t}`]) p.srs[`g:${t}`] = { box: 0, due: addDays(today, 1), reps: 0, lapses: 0 };
  if (flawless) p.flawless++;
  addXP(p, xp, today);
  return { xp, stars, accuracy, flawless };
}

// ---------------------------------------------------------------------------
// Puzzle rating (Elo, like chess puzzle trainers)

export function expectedScore(user: number, puzzle: number): number {
  return 1 / (1 + Math.pow(10, (puzzle - user) / 400));
}

export function ratePuzzle(p: Progress, puzzleId: string, puzzleRating: number, solved: boolean): number {
  const prev = p.puzzles[puzzleId];
  const k = prev ? 12 : 32; // repeats move the rating less
  const delta = Math.round(k * ((solved ? 1 : 0) - expectedScore(p.puzzleRating, puzzleRating)));
  p.puzzleRating = Math.max(100, p.puzzleRating + delta);
  p.puzzles[puzzleId] = { solved: (prev?.solved ?? false) || solved, attempts: (prev?.attempts ?? 0) + 1 };
  return delta;
}

// ---------------------------------------------------------------------------
// Achievements

export interface Achievement {
  id: string;
  icon: string;
  title: string;
  desc: string;
  test: (p: Progress, ctx: { totalLessons: number; totalTerms: number; units: { id: string; lessonIds: string[] }[]; ladder?: { id: string; rating: number }[] }) => boolean;
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first', icon: '🎓', title: 'First Steps', desc: 'Finish your first lesson.', test: (p) => Object.values(p.lessons).some((l) => l.completed) },
  { id: 'flawless', icon: '💎', title: 'Flawless', desc: 'Finish a lesson without a single mistake.', test: (p) => p.flawless > 0 },
  { id: 'streak3', icon: '🔥', title: 'On Fire', desc: 'Reach a 3-day streak.', test: (p) => p.longestStreak >= 3 },
  { id: 'streak7', icon: '📅', title: 'Week Warrior', desc: 'Reach a 7-day streak.', test: (p) => p.longestStreak >= 7 },
  {
    id: 'unit',
    icon: '🏆',
    title: 'Unit Cleared',
    desc: 'Finish every lesson in a unit.',
    test: (p, c) => c.units.some((u) => u.lessonIds.length > 0 && u.lessonIds.every((id) => p.lessons[id]?.completed)),
  },
  { id: 'puzzles10', icon: '🧩', title: 'Puzzle Solver', desc: 'Solve 10 different puzzles.', test: (p) => Object.values(p.puzzles).filter((x) => x.solved).length >= 10 },
  { id: 'rating1200', icon: '📈', title: 'Sharp Eye', desc: 'Reach a puzzle rating of 1200.', test: (p) => p.puzzleRating >= 1200 },
  {
    id: 'master',
    icon: '🎯',
    title: 'Master Tactician',
    desc: 'Solve a Master puzzle (rated 1600+).',
    test: (p, c) => (c.ladder ?? []).some((x) => x.rating >= 1600 && p.puzzles[x.id]?.solved),
  },
  {
    id: 'ladder',
    icon: '🪜',
    title: 'Top of the Ladder',
    desc: 'Solve every puzzle on the ladder.',
    test: (p, c) => !!c.ladder?.length && c.ladder.every((x) => p.puzzles[x.id]?.solved),
  },
  { id: 'rush15', icon: '⚡', title: 'Speed Demon', desc: 'Score 15 or more in Puzzle Rush.', test: (p) => p.rushBest >= 15 },
  { id: 'review5', icon: '🧠', title: 'Memory Palace', desc: 'Finish 5 review sessions.', test: (p) => p.reviewsDone >= 5 },
  { id: 'xp1000', icon: '✨', title: 'Thousand Club', desc: 'Earn 1,000 XP.', test: (p) => p.xp >= 1000 },
  {
    id: 'graduate',
    icon: '🌟',
    title: 'Level One Graduate',
    desc: 'Finish every lesson in the course.',
    test: (p, c) => Object.values(p.lessons).filter((l) => l.completed).length >= c.totalLessons,
  },
];

export function checkAchievements(p: Progress, ctx: Parameters<Achievement['test']>[1], today = dayKey()): Achievement[] {
  const fresh: Achievement[] = [];
  for (const a of ACHIEVEMENTS) {
    if (!p.achievements[a.id] && a.test(p, ctx)) {
      p.achievements[a.id] = today;
      fresh.push(a);
    }
  }
  return fresh;
}
