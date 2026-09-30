import { it } from 'vitest';
import { PUZZLES } from '../content';
import { solve } from '../engine/solver';

// Design aid (not part of the regular suite): how many of your lines solve each existing puzzle?
it('solver survey', () => {
  const t0 = Date.now();
  for (const p of PUZZLES) {
    const t = Date.now();
    const r = solve(p.ex.puzzle, { maxNodes: 4000 });
    console.log(`${String(p.ex.rating).padStart(5)} ${p.id.padEnd(26)} winLines=${String(r.winCount).padStart(4)} nodes=${String(r.nodes).padStart(5)}${r.truncated ? ' (cut)' : ''} ${Date.now() - t}ms`);
  }
  console.log('total', Date.now() - t0, 'ms');
}, 600000);
