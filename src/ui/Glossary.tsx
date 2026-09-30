import { useMemo, useState } from 'react';
import { GLOSSARY, GLOSSARY_TERMS, getLesson, TERM_LESSON } from '../content';
import { useProgress } from '../state/store';
import { Link, navigate } from './router';

export function Glossary() {
  const p = useProgress();
  const [q, setQ] = useState('');
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return GLOSSARY_TERMS.filter((t) => !s || t.toLowerCase().includes(s) || GLOSSARY[t].toLowerCase().includes(s));
  }, [q]);
  const learned = GLOSSARY_TERMS.filter((t) => (p.srs[`g:${t}`]?.box ?? -1) >= 2).length;
  return (
    <div className="page">
      <div className="page-head" style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div>
          <h1>Glossary</h1>
          <p>
            The vocabulary of the Level One course. Terms join your review queue when a lesson teaches them. {learned} of {GLOSSARY_TERMS.length} well learned.
          </p>
        </div>
        <button className="btn good" onClick={() => navigate('/review/glossary')}>
          📖 Practice terms
        </button>
      </div>
      <input id="glossary-search" className="search" placeholder="Search terms and definitions…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search the glossary" />
      <div className="gloss-list">
        {list.map((t) => {
          const it = p.srs[`g:${t}`];
          const lessonId = TERM_LESSON[t];
          const lesson = lessonId ? getLesson(lessonId) : undefined;
          return (
            <div key={t} className="gloss-item">
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', alignItems: 'baseline', flexWrap: 'wrap' }}>
                <b>{t}</b>
                {it ? it.box >= 2 ? <span className="pill good">Learned</span> : <span className="pill gold">In review</span> : <span className="pill dim">New</span>}
              </div>
              <div className="def">{GLOSSARY[t]}</div>
              {lesson && (
                <div className="small muted">
                  Taught in <Link to={`/lesson/${lesson.id}`}>{lesson.title}</Link>
                </div>
              )}
            </div>
          );
        })}
        {list.length === 0 && <p className="muted">No terms match “{q}”.</p>}
      </div>
    </div>
  );
}
