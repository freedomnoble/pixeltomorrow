let ctx: AudioContext | null = null;
let muted = localStorage.getItem("ttk_muted") === "1";

function ac(): AudioContext | null {
  if (muted) return null;
  try {
    if (!ctx) ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(freq: number, dur: number, type: OscillatorType = "square", vol = 0.04, when = 0) {
  const c = ac();
  if (!c) return;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.setValueAtTime(vol, c.currentTime + when);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + when + dur);
  o.connect(g).connect(c.destination);
  o.start(c.currentTime + when);
  o.stop(c.currentTime + when + dur + 0.02);
}

export const sfx = {
  click: () => tone(660, 0.05),
  hover: () => tone(880, 0.02, "square", 0.015),
  pickup: () => { tone(523, 0.08); tone(784, 0.1, "square", 0.04, 0.08); tone(1046, 0.14, "square", 0.04, 0.16); },
  door: () => { tone(220, 0.12, "triangle"); tone(330, 0.16, "triangle", 0.04, 0.1); },
  talk: () => tone(440, 0.06, "triangle"),
  combine: () => { tone(392, 0.08); tone(494, 0.08, "square", 0.04, 0.08); tone(587, 0.08, "square", 0.04, 0.16); tone(784, 0.2, "square", 0.04, 0.24); },
  danger: () => { tone(110, 0.3, "sawtooth", 0.05); tone(98, 0.4, "sawtooth", 0.05, 0.25); },
  death: () => { tone(300, 0.15, "sawtooth", 0.05); tone(220, 0.2, "sawtooth", 0.05, 0.15); tone(140, 0.5, "sawtooth", 0.05, 0.35); },
  win: () => { [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.18, "square", 0.045, i * 0.12)); },
  locked: () => { tone(200, 0.08, "square", 0.04); tone(160, 0.12, "square", 0.04, 0.09); },
  type: () => tone(1200, 0.015, "square", 0.01),
};

export function isMuted() {
  return muted;
}

export function toggleMute(): boolean {
  muted = !muted;
  localStorage.setItem("ttk_muted", muted ? "1" : "0");
  return muted;
}
