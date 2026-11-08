import { router } from 'expo-router';
import { useAtomValue, useSetAtom } from 'jotai';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { playSfxAtom } from '@/state/actions';
import { celebrationsHeldAtom, contentAtom } from '@/state/core';
import type { ActiveLesson } from '@/state/lesson';
import { activePetAccessoryAtom, activePetAtom, canRecordPostcardAtom } from '@/state/selectors';

import { EmojiArt } from '../art/EmojiArt';
import { PetPortrait } from '../art/PetPortrait';
import { AppText, BigButton, ProgressBar, Screen } from '../components/ui';
import { useCalm } from '../hooks/use-calm';
import { useSpeak } from '../hooks/use-speak';
import { useT } from '../i18n/use-t';
import { momentSky } from '../three/moment-scene';
import { MomentStage3D, type MomentStageHandle } from '../three/MomentStage3D';
import { colors, radii, shade, shadow, spacing } from '../theme/tokens';

/** Counts from 0 up to `to` once mounted (about 0.7 s, after `delay`). */
function CountUp({ to, delay, prefix = '', suffix = '' }: { to: number; delay: number; prefix?: string; suffix?: string }) {
  const calm = useCalm();
  const [value, setValue] = useState(calm ? to : 0);
  useEffect(() => {
    if (calm) return;
    let frame = 0;
    let start = 0;
    const tick = (now: number) => {
      if (!start) start = now;
      const p = Math.min(1, (now - start) / 700);
      setValue(Math.round(to * (1 - Math.pow(1 - p, 3))));
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    const timer = setTimeout(() => {
      frame = requestAnimationFrame(tick);
    }, delay);
    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(frame);
    };
  }, [to, delay, calm]);
  return (
    <AppText variant="title" center>
      {prefix}
      {value}
      {suffix}
    </AppText>
  );
}

function StatCard({
  emoji,
  label,
  children,
  color,
  delay,
}: {
  emoji: string;
  label: string;
  children: ReactNode;
  color: string;
  delay: number;
}) {
  const calm = useCalm();
  return (
    <Animated.View
      entering={calm ? undefined : FadeInUp.delay(delay).springify().damping(14)}
      style={[styles.stat, shadow, { borderColor: color }]}
    >
      <View style={[styles.statLabel, { backgroundColor: color }]}>
        <AppText variant="tiny" color="#FFFFFF" center numberOfLines={1} style={styles.statLabelText}>
          {label}
        </AppText>
      </View>
      <EmojiArt emoji={emoji} size={30} style={styles.statEmoji} />
      {children}
    </Animated.View>
  );
}

const STAR_DELAY_MS = 550;
const STAR_STEP_MS = 320;

/**
 * The end of a lesson: the pet celebrates in 3D, the stars land one by one
 * and the numbers count up. Other celebrations (level-ups, eggs, badges) are
 * held until this intro has played.
 */
export function LessonResults({ active, onReplay }: { active: ActiveLesson; onReplay: () => void }) {
  const { t, l } = useT();
  const insets = useSafeAreaInsets();
  const calm = useCalm();
  const pet = useAtomValue(activePetAtom);
  const accessory = useAtomValue(activePetAccessoryAtom);
  const content = useAtomValue(contentAtom);
  const sfx = useSetAtom(playSfxAtom);
  const holdCelebrations = useSetAtom(celebrationsHeldAtom);
  const { characterEnglish } = useSpeak();
  const stageRef = useRef<MomentStageHandle>(null);
  const offerPostcard = useAtomValue(canRecordPostcardAtom);
  const summary = active.summary;
  const world = content.world(active.lesson.plan.worldId);
  const guide = world ? content.character(world.guideId) : undefined;
  const stars = summary?.stars ?? 1;

  useEffect(() => {
    characterEnglish(summary?.perfect ? 'Perfect! You are amazing!' : 'Great job! Well done!', guide);
    // Each earned star lands with a pop.
    const timers = Array.from({ length: stars }, (_, i) =>
      setTimeout(() => sfx('pop'), STAR_DELAY_MS + i * STAR_STEP_MS + 120),
    );
    return () => timers.forEach(clearTimeout);
  }, [characterEnglish, guide, summary?.perfect, stars, sfx]);

  const jump = summary?.jump ?? null;
  const jumpWorld = jump ? content.world(jump.worldId) : undefined;
  const headline =
    jump?.passed && jumpWorld
      ? t('jumpPassed', { world: l(jumpWorld.title) })
      : summary?.perfect
        ? t('perfectLesson')
        : stars === 3
          ? t('resultsAmazing')
          : stars === 2
            ? t('resultsSuper')
            : t('resultsWellDone');
  // A jump that did not open the world: praise the try and say it can be tried again (no fail state).
  const note = jump && !jump.passed ? t('jumpTryAgain') : null;
  const sky = momentSky(world?.color ?? colors.primary);
  const statsDelay = STAR_DELAY_MS + 3 * STAR_STEP_MS;

  // Level-ups, eggs and badges wait until the stars and numbers have landed.
  useEffect(() => {
    holdCelebrations(true);
    const timer = setTimeout(() => holdCelebrations(false), calm ? 300 : statsDelay + 1300);
    return () => {
      clearTimeout(timer);
      holdCelebrations(false);
    };
  }, [holdCelebrations, calm, statsDelay]);

  return (
    <Screen background={colors.backgroundWarm} padded={false}>
      <ScrollView contentContainerStyle={[styles.results, { paddingBottom: insets.bottom + spacing.lg }]} bounces={false}>
        <View style={[styles.hero, { paddingTop: insets.top }]}>
          {pet ? (
            <MomentStage3D
              ref={stageRef}
              blueprint={pet.species.blueprint}
              stage={pet.stage}
              accessory={accessory}
              moment="victory"
              sky={sky}
              style={StyleSheet.absoluteFill}
              onTap={() => {
                sfx('pop');
                stageRef.current?.cheer();
              }}
              accessibilityLabel={pet.pet.nickname}
            />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: sky[0] }]} />
          )}
          <Animated.View entering={calm ? undefined : ZoomIn.delay(250).springify().damping(10)} pointerEvents="none">
            <AppText variant="hero" center color="#FFFFFF" style={styles.heroTitle}>
              {headline}
            </AppText>
            {note ? (
              <AppText variant="heading" center color="#FFFFFF" style={styles.heroNote}>
                {note}
              </AppText>
            ) : null}
          </Animated.View>
        </View>

        <View style={styles.starRow} accessible accessibilityLabel={`${stars} / 3 ★`}>
          {[0, 1, 2].map((i) => (
            <Animated.View
              key={i}
              entering={calm ? undefined : ZoomIn.delay(STAR_DELAY_MS + i * STAR_STEP_MS).springify().damping(7)}
              style={[styles.starSlot, i === 1 && styles.starMiddle]}
            >
              <EmojiArt emoji="⭐" size={i === 1 ? 62 : 46} style={{ opacity: i < stars ? 1 : 0.22 }} />
            </Animated.View>
          ))}
        </View>

        <View style={styles.stats}>
          <StatCard emoji="🍓" label={t('statBerries')} color={colors.berry} delay={statsDelay}>
            <CountUp to={summary?.berries ?? 0} prefix="+" delay={statsDelay + 150} />
          </StatCard>
          <StatCard emoji="🎯" label={t('statFirstTry')} color={colors.success} delay={statsDelay + 120}>
            <CountUp to={summary?.correctFirstTry ?? 0} suffix={` / ${summary?.scoredTotal ?? 0}`} delay={statsDelay + 270} />
          </StatCard>
          <StatCard emoji="📚" label={t('statWords')} color={colors.sky} delay={statsDelay + 240}>
            <CountUp to={summary?.wordsPracticed ?? 0} delay={statsDelay + 390} />
          </StatCard>
        </View>

        {pet ? (
          <Animated.View entering={calm ? undefined : FadeInDown.delay(statsDelay + 450)} style={styles.xpBlock}>
            <View style={styles.xpRow}>
              <PetPortrait blueprint={pet.species.blueprint} stage={pet.stage} size={44} mood="wow" />
              <View style={styles.xpText}>
                <AppText variant="small" color={colors.primary}>
                  {t('earnedXp', { n: summary?.xp ?? 0, name: pet.pet.nickname })}
                </AppText>
                <ProgressBar value={pet.isMaxLevel ? 1 : pet.xpInLevel / pet.xpNeeded} color={colors.primary} />
              </View>
              <AppText variant="small" color={colors.inkSoft}>
                {t('level', { n: pet.level })}
              </AppText>
            </View>
          </Animated.View>
        ) : null}

        <View style={styles.resultButtons}>
          {offerPostcard ? (
            <BigButton
              label={t('postcardOffer')}
              icon="💌"
              tone="orange"
              compact
              onPress={() => router.replace('/postcard')}
              testID="results-postcard"
            />
          ) : null}
          <BigButton label={t('continue')} tone="success" onPress={() => router.back()} testID="results-continue" />
          {jump?.passed ? null : (
            <BigButton label={t('playAgain')} tone="neutral" compact icon="🔁" onPress={onReplay} />
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  results: { flexGrow: 1, gap: spacing.lg, alignItems: 'stretch' },
  hero: {
    height: 360,
    justifyContent: 'flex-start',
    paddingHorizontal: spacing.xl,
    borderBottomLeftRadius: radii.xl,
    borderBottomRightRadius: radii.xl,
    overflow: 'hidden',
  },
  heroNote: { textShadowColor: 'rgba(45,42,74,0.35)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 },
  heroTitle: {
    marginTop: spacing.lg,
    textShadowColor: 'rgba(45,42,74,0.35)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 6,
  },
  starRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end', gap: spacing.md, marginTop: -52 },
  starSlot: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 5,
    borderBottomColor: shade(colors.border, 0.1),
  },
  starMiddle: { width: 92, height: 92, borderRadius: 46, marginBottom: 10 },
  stats: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg },
  stat: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 3,
    paddingBottom: spacing.sm,
    overflow: 'hidden',
    gap: 2,
  },
  statLabel: { alignSelf: 'stretch', paddingVertical: 3, paddingHorizontal: spacing.xs },
  statLabelText: { fontFamily: 'Fredoka_700Bold', letterSpacing: 0.4, textTransform: 'uppercase' },
  statEmoji: { marginTop: spacing.xs },
  xpBlock: { marginHorizontal: spacing.lg, backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing.md },
  xpRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  xpText: { flex: 1, gap: spacing.xs },
  resultButtons: { gap: spacing.sm, paddingHorizontal: spacing.lg, marginTop: 'auto' },
});
