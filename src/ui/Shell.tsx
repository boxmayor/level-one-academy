import type { ReactNode } from 'react';
import { COURSE_LESSONS, PUZZLES } from '../content';
import { dayKey, dueIds, levelInfo, msToNextHeart, visibleStreak } from '../state/progress';
import { useProgress } from '../state/store';
import { currentLesson } from './Home';
import { Link, useRoute } from './router';

export function BrandMark() {
  // Five mana-colored arcs around a card: the app's mark.
  const colors = ['var(--mana-w)', 'var(--mana-u)', 'var(--mana-b)', 'var(--mana-r)', 'var(--mana-g)'];
  return (
    <svg className="brand-mark" viewBox="0 0 40 40" aria-hidden="true">
      {colors.map((c, i) => {
        const a0 = (i / 5) * Math.PI * 2 - Math.PI / 2 + 0.12;
        const a1 = ((i + 1) / 5) * Math.PI * 2 - Math.PI / 2 - 0.12;
        const r = 18;
        const p = (a: number) => `${20 + r * Math.cos(a)} ${20 + r * Math.sin(a)}`;
        return <path key={i} d={`M ${p(a0)} A ${r} ${r} 0 0 1 ${p(a1)}`} stroke={c} strokeWidth="4" fill="none" strokeLinecap="round" />;
      })}
      <rect x="13" y="10" width="14" height="20" rx="2.5" fill="var(--accent)" />
      <text x="20" y="24" textAnchor="middle" fontSize="11" fontWeight="700" fill="#fff" fontFamily="var(--font-display)">
        1
      </text>
    </svg>
  );
}

const NAV = [
  { to: '/', icon: '🗺️', label: 'Learn' },
  { to: '/review', icon: '🧠', label: 'Review' },
  { to: '/puzzles', icon: '🧩', label: 'Puzzles' },
  { to: '/glossary', icon: '📖', label: 'Glossary' },
  { to: '/profile', icon: '👤', label: 'Profile' },
];

function useStats() {
  const p = useProgress();
  const today = dayKey();
  return {
    p,
    streak: visibleStreak(p, today),
    todayXp: p.xpByDay[today] ?? 0,
    due: dueIds(p, today).length,
    lvl: levelInfo(p.xp),
  };
}

function StatsRow() {
  const { p, streak } = useStats();
  const hearts = p.settings.unlimitedHearts ? '∞' : p.hearts;
  return (
    <div className="stats-row">
      <span className={`stat flame ${streak ? '' : 'off'}`} title={`${streak}-day streak`}>
        🔥 <span className="num">{streak}</span>
      </span>
      <span className="stat xp" title="Total XP">
        ✨ <span className="num">{p.xp}</span>
      </span>
      <span className="stat heart" title="Hearts">
        ❤️ <span className="num">{hearts}</span>
      </span>
    </div>
  );
}

function Rail() {
  const { p, streak, todayXp, due, lvl } = useStats();
  const goalPct = Math.min(100, Math.round((todayXp / p.dailyGoal) * 100));
  const done = COURSE_LESSONS.filter((l) => p.lessons[l.id]?.completed).length;
  const next = currentLesson(p);
  const nextHeart = msToNextHeart(p);
  return (
    <aside className="rail" aria-label="Your progress">
      <div className="panel">
        <StatsRow />
      </div>
      <div className="panel">
        <div className="eyebrow">Level {lvl.level}</div>
        <h3 style={{ marginBottom: '0.4rem' }}>{lvl.title}</h3>
        <div className="bar" aria-label="Progress to next level">
          <span style={{ width: `${(lvl.into / lvl.span) * 100}%` }} />
        </div>
        <div className="small muted" style={{ marginTop: '0.3rem' }}>
          {lvl.span - lvl.into} XP to level {lvl.level + 1}
        </div>
      </div>
      <div className="panel">
        <h3>Daily goal</h3>
        <div className="bar good" aria-label="Daily goal progress">
          <span style={{ width: `${goalPct}%` }} />
        </div>
        <div className="small muted" style={{ marginTop: '0.3rem' }}>
          {todayXp} / {p.dailyGoal} XP today {goalPct >= 100 ? '— goal reached! 🎯' : ''}
        </div>
        <div className="small muted" style={{ marginTop: '0.3rem' }}>
          {streak ? `🔥 ${streak}-day streak. Earn XP tomorrow to keep it.` : 'Earn XP today to start a streak.'}
        </div>
      </div>
      <div className="quick">
        {next && (
          <Link to={`/lesson/${next.id}`}>
            <span className="qi">{next.icon}</span>
            <span>
              <b>Continue: {next.title}</b>
              <span className="small muted">
                Course progress {done}/{COURSE_LESSONS.length}
              </span>
            </span>
          </Link>
        )}
        <Link to="/review">
          <span className="qi">🧠</span>
          <span>
            <b>Review</b>
            <span className="small muted">{due ? `${due} item${due > 1 ? 's' : ''} due` : 'Nothing due — practice anyway'}</span>
          </span>
        </Link>
        <Link to="/puzzles/daily">
          <span className="qi">📅</span>
          <span>
            <b>Daily puzzle</b>
            <span className="small muted">{p.dailyPuzzleDay === dayKey() ? 'Done today ✔' : 'A new board every day'}</span>
          </span>
        </Link>
        <Link to="/puzzles/rush">
          <span className="qi">⚡</span>
          <span>
            <b>Puzzle Rush</b>
            <span className="small muted">Best: {p.rushBest}</span>
          </span>
        </Link>
      </div>
      {p.hearts < 5 && !p.settings.unlimitedHearts && (
        <p className="small muted" style={{ margin: 0 }}>
          ❤️ Next heart in {Math.ceil(nextHeart / 60000)} min, or refill by reviewing.
        </p>
      )}
      <p className="small muted" style={{ margin: 0 }}>
        {PUZZLES.length} board puzzles · {COURSE_LESSONS.length} lessons from Reid Duke's Level One course.
      </p>
    </aside>
  );
}

export function Shell({ children, focus }: { children: ReactNode; focus?: boolean }) {
  const route = useRoute();
  const { due } = useStats();
  const active = (to: string) => (to === '/' ? route === '/' : route.startsWith(to));
  if (focus) return <main className="main" style={{ padding: '1rem 16px 2rem' }}>{children}</main>;
  return (
    <div className="shell">
      <nav className="sidenav" aria-label="Main">
        <div className="brand">
          <BrandMark />
          <span>
            Level One
            <small>Academy</small>
          </span>
        </div>
        {NAV.map((n) => (
          <Link key={n.to} to={n.to} className={`navlink ${active(n.to) ? 'active' : ''}`} aria-current={active(n.to) ? 'page' : undefined}>
            <span className="ico" aria-hidden="true">
              {n.icon}
            </span>
            {n.label}
            {n.to === '/review' && due > 0 && <span className="badge num">{due}</span>}
          </Link>
        ))}
      </nav>
      <div style={{ minWidth: 0 }}>
        <header className="topbar">
          <div className="brand" style={{ padding: 0, fontSize: '1.05rem' }}>
            <BrandMark />
          </div>
          <StatsRow />
        </header>
        <main className="main">{children}</main>
      </div>
      <Rail />
      <nav className="bottomnav" aria-label="Main">
        {NAV.map((n) => (
          <Link key={n.to} to={n.to} className={active(n.to) ? 'active' : ''} aria-current={active(n.to) ? 'page' : undefined}>
            <span aria-hidden="true">{n.icon}</span>
            <span>{n.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
