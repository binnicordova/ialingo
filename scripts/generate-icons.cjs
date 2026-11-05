#!/usr/bin/env node
/**
 * Renders the app icon, Android adaptive layers, splash mark and favicon from
 * the logo masters in design/logo/master (the Lingosaur on brand purple) using
 * Playwright's Chromium. Usage rules live in design/logo/README.md.
 * Run: node scripts/generate-icons.cjs
 */
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');

const OUT = path.join(__dirname, '..', 'assets', 'images');
const MASTER = path.join(__dirname, '..', 'design', 'logo', 'master');
const VIOLET = '#6C4BF4';

/** The drawing inside a 256×256 master, without its <svg> wrapper. */
const art = (file) =>
  fs
    .readFileSync(path.join(MASTER, file), 'utf8')
    .replace(/^[\s\S]*?<\/title>/, '')
    .replace(/<\/svg>\s*$/, '');

const svg = ({ drawing, background = '', scale = 1, dx = 0, dy = 0 }) => {
  const offset = 128 - 128 * scale;
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 256 256">
  ${background}
  <g transform="translate(${offset + dx} ${offset + dy}) scale(${scale})">${drawing}</g>
</svg>`;
};

const FULL_BLEED = `<rect width="256" height="256" fill="${VIOLET}"/>`;
const ROUNDED_TILE = `<rect width="256" height="256" rx="48" fill="${VIOLET}"/>`;
// 66dp safe circle on the 108dp adaptive canvas: the pet's farthest point stays inside it.
const ADAPTIVE_SCALE = 0.59;

const jobs = [
  { file: 'icon.png', size: 1024, markup: svg({ drawing: art('lingosaur-color.svg'), background: FULL_BLEED, scale: 0.78, dx: 2, dy: -1 }) },
  { file: 'android-icon-foreground.png', size: 1024, markup: svg({ drawing: art('lingosaur-color.svg'), scale: ADAPTIVE_SCALE }) },
  { file: 'android-icon-monochrome.png', size: 1024, markup: svg({ drawing: art('lingosaur-black.svg'), scale: ADAPTIVE_SCALE }) },
  { file: 'splash-icon.png', size: 1024, markup: svg({ drawing: art('lingosaur-color.svg') }) },
  // Browser tabs draw this at 16–32 px, so it uses the simplified small-size cut.
  { file: 'favicon.png', size: 64, markup: svg({ drawing: art('lingosaur-small-color.svg'), background: ROUNDED_TILE, scale: 0.84, dx: 1 }) },
];

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  for (const job of jobs) {
    await page.setViewportSize({ width: job.size, height: job.size });
    await page.setContent(
      `<html><body style="margin:0;background:transparent">${job.markup.replace('width="1024" height="1024"', `width="${job.size}" height="${job.size}"`)}</body></html>`,
    );
    await page.screenshot({ path: path.join(OUT, job.file), omitBackground: true, clip: { x: 0, y: 0, width: job.size, height: job.size } });
    console.log('wrote', job.file);
  }
  // Solid background layer for the Android adaptive icon.
  await page.setViewportSize({ width: 1024, height: 1024 });
  await page.setContent(`<html><body style="margin:0;background:${VIOLET}"></body></html>`);
  await page.screenshot({ path: path.join(OUT, 'android-icon-background.png'), clip: { x: 0, y: 0, width: 1024, height: 1024 } });
  console.log('wrote android-icon-background.png');
  await browser.close();
})();
