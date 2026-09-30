import { getProgress } from '../state/store';

let ctx: AudioContext | null = null;

function tone(freqs: number[], dur = 0.12, type: OscillatorType = 'sine', gap = 0.09) {
  if (!getProgress().settings.sound) return;
  try {
    ctx ??= new AudioContext();
    const t0 = ctx.currentTime;
    freqs.forEach((f, i) => {
      const o = ctx!.createOscillator();
      const g = ctx!.createGain();
      o.type = type;
      o.frequency.value = f;
      const st = t0 + i * gap;
      g.gain.setValueAtTime(0.0001, st);
      g.gain.exponentialRampToValueAtTime(0.18, st + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, st + dur);
      o.connect(g).connect(ctx!.destination);
      o.start(st);
      o.stop(st + dur + 0.02);
    });
  } catch {
    // Audio is optional.
  }
}

export const sfx = {
  good: () => tone([660, 880], 0.14, 'triangle'),
  bad: () => tone([220, 170], 0.18, 'sawtooth', 0.12),
  win: () => tone([523, 659, 784, 1046], 0.2, 'triangle', 0.11),
  tap: () => tone([440], 0.05, 'square'),
};

export function confetti(durationMs = 1800) {
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
  const canvas = document.createElement('canvas');
  canvas.className = 'confetti';
  document.body.appendChild(canvas);
  const c = canvas.getContext('2d');
  if (!c) return;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = innerWidth * dpr;
  canvas.height = innerHeight * dpr;
  c.scale(dpr, dpr);
  // The five mana colors plus gold.
  const colors = ['#f5edc8', '#3e8ed0', '#3b3331', '#d9533a', '#3e9152', '#e3b94a'];
  const parts = Array.from({ length: 140 }, () => ({
    x: innerWidth / 2 + (Math.random() - 0.5) * 120,
    y: innerHeight * 0.35,
    vx: (Math.random() - 0.5) * 12,
    vy: -Math.random() * 12 - 4,
    r: Math.random() * 6 + 4,
    rot: Math.random() * Math.PI,
    vr: (Math.random() - 0.5) * 0.3,
    color: colors[Math.floor(Math.random() * colors.length)],
    round: Math.random() < 0.5,
  }));
  const start = performance.now();
  const frame = (now: number) => {
    c.clearRect(0, 0, innerWidth, innerHeight);
    for (const p of parts) {
      p.vy += 0.35;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      c.save();
      c.translate(p.x, p.y);
      c.rotate(p.rot);
      c.fillStyle = p.color;
      if (p.round) {
        c.beginPath();
        c.arc(0, 0, p.r / 2, 0, Math.PI * 2);
        c.fill();
      } else c.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2);
      c.restore();
    }
    if (now - start < durationMs) requestAnimationFrame(frame);
    else canvas.remove();
  };
  requestAnimationFrame(frame);
}
