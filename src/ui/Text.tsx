import { Fragment, type ReactNode } from 'react';
import { mentionMatcher } from '../content/mentions';
import { CardRef, useCardScope } from './CardRef';

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

/**
 * How card names in text render: 'link' highlights them and shows the card on hover, focus or tap;
 * 'hover' is for text inside buttons (mouse hover only); 'off' leaves them as plain text.
 */
export type CardLinks = 'link' | 'hover' | 'off';

/** Plain text with card names turned into card previews. */
function CardText({ text, links }: { text: string; links: CardLinks }): ReactNode {
  const scope = useCardScope();
  if (links === 'off') return text;
  const { re, lookup } = mentionMatcher(scope);
  const parts: ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(re)) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    parts.push(
      <CardRef key={m.index} name={lookup.get(m[1].replace(/’/g, "'"))!} interactive={links === 'link'}>
        {m[0]}
      </CardRef>,
    );
    last = m.index + m[0].length;
  }
  if (!parts.length) return text;
  if (last < text.length) parts.push(text.slice(last));
  return <>{parts}</>;
}

/** Inline text with {W}{U}... mana symbols, **bold**, *italic* and card names. */
export function Inline({ text, links = 'link' }: { text: string; links?: CardLinks }): ReactNode {
  const parts: ReactNode[] = [];
  const re = /(\{[^}]+\}|\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(<CardText key={k++} text={text.slice(last, m.index)} links={links} />);
    const tok = m[0];
    if (tok.startsWith('{')) parts.push(<Mana key={k++} sym={tok.slice(1, -1)} />);
    else if (tok.startsWith('**'))
      parts.push(
        <strong key={k++}>
          <CardText text={tok.slice(2, -2)} links={links} />
        </strong>,
      );
    else
      parts.push(
        <em key={k++}>
          <CardText text={tok.slice(1, -1)} links={links} />
        </em>,
      );
    last = m.index + tok.length;
  }
  if (last < text.length) parts.push(<CardText key={k++} text={text.slice(last)} links={links} />);
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
