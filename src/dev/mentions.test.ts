import { it } from 'vitest';
import { GLOSSARY, LADDER_PUZZLES, LESSONS } from '../content';
import { exerciseScope, mentionMatcher, teachCardRow, teachScope, unshownQuestionCards } from '../content/mentions';
import type { Exercise } from '../content/types';

// Design survey: which cards each question names but doesn't show, and every short-name match
// in context, to spot false positives. Run with DESIGN=1 npx vitest run src/dev/mentions.test.ts --silent=false
it('surveys card mentions', () => {
  const out: string[] = [];
  const aliases: string[] = [];
  const scan = (where: string, texts: string[], scope: string[]) => {
    const { re, lookup } = mentionMatcher(scope);
    for (const t of texts) {
      for (const m of t.matchAll(re)) {
        const name = lookup.get(m[1].replace(/’/g, "'"))!;
        if (name !== m[1]) aliases.push(`${where}: "${t.slice(Math.max(0, m.index! - 25), m.index! + m[0].length + 15).replace(/\n/g, ' ')}" → ${name}`);
      }
    }
  };
  const allText = (ex: Exercise) => {
    const e = ex as any;
    return [e.prompt, e.explain, e.context, e.hint, e.solutionText, e.goalText, ...(e.options ?? []), ...(e.notes ?? []), ...(e.items ?? []).map((x: any) => (typeof x === 'string' ? x : x.text)), ...(e.pairs ?? []).flat(), e.scene?.note].filter(Boolean);
  };
  for (const l of LESSONS) {
    l.teach.forEach((t, i) => {
      const row = teachCardRow(t);
      if (row.join() !== (t.cards ?? []).join()) out.push(`${l.id} teach${i}: row=[${row.join(', ')}] (was [${(t.cards ?? []).join(', ')}])`);
      scan(`${l.id} teach${i}`, [t.body], teachScope(t));
    });
    for (const ex of l.exercises) {
      const extra = unshownQuestionCards(ex);
      if (extra.length) out.push(`${ex.id} ${ex.type}: extra=[${extra.join(', ')}]`);
      scan(ex.id!, allText(ex), exerciseScope(ex));
    }
  }
  for (const p of LADDER_PUZZLES) {
    const extra = unshownQuestionCards(p.ex);
    if (extra.length) out.push(`${p.id}: extra=[${extra.join(', ')}]`);
    scan(p.id, allText(p.ex), exerciseScope(p.ex));
  }
  for (const [k, v] of Object.entries(GLOSSARY)) scan(`glossary ${k}`, [v], []);
  console.log(out.join('\n'));
  console.log(`\nSHORT NAMES (${aliases.length}):\n` + aliases.join('\n'));
});
