import { useAtomValue } from 'jotai';
import { useCallback, useEffect, useRef } from 'react';
import { AccessibilityInfo, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withTiming, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { Character } from '@/domain/characters/character';
import { LESSON_FEEL, type LessonMoment } from '@/domain/learning/lesson-session';
import { activePetAccessoryAtom, activePetAtom } from '@/state/selectors';

import { CharacterAvatar } from '../art/CharacterAvatar';
import { useCalm } from '../hooks/use-calm';
import { useSpeak } from '../hooks/use-speak';
import { useT } from '../i18n/use-t';
import { momentSky } from '../three/moment-scene';
import { MomentStage3D } from '../three/MomentStage3D';
import { colors, radii, spacing } from '../theme/tokens';
import { SpeechBubble } from './game';
import { AppText, BigButton } from './ui';

const LEAVE_MS = 180;

/**
 * Full-screen moment between two exercises, starring the child's own 3D pet:
 * a cheer every few answers in a row (moves on by itself) and a calm
 * "let's try again" before the second tries (waits for a tap).
 */
export function PetMoment({
  moment,
  worldColor,
  guide,
  onDone,
}: {
  moment: LessonMoment;
  worldColor: string;
  guide?: Character;
  onDone: () => void;
}) {
  const { t } = useT();
  const insets = useSafeAreaInsets();
  const pet = useAtomValue(activePetAtom);
  const accessory = useAtomValue(activePetAccessoryAtom);
  const calm = useCalm();
  const { characterEnglish, native, stop } = useSpeak();
  const done = useRef(false);
  const fade = useSharedValue(1);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Fade out first, then unmount: the GL view is never torn down mid-animation.
  const finish = useCallback(() => {
    if (done.current) return;
    done.current = true;
    stop();
    if (calm) {
      onDone();
      return;
    }
    fade.set(withTiming(0, { duration: LEAVE_MS }));
    leaveTimer.current = setTimeout(onDone, LEAVE_MS + 20);
  }, [onDone, stop, calm, fade]);
  useEffect(() => () => {
    if (leaveTimer.current) clearTimeout(leaveTimer.current);
  }, []);
  const fadeStyle = useAnimatedStyle(() => ({ opacity: fade.value }));

  const cheer = moment.kind === 'in-a-row';
  const count = moment.kind === 'in-a-row' ? moment.count : 0;
  const title = cheer ? t('inARow', { n: count }) : t('secondTryTitle');
  const subtitle = cheer ? t('inARowPet', { name: pet?.pet.nickname ?? '' }) : t('secondTryBody');
  const sky = momentSky(cheer ? worldColor : colors.sky);

  useEffect(() => {
    AccessibilityInfo.announceForAccessibility(`${title}. ${subtitle}`);
    // Cheers say the number in English (a free listening moment); retries are explained in the child's language.
    if (cheer) characterEnglish(`${count} in a row!`, guide);
    else native(`${title} ${subtitle}`, guide);
    if (!cheer) return;
    const timer = setTimeout(finish, LESSON_FEEL.inARowMomentSeconds * 1000);
    return () => clearTimeout(timer);
  }, [cheer, count, title, subtitle, guide, characterEnglish, native, finish]);

  return (
    <Animated.View
      entering={calm ? undefined : FadeIn.duration(160)}
      style={[styles.backdrop, { backgroundColor: sky[0] }, fadeStyle]}
      accessibilityViewIsModal
    >
      {pet ? (
        <MomentStage3D
          blueprint={pet.species.blueprint}
          stage={pet.stage}
          accessory={accessory}
          moment={cheer ? 'cheer' : 'peek'}
          sky={sky}
          style={StyleSheet.absoluteFill}
        />
      ) : null}
      <Pressable
        testID="moment-skip"
        style={StyleSheet.absoluteFill}
        accessibilityRole="button"
        accessibilityLabel={t('continue')}
        onPress={cheer ? finish : undefined}
      />
      <View style={[styles.copy, { paddingTop: insets.top + spacing.xxl }]} pointerEvents="none">
        {cheer ? (
          <>
            <Animated.View entering={ZoomIn.springify().damping(10).delay(calm ? 0 : 150)}>
              <AppText variant="hero" center color="#FFFFFF" style={styles.cheerTitle}>
                ⭐ {title}
              </AppText>
            </Animated.View>
            <Animated.View entering={FadeIn.delay(calm ? 0 : 400)}>
              <AppText variant="heading" center color="#FFFFFF" style={styles.shadowText}>
                {subtitle}
              </AppText>
            </Animated.View>
          </>
        ) : (
          <View style={styles.peekRow}>
            {guide ? <CharacterAvatar look={guide.look} size={84} talking /> : null}
            <SpeechBubble style={styles.bubble}>
              <AppText variant="heading">{title}</AppText>
              <AppText variant="body" color={colors.inkSoft}>
                {subtitle}
              </AppText>
            </SpeechBubble>
          </View>
        )}
      </View>
      {!cheer ? (
        <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.lg }]}>
          <BigButton label={t('continue')} tone="success" onPress={finish} testID="moment-continue" />
        </View>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 20 },
  copy: { paddingHorizontal: spacing.xl, gap: spacing.sm },
  cheerTitle: { fontSize: 44, lineHeight: 52, textShadowColor: 'rgba(45,42,74,0.35)', textShadowOffset: { width: 0, height: 3 }, textShadowRadius: 6 },
  shadowText: { textShadowColor: 'rgba(45,42,74,0.35)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 },
  peekRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  bubble: { flex: 1, borderRadius: radii.lg },
  footer: { position: 'absolute', left: spacing.lg, right: spacing.lg, bottom: 0 },
});
