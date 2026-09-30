import { Fragment, type ReactNode } from 'react';

/** A single mana symbol, e.g. {G}, {2}, {X}, {T}. */
export function Mana({ sym }: { sym: string }) {
  const cls = /^\d+$/.test(sym) ? 'N' : sym;
  const label = sym === 'T' ? '⟳' : sym;
  return (
    <span className={`mana ${cls}`} aria-label={`${sym} mana`}>
      {label}
    </span>
  );
}

export function ManaCost({ cost }: { cost?: string }) {
  if (!cost) return null;
  const syms = [...cost.matchAll(/\{([^}]+)\}/g)].map((m) => m[1]);
  return (
    <span className="cost">
      {syms.map((s, i) => (
        <Mana key={i} sym={s} />
      ))}
    </span>
  );
}

/** Inline text with {W}{U}... mana symbols, **bold** and *italic*. */
export function Inline({ text }: { text: string }): ReactNode {
  const parts: ReactNode[] = [];
  const re = /(\{[^}]+\}|\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(<Fragment key={k++}>{text.slice(last, m.index)}</Fragment>);
    const tok = m[0];
    if (tok.startsWith('{')) parts.push(<Mana key={k++} sym={tok.slice(1, -1)} />);
    else if (tok.startsWith('**')) parts.push(<strong key={k++}>{tok.slice(2, -2)}</strong>);
    else parts.push(<em key={k++}>{tok.slice(1, -1)}</em>);
    last = m.index + tok.length;
  }
  if (last < text.length) parts.push(<Fragment key={k++}>{text.slice(last)}</Fragment>);
  return <>{parts}</>;
}

/** Light markdown: paragraphs split by blank lines, "- " bullet lists. */
export function Prose({ text, className = 'prose' }: { text: string; className?: string }) {
  const blocks = text.trim().split(/\n\s*\n/);
  return (
    <div className={className}>
      {blocks.map((b, i) => {
        const lines = b.split('\n');
        if (lines.every((l) => l.trim().startsWith('- '))) {
          return (
            <ul key={i}>
              {lines.map((l, j) => (
                <li key={j}>
                  <Inline text={l.trim().slice(2)} />
                </li>
              ))}
            </ul>
          );
        }
        return (
          <p key={i}>
            {lines.map((l, j) => (
              <Fragment key={j}>
                {j > 0 && <br />}
                <Inline text={l} />
              </Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}
