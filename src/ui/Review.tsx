import { useMemo, useState } from 'react';
import { GLOSSARY_TERMS, glossaryExercise, reviewExercise, reviewSource } from '../content';
import { finishReview } from '../state/actions';
import { dayKey, dueIds, reviewQueue } from '../state/progress';
import { getProgress, useProgress } from '../state/store';
import { confetti, sfx } from './effects';
import { Link, navigate } from './router';
import { Session, type SessionItem } from './Session';

const SESSION_SIZE = 10;

export function Review({ mode = 'srs' }: { mode?: 'srs' | 'glossary' }) {
  const p = useProgress();
  const [running, setRunning] = useState(false);
  const [items, setItems] = useState<SessionItem[]>([]);
  const [summary, setSummary] = useState<{ xp: number; right: number; total: number } | null>(null);
  const due = dueIds(p, dayKey()).length;
  const total = Object.keys(p.srs).length;
  const boxes = useMemo(() => {
    const b = [0, 0, 0, 0, 0, 0];
    for (const it of Object.values(p.srs)) b[it.box]++;
    return b;
  }, [p.srs]);

  function start() {
    let list: SessionItem[];
    if (mode === 'glossary') {
      const terms = [...GLOSSARY_TERMS].sort(() => Math.random() - 0.5).slice(0, SESSION_SIZE);
      list = terms.map((t) => ({ id: `g:${t}`, ex: glossaryExercise(t), source: 'Glossary' }));
    } else {
      const ids = reviewQueue(getProgress(), SESSION_SIZE);
      list = ids.flatMap((id) => {
        const ex = reviewExercise(id);
        return ex ? [{ id, ex, source: reviewSource(id) }] : [];
      });
    }
    setItems(list);
    setSummary(null);
    setRunning(true);
  }

  if (running) {
    return (
      <Session
        items={items}
        useHearts={false}
        onQuit={() => setRunning(false)}
        onDone={(results) => {
          const r = finishReview(results);
          setSummary(r);
          setRunning(false);
          sfx.win();
          confetti(1200);
        }}
      />
    );
  }

  return (
    <div className="page">
      <div className="page-head">
        <h1>{mode === 'glossary' ? 'Glossary practice' : 'Review'}</h1>
        <p>
          {mode === 'glossary'
            ? 'Ten quick questions on the course vocabulary.'
            : 'Questions from lessons you finished come back at growing intervals — 1, 3, 7, 16 and 35 days — and sooner when you miss them. Mixing topics like this is how knowledge sticks.'}
        </p>
      </div>
      {summary && (
        <div className="result success">
          <span>
            Review done: {summary.right}/{summary.total} right on the first try. +{summary.xp} XP, hearts refilled.
          </span>
        </div>
      )}
      {mode === 'srs' && total === 0 ? (
        <div className="panel">
          <h3>Nothing to review yet</h3>
          <p className="muted">Finish a lesson first. Its questions will come back here so you remember them long-term.</p>
          <button className="btn good" onClick={() => navigate('/')}>
            Go to the learning path
          </button>
        </div>
      ) : (
        <div className="grid2">
          <div className="modecard">
            <div className="mc-ico" aria-hidden="true">
              {mode === 'glossary' ? '📖' : '🧠'}
            </div>
            <h3>{mode === 'glossary' ? 'Vocabulary drill' : due ? `${due} item${due > 1 ? 's' : ''} due` : 'All caught up'}</h3>
            <p>{mode === 'glossary' ? 'Match terms and definitions.' : due ? 'Clear your due items to keep them fresh.' : 'Nothing is due, but extra practice on your weakest items still helps.'}</p>
            <button className="btn good" onClick={start}>
              Start {mode === 'glossary' ? 'drill' : 'review'}
            </button>
          </div>
          {mode === 'srs' && (
            <div className="modecard">
              <div className="mc-ico" aria-hidden="true">
                📦
              </div>
              <h3>Memory strength</h3>
              <p>{total} items learned. Each correct review moves an item up a box; a miss sends it back to box 0.</p>
              <div style={{ display: 'grid', gap: '0.3rem' }}>
                {boxes.map((n, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '4.5rem 1fr 2rem', gap: '0.5rem', alignItems: 'center' }} className="small">
                    <span className="muted">Box {i}</span>
                    <div className="bar accent" style={{ height: 10 }}>
                      <span style={{ width: `${total ? (n / total) * 100 : 0}%` }} />
                    </div>
                    <span className="num">{n}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {mode === 'srs' && (
            <div className="modecard">
              <div className="mc-ico" aria-hidden="true">
                📖
              </div>
              <h3>Vocabulary</h3>
              <p>Drill the course glossary terms.</p>
              <Link to="/glossary" className="btn ghost">
                Open glossary
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
