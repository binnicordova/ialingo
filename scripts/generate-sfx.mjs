#!/usr/bin/env node
/**
 * Synthesizes the app's short sound effects as 16-bit mono WAV files.
 * Reproducible, license-free, and tiny (a few KB each), so no third-party audio
 * ships in the app. Run with: node scripts/generate-sfx.mjs
 */
import { Buffer } from 'node:buffer';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SAMPLE_RATE = 22050;
const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'sfx');

/** One tone: frequency glide from f0 to f1, with a soft attack and an exponential decay. */
function tone({ f0, f1 = f0, duration, volume = 0.5, wave = 'sine', decay = 6 }) {
  const n = Math.floor(SAMPLE_RATE * duration);
  const out = new Float32Array(n);
  let phase = 0;
  for (let i = 0; i < n; i += 1) {
    const t = i / n;
    const freq = f0 + (f1 - f0) * t;
    phase += (2 * Math.PI * freq) / SAMPLE_RATE;
    const attack = Math.min(1, i / (SAMPLE_RATE * 0.005));
    const env = attack * Math.exp(-decay * t);
    let s = Math.sin(phase);
    if (wave === 'triangle') s = (2 / Math.PI) * Math.asin(Math.sin(phase));
    if (wave === 'soft-square') s = Math.tanh(3 * Math.sin(phase)) * 0.8;
    out[i] = s * env * volume;
  }
  return out;
}

function noise(duration, volume = 0.3) {
  const n = Math.floor(SAMPLE_RATE * duration);
  const out = new Float32Array(n);
  let seed = 12345;
  for (let i = 0; i < n; i += 1) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    const r = (seed / 0x7fffffff) * 2 - 1;
    out[i] = r * volume * Math.exp((-8 * i) / n);
  }
  return out;
}

function concat(...parts) {
  const total = parts.reduce((s, p) => s + p.length, 0);
  const out = new Float32Array(total);
  let offset = 0;
  for (const p of parts) {
    out.set(p, offset);
    offset += p.length;
  }
  return out;
}

function silence(duration) {
  return new Float32Array(Math.floor(SAMPLE_RATE * duration));
}

function toWav(samples) {
  const dataSize = samples.length * 2;
  const buffer = Buffer.alloc(44 + dataSize);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(1, 22); // mono
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(SAMPLE_RATE * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);
  for (let i = 0; i < samples.length; i += 1) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    buffer.writeInt16LE(Math.round(s * 32767), 44 + i * 2);
  }
  return buffer;
}

const NOTE = { C5: 523.25, E5: 659.25, G5: 783.99, B5: 987.77, C6: 1046.5, E6: 1318.51, G6: 1567.98 };

const effects = {
  tap: tone({ f0: 900, f1: 700, duration: 0.04, volume: 0.35, decay: 10 }),
  pop: tone({ f0: 380, f1: 950, duration: 0.09, volume: 0.45, decay: 5 }),
  correct: concat(
    tone({ f0: NOTE.C6, duration: 0.09, volume: 0.4, wave: 'triangle', decay: 3 }),
    tone({ f0: NOTE.E6, duration: 0.22, volume: 0.45, wave: 'triangle', decay: 4 }),
  ),
  wrong: concat(
    tone({ f0: 330, f1: 300, duration: 0.12, volume: 0.35, wave: 'triangle', decay: 3 }),
    silence(0.03),
    tone({ f0: 262, f1: 240, duration: 0.16, volume: 0.35, wave: 'triangle', decay: 3 }),
  ),
  coin: concat(
    tone({ f0: NOTE.B5, duration: 0.06, volume: 0.35, wave: 'soft-square', decay: 2 }),
    tone({ f0: NOTE.E6, duration: 0.25, volume: 0.35, wave: 'soft-square', decay: 5 }),
  ),
  'level-up': concat(
    tone({ f0: NOTE.C5, duration: 0.09, volume: 0.4, wave: 'triangle', decay: 2 }),
    tone({ f0: NOTE.E5, duration: 0.09, volume: 0.4, wave: 'triangle', decay: 2 }),
    tone({ f0: NOTE.G5, duration: 0.09, volume: 0.4, wave: 'triangle', decay: 2 }),
    tone({ f0: NOTE.C6, duration: 0.3, volume: 0.45, wave: 'triangle', decay: 4 }),
  ),
  hatch: concat(
    noise(0.12, 0.35),
    silence(0.04),
    tone({ f0: NOTE.E6, duration: 0.08, volume: 0.35, wave: 'triangle', decay: 2 }),
    tone({ f0: NOTE.G6, duration: 0.28, volume: 0.4, wave: 'triangle', decay: 4 }),
  ),
};

mkdirSync(OUT_DIR, { recursive: true });
for (const [name, samples] of Object.entries(effects)) {
  writeFileSync(join(OUT_DIR, `${name}.wav`), toWav(samples));
  console.log(`wrote assets/sfx/${name}.wav (${samples.length} samples)`);
}
