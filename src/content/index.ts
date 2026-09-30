import { GLOSSARY, GLOSSARY_TERMS } from './glossary';
import type { BoardExercise, Exercise, Lesson, MCExercise, Unit } from './types';
import { unit0 } from './unit0';
import { unit1 } from './unit1';
import { unit2 } from './unit2';
import { unit3 } from './unit3';
import { unit4 } from './unit4';
import { unit5 } from './unit5';
import { unit6 } from './unit6';
import { unit7 } from './unit7';
import { unit8 } from './unit8';

export const UNITS: Unit[] = [unit0, unit1, unit2, unit3, unit4, unit5, unit6, unit7, unit8];

// Give every exercise a stable id: `${lessonId}:${index}`.
for (const u of UNITS) for (const l of u.lessons) l.exercises.forEach((ex, i) => (ex.id = `${l.id}:${i}`));

export const LESSONS: Lesson[] = UNITS.flatMap((u) => u.lessons);
export const COURSE_LESSONS: Lesson[] = UNITS.filter((u) => !u.optional).flatMap((u) => u.lessons);

const lessonById = new Map(LESSONS.map((l) => [l.id, l]));
const unitByLesson = new Map(UNITS.flatMap((u) => u.lessons.map((l) => [l.id, u] as const)));

export function getLesson(id: string): Lesson | undefined {
  return lessonById.get(id);
}

export function unitOf(lessonId: string): Unit | undefined {
  return unitByLesson.get(lessonId);
}

export function getExercise(id: string): Exercise | undefined {
  const [lid, idx] = id.split(':');
  return lessonById.get(lid)?.exercises[Number(idx)];
}

export interface PuzzleEntry {
  id: string;
  lessonId: string;
  lessonTitle: string;
  ex: BoardExercise;
}

export const PUZZLES: PuzzleEntry[] = LESSONS.flatMap((l) =>
  l.exercises.filter((e): e is BoardExercise => e.type === 'board').map((ex) => ({ id: ex.id!, lessonId: l.id, lessonTitle: l.title, ex })),
);

export const PUZZLE_THEMES = [...new Set(PUZZLES.flatMap((p) => p.ex.themes))].sort();

/** Which lesson introduces each glossary term. */
export const TERM_LESSON: Record<string, string> = {};
for (const l of LESSONS) for (const t of l.terms ?? []) if (!TERM_LESSON[t]) TERM_LESSON[t] = l.id;

export { GLOSSARY, GLOSSARY_TERMS };

/** A retrieval question for a glossary term, with three other definitions (or terms) as distractors. */
export function glossaryExercise(term: string, rand = Math.random): MCExercise {
  const others = GLOSSARY_TERMS.filter((t) => t !== term);
  const picks: string[] = [];
  while (picks.length < 3) {
    const t = others[Math.floor(rand() * others.length)];
    if (!picks.includes(t)) picks.push(t);
  }
  const askTerm = rand() < 0.5;
  if (askTerm) {
    return {
      type: 'mc',
      id: `g:${term}`,
      prompt: `Which term fits this definition?\n\n*${GLOSSARY[term]}*`,
      options: [term, ...picks],
      answer: 0,
      explain: `**${term}**: ${GLOSSARY[term]}`,
    };
  }
  return {
    type: 'mc',
    id: `g:${term}`,
    prompt: `What does **${term}** mean?`,
    options: [GLOSSARY[term], ...picks.map((p) => GLOSSARY[p])],
    answer: 0,
    explain: `**${term}**: ${GLOSSARY[term]}`,
  };
}

/** Resolve a review id (lesson exercise or glossary term) to an exercise. */
export function reviewExercise(id: string): Exercise | undefined {
  if (id.startsWith('g:')) {
    const term = id.slice(2);
    return GLOSSARY[term] ? glossaryExercise(term) : undefined;
  }
  return getExercise(id);
}

export function reviewSource(id: string): string {
  if (id.startsWith('g:')) return 'Glossary';
  return getLesson(id.split(':')[0])?.title ?? '';
}
