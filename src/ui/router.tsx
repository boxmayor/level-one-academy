import { useSyncExternalStore } from 'react';

// A tiny hash router. If the host blocks hash changes, it still works in memory.
let route = readHash();
const listeners = new Set<() => void>();

function readHash(): string {
  try {
    const h = window.location.hash.replace(/^#/, '');
    return h.startsWith('/') ? h : '/';
  } catch {
    return '/';
  }
}

export function navigate(path: string) {
  route = path;
  try {
    if (window.location.hash !== `#${path}`) window.location.hash = path;
  } catch {
    // ignore
  }
  listeners.forEach((l) => l());
  try {
    window.scrollTo({ top: 0 });
  } catch {
    // ignore
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('hashchange', () => {
    const r = readHash();
    if (r !== route) {
      route = r;
      listeners.forEach((l) => l());
      try {
        window.scrollTo({ top: 0 });
      } catch {
        // ignore
      }
    }
  });
}

export function useRoute(): string {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => {
        listeners.delete(l);
      };
    },
    () => route,
    () => route,
  );
}

export function Link({ to, className, children, ...rest }: { to: string; className?: string; children: React.ReactNode } & React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a
      href={`#${to}`}
      className={className}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey) return;
        e.preventDefault();
        navigate(to);
      }}
      {...rest}
    >
      {children}
    </a>
  );
}
