import { describe, expect, it } from 'vitest';
import { randomDrill } from '../content/drills';
import { addDays, addXP, completeLesson, dueIds, expectedScore, newProgress, ratePuzzle, reviewQueue, scheduleItem, visibleStreak } from './progress';

describe('streaks', () => {
  it('grows on consecutive days and breaks after a gap', () => {
    const p = newProgress();
    addXP(p, 10, '2026-09-01');
    addXP(p, 10, '2026-09-02');
    expect(p.streak).toBe(2);
    expect(visibleStreak(p, '2026-09-03')).toBe(2);
    expect(visibleStreak(p, '2026-09-04')).toBe(0);
    addXP(p, 10, '2026-09-05');
    expect(p.streak).toBe(1);
    expect(p.longestStreak).toBe(2);
  });
});

describe('spaced repetition', () => {
  it('schedules correct answers further out and resets misses', () => {
    const p = newProgress();
    const today = '2026-09-10';
    completeLesson(p, { lessonId: 'x', items: [{ id: 'x:0', firstTry: true }, { id: 'x:1', firstTry: false }], terms: ['Tempo'] }, today);
    expect(p.srs['x:0'].due).toBe(addDays(today, 1));
    expect(p.srs['x:1'].due).toBe(today);
    expect(dueIds(p, today)).toEqual(['x:1']);
    scheduleItem(p, 'x:0', true, addDays(today, 1));
    expect(p.srs['x:0'].box).toBe(2);
    expect(p.srs['x:0'].due).toBe(addDays(today, 4));
    scheduleItem(p, 'x:0', false, addDays(today, 4));
    expect(p.srs['x:0'].box).toBe(0);
    expect(p.srs['g:Tempo']).toBeDefined();
    expect(reviewQueue(p, 10, today).length).toBe(3);
  });
});

describe('puzzle rating', () => {
  it('rises more for beating harder puzzles', () => {
    expect(expectedScore(1000, 1000)).toBeCloseTo(0.5);
    const a = newProgress();
    const b = newProgress();
    const da = ratePuzzle(a, 'p1', 1200, true);
    const db = ratePuzzle(b, 'p1', 600, true);
    expect(da).toBeGreaterThan(db);
    const c = newProgress();
    expect(ratePuzzle(c, 'p2', 600, false)).toBeLessThan(0);
  });
});

describe('rush drills', () => {
  it('always produce a valid answer', () => {
    for (let i = 0; i < 500; i++) {
      const d = randomDrill();
      expect(d.answer).toBeGreaterThanOrEqual(0);
      expect(d.answer).toBeLessThan(d.options.length);
    }
  });
});
