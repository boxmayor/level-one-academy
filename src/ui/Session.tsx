import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { exerciseScope } from '../content/mentions';
import type { Exercise } from '../content/types';
import { loseHeart } from '../state/actions';
import { useProgress } from '../state/store';
import { CardScope } from './CardRef';
import { sfx } from './effects';
import { ExerciseView, type ResultInfo } from './Exercises';
import { navigate } from './router';
import { Inline, Prose } from './Text';

export interface SessionItem {
  id: string;
  ex: Exercise;
  source?: string;
}

export interface SessionResult {
  id: string;
  firstTry: boolean;
}

const PRAISE = ['Nice!', 'Sharp play!', 'Exactly right.', 'Great read!', 'Well played.', 'Correct!'];
const MAX_REQUEUE = 2;

/**
 * Runs a list of exercises Duolingo-style: answer, get feedback, continue.
 * Missed items come back at the end of the session (retrieval until correct).
 */
export function Session({
  items,
  useHearts,
  onDone,
  onQuit,
  header,
}: {
  items: SessionItem[];
  useHearts: boolean;
  onDone: (results: SessionResult[]) => void;
  onQuit: () => void;
  header?: ReactNode;
}) {
  const progress = useProgress();
  const [queue, setQueue] = useState<number[]>(() => items.map((_, i) => i));
  const [pos, setPos] = useState(0);
  const [results, setResults] = useState<Record<string, SessionResult>>({});
  const [requeues, setRequeues] = useState<Record<string, number>>({});
  const [last, setLast] = useState<ResultInfo | null>(null);
  const [streak, setStreak] = useState(0);
  const [outOfHearts, setOutOfHearts] = useState(false);
  const [confirmQuit, setConfirmQuit] = useState(false);
  const [attempt, setAttempt] = useState(0);

  const item = items[queue[pos]];
  const hearts = progress.settings.unlimitedHearts ? Infinity : progress.hearts;

  const handleResult = useCallback(
    (r: ResultInfo) => {
      if (last) return;
      setLast(r);
      setResults((prev) => (prev[item.id] ? prev : { ...prev, [item.id]: { id: item.id, firstTry: r.correct && !r.assisted } }));
      if (r.correct) {
        sfx.good();
        setStreak((s) => s + 1);
      } else {
        sfx.bad();
        setStreak(0);
        if ((requeues[item.id] ?? 0) < MAX_REQUEUE) {
          setQueue((q) => [...q, queue[pos]]);
          setRequeues((rq) => ({ ...rq, [item.id]: (rq[item.id] ?? 0) + 1 }));
        }
        if (useHearts) {
          const left = loseHeart();
          if (left <= 0) setOutOfHearts(true);
        }
      }
    },
    [last, item, requeues, queue, pos, useHearts],
  );

  const next = useCallback(() => {
    if (!last) return;
    if (pos + 1 >= queue.length) {
      onDone(items.map((it) => results[it.id] ?? { id: it.id, firstTry: false }));
      return;
    }
    setPos(pos + 1);
    setLast(null);
    setAttempt((a) => a + 1);
  }, [last, pos, queue.length, onDone, items, results]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && last && !outOfHearts) {
        e.preventDefault();
        next();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [last, next, outOfHearts]);

  const scope = useMemo(() => exerciseScope(item.ex), [item.ex]);
  const pct = Math.round(((pos + (last ? 1 : 0)) / queue.length) * 100);
  const isRetry = pos >= items.length;

  return (
    <div className="player">
      <div className="player-top">
        <button className="xbtn" onClick={() => setConfirmQuit(true)} aria-label="Quit">
          ✕
        </button>
        <div className="bar" aria-label={`Progress ${pct}%`}>
          <span style={{ width: `${pct}%` }} />
        </div>
        {useHearts && (
          <span className="stat heart" title="Hearts">
            ❤️ <span className="num">{hearts === Infinity ? '∞' : hearts}</span>
          </span>
        )}
      </div>
      {header}
      {streak >= 3 && !last && <div className="pill gold" style={{ justifySelf: 'start', width: 'fit-content' }}>🔥 {streak} in a row</div>}
      {isRetry && !last && <div className="pill dim" style={{ width: 'fit-content' }}>↺ Second chance: you missed this one earlier</div>}
      {item.source && <div className="eyebrow">{item.source}</div>}
      <CardScope cards={scope}>
        <ExerciseView key={`${item.id}-${attempt}`} ex={item.ex} locked={!!last} onResult={handleResult} />

        {last && (
          <div className={`feedback ${last.correct ? 'good' : 'bad'}`} role="status">
            <h3>{last.correct ? PRAISE[(pos + item.id.length) % PRAISE.length] : 'Not quite.'}</h3>
            {last.assisted && last.correct && <div className="small">Solved with a hint — it will come back for review soon.</div>}
            {!last.correct && last.answerText && (
              <div>
                <b>Correct answer:</b> <Inline text={last.answerText} />
              </div>
            )}
            {last.note && (
              <div className="small">
                <Inline text={last.note} />
              </div>
            )}
            <Prose text={item.ex.explain} />
            <div className="row">
              <button className={`btn ${last.correct ? 'good' : 'bad'}`} onClick={next} autoFocus>
                Continue
              </button>
            </div>
          </div>
        )}
      </CardScope>

      {outOfHearts && (
        <div className="overlay">
          <div className="modal" role="dialog" aria-label="Out of hearts">
            <h2>💔 You're out of hearts</h2>
            <p className="muted" style={{ margin: 0 }}>
              Hearts come back over time (one every 30 minutes). A review session refills them all — and reviewing is how you remember what you've learned.
            </p>
            <button className="btn good" onClick={() => navigate('/review')}>
              Review to refill hearts
            </button>
            <button className="btn ghost" onClick={onQuit}>
              Quit lesson
            </button>
          </div>
        </div>
      )}
      {confirmQuit && (
        <div className="overlay" onClick={() => setConfirmQuit(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Quit?">
            <h2>Quit this session?</h2>
            <p className="muted" style={{ margin: 0 }}>
              Your progress in this session will be lost.
            </p>
            <button className="btn" onClick={() => setConfirmQuit(false)}>
              Keep learning
            </button>
            <button className="btn ghost" onClick={onQuit}>
              Quit
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
