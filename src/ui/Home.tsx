import { useEffect, useRef, useState } from 'react';
import { COURSE_LESSONS, UNITS } from '../content';
import type { Lesson, Unit } from '../content/types';
import { useProgress } from '../state/store';
import type { Progress } from '../state/progress';
import { navigate } from './router';

const OFFSETS = [0, 52, 78, 52, 0, -52, -78, -52];

export function lessonUnlocked(p: Progress, lessonId: string): boolean {
  if (p.settings.unlockAll) return true;
  const unit = UNITS.find((u) => u.lessons.some((l) => l.id === lessonId));
  if (!unit) return false;
  if (unit.optional) {
    const i = unit.lessons.findIndex((l) => l.id === lessonId);
    return i === 0 || !!p.lessons[unit.lessons[i - 1].id]?.completed;
  }
  const idx = COURSE_LESSONS.findIndex((l) => l.id === lessonId);
  return COURSE_LESSONS.slice(0, idx).every((l) => p.lessons[l.id]?.completed);
}

/** The next lesson to study: first unlocked, unfinished lesson of the course. */
export function currentLesson(p: Progress): Lesson | undefined {
  const tutorial = UNITS.find((u) => u.optional);
  const tutorialStarted = p.tutorialFirst || p.lessons['board-turn']?.completed;
  const wantsTutorial = tutorialStarted && tutorial?.lessons.some((l) => !p.lessons[l.id]?.completed);
  if (wantsTutorial) return tutorial!.lessons.find((l) => !p.lessons[l.id]?.completed);
  return COURSE_LESSONS.find((l) => !p.lessons[l.id]?.completed && lessonUnlocked(p, l.id));
}

export function Home() {
  const p = useProgress();
  const current = currentLesson(p);
  const [open, setOpen] = useState<string | null>(null);
  const curRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    curRef.current?.scrollIntoView({ block: 'center' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const close = () => setOpen(null);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, []);

  return (
    <div className="path">
      {UNITS.map((u, ui) => (
        <UnitSection key={u.id} unit={u} unitIndex={ui} p={p} current={current} open={open} setOpen={setOpen} curRef={curRef} />
      ))}
      <div className="panel" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '2rem' }} aria-hidden="true">
          🌟
        </div>
        <h3>Level One Graduate</h3>
        <p className="muted small" style={{ margin: 0 }}>
          Finish every lesson to complete the course. Keep your skills sharp with Review and the Puzzle Trainer.
        </p>
      </div>
    </div>
  );
}

function UnitSection({
  unit,
  unitIndex,
  p,
  current,
  open,
  setOpen,
  curRef,
}: {
  unit: Unit;
  unitIndex: number;
  p: Progress;
  current?: Lesson;
  open: string | null;
  setOpen: (id: string | null) => void;
  curRef: React.RefObject<HTMLDivElement | null>;
}) {
  const doneCount = unit.lessons.filter((l) => p.lessons[l.id]?.completed).length;
  return (
    <section aria-label={unit.title}>
      <div className="unit-banner" style={{ background: unit.color }}>
        <div style={{ minWidth: 0 }}>
          <div className="eyebrow">{unit.optional ? 'Warm-up · optional' : `Unit ${unitIndex}`}</div>
          <h2>{unit.title}</h2>
          <p>{unit.subtitle}</p>
        </div>
        <span className="unit-count num">
          {doneCount}/{unit.lessons.length}
        </span>
      </div>
      <div className="nodes">
        {unit.lessons.map((l, i) => {
          const prog = p.lessons[l.id];
          const unlocked = lessonUnlocked(p, l.id);
          const isCur = current?.id === l.id;
          const state = prog?.completed ? 'done' : unlocked ? 'open' : 'locked';
          return (
            <div
              key={l.id}
              className="node-wrap"
              // The transform makes each node its own stacking context, so the open node must be raised
              // above its siblings for its popover to cover them (kept below the sticky top and bottom bars).
              style={{ transform: `translateX(${OFFSETS[i % OFFSETS.length]}px)`, zIndex: open === l.id ? 10 : undefined }}
              ref={isCur ? curRef : undefined}
              onClick={(e) => e.stopPropagation()}
            >
              {isCur && open !== l.id && <div className="start-tip">START</div>}
              <button
                className={`node ${state === 'done' ? 'done' : state === 'locked' ? 'locked' : ''}`}
                style={state === 'open' ? ({ ['--node' as string]: unit.color, ['--node-press' as string]: 'rgba(0,0,0,0.35)' } as React.CSSProperties) : undefined}
                onClick={() => setOpen(open === l.id ? null : l.id)}
                aria-label={`${l.title}${state === 'done' ? ', completed' : state === 'locked' ? ', locked' : ''}`}
                aria-expanded={open === l.id}
              >
                {isCur && <span className="node-ring" style={{ ['--node' as string]: unit.color } as React.CSSProperties} />}
                <span aria-hidden="true">{state === 'locked' ? '🔒' : l.icon}</span>
              </button>
              <div className="node-stars" aria-hidden="true">
                {prog?.completed &&
                  [1, 2, 3].map((s) => (
                    <span key={s} className={s <= prog.stars ? '' : 'off'}>
                      ⭐
                    </span>
                  ))}
              </div>
              <div className="node-label">{l.title}</div>
              {open === l.id && (
                <div className="popover" role="dialog" aria-label={l.title}>
                  <div className="eyebrow" style={{ color: unit.color }}>
                    {unit.title}
                  </div>
                  <h3>{l.title}</h3>
                  <p className="small muted" style={{ margin: 0 }}>
                    {l.teach.length} short ideas · {l.exercises.length} exercises
                    {l.exercises.some((e) => e.type === 'board') ? ` · ${l.exercises.filter((e) => e.type === 'board').length} board puzzle${l.exercises.filter((e) => e.type === 'board').length > 1 ? 's' : ''}` : ''}
                  </p>
                  {state === 'locked' ? (
                    <p className="small" style={{ margin: 0 }}>
                      🔒 Finish the lessons before this one to unlock it. (You can unlock everything in Profile → Settings.)
                    </p>
                  ) : (
                    <button className={`btn ${state === 'done' ? 'gold' : 'good'} wide`} onClick={() => navigate(`/lesson/${l.id}`)}>
                      {state === 'done' ? 'Practice again (+XP)' : 'Start lesson'}
                    </button>
                  )}
                  <a className="source-link" href={l.source.url} target="_blank" rel="noreferrer">
                    Original article ↗
                  </a>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
