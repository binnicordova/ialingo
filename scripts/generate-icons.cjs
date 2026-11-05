#!/usr/bin/env node
/**
 * Renders the app icon, Android adaptive layers, splash mark and favicon from
 * one SVG (a happy pet face on brand purple) using Playwright's Chromium.
 * Run: node scripts/generate-icons.cjs
 */
const { chromium } = require('playwright');
const path = require('node:path');

const OUT = path.join(__dirname, '..', 'assets', 'images');

const face = (fill = '#4FC3F7', ink = '#2D2A4A') => `
  <g>
    <path d="M300 210 Q 250 120 300 92 Q 330 150 345 205 Z" fill="#43A047"/>
    <path d="M330 205 Q 360 120 420 118 Q 410 180 360 215 Z" fill="#66BB6A"/>
    <ellipse cx="512" cy="560" rx="330" ry="310" fill="${fill}" stroke="#0288D1" stroke-width="22"/>
    <ellipse cx="512" cy="700" rx="200" ry="150" fill="#E1F5FE"/>
    <ellipse cx="400" cy="520" rx="62" ry="72" fill="#fff"/>
    <ellipse cx="624" cy="520" rx="62" ry="72" fill="#fff"/>
    <circle cx="405" cy="530" r="40" fill="${ink}"/>
    <circle cx="629" cy="530" r="40" fill="${ink}"/>
    <circle cx="420" cy="512" r="15" fill="#fff"/>
    <circle cx="644" cy="512" r="15" fill="#fff"/>
    <ellipse cx="320" cy="625" rx="46" ry="28" fill="#FF8FB1" opacity="0.7"/>
    <ellipse cx="704" cy="625" rx="46" ry="28" fill="#FF8FB1" opacity="0.7"/>
    <path d="M450 620 Q 512 700 574 620 Z" fill="${ink}"/>
    <path d="M480 650 Q 512 680 544 650 Z" fill="#FF6F91"/>
  </g>`;

const svg = ({ background = true, mono = false, scale = 1 } = {}) => `
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  ${background ? '<rect width="1024" height="1024" fill="#6C4BF4"/><circle cx="830" cy="190" r="70" fill="#FFC93C"/><circle cx="170" cy="860" r="40" fill="#FF8FB1"/>' : ''}
  <g transform="translate(${512 - 512 * scale} ${512 - 512 * scale}) scale(${scale})">
    ${mono ? face('#000', '#fff').replace(/fill="#[0-9A-Fa-f]{6}"/g, 'fill="#000"').replace(/stroke="#[0-9A-Fa-f]{6}"/g, 'stroke="#000"') : face()}
  </g>
</svg>`;

const jobs = [
  { file: 'icon.png', size: 1024, markup: svg() },
  { file: 'android-icon-foreground.png', size: 1024, markup: svg({ background: false, scale: 0.62 }) },
  { file: 'android-icon-monochrome.png', size: 1024, markup: svg({ background: false, mono: true, scale: 0.62 }) },
  { file: 'splash-icon.png', size: 512, markup: svg({ background: false, scale: 0.95 }) },
  { file: 'favicon.png', size: 64, markup: svg() },
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
  await page.setContent('<html><body style="margin:0;background:#6C4BF4"></body></html>');
  await page.screenshot({ path: path.join(OUT, 'android-icon-background.png'), clip: { x: 0, y: 0, width: 1024, height: 1024 } });
  console.log('wrote android-icon-background.png');
  await browser.close();
})();
