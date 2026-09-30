import { useState } from 'react';
import { COURSE_LESSONS } from '../content';
import { ACHIEVEMENTS } from '../state/actions';
import { addDays, dayKey, levelInfo, visibleStreak, type Settings } from '../state/progress';
import { exportProgress, importProgress, resetProgress, updateProgress, useProgress } from '../state/store';

function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return <button className={`toggle ${on ? 'on' : ''}`} onClick={() => onChange(!on)} role="switch" aria-checked={on} aria-label={label} />;
}

export function Profile() {
  const p = useProgress();
  const lvl = levelInfo(p.xp);
  const today = dayKey();
  const done = COURSE_LESSONS.filter((l) => p.lessons[l.id]?.completed);
  const avgAcc = done.length ? done.reduce((s, l) => s + (p.lessons[l.id]?.bestAccuracy ?? 0), 0) / done.length : 0;
  const days = Array.from({ length: 28 }, (_, i) => addDays(today, i - 27));
  const [confirmReset, setConfirmReset] = useState(false);
  const [importText, setImportText] = useState('');
  const [msg, setMsg] = useState<string | null>(null);

  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => updateProgress((pp) => void (pp.settings[k] = v));

  return (
    <div className="page">
      <div className="page-head">
        <div className="eyebrow">Level {lvl.level}</div>
        <h1>{lvl.title}</h1>
        <p>
          {p.xp} XP total · {lvl.span - lvl.into} XP to the next level
        </p>
      </div>
      <div className="tiles3" style={{ width: '100%', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))' }}>
        <div className="tile3" style={{ ['--c' as string]: 'var(--flame)' }}>
          <div className="t3h">Streak</div>
          <div className="t3v num">{visibleStreak(p)} 🔥</div>
        </div>
        <div className="tile3" style={{ ['--c' as string]: 'var(--good)' }}>
          <div className="t3h">Lessons</div>
          <div className="t3v num">
            {done.length}/{COURSE_LESSONS.length}
          </div>
        </div>
        <div className="tile3" style={{ ['--c' as string]: 'var(--accent)' }}>
          <div className="t3h">Puzzle rating</div>
          <div className="t3v num">{p.puzzleRating}</div>
        </div>
        <div className="tile3" style={{ ['--c' as string]: 'var(--gold)' }}>
          <div className="t3h">Accuracy</div>
          <div className="t3v num">{Math.round(avgAcc * 100)}%</div>
        </div>
      </div>

      <div className="panel">
        <h3>Last 4 weeks</h3>
        <div className="heatmap" aria-label="XP earned per day">
          {days.map((d) => {
            const xp = p.xpByDay[d] ?? 0;
            const lvlCls = xp === 0 ? '' : xp < p.dailyGoal / 2 ? 'l1' : xp < p.dailyGoal ? 'l2' : 'l3';
            return <span key={d} className={lvlCls} title={`${d}: ${xp} XP`} />;
          })}
        </div>
        <p className="small muted" style={{ marginBottom: 0 }}>
          Longest streak: {p.longestStreak} days · Reviews done: {p.reviewsDone} · Rush best: {p.rushBest}
        </p>
      </div>

      <div className="panel">
        <h3>Achievements</h3>
        <div className="ach-grid">
          {ACHIEVEMENTS.map((a) => {
            const got = p.achievements[a.id];
            return (
              <div key={a.id} className={`ach ${got ? '' : 'locked'}`}>
                <span className="ai" aria-hidden="true">
                  {a.icon}
                </span>
                <b>{a.title}</b>
                <span className="small muted">{a.desc}</span>
                {got && <span className="small" style={{ color: 'var(--good)' }}>Earned {got}</span>}
              </div>
            );
          })}
        </div>
      </div>

      <div className="panel">
        <h3>Settings</h3>
        <div className="settings-row">
          <span>
            <b>Daily goal</b>
            <div className="small muted">XP per day for the goal bar.</div>
          </span>
          <select id="daily-goal" value={p.dailyGoal} onChange={(e) => updateProgress((pp) => void (pp.dailyGoal = Number(e.target.value)))} className="search" style={{ width: 'auto' }}>
            <option value={20}>Casual · 20</option>
            <option value={30}>Regular · 30</option>
            <option value={50}>Serious · 50</option>
            <option value={100}>Intense · 100</option>
          </select>
        </div>
        <div className="settings-row">
          <span>
            <b>Theme</b>
          </span>
          <select id="theme" value={p.settings.theme} onChange={(e) => set('theme', e.target.value as Settings['theme'])} className="search" style={{ width: 'auto' }}>
            <option value="system">Match system</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>
        <div className="settings-row">
          <span>
            <b>Sound effects</b>
          </span>
          <Toggle on={p.settings.sound} onChange={(v) => set('sound', v)} label="Sound effects" />
        </div>
        <div className="settings-row">
          <span>
            <b>Unlimited hearts</b>
            <div className="small muted">Mistakes in lessons no longer cost hearts.</div>
          </span>
          <Toggle on={p.settings.unlimitedHearts} onChange={(v) => set('unlimitedHearts', v)} label="Unlimited hearts" />
        </div>
        <div className="settings-row">
          <span>
            <b>Unlock all lessons</b>
            <div className="small muted">For experienced players who want to jump around.</div>
          </span>
          <Toggle on={p.settings.unlockAll} onChange={(v) => set('unlockAll', v)} label="Unlock all lessons" />
        </div>
      </div>

      <div className="panel">
        <h3>Your data</h3>
        <p className="small muted" style={{ marginTop: 0 }}>
          Progress is saved in this browser only. Copy it to move it to another browser.
        </p>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            className="btn ghost small"
            onClick={() => {
              navigator.clipboard?.writeText(exportProgress()).then(
                () => setMsg('Progress copied to the clipboard.'),
                () => {
                  setImportText(exportProgress());
                  setMsg('Copy the text below.');
                },
              );
            }}
          >
            Copy progress
          </button>
          <button className="btn bad small" onClick={() => setConfirmReset(true)}>
            Reset progress
          </button>
        </div>
        <textarea
          id="import-progress"
          className="search"
          rows={3}
          placeholder="Paste copied progress here to import it…"
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
          style={{ marginTop: '0.6rem', fontFamily: 'monospace', fontSize: '0.75rem' }}
        />
        <button className="btn small" style={{ marginTop: '0.4rem' }} disabled={!importText.trim()} onClick={() => setMsg(importProgress(importText) ? 'Progress imported.' : 'That text isn\'t valid progress data.')}>
          Import
        </button>
        {msg && <p className="small">{msg}</p>}
        {confirmReset && (
          <div className="context" style={{ marginTop: '0.6rem' }}>
            <p style={{ marginTop: 0 }}>This deletes all XP, lessons, reviews and ratings in this browser. Continue?</p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                className="btn bad small"
                onClick={() => {
                  resetProgress();
                  setConfirmReset(false);
                  setMsg('Progress reset.');
                }}
              >
                Yes, reset
              </button>
              <button className="btn ghost small" onClick={() => setConfirmReset(false)}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      <p className="small muted">
        Lessons are based on Reid Duke's{' '}
        <a href="https://magic.wizards.com/en/news/feature/level-one-full-course-2015-10-05" target="_blank" rel="noreferrer">
          Level One
        </a>{' '}
        course on the Magic: The Gathering website. This is an unofficial study companion; the cards in the puzzles are original, simplified designs.
      </p>
    </div>
  );
}
