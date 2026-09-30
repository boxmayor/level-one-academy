import { useMemo, useRef, useState } from 'react';
import { getLesson, unitOf } from '../content';
import { teachCardRow, teachScope } from '../content/mentions';
import { finishLesson } from '../state/actions';
import { useProgress } from '../state/store';
import { Scene } from './Board';
import { CardScope } from './CardRef';
import { CardFace } from './CardView';
import { confetti, sfx } from './effects';
import { navigate } from './router';
import { Session, type SessionResult } from './Session';
import { Prose } from './Text';

export function LessonPlayer({ id }: { id: string }) {
  const lesson = getLesson(id);
  const unit = unitOf(id);
  const progress = useProgress();
  const [phase, setPhase] = useState<'teach' | 'practice' | 'done'>('teach');
  const [step, setStep] = useState(0);
  const [summary, setSummary] = useState<{ xp: number; stars: number; accuracy: number; flawless: boolean; minutes: number } | null>(null);
  const started = useRef(Date.now());
  const items = useMemo(() => lesson?.exercises.map((ex) => ({ id: ex.id!, ex })) ?? [], [lesson]);

  if (!lesson || !unit) {
    return (
      <div className="page">
        <h1>Lesson not found</h1>
        <button className="btn" onClick={() => navigate('/')}>
          Back to the path
        </button>
      </div>
    );
  }
  const done = progress.lessons[lesson.id]?.completed;

  if (phase === 'teach') {
    const t = lesson.teach[step];
    const last = step === lesson.teach.length - 1;
    return (
      <div className="player">
        <div className="player-top">
          <button className="xbtn" onClick={() => navigate('/')} aria-label="Back to the path">
            ✕
          </button>
          <div className="bar accent" aria-label="Lesson intro progress">
            <span style={{ width: `${((step + 1) / (lesson.teach.length + 1)) * 30}%` }} />
          </div>
        </div>
        <div className="eyebrow" style={{ color: unit.color }}>
          {unit.title} · {lesson.title}
        </div>
        <article className="teach">
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', alignItems: 'baseline', flexWrap: 'wrap' }}>
            <h2>{t.title}</h2>
            <span className="small muted">
              {step + 1} / {lesson.teach.length}
            </span>
          </div>
          <CardScope cards={teachScope(t)}>
            <Prose text={t.body} />
          </CardScope>
          {teachCardRow(t).length > 0 && (
            <div className="cardrow">
              {teachCardRow(t).map((c) => (
                <CardFace key={c} name={c} size="sm" />
              ))}
            </div>
          )}
          {t.scene && <Scene you={t.scene.you} opp={t.scene.opp} note={t.scene.note} />}
          {step === 0 && (
            <a className="source-link" href={lesson.source.url} target="_blank" rel="noreferrer">
              Read the original article: “{lesson.source.title}” by Reid Duke ↗
            </a>
          )}
        </article>
        <div className="checkbar">
          {step > 0 && (
            <button className="btn ghost" onClick={() => setStep(step - 1)}>
              Back
            </button>
          )}
          {!last && (
            <button className="linkbtn" onClick={() => setPhase('practice')}>
              {done ? 'Skip to practice' : 'Skip ahead'}
            </button>
          )}
          <button
            className="btn good"
            onClick={() => {
              if (last) {
                setPhase('practice');
                started.current = Date.now();
              } else setStep(step + 1);
            }}
            style={{ minWidth: 150 }}
            autoFocus
          >
            {last ? 'Start practice' : 'Continue'}
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'practice') {
    return (
      <Session
        items={items}
        useHearts
        onQuit={() => navigate('/')}
        onDone={(results: SessionResult[]) => {
          const r = finishLesson({ lessonId: lesson.id, items: results, terms: lesson.terms ?? [] });
          setSummary({ ...r, minutes: Math.max(1, Math.round((Date.now() - started.current) / 60000)) });
          setPhase('done');
          sfx.win();
          confetti();
        }}
      />
    );
  }

  const s = summary!;
  return (
    <div className="player">
      <div className="results">
        <div style={{ fontSize: '3.2rem' }} aria-hidden="true">
          {s.flawless ? '💎' : s.stars === 3 ? '🏆' : s.stars === 2 ? '🎉' : '✅'}
        </div>
        <h1>{s.flawless ? 'Flawless lesson!' : 'Lesson complete!'}</h1>
        <div style={{ fontSize: '1.8rem', letterSpacing: '0.2em' }} aria-label={`${s.stars} of 3 stars`}>
          {[1, 2, 3].map((i) => (
            <span key={i} style={{ opacity: i <= s.stars ? 1 : 0.2 }}>
              ⭐
            </span>
          ))}
        </div>
        <div className="tiles3">
          <div className="tile3" style={{ ['--c' as string]: 'var(--gold)' }}>
            <div className="t3h">Total XP</div>
            <div className="t3v">+{s.xp}</div>
          </div>
          <div className="tile3" style={{ ['--c' as string]: 'var(--good)' }}>
            <div className="t3h">Accuracy</div>
            <div className="t3v">{Math.round(s.accuracy * 100)}%</div>
          </div>
          <div className="tile3" style={{ ['--c' as string]: 'var(--accent)' }}>
            <div className="t3h">Time</div>
            <div className="t3v">{s.minutes} min</div>
          </div>
        </div>
        <div className="panel takeaways">
          <h3>Key takeaways</h3>
          <ul className="prose" style={{ margin: 0 }}>
            {lesson.takeaways.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
          <p className="small muted" style={{ marginBottom: 0 }}>
            The questions from this lesson will come back in <b>Review</b> at growing intervals, so they stick.
          </p>
        </div>
        <button className="btn good" onClick={() => navigate('/')} style={{ minWidth: 200 }} autoFocus>
          Continue
        </button>
      </div>
    </div>
  );
}
