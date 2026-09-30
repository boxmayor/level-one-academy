import { useEffect, useState } from 'react';
import type { Achievement } from './state/progress';
import { onAchievement } from './state/actions';
import { updateProgress, useProgress } from './state/store';
import { Glossary } from './ui/Glossary';
import { Home } from './ui/Home';
import { LessonPlayer } from './ui/LessonPlayer';
import { Profile } from './ui/Profile';
import { DailyPuzzle, PuzzleHub, PuzzleTrainer, Rush } from './ui/Puzzles';
import { Review } from './ui/Review';
import { navigate, useRoute } from './ui/router';
import { BrandMark, Shell } from './ui/Shell';

function Onboarding() {
  const [goal, setGoal] = useState(30);
  const finish = (newPlayer: boolean) => {
    updateProgress((p) => {
      p.onboarded = true;
      p.dailyGoal = goal;
      p.tutorialFirst = newPlayer;
    });
    navigate(newPlayer ? '/lesson/board-turn' : '/');
  };
  return (
    <div className="overlay">
      <div className="modal" role="dialog" aria-label="Welcome">
        <div style={{ display: 'flex', gap: '0.7rem', alignItems: 'center' }}>
          <BrandMark />
          <h2>Welcome to Level One Academy</h2>
        </div>
        <p style={{ margin: 0 }}>
          Reid Duke's <b>Level One</b> course, turned into short lessons, board puzzles and spaced review. Each lesson teaches one idea from the course; the puzzles make you use it on a real board, like chess tactics.
        </p>
        <div>
          <div className="eyebrow" style={{ marginBottom: '0.4rem' }}>
            Daily goal
          </div>
          <div className="chips">
            {[
              [20, 'Casual'],
              [30, 'Regular'],
              [50, 'Serious'],
              [100, 'Intense'],
            ].map(([v, l]) => (
              <button key={v} className={`chip ${goal === v ? 'sel' : ''}`} onClick={() => setGoal(v as number)}>
                {l} · {v} XP
              </button>
            ))}
          </div>
        </div>
        <div className="eyebrow">Do you know the basic rules of Magic?</div>
        <button className="btn good" onClick={() => finish(false)}>
          Yes — start the course
        </button>
        <button className="btn ghost" onClick={() => finish(true)}>
          I'm new — show me the board first
        </button>
      </div>
    </div>
  );
}

function AchievementToast() {
  const [queue, setQueue] = useState<Achievement[]>([]);
  useEffect(() => onAchievement((x) => setQueue((q) => [...q, x])), []);
  useEffect(() => {
    if (!queue.length) return;
    const t = window.setTimeout(() => setQueue((q) => q.slice(1)), 3200);
    return () => window.clearTimeout(t);
  }, [queue]);
  const a = queue[0];
  if (!a) return null;
  return (
    <div className="toast" role="status" key={a.id}>
      <span style={{ fontSize: '1.8rem' }} aria-hidden="true">
        {a.icon}
      </span>
      <span>
        <b>Achievement unlocked: {a.title}</b>
        <div className="small muted">{a.desc}</div>
      </span>
    </div>
  );
}

export function App() {
  const route = useRoute();
  const p = useProgress();

  useEffect(() => {
    const t = p.settings.theme;
    try {
      if (t === 'system') document.documentElement.removeAttribute('data-theme');
      else document.documentElement.setAttribute('data-theme', t);
    } catch {
      // ignore
    }
  }, [p.settings.theme]);

  const parts = route.split('/').filter(Boolean);
  let page: React.ReactNode;
  let focus = false;
  if (parts[0] === 'lesson' && parts[1]) {
    page = <LessonPlayer key={parts[1]} id={parts[1]} />;
    focus = true;
  } else if (parts[0] === 'review') page = <Review key={parts[1] ?? 'srs'} mode={parts[1] === 'glossary' ? 'glossary' : 'srs'} />;
  else if (parts[0] === 'puzzles' && parts[1] === 'train') page = <PuzzleTrainer key={parts[2] ?? 'all'} theme={parts[2] ? decodeURIComponent(parts[2]) : undefined} />;
  else if (parts[0] === 'puzzles' && parts[1] === 'p' && parts[2]) page = <PuzzleTrainer key={parts[2]} fixedId={decodeURIComponent(parts[2])} />;
  else if (parts[0] === 'puzzles' && parts[1] === 'rush') page = <Rush />;
  else if (parts[0] === 'puzzles' && parts[1] === 'daily') page = <DailyPuzzle />;
  else if (parts[0] === 'puzzles') page = <PuzzleHub />;
  else if (parts[0] === 'glossary') page = <Glossary />;
  else if (parts[0] === 'profile') page = <Profile />;
  else page = <Home />;

  return (
    <>
      <Shell focus={focus}>{page}</Shell>
      {!p.onboarded && <Onboarding />}
      <AchievementToast />
    </>
  );
}
