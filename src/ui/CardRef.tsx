import { createContext, useContext, useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { getCard } from '../engine/cardpool';
import { CardFace, frameClass } from './CardView';

/** The cards the current question is about. Short names in its text ("the Cub") resolve against these. */
const Scope = createContext<readonly string[]>([]);

export function CardScope({ cards, children }: { cards: readonly string[]; children: ReactNode }) {
  return <Scope.Provider value={cards}>{children}</Scope.Provider>;
}

export const useCardScope = () => useContext(Scope);

/** The full card, floating next to the name. Placed below the name, or above when there's no room. */
function Popover({ anchor, name, id }: { anchor: RefObject<HTMLSpanElement | null>; name: string; id: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  useLayoutEffect(() => {
    const a = anchor.current?.getClientRects()[0] ?? anchor.current?.getBoundingClientRect();
    const p = ref.current?.getBoundingClientRect();
    if (!a || !p) return;
    const m = 8;
    const gap = 6;
    const left = Math.max(m, Math.min(a.left + a.width / 2 - p.width / 2, window.innerWidth - p.width - m));
    const below = a.bottom + gap;
    const above = a.top - gap - p.height;
    let top: number;
    if (below + p.height <= window.innerHeight - m) top = below;
    else if (above >= m) top = above;
    else top = Math.max(m, Math.min(below, window.innerHeight - p.height - m));
    setPos({ left, top });
  }, [anchor]);
  return createPortal(
    <div ref={ref} id={id} role="tooltip" className="card-pop" style={pos ?? { left: 0, top: 0, visibility: 'hidden' }}>
      <CardFace name={name} />
    </div>,
    document.body,
  );
}

/**
 * A card name in running text. Hover (mouse), focus or tap shows the full card.
 * `interactive: false` is for names inside buttons: mouse hover still works, but the name
 * doesn't take focus or clicks, so the button keeps working.
 */
export function CardRef({ name, children, interactive = true }: { name: string; children: ReactNode; interactive?: boolean }) {
  const anchor = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState<'hover' | 'pin' | null>(null);
  const id = useId();

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(null);
    const onDown = (e: PointerEvent) => {
      if (!anchor.current?.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    document.addEventListener('pointerdown', onDown);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const hover = {
    onPointerEnter: (e: React.PointerEvent) => e.pointerType === 'mouse' && setOpen((o) => o ?? 'hover'),
    onPointerLeave: (e: React.PointerEvent) => e.pointerType === 'mouse' && setOpen((o) => (o === 'hover' ? null : o)),
  };
  const toggle = () => setOpen((o) => (o === 'pin' ? null : 'pin'));
  const focusable = interactive
    ? {
        role: 'button',
        tabIndex: 0,
        'aria-expanded': !!open,
        'aria-describedby': open ? id : undefined,
        onClick: (e: React.MouseEvent) => {
          e.preventDefault();
          e.stopPropagation();
          toggle();
        },
        onKeyDown: (e: React.KeyboardEvent) => {
          if (e.key !== 'Enter' && e.key !== ' ') return;
          e.preventDefault();
          e.stopPropagation();
          toggle();
        },
        onFocus: () => setOpen((o) => o ?? 'hover'),
        onBlur: () => setOpen(null),
      }
    : {};

  return (
    <>
      <span ref={anchor} className={`cardref ${frameClass(getCard(name))}`} {...hover} {...focusable}>
        {children}
      </span>
      {open && <Popover anchor={anchor} name={name} id={id} />}
    </>
  );
}
