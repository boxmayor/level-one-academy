import { describe, expect, it } from 'vitest';
import { hasCard } from '../engine/cardpool';
import { runScript } from '../engine/puzzle';
import { GLOSSARY, LADDER_PUZZLES, LESSONS, PUZZLES, TERM_LESSON, UNITS } from './index';

describe('content integrity', () => {
  it('has unique lesson ids', () => {
    const ids = LESSONS.map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('references only real cards', () => {
    const missing: string[] = [];
    const check = (name: string, where: string) => {
      if (!hasCard(name)) missing.push(`${where}: ${name}`);
    };
    for (const l of LESSONS) {
      for (const t of l.teach) t.cards?.forEach((c) => check(c, l.id));
      for (const ex of l.exercises) {
        ex.cards?.forEach((c) => check(c, ex.id!));
        if (ex.type === 'hand') ex.hand.forEach((c) => check(c, ex.id!));
        if (ex.type === 'pick') ex.pack.forEach((c) => check(c, ex.id!));
        const boards = [ex.scene, ex.type === 'board' ? ex.puzzle : undefined].filter(Boolean) as { you: any; opp: any }[];
        for (const b of boards) {
          for (const side of [b.you, b.opp]) {
            for (const e of side.battlefield ?? []) check(typeof e === 'string' ? e : e.card, ex.id!);
            for (const c of [...(side.hand ?? []), ...(side.library ?? []), ...(side.graveyard ?? [])]) check(c, ex.id!);
          }
        }
      }
    }
    for (const p of LADDER_PUZZLES) {
      for (const side of [p.ex.puzzle.you, p.ex.puzzle.opp]) {
        for (const e of side.battlefield ?? []) check(typeof e === 'string' ? e : e.card, p.id);
        for (const c of [...(side.hand ?? []), ...(side.library ?? []), ...(side.graveyard ?? [])]) check(c, p.id);
      }
    }
    expect(missing).toEqual([]);
  });

  it('has ladder puzzles with unique ids, real lessons, and rising ratings', () => {
    const ids = LADDER_PUZZLES.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const p of LADDER_PUZZLES) expect(p.lessonTitle, p.id).not.toBe('');
    for (let i = 1; i < LADDER_PUZZLES.length; i++) expect(LADDER_PUZZLES[i].ex.rating).toBeGreaterThanOrEqual(LADDER_PUZZLES[i - 1].ex.rating);
  });

  it('has well-formed exercises', () => {
    const problems: string[] = [];
    for (const l of LESSONS) {
      if (!l.exercises.length) problems.push(`${l.id}: no exercises`);
      for (const ex of l.exercises) {
        if (ex.type === 'mc') {
          const ans = Array.isArray(ex.answer) ? ex.answer : [ex.answer];
          if (ans.some((a) => a < 0 || a >= ex.options.length)) problems.push(`${ex.id}: answer out of range`);
          if (new Set(ex.options).size !== ex.options.length) problems.push(`${ex.id}: duplicate options`);
        }
        if (ex.type === 'pick') {
          const ans = Array.isArray(ex.answer) ? ex.answer : [ex.answer];
          if (ans.some((a) => a < 0 || a >= ex.pack.length)) problems.push(`${ex.id}: pick out of range`);
        }
        if (ex.type === 'sort' && ex.items.some((it) => it.bucket >= ex.buckets.length)) problems.push(`${ex.id}: bad bucket`);
        if (ex.type === 'number' && ex.min !== undefined && ex.max !== undefined && (ex.answer < ex.min || ex.answer > ex.max)) problems.push(`${ex.id}: answer outside range`);
        if (!ex.explain) problems.push(`${ex.id}: missing explanation`);
      }
    }
    expect(problems).toEqual([]);
  });

  it('only teaches glossary terms that exist', () => {
    const bad = Object.keys(TERM_LESSON).filter((t) => !GLOSSARY[t]);
    expect(bad).toEqual([]);
  });

  it('has lessons in every unit', () => {
    for (const u of UNITS) expect(u.lessons.length).toBeGreaterThan(0);
  });
});

describe('board puzzles', () => {
  for (const p of PUZZLES) {
    it(`${p.id} (${p.lessonTitle}) — solution works`, () => {
      const r = runScript(p.ex.puzzle, p.ex.solution);
      expect(r.error, r.state.log.map((l) => l.text).join('\n')).toBeUndefined();
      expect(r.status, r.state.log.map((l) => l.text).join('\n')).toBe('success');
    });
    (p.ex.refute ?? []).forEach((line, i) => {
      it(`${p.id} — wrong line ${i + 1} fails`, () => {
        const r = runScript(p.ex.puzzle, line);
        expect(r.status, r.state.log.map((l) => l.text).join('\n')).toBe('fail');
      });
    });
  }
});
