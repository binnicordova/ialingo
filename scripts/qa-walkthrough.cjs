#!/usr/bin/env node
/**
 * QA walkthrough: drives the web build like a child (and a parent) would and
 * saves screenshots as retained evidence.
 *
 * Covers: onboarding, a learn lesson, a story lesson, a speaking lesson
 * (self-check mode, which is what Expo Go and web use), results and
 * celebrations, world/pets/pet room, guides, badges, certificates, the parent
 * gate and dashboard (players, speaking, voice diary), adding a second player,
 * "Who's playing?", and bedtime. v1.2: a sing-along lesson, daily quests and
 * the chest, the Word Gym, the sticker album, and the Play Park games.
 * v1.3: I Spy, Odd One Out, a new world, and any UI language (QA_LANG).
 *
 * Usage: start `npx expo start --web --port 8081`, then
 *   node scripts/qa-walkthrough.cjs [outDir] [scale]
 * Set QA_VIEWPORT=WIDTHxHEIGHT for store screenshot sizes (see store/README.md)
 * and QA_LANG=es|pt|fr|en for the child's language (default es).
 */
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');

const BASE = process.env.QA_BASE_URL || 'http://localhost:8081';
const LANG = process.env.QA_LANG || 'es';
const ENTER_LABEL = { es: 'Entrar', pt: 'Entrar', fr: 'Entrer', en: 'Enter' }[LANG];
const OUT = process.argv[2] || path.join(__dirname, '..', 'production', 'qa', 'evidence', `v1.3-walkthrough-${LANG}`);
const SCALE = Number(process.argv[3] || 1);
const [VIEW_W, VIEW_H] = (process.env.QA_VIEWPORT || '390x844').split('x').map(Number);

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'],
  });
  const context = await browser.newContext({ viewport: { width: VIEW_W, height: VIEW_H }, deviceScaleFactor: SCALE });
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
      if (await visible('[data-testid="song-next"]')) {
        await wait(2500);
        await first('song');
        await byId('song-next').click();
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
    await byId(`lang-${LANG}`).click();
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

  // 3b. v1.2: sing-along, quests, Word Gym, album, Play Park
  await page.goto(`${BASE}/lesson/feelings.song`, { waitUntil: 'networkidle' });
  await wait(1500);
  await playLesson('song');
  await wait(1000);
  await shot('song-results');
  await dismissCelebrations('song');

  await page.goto(`${BASE}/home`, { waitUntil: 'networkidle' });
  await wait(1500);
  await page.mouse.wheel(0, 380);
  await wait(500);
  await shot('home-quests-activities');

  await page.goto(`${BASE}/pet/bubbo`, { waitUntil: 'networkidle' });
  await wait(1500);
  for (let i = 0; i < 2; i += 1) {
    await byId('pet-feed').click();
    await wait(900);
    await dismissCelebrations(i === 1 ? 'feed-quest' : undefined);
  }

  await page.goto(`${BASE}/gym`, { waitUntil: 'networkidle' });
  await wait(1500);
  await shot('word-gym');
  await byId('gym-start').click();
  await wait(1500);
  await playLesson('gym');
  await wait(1000);
  await shot('gym-results');
  await dismissCelebrations('gym');

  await page.goto(`${BASE}/album`, { waitUntil: 'networkidle' });
  await wait(1500);
  await shot('sticker-album');

  await page.goto(`${BASE}/park`, { waitUntil: 'networkidle' });
  await wait(1500);
  await shot('play-park');
  await page.goto(`${BASE}/game/bubble-pop`, { waitUntil: 'networkidle' });
  await wait(1800);
  await shot('bubble-pop');
  for (let i = 0; i < 80; i += 1) {
    if (await visible('[data-testid="game-replay"]')) break;
    const open = page.locator('[data-testid^="bubble-"]:not([aria-disabled="true"])');
    if ((await open.count()) > 0) await open.first().click({ timeout: 800 }).catch(() => undefined);
    await wait(850);
  }
  await wait(800);
  await shot('bubble-pop-results');
  await dismissCelebrations('bubble');

  await page.goto(`${BASE}/game/memory-match`, { waitUntil: 'networkidle' });
  await wait(1500);
  const cardIds = await page
    .locator('[data-testid^="card-"]')
    .evaluateAll((els) => els.map((e) => e.getAttribute('data-testid').replace('card-', '')));
  const wordIds = [...new Set(cardIds.map((id) => id.split('#')[0]))];
  if (wordIds.length >= 2) {
    await byId(`card-${wordIds[0]}#picture`).click();
    await wait(300);
    await byId(`card-${wordIds[1]}#word`).click();
    await wait(400);
    await shot('memory-mismatch');
    await wait(1200);
  }
  for (const id of wordIds) {
    await byId(`card-${id}#picture`).click();
    await wait(250);
    await byId(`card-${id}#word`).click();
    await wait(450);
  }
  await wait(1500);
  await shot('memory-results');
  await dismissCelebrations('memory');

  // v1.3 games: I Spy (find the spoken word) and Odd One Out.
  await page.goto(`${BASE}/game/i-spy`, { waitUntil: 'networkidle' });
  await wait(1800);
  await shot('i-spy');
  for (let i = 0; i < 80; i += 1) {
    if (await visible('[data-testid="game-replay"]')) break;
    const open = page.locator('[data-testid^="spy-"]:not([aria-disabled="true"])');
    if ((await open.count()) > 0) await open.first().click({ timeout: 800 }).catch(() => undefined);
    await wait(850);
  }
  await wait(800);
  await shot('i-spy-results');
  await dismissCelebrations('spy');

  // Odd One Out needs words from two clean categories: one lesson of colors and one of farm animals.
  for (const lessonId of ['colors.learn-1', 'farm.learn-1']) {
    await page.goto(`${BASE}/lesson/${lessonId}`, { waitUntil: 'networkidle' });
    await wait(1500);
    await playLesson(lessonId.replace('.', '-'));
    await wait(800);
    await dismissCelebrations();
  }
  await page.goto(`${BASE}/game/odd-one-out`, { waitUntil: 'networkidle' });
  await wait(1500);
  await shot('odd-one-out');
  let explained = false;
  for (let i = 0; i < 80; i += 1) {
    if (await visible('[data-testid="game-replay"]')) break;
    const open = page.locator('[data-testid^="odd-"]:not([data-testid="odd-why"]):not([aria-disabled="true"])');
    if ((await open.count()) > 0) await open.first().click({ timeout: 800 }).catch(() => undefined);
    await wait(600);
    if (!explained && (await visible('[data-testid="odd-why"]'))) {
      explained = true;
      await shot('odd-one-out-answer');
    }
    if (await visible('[data-testid="odd-why"]')) await wait(1500);
  }
  await wait(800);
  await shot('odd-one-out-results');
  await dismissCelebrations('odd');

  await page.goto(`${BASE}/park`, { waitUntil: 'networkidle' });
  await wait(1500);
  await page.mouse.wheel(0, 400);
  await wait(400);
  await shot('play-park-four-games');

  // A v1.3 world and its sing-along.
  await page.goto(`${BASE}/world/manners`, { waitUntil: 'networkidle' });
  await wait(1500);
  await shot('world-manners');
  await page.goto(`${BASE}/lesson/manners.song`, { waitUntil: 'networkidle' });
  await wait(2000);
  await shot('manners-song');
  await page.goto(`${BASE}/album`, { waitUntil: 'networkidle' });
  await wait(1200);

  await page.goto(`${BASE}/home`, { waitUntil: 'networkidle' });
  await wait(1500);
  await page.mouse.wheel(0, 380);
  await wait(500);
  await shot('home-quests-after');
  if (await visible('[data-testid="quest-chest"]:not([aria-disabled="true"])')) {
    await byId('quest-chest').click();
    await wait(900);
    await dismissCelebrations('chest');
  }

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
    await page.locator(`[aria-label="${ENTER_LABEL}"]`).first().click();
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
