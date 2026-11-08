#!/usr/bin/env node
/**
 * Builds the SVG art for every emoji the app shows (src/presentation/art/emoji-svg.generated.ts).
 *
 * The app never downloads anything: this runs at development time over the
 * pinned Iconify packages in devDependencies, keeps only the emoji found in
 * the content and the presentation code, and writes them as SVG strings.
 *
 * Sources, in order of preference (all allow commercial use; see THIRD_PARTY_NOTICES.md):
 *   1. Microsoft Fluent Emoji, Flat style (MIT)       @iconify-json/fluent-emoji-flat
 *   2. Google Noto Emoji (Apache-2.0)                  @iconify-json/noto
 *   3. Circle Flags by HatScripts (MIT), country flags @iconify-json/circle-flags
 *
 * Usage: node scripts/build-emoji-art.mjs   (then `npm test`: a test fails if
 * any content emoji has no art, so new content can't silently fall back to text)
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const OUT = path.join(root, 'src/presentation/art/emoji-svg.generated.ts');
const SCAN = ['src/infrastructure/content', 'src/presentation', 'src/domain'];

const EMOJI = /\p{Extended_Pictographic}|\p{Regional_Indicator}|⃣/u;
const VS16 = 0xfe0f;

/** Codepoints without the emoji variation selector, joined like "1f44b" or "1f468-200d-1f469". */
const keyOf = (text) =>
  [...text]
    .map((c) => c.codePointAt(0))
    .filter((cp) => cp !== VS16)
    .map((cp) => cp.toString(16))
    .join('-');

/** The same key from an Iconify `chars` entry ("0030-20e3", "2764-fe0f"). */
const keyOfChars = (hex) =>
  hex
    .split('-')
    .map((h) => Number.parseInt(h, 16))
    .filter((cp) => cp !== VS16)
    .map((cp) => cp.toString(16))
    .join('-');

function* files(dir) {
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) yield* files(full);
    else if (/\.tsx?$/.test(name) && !name.endsWith('.generated.ts')) yield full;
  }
}

function usedEmoji() {
  const segmenter = new Intl.Segmenter('en', { granularity: 'grapheme' });
  const found = new Map();
  for (const dir of SCAN) {
    for (const file of files(path.join(root, dir))) {
      for (const { segment } of segmenter.segment(readFileSync(file, 'utf8'))) {
        if (EMOJI.test(segment)) found.set(keyOf(segment), segment);
      }
    }
  }
  return found;
}

function loadSet(pkg) {
  const icons = require(`${pkg}/icons.json`);
  const chars = require(`${pkg}/chars.json`);
  const byKey = new Map(Object.entries(chars).map(([hex, name]) => [keyOfChars(hex), name]));
  return { pkg, icons, byKey };
}

/** Makes ids unique per icon: several SVGs can share one web page (and react-native-web renders real DOM ids). */
function scopeIds(body, prefix) {
  const ids = [...body.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);
  let out = body;
  for (const id of ids) {
    const scoped = `${prefix}-${id}`;
    out = out
      .replaceAll(`id="${id}"`, `id="${scoped}"`)
      .replaceAll(`url(#${id})`, `url(#${scoped})`)
      .replaceAll(`href="#${id}"`, `href="#${scoped}"`);
  }
  return out;
}

function svgFor(set, name, prefix) {
  const alias = set.icons.aliases?.[name];
  const base = alias ? alias.parent : name;
  const icon = set.icons.icons[base];
  if (!icon) return null;
  const width = icon.width ?? set.icons.width ?? 16;
  const height = icon.height ?? set.icons.height ?? 16;
  const left = icon.left ?? set.icons.left ?? 0;
  const top = icon.top ?? set.icons.top ?? 0;
  let body = scopeIds(icon.body, prefix);
  const flip = alias?.hFlip ?? icon.hFlip;
  if (flip) body = `<g transform="translate(${width + 2 * left} 0) scale(-1 1)">${body}</g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${left} ${top} ${width} ${height}">${body}</svg>`;
}

/** Regional-indicator pair (🇲🇽) → ISO code ("mx") for the circle flags. */
function isoOf(emoji) {
  const cps = [...emoji].map((c) => c.codePointAt(0));
  if (cps.length !== 2 || cps.some((cp) => cp < 0x1f1e6 || cp > 0x1f1ff)) return null;
  return cps.map((cp) => String.fromCharCode(97 + cp - 0x1f1e6)).join('');
}

const fluent = loadSet('@iconify-json/fluent-emoji-flat');
const noto = loadSet('@iconify-json/noto');
const flags = require('@iconify-json/circle-flags/icons.json');

const entries = [];
const missing = [];
const bySource = { fluent: 0, noto: 0, flags: 0 };
for (const [key, emoji] of [...usedEmoji()].sort(([a], [b]) => a.localeCompare(b))) {
  const iso = isoOf(emoji);
  let svg = null;
  if (iso && flags.icons[iso]) {
    svg = svgFor({ icons: flags }, iso, `f-${iso}`);
    if (svg) bySource.flags += 1;
  }
  for (const [label, set] of [
    ['fluent', fluent],
    ['noto', noto],
  ]) {
    if (svg) break;
    const name = set.byKey.get(key);
    if (name) {
      svg = svgFor(set, name, `${label[0]}-${key}`);
      if (svg) bySource[label] += 1;
    }
  }
  if (svg) entries.push([key, emoji, svg]);
  else missing.push(emoji);
}

const header = `// Generated by scripts/build-emoji-art.mjs. Do not edit by hand: run \`node scripts/build-emoji-art.mjs\`.
// Art: Microsoft Fluent Emoji Flat (MIT), Google Noto Emoji (Apache-2.0), Circle Flags by HatScripts (MIT).
// See THIRD_PARTY_NOTICES.md. ${entries.length} emoji (fluent ${bySource.fluent}, noto ${bySource.noto}, flags ${bySource.flags}).

/** SVG markup per emoji, keyed by its codepoints without U+FE0F (see \`emojiKey\`). */
export const EMOJI_SVG: Readonly<Record<string, string>> = {
`;
const body = entries.map(([key, emoji, svg]) => `  // ${emoji}\n  ${JSON.stringify(key)}: ${JSON.stringify(svg)},`).join('\n');
writeFileSync(OUT, `${header}${body}\n};\n`);

const kb = Math.round(entries.reduce((sum, [, , svg]) => sum + svg.length, 0) / 1024);
console.log(`emoji art: ${entries.length} written (${kb} KB): fluent ${bySource.fluent}, noto ${bySource.noto}, flags ${bySource.flags}`);
if (missing.length > 0) console.log(`no art (text fallback): ${missing.join(' ')}`);
