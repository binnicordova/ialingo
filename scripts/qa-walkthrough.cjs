#!/usr/bin/env node
/**
 * QA walkthrough: drives the web build like a child (and a parent) would and
 * saves screenshots as retained evidence.
 *
 * Covers: onboarding, a learn lesson, a story lesson, a speaking lesson
 * (self-check mode, which is what Expo Go and web use), results and
 * celebrations, world/pets/pet room, guides, badges, certificates, the parent
 * gate and dashboard (players, speaking, voice diary), adding a second player,
 * "Who's playing?", and bedtime.
 *
 * Usage: start `npx expo start --web --port 8081`, then
 *   node scripts/qa-walkthrough.cjs [outDir] [scale]
 */
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');

const BASE = process.env.QA_BASE_URL || 'http://localhost:8081';
const OUT = process.argv[2] || path.join(__dirname, '..', 'production', 'qa', 'evidence', 'v1.1-walkthrough');
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
  const count = (selector) => page.locator(selector).count();
  const visible = async (selector) => (await count(selector)) > 0 && page.locator(selector).first().isVisible();
  const wait = (ms) => page.waitForTimeout(ms);

  /** Plays the current lesson to the results screen; screenshots the first of each exercise type. */
  const playLesson = async (prefix) => {
    const seen = new Set();
    const first = async (key) => {
      if (seen.has(key)) return;
      seen.add(key);
      await shot(`${prefix}-${key}`);
    };
    for (let step = 0; step < 90; step += 1) {
      await wait(450);
      if (await visible('[data-testid="results-continue"]')) return;
      if (await visible('[data-testid="lesson-continue"]')) {
        await first('feedback');
        await byId('lesson-continue').click();
        continue;
      }
      if (await visible('[data-testid="learn-next"]')) {
        await first('learn-card');
        await byId('learn-next').click();
        continue;
      }
      if (await visible('[data-testid="story-next"]')) {
        await first('story-page');
        await byId('story-next').click();
        continue;
      }
      if (await visible('[data-testid="speak-self-check"]')) {
        await first('speak');
        await byId('speak-self-check').click();
        continue;
      }
      const lefts = page.locator('[data-testid^="match-left-"]');
      if ((await lefts.count()) > 0) {
        await first('match-pairs');
        const ids = await lefts.evaluateAll((els) => els.map((e) => e.getAttribute('data-testid').replace('match-left-', '')));
        for (const id of ids) {
          await byId(`match-left-${id}`).click();
          await byId(`match-right-${id}`).click();
          await wait(250);
        }
        await wait(900);
        continue;
      }
      if ((await count('[data-testid^="option-"]')) > 0) {
        await first('pick');
        await page.locator('[data-testid^="option-"]').first().click();
        continue;
      }
      if (await visible('[data-testid="answer-yes"]')) {
        await first('true-false');
        await byId('answer-yes').click();
        continue;
      }
      if ((await count('[data-testid^="letter-"]')) > 0) {
        await first('spell');
        const letters = await count('[data-testid^="letter-"]');
        for (let i = 0; i < letters; i += 1) await byId(`letter-${i}`).click({ timeout: 1000 }).catch(() => undefined);
        await wait(700);
        continue;
      }
      if ((await count('[data-testid^="tile-"]')) > 0) {
        await first('build-sentence');
        const tiles = await count('[data-testid^="tile-"]');
        for (let i = 0; i < tiles; i += 1) await byId(`tile-${i}`).click({ timeout: 1000 }).catch(() => undefined);
        await wait(700);
      }
    }
  };

  const dismissCelebrations = async (label) => {
    for (let i = 0; i < 8; i += 1) {
      if (!(await visible('[data-testid="celebration-primary"]'))) return;
      if (label) await shot(`${label}-celebration-${i + 1}`);
      await byId('celebration-primary').click();
      await wait(700);
    }
  };

  const onboard = async (eggId, prefix) => {
    if (prefix) await shot(`${prefix}-welcome`);
    await byId('lang-es').click();
    await byId('welcome-next').click();
    await wait(600);
    await byId(`egg-${eggId}`).click();
    await byId('egg-start').click();
    await wait(1500);
    for (let i = 0; i < 4; i += 1) {
      await byId('hatch-tap').click();
      await wait(i === 3 ? 2600 : 700);
    }
    if (prefix) await shot(`${prefix}-hatched`);
    await byId('hatch-confirm').click();
    await wait(1800);
  };

  // 1. Fresh start and onboarding
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await wait(1500);
  await onboard('bubbo', 'onboarding');
  await shot('home');

  // 2. A learn lesson (now with a speaking exercise)
  await byId('home-play').click();
  await wait(1500);
  await playLesson('learn');
  await wait(1200);
  await shot('learn-results');
  await dismissCelebrations('learn');
  await byId('results-continue').click();
  await wait(1000);

  // 3. Story and speaking lessons (opened directly)
  await page.goto(`${BASE}/lesson/feelings.story`, { waitUntil: 'networkidle' });
  await wait(1500);
  await playLesson('story');
  await wait(1000);
  await dismissCelebrations();
  await page.goto(`${BASE}/lesson/feelings.speak`, { waitUntil: 'networkidle' });
  await wait(1500);
  await playLesson('speak');
  await wait(1000);
  await shot('speak-results');
  await dismissCelebrations();

  // 4. Map, world, pets, guides, badges, certificates
  await page.goto(`${BASE}/home`, { waitUntil: 'networkidle' });
  await wait(1500);
  await page.mouse.wheel(0, 1400);
  await wait(600);
  await shot('map-levels');
  await page.goto(`${BASE}/world/feelings`, { waitUntil: 'networkidle' });
  await wait(1500);
  await page.mouse.wheel(0, 500);
  await wait(500);
  await shot('world-lessons');
  await page.goto(`${BASE}/world/countries`, { waitUntil: 'networkidle' });
  await wait(1500);
  await shot('world-countries-locked-or-open');
  await page.goto(`${BASE}/pets`, { waitUntil: 'networkidle' });
  await wait(1500);
  await shot('pets');
  await page.goto(`${BASE}/guides`, { waitUntil: 'networkidle' });
  await wait(1200);
  await page.mouse.wheel(0, 1600);
  await wait(500);
  await shot('guides-new');
  await page.goto(`${BASE}/badges`, { waitUntil: 'networkidle' });
  await wait(1200);
  await shot('badges');
  await page.goto(`${BASE}/certificates`, { waitUntil: 'networkidle' });
  await wait(1200);
  await shot('certificates');

  // 5. Parents: gate, dashboard, new sections
  const solveGate = async () => {
    const question = await page.locator('text=/\\d+ × \\d+/').first().innerText();
    const [, a, b] = question.match(/(\d+) × (\d+)/);
    for (const digit of String(Number(a) * Number(b))) await page.locator(`[aria-label="${digit}"]`).first().click();
    await page.locator('[aria-label="Entrar"]').first().click();
    await wait(1000);
  };
  await page.goto(`${BASE}/parents`, { waitUntil: 'networkidle' });
  await wait(1200);
  await solveGate();
  await shot('parents-dashboard');
  await page.mouse.wheel(0, 1500);
  await wait(500);
  await shot('parents-players-speaking');
  await byId('voice-diary-on').click();
  await wait(400);
  await page.mouse.wheel(0, 500);
  await wait(400);
  await shot('parents-voice-diary');

  // 6. A second child on the same device
  await page.mouse.wheel(0, -900);
  await wait(400);
  await byId('add-player').click();
  await wait(1500);
  await onboard('sprout', 'second-player');
  await shot('second-player-home');
  await byId('home-switch-player').click();
  await wait(1200);
  await shot('whos-playing');
  await byId('profile-p1').click();
  await wait(1500);
  await shot('back-to-first-player');

  // 7. Bedtime: pretend the daily budget is used up
  await page.evaluate(() => {
    const raw = localStorage.getItem('ialingo.save.v1');
    if (!raw) return;
    const save = JSON.parse(raw);
    save.screenTime.secondsUsed = 60 * 60 * 5;
    localStorage.setItem('ialingo.save.v1', JSON.stringify(save));
  });
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  await wait(1500);
  if (await visible('[data-testid="profile-p1"]')) {
    await shot('whos-playing-on-launch');
    await byId('profile-p1').click();
  }
  await wait(2500);
  await shot('bedtime');

  console.log('--- problems ---');
  console.log(problems.length ? problems.slice(0, 30).join('\n') : 'none');
  await browser.close();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
