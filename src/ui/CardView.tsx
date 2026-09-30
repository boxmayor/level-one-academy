import { getCard, hasCard } from '../engine/cardpool';
import { defOf, isCreature, kwLabel, keywords, power, toughness } from '../engine/game';
import { costColors } from '../engine/mana';
import type { CardDef, Color, Permanent } from '../engine/types';
import { Inline, ManaCost } from './Text';

export function frameClass(def: CardDef): string {
  if (def.types.includes('land') && !def.colorHint) return 'frame-L';
  const cols: Color[] = def.colorHint ?? costColors(def.cost);
  if (cols.length > 1) return 'frame-M';
  if (cols.length === 1) return `frame-${cols[0]}`;
  return def.types.includes('land') ? 'frame-L' : 'frame-C';
}

export function typeLine(def: CardDef): string {
  const t = def.types.map((x) => x[0].toUpperCase() + x.slice(1)).join(' ');
  const basic = def.subtypes?.includes('Basic');
  const subs = def.subtypes?.filter((s) => s !== 'Basic') ?? [];
  const base = def.token ? `Token ${t}` : basic ? `Basic ${t}` : t;
  return subs.length ? `${base} — ${subs.join(' ')}` : base;
}

function ruleText(def: CardDef): string {
  if (def.text) return def.text;
  if (def.keywords?.length) return def.keywords.map(kwLabel).map((k) => k[0].toUpperCase() + k.slice(1)).join(', ');
  return '';
}

/** A full card face (hand, detail view, question illustrations). */
export function CardFace({
  name,
  size = 'md',
  className = '',
  onClick,
  title,
}: {
  name: string;
  size?: 'sm' | 'md';
  className?: string;
  onClick?: () => void;
  title?: string;
}) {
  if (!hasCard(name)) return <div className="card">{name}</div>;
  const def = getCard(name);
  const text = ruleText(def);
  const isCre = def.types.includes('creature');
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      className={`card ${size === 'sm' ? 'sm' : ''} ${frameClass(def)} ${className}`}
      onClick={onClick}
      title={title}
      aria-label={onClick ? `${def.name}${def.cost ? `, costs ${def.cost.replace(/[{}]/g, '')}` : ''}${className.includes('playable') ? ', playable' : ''}` : undefined}
      style={onClick ? { border: 0, textAlign: 'left' } : undefined}
    >
      <div className="c-title">
        <span>{def.name}</span>
        <ManaCost cost={def.cost} />
      </div>
      <div className="c-art" aria-hidden="true">
        {def.art}
      </div>
      <div className="c-type">
        <span>{typeLine(def)}</span>
        {def.rarity && def.rarity !== 'common' && <span title={def.rarity}>{def.rarity === 'mythic' ? '◆' : def.rarity === 'rare' ? '◆' : '◇'}</span>}
      </div>
      <div className="c-text">
        {text.split('\n').map((l, i) => (
          <div key={i}>
            <Inline text={l} links="off" />
          </div>
        ))}
        {def.flavor && size === 'md' && (
          <div>
            <i>{def.flavor}</i>
          </div>
        )}
      </div>
      {isCre && (
        <div className="c-pt">
          {def.xCounters ? 'X/X' : `${def.power}/${def.toughness}`}
        </div>
      )}
    </Tag>
  );
}

/** A one-line card chip: art, name, cost. Used where many cards must be scanned fast. */
export function CardChip({ name }: { name: string }) {
  const def = getCard(name);
  const isLand = def.types.includes('land');
  return (
    <span className={`cardchip ${frameClass(def)} ${isLand ? 'is-land' : ''}`} title={def.text ?? ''}>
      <span aria-hidden="true">{def.art}</span>
      <b>{def.name}</b>
      {def.cost ? <ManaCost cost={def.cost} /> : <span className="small">Land</span>}
      {def.types.includes('creature') && !def.xCounters && <span className="small">{def.power}/{def.toughness}</span>}
    </span>
  );
}

const KW_SHORT: Record<string, string> = {
  flying: 'Flying',
  reach: 'Reach',
  haste: 'Haste',
  firstStrike: '1st strike',
  deathtouch: 'Deathtouch',
  trample: 'Trample',
  lifelink: 'Lifelink',
  vigilance: 'Vigilance',
  defender: 'Defender',
  hexproof: 'Hexproof',
  menace: 'Menace',
  unblockable: 'Unblockable',
  indestructible: 'Indestr.',
};

/** Compact battlefield tile for a creature (or animated land). */
export function PermTile({
  p,
  className = '',
  onClick,
  group,
  label,
}: {
  p: Permanent;
  className?: string;
  onClick?: () => void;
  group?: string;
  label?: string;
}) {
  const def = defOf(p);
  const pw = power(p);
  const tg = toughness(p);
  const basePw = (p.animated ? p.animated.power : def.power ?? 0) + p.counters;
  const baseTg = (p.animated ? p.animated.toughness : def.toughness ?? 0) + p.counters;
  const kws = keywords(p);
  const cls = (v: number, b: number) => (v > b ? 'up' : v < b ? 'down' : '');
  return (
    <button
      className={`tile ${frameClass(def)} ${p.tapped ? 'tapped' : ''} ${className}`}
      onClick={onClick}
      aria-label={`${p.name} ${pw}/${tg}${p.tapped ? ', tapped' : ''}${label ? `, ${label}` : ''}`}
      title={`${p.name} — ${pw}/${tg}${kws.length ? ` (${kws.map(kwLabel).join(', ')})` : ''}`}
    >
      {group && <span className="t-group">{group}</span>}
      {!group && p.sick && isCreature(p) && !kws.includes('haste') && !def.types.includes('land') && (
        <span className="t-badge" title="Summoning sick: can't attack this turn">
          💤
        </span>
      )}
      {p.counters > 0 && <span className="t-counter">+{p.counters}</span>}
      <div className="t-name">{p.name}</div>
      <div className="t-art" aria-hidden="true">
        {def.art}
      </div>
      <div className="t-kw">{kws.map((k) => KW_SHORT[k]).join(' · ')}</div>
      {isCreature(p) && (
        <span className="t-pt">
          <span className={cls(pw, basePw)}>{pw}</span>/<span className={cls(tg, baseTg)}>{tg}</span>
        </span>
      )}
      {p.damage > 0 && <span className="t-dmg">-{p.damage}</span>}
    </button>
  );
}

export function LandChip({ p, className = '', onClick }: { p: Permanent; className?: string; onClick?: () => void }) {
  const def = defOf(p);
  const colorful = def.produces?.filter((c) => c !== 'C') ?? [];
  return (
    <button
      className={`land ${p.tapped ? 'tapped' : ''} ${className}`}
      onClick={onClick}
      title={`${p.name}${p.tapped ? ' (tapped)' : ''}\n${def.text ?? ''}`}
      aria-label={`${p.name}${p.tapped ? ', tapped' : ', untapped'}`}
    >
      <span className="l-art" aria-hidden="true">
        {def.art}
      </span>
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
      <ManaCost cost={(colorful.length ? colorful : def.produces ?? []).map((c) => `{${c}}`).join('')} />
    </button>
  );
}
