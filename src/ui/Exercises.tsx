import { useCallback, useEffect, useMemo, useState } from 'react';
import type {
  BoardExercise,
  Exercise,
  HandExercise,
  MatchExercise,
  MCExercise,
  NumberExercise,
  OrderExercise,
  PickExercise,
  SortExercise,
} from '../content/types';
import { Board, Scene } from './Board';
import { CardFace } from './CardView';
import { Inline, Prose } from './Text';

export interface ResultInfo {
  correct: boolean;
  assisted?: boolean;
  note?: string;
  answerText?: string;
}

interface Props<E> {
  ex: E;
  locked: boolean;
  onResult: (r: ResultInfo) => void;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function CheckBar({ disabled, onCheck, label = 'Check' }: { disabled: boolean; onCheck: () => void; label?: string }) {
  return (
    <div className="checkbar">
      <button className="btn good" disabled={disabled} onClick={onCheck} style={{ minWidth: 150 }}>
        {label}
      </button>
    </div>
  );
}

function Illustration({ ex }: { ex: Exercise }) {
  return (
    <>
      {ex.scene && <Scene you={ex.scene.you} opp={ex.scene.opp} note={ex.scene.note} />}
      {ex.cards && ex.cards.length > 0 && (
        <div className="cardrow">
          {ex.cards.map((c, i) => (
            <CardFace key={i} name={c} size="sm" />
          ))}
        </div>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------

function MC({ ex, locked, onResult }: Props<MCExercise>) {
  const multi = Array.isArray(ex.answer);
  const answers = useMemo(() => (Array.isArray(ex.answer) ? ex.answer : [ex.answer]), [ex.answer]);
  const [sel, setSel] = useState<number[]>([]);
  // Display order: shuffled unless the author fixed it (True/False, numeric scales).
  const perm = useMemo(() => {
    const idx = ex.options.map((_, i) => i);
    return ex.fixedOrder ? idx : shuffle(idx);
  }, [ex]);
  const toggle = (i: number) => {
    if (locked) return;
    setSel((s) => (multi ? (s.includes(i) ? s.filter((x) => x !== i) : [...s, i]) : [i]));
  };
  const check = useCallback(() => {
    if (!sel.length || locked) return;
    const correct = sel.length === answers.length && sel.every((i) => answers.includes(i));
    const note = sel.map((i) => ex.notes?.[i]).filter(Boolean).join(' ');
    onResult({ correct, note: note || undefined, answerText: correct ? undefined : answers.map((i) => ex.options[i]).join(' + ') });
  }, [sel, locked, answers, ex, onResult]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (locked) return;
      const n = Number(e.key);
      if (n >= 1 && n <= ex.options.length) toggle(perm[n - 1]);
      if (e.key === 'Enter') check();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return (
    <>
      <div className="prompt">
        <Inline text={ex.prompt} />
        {multi && <div className="small muted">Select all that apply.</div>}
      </div>
      <Illustration ex={ex} />
      <div className="options" role={multi ? 'group' : 'radiogroup'}>
        {perm.map((i, k) => {
          const o = ex.options[i];
          const isSel = sel.includes(i);
          let cls = isSel ? 'sel' : '';
          if (locked) cls = answers.includes(i) ? 'right' : isSel ? 'wrong' : '';
          return (
            <button key={i} className={`option ${cls}`} onClick={() => toggle(i)} disabled={locked} aria-pressed={isSel}>
              <span className="key">{k + 1}</span>
              <span>
                <Inline text={o} />
              </span>
            </button>
          );
        })}
      </div>
      {!locked && <CheckBar disabled={!sel.length} onCheck={check} />}
    </>
  );
}

function NumberQ({ ex, locked, onResult }: Props<NumberExercise>) {
  const [val, setVal] = useState('');
  const lo = ex.min ?? ex.answer;
  const hi = ex.max ?? ex.answer;
  const check = () => {
    if (val === '' || locked) return;
    const n = Number(val);
    const correct = n >= lo && n <= hi;
    onResult({ correct, answerText: correct ? undefined : lo === hi ? `${ex.answer}${ex.unit ? ` ${ex.unit}` : ''}` : `${lo}–${hi}${ex.unit ? ` ${ex.unit}` : ''}` });
  };
  const bump = (d: number) => setVal((v) => String(Math.max(0, (Number(v) || 0) + d)));
  return (
    <>
      <div className="prompt">
        <Inline text={ex.prompt} />
      </div>
      <Illustration ex={ex} />
      <div className="numin">
        <input
          id={`num-${ex.id}`}
          type="number"
          inputMode="numeric"
          value={val}
          disabled={locked}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && check()}
          aria-label="Your answer"
          autoFocus
        />
        {ex.unit && <span className="muted">{ex.unit}</span>}
        {!locked && (
          <span className="stepper">
            <button className="btn ghost small" onClick={() => bump(-1)} aria-label="Minus one">
              −
            </button>
            <button className="btn ghost small" onClick={() => bump(1)} aria-label="Plus one">
              +
            </button>
          </span>
        )}
      </div>
      {!locked && <CheckBar disabled={val === ''} onCheck={check} />}
    </>
  );
}

function Order({ ex, locked, onResult }: Props<OrderExercise>) {
  const bank = useMemo(() => {
    let s = shuffle(ex.items.map((t, i) => ({ t, i })));
    if (s.every((x, k) => x.i === k) && s.length > 1) s = [...s.slice(1), s[0]];
    return s;
  }, [ex]);
  const [placed, setPlaced] = useState<number[]>([]);
  const check = () => {
    const correct = placed.every((p, k) => bank[p].i === k);
    onResult({ correct, answerText: correct ? undefined : ex.items.map((t, i) => `${i + 1}. ${t}`).join('  ') });
  };
  return (
    <>
      <div className="prompt">
        <Inline text={ex.prompt} />
      </div>
      <Illustration ex={ex} />
      <div className="slots" aria-label="Your order">
        {placed.length === 0 && <span className="muted small">Tap the steps below in order.</span>}
        {placed.map((p, k) => {
          const ok = locked ? bank[p].i === k : null;
          return (
            <button key={p} className={`chip ${ok === true ? 'right' : ok === false ? 'wrong' : ''}`} disabled={locked} onClick={() => setPlaced(placed.filter((x) => x !== p))}>
              <span className="n">{k + 1}</span>
              <Inline text={bank[p].t} />
            </button>
          );
        })}
      </div>
      <div className="chips">
        {bank.map((b, idx) => (
          <button key={idx} className={`chip ${placed.includes(idx) ? 'used' : ''}`} disabled={locked || placed.includes(idx)} onClick={() => setPlaced([...placed, idx])}>
            <Inline text={b.t} />
          </button>
        ))}
      </div>
      {!locked && <CheckBar disabled={placed.length !== bank.length} onCheck={check} />}
    </>
  );
}

function Match({ ex, locked, onResult }: Props<MatchExercise>) {
  const left = useMemo(() => shuffle(ex.pairs.map((p, i) => ({ t: p[0], i }))), [ex]);
  const right = useMemo(() => shuffle(ex.pairs.map((p, i) => ({ t: p[1], i }))), [ex]);
  const [selL, setSelL] = useState<number | null>(null);
  const [done, setDone] = useState<number[]>([]);
  const [wrong, setWrong] = useState<number | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const pickRight = (i: number) => {
    if (selL === null || locked) return;
    if (i === selL) {
      const nd = [...done, i];
      setDone(nd);
      setSelL(null);
      if (nd.length === ex.pairs.length) onResult({ correct: mistakes === 0, note: mistakes ? `You made ${mistakes} wrong match${mistakes > 1 ? 'es' : ''} along the way.` : undefined });
    } else {
      setWrong(i);
      setMistakes((m) => m + 1);
      window.setTimeout(() => setWrong(null), 500);
    }
  };
  return (
    <>
      <div className="prompt">
        <Inline text={ex.prompt} />
        <div className="small muted">Tap an item on the left, then its match on the right.</div>
      </div>
      <div className="match-grid">
        <div className="match-col">
          {left.map((l) => (
            <button key={l.i} className={`chip ${done.includes(l.i) ? 'matched' : selL === l.i ? 'sel' : ''}`} disabled={done.includes(l.i) || locked} onClick={() => setSelL(l.i)}>
              <Inline text={l.t} />
            </button>
          ))}
        </div>
        <div className="match-col">
          {right.map((r) => (
            <button key={r.i} className={`chip ${done.includes(r.i) ? 'matched' : wrong === r.i ? 'wrong' : ''}`} disabled={done.includes(r.i) || locked} onClick={() => pickRight(r.i)}>
              <Inline text={r.t} />
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

function Sort({ ex, locked, onResult }: Props<SortExercise>) {
  const items = useMemo(() => shuffle(ex.items.map((it, i) => ({ ...it, i }))), [ex]);
  const [where, setWhere] = useState<Record<number, number>>({});
  const [sel, setSel] = useState<number | null>(null);
  const unplaced = items.filter((it) => where[it.i] === undefined);
  const put = (b: number) => {
    if (sel === null || locked) return;
    setWhere({ ...where, [sel]: b });
    const next = unplaced.find((it) => it.i !== sel);
    setSel(next ? next.i : null);
  };
  useEffect(() => {
    if (sel === null && unplaced.length) setSel(unplaced[0].i);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const check = () => {
    const correct = items.every((it) => where[it.i] === it.bucket);
    onResult({ correct });
  };
  return (
    <>
      <div className="prompt">
        <Inline text={ex.prompt} />
        <div className="small muted">Pick an item, then tap the group it belongs to. Tap a placed item to move it back.</div>
      </div>
      <div className="chips">
        {unplaced.map((it) => (
          <button key={it.i} className={`chip ${sel === it.i ? 'sel' : ''}`} onClick={() => setSel(it.i)} disabled={locked}>
            <Inline text={it.text} />
          </button>
        ))}
      </div>
      <div className="buckets">
        {ex.buckets.map((b, bi) => (
          <div key={bi} className={`bucket ${sel !== null ? 'hot' : ''}`} onClick={() => put(bi)} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && put(bi)}>
            <h4>{b}</h4>
            {items
              .filter((it) => where[it.i] === bi)
              .map((it) => (
                <button
                  key={it.i}
                  className={`chip ${locked ? (it.bucket === bi ? 'right' : 'wrong') : ''}`}
                  disabled={locked}
                  onClick={(e) => {
                    e.stopPropagation();
                    const w = { ...where };
                    delete w[it.i];
                    setWhere(w);
                    setSel(it.i);
                  }}
                >
                  <Inline text={it.text} />
                  {locked && it.bucket !== bi && <span className="small"> → {ex.buckets[it.bucket]}</span>}
                </button>
              ))}
          </div>
        ))}
      </div>
      {!locked && <CheckBar disabled={unplaced.length > 0} onCheck={check} />}
    </>
  );
}

function HandQ({ ex, locked, onResult }: Props<HandExercise>) {
  const [sel, setSel] = useState<'keep' | 'mulligan' | null>(null);
  return (
    <>
      <div className="prompt">{ex.prompt || 'Keep this opening hand, or mulligan?'}</div>
      <div className="context">
        <Inline text={ex.context} />
      </div>
      <div className="hand-row">
        {ex.hand.map((c, i) => (
          <CardFace key={i} name={c} size="sm" />
        ))}
      </div>
      <div className="big-choices">
        {(['keep', 'mulligan'] as const).map((k) => {
          let cls = sel === k ? 'sel' : '';
          if (locked) cls = ex.answer === k ? 'right' : sel === k ? 'wrong' : '';
          return (
            <button key={k} className={`option ${cls}`} disabled={locked} onClick={() => setSel(k)} style={{ justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem' }}>
              {k === 'keep' ? '✋ Keep' : '🔄 Mulligan'}
            </button>
          );
        })}
      </div>
      {!locked && <CheckBar disabled={!sel} onCheck={() => onResult({ correct: sel === ex.answer, answerText: sel === ex.answer ? undefined : ex.answer === 'keep' ? 'Keep' : 'Mulligan' })} />}
    </>
  );
}

function Pick({ ex, locked, onResult }: Props<PickExercise>) {
  const answers = Array.isArray(ex.answer) ? ex.answer : [ex.answer];
  const [sel, setSel] = useState<number | null>(null);
  return (
    <>
      <div className="prompt">
        <Inline text={ex.prompt} />
      </div>
      {ex.context && (
        <div className="context">
          <Inline text={ex.context} />
        </div>
      )}
      <div className="cardrow">
        {ex.pack.map((c, i) => {
          let style: React.CSSProperties = {};
          if (sel === i) style = { boxShadow: '0 0 0 4px var(--accent)' };
          if (locked && answers.includes(i)) style = { boxShadow: '0 0 0 4px var(--good)' };
          else if (locked && sel === i) style = { boxShadow: '0 0 0 4px var(--bad)' };
          return (
            <div key={i} style={{ borderRadius: 12, ...style }}>
              <CardFace name={c} size="sm" onClick={locked ? undefined : () => setSel(i)} />
            </div>
          );
        })}
      </div>
      {!locked && (
        <CheckBar
          disabled={sel === null}
          onCheck={() => onResult({ correct: answers.includes(sel!), note: ex.notes?.[sel!], answerText: answers.includes(sel!) ? undefined : answers.map((i) => ex.pack[i]).join(' or ') })}
        />
      )}
    </>
  );
}

function BoardQ({ ex, locked, onResult }: Props<BoardExercise>) {
  const [resetKey, setResetKey] = useState(0);
  const [hint, setHint] = useState(false);
  const [replay, setReplay] = useState<BoardExercise['solution'] | null>(null);
  const [practice, setPractice] = useState<string | null>(null);
  const handleFinish = useCallback(
    (status: 'success' | 'fail') => {
      if (!locked) onResult({ correct: status === 'success', assisted: hint, note: status === 'success' ? undefined : `Solution: ${ex.solutionText}` });
      else setPractice(status === 'success' ? 'Solved on retry. Nice.' : 'Not yet. Try again or watch the solution.');
    },
    [locked, onResult, hint, ex.solutionText],
  );
  const footer = (
    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
      {!locked && !hint && (
        <button className="btn ghost small" onClick={() => setHint(true)}>
          💡 Hint
        </button>
      )}
      {!locked && (
        <button className="btn ghost small" onClick={() => setResetKey((k) => k + 1)}>
          ↺ Reset turn
        </button>
      )}
      {!locked && (
        <button className="btn ghost small" onClick={() => onResult({ correct: false, note: `Solution: ${ex.solutionText}` })}>
          I'm stuck
        </button>
      )}
      {locked && (
        <>
          <button
            className="btn ghost small"
            onClick={() => {
              setReplay(null);
              setPractice(null);
              setResetKey((k) => k + 1);
            }}
          >
            ↺ Try again
          </button>
          <button className="btn ghost small" onClick={() => setReplay([...ex.solution])}>
            ▶ Watch solution
          </button>
        </>
      )}
      {hint && (
        <span className="context small" style={{ flex: '1 1 100%' }}>
          💡 <Inline text={ex.hint} />
        </span>
      )}
      {practice && <span className="small muted">{practice}</span>}
    </div>
  );
  return (
    <>
      <div className="prompt">
        <Inline text={ex.prompt} />
      </div>
      <Board spec={ex.puzzle} goalText={ex.goalText} onFinish={handleFinish} footer={footer} resetKey={resetKey} replay={replay} onReplayDone={() => setReplay(null)} />
    </>
  );
}

export function ExerciseView({ ex, locked, onResult }: Props<Exercise>) {
  switch (ex.type) {
    case 'mc':
      return <MC ex={ex} locked={locked} onResult={onResult} />;
    case 'number':
      return <NumberQ ex={ex} locked={locked} onResult={onResult} />;
    case 'order':
      return <Order ex={ex} locked={locked} onResult={onResult} />;
    case 'match':
      return <Match ex={ex} locked={locked} onResult={onResult} />;
    case 'sort':
      return <Sort ex={ex} locked={locked} onResult={onResult} />;
    case 'hand':
      return <HandQ ex={ex} locked={locked} onResult={onResult} />;
    case 'pick':
      return <Pick ex={ex} locked={locked} onResult={onResult} />;
    case 'board':
      return <BoardQ ex={ex} locked={locked} onResult={onResult} />;
  }
}

export function Explanation({ text }: { text: string }) {
  return <Prose text={text} />;
}
