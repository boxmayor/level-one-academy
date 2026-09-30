import { COURSE_LESSONS, LADDER_PUZZLES, UNITS } from '../content';
import {
  ACHIEVEMENTS,
  addXP,
  checkAchievements,
  completeLesson,
  MAX_HEARTS,
  ratePuzzle,
  regenHearts,
  scheduleItem,
  type Achievement,
  type LessonResult,
} from './progress';
import { getProgress, updateProgress } from './store';

const ctx = () => ({
  totalLessons: COURSE_LESSONS.length,
  totalTerms: 0,
  units: UNITS.filter((u) => !u.optional).map((u) => ({ id: u.id, lessonIds: u.lessons.map((l) => l.id) })),
  ladder: LADDER_PUZZLES.map((p) => ({ id: p.id, rating: p.ex.rating })),
});

// Achievement announcements (shown as toasts).
type Listener = (a: Achievement) => void;
const achListeners = new Set<Listener>();
export function onAchievement(l: Listener): () => void {
  achListeners.add(l);
  return () => {
    achListeners.delete(l);
  };
}
function announce(list: Achievement[]) {
  for (const a of list) achListeners.forEach((l) => l(a));
}

function withAchievements<T>(fn: (p: ReturnType<typeof getProgress>) => T): T {
  let out!: T;
  let fresh: Achievement[] = [];
  updateProgress((p) => {
    out = fn(p);
    fresh = checkAchievements(p, ctx());
  });
  announce(fresh);
  return out;
}

export function finishLesson(r: LessonResult) {
  return withAchievements((p) => completeLesson(p, r));
}

export function finishReview(results: { id: string; firstTry: boolean }[]) {
  return withAchievements((p) => {
    for (const r of results) scheduleItem(p, r.id, r.firstTry);
    const right = results.filter((r) => r.firstTry).length;
    const xp = right + 5;
    addXP(p, xp);
    p.reviewsDone++;
    p.hearts = MAX_HEARTS;
    p.heartsAt = Date.now();
    return { xp, right, total: results.length };
  });
}

export function loseHeart(): number {
  let left = 0;
  updateProgress((p) => {
    regenHearts(p);
    if (p.settings.unlimitedHearts) {
      left = MAX_HEARTS;
      return;
    }
    if (p.hearts >= MAX_HEARTS) p.heartsAt = Date.now();
    p.hearts = Math.max(0, p.hearts - 1);
    left = p.hearts;
  });
  return left;
}

export function recordPuzzle(id: string, rating: number, solved: boolean, rated: boolean) {
  return withAchievements((p) => {
    const delta = rated ? ratePuzzle(p, id, rating, solved) : 0;
    if (!rated) p.puzzles[id] = { solved: (p.puzzles[id]?.solved ?? false) || solved, attempts: (p.puzzles[id]?.attempts ?? 0) + 1 };
    if (solved) addXP(p, 3);
    return delta;
  });
}

export function finishDaily(day: string, solved: boolean) {
  return withAchievements((p) => {
    if (p.dailyPuzzleDay === day) return 0;
    p.dailyPuzzleDay = day;
    const xp = solved ? 10 : 2;
    addXP(p, xp);
    return xp;
  });
}

export function finishRush(score: number) {
  return withAchievements((p) => {
    const best = score > p.rushBest;
    p.rushBest = Math.max(p.rushBest, score);
    p.rushRuns++;
    const xp = Math.min(30, Math.round(score / 2) + 2);
    addXP(p, xp);
    return { best, xp };
  });
}

export { ACHIEVEMENTS };
