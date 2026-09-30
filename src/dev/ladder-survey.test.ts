import { it } from 'vitest';
import { LADDER } from '../content/ladder';
import { runScript } from '../engine/puzzle';
import { solve } from '../engine/solver';

// Design aid: check each ladder puzzle's solution, wrong lines, and how many lines win.
it('ladder survey', () => {
  for (const p of LADDER) {
    const t = Date.now();
    const sol = runScript(p.ex.puzzle, p.ex.solution);
    const refs = (p.ex.refute ?? []).map((r) => runScript(p.ex.puzzle, r).status);
    const r = solve(p.ex.puzzle, { maxNodes: 30000, keep: 3 });
    console.log(
      `\n${p.ex.rating} ${p.id}: solution=${sol.status}${sol.error ? ` (${sol.error})` : ''} refutes=[${refs.join(',')}] win=${r.winCount} fail=${r.failCount} nodes=${r.nodes}${r.truncated ? ' CUT' : ''} ${Date.now() - t}ms`,
    );
    if (sol.status !== 'success') console.log(sol.state.log.map((l) => '   | ' + l.text).join('\n'));
    for (const w of r.wins) console.log('   win: ' + w.join(' ; '));
  }
}, 900000);
