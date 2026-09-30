import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PUZZLE_THEMES, PUZZLES, TIERS, tierOf, type PuzzleEntry } from '../content';
import { randomDrill, type Drill } from '../content/drills';
import { exerciseScope } from '../content/mentions';
import { finishDaily, finishRush, recordPuzzle } from '../state/actions';
import { dayKey } from '../state/progress';
import { getProgress, useProgress } from '../state/store';
import { Board } from './Board';
import { CardScope } from './CardRef';
import { CardChip } from './CardView';
import { confetti, sfx } from './effects';
import { NamedCards } from './Exercises';
import { Link, navigate } from './router';
import { Inline, Prose } from './Text';

// ---------------------------------------------------------------------------
// Hub

export function PuzzleHub() {
  const p = useProgress();
  const solved = Object.values(p.puzzles).filter((x) => x.solved).length;
  const today = dayKey();
  return (
    <div className="page">
      <div className="page-head">
        <h1>Puzzles</h1>
        <p>Like chess tactics: short board positions with one goal. The opponent always plays its best defense. Solving many of them builds pattern recognition.</p>
      </div>
      <div className="grid2">
        <div className="modecard">
          <div className="eyebrow">Your puzzle rating</div>
          <div className="rating num">{p.puzzleRating}</div>
          <p>
            {solved} of {PUZZLES.length} puzzles solved. Your rating goes up when you solve puzzles above your level and down when you miss easier ones.
          </p>
          <button className="btn good" onClick={() => navigate('/puzzles/train')}>
            🎯 Rated puzzles
          </button>
        </div>
        <div className="modecard">
          <div className="mc-ico" aria-hidden="true">
            ⚡
          </div>
          <h3>Puzzle Rush</h3>
          <p>Three minutes, three strikes. Fast combat math, lethal checks, races, card counting and mulligans. Best: {p.rushBest}.</p>
          <button className="btn bad" onClick={() => navigate('/puzzles/rush')}>
            Start rush
          </button>
        </div>
        <div className="modecard">
          <div className="mc-ico" aria-hidden="true">
            📅
          </div>
          <h3>Daily puzzle</h3>
          <p>{p.dailyPuzzleDay === today ? 'Done for today. Come back tomorrow for a new one.' : 'One board a day. Bonus XP for solving it.'}</p>
          <button className="btn" onClick={() => navigate('/puzzles/daily')}>
            {p.dailyPuzzleDay === today ? 'See today\'s puzzle' : 'Solve today\'s puzzle'}
          </button>
        </div>
      </div>
      <Ladder />
      <div className="panel">
        <h3>All puzzles by theme</h3>
        <div className="theme-chips">
          {PUZZLE_THEMES.map((t) => (
            <Link key={t} to={`/puzzles/train/${encodeURIComponent(t)}`} className="theme-chip" style={{ textDecoration: 'none', color: 'var(--ink)' }}>
              {t} <span className="muted num">({PUZZLES.filter((x) => x.ex.themes.includes(t)).length})</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// The ladder: every puzzle by difficulty tier

/** All puzzles from easiest to hardest. */
const BY_RATING = [...PUZZLES].sort((a, b) => a.ex.rating - b.ex.rating);

export function puzzleTitle(e: PuzzleEntry): string {
  if (e.source === 'ladder') {
    const slug = e.id.replace(/^ladder:/, '');
    return slug.replace(/-/g, ' ').replace(/^./, (c) => c.toUpperCase());
  }
  const n = PUZZLES.filter((x) => x.lessonId === e.lessonId).indexOf(e) + 1;
  const count = PUZZLES.filter((x) => x.lessonId === e.lessonId).length;
  return count > 1 ? `${e.lessonTitle} ${n}` : e.lessonTitle;
}

function Ladder() {
  const p = useProgress();
  const next = BY_RATING.find((e) => !p.puzzles[e.id]?.solved);
  return (
    <div className="panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', alignItems: 'baseline' }}>
        <h3>The puzzle ladder</h3>
        {next && (
          <button className="btn small" onClick={() => navigate(`/puzzles/p/${encodeURIComponent(next.id)}`)}>
            Next unsolved: {puzzleTitle(next)} ({next.ex.rating}) →
          </button>
        )}
      </div>
      <p className="small muted" style={{ marginTop: 0 }}>
        Every puzzle from easiest to hardest. Lesson puzzles fill the lower tiers; the upper tiers are trainer-only puzzles that combine several ideas. Solved puzzles can be replayed any time.
      </p>
      <div className="ladder">
        {TIERS.map((t) => {
          const list = BY_RATING.filter((e) => tierOf(e.ex.rating).name === t.name);
          if (!list.length) return null;
          const done = list.filter((e) => p.puzzles[e.id]?.solved).length;
          return (
            <div key={t.name} className="tier" style={{ ['--tier' as string]: t.color } as React.CSSProperties}>
              <div className="tier-head">
                <b>{t.name}</b>
                <span className="small muted num">
                  {t.min}+ · {done}/{list.length} solved
                </span>
              </div>
              <div className="tier-bar" aria-hidden="true">
                <span style={{ width: `${(done / list.length) * 100}%` }} />
              </div>
              <div className="tier-list">
                {list.map((e) => {
                  const solved = p.puzzles[e.id]?.solved;
                  const tried = p.puzzles[e.id] && !solved;
                  return (
                    <Link
                      key={e.id}
                      to={`/puzzles/p/${encodeURIComponent(e.id)}`}
                      className={`tier-item ${solved ? 'solved' : ''} ${next?.id === e.id ? 'next' : ''}`}
                      title={e.ex.goalText}
                    >
                      <span aria-hidden="true">{solved ? '✔' : tried ? '✘' : next?.id === e.id ? '▶' : '○'}</span>
                      <span className="tier-name">{puzzleTitle(e)}</span>
                      <span className="small muted num">{e.ex.rating}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Rated trainer

function choosePuzzle(rating: number, pool: PuzzleEntry[], solved: Record<string, { solved: boolean }>, avoid?: string): PuzzleEntry {
  const fresh = pool.filter((x) => !solved[x.id]?.solved && x.id !== avoid);
  const cands = (fresh.length ? fresh : pool.filter((x) => x.id !== avoid)).sort((a, b) => Math.abs(a.ex.rating - rating) - Math.abs(b.ex.rating - rating));
  const top = cands.slice(0, 3);
  return top[Math.floor(Math.random() * top.length)] ?? pool[0];
}

export function PuzzleTrainer({ theme, fixedId }: { theme?: string; fixedId?: string }) {
  const p = useProgress();
  const pool = useMemo(() => (theme ? PUZZLES.filter((x) => x.ex.themes.includes(theme)) : PUZZLES), [theme]);
  const [cur, setCur] = useState<PuzzleEntry>(() => PUZZLES.find((x) => x.id === fixedId) ?? choosePuzzle(p.puzzleRating, pool, p.puzzles));
  const ladderMode = !!fixedId;
  // Whether this puzzle was solved before the current attempt (not updated by solving it now).
  const solvedBefore = useMemo(() => !!getProgress().puzzles[cur.id]?.solved, [cur]);
  const [result, setResult] = useState<{ solved: boolean; delta: number } | null>(null);
  const [resetKey, setResetKey] = useState(0);
  const [replay, setReplay] = useState<PuzzleEntry['ex']['solution'] | null>(null);
  const [hint, setHint] = useState(false);
  const [streak, setStreak] = useState(0);

  const onFinish = useCallback(
    (status: 'success' | 'fail') => {
      if (result) return;
      const solved = status === 'success';
      const delta = recordPuzzle(cur.id, cur.ex.rating, solved && !hint, true);
      setResult({ solved, delta });
      setStreak((s) => (solved ? s + 1 : 0));
      if (solved) sfx.good();
      else sfx.bad();
    },
    [cur, hint, result],
  );

  function next() {
    if (ladderMode) {
      // Climb: the next unsolved puzzle above this one, else the next one up.
      const i = BY_RATING.indexOf(cur);
      const up = BY_RATING.slice(i + 1);
      const target = up.find((e) => !p.puzzles[e.id]?.solved) ?? up[0] ?? BY_RATING[0];
      navigate(`/puzzles/p/${encodeURIComponent(target.id)}`);
      return;
    }
    setCur(choosePuzzle(p.puzzleRating, pool, p.puzzles, cur.id));
    setResult(null);
    setReplay(null);
    setHint(false);
    setResetKey((k) => k + 1);
  }

  return (
    <CardScope cards={exerciseScope(cur.ex)}>
      <div className="page">
        <div className="page-head" style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div>
            <div className="eyebrow">
              <Link to="/puzzles">Puzzles</Link> / {ladderMode ? 'Ladder' : theme ? `Theme: ${theme}` : 'Rated'}
            </div>
            <h1>{puzzleTitle(cur)}</h1>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="eyebrow">Your rating</div>
            <div className="rating num" style={{ fontSize: '1.6rem' }}>
              {p.puzzleRating}
              {result && (
                <span className="small" style={{ color: result.delta >= 0 ? 'var(--good)' : 'var(--bad)', marginLeft: '0.4rem' }}>
                  {result.delta >= 0 ? `+${result.delta}` : result.delta}
                </span>
              )}
            </div>
            {streak > 1 && <div className="pill gold">🔥 {streak} solved in a row</div>}
          </div>
        </div>
        <div className="small muted" style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <span className="pill" style={{ background: tierOf(cur.ex.rating).color, color: '#fff' }}>
            {tierOf(cur.ex.rating).name}
          </span>
          <span className="pill dim">Rating {cur.ex.rating}</span>
          {solvedBefore && <span className="pill good">Solved before</span>}
          {cur.ex.themes.map((t) => (
            <span key={t} className="pill dim">
              {t}
            </span>
          ))}
          <span>
            {cur.source === 'ladder' ? 'Builds on' : 'From'} the lesson <Link to={`/lesson/${cur.lessonId}`}>{cur.lessonTitle}</Link>
          </span>
        </div>
        <div className="prompt">
          <Inline text={cur.ex.prompt} />
        </div>
        <NamedCards ex={cur.ex} />
        <Board
          key={cur.id}
          spec={cur.ex.puzzle}
          goalText={cur.ex.goalText}
          onFinish={onFinish}
          resetKey={resetKey}
          replay={replay}
          onReplayDone={() => setReplay(null)}
          footer={
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
              {!result && !hint && (
                <button className="btn ghost small" onClick={() => setHint(true)}>
                  💡 Hint (no rating gain)
                </button>
              )}
              {!result && (
                <button className="btn ghost small" onClick={() => setResetKey((k) => k + 1)}>
                  ↺ Reset turn
                </button>
              )}
              {result && (
                <>
                  <button className="btn good small" onClick={next}>
                    {ladderMode ? 'Next on the ladder →' : 'Next puzzle →'}
                  </button>
                  <button className="btn ghost small" onClick={() => setResetKey((k) => k + 1)}>
                    ↺ Try again
                  </button>
                  <button className="btn ghost small" onClick={() => setReplay([...cur.ex.solution])}>
                    ▶ Watch solution
                  </button>
                </>
              )}
              {hint && (
                <span className="context small" style={{ flex: '1 1 100%' }}>
                  💡 <Inline text={cur.ex.hint} />
                </span>
              )}
            </div>
          }
        />
        {result && (
          <div className={`feedback ${result.solved ? 'good' : 'bad'}`} style={{ position: 'static', borderRadius: 16 }}>
            <h3>{result.solved ? 'Solved!' : 'Not this time.'}</h3>
            {!result.solved && (
              <div>
                <b>Solution:</b> <Inline text={cur.ex.solutionText} />
              </div>
            )}
            <Prose text={cur.ex.explain} />
          </div>
        )}
      </div>
    </CardScope>
  );
}

// ---------------------------------------------------------------------------
// Daily

function hashDay(day: string): number {
  let h = 0;
  for (const ch of day) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h;
}

export function DailyPuzzle() {
  const p = useProgress();
  const today = dayKey();
  const entry = PUZZLES[hashDay(today) % PUZZLES.length];
  const [result, setResult] = useState<{ solved: boolean; xp: number } | null>(null);
  const [replay, setReplay] = useState<PuzzleEntry['ex']['solution'] | null>(null);
  const [resetKey, setResetKey] = useState(0);
  const already = p.dailyPuzzleDay === today;
  const onFinish = useCallback(
    (status: 'success' | 'fail') => {
      if (result) return;
      const solved = status === 'success';
      const xp = finishDaily(today, solved);
      setResult({ solved, xp });
      if (solved) {
        sfx.win();
        confetti(1200);
      } else sfx.bad();
    },
    [result, today],
  );
  return (
    <CardScope cards={exerciseScope(entry.ex)}>
      <div className="page">
        <div className="page-head">
          <div className="eyebrow">
            <Link to="/puzzles">Puzzles</Link> / Daily
          </div>
          <h1>Daily puzzle · {new Date().toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}</h1>
          <p>{already && !result ? 'You already played today\'s puzzle. You can still replay it.' : 'Solve it on your first try for 10 XP.'}</p>
        </div>
        <div className="prompt">
          <Inline text={entry.ex.prompt} />
        </div>
        <NamedCards ex={entry.ex} />
        <Board
          spec={entry.ex.puzzle}
          goalText={entry.ex.goalText}
          onFinish={onFinish}
          resetKey={resetKey}
          replay={replay}
          onReplayDone={() => setReplay(null)}
          footer={
            result ? (
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button className="btn ghost small" onClick={() => setResetKey((k) => k + 1)}>
                  ↺ Try again
                </button>
                <button className="btn ghost small" onClick={() => setReplay([...entry.ex.solution])}>
                  ▶ Watch solution
                </button>
                <button className="btn good small" onClick={() => navigate('/puzzles/train')}>
                  More puzzles →
                </button>
              </div>
            ) : null
          }
        />
        {result && (
          <div className={`feedback ${result.solved ? 'good' : 'bad'}`} style={{ position: 'static', borderRadius: 16 }}>
            <h3>{result.solved ? `Solved! ${result.xp ? `+${result.xp} XP` : ''}` : 'Not this time.'}</h3>
            {!result.solved && (
              <div>
                <b>Solution:</b> <Inline text={entry.ex.solutionText} />
              </div>
            )}
            <Prose text={entry.ex.explain} />
          </div>
        )}
      </div>
    </CardScope>
  );
}

// ---------------------------------------------------------------------------
// Rush

const RUSH_SECONDS = 180;

export function Rush() {
  const p = useProgress();
  const [phase, setPhase] = useState<'ready' | 'running' | 'over'>('ready');
  const [drill, setDrill] = useState<Drill>(() => randomDrill());
  const [score, setScore] = useState(0);
  const [strikes, setStrikes] = useState(0);
  const [left, setLeft] = useState(RUSH_SECONDS);
  const [flash, setFlash] = useState<{ ok: boolean; text: string } | null>(null);
  const [final, setFinal] = useState<{ best: boolean; xp: number } | null>(null);
  const [missed, setMissed] = useState<Drill[]>([]);
  const endRef = useRef(0);

  const end = useCallback(
    (s: number) => {
      setPhase('over');
      const r = finishRush(s);
      setFinal(r);
      if (r.best) confetti(1400);
    },
    [],
  );

  useEffect(() => {
    if (phase !== 'running') return;
    const t = window.setInterval(() => {
      const remaining = Math.max(0, Math.round((endRef.current - Date.now()) / 1000));
      setLeft(remaining);
      if (remaining <= 0) {
        window.clearInterval(t);
        end(score);
      }
    }, 250);
    return () => window.clearInterval(t);
  }, [phase, score, end]);

  function start() {
    setScore(0);
    setStrikes(0);
    setMissed([]);
    setFinal(null);
    setDrill(randomDrill());
    endRef.current = Date.now() + RUSH_SECONDS * 1000;
    setLeft(RUSH_SECONDS);
    setPhase('running');
  }

  useEffect(() => {
    if (phase !== 'running') return;
    const onKey = (e: KeyboardEvent) => {
      const n = Number(e.key);
      if (n >= 1 && n <= drill.options.length) answer(n - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  function answer(i: number) {
    if (phase !== 'running') return;
    const ok = i === drill.answer;
    if (ok) {
      sfx.good();
      setScore((s) => s + 1);
      setFlash({ ok: true, text: 'Correct' });
    } else {
      sfx.bad();
      setMissed((m) => [...m, drill]);
      setFlash({ ok: false, text: `${drill.options[drill.answer]} — ${drill.explain}` });
      const st = strikes + 1;
      setStrikes(st);
      if (st >= 3) {
        end(score);
        return;
      }
    }
    setDrill(randomDrill());
  }

  if (phase === 'ready') {
    return (
      <div className="page">
        <div className="page-head">
          <div className="eyebrow">
            <Link to="/puzzles">Puzzles</Link> / Rush
          </div>
          <h1>⚡ Puzzle Rush</h1>
          <p>Answer as many quick questions as you can in 3 minutes. Three wrong answers end the run. Every question is generated fresh, so you train the pattern, not the answer.</p>
        </div>
        <div className="panel">
          <p style={{ marginTop: 0 }}>You'll see:</p>
          <ul className="prose" style={{ marginTop: 0 }}>
            <li>
              <b>Combat math</b> — who dies in a block (first strike, deathtouch, indestructible)
            </li>
            <li>
              <b>Count lethal</b> — is this attack plus burn enough?
            </li>
            <li>
              <b>Race math</b> — who wins if nobody blocks?
            </li>
            <li>
              <b>Card counting</b> — net card advantage of a play
            </li>
            <li>
              <b>Two-to-five lands</b> — keep or mulligan
            </li>
          </ul>
          <p className="muted">Personal best: {p.rushBest}</p>
          <button className="btn bad" onClick={start}>
            Start the clock
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'over') {
    return (
      <div className="page">
        <div className="results">
          <div style={{ fontSize: '3rem' }} aria-hidden="true">
            {final?.best ? '🏆' : '⚡'}
          </div>
          <h1>{final?.best ? 'New personal best!' : 'Time!'}</h1>
          <div className="rating num">{score}</div>
          <p className="muted">+{final?.xp ?? 0} XP · Best: {p.rushBest}</p>
          <div style={{ display: 'flex', gap: '0.6rem' }}>
            <button className="btn bad" onClick={start}>
              Play again
            </button>
            <button className="btn ghost" onClick={() => navigate('/puzzles')}>
              Back
            </button>
          </div>
        </div>
        {missed.length > 0 && (
          <div className="panel">
            <h3>Review your misses</h3>
            <div style={{ display: 'grid', gap: '0.7rem' }}>
              {missed.map((m, i) => (
                <div key={i} className="context">
                  <div>
                    <Inline text={m.prompt} />
                  </div>
                  <div>
                    <b>Answer:</b> {m.options[m.answer]} — {m.explain}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="page" style={{ maxWidth: 720 }}>
      <div className="rush-top">
        <span className={`timer num ${left <= 20 ? 'low' : ''}`}>
          {Math.floor(left / 60)}:{String(left % 60).padStart(2, '0')}
        </span>
        <span className="num">Score {score}</span>
        <span className="strikes" aria-label={`${strikes} of 3 strikes`}>
          {[0, 1, 2].map((i) => (i < strikes ? '❌' : '⚪')).join('')}
        </span>
      </div>
      <div className="eyebrow">{drill.kind}</div>
      <div className="prompt">
        <Inline text={drill.prompt} />
      </div>
      {drill.cards && (
        <div className="chiprow">
          {drill.cards.map((c, i) => (
            <CardChip key={i} name={c} />
          ))}
        </div>
      )}
      <div className="options">
        {drill.options.map((o, i) => (
          <button key={`${drill.prompt}-${i}`} className="option" onClick={() => answer(i)}>
            <span className="key">{i + 1}</span>
            <span>{o}</span>
          </button>
        ))}
      </div>
      {flash && (
        <div className={`result ${flash.ok ? 'success' : 'fail'} small`} role="status">
          {flash.ok ? '✔ Correct' : `✘ ${flash.text}`}
        </div>
      )}
    </div>
  );
}
