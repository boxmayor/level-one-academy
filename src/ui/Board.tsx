import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { getCard } from '../engine/cardpool';
import {
  canActivate,
  canAttack,
  canBlock,
  canCast,
  canPlayLand,
  defOf,
  effectTarget,
  findPerm,
  hasKw,
  isCreature,
  isLand,
  keywords,
  kwLabel,
  legalTargets,
  power,
  sameTarget,
  toughness,
} from '../engine/game';
import { manaOptions, maxX, parseCost } from '../engine/mana';
import {
  applyUserAction,
  goalMet,
  puzzleStatus,
  scriptToAction,
  setupPuzzle,
  type PuzzleSpec,
  type PuzzleStatus,
  type ScriptAction,
  type UserAction,
} from '../engine/puzzle';
import type { GameState, Permanent, Side, TargetRef } from '../engine/types';
import { CardFace, LandChip, PermTile } from './CardView';
import { Inline, Mana } from './Text';

type Pending = { type: 'cast'; uid: string; mode?: number; x?: number } | { type: 'activate'; uid: string; index: number; x?: number };

type Detail = { kind: 'hand'; uid: string } | { kind: 'perm'; uid: string } | null;
type Chooser = { kind: 'mode'; pending: Pending } | { kind: 'x'; pending: Pending; max: number } | null;

const STEPS: { key: GameState['step']; label: string }[] = [
  { key: 'main1', label: 'Main 1' },
  { key: 'attackers', label: 'Attack' },
  { key: 'blockers', label: 'Block' },
  { key: 'combat', label: 'Damage' },
  { key: 'main2', label: 'Main 2' },
  { key: 'end', label: 'End' },
];

export interface BoardProps {
  spec: PuzzleSpec;
  interactive?: boolean;
  goalText?: string;
  onFinish?: (status: Exclude<PuzzleStatus, 'playing'>) => void;
  /** Extra content under the action bar (hint, result buttons). */
  footer?: ReactNode;
  /** Bumping this number resets the board. */
  resetKey?: number;
  /** When set, the board plays this script automatically (solution replay). */
  replay?: ScriptAction[] | null;
  onReplayDone?: () => void;
}

export function Board({ spec, interactive = true, goalText, onFinish, footer, resetKey = 0, replay, onReplayDone }: BoardProps) {
  const initial = useMemo(() => setupPuzzle(spec), [spec]);
  const [s, setS] = useState<GameState>(initial);
  const [pending, setPending] = useState<Pending | null>(null);
  const [detail, setDetail] = useState<Detail>(null);
  const [chooser, setChooser] = useState<Chooser>(null);
  const [attackSel, setAttackSel] = useState<string[]>([]);
  const [blocks, setBlocks] = useState<Record<string, string>>({});
  const [blockSel, setBlockSel] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const reported = useRef(false);
  const logRef = useRef<HTMLDivElement>(null);
  const status = puzzleStatus(spec, s);

  // Reset
  useEffect(() => {
    setS(setupPuzzle(spec));
    setPending(null);
    setDetail(null);
    setChooser(null);
    setAttackSel([]);
    setBlocks({});
    setBlockSel(null);
    setError(null);
    reported.current = false;
  }, [spec, resetKey]);

  // Replay a solution script step by step.
  useEffect(() => {
    if (!replay) return;
    let cur = setupPuzzle(spec);
    setS(cur);
    reported.current = true;
    let i = 0;
    const timer = window.setInterval(() => {
      if (i >= replay.length || puzzleStatus(spec, cur) !== 'playing') {
        window.clearInterval(timer);
        onReplayDone?.();
        return;
      }
      try {
        cur = applyUserAction(spec, cur, scriptToAction(cur, replay[i]));
        setS(cur);
      } catch (e) {
        setError((e as Error).message);
        window.clearInterval(timer);
        onReplayDone?.();
      }
      i++;
    }, 1100);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [replay]);

  // Clear combat selections when the step changes.
  useEffect(() => {
    setAttackSel([]);
    setBlocks({});
    setBlockSel(null);
  }, [s.step, s.active]);

  useEffect(() => {
    if (status !== 'playing' && !reported.current) {
      reported.current = true;
      onFinish?.(status);
    }
  }, [status, onFinish]);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [s.log.length]);

  useEffect(() => {
    if (!error) return;
    const t = window.setTimeout(() => setError(null), 3200);
    return () => window.clearTimeout(t);
  }, [error]);

  const live = interactive && status === 'playing' && !replay;

  function dispatch(a: UserAction) {
    try {
      setS(applyUserAction(spec, s, a));
      setPending(null);
      setDetail(null);
      setChooser(null);
    } catch (e) {
      setError((e as Error).message.replace(/^Can't (cast|activate): /, ''));
    }
  }

  // --- Casting flow -------------------------------------------------------
  function effectFor(p: Pending) {
    if (p.type === 'cast') {
      const c = s.players.you.hand.find((h) => h.uid === p.uid)!;
      return getCard(c.name).effect;
    }
    const perm = findPerm(s, p.uid)!;
    return defOf(perm).abilities![p.index].effect;
  }
  function costFor(p: Pending) {
    if (p.type === 'cast') return getCard(s.players.you.hand.find((h) => h.uid === p.uid)!.name).cost;
    return defOf(findPerm(s, p.uid)!).abilities![p.index].cost;
  }

  function begin(p: Pending) {
    setDetail(null);
    const eff = effectFor(p);
    if (eff?.kind === 'modal' && p.type === 'cast' && p.mode === undefined) {
      setChooser({ kind: 'mode', pending: p });
      return;
    }
    const cost = costFor(p);
    if (parseCost(cost).hasX && p.x === undefined) {
      const mx = maxX(s, 'you', cost, p.type === 'activate' ? p.uid : undefined);
      setChooser({ kind: 'x', pending: p, max: Math.max(0, mx) });
      return;
    }
    setChooser(null);
    const spec2 = effectTarget(eff, p.type === 'cast' ? p.mode : undefined);
    if (spec2) {
      const targets = legalTargets(s, 'you', spec2);
      if (!targets.length) {
        setError('There are no legal targets for that.');
        return;
      }
      setPending(p);
      return;
    }
    finish(p);
  }

  function finish(p: Pending, target?: TargetRef) {
    if (p.type === 'cast') dispatch({ type: 'cast', uid: p.uid, mode: p.mode, x: p.x, target });
    else dispatch({ type: 'activate', uid: p.uid, index: p.index, x: p.x, target });
  }

  const pendingTargets: TargetRef[] = useMemo(() => {
    if (!pending) return [];
    const spec2 = effectTarget(effectFor(pending), pending.type === 'cast' ? pending.mode : undefined);
    return spec2 ? legalTargets(s, 'you', spec2) : [];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending, s]);
  const isTarget = (t: TargetRef) => pendingTargets.some((x) => sameTarget(x, t));

  // --- Clicks ------------------------------------------------------------------
  const attacking = (uid: string) => !!s.combat?.attackers.includes(uid);
  const attackerLetters = useMemo(() => {
    const m: Record<string, string> = {};
    (s.combat?.attackers ?? []).forEach((a, i) => (m[a] = String.fromCharCode(65 + i)));
    return m;
  }, [s.combat]);
  const inAttackStep = live && s.step === 'attackers' && s.active === 'you';
  const inBlockStep = live && s.step === 'blockers' && s.active === 'opp' && s.stack.length === 0;

  function clickPerm(p: Permanent) {
    if (pending) {
      const t: TargetRef = { type: 'perm', uid: p.uid };
      if (isTarget(t)) finish(pending, t);
      else setError(`${p.name} isn't a legal target.`);
      return;
    }
    if (inAttackStep && p.controller === 'you' && isCreature(p)) {
      if (!canAttack(s, p)) {
        setError(p.sick ? `${p.name} is summoning sick.` : hasKw(p, 'defender') ? `${p.name} has defender.` : `${p.name} can't attack.`);
        return;
      }
      setAttackSel((sel) => (sel.includes(p.uid) ? sel.filter((x) => x !== p.uid) : [...sel, p.uid]));
      return;
    }
    if (inBlockStep && isCreature(p)) {
      if (p.controller === 'you') {
        if (blocks[p.uid]) {
          const nb = { ...blocks };
          delete nb[p.uid];
          setBlocks(nb);
          setBlockSel(null);
          return;
        }
        if (p.tapped) {
          setError(`${p.name} is tapped and can't block.`);
          return;
        }
        setBlockSel(p.uid === blockSel ? null : p.uid);
        return;
      }
      if (attacking(p.uid) && blockSel) {
        const b = findPerm(s, blockSel)!;
        if (!canBlock(s, b, p)) {
          setError(`${b.name} can't block ${p.name}${hasKw(p, 'flying') ? ' (it has flying)' : ''}.`);
          return;
        }
        setBlocks({ ...blocks, [blockSel]: p.uid });
        setBlockSel(null);
        return;
      }
      if (attacking(p.uid)) {
        setError('First pick one of your creatures, then the attacker it should block.');
        return;
      }
    }
    setDetail({ kind: 'perm', uid: p.uid });
  }

  function clickPlayer(side: Side) {
    if (!pending) return;
    const t: TargetRef = { type: 'player', side };
    if (isTarget(t)) finish(pending, t);
  }

  function clickStack(id: string) {
    if (!pending) return;
    const t: TargetRef = { type: 'stack', id };
    if (isTarget(t)) finish(pending, t);
  }

  // --- Rendering helpers ---------------------------------------------------
  const you = s.players.you;
  const opp = s.players.opp;
  const bfFor = (side: Side) => s.battlefield.filter((p) => p.controller === side);
  const creaturesOf = (side: Side) => bfFor(side).filter((p) => isCreature(p) || !isLand(p));
  const landsOf = (side: Side) => bfFor(side).filter((p) => isLand(p) && !isCreature(p));

  const stackTargets = new Set(s.stack.flatMap((it) => (it.target?.type === 'perm' ? [it.target.uid] : [])));
  function targetLabel(t?: TargetRef): string {
    if (!t) return '';
    if (t.type === 'player') return t.side === 'you' ? 'you' : 'the opponent';
    if (t.type === 'stack') return s.stack.find((i) => i.id === t.id)?.card.name ?? 'a spell';
    const p = findPerm(s, t.uid);
    if (!p) return 'a creature that left';
    const g = groupFor(p);
    return `${p.controller === 'you' ? 'your' : 'their'} ${p.name}${g ? ` (${g.replace(/^\S+ /, '')})` : ''}`;
  }

  function tileClass(p: Permanent): string {
    const c: string[] = [];
    if (stackTargets.has(p.uid)) c.push('stacktarget');
    if (attacking(p.uid) || attackSel.includes(p.uid)) c.push('attacking');
    if (pending && isTarget({ type: 'perm', uid: p.uid })) c.push('targetable');
    if (blockSel === p.uid) c.push('selected');
    if (blocks[p.uid] || (s.combat && p.uid in s.combat.blocks)) c.push('blocking');
    if (inAttackStep && p.controller === 'you' && canAttack(s, p) && !attackSel.includes(p.uid)) c.push('canact');
    return c.join(' ');
  }

  function groupFor(p: Permanent): string | undefined {
    if (attackerLetters[p.uid]) return `⚔ ${attackerLetters[p.uid]}`;
    const b = blocks[p.uid] ?? s.combat?.blocks[p.uid];
    if (b && attackerLetters[b]) return `🛡 ${attackerLetters[b]}`;
    return undefined;
  }

  const lifeRef = useRef({ you: you.life, opp: opp.life });
  const [flash, setFlash] = useState<Record<Side, number>>({ you: 0, opp: 0 });
  useEffect(() => {
    const prev = lifeRef.current;
    const f = { ...flash };
    let changed = false;
    for (const side of ['you', 'opp'] as Side[]) {
      if (s.players[side].life !== prev[side]) {
        f[side]++;
        changed = true;
      }
    }
    lifeRef.current = { you: you.life, opp: opp.life };
    if (changed) setFlash(f);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [you.life, opp.life]);

  function playerBar(side: Side) {
    const pl = s.players[side];
    const tgt = pending && isTarget({ type: 'player', side });
    return (
      <div className="pbar">
        <span className="who">{side === 'you' ? 'You' : 'Opponent'}</span>
        <button
          key={flash[side]}
          className={`life ${tgt ? 'target' : ''} ${flash[side] ? 'flash' : ''}`}
          onClick={() => clickPlayer(side)}
          aria-label={`${side === 'you' ? 'Your' : "Opponent's"} life: ${pl.life}`}
          disabled={!tgt}
          style={{ color: 'var(--ink)' }}
        >
          ❤️ <span className="num">{pl.life}</span>
        </button>
        <span className="zone-info small">
          <span title="Cards in hand">✋ {pl.hand.length}</span>
          <span title="Cards in library">📚 {pl.library.length}</span>
          <span title="Graveyard">🪦 {pl.graveyard.length}</span>
        </span>
        {s.active === side && <span className="pill gold">{side === 'you' ? 'Your turn' : 'Their turn'}</span>}
      </div>
    );
  }

  function battlefield(side: Side) {
    const cre = creaturesOf(side);
    const lands = landsOf(side);
    const creRow = (
      <div className="bf-row creatures">
        {cre.length === 0 && <span className="small muted">No creatures</span>}
        {cre.map((p) => (
          <PermTile key={p.uid} p={p} className={tileClass(p)} onClick={() => clickPerm(p)} group={groupFor(p)} />
        ))}
      </div>
    );
    const landRow = (
      <div className="bf-row lands">
        {lands.map((p) => (
          <LandChip key={p.uid} p={p} onClick={() => clickPerm(p)} className={pending && isTarget({ type: 'perm', uid: p.uid }) ? 'canact' : ''} />
        ))}
      </div>
    );
    return <div className={`bf ${side}`}>{side === 'opp' ? [<div key="l">{landRow}</div>, <div key="c">{creRow}</div>] : [<div key="c">{creRow}</div>, <div key="l">{landRow}</div>]}</div>;
  }

  // --- Action bar ----------------------------------------------------------------
  function actionBar(): { msg: ReactNode; btns: ReactNode } {
    if (!interactive) return { msg: null, btns: null };
    if (replay) return { msg: <span>▶ Watching the solution…</span>, btns: null };
    if (status === 'success') return { msg: <b style={{ color: 'var(--good)' }}>✔ Puzzle solved!</b>, btns: null };
    if (status === 'fail') return { msg: <b style={{ color: 'var(--bad)' }}>✘ That line doesn't reach the goal.</b>, btns: null };
    if (pending) {
      const name = pending.type === 'cast' ? s.players.you.hand.find((h) => h.uid === pending.uid)?.name : findPerm(s, pending.uid)?.name;
      return {
        msg: (
          <span>
            🎯 Choose a target for <b>{name}</b> (highlighted in red).
          </span>
        ),
        btns: (
          <button className="btn ghost small" onClick={() => setPending(null)}>
            Cancel
          </button>
        ),
      };
    }
    if (inAttackStep) {
      return {
        msg: <span>⚔️ Tap your creatures to choose attackers, then confirm.</span>,
        btns: (
          <>
            <button className="btn bad small" onClick={() => dispatch({ type: 'attack', uids: attackSel })} disabled={!attackSel.length}>
              Attack with {attackSel.length}
            </button>
            <button className="btn ghost small" onClick={() => dispatch({ type: 'attack', uids: [] })}>
              No attack
            </button>
          </>
        ),
      };
    }
    if (inBlockStep) {
      const n = Object.keys(blocks).length;
      return {
        msg: (
          <span>
            🛡 The opponent attacks! Pick one of your creatures, then the attacker it blocks.
            {blockSel ? (
              <>
                {' '}
                <b>{findPerm(s, blockSel)?.name}</b> selected.
              </>
            ) : null}
          </span>
        ),
        btns: (
          <button className="btn small" onClick={() => dispatch({ type: 'block', blocks })}>
            {n ? `Confirm ${n} block${n > 1 ? 's' : ''}` : 'No blocks'}
          </button>
        ),
      };
    }
    if (s.priority === 'you') {
      const top = s.stack[s.stack.length - 1];
      if (top) {
        return {
          msg: (
            <span>
              {top.controller === 'opp' ? (
                <>
                  The opponent cast <b>{top.card.name}</b>. Respond with an instant, or let it resolve.
                </>
              ) : (
                <>
                  <b>{top.card.name}</b> is on the stack.
                </>
              )}
            </span>
          ),
          btns: (
            <button className="btn small" onClick={() => dispatch({ type: 'pass' })}>
              {top.controller === 'opp' ? 'Let it resolve' : 'Resolve'}
            </button>
          ),
        };
      }
      if (s.active === 'you' && !spec.continueToOppTurn && goalMet(spec.goal, s) && spec.goal.type !== 'survive') {
        return {
          msg: <b style={{ color: 'var(--good)' }}>✔ Goal reached. End your turn to lock it in.</b>,
          btns: (
            <button className="btn good small" onClick={() => dispatch({ type: 'endTurn' })}>
              End turn
            </button>
          ),
        };
      }
      if (s.active === 'you') {
        if (s.step === 'main1')
          return {
            msg: <span>Your main phase: play a land, cast spells, then go to combat.</span>,
            btns: (
              <>
                <button className="btn bad small" onClick={() => dispatch({ type: 'toCombat' })}>
                  To combat ⚔️
                </button>
                <button className="btn ghost small" onClick={() => dispatch({ type: 'endTurn' })}>
                  End turn
                </button>
              </>
            ),
          };
        if (s.step === 'combat')
          return {
            msg: <span>Blocks are in. Cast combat tricks now, or deal damage.</span>,
            btns: (
              <button className="btn bad small" onClick={() => dispatch({ type: 'pass' })}>
                Deal damage
              </button>
            ),
          };
        if (s.step === 'blockers')
          return {
            msg: <span>The opponent is about to block.</span>,
            btns: (
              <button className="btn small" onClick={() => dispatch({ type: 'pass' })}>
                Continue
              </button>
            ),
          };
        return {
          msg: <span>Second main phase: cast anything else you need.</span>,
          btns: (
            <button className="btn small" onClick={() => dispatch({ type: 'endTurn' })}>
              End turn
            </button>
          ),
        };
      }
      // Opponent's turn
      if (s.step === 'combat')
        return {
          msg: <span>Blocks are locked in. Cast tricks now, or let damage happen.</span>,
          btns: (
            <button className="btn bad small" onClick={() => dispatch({ type: 'pass' })}>
              Deal damage
            </button>
          ),
        };
      return {
        msg: <span>The opponent's turn ({s.step === 'main1' ? 'before combat' : 'after combat'}). Cast instants now, or pass.</span>,
        btns: (
          <button className="btn small" onClick={() => dispatch({ type: 'pass' })}>
            Pass
          </button>
        ),
      };
    }
    return { msg: <span className="muted">Waiting…</span>, btns: null };
  }

  const bar = actionBar();
  const pool = you.pool;

  return (
    <div className="board" aria-label="Game board">
      {goalText && interactive && (
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <span className="goalchip">🎯 {goalText}</span>
          <div className="phase" aria-label="Turn steps">
            {STEPS.map((st) => (
              <span key={st.key} className={s.step === st.key ? 'on' : ''}>
                {st.label}
              </span>
            ))}
          </div>
        </div>
      )}
      {playerBar('opp')}
      {opp.hand.length > 0 && (
        <div className="hand opp" aria-label="Opponent's hand">
          {s.players.opp.hiddenHand ? opp.hand.map((c) => <div key={c.uid} className="facedown" title="Hidden card" />) : opp.hand.map((c) => <CardFace key={c.uid} name={c.name} size="sm" />)}
        </div>
      )}
      {battlefield('opp')}
      {s.stack.length > 0 && (
        <div className="stack" aria-label="The stack">
          <span className="eyebrow">The stack (top resolves first)</span>
          {[...s.stack].reverse().map((it) => {
            const tgt = pending && isTarget({ type: 'stack', id: it.id });
            return (
              <button key={it.id} className={`s-item ${tgt ? 'targetable' : ''}`} onClick={() => clickStack(it.id)}>
                <span>{getCard(it.card.name).art}</span>
                <span>
                  <b>{it.card.name}</b> <span className="muted small">({it.controller === 'you' ? 'yours' : "opponent's"})</span>
                  {it.target && <span className="small"> → {targetLabel(it.target)}</span>}
                </span>
              </button>
            );
          })}
        </div>
      )}
      <div className="divider" />
      {battlefield('you')}
      {playerBar('you')}
      {you.hand.length > 0 && (
        <div className="hand" aria-label="Your hand">
          {you.hand.map((c) => {
            const def = getCard(c.name);
            const ok = live && (def.types.includes('land') ? canPlayLand(s, 'you', c.uid).ok : canCast(s, 'you', c.uid).ok);
            return <CardFace key={c.uid} name={c.name} size="sm" className={ok ? 'playable' : 'dim'} onClick={() => setDetail({ kind: 'hand', uid: c.uid })} />;
          })}
        </div>
      )}
      {interactive && (
        <div className="actionbar" aria-live="polite">
          <div className="msg">
            {bar.msg}
            {pool.length > 0 && (
              <div className="pool small muted">
                Mana pool: {pool.map((m, i) => <Mana key={i} sym={m} />)} <span>(used first; empties at the end of the step)</span>
              </div>
            )}
          </div>
          <div className="btns">{bar.btns}</div>
        </div>
      )}
      {error && (
        <div className="result fail small" role="alert">
          {error}
        </div>
      )}
      {footer}
      {interactive && s.log.length > 0 && (
        <div className="log" ref={logRef} aria-label="Game log">
          {s.log.map((l, i) => (
            <div key={i} className={l.side}>
              {l.text}
            </div>
          ))}
        </div>
      )}

      {detail && <DetailModal s={s} detail={detail} live={live} onClose={() => setDetail(null)} onBegin={begin} onDispatch={dispatch} />}
      {chooser?.kind === 'mode' && (
        <div className="overlay" onClick={() => setChooser(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Choose one</h2>
            <div className="choice-list">
              {(effectFor(chooser.pending) as Extract<ReturnType<typeof effectFor>, { kind: 'modal' }>).modes.map((m, i) => {
                const tspec = effectTarget(m.effect);
                const ok = !tspec || legalTargets(s, 'you', tspec).length > 0;
                return (
                  <button key={i} className="option" disabled={!ok} onClick={() => begin({ ...chooser.pending, mode: i } as Pending)}>
                    <span className="key">{i + 1}</span>
                    <span>
                      {m.label}
                      {!ok && <span className="muted small"> (no legal target)</span>}
                    </span>
                  </button>
                );
              })}
            </div>
            <button className="btn ghost" onClick={() => setChooser(null)}>
              Cancel
            </button>
          </div>
        </div>
      )}
      {chooser?.kind === 'x' && <XChooser max={chooser.max} onCancel={() => setChooser(null)} onPick={(x) => begin({ ...chooser.pending, x } as Pending)} />}
    </div>
  );
}

function XChooser({ max, onPick, onCancel }: { max: number; onPick: (x: number) => void; onCancel: () => void }) {
  const [x, setX] = useState(max);
  return (
    <div className="overlay" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Choose X</h2>
        <p className="muted">You can afford up to X = {max}.</p>
        <input id="x-range" type="range" min={0} max={max} value={x} onChange={(e) => setX(Number(e.target.value))} />
        <div className="rating">X = {x}</div>
        <div style={{ display: 'flex', gap: '0.6rem' }}>
          <button className="btn good" onClick={() => onPick(x)}>
            Cast
          </button>
          <button className="btn ghost" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function DetailModal({
  s,
  detail,
  live,
  onClose,
  onBegin,
  onDispatch,
}: {
  s: GameState;
  detail: NonNullable<Detail>;
  live: boolean;
  onClose: () => void;
  onBegin: (p: Pending) => void;
  onDispatch: (a: UserAction) => void;
}) {
  let body: ReactNode = null;
  if (detail.kind === 'hand') {
    const c = s.players.you.hand.find((h) => h.uid === detail.uid);
    if (!c) return null;
    const def = getCard(c.name);
    const isLandCard = def.types.includes('land');
    const chk = isLandCard ? canPlayLand(s, 'you', c.uid) : canCast(s, 'you', c.uid);
    body = (
      <>
        <div className="cardrow">
          <CardFace name={c.name} />
        </div>
        {live && (
          <>
            {isLandCard ? (
              <button className="btn good wide" disabled={!chk.ok} onClick={() => onDispatch({ type: 'playLand', uid: c.uid })}>
                Play land
              </button>
            ) : (
              <button className="btn good wide" disabled={!chk.ok} onClick={() => onBegin({ type: 'cast', uid: c.uid })}>
                Cast {c.name}
              </button>
            )}
            {!chk.ok && <p className="small muted" style={{ margin: 0 }}>{chk.reason}</p>}
          </>
        )}
      </>
    );
  } else {
    const p = findPerm(s, detail.uid);
    if (!p) return null;
    const def = defOf(p);
    const abilities = def.abilities ?? [];
    const opts = p.controller === 'you' ? manaOptions(p) : [];
    const status: string[] = [];
    if (p.tapped) status.push('tapped');
    if (p.sick && isCreature(p) && !def.types.includes('land')) status.push('summoning sick');
    if (p.damage) status.push(`${p.damage} damage marked`);
    if (p.counters) status.push(`${p.counters} +1/+1 counter${p.counters > 1 ? 's' : ''}`);
    if (p.animated) status.push('animated until end of turn');
    body = (
      <>
        <div className="cardrow">
          <CardFace name={p.name} />
        </div>
        {isCreature(p) && (
          <p style={{ margin: 0 }}>
            Right now: <b>{power(p)}/{toughness(p)}</b>
            {keywords(p).length ? ` · ${keywords(p).map(kwLabel).join(', ')}` : ''}
            {status.length ? ` · ${status.join(', ')}` : ''}
          </p>
        )}
        {!isCreature(p) && status.length > 0 && <p style={{ margin: 0 }}>{status.join(', ')}</p>}
        {live && p.controller === 'you' && (
          <div className="choice-list">
            {opts.length > 0 &&
              [...new Set(opts)].map((m) => (
                <button key={m} className="btn ghost small" onClick={() => onDispatch({ type: 'tapMana', uid: p.uid, sym: m })}>
                  Tap for <Mana sym={m} />
                </button>
              ))}
            {abilities.map((ab, i) => {
              if (ab.mana) return null;
              const chk = canActivate(s, 'you', p.uid, i);
              return (
                <div key={i} style={{ display: 'grid', gap: '0.2rem' }}>
                  <button className="btn small" disabled={!chk.ok} onClick={() => onBegin({ type: 'activate', uid: p.uid, index: i })}>
                    <span style={{ textTransform: 'none' }}>
                      <Inline text={ab.label} />
                    </span>
                  </button>
                  {!chk.ok && <span className="small muted">{chk.reason}</span>}
                </div>
              );
            })}
          </div>
        )}
      </>
    );
  }
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Card details">
        {body}
        <button className="btn ghost" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}

/** A read-only board picture for questions and teaching cards. */
export function Scene({ you, opp, note }: { you: PuzzleSpec['you']; opp: PuzzleSpec['opp']; note?: string }) {
  const spec = useMemo<PuzzleSpec>(() => ({ you, opp, goal: { type: 'survive' }, ai: { blocks: 'none', tricks: false } }), [you, opp]);
  return (
    <div style={{ display: 'grid', gap: '0.4rem' }}>
      <Board spec={spec} interactive={false} />
      {note && <p className="small muted" style={{ margin: 0 }}>{note}</p>}
    </div>
  );
}
