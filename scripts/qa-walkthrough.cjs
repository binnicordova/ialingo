#!/usr/bin/env node
/**
 * QA walkthrough: drives the web build like a child would (onboarding, a full
 * lesson, pets, parents, bedtime) and saves screenshots as retained evidence.
 *
 * Usage: start `npx expo start --web --port 8081`, then
 *   node scripts/qa-walkthrough.cjs [outDir] [scale]
 * Requires Playwright with Chromium.
 */
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');

const BASE = process.env.QA_BASE_URL || 'http://localhost:8081';
const OUT = process.argv[2] || path.join(__dirname, '..', 'production', 'qa', 'evidence', 'mvp-walkthrough');
const SCALE = Number(process.argv[3] || 1);

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'],
  });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: SCALE });
  const page = await context.newPage();
  const problems = [];
  page.on('pageerror', (e) => problems.push(`pageerror: ${e.message.slice(0, 400)}`));
  page.on('console', (m) => {
    if (m.type() === 'error') problems.push(`console.error: ${m.text().slice(0, 400)}`);
  });

  let n = 0;
  const shot = async (name) => {
    n += 1;
    const file = path.join(OUT, `${String(n).padStart(2, '0')}-${name}.png`);
    await page.screenshot({ path: file });
    console.log('shot', path.basename(file));
  };
  const byId = (id) => page.locator(`[data-testid="${id}"]`);
  const visible = async (selector) => (await page.locator(selector).count()) > 0 && page.locator(selector).first().isVisible();
  const wait = (ms) => page.waitForTimeout(ms);

  // 1. Fresh start
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await wait(1500);
  await shot('welcome-language');

  await byId('lang-es').click();
  await byId('welcome-next').click();
  await wait(700);
  await shot('choose-egg');
  await byId('egg-bubbo').click();
  await wait(300);
  await byId('egg-start').click();
  await wait(1500);
  await shot('hatch-egg');
  for (let i = 0; i < 4; i += 1) {
    await byId('hatch-tap').click();
    await wait(i === 3 ? 2600 : 700);
  }
  await shot('hatched-pick-name');
  await byId('name-Pickle').click().catch(() => undefined);
  await byId('hatch-confirm').click();
  await wait(1800);
  await shot('home');

  // 2. A full lesson
  await byId('home-play').click();
  await wait(1500);
  await shot('lesson-learn-card');
  const seen = new Set();
  for (let step = 0; step < 80; step += 1) {
    await wait(450);
    if (await visible('[data-testid="results-continue"]')) break;
    if (await visible('[data-testid="lesson-continue"]')) {
      if (!seen.has('feedback')) {
        seen.add('feedback');
        await shot('lesson-feedback');
      }
      await byId('lesson-continue').click();
      continue;
    }
    if (await visible('[data-testid="learn-next"]')) {
      await byId('learn-next').click();
      continue;
    }
    const lefts = page.locator('[data-testid^="match-left-"]');
    if ((await lefts.count()) > 0) {
      if (!seen.has('match')) {
        seen.add('match');
        await shot('lesson-match-pairs');
      }
      const ids = await lefts.evaluateAll((els) => els.map((e) => e.getAttribute('data-testid').replace('match-left-', '')));
      for (const id of ids) {
        await byId(`match-left-${id}`).click();
        await byId(`match-right-${id}`).click();
        await wait(250);
      }
      await wait(900);
      continue;
    }
    if ((await page.locator('[data-testid^="option-"]').count()) > 0) {
      const kind = (await page.locator('[data-testid^="option-"]').first().innerText()).trim() ? 'lesson-picture-pick' : 'lesson-listen-pick';
      if (!seen.has(kind)) {
        seen.add(kind);
        await shot(kind);
      }
      await page.locator('[data-testid^="option-"]').first().click();
      continue;
    }
    if (await visible('[data-testid="answer-yes"]')) {
      if (!seen.has('tf')) {
        seen.add('tf');
        await shot('lesson-true-false');
      }
      await byId('answer-yes').click();
      continue;
    }
    if ((await page.locator('[data-testid^="letter-"]').count()) > 0) {
      if (!seen.has('spell')) {
        seen.add('spell');
        await shot('lesson-spell');
      }
      const count = await page.locator('[data-testid^="letter-"]').count();
      for (let i = 0; i < count; i += 1) await byId(`letter-${i}`).click({ timeout: 1000 }).catch(() => undefined);
      await wait(700);
      continue;
    }
    if ((await page.locator('[data-testid^="tile-"]').count()) > 0) {
      if (!seen.has('sentence')) {
        seen.add('sentence');
        await shot('lesson-build-sentence');
      }
      const count = await page.locator('[data-testid^="tile-"]').count();
      for (let i = 0; i < count; i += 1) await byId(`tile-${i}`).click({ timeout: 1000 }).catch(() => undefined);
      await wait(700);
      continue;
    }
  }
  await wait(1500);
  await shot('lesson-results');
  for (let i = 0; i < 6; i += 1) {
    if (!(await visible('[data-testid="celebration-primary"]'))) break;
    await shot(`celebration-${i + 1}`);
    await byId('celebration-primary').click();
    await wait(700);
  }
  await byId('results-continue').click();
  await wait(1200);
  await shot('home-after-lesson');

  // 3. World, pets, pet room
  await byId('world-feelings').click();
  await wait(1500);
  await shot('world-feelings');
  await page.goto(`${BASE}/pets`, { waitUntil: 'networkidle' });
  await wait(1500);
  await shot('pets-collection');
  await page.goto(`${BASE}/pet/bubbo`, { waitUntil: 'networkidle' });
  await wait(2000);
  await shot('pet-room');
  await byId('pet-feed').click();
  await wait(700);
  await shot('pet-room-eating');
  await byId('accessory-bow').click();
  await wait(800);
  if (await visible('[data-testid="celebration-primary"]')) await byId('celebration-primary').click();
  await page.locator('[data-testid="pet-room-scroll"]').count();
  await page.mouse.wheel(0, 600);
  await wait(500);
  await shot('pet-room-accessories');
  await page.goto(`${BASE}/guides`, { waitUntil: 'networkidle' });
  await wait(1200);
  await shot('guides');
  await page.goto(`${BASE}/badges`, { waitUntil: 'networkidle' });
  await wait(1200);
  await shot('badges');

  // 4. Parents (solve the gate like an adult would)
  await page.goto(`${BASE}/parents`, { waitUntil: 'networkidle' });
  await wait(1200);
  await shot('parents-gate');
  const question = await page.locator('text=/\\d+ × \\d+/').first().innerText();
  const [, a, b] = question.match(/(\d+) × (\d+)/);
  for (const digit of String(Number(a) * Number(b))) {
    await page.locator(`[aria-label="${digit}"]`).first().click();
  }
  await page.locator('[aria-label="Entrar"]').first().click();
  await wait(1000);
  await shot('parents-dashboard');
  await page.mouse.wheel(0, 900);
  await wait(500);
  await shot('parents-settings');

  // 5. Bedtime: pretend the daily budget is used up
  await page.evaluate(() => {
    const raw = localStorage.getItem('ialingo.save.v1');
    if (!raw) return;
    const save = JSON.parse(raw);
    save.screenTime.secondsUsed = 60 * 60 * 5;
    localStorage.setItem('ialingo.save.v1', JSON.stringify(save));
  });
  await page.goto(`${BASE}/home`, { waitUntil: 'networkidle' });
  await wait(2500);
  await shot('bedtime');

  console.log('--- problems ---');
  console.log(problems.length ? problems.slice(0, 30).join('\n') : 'none');
  await browser.close();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
