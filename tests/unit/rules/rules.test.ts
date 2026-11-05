import { credit, debit, ECONOMY_TUNING, lessonReward } from '@/domain/economy/economy';
import { createInitialGameState } from '@/domain/game/game-state';
import { restoreGameState } from '@/domain/game/snapshot';
import { createGateChallenge, gateAnswer, GATE_TUNING, verifyGate } from '@/domain/parental/gate';
import { createRng, hashSeed } from '@/domain/shared/rng';
import { daysBetween, toDayKey } from '@/domain/shared/day';
import {
  addUsage,
  grantExtraTime,
  isLimitReached,
  secondsLeft,
} from '@/domain/wellbeing/screen-time';
import { TODAY, TOMORROW } from '../../helpers/fixtures';

describe('economy', () => {
  it('pays more for more stars, perfect runs and bosses', () => {
    const one = lessonReward('learn', 1, false);
    const three = lessonReward('learn', 3, true);
    const boss = lessonReward('boss', 3, true);
    expect(three.berries).toBeGreaterThan(one.berries);
    expect(boss.berries - three.berries).toBe(ECONOMY_TUNING.bossBonusBerries);
    expect(boss.xp).toBeGreaterThan(three.xp);
  });

  it('applies the happiness xp multiplier', () => {
    expect(lessonReward('learn', 3, false, 1.2).xp).toBe(Math.round(lessonReward('learn', 3, false).xp * 1.2));
  });

  it('never lets the wallet go negative', () => {
    expect(debit({ berries: 5 }, 6)).toEqual({ ok: false, reason: 'insufficient-berries' });
    expect(debit(credit({ berries: 5 }, 1), 6)).toEqual({ ok: true, wallet: { berries: 0 } });
  });
});

describe('screen time', () => {
  it('counts usage, grants extra time and resets on a new day', () => {
    let s = addUsage({ day: TODAY, secondsUsed: 0, bonusMinutes: 0 }, 600, TODAY);
    expect(isLimitReached(s, 10, TODAY)).toBe(true);
    s = grantExtraTime(s, 10, TODAY);
    expect(secondsLeft(s, 10, TODAY)).toBe(600);
    expect(isLimitReached(s, 10, TOMORROW)).toBe(false);
    expect(secondsLeft(s, null, TODAY)).toBeNull();
  });
});

describe('parental gate', () => {
  it('asks a multiplication in the adult range and checks it', () => {
    const rng = createRng(1);
    for (let i = 0; i < 50; i += 1) {
      const c = createGateChallenge(rng);
      expect(c.a).toBeGreaterThanOrEqual(GATE_TUNING.minFactor);
      expect(c.b).toBeLessThanOrEqual(GATE_TUNING.maxFactor);
      expect(verifyGate(c, String(gateAnswer(c)))).toBe(true);
      expect(verifyGate(c, String(gateAnswer(c) + 1))).toBe(false);
    }
    expect(verifyGate({ a: 7, b: 8 }, ' 56 ')).toBe(true);
    expect(verifyGate({ a: 7, b: 8 }, '')).toBe(false);
  });
});

describe('shared helpers', () => {
  it('rng is deterministic and shuffle keeps every item', () => {
    const a = createRng(hashSeed('lesson-1'));
    const b = createRng(hashSeed('lesson-1'));
    expect(a.shuffle([1, 2, 3, 4, 5])).toEqual(b.shuffle([1, 2, 3, 4, 5]));
    expect(createRng(9).shuffle([1, 2, 3, 4, 5]).sort()).toEqual([1, 2, 3, 4, 5]);
  });

  it('days are local calendar days', () => {
    expect(toDayKey(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
    expect(daysBetween('2026-02-27', '2026-03-02')).toBe(3);
  });
});

describe('save snapshot', () => {
  it('round-trips a saved game through JSON', () => {
    const state = createInitialGameState(TODAY, 'pt');
    const restored = restoreGameState(JSON.parse(JSON.stringify(state)), TODAY, 'es');
    expect(restored).toEqual(state);
  });

  it('rejects garbage and unknown versions instead of crashing', () => {
    expect(restoreGameState(null, TODAY, 'es')).toBeNull();
    expect(restoreGameState('oops', TODAY, 'es')).toBeNull();
    expect(restoreGameState({ schemaVersion: 999 }, TODAY, 'es')).toBeNull();
  });

  it('repairs invalid fields with defaults', () => {
    const restored = restoreGameState(
      {
        schemaVersion: 1,
        onboarded: true,
        settings: { uiLocale: 'xx', dailyLimitMinutes: 'lots' },
        wallet: { berries: -50 },
        pets: { owned: { bubbo: { nickname: 42, xp: 'a lot' } }, activeSpeciesId: 'ghost' },
      },
      TODAY,
      'es',
    );
    expect(restored?.settings.uiLocale).toBe('es');
    expect(restored?.settings.dailyLimitMinutes).toBe(30);
    expect(restored?.wallet.berries).toBe(0);
    expect(restored?.pets.owned.bubbo?.xp).toBe(0);
    expect(restored?.pets.activeSpeciesId).toBe('bubbo');
    expect(restored?.onboarded).toBe(true);
  });
});
