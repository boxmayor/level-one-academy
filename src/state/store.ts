import { useSyncExternalStore } from 'react';
import { newProgress, regenHearts, type Progress } from './progress';

const KEY = 'level-one-academy:v1';

function load(): Progress {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Progress>;
      const base = newProgress();
      return { ...base, ...parsed, settings: { ...base.settings, ...(parsed.settings ?? {}) } };
    }
  } catch {
    // Storage can be unavailable (private mode). Fall back to a fresh profile.
  }
  return newProgress();
}

let state: Progress = load();
regenHearts(state);
const listeners = new Set<() => void>();

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

export function getProgress(): Progress {
  return state;
}

/** Mutate a copy of the progress and publish it. */
export function updateProgress(fn: (p: Progress) => void): Progress {
  const next = structuredClone(state);
  fn(next);
  state = next;
  save();
  listeners.forEach((l) => l());
  return state;
}

export function resetProgress() {
  state = newProgress();
  save();
  listeners.forEach((l) => l());
}

export function exportProgress(): string {
  return JSON.stringify(state, null, 2);
}

export function importProgress(json: string): boolean {
  try {
    const parsed = JSON.parse(json) as Progress;
    if (parsed.version !== 1) return false;
    state = { ...newProgress(), ...parsed };
    save();
    listeners.forEach((l) => l());
    return true;
  } catch {
    return false;
  }
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

export function useProgress(): Progress {
  return useSyncExternalStore(subscribe, getProgress, getProgress);
}

// Hearts regenerate over time; refresh once a minute.
if (typeof window !== 'undefined') {
  window.setInterval(() => {
    if (state.hearts < 5) updateProgress((p) => regenHearts(p));
  }, 60_000);
}
